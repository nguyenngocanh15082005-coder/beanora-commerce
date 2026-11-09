import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page, email = "admin@beanora.vn", password = "Beanora@2026") {
  await page.goto("/login");
  await page.getByPlaceholder("ban@email.vn").fill(email);
  await page.getByPlaceholder("Mật khẩu của bạn").fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL(/\/(admin|account)/);
}

test("Super Admin CRUD danh mục và xóa dữ liệu kiểm thử", async ({ page }) => {
  await login(page);
  await page.goto("/admin/categories");
  await page.getByRole("button", { name: "Thêm danh mục" }).click();
  const slug = `e2e-category-${Date.now()}`;
  await page.locator(".admin-modal").getByLabel("Tên danh mục").fill("Danh mục kiểm thử E2E");
  await page.locator(".admin-modal").getByLabel("Slug").fill(slug);
  await page.locator(".admin-modal").getByLabel("Mô tả").fill("Chỉ dùng cho kiểm thử tự động");
  await page.locator(".admin-modal").getByRole("button", { name: "Lưu danh mục" }).click();
  await expect(page.locator(".admin-modal")).toHaveCount(0);
  const row = page.locator("tr", { hasText: slug });
  await expect(row).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Xóa" }).click();
  await expect(page.locator("tr", { hasText: slug })).toHaveCount(0);
});

test("tạo nhân sự SUPPORT, RBAC chặn đổi ngân hàng và khóa session", async ({ page, browser }) => {
  await login(page);
  await page.goto("/admin/staff");
  await page.getByRole("button", { name: "Thêm nhân sự" }).click();
  const email = `e2e-staff-${Date.now()}@example.com`;
  const modal = page.locator(".admin-modal");
  await modal.getByLabel("Họ tên").fill("Nhân Sự Kiểm Thử E2E");
  await modal.getByLabel("Email công việc").fill(email);
  await modal.getByLabel("Mật khẩu tạm *").fill("E2eStaff@2026");
  await modal.getByLabel("Vai trò").selectOption("SUPPORT");
  await modal.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page.locator(".admin-modal")).toHaveCount(0);
  const row = page.locator("tr", { hasText: email });
  await expect(row).toContainText("Chăm sóc khách hàng");

  const staffContext = await browser.newContext();
  const staffPage = await staffContext.newPage();
  await login(staffPage, email, "E2eStaff@2026");
  const forbidden = await staffPage.request.put("/api/admin/settings/payment", { data: {
    codEnabled: true, bankEnabled: false, bankName: "", bankCode: "", bankBin: "", accountNumber: "", accountName: "",
    paymentTimeoutMinutes: 1440, shippingFee: 30000, freeShippingFrom: 1000000,
  } });
  expect(forbidden.status()).toBe(403);
  await staffContext.close();

  await row.getByRole("button", { name: "Khóa", exact: true }).click();
  await expect(page.locator("tr", { hasText: email })).toContainText("Đã khóa");
  console.log(`E2E_STAFF_EMAIL=${email}`);
});
