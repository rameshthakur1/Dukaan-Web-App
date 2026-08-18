import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice, StockPurchase, KhataTransaction, Expense } from '../../types';
import { ThermalReceiptModal } from '../pos/ThermalReceiptModal';
import { AuditLogView } from '../audit/AuditLogView';
import {
  FileText,
  Printer,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingCart,
  Truck,
  BookOpen,
  Eye,
  X,
  Activity,
  Layers,
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  Users,
  Receipt,
  Wallet,
  ShieldCheck,
} from 'lucide-react';

interface CombinedDocument {
  id: string;
  docType: 'SELL' | 'BUY' | 'EXPENSE';
  docNo: string;
  createdAt: string;
  partyName: string;
  partyPhone: string;
  itemCount: number;
  totalAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  performedBy?: string;
  rawInvoice?: Invoice;
  rawPurchase?: StockPurchase;
  rawExpense?: Expense;
}

interface ActivityItem {
  id: string;
  type: 'CASH_COLLECT' | 'PAID_SUPPLIER' | 'SELLED' | 'BUYED' | 'EXPENSE' | 'CUSTOMER_CREDIT' | 'SUPPLIER_DEBT';
  title: string;
  partyName: string;
  partyType: 'CUSTOMER' | 'SUPPLIER' | 'GENERAL';
  amount: number;
  isPositive: boolean;
  timestamp: string;
  details: string;
  performedBy?: string;
  referenceNo?: string;
}

export const TransactionHistory: React.FC = () => {
  const { invoices, purchases, khataTransactions, expenses, auditLogs, activeShopName } = useApp();

  // Active Main View Tab
  const [mainTab, setMainTab] = useState<'INVOICES' | 'ACTIVITIES' | 'AUDIT_TRAIL'>('INVOICES');

  // Date Range Filter States
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Invoices Tab Filters
  const [docTypeFilter, setDocTypeFilter] = useState<'ALL' | 'SELL' | 'BUY' | 'EXPENSE'>('ALL');
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Activities Tab Filters
  const [activityFilter, setActivityFilter] = useState<'ALL' | 'CASH_COLLECT' | 'PAID_SUPPLIER' | 'SELLED' | 'BUYED' | 'EXPENSE'>('ALL');
  const [activitySearch, setActivitySearch] = useState('');

  // Modals
  const [reprintInvoice, setReprintInvoice] = useState<Invoice | null>(null);
  const [viewPurchase, setViewPurchase] = useState<StockPurchase | null>(null);
  const [viewExpense, setViewExpense] = useState<Expense | null>(null);

  // Date Filter Evaluator
  const isDateInFilter = (dateStr: string) => {
    if (datePreset === 'ALL') return true;
    const d = new Date(dateStr);
    const now = new Date();

    if (datePreset === 'TODAY') {
      return d.toDateString() === now.toDateString();
    }

    if (datePreset === 'THIS_WEEK') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return d >= startOfWeek;
    }

    if (datePreset === 'THIS_MONTH') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }

    if (datePreset === 'CUSTOM') {
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        if (d < s) return false;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        if (d > e) return false;
      }
      return true;
    }

    return true;
  };

  // 1. Combine Sales Invoices, Purchase Bills and Shop Expenses
  const combinedDocuments: CombinedDocument[] = useMemo(() => {
    const sellDocs: CombinedDocument[] = invoices.map((inv) => ({
      id: `sell-${inv.id}`,
      docType: 'SELL',
      docNo: inv.invoiceNo,
      createdAt: inv.createdAt,
      partyName: inv.customerName,
      partyPhone: inv.customerPhone,
      itemCount: inv.items.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: inv.netAmount,
      paymentStatus: inv.paymentStatus,
      performedBy: inv.cashierName || inv.shopName || activeShopName || 'Store Staff',
      rawInvoice: inv,
    }));

    const buyDocs: CombinedDocument[] = purchases.map((pur) => {
      let status: 'PAID' | 'PARTIAL' | 'UNPAID' = 'PAID';
      if (pur.supplierCredit > 0 && pur.cashPaid > 0) status = 'PARTIAL';
      else if (pur.supplierCredit > 0 && pur.cashPaid === 0) status = 'UNPAID';

      return {
        id: `buy-${pur.id}`,
        docType: 'BUY',
        docNo: pur.purchaseNo,
        createdAt: pur.purchaseDate,
        partyName: pur.supplierName,
        partyPhone: 'N/A',
        itemCount: pur.items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: pur.totalAmount,
        paymentStatus: status,
        performedBy: pur.performedBy || 'Store Owner',
        rawPurchase: pur,
      };
    });

    const expenseDocs: CombinedDocument[] = (expenses || []).map((exp) => ({
      id: `exp-${exp.id}`,
      docType: 'EXPENSE',
      docNo: exp.expenseNo || `EXP-${exp.id.slice(0, 6)}`,
      createdAt: exp.expenseDate || exp.createdAt,
      partyName: exp.title + (exp.paidTo ? ` (${exp.paidTo})` : ''),
      partyPhone: exp.category,
      itemCount: 1,
      totalAmount: exp.amount,
      paymentStatus: 'PAID',
      performedBy: exp.performedBy || 'Store Owner',
      rawExpense: exp,
    }));

    const merged = [...sellDocs, ...buyDocs, ...expenseDocs];
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return merged;
  }, [invoices, purchases, expenses]);

  const filteredDocs = useMemo(() => {
    return combinedDocuments.filter((doc) => {
      const matchesType = docTypeFilter === 'ALL' || doc.docType === docTypeFilter;
      const matchesDate = isDateInFilter(doc.createdAt);
      const q = invoiceSearch.toLowerCase();
      const matchesSearch =
        doc.docNo.toLowerCase().includes(q) ||
        doc.partyName.toLowerCase().includes(q) ||
        doc.partyPhone.includes(q);
      return matchesType && matchesDate && matchesSearch;
    });
  }, [combinedDocuments, docTypeFilter, invoiceSearch, datePreset, startDate, endDate]);

  // 2. Synthesize Real-Time Activity Log
  const activities: ActivityItem[] = useMemo(() => {
    const list: ActivityItem[] = [];

    // Sales Activities (Goods Selled)
    invoices.forEach((inv) => {
      list.push({
        id: `act-inv-${inv.id}`,
        type: 'SELLED',
        title: `Selled Goods (Invoice #${inv.invoiceNo})`,
        partyName: inv.customerName,
        partyType: 'CUSTOMER',
        amount: inv.netAmount,
        isPositive: true,
        timestamp: inv.createdAt,
        details: `${inv.items.length} items (${inv.items.reduce((s, i) => s + i.quantity, 0)} pcs) • Cash/QR: NPR ${(inv.splitPayment.cash + inv.splitPayment.qr).toLocaleString()}`,
        performedBy: inv.cashierName || inv.shopName || activeShopName || 'Store Staff',
        referenceNo: inv.invoiceNo,
      });
    });

    // Stock Purchases (Goods Buyed)
    purchases.forEach((pur) => {
      list.push({
        id: `act-pur-${pur.id}`,
        type: 'BUYED',
        title: `Buyed Stock (Bill #${pur.purchaseNo})`,
        partyName: pur.supplierName,
        partyType: 'SUPPLIER',
        amount: pur.totalAmount,
        isPositive: false,
        timestamp: pur.purchaseDate,
        details: `${pur.items.length} items (${pur.items.reduce((s, i) => s + i.quantity, 0)} pcs) • Cash Paid: NPR ${pur.cashPaid.toLocaleString()}`,
        performedBy: pur.performedBy || 'Store Owner',
        referenceNo: pur.purchaseNo,
      });
    });

    // Khata Transactions (Cash Collected / Paid to Supplier)
    khataTransactions.forEach((tx) => {
      if (tx.entityType === 'CUSTOMER' && tx.type === 'PAYMENT_RECEIVED') {
        list.push({
          id: `act-kt-${tx.id}`,
          type: 'CASH_COLLECT',
          title: 'Cash Collected from Customer',
          partyName: tx.entityName,
          partyType: 'CUSTOMER',
          amount: tx.amount,
          isPositive: true,
          timestamp: tx.createdAt,
          details: `Udharo Khata Settlement via ${tx.paymentMethod || 'CASH'}${tx.note ? ` (${tx.note})` : ''}`,
          performedBy: tx.performedBy || 'Store Owner',
        });
      } else if (tx.entityType === 'SUPPLIER' && (tx.type === 'DEBT_PAID' || tx.type === 'PAYMENT_RECEIVED')) {
        list.push({
          id: `act-kt-${tx.id}`,
          type: 'PAID_SUPPLIER',
          title: 'Paid Cash to Supplier',
          partyName: tx.entityName,
          partyType: 'SUPPLIER',
          amount: tx.amount,
          isPositive: false,
          timestamp: tx.createdAt,
          details: `Vendor Dues Repayment via ${tx.paymentMethod || 'CASH'}${tx.note ? ` (${tx.note})` : ''}`,
          performedBy: tx.performedBy || 'Store Owner',
        });
      } else if (tx.entityType === 'CUSTOMER' && tx.type === 'CREDIT_GIVEN') {
        list.push({
          id: `act-kt-${tx.id}`,
          type: 'CUSTOMER_CREDIT',
          title: 'Customer Udharo Recorded',
          partyName: tx.entityName,
          partyType: 'CUSTOMER',
          amount: tx.amount,
          isPositive: false,
          timestamp: tx.createdAt,
          details: `Added to Udharo Ledger ${tx.note ? `(${tx.note})` : ''}`,
          performedBy: tx.performedBy || 'Store Owner',
        });
      }
    });

    // Shop Expenses
    (expenses || []).forEach((exp) => {
      list.push({
        id: `act-exp-${exp.id}`,
        type: 'EXPENSE',
        title: `Shop Expense (${exp.category})`,
        partyName: exp.title + (exp.paidTo ? ` - Paid to: ${exp.paidTo}` : ''),
        partyType: 'GENERAL',
        amount: exp.amount,
        isPositive: false,
        timestamp: exp.expenseDate || exp.createdAt,
        details: `Category: ${exp.category} • Method: ${exp.paymentMethod}${exp.notes ? ` • Note: ${exp.notes}` : ''}`,
        performedBy: exp.performedBy || 'Store Owner',
        referenceNo: exp.expenseNo,
      });
    });

    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list;
  }, [invoices, purchases, khataTransactions, expenses]);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchesType = activityFilter === 'ALL' || act.type === activityFilter;
      const matchesDate = isDateInFilter(act.timestamp);
      const q = activitySearch.toLowerCase();
      const matchesSearch =
        act.title.toLowerCase().includes(q) ||
        act.partyName.toLowerCase().includes(q) ||
        act.details.toLowerCase().includes(q) ||
        (act.referenceNo && act.referenceNo.toLowerCase().includes(q));
      return matchesType && matchesDate && matchesSearch;
    });
  }, [activities, activityFilter, activitySearch, datePreset, startDate, endDate]);

  // Activity stats based on filtered activities
  const totalCashCollected = filteredActivities
    .filter((a) => a.type === 'CASH_COLLECT')
    .reduce((sum, a) => sum + a.amount, 0);

  const totalPaidToSuppliers = filteredActivities
    .filter((a) => a.type === 'PAID_SUPPLIER')
    .reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      {/* Navigation & Date Filter Header Bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setMainTab('INVOICES')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
              mainTab === 'INVOICES'
                ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Old Invoices (Sell & Buy)</span>
            <span className="ml-1 rounded-full bg-indigo-500/30 px-2 py-0.5 text-[10px]">
              {filteredDocs.length}
            </span>
          </button>

          <button
            onClick={() => setMainTab('ACTIVITIES')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
              mainTab === 'ACTIVITIES'
                ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Activity Log</span>
            <span className="ml-1 rounded-full bg-emerald-500/30 px-2 py-0.5 text-[10px]">
              {filteredActivities.length}
            </span>
          </button>

          <button
            onClick={() => setMainTab('AUDIT_TRAIL')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
              mainTab === 'AUDIT_TRAIL'
                ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Audit Trail & System Logs</span>
            <span className="ml-1 rounded-full bg-purple-500/30 px-2 py-0.5 text-[10px]">
              {auditLogs.length}
            </span>
          </button>
        </div>

        {/* Top Right: Date Filter Dropdown */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
            <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Date:</span>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none dark:text-slate-200 cursor-pointer"
              id="history-date-filter-dropdown"
            >
              <option value="ALL" className="dark:bg-slate-900">All Time</option>
              <option value="TODAY" className="dark:bg-slate-900">Today</option>
              <option value="THIS_WEEK" className="dark:bg-slate-900">This Week</option>
              <option value="THIS_MONTH" className="dark:bg-slate-900">This Month</option>
              <option value="CUSTOM" className="dark:bg-slate-900">Custom Range</option>
            </select>
          </div>

          {datePreset === 'CUSTOM' && (
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              <span className="text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: INVOICES & BILLS (SELL AND BUY) */}
      {mainTab === 'INVOICES' && (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setDocTypeFilter('ALL')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  docTypeFilter === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                All Documents ({combinedDocuments.length})
              </button>

              <button
                onClick={() => setDocTypeFilter('SELL')}
                className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  docTypeFilter === 'SELL'
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Sell Invoices ({invoices.length})</span>
              </button>

              <button
                onClick={() => setDocTypeFilter('BUY')}
                className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  docTypeFilter === 'BUY'
                    ? 'bg-purple-600 text-white dark:bg-purple-500'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <Truck className="h-3.5 w-3.5" />
                <span>Buy Bills ({purchases.length})</span>
              </button>

              <button
                onClick={() => setDocTypeFilter('EXPENSE')}
                className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  docTypeFilter === 'EXPENSE'
                    ? 'bg-rose-600 text-white dark:bg-rose-500'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <Receipt className="h-3.5 w-3.5" />
                <span>Shop Expenses ({(expenses || []).length})</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                placeholder="Search invoice/bill no, name..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Documents Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/90 text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
                  <th className="p-3 font-semibold border-r border-slate-200 dark:border-slate-800">Type</th>
                  <th className="p-3 font-semibold border-r border-slate-200 dark:border-slate-800">Doc Ref No</th>
                  <th className="p-3 font-semibold border-r border-slate-200 dark:border-slate-800">Date & Time</th>
                  <th className="p-3 font-semibold border-r border-slate-200 dark:border-slate-800">Party / Title / Category</th>
                  <th className="p-3 font-semibold border-r border-slate-200 dark:border-slate-800">Performed By (ID Mark)</th>
                  <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Items / Type</th>
                  <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Total Amount</th>
                  <th className="p-3 font-semibold text-center border-r border-slate-200 dark:border-slate-800">Payment Status</th>
                  <th className="p-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No invoices, bills or expenses found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800/80 last:border-b-0">
                      <td className="p-3 border-r border-slate-200 dark:border-slate-800/80">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            doc.docType === 'SELL'
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                              : doc.docType === 'BUY'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {doc.docType === 'SELL' ? (
                            <>
                              <ShoppingCart className="h-3 w-3" />
                              <span>SELL</span>
                            </>
                          ) : doc.docType === 'BUY' ? (
                            <>
                              <Truck className="h-3 w-3" />
                              <span>BUY</span>
                            </>
                          ) : (
                            <>
                              <Receipt className="h-3 w-3" />
                              <span>EXPENSE</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800/80">
                        {doc.docNo}
                      </td>

                      <td className="p-3 text-slate-500 whitespace-nowrap border-r border-slate-200 dark:border-slate-800/80">
                        {new Date(doc.createdAt).toLocaleString()}
                      </td>

                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800/80">
                        {doc.partyName}
                        {doc.partyPhone !== 'N/A' && (
                          <div className="text-[10px] text-slate-400 font-normal font-mono">
                            {doc.docType === 'EXPENSE' ? `Category: ${doc.partyPhone}` : doc.partyPhone}
                          </div>
                        )}
                      </td>

                      <td className="p-3 border-r border-slate-200 dark:border-slate-800/80">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <Users className="h-3 w-3 text-indigo-500" />
                          <span>{doc.performedBy || 'Store Owner'}</span>
                        </span>
                      </td>

                      <td className="p-3 text-right font-medium text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800/80">
                        {doc.docType === 'EXPENSE' ? '1 Record' : `${doc.itemCount} Pcs`}
                      </td>

                      <td className="p-3 text-right font-extrabold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800/80">
                        NPR {doc.totalAmount.toLocaleString()}
                      </td>

                      <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800/80">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            doc.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                              : doc.paymentStatus === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                          }`}
                        >
                          {doc.paymentStatus}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        {doc.docType === 'SELL' && doc.rawInvoice ? (
                          <button
                            onClick={() => setReprintInvoice(doc.rawInvoice!)}
                            className="flex items-center gap-1 mx-auto rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                          >
                            <Printer className="h-3.5 w-3.5 text-indigo-500" />
                            <span>Reprint</span>
                          </button>
                        ) : doc.docType === 'BUY' && doc.rawPurchase ? (
                          <button
                            onClick={() => setViewPurchase(doc.rawPurchase!)}
                            className="flex items-center gap-1 mx-auto rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                          >
                            <Eye className="h-3.5 w-3.5 text-purple-500" />
                            <span>View Bill</span>
                          </button>
                        ) : doc.docType === 'EXPENSE' && doc.rawExpense ? (
                          <button
                            onClick={() => setViewExpense(doc.rawExpense!)}
                            className="flex items-center gap-1 mx-auto rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition"
                          >
                            <Eye className="h-3.5 w-3.5 text-rose-500" />
                            <span>View Expense</span>
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: ACTIVITY LOG */}
      {mainTab === 'ACTIVITIES' && (
        <div className="flex flex-col gap-6">
          {/* Activity Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <ArrowDownLeft className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Cash Collected</span>
              </div>
              <div className="mt-2 text-lg font-extrabold text-slate-900 dark:text-slate-100">
                NPR {totalCashCollected.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Total received from customer Khata settlements</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <ArrowUpRight className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Paid to Suppliers</span>
              </div>
              <div className="mt-2 text-lg font-extrabold text-slate-900 dark:text-slate-100">
                NPR {totalPaidToSuppliers.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Total paid out to wholesale suppliers</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <ShoppingCart className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Total Selled Goods</span>
              </div>
              <div className="mt-2 text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {invoices.length} Sales
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Total billing invoices created</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Truck className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Total Buyed Stock</span>
              </div>
              <div className="mt-2 text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {purchases.length} Purchase Bills
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Wholesale stock entries logged</p>
            </div>
          </div>

          {/* Activity Timeline Table */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Activity Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setActivityFilter('ALL')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    activityFilter === 'ALL'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  All Activity ({activities.length})
                </button>

                <button
                  onClick={() => setActivityFilter('CASH_COLLECT')}
                  className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    activityFilter === 'CASH_COLLECT'
                      ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <ArrowDownLeft className="h-3.5 w-3.5" />
                  <span>Cash Collect</span>
                </button>

                <button
                  onClick={() => setActivityFilter('PAID_SUPPLIER')}
                  className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    activityFilter === 'PAID_SUPPLIER'
                      ? 'bg-rose-600 text-white dark:bg-rose-500'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>Paid to Supplier</span>
                </button>

                <button
                  onClick={() => setActivityFilter('SELLED')}
                  className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    activityFilter === 'SELLED'
                      ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>Goods Selled</span>
                </button>

                <button
                  onClick={() => setActivityFilter('BUYED')}
                  className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    activityFilter === 'BUYED'
                      ? 'bg-purple-600 text-white dark:bg-purple-500'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <Truck className="h-3.5 w-3.5" />
                  <span>Goods Buyed</span>
                </button>

                <button
                  onClick={() => setActivityFilter('EXPENSE')}
                  className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    activityFilter === 'EXPENSE'
                      ? 'bg-rose-600 text-white dark:bg-rose-500'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <Receipt className="h-3.5 w-3.5" />
                  <span>Shop Expenses</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  placeholder="Search activity, party, details..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Timeline Feed */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredActivities.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No activities found matching your selected filter.
                </div>
              ) : (
                filteredActivities.map((act) => (
                  <div
                    key={act.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 px-2 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 rounded-xl transition"
                  >
                    <div className="flex items-start gap-3">
                      {/* Activity Icon Badge */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          act.type === 'CASH_COLLECT'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : act.type === 'PAID_SUPPLIER'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : act.type === 'SELLED'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            : act.type === 'BUYED'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                            : act.type === 'EXPENSE'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {act.type === 'CASH_COLLECT' ? (
                          <ArrowDownLeft className="h-5 w-5" />
                        ) : act.type === 'PAID_SUPPLIER' ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : act.type === 'SELLED' ? (
                          <ShoppingCart className="h-5 w-5" />
                        ) : act.type === 'BUYED' ? (
                          <Truck className="h-5 w-5" />
                        ) : act.type === 'EXPENSE' ? (
                          <Receipt className="h-5 w-5" />
                        ) : (
                          <BookOpen className="h-5 w-5" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {act.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {new Date(act.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                          <span>
                            {act.partyType === 'CUSTOMER' ? '👤 Customer:' : act.partyType === 'SUPPLIER' ? '🏢 Supplier:' : 'Party:'}{' '}
                            <strong className="text-slate-900 dark:text-slate-100">{act.partyName}</strong>
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{act.details}</p>

                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80">
                            <Users className="h-3 w-3 text-indigo-500" />
                            <span>Entry By: {act.performedBy || 'Store Owner'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right sm:self-center">
                      <span
                        className={`text-sm font-extrabold ${
                          act.isPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {act.isPositive ? '+' : '-'} NPR {act.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM AUDIT TRAIL & LOGS */}
      {mainTab === 'AUDIT_TRAIL' && (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-2xs">
          <AuditLogView />
        </div>
      )}

      {/* REPRINT SALES RECEIPT MODAL */}
      {reprintInvoice && (
        <ThermalReceiptModal invoice={reprintInvoice} onClose={() => setReprintInvoice(null)} />
      )}

      {/* VIEW PURCHASE BILL DETAILS MODAL */}
      {viewPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Stock Purchase Bill #{viewPurchase.purchaseNo}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Supplier: {viewPurchase.supplierName} • {new Date(viewPurchase.purchaseDate).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewPurchase(null)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier Reference Ref:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewPurchase.invoiceRef || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cash Paid at Purchase:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">NPR {viewPurchase.cashPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier Credit (Udharo):</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">NPR {viewPurchase.supplierCredit.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Purchased Items Breakdown</h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  {viewPurchase.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between p-3 text-xs bg-white dark:bg-slate-900">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{item.productName}</div>
                        <div className="text-[10px] text-slate-500">
                          {item.quantity} {item.unitName} × NPR {item.costPrice.toLocaleString()}
                        </div>
                      </div>
                      <div className="font-extrabold text-slate-900 dark:text-slate-100">
                        NPR {item.totalAmount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 text-sm font-extrabold">
                <span className="text-slate-700 dark:text-slate-300">Total Purchase Amount</span>
                <span className="text-indigo-600 dark:text-indigo-400">NPR {viewPurchase.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button
                onClick={() => setViewPurchase(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW SHOP EXPENSE DETAILS MODAL */}
      {viewExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Expense #{viewExpense.expenseNo || `EXP-${viewExpense.id.slice(0, 6)}`}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Category: {viewExpense.category} • {new Date(viewExpense.expenseDate || viewExpense.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewExpense(null)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-center dark:border-rose-900/30 dark:bg-rose-950/20">
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Amount Paid</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  NPR {viewExpense.amount.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-2 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Expense Title:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewExpense.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewExpense.category}</span>
                </div>
                {viewExpense.paidTo && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Paid To:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{viewExpense.paidTo}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewExpense.paymentMethod}</span>
                </div>
                {viewExpense.notes && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 block mb-0.5">Notes:</span>
                    <p className="text-slate-700 dark:text-slate-300 font-medium italic">{viewExpense.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button
                onClick={() => setViewExpense(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
