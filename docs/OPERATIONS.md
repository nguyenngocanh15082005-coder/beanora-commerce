# Runbook vận hành Beanora

## Đơn COD

1. Đơn mới: `PENDING_CONFIRMATION` + `UNPAID`, tồn kho đã trừ.
2. Kiểm tra địa chỉ/tồn rồi xác nhận. Invoice nội bộ được tạo một lần khi đơn vào trạng thái xử lý hợp lệ.
3. Đi theo flow: chuẩn bị → đóng gói → bàn giao → giao → đã giao.
4. COD chỉ chuyển `PAID` khi `DELIVERED`. Hủy đơn hoàn tồn và ghi inventory transaction.

Không chuyển ngược trạng thái tùy ý; transition map nằm ở `lib/orders.ts`.

## Đơn chuyển khoản

1. Đơn mới: `AWAITING_PAYMENT` + `AWAITING_TRANSFER`.
2. Khách bấm “Tôi đã chuyển khoản”: chỉ `VERIFYING`.
3. Admin mở sao kê ngân hàng, đối chiếu **mã đơn, số tiền, tài khoản nhận, thời gian và mã giao dịch**.
4. Chỉ khi thấy giao dịch thật mới bấm **Xác nhận**. Ghi note mã sao kê/giao dịch để audit.
5. Nếu không thấy hoặc sai số tiền/tài khoản: **Từ chối**, liên hệ khách; không tự sửa tổng tiền để khớp.
6. Webhook hợp lệ có thể xác nhận tự động. Ảnh chụp chuyển khoản không phải bằng chứng đủ để tự PAID.

Khi đổi tài khoản ngân hàng, đơn cũ vẫn dùng snapshot cũ. Phải theo dõi cả tài khoản cũ cho tới khi các đơn chờ được xử lý xong.

## Hoàn tiền/đổi trả

Trạng thái `REFUNDED`/payment `REFUNDED` không đồng nghĩa tiền đã được ngân hàng hoàn. Cần thực hiện giao dịch hoàn trên ngân hàng và lưu chứng từ/audit theo quy trình kế toán. Chưa có API hoàn tiền tự động.

## Tồn kho

- **Nhập thêm**: cộng số lượng và ghi lý do/mẻ hàng.
- **Kiểm kê**: đặt số tồn mới, hệ thống tạo adjustment.
- Không sửa trực tiếp database để che chênh lệch.
- Đối chiếu `InventoryTransaction.balanceAfter` khi có nghi vấn.
- Checkout khóa tồn và giới hạn 1–20/line; hai request cạnh tranh không được bán vượt tồn.

## Nhân sự/RBAC

- Super Admin: toàn quyền, không bị khóa/đổi role qua API nhân sự thông thường.
- Order Manager: đơn và đối chiếu payment.
- Product Manager: catalog/category và tồn theo permission.
- Support: khách hàng, không có quyền đổi ngân hàng.
- Warehouse: tồn kho.

Khi nhân sự nghỉ việc: khóa tài khoản ngay; session hiện hữu bị xóa. Kiểm tra audit log định kỳ.

## Sự cố email/AI/vận chuyển

- Email thiếu key: `SKIPPED`; không đánh dấu SENT.
- Email FAILED: kiểm tra `lastError`, domain/API quota rồi retry có kiểm soát bằng cùng dedupe key.
- AI lỗi: không ảnh hưởng checkout; kiểm tra key/model/quota, không chuyển key xuống browser.
- Vận chuyển: hiện chưa có carrier API. Nhập vận hành ngoài hệ thống phải được ghi chú rõ, không hiển thị tracking giả.

## Backup & khôi phục

Script ở `scripts/backup.sh` và `scripts/restore.sh`. Trước migration lớn: backup, kiểm tra checksum, lưu ngoài server. Restore có cờ xác nhận và chạy trong một transaction. Luôn thử trên database staging trước.

## Dọn dữ liệu test

Chỉ chạy trên development/staging:

```bash
DRY_RUN=1 npm run test:cleanup   # xem trước số lượng sẽ xóa
npm run test:cleanup             # thực hiện
```

Script xóa đơn/email/invoice/audit/nhân sự theo pattern `e2e-*`, `integration-*`, khôi tồn kho theo delta ledger và đưa payment settings về mặc định. Không chạy E2E trên production vì test tạo đơn, trừ kho, đổi payment settings và tạo nhân sự.

## Audit và bảo mật định kỳ

- Xem `AdminAuditLog` cho thay đổi status/payment/settings/staff/inventory.
- Xóa session hết hạn định kỳ.
- Cập nhật dependency sau khi review và chạy regression; không dùng mù `npm audit fix --force` trên production.
- Rotate `AUTH_SECRET`, webhook/email/AI keys khi có nghi ngờ lộ; thu hồi token đã gửi qua chat/ticket.
- Đánh giá log truy cập không làm lộ mật khẩu, session token, full bank payload hoặc dữ liệu cá nhân không cần thiết.
