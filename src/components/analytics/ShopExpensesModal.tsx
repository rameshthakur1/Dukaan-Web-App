import React, { useState } from 'react';
import {
  X,
  Plus,
  Receipt,
  DollarSign,
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
  Tag,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory, PaymentMethod } from '../../types';

interface ShopExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: {
  id: ExpenseCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}[] = [
  { id: 'Rent', label: 'Rent', icon: Building2, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-950/60' },
  { id: 'Electricity', label: 'Electricity Bill', icon: Zap, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-950/60' },
  { id: 'Maintenance', label: 'Maintenance & Repair', icon: Wrench, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-950/60' },
  { id: 'Shop Usage', label: 'Shop Usage / Consumption', icon: ShoppingBag, color: 'text-rose-600', bgColor: 'bg-rose-100 dark:bg-rose-950/60' },
  { id: 'Staff Salary', label: 'Staff Salary & Wages', icon: UserCheck, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-950/60' },
  { id: 'Tea & Snacks', label: 'Tea, Snacks & Guest', icon: Coffee, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-950/60' },
  { id: 'Transport', label: 'Transport / Freight', icon: Truck, color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-950/60' },
  { id: 'Taxes', label: 'Taxes & Govt Fees', icon: Landmark, color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-950/60' },
  { id: 'Other', label: 'Miscellaneous / Other', icon: HelpCircle, color: 'text-slate-600', bgColor: 'bg-slate-100 dark:bg-slate-800' },
];

export const ShopExpensesModal: React.FC<ShopExpensesModalProps> = ({ isOpen, onClose }) => {
  const { expenses, addExpense, deleteExpense } = useApp();

  const [activeTab, setActiveTab] = useState<'ADD' | 'HISTORY'>('ADD');

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

  // Search/Filter state for history
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Success Feedback
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

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

    setSuccessMsg(`Successfully recorded expense NPR ${parsedAmount.toLocaleString()}`);
    setTimeout(() => setSuccessMsg(''), 3000);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs">
      <div className="flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Shop Expenses Management</span>
                <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-800 dark:bg-rose-950 dark:text-rose-300 uppercase tracking-wider">
                  Overheads
                </span>
              </h3>
              <p className="text-xs text-slate-500">Record shop rent, electricity, maintenance, staff tea & store consumption</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs & Overview */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 border-b border-slate-200 bg-slate-100/50 dark:border-slate-800 dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ADD')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === 'ADD'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
              id="expense-modal-add-tab"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Record New Expense</span>
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === 'HISTORY'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
              id="expense-modal-history-tab"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Expense History ({expenses.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-1 rounded-xl border border-rose-200 dark:border-rose-900/50">
            <TrendingDown className="h-3.5 w-3.5" />
            <span>Total Logged: NPR {totalExpenseAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 border border-emerald-200 text-emerald-800 text-xs font-bold dark:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-300 animate-fadeIn">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'ADD' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Quick Presets */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Quick Expense Presets:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('Rent', 'Monthly Shutter Shop Rent', 'Landlord')}
                    className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50/80 px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300 transition"
                  >
                    <Building2 className="h-3 w-3" />
                    <span>Monthly Rent</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('Electricity', 'NEA Electricity Bill', 'Nepal Electricity Authority')}
                    className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 transition"
                  >
                    <Zap className="h-3 w-3" />
                    <span>Electricity Bill</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('Shop Usage', 'Shop Usage (Goods taken from store for staff/personal)', 'Store Consumption')}
                    className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/80 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 transition"
                  >
                    <ShoppingBag className="h-3 w-3" />
                    <span>Shop Goods Usage</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('Tea & Snacks', 'Daily Tea, Milk & Snacks for staff/guests', 'Local Tea Shop')}
                    className="flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50/80 px-2.5 py-1 text-[11px] font-bold text-orange-700 hover:bg-orange-100 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300 transition"
                  >
                    <Coffee className="h-3 w-3" />
                    <span>Tea & Snacks</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('Maintenance', 'Shutter & Electrical Maintenance', 'Electrician / Plumber')}
                    className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 transition"
                  >
                    <Wrench className="h-3 w-3" />
                    <span>Shutter Maintenance</span>
                  </button>
                </div>
              </div>

              {/* Category Selection Grid */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Expense Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex items-center gap-2 rounded-xl p-2.5 text-left text-xs font-bold border transition ${
                          isSelected
                            ? 'border-rose-600 bg-rose-50 text-rose-900 dark:border-rose-500 dark:bg-rose-950/60 dark:text-rose-100 ring-1 ring-rose-500'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${cat.bgColor} ${cat.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Expense Title & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Expense Title / Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Shrawan Rent, NEA Electric Bill, 2kg Sugar for shop staff"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    id="expense-title-input"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Amount (NPR) *
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2 text-xs font-extrabold text-slate-400">
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      id="expense-amount-input"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method, Date & Paid To */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 cursor-pointer"
                    id="expense-payment-method-select"
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
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    id="expense-date-input"
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
                    placeholder="e.g. Landlord, NEA, Electrician"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Additional Notes / Reference
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Receipt #102, paid via Nabil Bank, items taken from shelf A"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition shadow-md active:scale-95"
                  id="record-expense-submit-btn"
                >
                  <Plus className="h-4 w-4" />
                  <span>Record Expense</span>
                </button>
              </div>
            </form>
          ) : (
            /* HISTORY TAB */
            <div className="space-y-3">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title, payee..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="ALL">All Categories</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Expense Items List */}
              {filteredExpenses.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-center text-slate-400">
                  <Receipt className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">No expenses found</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                    Start recording monthly shop rent, electricity, maintenance, and store usage expenses to track overheads.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredExpenses.map((exp) => {
                    const catObj = CATEGORIES.find((c) => c.id === exp.category) || CATEGORIES[8];
                    const Icon = catObj.icon;

                    return (
                      <div
                        key={exp.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 hover:border-slate-300 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${catObj.bgColor} ${catObj.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                {exp.title}
                              </span>
                              <span className={`rounded-md px-1.5 py-0.2 text-[9px] font-extrabold ${catObj.bgColor} ${catObj.color}`}>
                                {exp.category}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500 mt-0.5">
                              <span>Ref: {exp.expenseNo}</span>
                              <span>•</span>
                              <span>{exp.expenseDate}</span>
                              {exp.paidTo && (
                                <>
                                  <span>•</span>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    Paid to: {exp.paidTo}
                                  </span>
                                </>
                              )}
                              <span>•</span>
                              <span className="uppercase font-bold text-slate-600 dark:text-slate-400">
                                {exp.paymentMethod}
                              </span>
                            </div>

                            {exp.notes && (
                              <p className="text-[10px] text-slate-400 italic mt-0.5">
                                Note: {exp.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400 block">
                              NPR {exp.amount.toLocaleString()}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              if (confirm(`Delete expense "${exp.title}" (NPR ${exp.amount})?`)) {
                                deleteExpense(exp.id);
                              }
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-300 transition"
                            title="Delete Expense"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
