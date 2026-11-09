import { test, expect } from "@playwright/test";

async function loginAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByPlaceholder("ban@email.vn").fill("admin@beanora.vn");
  await page.getByPlaceholder("Mật khẩu của bạn").fill("Beanora@2026");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL(/\/admin/);
}

test.afterEach(async ({ request }) => {
  // API login yêu cầu trường "identifier" (không phải "email"); assert status để reset không lỗi ngầm.
  const login = await request.post("/api/auth/login", { data: { identifier: "admin@beanora.vn", password: "Beanora@2026" } });
  expect(login.ok(), `afterEach login thất bại: ${login.status()} ${await login.text()}`).toBeTruthy();
  const reset = await request.put("/api/admin/settings/payment", { data: {
    codEnabled: true, bankEnabled: false, bankName: "", bankCode: "", bankBin: "", accountNumber: "", accountName: "",
    branch: null, qrImageUrl: null, instructions: "Vui lòng chuyển đúng số tiền và ghi mã đơn hàng vào nội dung chuyển khoản. Giao dịch chỉ được ghi nhận sau khi cửa hàng đối chiếu thực tế.",
    paymentTimeoutMinutes: 1440, shippingFee: 30000, freeShippingFrom: 1000000,
  } });
  expect(reset.ok(), `afterEach reset payment settings thất bại: ${reset.status()} ${await reset.text()}`).toBeTruthy();
});

test("chuyển khoản tạo QR động, báo chuyển khoản không tự PAID và Admin đối chiếu", async ({ page }) => {
  await loginAdmin(page);
  await page.goto("/admin/settings");
  const settingsForm = page.locator(".payment-settings-layout").last();
  const bankToggle = settingsForm.locator(".setting-toggle-row").nth(1).locator(".admin-toggle");
  if (!(await bankToggle.getAttribute("class"))?.includes("on")) await bankToggle.click();
  await settingsForm.locator("select").first().selectOption("970436");
  await settingsForm.getByPlaceholder("Nhập số tài khoản thật").fill("0123456789");
  await settingsForm.getByPlaceholder("NGUYEN VAN A").fill("TAI KHOAN KIEM THU E2E");
  await settingsForm.getByRole("button", { name: "Lưu cấu hình" }).click();
  await expect(settingsForm.locator(".admin-notice")).toContainText("Đã lưu cấu hình");
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await page.waitForURL(/\/login/);

  await page.goto("/product/ca-phe-robusta-buon-ma-thuot");
  await page.locator(".detail-buy").getByRole("button", { name: "Thêm vào giỏ", exact: true }).click();
  await expect(page.locator(".cart-drawer")).toHaveClass(/is-open/);
  await page.goto("/checkout");
  const phone = `09${Math.floor(10000000 + Math.random() * 89999999)}`;
  await page.getByPlaceholder("Nguyễn Ngọc Anh").fill("Khách Chuyển Khoản E2E");
  await page.getByPlaceholder("0901 234 567").fill(phone);
  await page.getByPlaceholder("ban@email.vn").fill(`e2e-bank-${Date.now()}@example.com`);
  await page.getByRole("button", { name: /Tiếp tục đến địa chỉ/ }).click();
  await page.getByPlaceholder("Ví dụ: Đồng Nai").fill("Đồng Nai");
  await page.getByPlaceholder("Ví dụ: Trảng Dài").fill("Trảng Dài");
  await page.getByPlaceholder("Số nhà, đường, khu phố").fill("99 Đường Kiểm Thử Ngân Hàng");
  await page.getByRole("button", { name: /Kiểm tra đơn hàng/ }).click();
  await page.getByText("Chuyển khoản ngân hàng / VietQR", { exact: true }).click();
  await page.getByRole("button", { name: /Xác nhận đặt hàng/ }).click();
  await page.waitForURL(/\/order\/BN/);
  const orderCode = page.url().match(/\/order\/([^?]+)/)?.[1] || "";

  const orderPage = page.locator(".order-page").last();
  const qr = orderPage.getByAltText(`Mã QR thanh toán đơn ${orderCode}`);
  await expect(qr).toBeVisible();
  expect(await qr.getAttribute("src")).toMatch(/^data:image\/png;base64,/);
  await expect(orderPage.locator(".bank-details")).toContainText(orderCode);
  await expect(orderPage.locator(".bank-details")).toContainText("0123456789");
  await expect(orderPage.locator(".order-layout > .order-sidebar")).toContainText("Chờ chuyển khoản");
  await orderPage.getByRole("button", { name: "Tôi đã chuyển khoản" }).click();
  await expect(orderPage.locator(".verifying-note")).toContainText("đang chờ Beanora đối chiếu");
  await expect(orderPage.locator(".order-layout > .order-sidebar")).not.toContainText("Đã thanh toán");

  await loginAdmin(page);
  await page.goto("/admin/orders");
  const row = page.locator("tr", { hasText: orderCode });
  await expect(row).toContainText("Chờ xác nhận thanh toán");
  page.once("dialog", (dialog) => dialog.accept());
  await row.locator(".verify-buttons").getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.locator(".admin-notice")).toContainText("Đã xác nhận thanh toán");
  await page.reload();
  await expect(page.locator("tr", { hasText: orderCode })).toContainText("Đã thanh toán");
  await expect(page.locator("tr", { hasText: orderCode })).toContainText("HD-");
  await page.goto(`/order/${orderCode}`);
  await expect(page.locator(".order-page").last().locator(".order-layout > .order-sidebar")).toContainText("Đã thanh toán");
  await expect(page.locator(".order-page").last().locator(".order-layout > .order-sidebar")).toContainText("Xem hóa đơn");
  console.log(`E2E_BANK_ORDER=${orderCode};PHONE=${phone}`);
});
