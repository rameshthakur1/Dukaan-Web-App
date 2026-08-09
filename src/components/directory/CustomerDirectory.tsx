import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer, PaymentMethod } from '../../types';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  CreditCard,
  Share2,
  DollarSign,
  UserCheck,
  CheckCircle,
  X,
  Wallet,
} from 'lucide-react';

export const CustomerDirectory: React.FC = () => {
  const { customers, addCustomer, updateCustomer, recordCustomerDebtPayment, shopProfile, confirmAction } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [tole, setTole] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(10000);
  const [advanceBalance, setAdvanceBalance] = useState<number>(0);

  // Advance Collection Modal
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceCustId, setAdvanceCustId] = useState('');
  const [advanceAmountInput, setAdvanceAmountInput] = useState<number>(0);
  const [advanceMethod, setAdvanceMethod] = useState<PaymentMethod>('CASH');
  const [advanceNote, setAdvanceNote] = useState('');

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('98');
    setAddress('Kathmandu');
    setTole('New Road');
    setCreditLimit(10000);
    setAdvanceBalance(0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address || '');
    setTole(c.tole || '');
    setCreditLimit(c.creditLimit || 10000);
    setAdvanceBalance(c.advanceBalance || 0);
    setIsModalOpen(true);
  };

  const handleOpenAdvanceModal = (targetCustId?: string) => {
    setAdvanceCustId(targetCustId || customers[0]?.id || '');
    setAdvanceAmountInput(0);
    setAdvanceMethod('CASH');
    setAdvanceNote('Advance deposit collected');
    setIsAdvanceModalOpen(true);
  };

  const handleSaveAdvancePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceCustId) {
      alert('Please select a customer.');
      return;
    }
    if (advanceAmountInput <= 0) {
      alert('Please enter a valid advance amount greater than 0.');
      return;
    }

    recordCustomerDebtPayment(advanceCustId, advanceAmountInput, advanceMethod, advanceNote);
    setIsAdvanceModalOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    if (editingCustomer) {
      confirmAction({
        title: 'Confirm Save Customer Edits',
        message: `Are you sure you want to save changes for customer "${editingCustomer.name}"?`,
        actionType: 'EDIT',
        onConfirm: () => {
          updateCustomer({
            ...editingCustomer,
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim() || undefined,
            tole: tole.trim() || undefined,
            creditLimit: Number(creditLimit),
            advanceBalance: Number(advanceBalance),
          });
          setIsModalOpen(false);
        },
      });
      return;
    } else {
      addCustomer({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
        tole: tole.trim() || undefined,
        creditLimit: Number(creditLimit),
        advanceBalance: Number(advanceBalance),
      });
      setIsModalOpen(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.tole && c.tole.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalUdharo = customers.reduce((sum, c) => sum + c.currentBalance, 0);
  const totalAdvance = customers.reduce((sum, c) => sum + (c.advanceBalance || 0), 0);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-tight sm:tracking-wider text-slate-500 dark:text-slate-400 truncate">Total Customers</p>
            <p className="text-xs sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 truncate">{customers.length}</p>
          </div>
          <div className="rounded-lg sm:rounded-xl bg-indigo-50 p-1.5 sm:p-2.5 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0 ml-1">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-amber-200/80 bg-amber-50/40 p-2.5 sm:p-4 shadow-2xs dark:border-amber-900/40 dark:bg-amber-950/20 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-tight sm:tracking-wider text-amber-700 dark:text-amber-400 truncate">Khata Udharo (Due)</p>
            <p className="text-xs sm:text-xl font-extrabold text-amber-700 dark:text-amber-400 mt-0.5 truncate">NPR {totalUdharo.toLocaleString()}</p>
          </div>
          <div className="rounded-lg sm:rounded-xl bg-amber-100 p-1.5 sm:p-2.5 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 shrink-0 ml-1">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-xl sm:rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-2.5 sm:p-4 shadow-2xs dark:border-emerald-900/40 dark:bg-emerald-950/20 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-tight sm:tracking-wider text-emerald-700 dark:text-emerald-400 truncate">Advance Balance (Deposits)</p>
            <p className="text-xs sm:text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5 truncate">NPR {totalAdvance.toLocaleString()}</p>
          </div>
          <div className="rounded-lg sm:rounded-xl bg-emerald-100 p-1.5 sm:p-2.5 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 shrink-0 ml-1">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            Registered Customers ({filtered.length})
          </h3>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, ID (e.g. CUST-1001), phone or tole..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <button
              onClick={() => handleOpenAdvanceModal()}
              className="flex items-center gap-1.5 shrink-0 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              id="collect-customer-advance-btn"
              title="Collect Advance Payment"
            >
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Collect Advance</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 shrink-0 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              id="add-customer-btn"
              title="Add New Customer"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Customer</span>
            </button>
          </div>
        </div>

        {/* Mobile Customer Cards View */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              No customers found. Customers auto-register when checking out at POS.
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={`mob-cust-${c.id}`}
                className="p-3.5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{c.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-200/60 dark:border-indigo-800/60">
                        {c.id.toUpperCase()}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
                        {c.phone}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded-lg shrink-0"
                  >
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block font-medium">Khata Udharo</span>
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
                    <span className="text-slate-400 block font-medium">Credit Limit</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      NPR {c.creditLimit.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Total Purchases</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      NPR {c.totalPurchases.toLocaleString()}
                    </span>
                  </div>
                </div>

                {(c.tole || c.address) && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <MapPin className="h-3 w-3 text-indigo-500 shrink-0" />
                    <span>{c.tole || c.address}</span>
                  </div>
                )}

                <button
                  onClick={() => handleOpenAdvanceModal(c.id)}
                  className="w-full py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs active:scale-98"
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Collect Advance Deposit</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Master Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/90 text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
                <th className="p-3 font-semibold border-r border-slate-200 dark:border-slate-800">Customer ID & Name</th>
                <th className="p-3 font-semibold border-r border-slate-200 dark:border-slate-800">Contact & Address</th>
                <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Credit Limit</th>
                <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Total Purchases</th>
                <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Khata Udharo</th>
                <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Advance Balance</th>
                <th className="p-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No customers found. Customers auto-register when checking out at POS.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
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
                      <div className="text-[10px] text-slate-400">{c.tole || c.address}</div>
                    </td>
                    <td className="p-3 text-right font-medium text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800/80">
                      NPR {c.creditLimit.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800/80">
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
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenAdvanceModal(c.id)}
                          className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/80 border border-emerald-200 dark:border-emerald-800"
                          title="Collect Advance Deposit"
                        >
                          Collect Advance
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="rounded-lg bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          Edit Profile
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT CUSTOMER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {editingCustomer ? 'Edit Customer Profile' : 'Register New Customer'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hari Bahadur Thapa"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9851098765"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Area / City
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Kathmandu"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tole / Street
                  </label>
                  <input
                    type="text"
                    value={tole}
                    onChange={(e) => setTole(e.target.value)}
                    placeholder="New Road"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Credit Limit (NPR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    Advance Deposit (NPR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={advanceBalance}
                    onChange={(e) => setAdvanceBalance(Number(e.target.value))}
                    className="w-full rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-2 text-xs font-bold text-emerald-900 outline-none focus:border-emerald-500 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  id="save-customer-btn"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COLLECT ADVANCE PAYMENT MODAL */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Collect Advance Payment</h3>
                  <p className="text-xs text-slate-500">Record customer advance deposit anytime</p>
                </div>
              </div>
              <button
                onClick={() => setIsAdvanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdvancePayment} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Customer</label>
                <select
                  value={advanceCustId}
                  onChange={(e) => setAdvanceCustId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  id="advance-customer-select"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) • Udharo: NPR {c.currentBalance.toLocaleString()} | Advance: NPR {(c.advanceBalance || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {advanceCustId && (() => {
                const selectedCust = customers.find((c) => c.id === advanceCustId);
                if (!selectedCust) return null;
                return (
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 border border-emerald-200 dark:border-emerald-900/50 text-xs space-y-1">
                    <p className="font-bold text-emerald-900 dark:text-emerald-200">{selectedCust.name}</p>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300 text-[11px]">
                      <span>Current Khata Udharo (Due):</span>
                      <span className="font-bold text-amber-700 dark:text-amber-400">NPR {selectedCust.currentBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300 text-[11px]">
                      <span>Current Advance Balance:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">NPR {(selectedCust.advanceBalance || 0).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Advance Amount Collected (NPR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={advanceAmountInput || ''}
                  onChange={(e) => setAdvanceAmountInput(Math.max(0, Number(e.target.value)))}
                  placeholder="e.g. 5000"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  id="advance-amount-input"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Method</label>
                <select
                  value={advanceMethod}
                  onChange={(e) => setAdvanceMethod(e.target.value as PaymentMethod)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="CASH">Cash</option>
                  <option value="FONEPAY">FonePay / QR</option>
                  <option value="ESEWA">eSewa</option>
                  <option value="KHALTI">Khalti</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notes / Remarks</label>
                <input
                  type="text"
                  value={advanceNote}
                  onChange={(e) => setAdvanceNote(e.target.value)}
                  placeholder="e.g. Advance deposit for upcoming order"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-md"
                  id="submit-collect-advance-btn"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Collect Advance Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
