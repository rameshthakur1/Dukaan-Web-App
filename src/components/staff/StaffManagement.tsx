import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StaffMember, StaffPayment, PaymentMethod } from '../../types';
import { PasswordStrengthIndicator } from '../common/PasswordStrengthIndicator';
import {
  cleanPhoneNumber,
  isValidNepaliPhoneNumber,
  validateNepaliPhoneNumber,
} from '../../utils/phoneValidation';
import {
  Users,
  UserCheck,
  UserPlus,
  Banknote,
  Wallet,
  Receipt,
  Search,
  Filter,
  Plus,
  Calendar,
  Phone,
  Building,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Printer,
  Trash2,
  Edit2,
  X,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  CreditCard,
  Building2,
  Check,
  Key,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';

export const StaffManagement: React.FC = () => {
  const {
    staffList,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    requestStaffAccount,
    approveStaffAccount,
    rejectStaffAccount,
    staffPayments,
    recordStaffPayment,
    deleteStaffPayment,
    storeBranches,
    shopProfile,
    confirmAction,
    currentUser,
  } = useApp();

  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const togglePasswordVisibility = (staffId: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [staffId]: !prev[staffId] }));
  };

  // Inline Password Editing State
  const [editingPasswordStaffId, setEditingPasswordStaffId] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');

  const handleStartEditPassword = (staff: StaffMember) => {
    setEditingPasswordStaffId(staff.id);
    setNewPasswordInput(staff.password || '');
    // Auto un-hide password when editing
    setVisiblePasswords((prev) => ({ ...prev, [staff.id]: true }));
  };

  const handleSavePassword = (staff: StaffMember) => {
    if (!newPasswordInput.trim()) {
      alert('Password cannot be empty');
      return;
    }
    updateStaffMember({
      ...staff,
      password: newPasswordInput.trim(),
    });
    setEditingPasswordStaffId(null);
  };

  // Active inner sub-tab: 'directory' | 'history'
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'history'>('directory');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'>('ALL');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'ALL' | 'SALARY' | 'ADVANCE' | 'BONUS' | 'OVERTIME'>('ALL');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL');

  // Modals state
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payTargetStaff, setPayTargetStaff] = useState<StaffMember | null>(null);

  const [selectedPaymentForSlip, setSelectedPaymentForSlip] = useState<StaffPayment | null>(null);

  // Form states for Staff (Add/Edit)
  const [staffForm, setStaffForm] = useState({
    name: '',
    phone: '',
    role: '',
    username: '',
    password: '',
    storeBranch: 'Main Store Branch',
    basicSalary: '',
    salaryType: 'MONTHLY' as 'MONTHLY' | 'WEEKLY' | 'DAILY',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE',
    address: '',
    notes: '',
    canDoSales: true,
    canDoPurchase: true,
    canDoAdvances: true,
    canManageStock: true,
    canViewReports: false,
  });

  // Form states for Payment
  const [payForm, setPayForm] = useState({
    staffId: '',
    paymentType: 'SALARY' as 'SALARY' | 'ADVANCE' | 'BONUS' | 'OVERTIME',
    amount: '',
    monthFor: `Shrawan ${new Date().getFullYear()} (${new Date().toLocaleString('default', { month: 'long' })})`,
    paymentMethod: 'CASH' as PaymentMethod,
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // --- SECTION 3 DASHBOARD CALCULATIONS ---
  const activeStaffCount = useMemo(() => {
    return staffList.filter((s) => s.status === 'ACTIVE').length;
  }, [staffList]);

  const totalBasicSalaryCommitment = useMemo(() => {
    return staffList
      .filter((s) => s.status === 'ACTIVE')
      .reduce((sum, s) => sum + (s.basicSalary || 0), 0);
  }, [staffList]);

  const totalPaymentsDisbursed = useMemo(() => {
    return staffPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [staffPayments]);

  // Total paid per staff calculation map
  const paidPerStaffMap = useMemo(() => {
    const map: Record<string, number> = {};
    staffPayments.forEach((p) => {
      map[p.staffId] = (map[p.staffId] || 0) + p.amount;
    });
    return map;
  }, [staffPayments]);

  // Filtered staff members
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      const matchesSearch =
        staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.phone.includes(searchTerm) ||
        staff.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || staff.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [staffList, searchTerm, statusFilter]);

  // Filtered staff payments history
  const filteredPayments = useMemo(() => {
    return staffPayments.filter((p) => {
      const matchesSearch =
        p.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.paymentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.monthFor && p.monthFor.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = paymentTypeFilter === 'ALL' || p.paymentType === paymentTypeFilter;
      const matchesStaff = selectedStaffFilter === 'ALL' || p.staffId === selectedStaffFilter;
      return matchesSearch && matchesType && matchesStaff;
    });
  }, [staffPayments, searchTerm, paymentTypeFilter, selectedStaffFilter]);

  // Handlers for Staff Add/Edit
  const handleOpenAddStaff = () => {
    setEditingStaff(null);
    setStaffForm({
      name: '',
      phone: '',
      role: 'Sales Assistant',
      username: '',
      password: '',
      storeBranch: storeBranches[0]?.name || 'Main Store Branch',
      basicSalary: '20000',
      salaryType: 'MONTHLY',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      address: '',
      notes: '',
      canDoSales: true,
      canDoPurchase: true,
      canDoAdvances: true,
      canManageStock: true,
      canViewReports: false,
    });
    setIsAddStaffOpen(true);
  };

  const handleOpenEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setStaffForm({
      name: staff.name,
      phone: staff.phone,
      role: staff.role,
      username: staff.username || '',
      password: staff.password || '',
      storeBranch: staff.storeBranch || storeBranches[0]?.name || 'Main Store Branch',
      basicSalary: String(staff.basicSalary),
      salaryType: staff.salaryType,
      joinDate: staff.joinDate,
      status: staff.status,
      address: staff.address || '',
      notes: staff.notes || '',
      canDoSales: staff.permissions?.canDoSales ?? true,
      canDoPurchase: staff.permissions?.canDoPurchase ?? true,
      canDoAdvances: staff.permissions?.canDoAdvances ?? true,
      canManageStock: staff.permissions?.canManageStock ?? true,
      canViewReports: staff.permissions?.canViewReports ?? false,
    });
    setIsAddStaffOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name.trim() || !staffForm.phone.trim()) {
      alert('Please enter Staff Name and Phone Number');
      return;
    }

    const phoneVal = validateNepaliPhoneNumber(staffForm.phone, true);
    if (!phoneVal.isValid) {
      alert(phoneVal.message);
      return;
    }

    const cleanPhone = phoneVal.cleanPhone;
    const salaryNum = parseFloat(staffForm.basicSalary) || 0;
    const permissionsObj = {
      canDoSales: staffForm.canDoSales,
      canDoPurchase: staffForm.canDoPurchase,
      canDoAdvances: staffForm.canDoAdvances,
      canManageStock: staffForm.canManageStock,
      canViewReports: staffForm.canViewReports,
    };

    if (editingStaff) {
      confirmAction({
        title: 'Confirm Save Staff Edits',
        message: `Are you sure you want to save changes for staff member "${editingStaff.name}"?`,
        actionType: 'EDIT',
        onConfirm: () => {
          updateStaffMember({
            ...editingStaff,
            name: staffForm.name.trim(),
            phone: cleanPhone,
            role: staffForm.role.trim() || 'Staff',
            username: staffForm.username.trim() || editingStaff.username,
            password: staffForm.password.trim() || editingStaff.password,
            storeBranch: staffForm.storeBranch,
            permissions: permissionsObj,
            basicSalary: salaryNum,
            salaryType: staffForm.salaryType,
            joinDate: staffForm.joinDate,
            status: staffForm.status,
            address: staffForm.address.trim(),
            notes: staffForm.notes.trim(),
          });
          setIsAddStaffOpen(false);
        },
      });
      return;
    } else {
      addStaffMember({
        name: staffForm.name.trim(),
        phone: cleanPhone,
        role: staffForm.role.trim() || 'Staff',
        username: undefined,
        password: undefined,
        accountRequestStatus: 'NONE',
        storeBranch: staffForm.storeBranch,
        permissions: permissionsObj,
        basicSalary: salaryNum,
        salaryType: staffForm.salaryType,
        joinDate: staffForm.joinDate,
        status: staffForm.status,
        address: staffForm.address.trim(),
        notes: staffForm.notes.trim(),
      });
      setIsAddStaffOpen(false);
    }
  };

  // Handlers for Salary Payment
  const handleOpenPayModal = (staff?: StaffMember) => {
    const target = staff || staffList[0];
    setPayTargetStaff(target || null);
    setPayForm({
      staffId: target ? target.id : '',
      paymentType: 'SALARY',
      amount: target ? String(target.basicSalary) : '20000',
      monthFor: `Shrawan ${new Date().getFullYear()} (${new Date().toLocaleString('default', { month: 'long' })})`,
      paymentMethod: 'CASH',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsPayModalOpen(true);
  };

  const handleSelectPayStaffChange = (staffId: string) => {
    const target = staffList.find((s) => s.id === staffId);
    setPayTargetStaff(target || null);
    setPayForm((prev) => ({
      ...prev,
      staffId,
      amount: target ? String(target.basicSalary) : prev.amount,
    }));
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payForm.amount);
    if (!payForm.staffId || isNaN(amountNum) || amountNum <= 0) {
      alert('Please select a staff member and enter a valid payment amount');
      return;
    }

    const staffObj = staffList.find((s) => s.id === payForm.staffId);
    if (!staffObj) {
      alert('Selected staff member not found');
      return;
    }

    const newPayment = recordStaffPayment({
      staffId: staffObj.id,
      staffName: staffObj.name,
      amount: amountNum,
      paymentType: payForm.paymentType,
      monthFor: payForm.monthFor.trim(),
      paymentMethod: payForm.paymentMethod,
      paymentDate: payForm.paymentDate,
      notes: payForm.notes.trim(),
    });

    setIsPayModalOpen(false);
    // Optionally view salary slip immediately
    setSelectedPaymentForSlip(newPayment);
  };

  // Handle Slip Printing
  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Staff & Basic Salary Ledger
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage shop employees, basic salary structures, and salary payout history
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddStaff}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition active:scale-95"
            id="add-staff-btn"
          >
            <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Add Staff Member</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenPayModal()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition active:scale-95"
            id="record-salary-payment-btn"
          >
            <Banknote className="h-4 w-4" />
            <span>Pay Salary / Advance</span>
          </button>
        </div>
      </div>

      {/* SECTION 3 DASHBOARD CARDS (3 Dash Summary Widgets) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dash Card 1: Active Staff Count */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-900 dark:to-blue-950/40 border border-blue-100 dark:border-blue-900/40 p-5 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Active Staff Members
            </span>
            <div className="p-2.5 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {activeStaffCount}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              / {staffList.length} Total Registered
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{staffList.filter((s) => s.status === 'ACTIVE').length} Active & On Shift</span>
          </div>
        </div>

        {/* Dash Card 2: Total Monthly Basic Salary Commitment */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-slate-900 dark:to-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 p-5 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Monthly Basic Salary
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{shopProfile.currencySymbol}</span>
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {totalBasicSalaryCommitment.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/ mo</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span>Base payroll budget for active staff</span>
          </div>
        </div>

        {/* Dash Card 3: Total Salary Payments Paid (Disbursed) */}
        <div className="bg-gradient-to-br from-purple-50 to-violet-50/50 dark:from-slate-900 dark:to-purple-950/40 border border-purple-100 dark:border-purple-900/40 p-5 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Total Salary Disbursed
            </span>
            <div className="p-2.5 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{shopProfile.currencySymbol}</span>
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {totalPaymentsDisbursed.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-purple-700 dark:text-purple-300">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>{staffPayments.length} Salary & Advance Payouts Recorded</span>
          </div>
        </div>
      </div>

      {/* Sub-Tab Selector & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          {/* Inner Sub-Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveSubTab('directory')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
                activeSubTab === 'directory'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              id="staff-directory-subtab"
            >
              <Users className="h-4 w-4" />
              <span>Staff & Basic Salary ({staffList.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('history')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
                activeSubTab === 'history'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              id="salary-history-subtab"
            >
              <Receipt className="h-4 w-4" />
              <span>Payment History Log ({staffPayments.length})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                activeSubTab === 'directory'
                  ? 'Search staff by name, phone, role...'
                  : 'Search payment history by staff name, payment no...'
              }
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Sub-Tab 1: STAFF DIRECTORY & BASIC SALARY DETAILS */}
        {activeSubTab === 'directory' && (
          <div>
            {/* Filters */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
                <Filter className="h-3.5 w-3.5" /> Status:
              </span>
              {(['ALL', 'ACTIVE', 'INACTIVE', 'ON_LEAVE'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {status === 'ALL' ? 'All Staff' : status === 'ON_LEAVE' ? 'On Leave' : status}
                </button>
              ))}
            </div>

            {filteredStaff.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Users className="h-10 w-10 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No staff members found</p>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or add a new staff member.</p>
                <button
                  type="button"
                  onClick={handleOpenAddStaff}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  <Plus className="h-4 w-4" /> Add First Staff Member
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStaff.map((staff) => {
                  const totalPaid = paidPerStaffMap[staff.id] || 0;
                  return (
                    <div
                      key={staff.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-blue-300 dark:hover:border-blue-800 transition flex flex-col justify-between"
                    >
                      <div>
                        {/* Header details */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm border border-blue-200 dark:border-blue-800">
                              {staff.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                {staff.name}
                              </h3>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {staff.role}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                                staff.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                  : staff.status === 'ON_LEAVE'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {staff.status === 'ON_LEAVE' ? 'On Leave' : staff.status}
                            </span>

                            {/* Request Account option near Active icon */}
                            {!staff.username && (!staff.accountRequestStatus || staff.accountRequestStatus === 'NONE') && (
                              <button
                                type="button"
                                onClick={() => requestStaffAccount(staff.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition shadow-xs active:scale-95 cursor-pointer"
                                title="Request staff login account from System Admin"
                              >
                                <Key className="h-3 w-3 text-amber-300" />
                                <span>Request Account</span>
                              </button>
                            )}

                            {staff.accountRequestStatus === 'PENDING' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 animate-pulse">
                                <Clock className="h-3 w-3 text-amber-500" />
                                <span>Pending Admin Approval</span>
                              </span>
                            )}

                            {staff.accountRequestStatus === 'REJECTED' && (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                                  <X className="h-3 w-3 text-rose-500" />
                                  <span>Declined by Admin</span>
                                </span>
                                {currentUser?.role !== 'SUPER_ADMIN' && (
                                  <button
                                    type="button"
                                    onClick={() => requestStaffAccount(staff.id)}
                                    className="px-2 py-0.5 text-[10px] font-extrabold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition shadow-xs cursor-pointer active:scale-95"
                                  >
                                    Request Again
                                  </button>
                                )}
                              </div>
                            )}

                            {staff.accountRequestStatus === 'APPROVED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                <span>Account Approved</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Basic Salary Box */}
                        <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                              <Wallet className="h-3.5 w-3.5 text-blue-500" /> Basic Salary:
                            </span>
                            <span className="font-extrabold text-slate-900 dark:text-white font-mono">
                              {shopProfile.currencySymbol} {staff.basicSalary.toLocaleString()} / {staff.salaryType.toLowerCase()}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                              <Receipt className="h-3.5 w-3.5 text-emerald-500" /> Total Paid to Date:
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                              {shopProfile.currencySymbol} {totalPaid.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* APPROVED USER ID & PASSWORD BOX */}
                        {staff.accountRequestStatus === 'APPROVED' && (
                          <div className="mt-3 p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-3">
                            <div className="flex items-center justify-between text-purple-300 font-extrabold text-xs">
                              <span className="flex items-center gap-1.5">
                                <Key className="h-4 w-4 text-purple-400" />
                                <span>Staff Account Credentials</span>
                              </span>
                              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30">
                                READY TO LOG IN
                              </span>
                            </div>

                            <div className="space-y-2.5 text-xs">
                              {/* USER ID BOX */}
                              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">USER ID:</span>
                                  <span className="font-mono font-black text-white text-sm break-all">
                                    {staff.username || 'Generating...'}
                                  </span>
                                </div>
                                {staff.username && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(staff.username || '');
                                      alert('User ID copied to clipboard!');
                                    }}
                                    className="p-2 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/60 text-purple-200 transition cursor-pointer shrink-0"
                                    title="Copy User ID"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                )}
                              </div>

                              {/* PASSWORD BOX */}
                              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2.5">
                                {/* TOP ROW: PASSWORD LABEL + VALUE */}
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">PASSWORD:</span>
                                  {editingPasswordStaffId === staff.id ? (
                                    <div className="flex items-center gap-1.5 w-full max-w-xs">
                                      <input
                                        type="text"
                                        value={newPasswordInput}
                                        onChange={(e) => setNewPasswordInput(e.target.value)}
                                        className="w-full px-2 py-1 text-xs font-mono font-bold rounded bg-purple-950 border border-purple-400 text-purple-200 outline-none"
                                        placeholder="New password"
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSavePassword(staff)}
                                        className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shrink-0"
                                        title="Save Password"
                                      >
                                        <Check className="h-4 w-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingPasswordStaffId(null)}
                                        className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer shrink-0"
                                        title="Cancel"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="font-mono font-black text-white text-sm break-all tracking-wide select-all">
                                      {visiblePasswords[staff.id] === false ? '••••••••' : (staff.password || 'pass123')}
                                    </span>
                                  )}
                                </div>

                                {/* BOTTOM ROW: BUTTONS (HIDE/SHOW, EDIT, COPY) */}
                                {editingPasswordStaffId !== staff.id && (
                                  <div className="flex items-center justify-center gap-2 pt-0.5">
                                    <button
                                      type="button"
                                      onClick={() => togglePasswordVisibility(staff.id)}
                                      className="px-3 py-1.5 rounded-lg bg-purple-950/60 border border-purple-800/60 text-purple-200 hover:bg-purple-900/80 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                                      title="Show / Hide Password"
                                    >
                                      {visiblePasswords[staff.id] === false ? (
                                        <>
                                          <Eye className="h-3.5 w-3.5 text-purple-300" />
                                          <span>Show</span>
                                        </>
                                      ) : (
                                        <>
                                          <EyeOff className="h-3.5 w-3.5 text-purple-300" />
                                          <span>Hide</span>
                                        </>
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleStartEditPassword(staff)}
                                      className="px-3 py-1.5 rounded-lg bg-purple-950/60 border border-purple-800/60 text-purple-200 hover:bg-purple-900/80 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                                      title="Edit Staff Password"
                                    >
                                      <Edit2 className="h-3.5 w-3.5 text-purple-300" />
                                      <span>Edit</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(staff.password || 'pass123');
                                        alert('Password copied to clipboard!');
                                      }}
                                      className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-800/60 text-purple-200 hover:bg-purple-900/80 transition cursor-pointer"
                                      title="Copy Password"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Contact details */}
                        <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">

                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              Branch: {staff.storeBranch || 'Main Store Branch'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="font-mono">{staff.phone}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>Joined: {staff.joinDate}</span>
                          </div>

                          {/* Entry Permission Badges */}
                          <div className="pt-2 flex flex-wrap gap-1">
                            {staff.permissions?.canDoSales !== false && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                Sales
                              </span>
                            )}
                            {staff.permissions?.canDoPurchase !== false && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                Purchases
                              </span>
                            )}
                            {staff.permissions?.canDoAdvances !== false && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                Advances
                              </span>
                            )}
                            {staff.permissions?.canManageStock !== false && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                Stock
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenPayModal(staff)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition"
                        >
                          <Banknote className="h-3.5 w-3.5" /> Pay Salary
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditStaff(staff)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                          title="Edit Staff / Basic Salary"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            confirmAction({
                              title: 'Confirm Delete Staff Member',
                              message: `Are you sure you want to delete staff member "${staff.name}"? This action cannot be undone.`,
                              actionType: 'DELETE',
                              onConfirm: () => deleteStaffMember(staff.id),
                            });
                          }}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition"
                          title="Delete Staff Member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Sub-Tab 2: SALARY PAYMENT HISTORY LOG */}
        {activeSubTab === 'history' && (
          <div className="space-y-4">
            {/* Payment History Filter Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                  Filter Type:
                </span>
                {(['ALL', 'SALARY', 'ADVANCE', 'BONUS', 'OVERTIME'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setPaymentTypeFilter(type)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      paymentTypeFilter === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">Staff:</span>
                <select
                  value={selectedStaffFilter}
                  onChange={(e) => setSelectedStaffFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                >
                  <option value="ALL">All Staff Members</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment History Table */}
            {filteredPayments.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Receipt className="h-10 w-10 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No salary payment history records
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Click "Pay Salary / Advance" to record a salary payout for a staff member.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenPayModal()}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  <Banknote className="h-4 w-4" /> Record Salary Payment
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">Payment Ref</th>
                      <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">Date</th>
                      <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">Staff Name</th>
                      <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">Type</th>
                      <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">For Month / Period</th>
                      <th className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">Payment Method</th>
                      <th className="px-4 py-3 text-right border-r border-slate-200 dark:border-slate-800">Amount Paid</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition border-b border-slate-200 dark:border-slate-800/80 last:border-b-0">
                        <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400 border-r border-slate-200 dark:border-slate-800/80">
                          {p.paymentNo}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800/80">
                          {p.paymentDate}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800/80">
                          {p.staffName}
                        </td>
                        <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-800/80">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              p.paymentType === 'SALARY'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : p.paymentType === 'ADVANCE'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                : p.paymentType === 'BONUS'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                            }`}
                          >
                            {p.paymentType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium border-r border-slate-200 dark:border-slate-800/80">
                          {p.monthFor || '—'}
                        </td>
                        <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-800/80">
                          <span className="font-mono font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px]">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-slate-900 dark:text-white font-mono border-r border-slate-200 dark:border-slate-800/80">
                          {shopProfile.currencySymbol} {p.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedPaymentForSlip(p)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 hover:bg-blue-100 transition"
                              title="Print / View Salary Voucher Slip"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                confirmAction({
                                  title: 'Confirm Void Salary Payment',
                                  message: `Are you sure you want to void payment record ${p.paymentNo} (${shopProfile.currencySymbol} ${p.amount.toLocaleString()}) for ${p.staffName}?`,
                                  actionType: 'DELETE',
                                  onConfirm: () => deleteStaffPayment(p.id),
                                });
                              }}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 hover:bg-red-100 transition"
                              title="Delete Payment Record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: ADD / EDIT STAFF MEMBER */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-500" />
                <span>{editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}</span>
              </h2>
              <button
                onClick={() => setIsAddStaffOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              {/* Full Name */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="e.g. Bikash Tamang"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 font-normal text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Phone Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-600 dark:text-slate-300 font-medium">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {staffForm.phone ? `${staffForm.phone.length}/10` : '10 Digits (98/97/96)'}
                  </span>
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: cleanPhoneNumber(e.target.value) })}
                  placeholder="e.g. 9812345678"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    staffForm.phone && !isValidNepaliPhoneNumber(staffForm.phone)
                      ? 'border-amber-400 bg-amber-50/20'
                      : staffForm.phone && isValidNepaliPhoneNumber(staffForm.phone)
                      ? 'border-emerald-400 bg-emerald-50/20'
                      : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60'
                  } font-mono text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition`}
                />
                {staffForm.phone && (
                  <div className="text-[10px] mt-1">
                    {isValidNepaliPhoneNumber(staffForm.phone) ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Valid Nepali mobile number
                      </span>
                    ) : staffForm.phone.length < 2 ? (
                      <span className="text-slate-400">Must start with 98, 97, or 96</span>
                    ) : !['98', '97', '96'].includes(staffForm.phone.slice(0, 2)) ? (
                      <span className="text-rose-500 font-medium">
                        ⚠️ Must start with 98, 97, or 96 (starts with '{staffForm.phone.slice(0, 2)}')
                      </span>
                    ) : (
                      <span className="text-amber-500">
                        {10 - staffForm.phone.length} more digit{10 - staffForm.phone.length > 1 ? 's' : ''} (10 required)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Role / Designation */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Role / Designation
                </label>
                <input
                  type="text"
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  placeholder="e.g. Sales Assistant"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 font-normal text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Assigned Store Outlet / Branch */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Assigned Store Outlet / Branch
                </label>
                <select
                  value={staffForm.storeBranch}
                  onChange={(e) => setStaffForm({ ...staffForm, storeBranch: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition"
                >
                  {storeBranches.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name} ({b.code}) {b.isMain ? '— Main Store' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* BASIC SALARY DETAILS SECTION */}
              <div className="sm:col-span-2 p-3 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-blue-950 dark:text-blue-300 font-medium mb-1">
                    Basic Salary ({shopProfile.currencySymbol}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="500"
                    value={staffForm.basicSalary}
                    onChange={(e) => setStaffForm({ ...staffForm, basicSalary: e.target.value })}
                    placeholder="e.g. 25000"
                    className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800/80 bg-white dark:bg-slate-900 font-mono font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-blue-950 dark:text-blue-300 font-medium mb-1">
                    Salary Cycle
                  </label>
                  <select
                    value={staffForm.salaryType}
                    onChange={(e) =>
                      setStaffForm({
                        ...staffForm,
                        salaryType: e.target.value as 'MONTHLY' | 'WEEKLY' | 'DAILY',
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800/80 bg-white dark:bg-slate-900 font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="DAILY">Daily</option>
                  </select>
                </div>
              </div>

              {/* Join Date */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Join Date
                </label>
                <input
                  type="date"
                  value={staffForm.joinDate}
                  onChange={(e) => setStaffForm({ ...staffForm, joinDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 font-normal text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Status
                </label>
                <select
                  value={staffForm.status}
                  onChange={(e) =>
                    setStaffForm({
                      ...staffForm,
                      status: e.target.value as 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE',
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ON_LEAVE">ON LEAVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={staffForm.address}
                  onChange={(e) => setStaffForm({ ...staffForm, address: e.target.value })}
                  placeholder="e.g. New Road, Ward 3, Kathmandu"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 font-normal text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* STAFF LOGIN CREDENTIALS (EDITABLE IF APPROVED BY ADMIN) */}
              {editingStaff && editingStaff.accountRequestStatus === 'APPROVED' && (
                <div className="sm:col-span-2 p-3 bg-purple-50/40 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/50 space-y-1.5">
                  <div className="flex items-center justify-between text-purple-900 dark:text-purple-300 font-medium text-xs">
                    <span className="flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5 text-purple-500" />
                      <span>Edit Staff Login Password</span>
                    </span>
                    <span className="text-[10px] text-purple-400 font-mono">User ID: {editingStaff.username}</span>
                  </div>
                  <input
                    type="text"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    placeholder="Enter new password (8+ chars recommended)"
                    className="w-full px-3 py-2 rounded-lg border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-900 font-mono text-purple-900 dark:text-purple-200 outline-none focus:border-purple-600 text-xs"
                  />
                  <PasswordStrengthIndicator password={staffForm.password || ''} isDark={false} />
                </div>
              )}

              {/* BUTTONS ROW */}
              <div className="sm:col-span-2 pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition active:scale-98 cursor-pointer"
                >
                  {editingStaff ? 'Update Staff' : 'Save Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PAY SALARY / ADVANCE */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Banknote className="h-5 w-5 text-emerald-600" />
                <span>Record Staff Salary Payout</span>
              </h2>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Select Staff Member <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={payForm.staffId}
                  onChange={(e) => handleSelectPayStaffChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                >
                  <option value="" disabled>
                    -- Select Employee --
                  </option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role}) — Basic: {shopProfile.currencySymbol} {s.basicSalary.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Payment Type
                  </label>
                  <select
                    value={payForm.paymentType}
                    onChange={(e) =>
                      setPayForm({
                        ...payForm,
                        paymentType: e.target.value as 'SALARY' | 'ADVANCE' | 'BONUS' | 'OVERTIME',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="SALARY">SALARY (Full/Part)</option>
                    <option value="ADVANCE">ADVANCE Salary</option>
                    <option value="BONUS">BONUS / Festival</option>
                    <option value="OVERTIME">OVERTIME Pay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Amount ({shopProfile.currencySymbol}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={payForm.amount}
                    onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                    placeholder="Amount"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-extrabold font-mono text-emerald-600 dark:text-emerald-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  For Month / Period Note
                </label>
                <input
                  type="text"
                  value={payForm.monthFor}
                  onChange={(e) => setPayForm({ ...payForm, monthFor: e.target.value })}
                  placeholder="e.g. Shrawan 2083 or July 2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Payment Method
                  </label>
                  <select
                    value={payForm.paymentMethod}
                    onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="CASH">CASH</option>
                    <option value="ESEWA">eSewa</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="FONEPAY">Fonepay / QR</option>
                    <option value="KHALTI">Khalti</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={payForm.paymentDate}
                    onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Notes / Reference
                </label>
                <input
                  type="text"
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  placeholder="e.g. Nabil Bank Transaction Ref #10293"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Confirm & Disburse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PRINTABLE SALARY VOUCHER SLIP */}
      {selectedPaymentForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-blue-600" /> Salary Voucher Slip
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintSlip}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Voucher
                </button>
                <button
                  onClick={() => setSelectedPaymentForSlip(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Formal Voucher Content Area */}
            <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white space-y-4">
              {/* Store Header */}
              <div className="text-center border-b border-dashed border-slate-300 dark:border-slate-700 pb-3">
                <h2 className="text-base font-extrabold">{shopProfile.shopName}</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{shopProfile.address.fullAddress}</p>
                <p className="text-[11px] text-slate-500 font-mono">PAN/VAT: {shopProfile.panVatNo} | Tel: {shopProfile.phone}</p>
                <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-black uppercase tracking-wider">
                  Official Staff Salary Receipt
                </div>
              </div>

              {/* Receipt Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Voucher No:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{selectedPaymentForSlip.paymentNo}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Date:</span>
                  <span className="font-semibold">{selectedPaymentForSlip.paymentDate}</span>
                </div>
              </div>

              {/* Employee Information */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee Name:</span>
                  <span className="font-bold">{selectedPaymentForSlip.staffName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Type:</span>
                  <span className="font-bold text-emerald-600">{selectedPaymentForSlip.paymentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">For Month / Period:</span>
                  <span className="font-semibold">{selectedPaymentForSlip.monthFor || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Method:</span>
                  <span className="font-mono font-semibold">{selectedPaymentForSlip.paymentMethod}</span>
                </div>
              </div>

              {/* Amount Box */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Net Paid Amount:</span>
                <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                  {shopProfile.currencySymbol} {selectedPaymentForSlip.amount.toLocaleString()}
                </span>
              </div>

              {selectedPaymentForSlip.notes && (
                <p className="text-[11px] text-slate-500 italic">
                  Note: {selectedPaymentForSlip.notes}
                </p>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-4 pt-6 text-center text-[10px] text-slate-500">
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1">
                  Employee Signature
                </div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1">
                  Authorized Manager Signature
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
