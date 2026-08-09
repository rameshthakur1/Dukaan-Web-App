import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  FileText,
  Filter,
  Printer,
  Users,
  Truck,
  Package,
  Layers,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  PieChart,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Plus,
  Send,
  MessageSquare,
  CheckCircle2,
  Clock,
  Briefcase,
  ChevronRight,
  ShoppingCart,
  PhoneCall,
} from 'lucide-react';
import { ReportPdfModal } from './ReportPdfModal';
import { AddSalesReturnModal } from './AddSalesReturnModal';
import { AddPurchaseReturnModal } from './AddPurchaseReturnModal';
import { PaymentMethod } from '../../types';

export type ReportCategory =
  | 'SALES'
  | 'PURCHASE'
  | 'INVENTORY'
  | 'PARTY'
  | 'FINANCIAL';

export type ReportId =
  // Sales Reports (1-4)
  | 'SALES_SUMMARY'
  | 'PARTY_SALES'
  | 'ITEM_SALES'
  | 'SALES_RETURN'
  // Purchase Reports (5-8)
  | 'PURCHASE_SUMMARY'
  | 'PARTY_PURCHASE'
  | 'ITEM_PURCHASE'
  | 'PURCHASE_RETURN'
  // Inventory & Stock Reports (9-12)
  | 'STOCK_SUMMARY'
  | 'STOCK_VALUATION'
  | 'LOW_STOCK'
  | 'ITEM_MOVEMENT'
  // Party & Credit Ledger Reports (13-15)
  | 'CUSTOMER_RECEIVABLES'
  | 'SUPPLIER_PAYABLES'
  | 'PARTY_STATEMENT'
  // Financial & Operational Reports (16-20)
  | 'DAYBOOK'
  | 'PROFIT_LOSS'
  | 'ITEM_PROFIT_MARGIN'
  | 'EXPENSE_REPORT'
  | 'CASH_BANK_BALANCE';

interface ReportDefinition {
  id: ReportId;
  name: string;
  category: ReportCategory;
  description: string;
  icon: React.ElementType;
}

const ALL_REPORTS: ReportDefinition[] = [
  // Sales
  { id: 'SALES_SUMMARY', name: '1. Sales Summary', category: 'SALES', description: 'High-level total sales, tax, discounts, net revenue', icon: TrendingUp },
  { id: 'PARTY_SALES', name: '2. Party-wise Sales', category: 'SALES', description: 'Breakdown of total sales by customer', icon: Users },
  { id: 'ITEM_SALES', name: '3. Item-wise Sales', category: 'SALES', description: 'Sales metrics based on individual products or SKUs', icon: Package },
  { id: 'SALES_RETURN', name: '4. Sales Return', category: 'SALES', description: 'Logs customer returned goods and refund values', icon: RotateCcw },

  // Purchase
  { id: 'PURCHASE_SUMMARY', name: '5. Purchase Summary', category: 'PURCHASE', description: 'Summary of all procurement activities and costs', icon: ShoppingCart },
  { id: 'PARTY_PURCHASE', name: '6. Party-wise Purchase', category: 'PURCHASE', description: 'Purchases organized by vendors and suppliers', icon: Truck },
  { id: 'ITEM_PURCHASE', name: '7. Item-wise Purchase', category: 'PURCHASE', description: 'Unit purchase rates and stock quantities acquired', icon: Layers },
  { id: 'PURCHASE_RETURN', name: '8. Purchase Return', category: 'PURCHASE', description: 'Tracks items returned back to suppliers', icon: RotateCcw },

  // Inventory & Stock
  { id: 'STOCK_SUMMARY', name: '9. Stock Summary', category: 'INVENTORY', description: 'Real-time snapshot of current available stock levels', icon: Package },
  { id: 'STOCK_VALUATION', name: '10. Stock Valuation', category: 'INVENTORY', description: 'Monetary asset valuation at cost vs selling price', icon: DollarSign },
  { id: 'LOW_STOCK', name: '11. Low Stock / Reorder', category: 'INVENTORY', description: 'Early alerts for products below threshold', icon: AlertTriangle },
  { id: 'ITEM_MOVEMENT', name: '12. Item Movement / Ledger', category: 'INVENTORY', description: 'Complete audit trail lifecycle of a product', icon: BookOpen },

  // Party & Ledger
  { id: 'CUSTOMER_RECEIVABLES', name: '13. Customer Receivables', category: 'PARTY', description: 'Customers owing money with WhatsApp reminders', icon: Users },
  { id: 'SUPPLIER_PAYABLES', name: '14. Supplier Payables', category: 'PARTY', description: 'Credit balance owed to vendors/suppliers', icon: Truck },
  { id: 'PARTY_STATEMENT', name: '15. Party Statement Ledger', category: 'PARTY', description: 'Bank-style itemized ledger for customer/vendor', icon: FileText },

  // Financial & Operations
  { id: 'DAYBOOK', name: '16. Daybook Transaction Log', category: 'FINANCIAL', description: 'Daily chronological cash-in vs cash-out record', icon: Calendar },
  { id: 'PROFIT_LOSS', name: '17. Profit & Loss (P&L)', category: 'FINANCIAL', description: 'Gross & Net Profit performance statement', icon: BarChart3 },
  { id: 'ITEM_PROFIT_MARGIN', name: '18. Item Profit Margin', category: 'FINANCIAL', description: 'Margin analysis and markup per product', icon: PieChart },
  { id: 'EXPENSE_REPORT', name: '19. Expense Report', category: 'FINANCIAL', description: 'Categorized store operating expenses breakdown', icon: CreditCard },
  { id: 'CASH_BANK_BALANCE', name: '20. Cash & Bank Balance', category: 'FINANCIAL', description: 'Real-time cash, eSewa, Khalti, QR & bank funds', icon: Wallet },
];

export const ReportsView: React.FC = () => {
  const {
    invoices,
    purchases,
    customers,
    suppliers,
    expenses,
    products,
    shopProfile,
    khataTransactions,
    salesReturns,
    purchaseReturns,
    staffPayments,
    recordCustomerKhataPayment,
    recordSupplierDebtPayment,
    setActiveTab,
  } = useApp();

  // Active Report Selection State
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('SALES');
  const [activeReportId, setActiveReportId] = useState<ReportId>('SALES_SUMMARY');

  // Date Range Filter State
  const [dateRangeFilter, setDateRangeFilter] = useState<'ALL' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Search Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isSalesReturnModalOpen, setIsSalesReturnModalOpen] = useState(false);
  const [isPurchaseReturnModalOpen, setIsPurchaseReturnModalOpen] = useState(false);

  // Selector state for single item ledger or party statement
  const [selectedLedgerProductId, setSelectedLedgerProductId] = useState<string>(products[0]?.id || '');
  const [selectedPartyId, setSelectedPartyId] = useState<string>(customers[0]?.id ? `CUST-${customers[0].id}` : '');
  const [selectedDaybookDate, setSelectedDaybookDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Date Range Helper Filter Function
  const isDateInRange = (dateStr: string) => {
    if (dateRangeFilter === 'ALL') return true;
    if (!dateStr) return true;
    const d = new Date(dateStr);
    const dFormatted = dateStr.split('T')[0];
    const now = new Date();

    if (dateRangeFilter === 'DAILY') {
      return d.toDateString() === now.toDateString();
    }
    if (dateRangeFilter === 'WEEKLY') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return d >= oneWeekAgo;
    }
    if (dateRangeFilter === 'MONTHLY') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (dateRangeFilter === 'CUSTOM') {
      let valid = true;
      if (customStartDate) valid = valid && dFormatted >= customStartDate;
      if (customEndDate) valid = valid && dFormatted <= customEndDate;
      return valid;
    }
    return true;
  };

  // Filtered Datasets
  const filteredInvoices = useMemo(() => invoices.filter((inv) => isDateInRange(inv.createdAt)), [invoices, dateRangeFilter, customStartDate, customEndDate]);
  const filteredPurchases = useMemo(() => purchases.filter((p) => isDateInRange(p.purchaseDate)), [purchases, dateRangeFilter, customStartDate, customEndDate]);
  const filteredExpenses = useMemo(() => expenses.filter((e) => isDateInRange(e.expenseDate || e.createdAt)), [expenses, dateRangeFilter, customStartDate, customEndDate]);
  const filteredSalesReturns = useMemo(() => salesReturns.filter((r) => isDateInRange(r.returnDate)), [salesReturns, dateRangeFilter, customStartDate, customEndDate]);
  const filteredPurchaseReturns = useMemo(() => purchaseReturns.filter((r) => isDateInRange(r.returnDate)), [purchaseReturns, dateRangeFilter, customStartDate, customEndDate]);

  // CSV Export Handler
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    const reportName = ALL_REPORTS.find((r) => r.id === activeReportId)?.name || 'Report';

    if (activeReportId === 'SALES_SUMMARY' || activeReportId === 'PARTY_SALES') {
      headers = ['Invoice No', 'Date', 'Customer', 'Subtotal', 'Discount', 'VAT', 'Net Total', 'Cash', 'QR', 'Udharo'];
      rows = filteredInvoices.map((inv) => [
        inv.invoiceNo,
        new Date(inv.createdAt).toLocaleString(),
        `"${inv.customerName}"`,
        inv.subtotal,
        inv.discount,
        inv.taxAmount,
        inv.netAmount,
        inv.splitPayment.cash,
        inv.splitPayment.qr,
        inv.splitPayment.udharo,
      ]);
    } else if (activeReportId === 'STOCK_SUMMARY' || activeReportId === 'STOCK_VALUATION') {
      headers = ['Product Name', 'SKU', 'Category', 'Stock Qty', 'Unit', 'Cost Price', 'Selling Price', 'Cost Valuation', 'Retail Valuation'];
      rows = products.map((p) => [
        `"${p.name}"`,
        p.sku,
        p.category,
        p.stockQty,
        p.unit.primaryUnit,
        p.unit.primaryCostPrice,
        p.unit.primarySellingPrice,
        p.stockQty * p.unit.primaryCostPrice,
        p.stockQty * p.unit.primarySellingPrice,
      ]);
    } else if (activeReportId === 'CUSTOMER_RECEIVABLES') {
      headers = ['Customer Name', 'Phone', 'Credit Balance (Udharo)', 'Credit Limit', 'Due Date'];
      rows = customers.filter((c) => c.currentBalance > 0).map((c) => [
        `"${c.name}"`,
        c.phone,
        c.currentBalance,
        c.creditLimit,
        c.dueDate || 'N/A',
      ]);
    } else {
      headers = ['Ref ID', 'Date', 'Description', 'Amount'];
      rows = filteredInvoices.map((inv) => [inv.invoiceNo, inv.createdAt.split('T')[0], `"${inv.customerName}"`, inv.netAmount]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // WhatsApp Payment Reminder Helper
  const sendWhatsAppReminder = (customerName: string, phone: string, amount: number) => {
    const formattedPhone = phone.replace(/[^0-9]/g, '');
    const fullPhone = formattedPhone.startsWith('977') ? formattedPhone : `977${formattedPhone}`;
    const text = encodeURIComponent(
      `Namaste ${customerName} ji! Warm greetings from ${shopProfile.shopName}.\n\nThis is a polite reminder regarding your pending credit (Udharo) balance of NPR ${amount.toLocaleString()} at our store.\n\nKindly request you to settle the balance at your earliest convenience via Cash or eSewa/Fonepay QR. Thank you for your continued business!`
    );
    window.open(`https://wa.me/${fullPhone}?text=${text}`, '_blank');
  };

  // Category Selector Tabs
  const categories: { key: ReportCategory; label: string; count: number }[] = [
    { key: 'SALES', label: '1. Sales Reports', count: 4 },
    { key: 'PURCHASE', label: '2. Purchase Reports', count: 4 },
    { key: 'INVENTORY', label: '3. Inventory & Stock', count: 4 },
    { key: 'PARTY', label: '4. Receivables & Payables', count: 3 },
    { key: 'FINANCIAL', label: '5. Financial & Operations', count: 5 },
  ];

  const categoryReports = ALL_REPORTS.filter((r) => r.category === activeCategory);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      {/* Top Header & Date Range Station */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Reports & Financial Analytics</span>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    20 Active Reports
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Comprehensive sales, procurement, inventory audit, party ledgers & P&L statements
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Date Filter, PDF Export, CSV Export */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {(['ALL', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRangeFilter(range)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                    dateRangeFilter === range
                      ? 'bg-indigo-600 text-white shadow-2xs dark:bg-indigo-500'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {dateRangeFilter === 'CUSTOM' && (
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl text-xs">
                <span className="text-slate-500 font-bold">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-bold text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />
                <span className="text-slate-500 font-bold">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-bold text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />
              </div>
            )}

            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
              title="Printable Statement PDF"
            >
              <Printer className="h-4 w-4" />
              <span>Export PDF</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
              title="Export Current Report CSV"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 5 Category Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => {
                setActiveCategory(cat.key);
                const firstRep = ALL_REPORTS.find((r) => r.category === cat.key);
                if (firstRep) setActiveReportId(firstRep.id);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeCategory === cat.key
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  activeCategory === cat.key
                    ? 'bg-indigo-500 text-white dark:bg-indigo-600'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {cat.count} Reports
              </span>
            </button>
          ))}
        </div>

        {/* Specific Report Sub-Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categoryReports.map((report) => {
            const Icon = report.icon;
            const isSelected = activeReportId === report.id;
            return (
              <button
                key={report.id}
                onClick={() => setActiveReportId(report.id)}
                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer shrink-0 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-300 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Icon className={`h-4 w-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span>{report.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEARCH BAR & ACTIVE REPORT TITLE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{ALL_REPORTS.find((r) => r.id === activeReportId)?.name}</span>
          </h3>
          <p className="text-xs text-slate-500">
            {ALL_REPORTS.find((r) => r.id === activeReportId)?.description}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search report records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* ========================================================================================= */}
      {/* 20 DETAILED REPORTS CONDITIONAL RENDER ENGINE */}
      {/* ========================================================================================= */}

      {/* REPORT 1: SALES SUMMARY REPORT */}
      {activeReportId === 'SALES_SUMMARY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold uppercase text-slate-400">Total Net Sales</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                NPR {filteredInvoices.reduce((sum, inv) => sum + inv.netAmount, 0).toLocaleString()}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{filteredInvoices.length} invoices generated</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold uppercase text-slate-400">VAT Tax Collected</span>
              <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                NPR {filteredInvoices.reduce((sum, inv) => sum + inv.taxAmount, 0).toLocaleString()}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Government VAT summary</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold uppercase text-slate-400">Total Discounts Granted</span>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                NPR {filteredInvoices.reduce((sum, inv) => sum + inv.discount, 0).toLocaleString()}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Retail promotions</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold uppercase text-slate-400">Payment Breakdown</span>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Cash:</span>
                  <span className="font-bold">NPR {filteredInvoices.reduce((sum, inv) => sum + inv.splitPayment.cash, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>QR/Bank:</span>
                  <span className="font-bold">NPR {filteredInvoices.reduce((sum, inv) => sum + inv.splitPayment.qr, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                  <span>Udharo Credit:</span>
                  <span className="font-bold">NPR {filteredInvoices.reduce((sum, inv) => sum + inv.splitPayment.udharo, 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4">Sales Transactions Log</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3 font-semibold">Invoice No</th>
                    <th className="p-3 font-semibold">Date & Time</th>
                    <th className="p-3 font-semibold">Customer</th>
                    <th className="p-3 font-semibold text-right">Subtotal</th>
                    <th className="p-3 font-semibold text-right">Discount</th>
                    <th className="p-3 font-semibold text-right">VAT Tax</th>
                    <th className="p-3 font-semibold text-right">Net Total</th>
                    <th className="p-3 font-semibold text-right">Payment Split</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredInvoices
                    .filter((inv) => inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) || inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{inv.invoiceNo}</td>
                        <td className="p-3 text-slate-500">{new Date(inv.createdAt).toLocaleString()}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{inv.customerName}</td>
                        <td className="p-3 text-right">NPR {inv.subtotal.toLocaleString()}</td>
                        <td className="p-3 text-right text-emerald-600">- NPR {inv.discount}</td>
                        <td className="p-3 text-right text-indigo-600">NPR {inv.taxAmount}</td>
                        <td className="p-3 text-right font-black text-slate-900 dark:text-white">NPR {inv.netAmount.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono text-[11px] text-slate-500">
                          Cash: {inv.splitPayment.cash} | QR: {inv.splitPayment.qr} | Udharo: {inv.splitPayment.udharo}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: PARTY-WISE SALES REPORT */}
      {activeReportId === 'PARTY_SALES' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 font-semibold">Customer Name</th>
                  <th className="p-3 font-semibold">Phone</th>
                  <th className="p-3 font-semibold text-center">Invoices Count</th>
                  <th className="p-3 font-semibold text-right">Total Spent</th>
                  <th className="p-3 font-semibold text-right">Avg Order Value</th>
                  <th className="p-3 font-semibold text-right">Current Udharo Credit</th>
                  <th className="p-3 font-semibold text-right">Last Purchase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {customers
                  .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm))
                  .map((cust) => {
                    const custInvoices = filteredInvoices.filter((inv) => inv.customerName === cust.name || inv.customerId === cust.id);
                    const totalSpent = custInvoices.reduce((sum, inv) => sum + inv.netAmount, 0);
                    const avgOrder = custInvoices.length > 0 ? totalSpent / custInvoices.length : 0;
                    return (
                      <tr key={cust.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{cust.name}</span>
                          {totalSpent > 10000 && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              VIP Party
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-500">{cust.phone}</td>
                        <td className="p-3 text-center font-bold text-indigo-600">{custInvoices.length}</td>
                        <td className="p-3 text-right font-black text-slate-900 dark:text-white">NPR {totalSpent.toLocaleString()}</td>
                        <td className="p-3 text-right font-semibold text-slate-600">NPR {Math.round(avgOrder).toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-rose-600">
                          {cust.currentBalance > 0 ? `NPR ${cust.currentBalance.toLocaleString()}` : 'NPR 0'}
                        </td>
                        <td className="p-3 text-right text-slate-400">{cust.lastPurchaseDate || 'Recent'}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 3: ITEM-WISE SALES REPORT */}
      {activeReportId === 'ITEM_SALES' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 font-semibold">Product Name</th>
                  <th className="p-3 font-semibold">SKU</th>
                  <th className="p-3 font-semibold">Category</th>
                  <th className="p-3 font-semibold text-center">Units Sold</th>
                  <th className="p-3 font-semibold text-right">Gross Sales Revenue</th>
                  <th className="p-3 font-semibold text-right">Cost of Goods</th>
                  <th className="p-3 font-semibold text-right">Net Profit</th>
                  <th className="p-3 font-semibold text-center">Sales Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {products
                  .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((prod) => {
                    let unitsSold = 0;
                    let grossRevenue = 0;
                    let totalCost = 0;

                    filteredInvoices.forEach((inv) => {
                      inv.items.forEach((item) => {
                        if (item.productId === prod.id || item.sku === prod.sku) {
                          const isSecondary = item.unitName === prod.unit.secondaryUnit;
                          const ratio = isSecondary ? prod.unit.conversionRatio || 1 : 1;
                          unitsSold += item.quantity * ratio;
                          grossRevenue += item.totalPrice;
                          const unitCost = isSecondary ? prod.unit.secondaryCostPrice ?? prod.unit.primaryCostPrice * ratio : prod.unit.primaryCostPrice;
                          totalCost += item.quantity * unitCost;
                        }
                      });
                    });

                    const netProfit = grossRevenue - totalCost;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{prod.name}</td>
                        <td className="p-3 font-mono text-slate-500">{prod.sku}</td>
                        <td className="p-3 font-semibold text-slate-600">{prod.category}</td>
                        <td className="p-3 text-center font-bold text-emerald-600">{unitsSold} {prod.unit.primaryUnit}</td>
                        <td className="p-3 text-right font-black text-slate-900 dark:text-white">NPR {grossRevenue.toLocaleString()}</td>
                        <td className="p-3 text-right text-slate-500">NPR {totalCost.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">NPR {netProfit.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          {unitsSold > 10 ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Best Seller 🔥
                            </span>
                          ) : unitsSold === 0 ? (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Zero Sales
                            </span>
                          ) : (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              Moderate
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 4: SALES RETURN REPORT */}
      {activeReportId === 'SALES_RETURN' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Sales Returns & Customer Refunds Log</h4>
              <p className="text-xs text-slate-500">Log customer returns to automatically adjust inventory back into stock</p>
            </div>
            <button
              onClick={() => setIsSalesReturnModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Record Sales Return</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3 font-semibold">Return No</th>
                    <th className="p-3 font-semibold">Date</th>
                    <th className="p-3 font-semibold">Original Invoice</th>
                    <th className="p-3 font-semibold">Customer Name</th>
                    <th className="p-3 font-semibold">Returned Items</th>
                    <th className="p-3 font-semibold text-right">Total Refund</th>
                    <th className="p-3 font-semibold">Refund Method</th>
                    <th className="p-3 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredSalesReturns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">No sales returns recorded in this timeframe.</td>
                    </tr>
                  ) : (
                    filteredSalesReturns.map((ret) => (
                      <tr key={ret.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-rose-600">{ret.returnNo}</td>
                        <td className="p-3 text-slate-500">{ret.returnDate}</td>
                        <td className="p-3 font-mono text-indigo-600">{ret.invoiceNo}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{ret.customerName}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          {ret.items.map((i) => `${i.productName} (${i.quantity} ${i.unitName})`).join(', ')}
                        </td>
                        <td className="p-3 text-right font-black text-rose-600">NPR {ret.totalRefundAmount.toLocaleString()}</td>
                        <td className="p-3 font-semibold text-slate-600">{ret.refundMethod}</td>
                        <td className="p-3 text-slate-500">{ret.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 5: PURCHASE SUMMARY REPORT */}
      {activeReportId === 'PURCHASE_SUMMARY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold uppercase text-slate-400">Total Purchase Expenses</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                NPR {filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString()}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{filteredPurchases.length} stock purchase orders</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold uppercase text-slate-400">Total Cash/Bank Paid</span>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                NPR {filteredPurchases.reduce((sum, p) => sum + p.cashPaid, 0).toLocaleString()}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Sourced with immediate payment</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold uppercase text-slate-400">Supplier Credit Owed</span>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                NPR {filteredPurchases.reduce((sum, p) => sum + p.supplierCredit, 0).toLocaleString()}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Vendor payables balance</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4">Stock Procurement Orders</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3 font-semibold">Purchase No</th>
                    <th className="p-3 font-semibold">Vendor Name</th>
                    <th className="p-3 font-semibold">Invoice Ref</th>
                    <th className="p-3 font-semibold">Date</th>
                    <th className="p-3 font-semibold text-right">Total Amount</th>
                    <th className="p-3 font-semibold text-right">Paid Cash</th>
                    <th className="p-3 font-semibold text-right">Supplier Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredPurchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-indigo-600">{p.purchaseNo}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{p.supplierName}</td>
                      <td className="p-3 font-mono text-slate-500">{p.invoiceRef}</td>
                      <td className="p-3 text-slate-500">{p.purchaseDate}</td>
                      <td className="p-3 text-right font-black text-slate-900 dark:text-white">NPR {p.totalAmount.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">NPR {p.cashPaid.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-amber-600">NPR {p.supplierCredit.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 6: PARTY-WISE PURCHASE REPORT */}
      {activeReportId === 'PARTY_PURCHASE' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 font-semibold">Supplier Name</th>
                  <th className="p-3 font-semibold">Company</th>
                  <th className="p-3 font-semibold">Phone</th>
                  <th className="p-3 font-semibold text-center">Orders Count</th>
                  <th className="p-3 font-semibold text-right">Total Purchased</th>
                  <th className="p-3 font-semibold text-right">Pending Payables</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {suppliers.map((sup) => {
                  const supOrders = filteredPurchases.filter((p) => p.supplierName === sup.name || p.supplierId === sup.id);
                  const totalPurchased = supOrders.reduce((sum, p) => sum + p.totalAmount, 0);
                  return (
                    <tr key={sup.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{sup.name}</td>
                      <td className="p-3 text-slate-600">{sup.companyName || 'Supplier'}</td>
                      <td className="p-3 font-mono text-slate-500">{sup.phone}</td>
                      <td className="p-3 text-center font-bold text-indigo-600">{supOrders.length}</td>
                      <td className="p-3 text-right font-black text-slate-900 dark:text-white">NPR {totalPurchased.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-amber-600">NPR {sup.pendingPayable.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 7: ITEM-WISE PURCHASE REPORT */}
      {activeReportId === 'ITEM_PURCHASE' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 font-semibold">Product Name</th>
                  <th className="p-3 font-semibold">SKU</th>
                  <th className="p-3 font-semibold text-center">Total Quantity Received</th>
                  <th className="p-3 font-semibold text-right">Current Cost Rate</th>
                  <th className="p-3 font-semibold text-right">Total Procurement Expense</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {products.map((prod) => {
                  let totalQtyReceived = 0;
                  let totalSpend = 0;

                  filteredPurchases.forEach((pur) => {
                    pur.items.forEach((item) => {
                      if (item.productId === prod.id || item.productName === prod.name) {
                        totalQtyReceived += item.quantity;
                        totalSpend += item.totalAmount;
                      }
                    });
                  });

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{prod.name}</td>
                      <td className="p-3 font-mono text-slate-500">{prod.sku}</td>
                      <td className="p-3 text-center font-bold text-indigo-600">{totalQtyReceived} {prod.unit.primaryUnit}</td>
                      <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-300">NPR {prod.unit.primaryCostPrice}</td>
                      <td className="p-3 text-right font-black text-slate-900 dark:text-white">NPR {totalSpend.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 8: PURCHASE RETURN REPORT */}
      {activeReportId === 'PURCHASE_RETURN' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Purchase Returns to Suppliers Log</h4>
              <p className="text-xs text-slate-500">Log vendor returns to automatically reduce payables and inventory</p>
            </div>
            <button
              onClick={() => setIsPurchaseReturnModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Record Purchase Return</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3 font-semibold">Return No</th>
                    <th className="p-3 font-semibold">Date</th>
                    <th className="p-3 font-semibold">Purchase Ref</th>
                    <th className="p-3 font-semibold">Supplier Name</th>
                    <th className="p-3 font-semibold">Returned Items</th>
                    <th className="p-3 font-semibold text-right">Refund / Credit Amount</th>
                    <th className="p-3 font-semibold">Adjustment Method</th>
                    <th className="p-3 font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredPurchaseReturns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">No purchase returns recorded in this timeframe.</td>
                    </tr>
                  ) : (
                    filteredPurchaseReturns.map((ret) => (
                      <tr key={ret.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-amber-600">{ret.returnNo}</td>
                        <td className="p-3 text-slate-500">{ret.returnDate}</td>
                        <td className="p-3 font-mono text-slate-500">{ret.purchaseNo || 'N/A'}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{ret.supplierName}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          {ret.items.map((i) => `${i.productName} (${i.quantity} ${i.unitName})`).join(', ')}
                        </td>
                        <td className="p-3 text-right font-black text-amber-600">NPR {ret.totalRefundAmount.toLocaleString()}</td>
                        <td className="p-3 font-semibold text-slate-600">{ret.refundMethod}</td>
                        <td className="p-3 text-slate-500">{ret.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 9: STOCK SUMMARY REPORT */}
      {activeReportId === 'STOCK_SUMMARY' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 font-semibold">Product Name</th>
                  <th className="p-3 font-semibold">SKU / Barcode</th>
                  <th className="p-3 font-semibold">Category</th>
                  <th className="p-3 font-semibold text-center">Current Available Qty</th>
                  <th className="p-3 font-semibold">UOM (Unit of Measure)</th>
                  <th className="p-3 font-semibold">Rack Location</th>
                  <th className="p-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {products
                  .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                      <td className="p-3 font-mono text-slate-500">{p.sku} {p.barcode ? `(${p.barcode})` : ''}</td>
                      <td className="p-3 font-semibold text-slate-600">{p.category}</td>
                      <td className="p-3 text-center font-black text-slate-900 dark:text-white text-sm">
                        {p.stockQty} {p.unit.primaryUnit}
                      </td>
                      <td className="p-3 text-slate-600">
                        Primary: {p.unit.primaryUnit} {p.unit.secondaryUnit ? `| Secondary: ${p.unit.secondaryUnit} (Ratio ${p.unit.conversionRatio})` : ''}
                      </td>
                      <td className="p-3 font-mono text-slate-500">{p.rackNo || 'General Rack'}</td>
                      <td className="p-3 text-center">
                        {p.stockQty === 0 ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 dark:bg-red-950 dark:text-red-300">
                            Out of Stock
                          </span>
                        ) : p.stockQty <= p.minStockAlert ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Low Stock
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 10: STOCK VALUATION REPORT */}
      {activeReportId === 'STOCK_VALUATION' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold uppercase text-slate-400">Total Asset Valuation (Cost Price)</span>
              <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                NPR {products.reduce((sum, p) => sum + p.stockQty * p.unit.primaryCostPrice, 0).toLocaleString()}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Wholesale capital locked in inventory</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold uppercase text-slate-400">Total Retail Valuation (Selling Price)</span>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                NPR {products.reduce((sum, p) => sum + p.stockQty * p.unit.primarySellingPrice, 0).toLocaleString()}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Potential gross retail value</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold uppercase text-slate-400">Potential Gross Profit</span>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                NPR {products.reduce((sum, p) => sum + p.stockQty * (p.unit.primarySellingPrice - p.unit.primaryCostPrice), 0).toLocaleString()}
              </h3>
              <p className="text-xs text-slate-500 mt-1">Expected margin on stock sell-out</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3 font-semibold">Product Name</th>
                    <th className="p-3 font-semibold text-center">Available Stock</th>
                    <th className="p-3 font-semibold text-right">Cost Price</th>
                    <th className="p-3 font-semibold text-right">Selling Price</th>
                    <th className="p-3 font-semibold text-right">Cost Valuation (NPR)</th>
                    <th className="p-3 font-semibold text-right">Retail Valuation (NPR)</th>
                    <th className="p-3 font-semibold text-right">Potential Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {products.map((p) => {
                    const costVal = p.stockQty * p.unit.primaryCostPrice;
                    const retailVal = p.stockQty * p.unit.primarySellingPrice;
                    const potProfit = retailVal - costVal;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                        <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">{p.stockQty} {p.unit.primaryUnit}</td>
                        <td className="p-3 text-right text-slate-600">NPR {p.unit.primaryCostPrice}</td>
                        <td className="p-3 text-right text-slate-600">NPR {p.unit.primarySellingPrice}</td>
                        <td className="p-3 text-right font-bold text-indigo-600">NPR {costVal.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">NPR {retailVal.toLocaleString()}</td>
                        <td className="p-3 text-right font-black text-amber-600">NPR {potProfit.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 11: LOW STOCK / REORDER REPORT */}
      {activeReportId === 'LOW_STOCK' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 font-semibold">Product Name</th>
                  <th className="p-3 font-semibold">SKU</th>
                  <th className="p-3 font-semibold text-center">Current Stock</th>
                  <th className="p-3 font-semibold text-center">Min Alert Level</th>
                  <th className="p-3 font-semibold text-center">Shortfall Qty</th>
                  <th className="p-3 font-semibold">Preferred Supplier</th>
                  <th className="p-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {products
                  .filter((p) => p.stockQty <= p.minStockAlert)
                  .map((p) => {
                    const shortfall = Math.max(1, p.minStockAlert * 2 - p.stockQty);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                          <span>{p.name}</span>
                        </td>
                        <td className="p-3 font-mono text-slate-500">{p.sku}</td>
                        <td className="p-3 text-center font-black text-red-600">{p.stockQty} {p.unit.primaryUnit}</td>
                        <td className="p-3 text-center font-bold text-slate-600">{p.minStockAlert} {p.unit.primaryUnit}</td>
                        <td className="p-3 text-center font-black text-indigo-600">+{shortfall} {p.unit.primaryUnit}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{p.supplierName || 'Default Supplier'}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setActiveTab('purchases')}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
                          >
                            Draft Reorder
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 12: ITEM MOVEMENT / ITEM LEDGER REPORT */}
      {activeReportId === 'ITEM_MOVEMENT' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Product to Audit Lifecycle:</label>
            <select
              value={selectedLedgerProductId}
              onChange={(e) => setSelectedLedgerProductId(e.target.value)}
              className="w-full sm:w-80 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.stockQty} {p.unit.primaryUnit})
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4">Complete Product Movement Audit Trail</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3 font-semibold">Date & Time</th>
                    <th className="p-3 font-semibold">Event Type</th>
                    <th className="p-3 font-semibold">Ref No</th>
                    <th className="p-3 font-semibold text-center">Qty Change</th>
                    <th className="p-3 font-semibold text-right">Performed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {/* Generate movement trail from invoices & purchases */}
                  {(() => {
                    const selProd = products.find((p) => p.id === selectedLedgerProductId);
                    if (!selProd) return <tr><td colSpan={5} className="p-4 text-center text-slate-400">Select a product</td></tr>;

                    const events: { date: string; type: string; ref: string; qtyChange: number; by: string }[] = [];

                    invoices.forEach((inv) => {
                      inv.items.forEach((item) => {
                        if (item.productId === selProd.id || item.productName === selProd.name) {
                          events.push({
                            date: inv.createdAt,
                            type: 'POS SALE OUT',
                            ref: inv.invoiceNo,
                            qtyChange: -item.quantity,
                            by: inv.cashierName || 'Cashier',
                          });
                        }
                      });
                    });

                    purchases.forEach((pur) => {
                      pur.items.forEach((item) => {
                        if (item.productId === selProd.id || item.productName === selProd.name) {
                          events.push({
                            date: pur.purchaseDate,
                            type: 'STOCK PURCHASE IN',
                            ref: pur.purchaseNo,
                            qtyChange: +item.quantity,
                            by: pur.performedBy || 'Store Manager',
                          });
                        }
                      });
                    });

                    return events.map((ev, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 text-slate-500">{new Date(ev.date).toLocaleString()}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{ev.type}</td>
                        <td className="p-3 font-mono text-indigo-600">{ev.ref}</td>
                        <td className={`p-3 text-center font-black ${ev.qtyChange < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {ev.qtyChange > 0 ? `+${ev.qtyChange}` : ev.qtyChange} {selProd.unit.primaryUnit}
                        </td>
                        <td className="p-3 text-right text-slate-600">{ev.by}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 13: CUSTOMER RECEIVABLES REPORT */}
      {activeReportId === 'CUSTOMER_RECEIVABLES' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 font-semibold">Customer Name</th>
                  <th className="p-3 font-semibold">Phone</th>
                  <th className="p-3 font-semibold text-right">Credit Balance (Udharo)</th>
                  <th className="p-3 font-semibold text-right">Credit Limit</th>
                  <th className="p-3 font-semibold text-center">Due Date</th>
                  <th className="p-3 font-semibold text-center">Payment Reminder Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {customers
                  .filter((c) => c.currentBalance > 0)
                  .map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{cust.name}</td>
                      <td className="p-3 font-mono text-slate-500">{cust.phone}</td>
                      <td className="p-3 text-right font-black text-rose-600 text-sm">
                        NPR {cust.currentBalance.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-semibold text-slate-500">NPR {cust.creditLimit.toLocaleString()}</td>
                      <td className="p-3 text-center font-semibold text-amber-600">{cust.dueDate || 'Standard 30-Day'}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => sendWhatsAppReminder(cust.name, cust.phone, cust.currentBalance)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>WhatsApp</span>
                          </button>
                          <button
                            onClick={() => setActiveTab('khata')}
                            className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-700 transition"
                          >
                            Settle Khata
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 14: SUPPLIER PAYABLES REPORT */}
      {activeReportId === 'SUPPLIER_PAYABLES' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 font-semibold">Vendor Name</th>
                  <th className="p-3 font-semibold">Company</th>
                  <th className="p-3 font-semibold">Phone</th>
                  <th className="p-3 font-semibold text-right">Outstanding Payable Amount</th>
                  <th className="p-3 font-semibold text-center">Due Date</th>
                  <th className="p-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {suppliers
                  .filter((s) => s.pendingPayable > 0)
                  .map((sup) => (
                    <tr key={sup.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{sup.name}</td>
                      <td className="p-3 text-slate-600">{sup.companyName || 'Supplier'}</td>
                      <td className="p-3 font-mono text-slate-500">{sup.phone}</td>
                      <td className="p-3 text-right font-black text-amber-600 text-sm">
                        NPR {sup.pendingPayable.toLocaleString()}
                      </td>
                      <td className="p-3 text-center font-semibold text-amber-600">{sup.dueDate || 'Net 30'}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setActiveTab('khata')}
                          className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-700 transition"
                        >
                          Pay Vendor
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 15: PARTY STATEMENT / INDIVIDUAL LEDGER */}
      {activeReportId === 'PARTY_STATEMENT' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Customer or Supplier:</label>
            <select
              value={selectedPartyId}
              onChange={(e) => setSelectedPartyId(e.target.value)}
              className="w-full sm:w-80 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <optgroup label="Customers">
                {customers.map((c) => (
                  <option key={c.id} value={`CUST-${c.id}`}>
                    Customer: {c.name} ({c.phone})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Suppliers">
                {suppliers.map((s) => (
                  <option key={s.id} value={`SUPP-${s.id}`}>
                    Supplier: {s.name} ({s.companyName || 'Vendor'})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Bank-Style Account Statement</h4>
              <button
                onClick={() => setIsPdfModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
              >
                <Printer className="h-4 w-4" />
                <span>Print PDF Statement</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3 font-semibold">Date</th>
                    <th className="p-3 font-semibold">Transaction Details</th>
                    <th className="p-3 font-semibold">Ref No</th>
                    <th className="p-3 font-semibold text-right">Debit (+)</th>
                    <th className="p-3 font-semibold text-right">Credit (-)</th>
                    <th className="p-3 font-semibold text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {khataTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 text-slate-500">{tx.createdAt.split('T')[0]}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{tx.type}</td>
                      <td className="p-3 font-mono text-indigo-600">{tx.referenceInvoiceId || 'KHATA-REF'}</td>
                      <td className="p-3 text-right font-bold text-red-600">NPR {tx.amount.toLocaleString()}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">-</td>
                      <td className="p-3 text-right font-black text-slate-900 dark:text-white">NPR {tx.balanceAfter.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 16: DAYBOOK / DAILY TRANSACTION LOG */}
      {activeReportId === 'DAYBOOK' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Daybook Date:</span>
            <input
              type="date"
              value={selectedDaybookDate}
              onChange={(e) => setSelectedDaybookDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4">Chronological Daily Entry Log</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3 font-semibold">Time</th>
                    <th className="p-3 font-semibold">Type</th>
                    <th className="p-3 font-semibold">Party / Description</th>
                    <th className="p-3 font-semibold text-right">Cash In (+)</th>
                    <th className="p-3 font-semibold text-right">Cash Out (-)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 text-slate-500">{new Date(inv.createdAt).toLocaleTimeString()}</td>
                      <td className="p-3 font-bold text-emerald-600">POS Sale</td>
                      <td className="p-3 text-slate-900 dark:text-white">{inv.customerName} ({inv.invoiceNo})</td>
                      <td className="p-3 text-right font-black text-emerald-600">NPR {inv.splitPayment.cash.toLocaleString()}</td>
                      <td className="p-3 text-right text-slate-400">-</td>
                    </tr>
                  ))}
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 text-slate-500">{exp.createdAt.split('T')[1]?.slice(0, 5) || '12:00'}</td>
                      <td className="p-3 font-bold text-rose-600">Store Expense</td>
                      <td className="p-3 text-slate-900 dark:text-white">{exp.title} ({exp.category})</td>
                      <td className="p-3 text-right text-slate-400">-</td>
                      <td className="p-3 text-right font-black text-rose-600">NPR {exp.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 17: PROFIT & LOSS STATEMENT */}
      {activeReportId === 'PROFIT_LOSS' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Profit & Loss (P&L) Financial Performance Statement</h3>

          <div className="space-y-3 divide-y divide-slate-200 dark:divide-slate-800 text-sm">
            <div className="flex justify-between font-bold pt-2">
              <span className="text-slate-700 dark:text-slate-300">1. Gross Revenue (Sales Turnover):</span>
              <span className="text-emerald-600 font-extrabold">
                + NPR {filteredInvoices.reduce((sum, inv) => sum + inv.netAmount, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between pt-2 text-slate-600 dark:text-slate-400">
              <span>Less: Estimated Cost of Goods Sold (COGS):</span>
              <span className="text-red-500">
                - NPR {filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between font-extrabold pt-2 text-base text-slate-900 dark:text-white">
              <span>Gross Operating Profit:</span>
              <span className="text-indigo-600">
                NPR {(filteredInvoices.reduce((sum, inv) => sum + inv.netAmount, 0) - filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0)).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between pt-2 text-slate-600 dark:text-slate-400">
              <span>Less: Operational Expenses & Salaries:</span>
              <span className="text-red-500">
                - NPR {(filteredExpenses.reduce((sum, e) => sum + e.amount, 0) + staffPayments.reduce((sum, sp) => sum + sp.amount, 0)).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between font-black pt-3 text-lg border-t-2 border-slate-900 dark:border-white">
              <span>NET OPERATING PROFIT / LOSS:</span>
              <span className="text-emerald-600 font-black">
                NPR {(
                  filteredInvoices.reduce((sum, inv) => sum + inv.netAmount, 0) -
                  filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0) -
                  filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 18: ITEM-WISE PROFIT MARGIN REPORT */}
      {activeReportId === 'ITEM_PROFIT_MARGIN' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 font-semibold">Product Name</th>
                  <th className="p-3 font-semibold text-right">Cost Price</th>
                  <th className="p-3 font-semibold text-right">Selling Price</th>
                  <th className="p-3 font-semibold text-right">Unit Profit (NPR)</th>
                  <th className="p-3 font-semibold text-right">Profit Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {products.map((p) => {
                  const unitProfit = p.unit.primarySellingPrice - p.unit.primaryCostPrice;
                  const marginPct = p.unit.primarySellingPrice > 0 ? (unitProfit / p.unit.primarySellingPrice) * 100 : 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                      <td className="p-3 text-right text-slate-600">NPR {p.unit.primaryCostPrice}</td>
                      <td className="p-3 text-right text-slate-600">NPR {p.unit.primarySellingPrice}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">NPR {unitProfit.toLocaleString()}</td>
                      <td className="p-3 text-right font-black text-indigo-600">{marginPct.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 19: EXPENSE REPORT */}
      {activeReportId === 'EXPENSE_REPORT' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 font-semibold">Expense No</th>
                  <th className="p-3 font-semibold">Category</th>
                  <th className="p-3 font-semibold">Title</th>
                  <th className="p-3 font-semibold text-right">Amount</th>
                  <th className="p-3 font-semibold">Payment Method</th>
                  <th className="p-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-indigo-600">{exp.expenseNo}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{exp.category}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{exp.title}</td>
                    <td className="p-3 text-right font-black text-rose-600">NPR {exp.amount.toLocaleString()}</td>
                    <td className="p-3 text-slate-600">{exp.paymentMethod}</td>
                    <td className="p-3 text-slate-500">{exp.expenseDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 20: CASH & BANK BALANCE REPORT */}
      {activeReportId === 'CASH_BANK_BALANCE' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-bold uppercase text-slate-400">Physical Cash-in-Hand</span>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              NPR {filteredInvoices.reduce((sum, inv) => sum + inv.splitPayment.cash, 0).toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Drawer register cash balance</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-bold uppercase text-slate-400">eSewa & Khalti QR Wallet</span>
            <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              NPR {filteredInvoices.reduce((sum, inv) => sum + inv.splitPayment.qr, 0).toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Digital wallet collections</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-bold uppercase text-slate-400">Bank Deposits & Fonepay</span>
            <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              NPR {khataTransactions.filter((t) => t.paymentMethod === 'BANK' || t.paymentMethod === 'FONEPAY').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Linked bank account balance</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-bold uppercase text-slate-400">Total Liquid Funds</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              NPR {(
                filteredInvoices.reduce((sum, inv) => sum + inv.splitPayment.cash + inv.splitPayment.qr, 0) +
                khataTransactions.filter((t) => t.paymentMethod === 'BANK' || t.paymentMethod === 'FONEPAY').reduce((sum, t) => sum + t.amount, 0)
              ).toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Total operational cash reserves</p>
          </div>
        </div>
      )}

      {/* ========================================================================================= */}
      {/* MODALS */}
      {/* ========================================================================================= */}

      <ReportPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        dateFilterLabel={dateRangeFilter}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        shopProfile={shopProfile}
        kpiInvoices={filteredInvoices}
        kpiExpenses={filteredExpenses}
        products={products}
        kpiTotalRevenue={filteredInvoices.reduce((sum, inv) => sum + inv.netAmount, 0)}
        kpiTotalProfit={filteredInvoices.reduce((sum, inv) => sum + inv.netAmount, 0) - filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0)}
        kpiTotalExpenses={filteredExpenses.reduce((sum, e) => sum + e.amount, 0)}
        kpiNetOperatingProfit={
          filteredInvoices.reduce((sum, inv) => sum + inv.netAmount, 0) -
          filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0) -
          filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
        }
        kpiTotalCash={filteredInvoices.reduce((sum, inv) => sum + inv.splitPayment.cash, 0)}
        kpiTotalQr={filteredInvoices.reduce((sum, inv) => sum + inv.splitPayment.qr, 0)}
        kpiTotalUdharo={filteredInvoices.reduce((sum, inv) => sum + inv.splitPayment.udharo, 0)}
      />

      <AddSalesReturnModal
        isOpen={isSalesReturnModalOpen}
        onClose={() => setIsSalesReturnModalOpen(false)}
      />

      <AddPurchaseReturnModal
        isOpen={isPurchaseReturnModalOpen}
        onClose={() => setIsPurchaseReturnModalOpen(false)}
      />
    </div>
  );
};
