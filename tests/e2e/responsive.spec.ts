import { test, expect } from "@playwright/test";

test("desktop hiển thị 5 sản phẩm mỗi hàng và không tràn ngang", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const grid = page.locator(".product-grid").first();
  await expect(grid.locator(".product-card")).toHaveCount(5);
  const columns = await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
  expect(columns).toBe(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("mobile menu, cửa hàng và chi tiết sản phẩm responsive", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Mở menu" }).click();
  await expect(page.locator(".main-nav")).toHaveClass(/is-open/);
  await page.locator(".main-nav").getByRole("link", { name: "Sản phẩm", exact: true }).click();
  await page.waitForURL(/\/shop/);
  await expect(page.locator(".product-grid").first().locator(".product-card").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goto("/product/ca-phe-arabica-dak-lak");
  await expect(page.getByRole("heading", { name: "Cà phê Arabica Đắk Lắk", exact: true })).toBeVisible();
  await page.locator(".detail-buy").getByRole("button", { name: "Thêm vào giỏ", exact: true }).click();
  await expect(page.locator(".cart-drawer")).toHaveClass(/is-open/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
