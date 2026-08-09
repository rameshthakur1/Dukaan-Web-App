export function generateUniqueId(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}-${randomStr}`;
}

export function generateInvoiceNo(seqNumber: number): string {
  const year = new Date().getFullYear();
  const seq = String(seqNumber).padStart(4, '0');
  const rand = Math.floor(10 + Math.random() * 90);
  return `INV-${year}-${seq}-${rand}`;
}

export function generatePurchaseBillNo(seqNumber: number): string {
  const year = new Date().getFullYear();
  const seq = String(seqNumber).padStart(4, '0');
  const rand = Math.floor(10 + Math.random() * 90);
  return `BILL-${year}-${seq}-${rand}`;
}

export function generateCustomerId(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `CUST-${rand}`;
}

export function generateSupplierId(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `SUPP-${rand}`;
}

export function generateKhataTxnId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `TXN-KHT-${year}-${rand}`;
}

export function generateExpenseNo(seqNumber: number): string {
  const year = new Date().getFullYear();
  const seq = String(seqNumber).padStart(3, '0');
  const rand = Math.floor(10 + Math.random() * 90);
  return `EXP-${year}-${seq}-${rand}`;
}

export function generateStaffId(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `STF-${rand}`;
}

export function generateStaffPaymentNo(seqNumber: number): string {
  const year = new Date().getFullYear();
  const seq = String(seqNumber).padStart(3, '0');
  const rand = Math.floor(10 + Math.random() * 90);
  return `PAY-${year}-${seq}-${rand}`;
}

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
