import { test, expect } from "@playwright/test";

test("khách mua COD, tra cứu và admin tạo hóa đơn", async ({ page }) => {
  const phone = `09${Math.floor(10000000 + Math.random() * 89999999)}`;
  const email = `e2e-${Date.now()}@example.com`;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/product/combo-kham-pha-beanora");
  await expect(page.getByRole("heading", { name: "Combo Khám Phá Beanora", exact: true })).toBeVisible();
  await page.locator(".detail-buy").getByRole("button", { name: "Thêm vào giỏ", exact: true }).click();
  await expect(page.locator(".cart-drawer")).toHaveClass(/is-open/);
  await expect(page.locator(".cart-drawer")).toContainText("Combo Khám Phá Beanora");

  await page.reload();
  await expect(page.locator(".cart-action b")).toHaveText("1");
  await page.goto("/checkout");
  await expect(page.locator(".checkout-summary")).toContainText("Combo Khám Phá Beanora");
  await page.getByPlaceholder("Nhập mã ưu đãi").fill("BEANORA10");
  await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
  await expect(page.locator(".coupon-box")).toContainText("Đã áp dụng mã");

  await page.getByPlaceholder("Nguyễn Ngọc Anh").fill("Khách Kiểm Thử E2E");
  await page.getByPlaceholder("0901 234 567").fill(phone);
  await page.getByPlaceholder("ban@email.vn").fill(email);
  await page.getByRole("button", { name: /Tiếp tục đến địa chỉ/ }).click();
  await page.getByPlaceholder("Ví dụ: Đồng Nai").fill("Đồng Nai");
  await page.getByPlaceholder("Ví dụ: Trảng Dài").fill("Trảng Dài");
  await page.getByPlaceholder("Số nhà, đường, khu phố").fill("12 Đường Kiểm Thử, Khu phố 1");
  await page.getByRole("button", { name: /Kiểm tra đơn hàng/ }).click();
  await expect(page.locator(".final-review")).toContainText("12 Đường Kiểm Thử");
  await expect(page.locator(".payment-methods")).toContainText("Thanh toán khi nhận hàng");
  await page.getByRole("button", { name: /Xác nhận đặt hàng/ }).click();

  await page.waitForURL(/\/order\/BN/);
  const orderCode = page.url().match(/\/order\/([^?]+)/)?.[1] || "";
  expect(orderCode).toMatch(/^BN/);
  await expect(page.locator(".order-success-banner")).toContainText("Đặt hàng thành công");
  await expect(page.locator(".order-sidebar")).toContainText("Chưa thanh toán");
  await expect(page.locator(".order-sidebar")).toContainText("Hóa đơn sẽ được tạo");

  await page.goto("/track");
  await page.getByPlaceholder("Ví dụ: BN2611041234").fill(orderCode);
  await page.getByPlaceholder("Số điện thoại đặt hàng").fill(phone);
  await page.getByRole("button", { name: "Tra cứu đơn hàng" }).click();
  await expect(page.locator(".tracker-result")).toContainText(orderCode);
  await expect(page.locator(".tracker-result")).toContainText("Chờ xác nhận");

  await page.goto("/login");
  await page.getByPlaceholder("ban@email.vn").fill("admin@beanora.vn");
  await page.getByPlaceholder("Mật khẩu của bạn").fill("Beanora@2026");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL(/\/admin/);
  await expect(page.locator(".admin-page-header")).toContainText("Chào mừng trở lại");

  await page.goto("/admin/orders");
  const row = page.locator("tr", { hasText: orderCode });
  await expect(row).toBeVisible();
  await row.locator("select").selectOption("CONFIRMED");
  await expect(page.locator(".admin-notice")).toContainText("Đã cập nhật trạng thái");
  await page.reload();
  await expect(page.locator("tr", { hasText: orderCode })).toContainText("HD-");

  const pdfHref = await page.locator("tr", { hasText: orderCode }).locator("a[href*='pdf']").getAttribute("href");
  expect(pdfHref).toBeTruthy();
  const pdfResponse = await page.request.get(pdfHref!);
  expect(pdfResponse.status()).toBe(200);
  expect(pdfResponse.headers()["content-type"]).toContain("application/pdf");
  expect((await pdfResponse.body()).subarray(0, 4).toString()).toBe("%PDF");

  await page.goto(`/order/${orderCode}`);
  await expect(page.locator(".order-page").last().locator(".order-layout > .order-sidebar")).toContainText("Xem hóa đơn");
  expect(errors).toEqual([]);
  console.log(`E2E_ORDER_CODE=${orderCode};E2E_PHONE=${phone};E2E_EMAIL=${email}`);
});
