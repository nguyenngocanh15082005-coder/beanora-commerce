# Triển khai production

## 1. Điều kiện go-live

- Domain HTTPS và reverse proxy chuyển đúng `Host`/protocol.
- PostgreSQL private network, user quyền tối thiểu, backup tự động.
- Node.js LTS, process manager (systemd/PM2) và disk bền cho `public/uploads`.
- Secret được đưa qua secret manager/environment, không ghi vào Git.
- Catalog, thông tin doanh nghiệp, ngân hàng và chính sách là dữ liệu thật.
- Đã chạy test trên staging, không trỏ test vào production.

## 2. Database & Super Admin không có dữ liệu mẫu

```bash
cp .env.example .env
# Điền DATABASE_URL, AUTH_SECRET, APP_URL
# Đặt SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD mạnh và SEED_ADMIN_ONLY=true
npm ci
npx prisma migrate deploy
npm run db:seed
npm run build
```

`SEED_ADMIN_ONLY=true` chỉ tạo role/permission, Super Admin và payment setting mặc định; không tạo sản phẩm/blog/voucher mẫu. Đăng nhập rồi đổi mật khẩu ngay. Nếu chạy seed mặc định, phải thay toàn bộ catalog mẫu trước khi mở bán.

Không dùng `prisma migrate dev` trên production. Migration mới phải review SQL, backup và chạy `prisma migrate deploy` trong quy trình release.

## 3. Chạy ứng dụng

```bash
npm start -- --port 3000
```

Ví dụ systemd:

```ini
[Unit]
Description=Beanora Commerce
After=network-online.target

[Service]
Type=simple
WorkingDirectory=/srv/beanora
Environment=NODE_ENV=production
EnvironmentFile=/srv/beanora/.env
ExecStart=/usr/bin/npm start -- --port 3000
Restart=always
RestartSec=5
User=beanora
Group=beanora
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Nginx proxy tới `127.0.0.1:3000`, bật TLS và giới hạn request body phù hợp upload. App lắng nghe `0.0.0.0` trong container/preview; trên VM chỉ mở public 80/443 qua proxy.

## 4. Cấu hình nghiệp vụ

1. **Nội dung & thương hiệu**: tên pháp lý/hộ kinh doanh, địa chỉ, email, hotline, chính sách.
2. **Danh mục/sản phẩm**: tạo dữ liệu thật, SKU duy nhất, biến thể, giá và tồn kho.
3. **Cài đặt thanh toán**: COD, phí ship, tài khoản ngân hàng thật; QR preview trước khi lưu.
4. **Nhân viên & phân quyền**: cấp vai trò tối thiểu; khóa tài khoản khi nghỉ việc.
5. **Đơn staging**: chạy COD và chuyển khoản end-to-end trước khi mở domain.

PDF là hóa đơn bán hàng nội bộ, không thay thế hóa đơn điện tử VAT. Kết nối nhà cung cấp hóa đơn pháp lý là công việc riêng nếu doanh nghiệp yêu cầu.

## 5. Email

Điền `RESEND_API_KEY`, `RESEND_FROM` thuộc domain đã xác minh và `ADMIN_EMAIL`. Chưa có key thì log `SKIPPED`, không báo đã gửi.

- Gửi thử từ một đơn staging.
- Kiểm tra `EmailLog`: `PENDING`, `SENT`, `FAILED`, `SKIPPED`, `providerId`, `attempts`.
- Retry tối đa 3 lần; `dedupeKey` ngăn gửi trùng khi gọi lại.
- Chưa có worker nền tự động quét log FAILED; cần retry có kiểm soát khi vận hành thật.

## 6. AI

Điền `OPENAI_API_KEY` ở server và `OPENAI_MODEL`. Không đưa key vào `NEXT_PUBLIC_*`. OpenAI chỉ nhận catalog public và câu hỏi; system prompt cấm bịa giá/tồn/xác nhận thanh toán. Không có key, chat chạy mode `CATALOG` từ dữ liệu PostgreSQL. Đây là catalog grounding, không phải hệ thống vector-RAG doanh nghiệp hoàn chỉnh.

## 7. Vận chuyển

Hiện chỉ có phí ship cố định/miễn phí theo ngưỡng do server tính. `GHN_TOKEN` là biến dự phòng, **không có nghĩa GHN đã kết nối**. Chưa tạo vận đơn/tracking GHN, GHTK hoặc Viettel Post. Phải implement adapter, chữ ký/webhook, mapping trạng thái và test thật trước khi ghi “đã tích hợp”.

## 8. Backup/restore

```bash
set -a; source .env; set +a
BACKUP_DIR=/secure/backups ./scripts/backup.sh

# Chỉ trên database đích đã xác nhận
CONFIRM_RESTORE=YES DATABASE_URL='postgresql://...' \
  ./scripts/restore.sh /secure/backups/beanora-....dump
```

Lưu backup ngoài server ứng dụng, mã hóa, có retention và quyền truy cập tối thiểu. Diễn tập restore định kỳ. `backups/` bị Git ignore.

## 9. Checklist sau deploy

- [ ] HTTPS, `APP_URL` đúng, cookie Secure, không lộ `.env`.
- [ ] `npm run typecheck`, `npm test`, production build và E2E staging pass.
- [ ] `npm audit` không có lỗ hổng chưa đánh giá.
- [ ] Đổi Super Admin mặc định; RBAC Support không đổi được ngân hàng.
- [ ] Đơn giả không còn, bank test đã tắt/xóa, giá/tồn kho thật.
- [ ] Report transfer không tự PAID; webhook live đã test nếu bật.
- [ ] PDF Unicode tải được; email live test nếu bật.
- [ ] Backup chạy và restore thử thành công.
- [ ] Rate limit distributed nếu chạy nhiều instance; upload storage bền.
