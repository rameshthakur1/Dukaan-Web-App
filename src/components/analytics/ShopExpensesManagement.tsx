import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Building2,
  Zap,
  Wrench,
  ShoppingBag,
  UserCheck,
  Coffee,
  Truck,
  Landmark,
  HelpCircle,
  Trash2,
  Calendar,
  CreditCard,
  Search,
  CheckCircle2,
  TrendingDown,
  DollarSign,
  Filter,
  ArrowUpRight,
  PieChart,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory, PaymentMethod } from '../../types';

const CATEGORIES: {
  id: ExpenseCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}[] = [
  { id: 'Rent', label: 'Rent', icon: Building2, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-950/60' },
  { id: 'Electricity', label: 'Electricity Bill', icon: Zap, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-950/60' },
  { id: 'Maintenance', label: 'Maintenance & Repair', icon: Wrench, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-950/60' },
  { id: 'Shop Usage', label: 'Shop Usage / Consumption', icon: ShoppingBag, color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-100 dark:bg-rose-950/60' },
  { id: 'Staff Salary', label: 'Staff Salary & Wages', icon: UserCheck, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-950/60' },
  { id: 'Tea & Snacks', label: 'Tea, Snacks & Guest', icon: Coffee, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-950/60' },
  { id: 'Transport', label: 'Transport / Freight', icon: Truck, color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-950/60' },
  { id: 'Taxes', label: 'Taxes & Govt Fees', icon: Landmark, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-950/60' },
  { id: 'Other', label: 'Miscellaneous / Other', icon: HelpCircle, color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-800' },
];

export const ShopExpensesManagement: React.FC = () => {
  const { expenses, addExpense, deleteExpense, shopProfile } = useApp();

  const [activeTab, setActiveTab] = useState<'RECORD' | 'HISTORY'>('RECORD');

  // Form State
  const [category, setCategory] = useState<ExpenseCategory>('Rent');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paidTo, setPaidTo] = useState('');
  const [notes, setNotes] = useState('');
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Success Feedback
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid expense amount in NPR');
      return;
    }
    if (!title.trim()) {
      alert('Please enter an expense title or description');
      return;
    }

    addExpense({
      category,
      title: title.trim(),
      amount: parsedAmount,
      paymentMethod,
      paidTo: paidTo.trim() || undefined,
      notes: notes.trim() || undefined,
      expenseDate,
    });

    setSuccessMsg(`Recorded expense "NPR ${parsedAmount.toLocaleString()}" for ${title}`);
    setTimeout(() => setSuccessMsg(''), 4000);

    // Reset Form
    setTitle('');
    setAmount('');
    setPaidTo('');
    setNotes('');
  };

  const applyPreset = (presetCategory: ExpenseCategory, presetTitle: string, defaultPaidTo?: string) => {
    setCategory(presetCategory);
    setTitle(presetTitle);
    if (defaultPaidTo) setPaidTo(defaultPaidTo);
    setActiveTab('RECORD');
  };

  const filteredExpenses = expenses.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.expenseNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.paidTo && item.paidTo.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalExpenseAmount = expenses.reduce((sum, item) => sum + item.amount, 0);
  const rentExpensesTotal = expenses.filter((e) => e.category === 'Rent').reduce((sum, item) => sum + item.amount, 0);
  const utilityExpensesTotal = expenses.filter((e) => e.category === 'Electricity' || e.category === 'Maintenance').reduce((sum, item) => sum + item.amount, 0);
  const staffExpensesTotal = expenses.filter((e) => e.category === 'Staff Salary' || e.category === 'Tea & Snacks').reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-rose-900 via-slate-900 to-slate-900 p-5 sm:p-6 text-white shadow-lg border border-rose-800/40">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600/30 border border-rose-500/40 text-rose-400 shrink-0 shadow-inner">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Shop Expenses & Overheads
              </h1>
              <span className="rounded-md bg-rose-950 border border-rose-800 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-300 uppercase tracking-wider">
                Store Financials
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Track shutter rent, electricity bills, staff salaries, tea/snacks, transport, and shop goods consumption for {shopProfile.shopName || 'My Store'}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('RECORD')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'RECORD'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Record Expense</span>
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'HISTORY'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Expense Ledger ({expenses.length})</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Expenses Logged</span>
            <TrendingDown className="h-4 w-4 text-rose-600" />
          </div>
          <span className="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400 block font-mono">
            NPR {totalExpenseAmount.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block">{expenses.length} Records in Ledger</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Monthly Rent Outflow</span>
            <Building2 className="h-4 w-4 text-purple-600" />
          </div>
          <span className="text-lg sm:text-2xl font-black text-purple-600 dark:text-purple-400 block font-mono">
            NPR {rentExpensesTotal.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block">Shutter & Office Lease</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Electricity & Repair</span>
            <Zap className="h-4 w-4 text-amber-600" />
          </div>
          <span className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 block font-mono">
            NPR {utilityExpensesTotal.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block">NEA Bill + Maintenance</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Staff & Tea/Snacks</span>
            <Coffee className="h-4 w-4 text-orange-600" />
          </div>
          <span className="text-lg sm:text-2xl font-black text-orange-600 dark:text-orange-400 block font-mono">
            NPR {staffExpensesTotal.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block">Salaries, Guests & Tea</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 text-emerald-800 text-xs font-bold dark:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-300 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Toggle Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('RECORD')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'RECORD'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Record New Expense</span>
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'HISTORY'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Receipt className="h-4 w-4" />
              <span>Expense History & Ledger ({expenses.length})</span>
            </button>
          </div>

          {activeTab === 'HISTORY' && (
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search title, payee, ref..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {activeTab === 'RECORD' ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quick Presets */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Quick Expense Shortcuts:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('Rent', 'Monthly Shutter Shop Rent', 'Landlord')}
                  className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50/80 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300 transition"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Monthly Rent</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('Electricity', 'NEA Electricity Bill', 'Nepal Electricity Authority')}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 transition"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Electricity Bill</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('Shop Usage', 'Shop Usage (Goods taken from store for staff/personal)', 'Store Consumption')}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 transition"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Shop Goods Usage</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('Tea & Snacks', 'Daily Tea, Milk & Snacks for staff/guests', 'Local Tea Shop')}
                  className="flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50/80 px-3 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-100 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300 transition"
                >
                  <Coffee className="h-3.5 w-3.5" />
                  <span>Tea & Snacks</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('Maintenance', 'Shutter & Electrical Maintenance', 'Electrician / Plumber')}
                  className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 transition"
                >
                  <Wrench className="h-3.5 w-3.5" />
                  <span>Shutter Maintenance</span>
                </button>
              </div>
            </div>

            {/* Category Selection Grid */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Expense Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2.5 rounded-xl p-3 text-left text-xs font-bold border transition ${
                        isSelected
                          ? 'border-rose-600 bg-rose-50 text-rose-900 dark:border-rose-500 dark:bg-rose-950/60 dark:text-rose-100 ring-2 ring-rose-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${cat.bgColor} ${cat.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title & Amount Input */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Expense Title / Description *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Shrawan Rent, NEA Electric Bill, Tea/Milk for Staff"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Amount (NPR) *
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3.5 top-2.5 text-xs font-extrabold text-slate-400">
                    NPR
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-14 pr-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method, Date, Paid To */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  <option value="CASH">Cash in Hand</option>
                  <option value="ESEWA">eSewa QR</option>
                  <option value="KHALTI">Khalti QR</option>
                  <option value="FONEPAY">Fonepay / Mobile Banking</option>
                  <option value="BANK">Bank Account Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Expense Date
                </label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Paid To / Vendor Name (Optional)
                </label>
                <input
                  type="text"
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  placeholder="e.g. Landlord, NEA, Local Tea Shop"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Additional Notes / Reference
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Bill #102, paid via Nabil Bank, items consumed from inventory"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition shadow-md active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Save Expense Record</span>
              </button>
            </div>
          </form>
        ) : (
          /* HISTORY LEDGER TABLE */
          <div className="space-y-4">
            {filteredExpenses.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center text-slate-400">
                <Receipt className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No expenses found</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Record monthly shop rent, electricity, maintenance, tea/snacks, and staff wages to manage shop overheads.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider dark:bg-slate-800/80 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Expense Ref</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Title & Notes</th>
                      <th className="px-4 py-3">Paid To</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3 text-right">Amount (NPR)</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {filteredExpenses.map((exp) => {
                      const catObj = CATEGORIES.find((c) => c.id === exp.category) || CATEGORIES[8];
                      const Icon = catObj.icon;

                      return (
                        <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {exp.expenseNo}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold ${catObj.bgColor} ${catObj.color}`}>
                              <Icon className="h-3 w-3" />
                              <span>{exp.category}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {exp.title}
                            </span>
                            {exp.notes && (
                              <span className="text-[10px] text-slate-400 italic block mt-0.5">
                                {exp.notes}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                            {exp.paidTo || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                            {exp.expenseDate}
                          </td>
                          <td className="px-4 py-3">
                            <span className="uppercase text-[10px] font-bold text-slate-600 dark:text-slate-400">
                              {exp.paymentMethod}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                            NPR {exp.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                if (confirm(`Delete expense "${exp.title}" (NPR ${exp.amount.toLocaleString()})?`)) {
                                  deleteExpense(exp.id);
                                }
                              }}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-300 transition"
                              title="Delete Expense"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
