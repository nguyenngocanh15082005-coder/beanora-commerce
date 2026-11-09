# Beanora Commerce

Website bán cà phê độc lập trên **Next.js 15 + React 19 + PostgreSQL + Prisma**. Bao gồm storefront, giỏ hàng, checkout, đơn hàng, thanh toán COD/chuyển khoản, hóa đơn nội bộ và khu vực quản trị có phân quyền server-side.

> Đây là mã nguồn vận hành, không phải mockup frontend. Các tích hợp bên thứ ba chưa có khóa/cấu hình thật đều ở trạng thái chờ; không giả lập giao dịch thành công.

## Trạng thái chức năng

| Khu vực | Trạng thái |
|---|---|
| Catalog, 10 danh mục mẫu, sản phẩm/biến thể/tồn kho PostgreSQL | Đã implement; dữ liệu mẫu chỉ dùng development |
| Search, filter, sort, pagination, product detail, responsive | Đã implement |
| Cart guest/account, giữ giỏ khi reload, checkout nhiều bước | Đã implement |
| Server tính giá, voucher, phí ship, khóa tồn và idempotency key | Đã implement và có integration test |
| COD, tra cứu, Admin xác nhận, hóa đơn xem/PDF | Đã có E2E test |
| Chuyển khoản: snapshot tài khoản, VietQR động, report transfer | Đã có E2E test; **không tự đặt PAID** |
| Webhook HMAC + đối chiếu đơn/tiền/tài khoản/dedupe | Contract và integration test; chưa xác minh với nhà cung cấp ngân hàng thật |
| Auth, account, wishlist, review có đơn hợp lệ | Đã implement |
| Admin catalog/category/inventory/orders/customers/coupons/content/staff/RBAC | Đã implement; kiểm tra quyền trên API |
| Email Resend: log, retry, dedupe | Code sẵn; `SKIPPED` khi thiếu key; chưa test gửi live |
| AI OpenAI + dữ liệu catalog thật | Code sẵn; không có key dùng trợ lý catalog nội bộ; chưa test OpenAI live |
| GHN/GHTK/Viettel Post | **Chưa tích hợp**; hiện dùng phí ship cấu hình trong Admin |
| Hóa đơn VAT pháp lý | **Không có**; PDF là hóa đơn bán hàng nội bộ |
| Shopee/TikTok Shop/Lazada | Không tích hợp, không chuyển khách sang sàn thanh toán |

## Yêu cầu

- Node.js 22 LTS (hoặc Node 20.9+ tương thích Next 15)
- PostgreSQL 16+; bản kiểm thử dùng PostgreSQL 17
- npm
- `pg_dump`/`pg_restore` nếu dùng script sao lưu

## Chạy local

```bash
npm ci
cp .env.example .env
# Sửa DATABASE_URL, AUTH_SECRET và mật khẩu seed trong .env
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Mở `http://localhost:3000`.

### Super Admin development

Chỉ sau khi chạy seed mặc định trên môi trường development:

- Email: `admin@beanora.vn`
- Mật khẩu: `Beanora@2026`

**Không dùng thông tin này trên production.** Production dùng `SEED_ADMIN_ONLY=true`, email/mật khẩu riêng và đổi mật khẩu sau lần đăng nhập đầu.

### Production-like local

```bash
npm run build
npm start -- --port 3000
```

## Cấu hình `.env`

Xem file `.env.example`. Không commit `.env` hoặc bất kỳ token nào.

| Biến | Bắt buộc | Ý nghĩa |
|---|---:|---|
| `DATABASE_URL` | Có | PostgreSQL connection string |
| `AUTH_SECRET` | Có | Chuỗi ngẫu nhiên dài; tạo bằng `openssl rand -base64 32` |
| `APP_URL` | Có | Origin public, ví dụ `https://beanora.vn` |
| `SEED_ADMIN_EMAIL/PASSWORD` | Khi seed | Super Admin ban đầu |
| `SEED_ADMIN_ONLY` | Production | `true` để không tạo catalog/blog/coupon mẫu |
| `RESEND_API_KEY`, `RESEND_FROM` | Không | Gửi email thật qua Resend |
| `ADMIN_EMAIL` | Không | Email nội bộ nhận thông báo đơn mới |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Không | Tư vấn AI có catalog grounding |
| `PAYMENT_WEBHOOK_SECRET` | Không | HMAC webhook; để trống trả HTTP 503 |
| `GHN_TOKEN`, `GHN_SHOP_ID` | Chưa dùng | Placeholder cho tích hợp vận chuyển tương lai |

## Cấu hình ngân hàng & VietQR

1. Đăng nhập Super Admin → **Cài đặt thanh toán**.
2. Bật chuyển khoản, chọn ngân hàng/BIN, nhập tài khoản và chủ tài khoản thật.
3. Kiểm tra QR preview rồi lưu.
4. Tạo một đơn thử trên môi trường staging. QR trên đơn được tạo lại theo **tổng tiền và mã đơn**, không dùng số tiền do browser gửi.
5. Đơn lưu snapshot tài khoản. Đổi tài khoản sau đó không làm thay đổi đơn cũ.
6. “Tôi đã chuyển khoản” chỉ chuyển sang `VERIFYING`. Chỉ webhook hợp lệ hoặc Admin sau khi xem sao kê mới xác nhận `PAID`.

Ảnh QR upload chỉ là fallback nếu bộ tạo QR động lỗi. Không dùng tài khoản kiểm thử của E2E làm tài khoản nhận tiền thật.

## Nguồn và cấu trúc

```text
app/                    Next.js App Router, storefront/Admin/API
components/             UI storefront, checkout, cart, Admin
lib/                    auth/RBAC, orders, pricing, QR, PDF, email, AI
prisma/schema.prisma    Toàn bộ schema quan hệ
prisma/migrations/      Migration SQL có thể deploy
prisma/seed.ts          RBAC, Super Admin và dữ liệu development
public/images/          Ảnh catalog nội bộ
assets/fonts/           Font Unicode cho PDFKit
scripts/                Backup/restore PostgreSQL
tests/unit/             Pricing, VietQR
tests/integration/      PostgreSQL, tồn kho, webhook, invoice, email
tests/e2e/             Luồng trình duyệt thật bằng Playwright
docs/                   API, deployment, vận hành, kiểm thử
```

## Kiểm thử

```bash
npm run typecheck
npx prisma validate
npm test
npm audit

# Cần production server ở port 3000 và database seed development
npm run build
npm start -- --port 3000
# Terminal khác:
npm run test:e2e
```

Integration test ghi/xóa dữ liệu có email bắt đầu `integration-`; E2E dùng `e2e-`. Không chạy test trên database production. Chi tiết tại [docs/TESTING.md](docs/TESTING.md).

## Bảo mật & giới hạn vận hành

- bcrypt cost 12, session token ngẫu nhiên lưu dạng SHA-256, cookie `HttpOnly`, `SameSite=Lax`, `Secure` ở production.
- RBAC và quyền sở hữu đơn kiểm tra server-side; middleware chặn mutation cross-site, webhook dùng HMAC riêng.
- Prisma parameterized queries, Zod validation, output React escaping và email HTML escaping.
- Checkout dùng transaction `Serializable` và khóa dòng tồn kho; hóa đơn có quan hệ một-một với đơn.
- Rate limit hiện trong bộ nhớ tiến trình: phù hợp single instance; nhiều instance cần Redis/API gateway.
- Upload lưu local: production cần disk bền hoặc chuyển sang object storage trước khi autoscale.
- Sao lưu không đồng nghĩa đã khôi phục được: phải định kỳ diễn tập restore.

## Tài liệu tiếp theo

- [API & webhook](docs/API.md)
- [Triển khai production](docs/DEPLOYMENT.md)
- [Runbook vận hành](docs/OPERATIONS.md)
- [Kiểm thử](docs/TESTING.md)
