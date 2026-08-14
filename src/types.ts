export type PaymentMethod = 'CASH' | 'ESEWA' | 'KHALTI' | 'FONEPAY' | 'BANK' | 'UDHARO';

export interface ConfirmationRequest {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  actionType?: 'EDIT' | 'DELETE' | 'GENERAL';
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface SplitPayment {
  cash: number;
  qr: number; // eSewa, Khalti, Fonepay
  qrType?: 'ESEWA' | 'KHALTI' | 'FONEPAY';
  advance?: number; // Advance deposit used
  udharo: number; // Customer credit
}

export interface UnitPricing {
  primaryUnit: string; // e.g., 'Piece', 'Kg', 'Bottle'
  secondaryUnit?: string; // e.g., 'Box', 'Carton'
  conversionRatio?: number; // e.g., 24 pieces per box
  primaryCostPrice: number;
  primarySellingPrice: number;
  secondaryCostPrice?: number;
  secondarySellingPrice?: number;
  secondaryBarcode?: string; // Carton / Box Barcode
}

export interface Product {
  id: string;
  sku: string;
  barcode: string; // Single Product Barcode
  cartonBarcode?: string; // Carton / Box Barcode
  name: string;
  category: string;
  stockQty: number; // in primary units
  minStockAlert: number;
  unit: UnitPricing;
  supplierId?: string;
  supplierName?: string;
  rackNo?: string; // Rack or Shelf Location Number (e.g. Rack A-2)
  shopCode?: string;
  shopName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  tole?: string;
  panVat?: string;
  totalPurchases: number;
  currentBalance: number; // Positive = customer owes us money (Udharo)
  advanceBalance?: number; // Advance money paid/deposited by customer
  creditLimit: number;
  lastPurchaseDate?: string;
  dueDate?: string; // Payment promise / due date (e.g., '2026-07-28')
  dueNotes?: string;
  shopCode?: string;
  shopName?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  companyName?: string;
  address?: string;
  panVat?: string;
  totalPurchased: number;
  pendingPayable: number; // Money we owe to supplier
  advanceBalance?: number; // Advance money paid to supplier
  dueDate?: string; // Vendor payment due date (e.g., '2026-07-30')
  dueNotes?: string;
  shopCode?: string;
  shopName?: string;
  createdAt: string;
}

export interface SupplierAdvancePayment {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  notes?: string;
  recordedBy?: string;
  shopCode?: string;
  shopName?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  selectedUnit: 'PRIMARY' | 'SECONDARY';
  unitName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  sku: string;
  unitName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  netAmount: number;
  splitPayment: SplitPayment;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  shopCode?: string;
  shopName?: string;
  createdAt: string;
  cashierName: string;
}

export interface StockPurchase {
  id: string;
  purchaseNo: string;
  supplierId: string;
  supplierName: string;
  invoiceRef: string;
  items: {
    productId: string;
    productName: string;
    unitName: string;
    quantity: number;
    costPrice: number;
    totalAmount: number;
  }[];
  totalAmount: number;
  cashPaid: number;
  supplierCredit: number; // Udharo to supplier
  purchaseDate: string;
  notes?: string;
  performedBy?: string;
  shopCode?: string;
  shopName?: string;
}

export interface SalesReturn {
  id: string;
  returnNo: string;
  invoiceNo: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: {
    productId: string;
    productName: string;
    unitName: string;
    quantity: number;
    refundUnitPrice: number;
    totalRefund: number;
  }[];
  totalRefundAmount: number;
  refundMethod: PaymentMethod;
  reason: string;
  returnDate: string;
  performedBy?: string;
  shopCode?: string;
  shopName?: string;
}

export interface PurchaseReturn {
  id: string;
  returnNo: string;
  purchaseNo?: string;
  supplierId?: string;
  supplierName: string;
  items: {
    productId: string;
    productName: string;
    unitName: string;
    quantity: number;
    costPrice: number;
    totalRefund: number;
  }[];
  totalRefundAmount: number;
  refundMethod: PaymentMethod;
  reason: string;
  returnDate: string;
  performedBy?: string;
  shopCode?: string;
  shopName?: string;
}

export interface KhataTransaction {
  id: string;
  entityType: 'CUSTOMER' | 'SUPPLIER';
  entityId: string;
  entityName: string;
  type: 'CREDIT_GIVEN' | 'PAYMENT_RECEIVED' | 'DEBT_ADDED' | 'DEBT_PAID';
  amount: number;
  paymentMethod?: PaymentMethod;
  referenceInvoiceId?: string;
  note?: string;
  performedBy?: string;
  createdAt: string;
  balanceAfter: number;
  shopCode?: string;
  shopName?: string;
}

export interface NepalAddress {
  province: string;
  district: string;
  municipality: string;
  wardNo: string;
  tole: string;
  fullAddress: string;
}

export interface ShopProfile {
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  panVatNo: string;
  shopCode: string;
  address: NepalAddress;
  logoUrl?: string;
  currencySymbol: string;
  thermalPrinterType: '58mm' | '80mm' | 'Standard_A4';
  enableVat: boolean;
  vatRate: number; // percentage e.g. 13%
  tagline?: string;
}

export interface ChatMessageItem {
  id: string;
  sender: 'USER' | 'ADMIN';
  text: string;
  time: string;
  photos?: string[];
}

export interface SupportMessage {
  id: string;
  senderUserId?: string;
  senderName: string;
  senderShopName: string;
  senderPhone: string;
  subject: string;
  category: string;
  message: string;
  photos: string[]; // base64 data URLs or image URLs attached
  createdAt: string;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED';
  adminReply?: string;
  repliedAt?: string;
  chatHistory?: ChatMessageItem[];
}

export interface Suggestion {
  id: string;
  title: string;
  category: string;
  description: string;
  createdAt: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'IMPLEMENTED';
  submittedBy?: string;
  shopName?: string;
  phone?: string;
}

export interface PlanPriceConfig {
  trialDays: number;
  monthlyNpr: number;
  quarterlyNpr: number;
  halfYearlyNpr: number;
  yearlyNpr: number;
}

export interface PlanFeatureConfig {
  monthlyFeatures: string[];
  quarterlyFeatures: string[];
  halfYearlyFeatures: string[];
  yearlyFeatures: string[];
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  applicablePlan?: SubscriptionPlan | 'ALL';
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  isActive: boolean;
  timesUsed: number;
  createdAt: string;
}

export interface ReferralRewardRule {
  requiredActiveUsers: number; // e.g., 2 active referred stores required
  rewardFreeMonths: number;    // e.g., 1 month free membership granted
}

export interface ReferralInfo {
  referralCode: string;
  referralCount: number;
  activeReferralCount: number;
  inactiveReferralCount: number;
  earnedFreeMonths: number;
  requiredActiveUsers: number;
  rewardFreeMonths: number;
  nextRewardProgress: number;
}

export interface SubscriptionSaleTransaction {
  id: string;
  userId: string;
  userName: string;
  shopName: string;
  shopCode: string;
  plan: SubscriptionPlan;
  amount: number;
  discountAmount?: number;
  couponCode?: string;
  paymentMethod: string;
  transactionDate: string; // ISO string or YYYY-MM-DD
  notes?: string;
}

export interface CloudBackupInfo {
  lastBackupAt: string | null;
  status: 'SYNCED' | 'PENDING' | 'OFFLINE' | 'SYNCING';
  totalRecords: number;
  storageSizeBytes: number;
  autoBackupEnabled: boolean;
}

export interface BillTab {
  id: string;
  tabLabel: string;
  cart: CartItem[];
  discount: number;
  selectedCustomerId?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  createdAt: string;
}

export interface HeldBill {
  id: string;
  holdNote: string;
  cart: CartItem[];
  discount: number;
  selectedCustomerId?: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  netTotal: number;
  heldAt: string;
}

export type ExpenseCategory =
  | 'Rent'
  | 'Electricity'
  | 'Maintenance'
  | 'Shop Usage'
  | 'Staff Salary'
  | 'Tea & Snacks'
  | 'Transport'
  | 'Taxes'
  | 'Other';

export interface Expense {
  id: string;
  expenseNo: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paidTo?: string;
  notes?: string;
  performedBy?: string;
  expenseDate: string;
  shopCode?: string;
  shopName?: string;
  createdAt: string;
}

export interface StoreBranch {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  isMain?: boolean;
  createdAt: string;
}

export interface StaffPermissions {
  canDoSales?: boolean;
  canDoPurchase?: boolean;
  canDoAdvances?: boolean;
  canManageStock?: boolean;
  canViewReports?: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  username?: string; // Staff User ID for staff login
  password?: string; // Staff Password for staff login
  role: string; // e.g. 'Store Manager', 'Billing Counter Clerk', 'Sales Assistant', 'Delivery Helper'
  basicSalary: number; // monthly basic salary in NPR
  salaryType: 'MONTHLY' | 'WEEKLY' | 'DAILY';
  joinDate: string; // YYYY-MM-DD
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  storeBranch?: string; // Associated branch/outlet name
  storeOwnerId?: string; // ID of the store owner this staff belongs to
  permissions?: StaffPermissions;
  address?: string;
  notes?: string;
  accountRequestStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO string
  actionType: 'SALE' | 'PURCHASE' | 'ADVANCE_PAYMENT' | 'EXPENSE' | 'KHATA_PAYMENT' | 'STAFF_MANAGEMENT' | 'BRANCH_MANAGEMENT' | 'INVENTORY_CHANGE' | 'SALE_ENTRY' | 'PURCHASE_ENTRY' | 'EXPENSE_ENTRY';
  performedBy: string; // e.g., "Ram Sharma (Staff: STF-101)" or "Sita (Owner)"
  performedByRole: 'STORE_OWNER' | 'STAFF' | 'SUPER_ADMIN';
  storeBranch: string; // e.g., "Main Store", "Pokhara Outlet"
  details: string;
  amount?: number;
  syncedToCloud?: boolean;
}

export type UserStatus = 'TRIAL_ACTIVE' | 'PENDING_APPROVAL' | 'APPROVED' | 'EXPIRED' | 'REJECTED' | 'BLOCKED';
export type SubscriptionPlan = '7_DAY_TRIAL' | 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';

export interface AuthUser {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: 'SUPER_ADMIN' | 'STORE_OWNER' | 'CLERK' | string;
  email: string;
  phone?: string;
  shopName?: string;
  shopCode: string;
  province?: string;
  district?: string;
  address?: string;
  status: UserStatus;
  subscriptionPlan: SubscriptionPlan;
  trialStartDate: string; // ISO string YYYY-MM-DD
  trialExpiryDate: string; // ISO string YYYY-MM-DD
  approvedUntilDate?: string; // ISO string YYYY-MM-DD
  registeredAt: string; // ISO string
  appliedCouponCode?: string;
  discountAmountNpr?: number;
  myReferralCode?: string; // 6-digit alphanumeric referral code, e.g. "DK8A2X"
  referredByCode?: string; // Referral code entered during signup
  referredByUserId?: string; // AuthUser ID of referrer
  staffUserIdAccessStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
  failedLoginAttempts?: number;
  blockedAt?: string;
}

export type AnnouncementTargetType =
  | 'ALL'
  | 'NEW_USERS'
  | 'TRIAL_USERS'
  | 'NEAR_EXPIRY'
  | 'SUBSCRIPTION_PLAN'
  | 'MANUAL_USERS';

export interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'UPDATE' | 'OFFER';
  createdAt: string;
  active: boolean;
  targetType?: AnnouncementTargetType;
  targetPlans?: SubscriptionPlan[];
  targetUserIds?: string[];
}

export interface StaffPayment {
  id: string;
  paymentNo: string;
  staffId: string;
  staffName: string;
  amount: number;
  paymentType: 'SALARY' | 'ADVANCE' | 'BONUS' | 'OVERTIME';
  monthFor?: string; // e.g., 'Shrawan 2083' or 'July 2026'
  paymentMethod: PaymentMethod;
  paymentDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'purchases'
  | 'expenses'
  | 'khata'
  | 'customers'
  | 'suppliers'
  | 'history'
  | 'reports'
  | 'profile'
  | 'referrals'
  | 'suggestions'
  | 'backup'
  | 'staff'
  | 'audit_logs'
  | 'admin_panel';
