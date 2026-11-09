import { describe, expect, it } from "vitest";
import { buildVietQrPayload } from "@/lib/vietqr";

function readTlv(payload: string, wanted: string) {
  let index = 0;
  while (index < payload.length - 4) {
    const id = payload.slice(index, index + 2);
    const length = Number(payload.slice(index + 2, index + 4));
    const value = payload.slice(index + 4, index + 4 + length);
    if (id === wanted) return value;
    index += 4 + length;
  }
  return undefined;
}

describe("VietQR EMV payload", () => {
  it("nhúng BIN, tài khoản, số tiền và nội dung đơn vào payload", () => {
    const payload = buildVietQrPayload({ bankBin: "970436", accountNumber: "0123456789", amount: 329000, description: "BN2611040001" });
    expect(readTlv(payload, "53")).toBe("704");
    expect(readTlv(payload, "54")).toBe("329000");
    expect(readTlv(payload, "58")).toBe("VN");
    expect(readTlv(payload, "62")).toContain("BN2611040001");
    expect(readTlv(payload, "38")).toContain("970436");
    expect(readTlv(payload, "38")).toContain("0123456789");
    expect(payload.slice(-8, -6)).toBe("63");
    expect(payload.slice(-6, -4)).toBe("04");
  });

  it("loại dấu và ký tự nguy hiểm khỏi nội dung chuyển khoản", () => {
    const payload = buildVietQrPayload({ bankBin: "970436", accountNumber: "0123456789", amount: 100000, description: "Đơn hàng <script> BN01" });
    expect(readTlv(payload, "62")).not.toContain("<");
    expect(readTlv(payload, "62")).not.toContain(">");
  });

  it("từ chối tài khoản, BIN và số tiền không hợp lệ", () => {
    expect(() => buildVietQrPayload({ bankBin: "ABC", accountNumber: "0123456789", amount: 1, description: "BN01" })).toThrow();
    expect(() => buildVietQrPayload({ bankBin: "970436", accountNumber: "12", amount: 1, description: "BN01" })).toThrow();
    expect(() => buildVietQrPayload({ bankBin: "970436", accountNumber: "0123456789", amount: 0, description: "BN01" })).toThrow();
  });
});
