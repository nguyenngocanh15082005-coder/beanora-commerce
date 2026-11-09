# Kiểm thử Beanora

## Môi trường bắt buộc

- Database development đã migrate/seed; không dùng production.
- `admin@beanora.vn / Beanora@2026` chỉ cho E2E local.
- Playwright Chromium và system dependencies đã cài.
- E2E cần production build/server ở `E2E_BASE_URL` (mặc định `http://localhost:3000`).

## Lệnh

```bash
npm run typecheck
npx prisma validate
npm audit
npm test
npm run test:e2e -- --reporter=line
```

Vitest dùng alias rỗng cho `server-only` ở `tests/server-only.ts` để test service trong Node; Next build vẫn giữ bảo vệ server/client thật.

## Unit & integration

- Pricing: percent/fixed voucher, min order, expiry, usage, shipping threshold.
- VietQR: BIN/account/amount/order content, currency VN, sanitize description, input invalid.
- Checkout PostgreSQL: tính tiền server, trừ/hoàn tồn, invoice một lần.
- Idempotency: gọi lại cùng UUID trả cùng đơn, không trừ kho lần hai.
- Webhook: HMAC đúng/sai, sai số tiền, tài khoản snapshot, dedupe transaction, invoice và email log.
- Race tồn kho: hai checkout cùng mua số lượng cuối, chỉ một giao dịch thành công.

Test tự dọn order/invoice/email/inventory movement có prefix `integration-` và khôi phục tồn bị thay đổi.

## Playwright

1. COD: guest thêm giỏ → reload giữ giỏ → voucher → checkout → tra cứu → Admin xác nhận → invoice → PDF `%PDF`.
2. Bank: Admin cấu hình tài khoản test → QR động → report transfer không PAID → Admin reconcile → paid/invoice; afterEach tắt và xóa bank test.
3. Desktop: home 5 card/hàng, không overflow.
4. Mobile: menu, shop, detail/cart, không overflow hoặc page error.
5. Category: Super Admin tạo/xóa category test.
6. Staff/RBAC: tạo SUPPORT, API đổi ngân hàng bị 403, khóa tài khoản.

E2E tạo dữ liệu `e2e-`; dọn trên môi trường test sau khi hoàn tất. Không suy ra webhook/email/OpenAI/carrier live đã pass từ test nội bộ.

## Chất lượng build

Production build bao gồm Prisma generate, lint/typecheck và prerender. PDFKit dùng DejaVu Sans trong `assets/fonts` để tránh lỗi font production và hiển thị tiếng Việt. `npm audit` được kiểm tra riêng; cập nhật dependency phải chạy lại toàn bộ regression.
