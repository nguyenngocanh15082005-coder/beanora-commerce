# API Beanora

Mặc định cùng origin với website. Response lỗi thường có dạng:

```json
{ "error": "Thông báo lỗi" }
```

API mutation từ browser phải cùng origin. Session dùng cookie HttpOnly. API Admin trả `403` khi không đủ quyền; không dựa vào việc ẩn nút trên giao diện.

## Public/storefront

| Method | Route | Mục đích |
|---|---|---|
| GET | `/api/products` | Danh sách sản phẩm public từ database |
| POST | `/api/cart` | Đồng bộ giỏ của user đã đăng nhập |
| POST | `/api/coupons/validate` | Kiểm tra voucher theo subtotal/user |
| POST | `/api/orders` | Tạo đơn, khóa/trừ tồn, tính lại toàn bộ tiền |
| POST | `/api/orders/track` | Tra cứu bằng mã đơn + số điện thoại |
| POST | `/api/orders/:orderCode/report-transfer` | Gửi yêu cầu đối chiếu; không xác nhận PAID |
| POST | `/api/payments/webhook` | Webhook HMAC; ngoại lệ origin middleware |
| GET | `/api/invoices/:invoiceNumber/pdf` | PDF nội bộ, yêu cầu quyền sở hữu hoặc phone |
| POST | `/api/reviews` | Review khi user có đơn hợp lệ chứa sản phẩm |
| POST/DELETE | `/api/wishlist` | Wishlist của user |
| POST | `/api/chat` | Tư vấn AI/catalog, không có quyền xác nhận thanh toán |
| POST | `/api/contact`, `/api/newsletter` | Liên hệ và đăng ký nhận tin |

### Tạo đơn

`POST /api/orders`

```json
{
  "idempotencyKey": "8b9ee0ec-8ad7-4f87-9a39-f76bf75f85a4",
  "items": [{ "variantId": "cuid-from-database", "quantity": 1 }],
  "customerName": "Nguyen Van A",
  "customerPhone": "0901234567",
  "customerEmail": "khach@example.com",
  "province": "Đồng Nai",
  "ward": "Trảng Dài",
  "addressLine": "12 Đường A",
  "deliveryNote": "Giao giờ hành chính",
  "paymentMethod": "COD",
  "couponCode": "BEANORA10"
}
```

- `idempotencyKey`: UUID, nên giữ cố định cho một phiên submit và đổi sau khi đặt thành công.
- Client không được quyết định `subtotal`, `discount`, `shippingFee`, `total`, trạng thái hoặc tài khoản nhận.
- `BANK_TRANSFER` chỉ được tạo khi cấu hình Admin đầy đủ.
- Lỗi tồn kho có tiền tố `OUT_OF_STOCK` trong thông báo nghiệp vụ.

### Tra cứu

`POST /api/orders/track`

```json
{ "orderCode": "BN...", "phone": "0901234567" }
```

Không cung cấp API xem đơn người khác chỉ bằng mã đơn. Trang chi tiết cũng kiểm tra session hoặc phone.

### Báo đã chuyển khoản

`POST /api/orders/:orderCode/report-transfer`

```json
{ "phone": "0901234567" }
```

Kết quả hợp lệ chuyển payment status tối đa đến `VERIFYING`; không phải bằng chứng thanh toán.

## Webhook ngân hàng

`POST /api/payments/webhook`

Header:

```text
Content-Type: application/json
X-Webhook-Signature: <hex HMAC-SHA256 của raw body>
```

Body tối thiểu:

```json
{
  "transactionId": "provider-unique-id",
  "orderCode": "BN2611040001",
  "amount": 389100,
  "receivingAccount": "0123456789"
}
```

Server kiểm tra:

1. `PAYMENT_WEBHOOK_SECRET` đã cấu hình; thiếu secret trả `503`.
2. Chữ ký HMAC trên **raw body**, so sánh timing-safe.
3. Mã đơn tồn tại và `amount === order.total`.
4. Tài khoản nhận khớp snapshot tại thời điểm đặt đơn.
5. `transactionId` chưa từng ghi nhận; duplicate trả `{ "duplicate": true }` để tránh retry vô hạn.
6. Cập nhật payment/order history và tạo invoice trong cùng transaction khi đủ điều kiện.

Contract này đã có integration test tự ký. Cần viết adapter mapping theo nhà cung cấp thật và test trên staging trước khi go-live; không suy ra rằng ngân hàng đã kết nối chỉ vì route tồn tại.

## Auth/account

| Method | Route |
|---|---|
| POST | `/api/auth/register` |
| POST | `/api/auth/login` |
| POST | `/api/auth/logout` |
| POST | `/api/auth/forgot` |
| POST | `/api/auth/reset` |
| PATCH | `/api/account/profile` |

Reset token được hash và có hạn. Mật khẩu dùng bcrypt cost 12.

## Admin

Tất cả đều yêu cầu session nhân sự và permission tương ứng; thay đổi tài khoản nhận tiền/nhân sự yêu cầu Super Admin.

| Nhóm | Routes |
|---|---|
| Products | `POST /api/admin/products`, `PATCH /api/admin/products/:id` |
| Categories | `POST /api/admin/categories`, `PATCH/DELETE /api/admin/categories/:id` |
| Inventory | `POST /api/admin/inventory/:variantId` |
| Orders | `PATCH /api/admin/orders/:id`, `GET /api/admin/orders/export` |
| Payment reconciliation | `POST /api/admin/orders/:id/payment` |
| Customers | `PATCH /api/admin/customers/:id` |
| Coupons | `POST /api/admin/coupons`, `PATCH /api/admin/coupons/:id` |
| Blog | `PATCH /api/admin/blog/:id` |
| Site/payment settings | `PUT /api/admin/settings/site`, `PUT /api/admin/settings/payment` |
| QR preview | `POST /api/admin/settings/payment/preview` |
| Staff/RBAC | `POST /api/admin/staff`, `PATCH /api/admin/staff/:id` |
| Upload | `POST /api/admin/upload` |

Xác nhận payment thủ công:

```json
{ "approved": true, "note": "Đã thấy giao dịch ... trên sao kê ..." }
```

Chỉ dùng sau khi đối chiếu sao kê thực tế. Audit log lưu actor/action/entity/metadata, không cho sửa từ storefront.
