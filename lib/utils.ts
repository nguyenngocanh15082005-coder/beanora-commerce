export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function makeOrderCode(date = new Date()) {
  const datePart = date.toISOString().slice(2, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BN${datePart}${random}`;
}

export function makeInvoiceNumber(date = new Date()) {
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, "");
  return `HD-${datePart}-${Math.floor(10000 + Math.random() * 90000)}`;
}
