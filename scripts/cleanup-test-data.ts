/**
 * Dọn dữ liệu kiểm thử (E2E/integration) khỏi database development.
 *
 * - Xóa đơn test (email `e2e-*@example.com`, `integration-*@example.com` hoặc mã trong danh sách),
 *   khôi tồn kho theo delta của InventoryTransaction liên quan, xóa invoice/email/audit liên quan.
 * - Xóa tài khoản nhân sự test `e2e-staff-*` kèm session/role/cart/wishlist/audit.
 * - Đưa PaymentSetting về mặc định: COD bật, ngân hàng tắt, tài khoản trống.
 *
 * KHÔNG chạy trên database production. Dùng DRY_RUN=1 để chỉ in ra số lượng sẽ xóa.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === "1";

const EXTRA_ORDER_CODES = [
  "BN2611048073", "BN2611043092", "BN2611042470", "BN2611049446",
  "BN2611045598", "BN2611045700", "BN2611098947", "BN2611095688",
  "BN2611043452",
];

const TEST_USER_EMAIL_PREFIXES = ["e2e-staff-", "e2e-", "integration-"];
const TEST_ORDER_EMAIL_PREFIXES = ["e2e-", "integration-"];
const METADATA_TEST_MARKERS = ["e2e-", "integration-", "TAI KHOAN KIEM THU"];

function isTestUserEmail(email: string) {
  return TEST_USER_EMAIL_PREFIXES.some((prefix) => email.startsWith(prefix));
}

async function main() {
  // 1. Đơn test: theo pattern email hoặc danh sách mã.
  const allOrders = await prisma.order.findMany({
    select: { id: true, orderCode: true, customerEmail: true, status: true },
  });
  const orders = allOrders.filter(
    (o) => TEST_ORDER_EMAIL_PREFIXES.some((prefix) => o.customerEmail.startsWith(prefix)) || EXTRA_ORDER_CODES.includes(o.orderCode),
  );
  const orderIds = new Set(orders.map((o) => o.id));
  const orderCodes = new Set(orders.map((o) => o.orderCode));
  console.log(`Đơn test sẽ xóa (${orders.length}):`);
  for (const o of orders) console.log(`  - ${o.orderCode} ${o.customerEmail} [${o.status}]`);
  const kept = allOrders.filter((o) => !orderIds.has(o.id));
  for (const o of kept) console.log(`  Giữ lại: ${o.orderCode} ${o.customerEmail} [${o.status}]`);

  // 2. Khôi tồn kho theo delta của giao dịch gắn đơn test rồi xóa ledger.
  const txs = await prisma.inventoryTransaction.findMany({
    select: { id: true, variantId: true, quantity: true, reference: true },
  });
  const targetTxs = txs.filter(
    (t) => (t.reference && (orderCodes.has(t.reference) || t.reference.startsWith("integration-") || t.reference.startsWith("e2e-"))) ?? false,
  );
  const deltaByVariant = new Map<string, number>();
  for (const t of targetTxs) deltaByVariant.set(t.variantId, (deltaByVariant.get(t.variantId) ?? 0) + t.quantity);
  console.log(`InventoryTransaction sẽ xóa: ${targetTxs.length}; biến thể khôi tồn: ${deltaByVariant.size}`);
  if (!DRY_RUN) {
    for (const [variantId, delta] of deltaByVariant) {
      await prisma.inventory.update({ where: { variantId }, data: { quantity: { decrement: delta } } });
    }
    await prisma.inventoryTransaction.deleteMany({ where: { id: { in: targetTxs.map((t) => t.id) } } });
  }

  // 3. Review gắn đơn test rồi Invoice (Restrict) trước khi xóa Order.
  const reviews = await prisma.review.count({ where: { orderId: { in: [...orderIds] } } });
  console.log(`Review gắn đơn test: ${reviews}`);
  if (!DRY_RUN && orderIds.size) await prisma.review.deleteMany({ where: { orderId: { in: [...orderIds] } } });

  const invoices = await prisma.invoice.findMany({ where: { orderId: { in: [...orderIds] } }, select: { id: true, invoiceNumber: true } });
  console.log(`Invoice sẽ xóa: ${invoices.length} (${invoices.map((i) => i.invoiceNumber).join(", ") || "none"})`);
  const invoiceIds = new Set(invoices.map((i) => i.id));
  if (!DRY_RUN && orderIds.size) await prisma.invoice.deleteMany({ where: { orderId: { in: [...orderIds] } } });

  // 4. Xóa đơn (cascade: OrderItem, OrderStatusHistory, PaymentTransaction, CouponRedemption).
  if (!DRY_RUN && orderIds.size) await prisma.order.deleteMany({ where: { id: { in: [...orderIds] } } });

  // 5. EmailLog test: người nhận theo pattern hoặc nội dung gắn mã đơn test.
  const emailLogs = await prisma.emailLog.findMany({ select: { id: true, recipient: true, dedupeKey: true, subject: true } });
  const targetEmails = emailLogs.filter((e) => {
    const haystack = `${e.recipient} ${e.dedupeKey} ${e.subject}`;
    return TEST_ORDER_EMAIL_PREFIXES.some((prefix) => e.recipient.startsWith(prefix)) || [...orderCodes].some((c) => haystack.includes(c));
  });
  console.log(`EmailLog sẽ xóa: ${targetEmails.length}`);
  if (!DRY_RUN && targetEmails.length) await prisma.emailLog.deleteMany({ where: { id: { in: targetEmails.map((e) => e.id) } } });

  // 6. Tài khoản test + dữ liệu liên quan.
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const testUsers = users.filter((u) => isTestUserEmail(u.email));
  const userIds = new Set(testUsers.map((u) => u.id));
  console.log(`Tài khoản test sẽ xóa (${testUsers.length}): ${testUsers.map((u) => u.email).join(", ") || "none"}`);
  if (!DRY_RUN && userIds.size) {
    await prisma.session.deleteMany({ where: { userId: { in: [...userIds] } } });
    await prisma.userRole.deleteMany({ where: { userId: { in: [...userIds] } } });
    await prisma.cartItem.deleteMany({ where: { cart: { userId: { in: [...userIds] } } } });
    await prisma.cart.deleteMany({ where: { userId: { in: [...userIds] } } });
    await prisma.wishlist.deleteMany({ where: { userId: { in: [...userIds] } } });
    await prisma.review.deleteMany({ where: { userId: { in: [...userIds] } } });
    await prisma.loyaltyPoint.deleteMany({ where: { userId: { in: [...userIds] } } });
    await prisma.notification.deleteMany({ where: { userId: { in: [...userIds] } } });
    await prisma.passwordResetToken.deleteMany({ where: { email: { in: testUsers.map((u) => u.email) } } });
    await prisma.user.deleteMany({ where: { id: { in: [...userIds] } } });
  }

  // 7. Audit test: actor test, entity là dữ liệu đã xóa, metadata chứa marker test,
  //    audit mồ côi Order/Invoice (entity không còn tồn tại), category test đã bị xóa,
  //    hoặc log thay đổi payment settings từ test.
  const categoryIds = new Set((await prisma.category.findMany({ select: { id: true } })).map((c) => c.id));
  const existingOrderIds = new Set((await prisma.order.findMany({ select: { id: true } })).map((o) => o.id));
  const existingInvoiceIds = new Set((await prisma.invoice.findMany({ select: { id: true } })).map((i) => i.id));
  const audits = await prisma.adminAuditLog.findMany({
    select: { id: true, actorId: true, action: true, entityType: true, entityId: true, metadata: true },
  });
  const targetAudits = audits.filter((a) => {
    if (a.actorId && userIds.has(a.actorId)) return true;
    if (a.entityId && (orderIds.has(a.entityId) || orderCodes.has(a.entityId) || invoiceIds.has(a.entityId) || userIds.has(a.entityId))) return true;
    if (a.entityId && (a.entityType === "Order" || a.entityType === "Invoice") && !existingOrderIds.has(a.entityId) && !existingInvoiceIds.has(a.entityId)) return true;
    const text = JSON.stringify(a.metadata ?? "");
    if (METADATA_TEST_MARKERS.some((m) => text.includes(m))) return true;
    if ([...orderCodes].some((c) => text.includes(c))) return true;
    if (a.action === "PAYMENT_SETTINGS_UPDATE") return true;
    if (a.action.startsWith("CATEGORY_") && a.entityId && !categoryIds.has(a.entityId)) return true;
    return false;
  });
  console.log(`AdminAuditLog sẽ xóa: ${targetAudits.length}`);
  if (!DRY_RUN && targetAudits.length) await prisma.adminAuditLog.deleteMany({ where: { id: { in: targetAudits.map((a) => a.id) } } });

  // 8. PaymentSetting về mặc định.
  console.log("PaymentSetting: đưa về mặc định (COD bật, ngân hàng tắt, tài khoản trống)");
  if (!DRY_RUN) {
    await prisma.paymentSetting.update({
      where: { id: "default" },
      data: {
        codEnabled: true, bankEnabled: false,
        bankName: "", bankCode: "", bankBin: "", accountNumber: "", accountName: "",
        branch: null, qrImageUrl: null,
        instructions: "Vui lòng chuyển đúng số tiền và ghi mã đơn hàng vào nội dung chuyển khoản. Giao dịch chỉ được ghi nhận sau khi cửa hàng đối chiếu thực tế.",
      },
    });
  }

  // 9. Liên hệ/newsletter từ test (nếu có).
  const contacts = await prisma.contactMessage.findMany({ select: { id: true, email: true } });
  const newsletters = await prisma.newsletterSubscriber.findMany({ select: { id: true, email: true } });
  const targetContacts = contacts.filter((c) => TEST_ORDER_EMAIL_PREFIXES.some((p) => c.email.startsWith(p)));
  const targetNewsletters = newsletters.filter((n) => TEST_ORDER_EMAIL_PREFIXES.some((p) => n.email.startsWith(p)));
  console.log(`ContactMessage test: ${targetContacts.length}; NewsletterSubscriber test: ${targetNewsletters.length}`);
  if (!DRY_RUN) {
    if (targetContacts.length) await prisma.contactMessage.deleteMany({ where: { id: { in: targetContacts.map((c) => c.id) } } });
    if (targetNewsletters.length) await prisma.newsletterSubscriber.deleteMany({ where: { id: { in: targetNewsletters.map((n) => n.id) } } });
  }

  console.log(DRY_RUN ? "DRY_RUN hoàn tất — chưa xóa gì." : "Cleanup hoàn tất.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
