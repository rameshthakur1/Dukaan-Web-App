import {
  Customer,
  Product,
  ShopProfile,
  Supplier,
  Invoice,
  StockPurchase,
  KhataTransaction,
  Suggestion,
  SupportMessage,
  Expense,
  StaffMember,
  StaffPayment,
  SupplierAdvancePayment,
} from '../types';

export const NEPAL_PROVINCES = [
  {
    name: 'Koshi Province (Province 1)',
    districts: ['Jhapa', 'Morang', 'Sunsari', 'Ilam', 'Dhankuta', 'Udayapur'],
  },
  {
    name: 'Madhesh Province',
    districts: ['Parsa', 'Bara', 'Rautahat', 'Sarlahi', 'Dhanusha', 'Siraha', 'Saptari', 'Mahottari'],
  },
  {
    name: 'Bagmati Province',
    districts: ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kavrepalanchok', 'Chitwan', 'Makwanpur', 'Nuwakot', 'Dhading'],
  },
  {
    name: 'Gandaki Province',
    districts: ['Kaski', 'Tanahu', 'Syangja', 'Gorkha', 'Lamjung', 'Nawalpur', 'Parbat'],
  },
  {
    name: 'Lumbini Province',
    districts: ['Rupandehi', 'Palpa', 'Dang', 'Banke', 'Bardiya', 'Kapilvastu', 'Nawalparasi West'],
  },
  {
    name: 'Karnali Province',
    districts: ['Surkhet', 'Dailekh', 'Jumla', 'Kalikot', 'Rukum West'],
  },
  {
    name: 'Sudurpashchim Province',
    districts: ['Kailali', 'Kanchanpur', 'Doti', 'Dadeldhura'],
  },
];

export const INITIAL_SHOP_PROFILE: ShopProfile = {
  shopName: 'My Store',
  ownerName: 'Store Owner',
  phone: '',
  email: '',
  panVatNo: '',
  shopCode: 'SHOP-0001',
  currencySymbol: 'NPR',
  thermalPrinterType: '80mm',
  enableVat: false,
  vatRate: 13,
  tagline: '',
  logoUrl: '',
  address: {
    province: 'Bagmati Province',
    district: 'Kathmandu',
    municipality: 'Kathmandu Metropolitan City',
    wardNo: '1',
    tole: '',
    fullAddress: '',
  },
};

export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_INVOICES: Invoice[] = [];
export const INITIAL_PURCHASES: StockPurchase[] = [];
export const INITIAL_KHATA_TRANSACTIONS: KhataTransaction[] = [];
export const INITIAL_SUGGESTIONS: Suggestion[] = [];
export const INITIAL_SUPPORT_MESSAGES: SupportMessage[] = [
  {
    id: 'SUP-1001',
    senderUserId: 'USR-DEMO-01',
    senderName: 'Bikash Kirana',
    senderShopName: 'Bikash Kirana Pasahal',
    senderPhone: '9841000111',
    subject: 'Printer Paper Margin Issue',
    category: 'Hardware & Printing',
    message: 'Namaste Admin, attached photo of our printed receipt. The right margin is slightly cut off on 58mm printer. Please advise.',
    photos: [
      'https://images.unsplash.com/photo-1556742049-0a670f4a4591?w=600&auto=format&fit=crop&q=80',
    ],
    createdAt: '2026-07-31 14:30',
    status: 'NEW',
  },
  {
    id: 'SUP-1002',
    senderUserId: 'USR-DEMO-02',
    senderName: 'Anil Grocery',
    senderShopName: 'Anil Supermarket',
    senderPhone: '9851222333',
    subject: 'Fonepay QR Verification',
    category: 'QR Payments',
    message: 'Hello Admin, here is our store QR standee photo for verification and custom billing logo update.',
    photos: [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    ],
    createdAt: '2026-07-30 11:15',
    status: 'IN_PROGRESS',
    adminReply: 'Namaste Anil ji! We received your QR photo. Our technical team is activating static Fonepay QR code on your printed bills.',
    repliedAt: '2026-07-30 12:00',
  },
];
export const INITIAL_EXPENSES: Expense[] = [];
export const INITIAL_STAFF: StaffMember[] = [
  {
    id: 'STF-1001',
    name: 'Sunil Karki',
    phone: '9841556677',
    username: 'sunil_billing',
    password: 'sunil123password',
    role: 'Billing Counter Clerk',
    basicSalary: 18000,
    salaryType: 'MONTHLY',
    joinDate: '2026-07-15',
    status: 'ACTIVE',
    accountRequestStatus: 'APPROVED',
    storeBranch: 'Bikash Grocery (New Road)',
    storeOwnerId: 'USR-DEMO-01',
    address: 'New Road, Kathmandu',
    notes: 'POS cashier station billing staff request.',
    createdAt: '2026-07-15T10:00:00.000Z',
    permissions: { canDoSales: true, canDoPurchase: false, canDoAdvances: false, canManageStock: false, canViewReports: false },
  },
  {
    id: 'STF-1002',
    name: 'Aarati Thapa',
    phone: '9801998877',
    username: 'aarati_mgr',
    password: 'aarati456pass',
    role: 'Store Manager',
    basicSalary: 25000,
    salaryType: 'MONTHLY',
    joinDate: '2026-07-20',
    status: 'ACTIVE',
    accountRequestStatus: 'APPROVED',
    storeBranch: 'Anil Supermarket (Lalitpur)',
    storeOwnerId: 'USR-STORE-02',
    address: 'Patan, Lalitpur',
    notes: 'Requested store manager credentials for stock entry.',
    createdAt: '2026-07-20T11:30:00.000Z',
    permissions: { canDoSales: true, canDoPurchase: true, canDoAdvances: true, canManageStock: true, canViewReports: true },
  },
  {
    id: 'STF-1003',
    name: 'Rohan Gurung',
    phone: '9812334455',
    username: 'rohan_sales',
    password: 'rohan789pass',
    role: 'Sales Assistant',
    basicSalary: 15000,
    salaryType: 'MONTHLY',
    joinDate: '2026-06-01',
    status: 'ACTIVE',
    accountRequestStatus: 'APPROVED',
    storeBranch: 'Eastern Food Depot (Biratnagar)',
    storeOwnerId: 'USR-STORE-03',
    address: 'Biratnagar, Morang',
    notes: 'Approved floor sales assistant.',
    createdAt: '2026-06-01T09:00:00.000Z',
    permissions: { canDoSales: true, canDoPurchase: false, canDoAdvances: false, canManageStock: true, canViewReports: false },
  },
];
export const INITIAL_STAFF_PAYMENTS: StaffPayment[] = [];
export const INITIAL_SUPPLIER_ADVANCE_PAYMENTS: SupplierAdvancePayment[] = [];
