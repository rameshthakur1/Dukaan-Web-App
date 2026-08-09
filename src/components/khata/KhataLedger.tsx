import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, Supplier, PaymentMethod } from '../../types';
import {
  BookOpen,
  Users,
  Building2,
  Share2,
  DollarSign,
  Plus,
  Search,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Phone,
  Calendar,
  CalendarDays,
  CalendarPlus,
  Bell,
} from 'lucide-react';

export const KhataLedger: React.FC = () => {
  const {
    customers,
    suppliers,
    khataTransactions,
    recordCustomerKhataPayment,
    recordSupplierDebtPayment,
    updateCustomer,
    updateSupplier,
    shopProfile,
    confirmAction,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'CUSTOMERS' | 'SUPPLIERS'>('CUSTOMERS');
  const [searchQuery, setSearchQuery] = useState('');

  // Repayment Modal
  const [repayModalOpen, setRepayModalOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [amountPaidInput, setAmountPaidInput] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [repaymentNote, setRepaymentNote] = useState('');

  // Set Due Date Modal State
  const [dueDateModalOpen, setDueDateModalOpen] = useState(false);
  const [selectedDueDateEntity, setSelectedDueDateEntity] = useState<{
    type: 'CUSTOMER' | 'SUPPLIER';
    id: string;
    name: string;
    balance: number;
    dueDate: string;
    dueNotes: string;
  } | null>(null);
  const [dueDateInput, setDueDateInput] = useState('');
  const [dueNotesInput, setDueNotesInput] = useState('');

  // Total Customer Udharo Collectables
  const totalCustomerUdharo = customers.reduce((sum, c) => sum + c.currentBalance, 0);
  const totalCustomerAdvance = customers.reduce((sum, c) => sum + (c.advanceBalance || 0), 0);

  // Total Supplier Payables
  const totalSupplierPayable = suppliers.reduce((sum, s) => sum + s.pendingPayable, 0);
  const totalSupplierAdvance = suppliers.reduce((sum, s) => sum + (s.advanceBalance || 0), 0);

  // Open Collection / Repayment Modal
  const openRepayModal = (id: string) => {
    setSelectedEntityId(id);
    const targetCustomer = customers.find((c) => c.id === id);
    const targetSupplier = suppliers.find((s) => s.id === id);
    const defaultAmount = targetCustomer
      ? targetCustomer.currentBalance
      : targetSupplier
      ? targetSupplier.pendingPayable
      : 0;

    setAmountPaidInput(defaultAmount);
    setRepayModalOpen(true);
  };

  // Open Set Due Date Modal
  const openDueDateModal = (type: 'CUSTOMER' | 'SUPPLIER', id: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (type === 'CUSTOMER') {
      const cust = customers.find((c) => c.id === id);
      if (cust) {
        setSelectedDueDateEntity({
          type: 'CUSTOMER',
          id: cust.id,
          name: cust.name,
          balance: cust.currentBalance,
          dueDate: cust.dueDate || '',
          dueNotes: cust.dueNotes || '',
        });
        setDueDateInput(cust.dueDate || today);
        setDueNotesInput(cust.dueNotes || '');
        setDueDateModalOpen(true);
      }
    } else {
      const sup = suppliers.find((s) => s.id === id);
      if (sup) {
        setSelectedDueDateEntity({
          type: 'SUPPLIER',
          id: sup.id,
          name: sup.name,
          balance: sup.pendingPayable,
          dueDate: sup.dueDate || '',
          dueNotes: sup.dueNotes || '',
        });
        setDueDateInput(sup.dueDate || today);
        setDueNotesInput(sup.dueNotes || '');
        setDueDateModalOpen(true);
      }
    }
  };

  // Date shortcut calculator
  const applyDateShortcut = (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    setDueDateInput(d.toISOString().split('T')[0]);
  };

  // Save Due Date
  const handleSaveDueDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDueDateEntity) return;

    confirmAction({
      title: 'Confirm Update Payment Due Date',
      message: `Are you sure you want to set the payment due date to ${dueDateInput} for ${selectedDueDateEntity.name}?`,
      actionType: 'EDIT',
      onConfirm: () => {
        if (selectedDueDateEntity.type === 'CUSTOMER') {
          const cust = customers.find((c) => c.id === selectedDueDateEntity.id);
          if (cust) {
            updateCustomer({
              ...cust,
              dueDate: dueDateInput,
              dueNotes: dueNotesInput,
            });
          }
        } else {
          const sup = suppliers.find((s) => s.id === selectedDueDateEntity.id);
          if (sup) {
            updateSupplier({
              ...sup,
              dueDate: dueDateInput,
              dueNotes: dueNotesInput,
            });
          }
        }

        setDueDateModalOpen(false);
        setSelectedDueDateEntity(null);
      },
    });
  };

  // Helper to render Due Date badge
  const renderDueDateBadge = (dueDate?: string, balance: number = 0) => {
    if (balance <= 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
          <span>Cleared</span>
        </span>
      );
    }

    if (!dueDate) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
          <span>No Due Date</span>
        </span>
      );
    }

    const today = new Date().toISOString().split('T')[0];
    if (dueDate < today) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-800 dark:bg-red-950 dark:text-red-200">
          <AlertCircle className="h-3 w-3 text-red-600" />
          <span>Overdue ({dueDate})</span>
        </span>
      );
    } else if (dueDate === today) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200 animate-pulse">
          <Clock className="h-3 w-3 text-amber-600" />
          <span>Due Today!</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-200">
          <Calendar className="h-3 w-3 text-blue-600" />
          <span>Due {dueDate}</span>
        </span>
      );
    }
  };

  // 1-Click WhatsApp Debt Reminder Generator
  const sendWhatsAppReminder = (customer: Customer) => {
    const text = `Namaste ${customer.name} ji,\nThis is a friendly reminder from *${shopProfile.shopName}* (${shopProfile.phone}).\n\nYour current pending Khata (Udharo) balance is *NPR ${customer.currentBalance.toLocaleString()}*.\n\nKindly clear your balance via Cash or eSewa/Khalti at your earliest convenience.\nThank you!`;
    const encoded = encodeURIComponent(text);
    const phone = customer.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone.length >= 10 ? '977' + phone : phone}?text=${encoded}`, '_blank');
  };

  // Submit Repayment Entry
  const handleRepaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntityId || amountPaidInput <= 0) return;

    if (activeSubTab === 'CUSTOMERS') {
      recordCustomerKhataPayment(selectedEntityId, Number(amountPaidInput), paymentMethod, repaymentNote);
    } else {
      recordSupplierDebtPayment(selectedEntityId, Number(amountPaidInput), paymentMethod, repaymentNote);
    }

    setRepayModalOpen(false);
    setSelectedEntityId('');
    setAmountPaidInput(0);
    setRepaymentNote('');
  };

  // Filtered lists
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.tole && c.tole.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.companyName && s.companyName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <div className="flex items-center justify-between rounded-xl sm:rounded-2xl border border-amber-200 bg-amber-50/50 p-2.5 sm:p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-tight sm:tracking-wider text-amber-700 dark:text-amber-400 truncate">
              Customer Udharo (Due)
            </p>
            <h3 className="text-xs sm:text-xl font-extrabold text-amber-900 dark:text-amber-200 mt-0.5 sm:mt-1 truncate">
              NPR {totalCustomerUdharo.toLocaleString()}
            </h3>
            <p className="text-[8px] sm:text-[10px] text-amber-700 dark:text-amber-400 mt-0.5 truncate">
              {customers.filter((c) => c.currentBalance > 0).length} owe credit
            </p>
          </div>
          <div className="flex h-6 w-6 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 ml-1">
            <ArrowDownLeft className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl sm:rounded-2xl border border-emerald-200 bg-emerald-50/50 p-2.5 sm:p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-tight sm:tracking-wider text-emerald-700 dark:text-emerald-400 truncate">
              Customer Advance
            </p>
            <h3 className="text-xs sm:text-xl font-extrabold text-emerald-900 dark:text-emerald-200 mt-0.5 sm:mt-1 truncate">
              NPR {totalCustomerAdvance.toLocaleString()}
            </h3>
            <p className="text-[8px] sm:text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 truncate">
              Held in shop
            </p>
          </div>
          <div className="flex h-6 w-6 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 ml-1">
            <DollarSign className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl sm:rounded-2xl border border-indigo-200 bg-indigo-50/50 p-2.5 sm:p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-tight sm:tracking-wider text-indigo-700 dark:text-indigo-400 truncate">
              Supplier Payables
            </p>
            <h3 className="text-xs sm:text-xl font-extrabold text-indigo-900 dark:text-indigo-200 mt-0.5 sm:mt-1 truncate">
              NPR {totalSupplierPayable.toLocaleString()}
            </h3>
            <p className="text-[8px] sm:text-[10px] text-indigo-700 dark:text-indigo-400 mt-0.5 truncate">
              {suppliers.filter((s) => s.pendingPayable > 0).length} pending vendor pay
            </p>
          </div>
          <div className="flex h-6 w-6 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 ml-1">
            <ArrowUpRight className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl sm:rounded-2xl border border-teal-200 bg-teal-50/50 p-2.5 sm:p-4 dark:border-teal-900/50 dark:bg-teal-950/30">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-tight sm:tracking-wider text-teal-700 dark:text-teal-400 truncate">
              Supplier Advance
            </p>
            <h3 className="text-xs sm:text-xl font-extrabold text-teal-900 dark:text-teal-200 mt-0.5 sm:mt-1 truncate">
              NPR {totalSupplierAdvance.toLocaleString()}
            </h3>
            <p className="text-[8px] sm:text-[10px] text-teal-700 dark:text-teal-400 mt-0.5 truncate">
              Paid to vendors
            </p>
          </div>
          <div className="flex h-6 w-6 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 ml-1">
            <BookOpen className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
          </div>
        </div>
      </div>

      {/* Main Ledger Content */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        {/* Tab Switcher & Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setActiveSubTab('CUSTOMERS')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeSubTab === 'CUSTOMERS'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Customer Khata ({customers.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('SUPPLIERS')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeSubTab === 'SUPPLIERS'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Supplier Udharo ({suppliers.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeSubTab.toLowerCase()} by name or phone...`}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* CUSTOMER KHATA SECTION */}
        {activeSubTab === 'CUSTOMERS' && (
          <>
            {/* Mobile Customer Khata Cards */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredCustomers.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  No matching customer khata accounts found.
                </div>
              ) : (
                filteredCustomers.map((c) => {
                  const isOverdue = c.currentBalance > c.creditLimit;
                  return (
                    <div
                      key={`mob-khata-c-${c.id}`}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col gap-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{c.name}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-200/60 dark:border-indigo-800/60">
                              {c.id.toUpperCase()}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
                              {c.phone}
                            </span>
                          </div>
                        </div>

                        {(c.advanceBalance || 0) > 0 && c.currentBalance === 0 ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 shrink-0">
                            Advance Credit
                          </span>
                        ) : c.currentBalance === 0 ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200 shrink-0">
                            Cleared
                          </span>
                        ) : isOverdue ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 dark:bg-red-950 dark:text-red-200 shrink-0">
                            Exceeded Limit
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200 shrink-0">
                            Active Udharo
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="text-slate-400 block font-medium">Udharo Balance</span>
                          <span className="font-extrabold text-amber-600 dark:text-amber-400 text-xs">
                            NPR {c.currentBalance.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Advance Balance</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                            NPR {(c.advanceBalance || 0).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Payment Due</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            {renderDueDateBadge(c.dueDate, c.currentBalance)}
                            <button
                              type="button"
                              onClick={() => openDueDateModal('CUSTOMER', c.id)}
                              className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Total Purchases</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            NPR {c.totalPurchases.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        {c.currentBalance > 0 ? (
                          <button
                            onClick={() => sendWhatsAppReminder(c)}
                            className="flex-1 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                            <span>WhatsApp Reminder</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">No active debt</span>
                        )}

                        <button
                          onClick={() => openRepayModal(c.id)}
                          className="flex-1 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs active:scale-98"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Collect Payment</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Customer Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/90 text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
                    <th className="p-3 font-semibold border-r border-slate-200 dark:border-slate-800">Customer ID & Name</th>
                    <th className="p-3 font-semibold border-r border-slate-200 dark:border-slate-800">Phone / Address</th>
                    <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Total Purchases</th>
                    <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Udharo Balance</th>
                    <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Advance Balance</th>
                    <th className="p-3 font-semibold text-center border-r border-slate-200 dark:border-slate-800">Payment Due Date</th>
                    <th className="p-3 font-semibold text-center border-r border-slate-200 dark:border-slate-800">Credit Status</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">
                        No matching customer khata accounts found.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c) => {
                      const isOverdue = c.currentBalance > c.creditLimit;
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800/80 last:border-b-0">
                          <td className="p-3 border-r border-slate-200 dark:border-slate-800/80">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{c.name}</div>
                            <div className="inline-flex items-center gap-1 mt-0.5">
                              <span className="font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-200/60 dark:border-indigo-800/60">
                                {c.id.toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-slate-500 border-r border-slate-200 dark:border-slate-800/80">
                            <div className="font-mono">{c.phone}</div>
                            <div className="text-[10px]">{c.tole || c.address}</div>
                          </td>
                          <td className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800/80">
                            NPR {c.totalPurchases.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-extrabold text-amber-600 dark:text-amber-400 border-r border-slate-200 dark:border-slate-800/80">
                            NPR {c.currentBalance.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-extrabold border-r border-slate-200 dark:border-slate-800/80">
                            {(c.advanceBalance || 0) > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                NPR {(c.advanceBalance || 0).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">NPR 0</span>
                            )}
                          </td>
                          <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800/80">
                            <div className="flex flex-col items-center gap-1">
                              {renderDueDateBadge(c.dueDate, c.currentBalance)}
                              <button
                                type="button"
                                onClick={() => openDueDateModal('CUSTOMER', c.id)}
                                className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                              >
                                <CalendarPlus className="h-3 w-3" />
                                <span>{c.dueDate ? 'Change Date' : 'Set Due Date'}</span>
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800/80">
                            {(c.advanceBalance || 0) > 0 && c.currentBalance === 0 ? (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                                Advance Credit
                              </span>
                            ) : c.currentBalance === 0 ? (
                              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                Cleared
                              </span>
                            ) : isOverdue ? (
                              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold text-red-800 dark:bg-red-950 dark:text-red-200">
                                Exceeded Limit
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                                Active Udharo
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {c.currentBalance > 0 && (
                                <button
                                  onClick={() => sendWhatsAppReminder(c)}
                                  className="flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  title="Send WhatsApp debt reminder"
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                  <span>Reminder</span>
                                </button>
                              )}

                              <button
                                onClick={() => openRepayModal(c.id)}
                                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-[11px] font-bold text-white transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Collect Payment</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* SUPPLIER UDHARO SECTION */}
        {activeSubTab === 'SUPPLIERS' && (
          <>
            {/* Mobile Supplier Khata Cards */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredSuppliers.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  No matching supplier accounts found.
                </div>
              ) : (
                filteredSuppliers.map((s) => (
                  <div
                    key={`mob-khata-s-${s.id}`}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col gap-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{s.name}</h3>
                        {s.companyName && (
                          <span className="text-[11px] text-slate-500 font-medium block">{s.companyName}</span>
                        )}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-200/60 dark:border-indigo-800/60">
                            {s.id.toUpperCase()}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
                            {s.phone}
                          </span>
                        </div>
                      </div>

                      {s.pendingPayable === 0 ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 shrink-0">
                          Cleared
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200 shrink-0">
                          Pending Dues
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 block font-medium">Pending Vendor Dues</span>
                        <span className="font-extrabold text-amber-600 dark:text-amber-400 text-xs">
                          {s.pendingPayable > 0 ? `NPR ${s.pendingPayable.toLocaleString()}` : 'Cleared'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Advance Paid</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                          NPR {(s.advanceBalance || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Payment Due</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          {renderDueDateBadge(s.dueDate, s.pendingPayable)}
                          <button
                            type="button"
                            onClick={() => openDueDateModal('SUPPLIER', s.id)}
                            className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Total Goods Bought</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          NPR {s.totalPurchased.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => openRepayModal(s.id)}
                      className="w-full py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs active:scale-98"
                    >
                      <Plus className="h-3.5 w-3.5 text-white" />
                      <span>Pay Vendor / Clear Dues</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Supplier Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/90 text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
                    <th className="p-3 font-semibold border-r border-slate-200 dark:border-slate-800">Supplier ID & Company</th>
                    <th className="p-3 font-semibold border-r border-slate-200 dark:border-slate-800">Contact Details</th>
                    <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Total Goods Bought</th>
                    <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Pending Vendor Dues</th>
                    <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Advance Paid</th>
                    <th className="p-3 font-semibold text-center border-r border-slate-200 dark:border-slate-800">Payment Due Date</th>
                    <th className="p-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        No matching supplier accounts found.
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800/80 last:border-b-0">
                        <td className="p-3 border-r border-slate-200 dark:border-slate-800/80">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{s.name}</div>
                          {s.companyName && (
                            <div className="text-[10px] text-slate-400 font-normal">{s.companyName}</div>
                          )}
                          <div className="inline-flex items-center gap-1 mt-0.5">
                            <span className="font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-200/60 dark:border-indigo-800/60">
                              {s.id.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-500 font-mono border-r border-slate-200 dark:border-slate-800/80">{s.phone}</td>
                        <td className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800/80">
                          NPR {s.totalPurchased.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-extrabold text-amber-600 dark:text-amber-400 border-r border-slate-200 dark:border-slate-800/80">
                          {s.pendingPayable > 0 ? `NPR ${s.pendingPayable.toLocaleString()}` : 'Cleared'}
                        </td>
                        <td className="p-3 text-right font-extrabold border-r border-slate-200 dark:border-slate-800/80">
                          {(s.advanceBalance || 0) > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              NPR {(s.advanceBalance || 0).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">NPR 0</span>
                          )}
                        </td>
                        <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800/80">
                          <div className="flex flex-col items-center gap-1">
                            {renderDueDateBadge(s.dueDate, s.pendingPayable)}
                            <button
                              type="button"
                              onClick={() => openDueDateModal('SUPPLIER', s.id)}
                              className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
                            >
                              <CalendarPlus className="h-3 w-3" />
                              <span>{s.dueDate ? 'Change Date' : 'Set Due Date'}</span>
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => openRepayModal(s.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-[11px] font-bold text-white transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Pay Vendor</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* RECORD REPAYMENT MODAL */}
      {repayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {activeSubTab === 'CUSTOMERS' ? 'Record Customer Khata Payment' : 'Pay Vendor Dues'}
              </h3>
              <button
                onClick={() => setRepayModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRepaymentSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Repayment Amount (NPR) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amountPaidInput}
                  onChange={(e) => setAmountPaidInput(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base font-extrabold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="CASH">Cash</option>
                  <option value="ESEWA">eSewa</option>
                  <option value="KHALTI">Khalti</option>
                  <option value="FONEPAY">Fonepay Direct</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Note / Reference
                </label>
                <input
                  type="text"
                  value={repaymentNote}
                  onChange={(e) => setRepaymentNote(e.target.value)}
                  placeholder="e.g. Partial cash settlement"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRepayModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  id="confirm-khata-repay-btn"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SET PAYMENT DUE DATE MODAL */}
      {dueDateModalOpen && selectedDueDateEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Set Udharo Payment Due Date
                </h3>
              </div>
              <button
                onClick={() => setDueDateModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDueDate} className="p-6 space-y-4">
              <div className="rounded-xl bg-indigo-50/80 p-3.5 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40">
                <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  {selectedDueDateEntity.type === 'CUSTOMER' ? 'Customer' : 'Supplier'}: {selectedDueDateEntity.name}
                </div>
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                  Outstanding Balance: NPR {selectedDueDateEntity.balance.toLocaleString()}
                </div>
              </div>

              {/* Date Picker Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Payment Due / Promise Date *</span>
                  <span className="text-[10px] text-slate-400">Trigger dashboard notifications</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={dueDateInput}
                    onChange={(e) => setDueDateInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Quick Date Shortcuts */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Date Shortcuts
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyDateShortcut(0)}
                    className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDateShortcut(3)}
                    className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    +3 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDateShortcut(7)}
                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300"
                  >
                    +7 Days (1 Wk)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDateShortcut(15)}
                    className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    +15 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDateShortcut(30)}
                    className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    +1 Month
                  </button>
                </div>
              </div>

              {/* Due Notes Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Notes / Customer Promise Remarks
                </label>
                <input
                  type="text"
                  value={dueNotesInput}
                  onChange={(e) => setDueNotesInput(e.target.value)}
                  placeholder="e.g. Customer promised clearing via eSewa on Friday"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setDueDateInput('');
                    setDueNotesInput('');
                  }}
                  className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
                >
                  Clear Due Date
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDueDateModalOpen(false)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    Save Due Date
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
