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
  shopName: '',
  ownerName: '',
  phone: '',
  email: '',
  panVatNo: '',
  shopCode: 'SHOP-01',
  currencySymbol: 'NPR',
  thermalPrinterType: '80mm',
  enableVat: false,
  vatRate: 13,
  tagline: '',
  logoUrl: '',
  address: {
    province: '',
    district: '',
    municipality: '',
    wardNo: '',
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
export const INITIAL_SUPPORT_MESSAGES: SupportMessage[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
export const INITIAL_STAFF: StaffMember[] = [];
export const INITIAL_STAFF_PAYMENTS: StaffPayment[] = [];
export const INITIAL_SUPPLIER_ADVANCE_PAYMENTS: SupplierAdvancePayment[] = [];

