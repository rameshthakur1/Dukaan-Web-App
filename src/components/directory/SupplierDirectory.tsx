import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier, PaymentMethod } from '../../types';
import { Building2, Plus, Search, Phone, MapPin, DollarSign, CheckCircle, X } from 'lucide-react';

export const SupplierDirectory: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, recordSupplierDebtPayment, confirmAction } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [advanceBalance, setAdvanceBalance] = useState<number>(0);

  // Advance Payment Modal
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceSupplierId, setAdvanceSupplierId] = useState('');
  const [advanceAmountInput, setAdvanceAmountInput] = useState<number>(0);
  const [advanceMethod, setAdvanceMethod] = useState<PaymentMethod>('CASH');
  const [advanceNote, setAdvanceNote] = useState('');

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setName('');
    setPhone('01-');
    setCompanyName('');
    setAddress('Kathmandu');
    setAdvanceBalance(0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setPhone(s.phone);
    setCompanyName(s.companyName || '');
    setAddress(s.address || '');
    setAdvanceBalance(s.advanceBalance || 0);
    setIsModalOpen(true);
  };

  const handleOpenAdvanceModal = (targetSupplierId?: string) => {
    setAdvanceSupplierId(targetSupplierId || suppliers[0]?.id || '');
    setAdvanceAmountInput(0);
    setAdvanceMethod('CASH');
    setAdvanceNote('Advance payment sent to vendor');
    setIsAdvanceModalOpen(true);
  };

  const handleSaveAdvancePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceSupplierId) {
      alert('Please select a supplier.');
      return;
    }
    if (advanceAmountInput <= 0) {
      alert('Please enter a valid advance amount greater than 0.');
      return;
    }

    recordSupplierDebtPayment(advanceSupplierId, advanceAmountInput, advanceMethod, advanceNote);
    setIsAdvanceModalOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSupplier) {
      confirmAction({
        title: 'Confirm Save Supplier Edits',
        message: `Are you sure you want to save changes for supplier "${editingSupplier.name}"?`,
        actionType: 'EDIT',
        onConfirm: () => {
          updateSupplier({
            ...editingSupplier,
            name: name.trim(),
            phone: phone.trim(),
            companyName: companyName.trim() || undefined,
            address: address.trim() || undefined,
            advanceBalance: Number(advanceBalance),
          });
          setIsModalOpen(false);
        },
      });
      return;
    } else {
      addSupplier({
        name: name.trim(),
        phone: phone.trim(),
        companyName: companyName.trim() || undefined,
        address: address.trim() || undefined,
        advanceBalance: Number(advanceBalance),
      });
      setIsModalOpen(false);
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.companyName && s.companyName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPayables = suppliers.reduce((sum, s) => sum + s.pendingPayable, 0);
  const totalAdvance = suppliers.reduce((sum, s) => sum + (s.advanceBalance || 0), 0);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-tight sm:tracking-wider text-slate-500 dark:text-slate-400 truncate">Total Suppliers</p>
            <p className="text-xs sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 truncate">{suppliers.length}</p>
          </div>
          <div className="rounded-lg sm:rounded-xl bg-indigo-50 p-1.5 sm:p-2.5 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0 ml-1">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-amber-200/80 bg-amber-50/40 p-2.5 sm:p-4 shadow-2xs dark:border-amber-900/40 dark:bg-amber-950/20 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-tight sm:tracking-wider text-amber-700 dark:text-amber-400 truncate">Pending Payables</p>
            <p className="text-xs sm:text-xl font-extrabold text-amber-700 dark:text-amber-400 mt-0.5 truncate">NPR {totalPayables.toLocaleString()}</p>
          </div>
          <div className="rounded-lg sm:rounded-xl bg-amber-100 p-1.5 sm:p-2.5 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 shrink-0 ml-1">
            <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-xl sm:rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-2.5 sm:p-4 shadow-2xs dark:border-emerald-900/40 dark:bg-emerald-950/20 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-tight sm:tracking-wider text-emerald-700 dark:text-emerald-400 truncate">Advance Balance Paid</p>
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
            Registered Suppliers ({filtered.length})
          </h3>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search supplier, ID (e.g. SUPP-1001)..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <button
              onClick={() => handleOpenAdvanceModal()}
              className="flex items-center gap-1.5 shrink-0 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-teal-700 active:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-700"
              id="pay-supplier-advance-btn"
              title="Pay Advance to Supplier"
            >
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Pay Advance</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 shrink-0 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              id="add-supplier-btn"
              title="Add New Supplier"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Supplier</span>
            </button>
          </div>
        </div>

        {/* Mobile Supplier Cards View */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              No suppliers found. Suppliers auto-register when logging stock purchases.
            </div>
          ) : (
            filtered.map((s) => (
              <div
                key={`mob-supp-${s.id}`}
                className="p-3.5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{s.name}</h3>
                    {s.companyName && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">{s.companyName}</span>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-200/60 dark:border-indigo-800/60">
                        {s.id.toUpperCase()}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
                        {s.phone}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 rounded-lg shrink-0"
                  >
                    Edit
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block font-medium">Pending Payables</span>
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
                  <div className="col-span-2">
                    <span className="text-slate-400 block font-medium">Total Goods Bought</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      NPR {s.totalPurchased.toLocaleString()}
                    </span>
                  </div>
                </div>

                {s.address && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <MapPin className="h-3 w-3 text-indigo-500 shrink-0" />
                    <span>{s.address}</span>
                  </div>
                )}

                <button
                  onClick={() => handleOpenAdvanceModal(s.id)}
                  className="w-full py-2 rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs active:scale-98"
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>Pay Advance to Supplier</span>
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
                <th className="p-3 font-semibold border-r border-slate-200 dark:border-slate-800">Supplier ID & Company Name</th>
                <th className="p-3 font-semibold border-r border-slate-200 dark:border-slate-800">Contact Phone</th>
                <th className="p-3 font-semibold border-r border-slate-200 dark:border-slate-800">Depot Address</th>
                <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Total Goods Bought</th>
                <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Pending Payables</th>
                <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Advance Balance</th>
                <th className="p-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No suppliers found. Suppliers auto-register when logging stock purchases.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
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
                    <td className="p-3 font-mono text-slate-500 border-r border-slate-200 dark:border-slate-800/80">{s.phone}</td>
                    <td className="p-3 text-slate-500 border-r border-slate-200 dark:border-slate-800/80">{s.address || 'N/A'}</td>
                    <td className="p-3 text-right font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800/80">
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
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenAdvanceModal(s.id)}
                          className="rounded-lg bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-100 dark:bg-teal-950/60 dark:text-teal-300 dark:hover:bg-teal-900/80 border border-teal-200 dark:border-teal-800"
                          title="Pay Advance to Supplier"
                        >
                          Pay Advance
                        </button>
                        <button
                          onClick={() => handleOpenEdit(s)}
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

      {/* ADD / EDIT SUPPLIER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {editingSupplier ? 'Edit Supplier Profile' : 'Register New Supplier'}
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
                  Supplier / Distributor Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. CG Foods Nepal"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Company Name (Optional)
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Chaudhary Group Distribution"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 01-5542211"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    Advance Paid (NPR)
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

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Depot Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Sanepa, Lalitpur"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
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
                  id="save-supplier-btn"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GIVE ADVANCE PAYMENT TO SUPPLIER MODAL */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Pay Advance to Supplier</h3>
                  <p className="text-xs text-slate-500">Record advance deposit paid to vendor anytime</p>
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
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Supplier</label>
                <select
                  value={advanceSupplierId}
                  onChange={(e) => setAdvanceSupplierId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  id="advance-supplier-select"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.companyName || s.phone}) • Dues: NPR {s.pendingPayable.toLocaleString()} | Advance: NPR {(s.advanceBalance || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {advanceSupplierId && (() => {
                const selectedSupp = suppliers.find((s) => s.id === advanceSupplierId);
                if (!selectedSupp) return null;
                return (
                  <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 p-3 border border-teal-200 dark:border-teal-900/50 text-xs space-y-1">
                    <p className="font-bold text-teal-900 dark:text-teal-200">{selectedSupp.name}</p>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300 text-[11px]">
                      <span>Pending Payables (Due):</span>
                      <span className="font-bold text-amber-700 dark:text-amber-400">NPR {selectedSupp.pendingPayable.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300 text-[11px]">
                      <span>Current Advance Paid:</span>
                      <span className="font-bold text-teal-700 dark:text-teal-300">NPR {(selectedSupp.advanceBalance || 0).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Advance Amount Paid (NPR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={advanceAmountInput || ''}
                  onChange={(e) => setAdvanceAmountInput(Math.max(0, Number(e.target.value)))}
                  placeholder="e.g. 10000"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  id="advance-supplier-amount-input"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Method</label>
                <select
                  value={advanceMethod}
                  onChange={(e) => setAdvanceMethod(e.target.value as PaymentMethod)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="FONEPAY">FonePay / QR</option>
                  <option value="ESEWA">eSewa</option>
                  <option value="KHALTI">Khalti</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notes / Remarks</label>
                <input
                  type="text"
                  value={advanceNote}
                  onChange={(e) => setAdvanceNote(e.target.value)}
                  placeholder="e.g. Advance payment sent for upcoming stock shipment"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
                  className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 transition shadow-md"
                  id="submit-pay-supplier-advance-btn"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Confirm Advance Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
