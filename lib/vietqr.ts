import QRCode from "qrcode";

function tlv(id: string, value: string) {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

function crc16(input: string) {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export type VietQrInput = { bankBin: string; accountNumber: string; amount: number; description: string; accountName?: string };

/** Tạo payload EMV QR theo mô hình VietQR/NAPAS; chỉ dùng với BIN và tài khoản thật. */
export function buildVietQrPayload({ bankBin, accountNumber, amount, description }: VietQrInput) {
  if (!/^\d{6}$/.test(bankBin)) throw new Error("Mã BIN ngân hàng phải gồm 6 chữ số.");
  if (!/^\d{6,19}$/.test(accountNumber)) throw new Error("Số tài khoản không hợp lệ.");
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("Số tiền QR không hợp lệ.");
  const cleanDescription = description.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, " ").slice(0, 50);
  const merchantAccount = tlv("00", "A000000727") + tlv("01", tlv("00", bankBin) + tlv("01", accountNumber)) + tlv("02", "QRIBFTTA");
  let payload = tlv("00", "000201") + tlv("01", "010212") + tlv("38", merchantAccount) + tlv("52", "0000") + tlv("53", "704") + tlv("54", String(amount)) + tlv("58", "VN") + tlv("62", tlv("08", cleanDescription));
  payload += "6304";
  return payload + crc16(payload);
}

export async function generateVietQrDataUrl(input: VietQrInput) {
  const payload = buildVietQrPayload(input);
  return QRCode.toDataURL(payload, { width: 560, margin: 2, color: { dark: "#2c160f", light: "#fffaf3" }, errorCorrectionLevel: "M" });
}
