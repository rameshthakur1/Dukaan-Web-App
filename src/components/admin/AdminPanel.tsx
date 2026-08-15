import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AuthUser, SubscriptionPlan, AnnouncementTargetType, PlanFeatureConfig } from '../../types';
import { isAnnouncementTargetedToUser } from '../../utils/announcementUtils';
import { AdminEarningsDashboard } from './AdminEarningsDashboard';
import { PasswordStrengthIndicator } from '../common/PasswordStrengthIndicator';
import {
  ShieldCheck,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Calendar,
  Zap,
  Mail,
  Phone,
  Store,
  Trash2,
  UserX,
  X,
  Check,
  Crown,
  CreditCard,
  RefreshCw,
  Headphones,
  Save,
  Tag,
  Eye,
  Send,
  BarChart3,
  BookOpen,
  Globe,
  Megaphone,
  MapPin,
  TrendingUp,
  Activity,
  Plus,
  Bell,
  Menu,
  ChevronDown,
  Layers,
  Sparkles,
  Gift,
  Edit3,
  MessageSquare,
  Lock,
  CheckCheck,
  MessageCircle,
  ArrowLeft,
  KeyRound,
  EyeOff,
} from 'lucide-react';

const getAvatarBg = (name: string) => {
  const colors = [
    'bg-emerald-600 text-white',
    'bg-blue-600 text-white',
    'bg-purple-600 text-white',
    'bg-amber-600 text-white',
    'bg-teal-600 text-white',
    'bg-indigo-600 text-white',
    'bg-rose-600 text-white',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string) => {
  if (!name) return 'SP';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const LandingContentEditor: React.FC = () => {
  const { aboutUsText, updateAboutUsText, ourMissionText, updateOurMissionText } = useApp();
  const [aboutUsInput, setAboutUsInput] = useState(aboutUsText);
  const [ourMissionInput, setOurMissionInput] = useState(ourMissionText);
  const [saveNotice, setSaveNotice] = useState(false);

  useEffect(() => {
    setAboutUsInput(aboutUsText);
    setOurMissionInput(ourMissionText);
  }, [aboutUsText, ourMissionText]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateAboutUsText(aboutUsInput.trim());
    updateOurMissionText(ourMissionInput.trim());
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-400" />
              <span>Landing Page: About Us & Our Mission Editor</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Update the text displayed on the public landing page. Changes update automatically across the platform in real time.
            </p>
          </div>
        </div>

        {saveNotice && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <span>About Us & Our Mission texts successfully updated! Landing page synced automatically.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-blue-400" />
              <span>About Us Section Content</span>
            </label>
            <textarea
              rows={6}
              value={aboutUsInput}
              onChange={(e) => setAboutUsInput(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500 font-medium leading-relaxed"
              placeholder="Enter About Us description..."
              required
            />
            <p className="text-[11px] text-slate-500">
              Descriptive overview of Dukaan.io, its target merchants, and core retail management capabilities.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Our Mission Section Content</span>
            </label>
            <textarea
              rows={6}
              value={ourMissionInput}
              onChange={(e) => setOurMissionInput(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500 font-medium leading-relaxed"
              placeholder="Enter Our Mission description..."
              required
            />
            <p className="text-[11px] text-slate-500">
              Core mission statement focusing on digital empowerment for local store owners and retail merchants.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 transition active:scale-95 flex items-center gap-2 cursor-pointer"
              id="save-landing-content-btn"
            >
              <Save className="h-4 w-4" />
              <span>Save & Publish Automatically</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AdminPanel: React.FC = () => {
  const {
    currentUser,
    registeredUsers,
    approveUserRequest,
    rejectOrExpireUser,
    extendUserTrial,
    deleteUserAccount,
    getDaysRemainingInTrial,
    isAccountTrialExpired,
    planPrices,
    updatePlanPrices,
    planFeatures,
    updatePlanFeatures,
    supportMessages,
    updateSupportMessageStatus,
    replyToSupportMessage,
    deleteSupportMessage,
    adminViewMode,
    setAdminViewMode,
    startImpersonatingStore,
    systemAnnouncements,
    addSystemAnnouncement,
    deleteSystemAnnouncement,
    toggleAnnouncementActive,
    coupons,
    addCoupon,
    deleteCoupon,
    toggleCouponActive,
    confirmAction,
    activeAdminSubTab,
    setActiveAdminSubTab,
    staffList,
    approveStaffAccount,
    rejectStaffAccount,
    deleteStaffMember,
    approveStaffUserIdAccess,
    rejectStaffUserIdAccess,
    referralRewardRule,
    updateReferralRewardRule,
    updateUserPassword,
    changeCurrentPassword,
    aboutUsText,
    updateAboutUsText,
    ourMissionText,
    updateOurMissionText,
  } = useApp();

  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState<boolean>(false);

  // Admin Change Password Modal State
  const [selectedUserForPasswordChange, setSelectedUserForPasswordChange] = useState<AuthUser | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPasswordModalState, setShowPasswordModalState] = useState(false);
  const [passNotice, setPassNotice] = useState<{ message: string; isError: boolean } | null>(null);

  const handleAdminChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPasswordChange) return;

    if (!newPasswordInput || newPasswordInput.trim().length < 4) {
      setPassNotice({ message: 'Password must be at least 4 characters long.', isError: true });
      return;
    }

    if (newPasswordInput.trim() !== confirmPasswordInput.trim()) {
      setPassNotice({ message: 'New password and confirm password do not match.', isError: true });
      return;
    }

    const res = updateUserPassword(selectedUserForPasswordChange.id, newPasswordInput.trim());
    if (res.success) {
      setPassNotice({ message: res.message, isError: false });
      setTimeout(() => {
        setSelectedUserForPasswordChange(null);
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        setPassNotice(null);
      }, 1500);
    } else {
      setPassNotice({ message: res.message, isError: true });
    }
  };

  // Search & Filters for Staff IDs Tab
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [staffFilterStatus, setStaffFilterStatus] = useState<string>('ALL');
  const [showPasswordState, setShowPasswordState] = useState<Record<string, boolean>>({});

  // Search & Filters for Store Registry
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState<string>('ALL');
  const [selectedUserForApproval, setSelectedUserForApproval] = useState<AuthUser | null>(null);

  // Communication Sub-Tab State
  const [commSubTab, setCommSubTab] = useState<'SUPPORT_CHAT' | 'ANNOUNCEMENTS'>('SUPPORT_CHAT');

  // New Announcement Form State
  const [ancTitle, setAncTitle] = useState('');
  const [ancContent, setAncContent] = useState('');
  const [ancType, setAncType] = useState<'INFO' | 'WARNING' | 'UPDATE' | 'OFFER'>('UPDATE');
  const [ancTargetType, setAncTargetType] = useState<AnnouncementTargetType>('ALL');
  const [ancTargetPlans, setAncTargetPlans] = useState<SubscriptionPlan[]>([]);
  const [ancTargetUserIds, setAncTargetUserIds] = useState<string[]>([]);
  const [manualUserSearch, setManualUserSearch] = useState('');
  const [ancCreatedNotice, setAncCreatedNotice] = useState(false);

  const nonAdminUsers = useMemo(() => {
    return registeredUsers.filter((u) => u.role !== 'SUPER_ADMIN');
  }, [registeredUsers]);

  const filteredUsersForManual = useMemo(() => {
    if (!manualUserSearch.trim()) return nonAdminUsers;
    const q = manualUserSearch.toLowerCase();
    return nonAdminUsers.filter(
      (u) =>
        u.shopName?.toLowerCase().includes(q) ||
        u.ownerName?.toLowerCase().includes(q) ||
        u.phone?.includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [nonAdminUsers, manualUserSearch]);

  const targetedMatchingCount = useMemo(() => {
    const dummyAnc: any = {
      id: 'preview',
      title: ancTitle,
      content: ancContent,
      type: ancType,
      createdAt: '',
      active: true,
      targetType: ancTargetType,
      targetPlans: ancTargetPlans,
      targetUserIds: ancTargetUserIds,
    };
    return nonAdminUsers.filter((u) => isAnnouncementTargetedToUser(dummyAnc, u)).length;
  }, [nonAdminUsers, ancTargetType, ancTargetPlans, ancTargetUserIds, ancTitle, ancContent, ancType]);

  const getTargetLabel = (anc: any) => {
    switch (anc.targetType) {
      case 'NEW_USERS':
        return '🆕 New Users (< 1 Mo)';
      case 'TRIAL_USERS':
        return '⏱️ Trial Users';
      case 'NEAR_EXPIRY':
        return '⚠️ Expiring Soon Users';
      case 'SUBSCRIPTION_PLAN':
        return `💳 Plans (${anc.targetPlans?.length ? anc.targetPlans.join(', ') : 'All'})`;
      case 'MANUAL_USERS':
        return `👤 ${anc.targetUserIds?.length || 0} Selected Users`;
      case 'ALL':
      default:
        return '🌐 All Store Users';
    }
  };

  // Support Messages States
  const [supportFilter, setSupportFilter] = useState<string>('ALL');
  const [supportSearchTerm, setSupportSearchTerm] = useState('');
  const [selectedSupportMsgId, setSelectedSupportMsgId] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [adminPhotoModal, setAdminPhotoModal] = useState<string | null>(null);

  // Plan Features Modal Editor State
  const [editingPlanKey, setEditingPlanKey] = useState<keyof PlanFeatureConfig | null>(null);
  const [editingPlanTitle, setEditingPlanTitle] = useState('');
  const [editingPlanLines, setEditingPlanLines] = useState<string[]>([]);
  const [newPerkInput, setNewPerkInput] = useState('');
  const [perkSavedNotice, setPerkSavedNotice] = useState(false);

  const openPlanPerksModal = (key: keyof PlanFeatureConfig, title: string) => {
    setEditingPlanKey(key);
    setEditingPlanTitle(title);
    setEditingPlanLines([...(planFeatures[key] || [])]);
    setNewPerkInput('');
    setPerkSavedNotice(false);
  };

  const handleAddPerkLine = () => {
    if (!newPerkInput.trim()) return;
    setEditingPlanLines((prev) => [...prev, newPerkInput.trim()]);
    setNewPerkInput('');
  };

  const handleRemovePerkLine = (index: number) => {
    setEditingPlanLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePerkLine = (index: number, val: string) => {
    setEditingPlanLines((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleSavePlanPerks = () => {
    if (!editingPlanKey) return;
    const cleaned = editingPlanLines.map((l) => l.trim()).filter(Boolean);
    updatePlanFeatures({
      ...planFeatures,
      [editingPlanKey]: cleaned,
    });
    setPerkSavedNotice(true);
    setTimeout(() => {
      setPerkSavedNotice(false);
      setEditingPlanKey(null);
    }, 1000);
  };

  // Approval Modal States
  const [approvalDays, setApprovalDays] = useState<number>(30);
  const [customApprovalDate, setCustomApprovalDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [approvalPlan, setApprovalPlan] = useState<SubscriptionPlan>('MONTHLY');

  // Pricing Form States
  const [trialDaysInput, setTrialDaysInput] = useState<number | string>(planPrices.trialDays || 7);
  const [monthlyNprInput, setMonthlyNprInput] = useState<number | string>(planPrices.monthlyNpr ?? 1500);
  const [quarterlyNprInput, setQuarterlyNprInput] = useState<number | string>(planPrices.quarterlyNpr ?? 4000);
  const [halfYearlyNprInput, setHalfYearlyNprInput] = useState<number | string>(planPrices.halfYearlyNpr ?? 7500);
  const [yearlyNprInput, setYearlyNprInput] = useState<number | string>(planPrices.yearlyNpr ?? 12000);
  const [pricingSaveNotice, setPricingSaveNotice] = useState(false);

  // Referral Reward Rule Settings Form State
  const [refReqUsersInput, setRefReqUsersInput] = useState<number | string>(referralRewardRule.requiredActiveUsers || 2);
  const [refFreeMonthsInput, setRefFreeMonthsInput] = useState<number | string>(referralRewardRule.rewardFreeMonths || 1);
  const [refRuleSaveNotice, setRefRuleSaveNotice] = useState(false);

  useEffect(() => {
    setRefReqUsersInput(referralRewardRule.requiredActiveUsers || 2);
    setRefFreeMonthsInput(referralRewardRule.rewardFreeMonths || 1);
  }, [referralRewardRule]);

  const handleSaveReferralRule = (e: React.FormEvent) => {
    e.preventDefault();
    const req = Math.max(1, parseInt(String(refReqUsersInput), 10) || 1);
    const mths = Math.max(1, parseInt(String(refFreeMonthsInput), 10) || 1);

    confirmAction({
      title: 'Confirm Referral Membership Rule Change',
      message: `Set Referral Reward Rule: For every ${req} active referred store(s), members earn ${mths} month(s) of free membership extension?`,
      actionType: 'EDIT',
      onConfirm: () => {
        updateReferralRewardRule({
          requiredActiveUsers: req,
          rewardFreeMonths: mths,
        });
        setRefRuleSaveNotice(true);
        setTimeout(() => setRefRuleSaveNotice(false), 3000);
      },
    });
  };

  // Edit Offer Features Modal State
  const [editingOfferPlan, setEditingOfferPlan] = useState<SubscriptionPlan | null>(null);
  const [offerFormState, setOfferFormState] = useState({
    maxStaff: 5,
    maxBranches: 1,
    allowStaffCredentials: true,
    allowMultipleStores: true,
    allowSalesEntries: true,
    allowPurchaseEntries: true,
    allowAdvancesEntries: true,
    allowStockEntries: true,
    allowReports: true,
    customNotes: '',
  });

  // Coupon Form States
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [cpnCode, setCpnCode] = useState('');
  const [cpnDiscountType, setCpnDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [cpnDiscountValue, setCpnDiscountValue] = useState<string | number>(20);
  const [cpnApplicablePlan, setCpnApplicablePlan] = useState<SubscriptionPlan | 'ALL'>('ALL');
  const [cpnStartDate, setCpnStartDate] = useState('');
  const [cpnEndDate, setCpnEndDate] = useState('');
  const [cpnIsActive, setCpnIsActive] = useState(true);
  const [cpnNotice, setCpnNotice] = useState(false);

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpnCode.trim()) return;

    addCoupon({
      code: cpnCode.trim().toUpperCase(),
      discountType: cpnDiscountType,
      discountValue: typeof cpnDiscountValue === 'string' ? parseFloat(cpnDiscountValue) || 0 : cpnDiscountValue,
      applicablePlan: cpnApplicablePlan,
      startDate: cpnStartDate || undefined,
      endDate: cpnEndDate || undefined,
      isActive: cpnIsActive,
    });

    setCpnNotice(true);
    setTimeout(() => setCpnNotice(false), 3000);

    // Reset form
    setCpnCode('');
    setCpnDiscountValue(20);
    setCpnStartDate('');
    setCpnEndDate('');
    setShowCouponModal(false);
  };

  useEffect(() => {
    setTrialDaysInput(planPrices.trialDays);
    setMonthlyNprInput(planPrices.monthlyNpr);
    setQuarterlyNprInput(planPrices.quarterlyNpr ?? 4000);
    setHalfYearlyNprInput(planPrices.halfYearlyNpr ?? 7500);
    setYearlyNprInput(planPrices.yearlyNpr);
  }, [planPrices]);

  const formatPrice = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return '0';
    return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Guard for non-admin
  if (currentUser?.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4 shadow-2xl mt-12">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-white">Super Admin Access Only</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          You are currently logged in as <strong className="text-white">{currentUser?.name || 'Store Owner'}</strong> (@{currentUser?.username}). Super Admin access is required to view store registry, platform analytics, system broadcasts, and user approvals.
        </p>
      </div>
    );
  }

  // Macro Metrics Calculations (Excluding Super Admin HQ account)
  const storeUsers = registeredUsers.filter((u) => u.role !== 'SUPER_ADMIN');
  const totalUsers = storeUsers.length;
  const pendingUsers = storeUsers.filter((u) => u.status === 'PENDING_APPROVAL').length;
  const activeTrials = storeUsers.filter((u) => u.status === 'TRIAL_ACTIVE' && !isAccountTrialExpired(u)).length;
  const approvedUsers = storeUsers.filter((u) => u.status === 'APPROVED').length;
  const expiredUsers = storeUsers.filter((u) => u.status === 'EXPIRED' || isAccountTrialExpired(u)).length;

  // Revenue Projections
  const monthlyCount = storeUsers.filter((u) => u.subscriptionPlan === 'MONTHLY' && u.status === 'APPROVED').length;
  const quarterlyCount = storeUsers.filter((u) => u.subscriptionPlan === 'QUARTERLY' && u.status === 'APPROVED').length;
  const halfYearlyCount = storeUsers.filter((u) => u.subscriptionPlan === 'HALF_YEARLY' && u.status === 'APPROVED').length;
  const yearlyCount = storeUsers.filter((u) => u.subscriptionPlan === 'YEARLY' && u.status === 'APPROVED').length;
  const projectedARR = (monthlyCount * planPrices.monthlyNpr * 12) +
                       (quarterlyCount * (planPrices.quarterlyNpr ?? 4000) * 4) +
                       (halfYearlyCount * (planPrices.halfYearlyNpr ?? 7500) * 2) +
                       (yearlyCount * planPrices.yearlyNpr);

  // Provinces List
  const NEPAL_PROVINCES = [
    'Bagmati Province',
    'Gandaki Province',
    'Lumbini Province',
    'Koshi Province',
    'Madhesh Province',
    'Karnali Province',
    'Sudurpashchim Province',
  ];

  // Store Filtering Logic
  const filteredUsers = registeredUsers.filter((user) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      user.name.toLowerCase().includes(q) ||
      user.username.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      (user.shopName && user.shopName.toLowerCase().includes(q)) ||
      (user.phone && user.phone.includes(q)) ||
      user.shopCode.toLowerCase().includes(q) ||
      (user.district && user.district.toLowerCase().includes(q)) ||
      (user.province && user.province.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (selectedProvinceFilter !== 'ALL' && user.province !== selectedProvinceFilter) {
      return false;
    }

    if (selectedStatusFilter === 'ALL') return true;
    if (selectedStatusFilter === 'PENDING') return user.status === 'PENDING_APPROVAL';
    if (selectedStatusFilter === 'TRIAL') return user.status === 'TRIAL_ACTIVE' && !isAccountTrialExpired(user);
    if (selectedStatusFilter === 'APPROVED') return user.status === 'APPROVED';
    if (selectedStatusFilter === 'EXPIRED') return user.status === 'EXPIRED' || isAccountTrialExpired(user);

    return true;
  });

  const handleOpenApproveModal = (user: AuthUser) => {
    setSelectedUserForApproval(user);
    setApprovalPlan(user.subscriptionPlan || 'MONTHLY');
    
    let presetDays = 30;
    if (user.subscriptionPlan === 'QUARTERLY') presetDays = 90;
    else if (user.subscriptionPlan === 'HALF_YEARLY') presetDays = 180;
    else if (user.subscriptionPlan === 'YEARLY') presetDays = 365;
    
    setApprovalDays(presetDays);
    const d = new Date();
    d.setDate(d.getDate() + presetDays);
    setCustomApprovalDate(d.toISOString().split('T')[0]);
  };

  const handleConfirmApproval = () => {
    if (!selectedUserForApproval) return;
    approveUserRequest(selectedUserForApproval.id, customApprovalDate, approvalPlan);
    setSelectedUserForApproval(null);
  };

  const handleDaysChange = (days: number) => {
    setApprovalDays(days);
    const d = new Date();
    d.setDate(d.getDate() + days);
    setCustomApprovalDate(d.toISOString().split('T')[0]);
  };

  const toggleTargetPlan = (plan: SubscriptionPlan) => {
    setAncTargetPlans((prev) =>
      prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan]
    );
  };

  const toggleTargetUser = (userId: string) => {
    setAncTargetUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancTitle.trim() || !ancContent.trim()) return;

    if (ancTargetType === 'SUBSCRIPTION_PLAN' && ancTargetPlans.length === 0) {
      alert('Please select at least one subscription plan for targeted broadcast.');
      return;
    }

    if (ancTargetType === 'MANUAL_USERS' && ancTargetUserIds.length === 0) {
      alert('Please select at least one store user from the list for targeted broadcast.');
      return;
    }

    addSystemAnnouncement({
      title: ancTitle.trim(),
      content: ancContent.trim(),
      type: ancType,
      targetType: ancTargetType,
      targetPlans: ancTargetType === 'SUBSCRIPTION_PLAN' ? ancTargetPlans : [],
      targetUserIds: ancTargetType === 'MANUAL_USERS' ? ancTargetUserIds : [],
    });

    setAncTitle('');
    setAncContent('');
    setAncTargetType('ALL');
    setAncTargetPlans([]);
    setAncTargetUserIds([]);
    setManualUserSearch('');
    setAncCreatedNotice(true);
    setTimeout(() => setAncCreatedNotice(false), 3000);
  };

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    confirmAction({
      title: 'Confirm Update Subscription Rates',
      message: `Are you sure you want to update the live subscription rates and trial duration (${trialDaysInput} Days Trial, Monthly: NPR ${monthlyNprInput}, Quarterly: NPR ${quarterlyNprInput}, Half-Yearly: NPR ${halfYearlyNprInput}, Yearly: NPR ${yearlyNprInput})? This will immediately take effect on the signup page.`,
      actionType: 'EDIT',
      onConfirm: () => {
        updatePlanPrices({
          trialDays: Number(trialDaysInput) || 7,
          monthlyNpr: typeof monthlyNprInput === 'string' ? parseFloat(monthlyNprInput) || 0 : monthlyNprInput,
          quarterlyNpr: typeof quarterlyNprInput === 'string' ? parseFloat(quarterlyNprInput) || 0 : quarterlyNprInput,
          halfYearlyNpr: typeof halfYearlyNprInput === 'string' ? parseFloat(halfYearlyNprInput) || 0 : halfYearlyNprInput,
          yearlyNpr: typeof yearlyNprInput === 'string' ? parseFloat(yearlyNprInput) || 0 : yearlyNprInput,
        });
        setPricingSaveNotice(true);
        setTimeout(() => setPricingSaveNotice(false), 3000);
      },
    });
  };

  const getPlanBadge = (plan: SubscriptionPlan) => {
    switch (plan) {
      case '7_DAY_TRIAL':
        return <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-[10px]">{planPrices.trialDays}-Day Free Trial</span>;
      case 'MONTHLY':
        return <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold text-[10px]">Monthly (NPR {formatPrice(planPrices.monthlyNpr)}/mo)</span>;
      case 'QUARTERLY':
        return <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold text-[10px]">Quarterly (NPR {formatPrice(planPrices.quarterlyNpr ?? 4000)}/3mo)</span>;
      case 'HALF_YEARLY':
        return <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold text-[10px]">Half-Yearly (NPR {formatPrice(planPrices.halfYearlyNpr ?? 7500)}/6mo)</span>;
      case 'YEARLY':
        return <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[10px]">Yearly Pro (NPR {formatPrice(planPrices.yearlyNpr)}/yr)</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">Basic</span>;
    }
  };

  const getStatusBadge = (user: AuthUser) => {
    if (user.role === 'SUPER_ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black">
          <Crown className="h-3 w-3 text-amber-400" />
          <span>Super Admin</span>
        </span>
      );
    }

    if (isAccountTrialExpired(user)) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold">
          <AlertTriangle className="h-3 w-3 text-red-400" />
          <span>Expired</span>
        </span>
      );
    }

    switch (user.status) {
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/30 text-red-200 border border-red-500/50 text-xs font-black shadow-xs">
            <Lock className="h-3 w-3 text-red-400" />
            <span>Account Blocked</span>
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold animate-pulse">
            <Clock className="h-3 w-3 text-amber-400" />
            <span>Pending Approval</span>
          </span>
        );
      case 'TRIAL_ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
            <Zap className="h-3 w-3 text-blue-400" />
            <span>Trial Active ({getDaysRemainingInTrial(user)}d left)</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>Approved Active</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">
            <span>{user.status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* SUB TAB: LANDING CONTENT */}
      {activeAdminSubTab === 'LANDING_CONTENT' && (
        <LandingContentEditor />
      )}

      {/* SUB TAB 1: STORE REGISTRY & ACCOUNT OPERATIONS */}
      {activeAdminSubTab === 'STORES' && (
        <div className="space-y-6">
          {/* METRICS DASHBOARD CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div
              onClick={() => setSelectedStatusFilter('ALL')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                selectedStatusFilter === 'ALL'
                  ? 'bg-blue-950/60 border-blue-500 text-white'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>All Registered Stores</span>
                <Users className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-2xl font-black text-white font-mono">{totalUsers}</p>
            </div>

            <div
              onClick={() => setSelectedStatusFilter('PENDING')}
              className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden ${
                selectedStatusFilter === 'PENDING'
                  ? 'bg-amber-950/60 border-amber-500 text-white'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              {pendingUsers > 0 && (
                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
              )}
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>Pending Approvals</span>
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-400 font-mono">{pendingUsers}</p>
            </div>

            <div
              onClick={() => setSelectedStatusFilter('TRIAL')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                selectedStatusFilter === 'TRIAL'
                  ? 'bg-blue-950/60 border-blue-500 text-white'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>Active 7-Day Trial</span>
                <Zap className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-2xl font-black text-blue-400 font-mono">{activeTrials}</p>
            </div>

            <div
              onClick={() => setSelectedStatusFilter('APPROVED')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                selectedStatusFilter === 'APPROVED'
                  ? 'bg-emerald-950/60 border-emerald-500 text-white'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>Approved Paid Stores</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 font-mono">{approvedUsers}</p>
            </div>

            <div
              onClick={() => setSelectedStatusFilter('EXPIRED')}
              className={`p-4 rounded-2xl border transition cursor-pointer col-span-2 lg:col-span-1 ${
                selectedStatusFilter === 'EXPIRED'
                  ? 'bg-red-950/60 border-red-500 text-white'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>Expired Access</span>
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
              <p className="text-2xl font-black text-red-400 font-mono">{expiredUsers}</p>
            </div>
          </div>

          {/* PENDING STAFF LOGIN ACCOUNT REQUESTS */}
          {staffList.some((s) => s.accountRequestStatus === 'PENDING') && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-3">
              <div className="flex items-center justify-between font-bold text-xs">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400 animate-spin" />
                  <span>Pending Staff Login Account Requests ({staffList.filter((s) => s.accountRequestStatus === 'PENDING').length})</span>
                </span>
                <span className="text-[11px] text-amber-300/80">Require System Admin approval before User ID & Password are issued</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {staffList.filter((s) => s.accountRequestStatus === 'PENDING').map((pStaff) => (
                  <div key={pStaff.id} className="p-3 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="font-extrabold text-white flex items-center gap-2">
                        <span>{pStaff.name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px]">{pStaff.role}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Branch: {pStaff.storeBranch} | Contact: {pStaff.phone}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => approveStaffAccount(pStaff.id)}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectStaffAccount(pStaff.id)}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEARCH AND PROVINCE / DISTRICT FILTER BAR */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search shop name, phone, district, owner..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition"
                id="admin-search-users-input"
              />
            </div>

            {/* Province Dropdown Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={selectedProvinceFilter}
                onChange={(e) => setSelectedProvinceFilter(e.target.value)}
                className="w-full md:w-56 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-white outline-none focus:border-blue-500 cursor-pointer"
                id="province-filter-select"
              >
                <option value="ALL">All Nepal Provinces (7)</option>
                {NEPAL_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'PENDING', label: `Pending (${pendingUsers})` },
                { id: 'TRIAL', label: `Trial (${activeTrials})` },
                { id: 'APPROVED', label: `Approved (${approvedUsers})` },
                { id: 'EXPIRED', label: `Expired (${expiredUsers})` },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setSelectedStatusFilter(btn.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedStatusFilter === btn.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* REGISTERED STORES DIRECTORY */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Store className="h-4 w-4 text-blue-400" />
                <span>Nepal Retail Store Registry & Impersonation</span>
                <span className="text-xs text-slate-400 font-mono">({filteredUsers.length} stores matching)</span>
              </h3>

              <button
                type="button"
                onClick={() => {
                  if (currentUser) {
                    setSelectedUserForPasswordChange(currentUser);
                    setNewPasswordInput(currentUser.password || '');
                    setConfirmPasswordInput(currentUser.password || '');
                    setPassNotice(null);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
                id="change-admin-password-btn"
              >
                <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                <span>Change Admin Password</span>
              </button>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                <p className="font-semibold text-slate-300">No registered stores match your search criteria.</p>
                <p>Try resetting the province filter or search input.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {filteredUsers.map((user) => {
                  const isSuper = user.role === 'SUPER_ADMIN';
                  const isExpired = isAccountTrialExpired(user);

                  return (
                    <div key={user.id} className="p-5 hover:bg-slate-800/40 transition space-y-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        
                        {/* Store & Owner Details */}
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-base">{user.shopName || 'Retail Store'}</span>
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950 text-blue-400 border border-slate-800">
                              {user.shopCode}
                            </span>
                            {getStatusBadge(user)}
                            {getPlanBadge(user.subscriptionPlan)}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-0.5">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Users className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              <span className="font-semibold text-white">{user.name}</span>
                              <span className="font-mono text-[11px] text-slate-400">(@{user.username})</span>
                            </div>

                            <div className="flex items-center gap-1 text-slate-300">
                              <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              <span className="font-mono">{user.phone || 'N/A'}</span>
                            </div>

                            <div className="flex items-center gap-1 text-slate-300">
                              <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                              <span>{user.province || 'Bagmati Province'}, {user.district || 'Kathmandu'}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              <span>{user.email}</span>
                            </div>
                          </div>

                          {user.notes && (
                            <p className="text-[11px] text-amber-300/80 bg-amber-950/30 border border-amber-800/40 px-2.5 py-1 rounded-lg w-fit mt-1">
                              Note: {user.notes}
                            </p>
                          )}
                        </div>

                        {/* Dates & Expiry in 2 Lines */}
                        <div className="flex flex-col justify-center gap-1 text-xs text-slate-400 shrink-0 font-mono bg-slate-950/60 border border-slate-800/80 rounded-xl px-3.5 py-2 min-w-[180px]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Registered:</span>
                            <span className="text-slate-200 font-medium">{user.registeredAt}</span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                              {user.status === 'APPROVED' ? 'Approved Until:' : 'Trial Expiry:'}
                            </span>
                            <span className={`font-bold ${isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
                              {user.approvedUntilDate || user.trialExpiryDate || 'Unlimited'}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons in 2 Lines (3 / 3 Options Grid) */}
                        {!isSuper && (
                          <div className="grid grid-cols-3 gap-1.5 shrink-0 w-full sm:w-[410px]">
                            {/* Row 1 - Option 1: View As Store */}
                            <button
                              type="button"
                              onClick={() => startImpersonatingStore(user)}
                              className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-500/30 font-bold text-xs flex items-center justify-center gap-1 transition active:scale-95 shadow-sm whitespace-nowrap cursor-pointer"
                              title="Safely enter and view store dashboard"
                              id={`view-as-store-btn-${user.id}`}
                            >
                              <Eye className="h-3.5 w-3.5 shrink-0" />
                              <span>View As Store</span>
                            </button>

                            {/* Row 1 - Option 2: Activate / Renew */}
                            <button
                              type="button"
                              onClick={() => handleOpenApproveModal(user)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20 transition active:scale-95 whitespace-nowrap cursor-pointer"
                              title="Activate or Renew Store Subscription"
                              id={`approve-user-btn-${user.id}`}
                            >
                              <Check className="h-3.5 w-3.5 shrink-0" />
                              <span>Activate / Renew</span>
                            </button>

                            {/* Row 1 - Option 3: Change Password */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserForPasswordChange(user);
                                setNewPasswordInput(user.password || '');
                                setConfirmPasswordInput(user.password || '');
                                setPassNotice(null);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 transition active:scale-95 whitespace-nowrap cursor-pointer"
                              title="Change Account Password"
                              id={`change-pass-btn-${user.id}`}
                            >
                              <KeyRound className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                              <span>Password</span>
                            </button>

                            {/* Row 2 - Option 1: +7d Trial Extension */}
                            <button
                              type="button"
                              onClick={() =>
                                confirmAction({
                                  title: 'Confirm Extension',
                                  message: `Are you sure you want to extend trial by +7 days for store "${user.shopName}"?`,
                                  actionType: 'EDIT',
                                  onConfirm: () => extendUserTrial(user.id, 7),
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 border border-blue-700/80 text-blue-300 font-bold text-xs flex items-center justify-center gap-1 transition active:scale-95 whitespace-nowrap cursor-pointer"
                              title="Extend Trial by +7 Days"
                              id={`extend-trial-btn-${user.id}`}
                            >
                              <RefreshCw className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                              <span>+7d Trial</span>
                            </button>

                            {/* Row 2 - Option 2: Expire Access */}
                            {user.status !== 'EXPIRED' ? (
                              <button
                                type="button"
                                onClick={() =>
                                  confirmAction({
                                    title: 'Confirm Expire Store Access',
                                    message: `Are you sure you want to expire access for store "${user.shopName}"?`,
                                    actionType: 'DELETE',
                                    onConfirm: () => rejectOrExpireUser(user.id),
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-bold text-xs flex items-center justify-center gap-1 transition active:scale-95 whitespace-nowrap cursor-pointer"
                                title="Expire Account Access"
                              >
                                <UserX className="h-3.5 w-3.5 text-red-400 shrink-0" />
                                <span>Expire</span>
                              </button>
                            ) : (
                              <div
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-500 font-bold text-xs flex items-center justify-center gap-1 opacity-70 cursor-not-allowed select-none whitespace-nowrap"
                                title="Account is already expired"
                              >
                                <UserX className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                                <span>Expired</span>
                              </div>
                            )}

                            {/* Row 2 - Option 3: Delete Store Account */}
                            <button
                              type="button"
                              onClick={() =>
                                confirmAction({
                                  title: 'Confirm Permanent Store Deletion',
                                  message: `Are you sure you want to permanently delete store "${user.shopName}" (@${user.username})? All associated records will be removed and login access will be blocked.`,
                                  actionType: 'DELETE',
                                  onConfirm: () => deleteUserAccount(user.id),
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 border border-red-700/80 text-red-300 font-bold text-xs flex items-center justify-center gap-1 transition active:scale-95 whitespace-nowrap cursor-pointer"
                              title="Delete Store Account Permanently"
                              id={`delete-user-btn-${user.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-400 shrink-0" />
                              <span>Delete Store</span>
                            </button>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB TAB 2: PLATFORM ANALYTICS & DIAGNOSTICS (EARNINGS & SUBSCRIPTION SALES DASHBOARD) */}
      {activeAdminSubTab === 'ANALYTICS' && (
        <div className="space-y-8">
          {/* Main Earnings & Subscription Sales Analytics Engine */}
          <AdminEarningsDashboard />

          {/* Regional Store Distribution across Nepal */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Nepal Province Store Distribution</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">7 Provinces Covered</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {NEPAL_PROVINCES.map((prov) => {
                const provStores = registeredUsers.filter((u) => (u.province || 'Bagmati Province') === prov);
                const count = provStores.length;
                const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;

                // Unique districts in this province
                const districts = Array.from(new Set(provStores.map((s) => s.district).filter(Boolean)));

                return (
                  <div key={prov} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{prov}</span>
                      <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                        {count} stores ({pct}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>

                    <div className="pt-1 flex items-center gap-1 flex-wrap">
                      {districts.length > 0 ? (
                        districts.map((d) => (
                          <span key={d} className="text-[10px] bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800 font-mono">
                            {d}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-500">Kathmandu, Lalitpur, Pokhara</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 3: LIVE SUPPORT & BROADCAST ANNOUNCEMENTS */}
      {activeAdminSubTab === 'COMMUNICATION' && (
        <div className="space-y-6">
          {/* Sub-toggle Bar */}
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setCommSubTab('SUPPORT_CHAT')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                commSubTab === 'SUPPORT_CHAT'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
              id="comm-subtab-support"
            >
              <Headphones className="h-4 w-4" />
              <span>Live Support Chat & Photo/SMS Inbox ({supportMessages.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setCommSubTab('ANNOUNCEMENTS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                commSubTab === 'ANNOUNCEMENTS'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
              id="comm-subtab-announcements"
            >
              <Megaphone className="h-4 w-4" />
              <span>System Announcement Broadcasts ({systemAnnouncements.length})</span>
            </button>
          </div>

          {/* COMMUNICATION OPTION 1: SUPPORT CHAT & SMS INBOX (WHATSAPP STYLE) */}
          {commSubTab === 'SUPPORT_CHAT' && (() => {
            const filteredMessages = supportMessages.filter((msg) => {
              if (supportFilter !== 'ALL' && msg.status !== supportFilter) return false;
              if (supportSearchTerm.trim()) {
                const q = supportSearchTerm.toLowerCase();
                return (
                  msg.subject.toLowerCase().includes(q) ||
                  msg.message.toLowerCase().includes(q) ||
                  msg.senderName.toLowerCase().includes(q) ||
                  (msg.senderShopName && msg.senderShopName.toLowerCase().includes(q)) ||
                  msg.senderPhone.toLowerCase().includes(q)
                );
              }
              return true;
            });

            // Ensure active selected message
            const activeMsg = filteredMessages.find(m => m.id === selectedSupportMsgId) || filteredMessages[0] || null;

            return (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[700px]">
                {/* LEFT SIDEBAR: CHATS LIST (WhatsApp style) */}
                <div className={`w-full md:w-80 lg:w-96 border-r border-slate-800/80 flex flex-col bg-slate-950 ${
                  activeMsg && selectedSupportMsgId ? 'hidden md:flex' : 'flex'
                }`}>
                  {/* List Header */}
                  <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <MessageCircle className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-bold text-white">Live Support Chats</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-800 text-slate-300 border border-slate-700">
                        {supportMessages.length} total
                      </span>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search chats..."
                        value={supportSearchTerm}
                        onChange={(e) => setSupportSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                      {['ALL', 'NEW', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setSupportFilter(st)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition ${
                            supportFilter === st
                              ? 'bg-emerald-600 text-white shadow'
                              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {st === 'IN_PROGRESS' ? 'IN PROGRESS' : st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chat List Items */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
                    {filteredMessages.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                        <Headphones className="h-7 w-7 mx-auto text-slate-600" />
                        <p>No support chats found.</p>
                      </div>
                    ) : (
                      filteredMessages.map((msg) => {
                        const isSelected = activeMsg?.id === msg.id;
                        const name = msg.senderShopName || msg.senderName;
                        return (
                          <div
                            key={msg.id}
                            onClick={() => setSelectedSupportMsgId(msg.id)}
                            className={`p-3.5 flex items-start gap-3 cursor-pointer transition relative ${
                              isSelected
                                ? 'bg-slate-800/90 border-l-4 border-l-emerald-500'
                                : 'hover:bg-slate-900/60'
                            }`}
                          >
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-md ${getAvatarBg(name)}`}>
                              {getInitials(name)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="text-xs font-bold text-white truncate">
                                  {name}
                                </h4>
                                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                                  {msg.createdAt?.split(' ')[1] || msg.createdAt?.slice(-5) || ''}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold tracking-wider ${
                                  msg.status === 'RESOLVED'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : msg.status === 'IN_PROGRESS'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {msg.status}
                                </span>
                                <p className="text-[11px] font-medium text-slate-300 truncate">
                                  {msg.subject}
                                </p>
                              </div>

                              <p className="text-[11px] text-slate-400 truncate mt-1">
                                {msg.adminReply ? `You: ${msg.adminReply}` : msg.message}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* RIGHT CONVERSATION AREA */}
                <div className={`flex-1 flex flex-col bg-[#0b141a] relative ${
                  !activeMsg ? 'hidden md:flex items-center justify-center' : 'flex'
                }`}>
                  {activeMsg ? (
                    <>
                      {/* Chat Header */}
                      <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 shadow-md">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Back Button for mobile */}
                          <button
                            type="button"
                            onClick={() => setSelectedSupportMsgId(null)}
                            className="md:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </button>

                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow ${getAvatarBg(activeMsg.senderShopName || activeMsg.senderName)}`}>
                            {getInitials(activeMsg.senderShopName || activeMsg.senderName)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-white truncate">
                                {activeMsg.senderShopName || activeMsg.senderName}
                              </h3>
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                                {activeMsg.category}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 truncate">
                              {activeMsg.senderName} • Ph: {activeMsg.senderPhone} • ID: <span className="font-mono">{activeMsg.id}</span>
                            </p>
                          </div>
                        </div>

                        {/* Status Dropdown & Delete */}
                        <div className="flex items-center gap-2">
                          <select
                            value={activeMsg.status}
                            onChange={(e) => updateSupportMessageStatus(activeMsg.id, e.target.value as any)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border outline-none cursor-pointer ${
                              activeMsg.status === 'RESOLVED'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                : activeMsg.status === 'IN_PROGRESS'
                                ? 'bg-blue-950 text-blue-300 border-blue-800'
                                : 'bg-amber-950 text-amber-300 border-amber-800'
                            }`}
                          >
                            <option value="NEW">NEW</option>
                            <option value="IN_PROGRESS">IN PROGRESS</option>
                            <option value="RESOLVED">RESOLVED</option>
                          </select>

                          <button
                            type="button"
                            onClick={() =>
                              confirmAction({
                                title: 'Confirm Delete Support Ticket',
                                message: 'Are you sure you want to delete this live support ticket?',
                                actionType: 'DELETE',
                                onConfirm: () => {
                                  deleteSupportMessage(activeMsg.id);
                                  setSelectedSupportMsgId(null);
                                },
                              })
                            }
                            className="p-2 rounded-xl bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-400 transition cursor-pointer"
                            title="Delete Ticket"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Conversation Messages Body (WhatsApp Chat Background) */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                        {/* Ticket Topic Date Marker */}
                        <div className="flex justify-center my-2">
                          <span className="px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[10px] font-bold text-slate-400 shadow-sm">
                            Ticket Topic: {activeMsg.subject} • {activeMsg.createdAt}
                          </span>
                        </div>

                        {(() => {
                          const items = activeMsg.chatHistory && activeMsg.chatHistory.length > 0
                            ? activeMsg.chatHistory
                            : [
                                {
                                  id: `legacy-user-${activeMsg.id}`,
                                  sender: 'USER' as const,
                                  text: activeMsg.message,
                                  time: activeMsg.createdAt,
                                  photos: activeMsg.photos,
                                },
                                ...(activeMsg.adminReply
                                  ? [
                                      {
                                        id: `legacy-admin-${activeMsg.id}`,
                                        sender: 'ADMIN' as const,
                                        text: activeMsg.adminReply,
                                        time: activeMsg.repliedAt || activeMsg.createdAt,
                                      },
                                    ]
                                  : []),
                              ];

                          return items.map((item) => {
                            if (item.sender === 'USER') {
                              return (
                                <div key={item.id} className="flex flex-col items-start max-w-[85%] md:max-w-[70%]">
                                  <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-800 border border-slate-700/80 text-white shadow-md space-y-2 relative">
                                    <span className="text-[10px] font-bold text-emerald-400 block">
                                      {activeMsg.senderShopName || activeMsg.senderName}
                                    </span>
                                    <p className="text-xs leading-relaxed whitespace-pre-wrap">
                                      {item.text}
                                    </p>

                                    {/* Attached photos */}
                                    {item.photos && item.photos.length > 0 && (
                                      <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                          Attachments ({item.photos.length}):
                                        </span>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          {item.photos.map((photo, pIdx) => (
                                            <div
                                              key={pIdx}
                                              onClick={() => setAdminPhotoModal(photo)}
                                              className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-600 bg-slate-900 cursor-pointer shadow"
                                            >
                                              <img src={photo} alt={`Attachment ${pIdx + 1}`} className="w-full h-full object-cover transition group-hover:scale-105" />
                                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                                <Eye className="h-4 w-4 text-white" />
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <span className="text-[9px] text-slate-400 block text-right font-mono mt-1">
                                      {item.time}
                                    </span>
                                  </div>
                                </div>
                              );
                            }

                            // Admin Reply Item
                            return (
                              <div key={item.id} className="flex flex-col items-end max-w-[85%] md:max-w-[70%] ml-auto">
                                <div className="p-3.5 rounded-2xl rounded-tr-none bg-emerald-950/80 border border-emerald-700/60 text-emerald-50 shadow-md space-y-1 relative">
                                  <span className="text-[10px] font-extrabold text-emerald-300 block">
                                    Support Admin Reply
                                  </span>
                                  <p className="text-xs leading-relaxed whitespace-pre-wrap text-emerald-100">
                                    {item.text}
                                  </p>
                                  <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-400/80 font-mono mt-1">
                                    <span>{item.time || 'Just now'}</span>
                                    <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      {/* Reply Input Bar at Bottom (WhatsApp style) */}
                      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0">
                        <input
                          type="text"
                          placeholder="Type a reply to user..."
                          value={replyInputs[activeMsg.id] || ''}
                          onChange={(e) => setReplyInputs((prev) => ({ ...prev, [activeMsg.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && replyInputs[activeMsg.id]?.trim()) {
                              replyToSupportMessage(activeMsg.id, replyInputs[activeMsg.id]);
                              setReplyInputs((prev) => ({ ...prev, [activeMsg.id]: '' }));
                            }
                          }}
                          className="flex-1 px-4 py-2.5 rounded-full bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (replyInputs[activeMsg.id]?.trim()) {
                              replyToSupportMessage(activeMsg.id, replyInputs[activeMsg.id]);
                              setReplyInputs((prev) => ({ ...prev, [activeMsg.id]: '' }));
                            }
                          }}
                          className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg transition shrink-0 cursor-pointer"
                          title="Send Reply"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3 my-auto">
                      <div className="p-4 rounded-full bg-slate-900 border border-slate-800 text-slate-600">
                        <MessageSquare className="h-10 w-10" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-300">WhatsApp Style Support Chat Inbox</h4>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Select a conversation from the left chat list to view and reply to live user support requests.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* COMMUNICATION OPTION 2: SYSTEM ANNOUNCEMENT BROADCASTS */}
          {commSubTab === 'ANNOUNCEMENTS' && (
            <div className="space-y-6">
              {/* Broadcast Creation Form */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Megaphone className="h-5 w-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Broadcast New System Announcement</h3>
                </div>

                {ancCreatedNotice && (
                  <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>System announcement published to all shopkeepers!</span>
                  </div>
                )}

                <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2 space-y-1">
                      <label className="font-bold text-slate-300">Announcement Headline</label>
                      <input
                        type="text"
                        placeholder="e.g., Scheduled System Maintenance or New Fonepay Feature"
                        value={ancTitle}
                        onChange={(e) => setAncTitle(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">Type / Tag</label>
                      <select
                        value={ancType}
                        onChange={(e) => setAncType(e.target.value as any)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="UPDATE">UPDATE</option>
                        <option value="WARNING">WARNING</option>
                        <option value="OFFER">OFFER</option>
                        <option value="INFO">INFO</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Announcement Body Content</label>
                    <textarea
                      rows={3}
                      placeholder="Type detail text shown in header banner for targeted shopkeepers..."
                      value={ancContent}
                      onChange={(e) => setAncContent(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* TARGET AUDIENCE SELECTION (TARGET TO WHOM) */}
                  <div className="space-y-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-blue-400" />
                        <span>Target Audience (Broadcast To Whom)</span>
                      </label>
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        ✨ Matches {targetedMatchingCount} Store User{targetedMatchingCount === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'ALL', label: '🌐 All Users', desc: 'Global platform broadcast' },
                        { id: 'NEW_USERS', label: '🆕 New Users', desc: 'Registered < 1 Month' },
                        { id: 'TRIAL_USERS', label: '⏱️ Trial Period Users', desc: 'Active 7-Day Trial' },
                        { id: 'NEAR_EXPIRY', label: '⚠️ Near to Expire Users', desc: 'Expiring in ≤ 7 Days' },
                        { id: 'SUBSCRIPTION_PLAN', label: '💳 By Subscription Plan', desc: 'Filter by plan tier' },
                        { id: 'MANUAL_USERS', label: '👤 Select Manually', desc: 'Pick specific stores' },
                      ].map((opt) => (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setAncTargetType(opt.id as AnnouncementTargetType)}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            ancTargetType === opt.id
                              ? 'bg-blue-600/20 border-blue-500 text-white shadow-xs ring-1 ring-blue-500/30'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                          }`}
                        >
                          <div className="font-bold text-xs text-white">{opt.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                        </button>
                      ))}
                    </div>

                    {/* SUB-OPTION 1: SUBSCRIPTION PLAN CHECKBOXES */}
                    {ancTargetType === 'SUBSCRIPTION_PLAN' && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-2">
                        <label className="text-[11px] font-semibold text-slate-300">Select Target Subscription Plans:</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {[
                            { id: '7_DAY_TRIAL', name: '7-Day Trial' },
                            { id: 'MONTHLY', name: 'Monthly Growth' },
                            { id: 'QUARTERLY', name: 'Quarterly' },
                            { id: 'HALF_YEARLY', name: 'Half-Yearly' },
                            { id: 'YEARLY', name: 'Yearly Value' },
                            { id: 'ENTERPRISE', name: 'Enterprise Custom' },
                          ].map((plan) => {
                            const isChecked = ancTargetPlans.includes(plan.id as SubscriptionPlan);
                            return (
                              <label
                                key={plan.id}
                                className={`p-2 rounded-lg border text-xs font-semibold cursor-pointer flex items-center gap-2 transition ${
                                  isChecked
                                    ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleTargetPlan(plan.id as SubscriptionPlan)}
                                  className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                                />
                                <span>{plan.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* SUB-OPTION 2: MANUAL USER SELECTION LIST */}
                    {ancTargetType === 'MANUAL_USERS' && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[11px] font-semibold text-slate-300">Select Targeted Store Users:</label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setAncTargetUserIds(filteredUsersForManual.map((u) => u.id))}
                              className="text-[10px] text-blue-400 font-bold hover:underline"
                            >
                              Select All
                            </button>
                            <span className="text-slate-600">•</span>
                            <button
                              type="button"
                              onClick={() => setAncTargetUserIds([])}
                              className="text-[10px] text-slate-400 font-bold hover:underline"
                            >
                              Clear Selection ({ancTargetUserIds.length})
                            </button>
                          </div>
                        </div>

                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Search store name, owner name, phone..."
                            value={manualUserSearch}
                            onChange={(e) => setManualUserSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-1.5 p-1 bg-slate-900/50 rounded-xl border border-slate-800/80">
                          {filteredUsersForManual.length === 0 ? (
                            <p className="text-center text-slate-500 text-xs py-3">No matching store accounts found.</p>
                          ) : (
                            filteredUsersForManual.map((u) => {
                              const isSelected = ancTargetUserIds.includes(u.id);
                              return (
                                <div
                                  key={u.id}
                                  onClick={() => toggleTargetUser(u.id)}
                                  className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
                                    isSelected
                                      ? 'bg-blue-600/20 border-blue-500 text-white'
                                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {}}
                                      className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className="truncate">
                                      <p className="font-bold text-white text-xs truncate">{u.shopName || 'Retail Store'}</p>
                                      <p className="text-[10px] text-slate-400 truncate">{u.ownerName} • Ph: {u.phone}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                      {u.subscriptionPlan}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition active:scale-95"
                  >
                    <Send className="h-4 w-4" />
                    <span>Publish Platform Broadcast</span>
                  </button>
                </form>
              </div>

              {/* Announcements List */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-400" />
                  <span>Active Broadcast History ({systemAnnouncements.length})</span>
                </h3>

                {systemAnnouncements.length === 0 ? (
                  <p className="text-xs text-slate-500">No active system announcements found.</p>
                ) : (
                  <div className="space-y-3">
                    {systemAnnouncements.map((anc) => (
                      <div key={anc.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {anc.type}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {getTargetLabel(anc)}
                            </span>
                            <span className="font-bold text-sm text-white">{anc.title}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{anc.createdAt}</span>
                          </div>
                          <p className="text-xs text-slate-300">{anc.content}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleAnnouncementActive(anc.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                              anc.active
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {anc.active ? 'ACTIVE' : 'INACTIVE'}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              confirmAction({
                                title: 'Confirm Delete Broadcast Announcement',
                                message: `Are you sure you want to delete broadcast "${anc.title}"?`,
                                actionType: 'DELETE',
                                onConfirm: () => deleteSystemAnnouncement(anc.id),
                              })
                            }
                            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-red-400 transition"
                            title="Delete Announcement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 4: SUBSCRIPTION PRICING MANAGER */}
      {activeAdminSubTab === 'PRICING' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Subscription Plan Rates & Free Trial Duration</h3>
                <p className="text-xs text-slate-400">
                  Update default subscription pricing across Dukaan POS. Changes update instantly for all users.
                </p>
              </div>
            </div>

            {pricingSaveNotice && (
              <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Subscription rates saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSavePricing} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 7-Day Free Trial Duration */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-blue-400" />
                      <span>Free Trial Duration (Days)</span>
                    </label>
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">TRIAL</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={trialDaysInput}
                    onChange={(e) => setTrialDaysInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-white text-sm font-bold outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500">Number of free days granted automatically upon user account creation.</p>
                </div>

                {/* Monthly Plan */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white flex items-center gap-1.5">
                      <Tag className="h-4 w-4 text-purple-400" />
                      <span>Monthly Plan Rate (NPR / Month)</span>
                    </label>
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">MONTHLY</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={monthlyNprInput}
                    onChange={(e) => setMonthlyNprInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-white text-sm font-bold outline-none focus:border-purple-500"
                  />
                  <p className="text-[11px] text-slate-500">Standard monthly subscription charge for retail shopkeepers (accepts any number/decimals).</p>
                </div>

                {/* Quarterly Plan */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white flex items-center gap-1.5">
                      <BarChart3 className="h-4 w-4 text-teal-400" />
                      <span>Quarterly Plan Rate (NPR / 3 Months)</span>
                    </label>
                    <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">QUARTERLY</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={quarterlyNprInput}
                    onChange={(e) => setQuarterlyNprInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-white text-sm font-bold outline-none focus:border-teal-500"
                  />
                  <p className="text-[11px] text-slate-500">3-month quarterly subscription billing rate (accepts any number/decimals).</p>
                </div>

                {/* Half-Yearly Plan */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-indigo-400" />
                      <span>Half-Yearly Rate (NPR / 6 Months)</span>
                    </label>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">HALF-YEARLY</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={halfYearlyNprInput}
                    onChange={(e) => setHalfYearlyNprInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-white text-sm font-bold outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500">6-month semi-annual subscription rate (accepts any number/decimals).</p>
                </div>

                {/* Yearly Plan */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white flex items-center gap-1.5">
                      <Crown className="h-4 w-4 text-amber-400" />
                      <span>Yearly Value Plan Rate (NPR / Year)</span>
                    </label>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">YEARLY PRO</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={yearlyNprInput}
                    onChange={(e) => setYearlyNprInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-white text-sm font-bold outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-slate-500">Discounted annual package subscription fee (accepts any number/decimals).</p>
                </div>

              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition active:scale-95"
                  id="save-subscription-prices-btn"
                >
                  <Save className="h-4 w-4" />
                  <span>Save & Apply New Pricing</span>
                </button>
              </div>
            </form>

            {/* REFERRAL MEMBERSHIP REWARD RULE CONFIGURATION */}
            <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <span>Referral Membership Reward Settings</span>
                    <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      MEMBERSHIP ONLY (NO CASH)
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure rule: How many active referred stores earn how many month(s) of free membership extension.
                  </p>
                </div>
              </div>

              {refRuleSaveNotice && (
                <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Referral reward rule updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleSaveReferralRule} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-white flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-indigo-400" />
                      <span>Active Referred Stores Required</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={refReqUsersInput}
                      onChange={(e) => setRefReqUsersInput(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-white text-sm font-bold outline-none focus:border-indigo-500"
                      id="admin-ref-req-users-input"
                    />
                    <p className="text-[11px] text-slate-500">
                      Number of active stores joining via code needed to unlock free membership extension.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-extrabold text-white flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-amber-400" />
                      <span>Free Membership Extension (Month/s)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={refFreeMonthsInput}
                      onChange={(e) => setRefFreeMonthsInput(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-white text-sm font-bold outline-none focus:border-amber-500"
                      id="admin-ref-free-months-input"
                    />
                    <p className="text-[11px] text-slate-500">
                      Months of free membership extension granted once active store target is reached.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-950/50 border border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="text-slate-300 leading-relaxed">
                    <strong>Current Active Rule:</strong> For every <span className="text-amber-300 font-extrabold font-mono">{refReqUsersInput} active store(s)</span>, members get <span className="text-emerald-400 font-extrabold font-mono">{refFreeMonthsInput} Month(s) Free Membership Extension</span>.
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition active:scale-95 shrink-0"
                    id="save-referral-rule-btn"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Referral Settings</span>
                  </button>
                </div>
              </form>
            </div>

            {/* PLAN FEATURES & OFFER PERKS MANAGER */}
            <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                    <span>Customize Subscription Plan Features & Perks</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure staff user limits, store outlet capabilities, and feature list bullet points shown on user sign-up and upgrade modals.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Monthly Features Card */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-purple-400 uppercase tracking-wider">Monthly Plan</span>
                      <span className="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded font-bold">NPR {planPrices.monthlyNpr}/mo</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {planFeatures.monthlyFeatures.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                          <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => openPlanPerksModal('monthlyFeatures', 'Monthly Plan')}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-bold text-xs border border-purple-500/30 transition flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Plan Perks</span>
                  </button>
                </div>

                {/* Quarterly Features Card */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-teal-400 uppercase tracking-wider">Quarterly Plan</span>
                      <span className="text-[10px] font-mono text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded font-bold">NPR {planPrices.quarterlyNpr}/3mo</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {planFeatures.quarterlyFeatures.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => openPlanPerksModal('quarterlyFeatures', 'Quarterly Plan')}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 font-bold text-xs border border-teal-500/30 transition flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Plan Perks</span>
                  </button>
                </div>

                {/* Half-Yearly Features Card */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-indigo-400 uppercase tracking-wider">Half-Yearly Plan</span>
                      <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded font-bold">NPR {planPrices.halfYearlyNpr}/6mo</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {planFeatures.halfYearlyFeatures.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => openPlanPerksModal('halfYearlyFeatures', 'Half-Yearly Plan')}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-bold text-xs border border-indigo-500/30 transition flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Plan Perks</span>
                  </button>
                </div>

                {/* Yearly Features Card */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-amber-400 uppercase tracking-wider">Yearly Pro Plan</span>
                      <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded font-bold">NPR {planPrices.yearlyNpr}/yr</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {planFeatures.yearlyFeatures.map((f, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                          <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => openPlanPerksModal('yearlyFeatures', 'Yearly Pro Plan')}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 font-bold text-xs border border-amber-500/30 transition flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Plan Perks</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* COUPON & PROMOTIONAL OFFERS MANAGER */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Tag className="h-6 w-6 text-purple-400" />
                  <span>Coupon Codes & Special Offers</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Create discount coupons with custom start & end dates, percentage/flat NPR discounts, and instant enable/disable toggles.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCouponModal(true)}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-purple-600/20 transition active:scale-95 shrink-0"
                id="create-new-coupon-btn"
              >
                <Plus className="h-4 w-4" />
                <span>Create Offer Coupon</span>
              </button>
            </div>

            {cpnNotice && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0" />
                <span>New coupon created successfully! It is live for user signup.</span>
              </div>
            )}

            {/* Coupons List Grid */}
            {coupons.length === 0 ? (
              <div className="text-center py-8 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
                <Tag className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">No active coupons created yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Click "Create Offer Coupon" to launch a promotional code.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map((c) => {
                  const today = new Date().toISOString().split('T')[0];
                  const isExpired = c.endDate ? today > c.endDate : false;
                  const isUpcoming = c.startDate ? today < c.startDate : false;

                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-4 ${
                        !c.isActive || isExpired
                          ? 'bg-slate-950/60 border-slate-800/80 opacity-70'
                          : 'bg-slate-950 border-purple-500/30 hover:border-purple-500/60'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono font-extrabold text-sm tracking-wider">
                            {c.code}
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Enable/Disable Toggle */}
                            <button
                              type="button"
                              onClick={() => toggleCouponActive(c.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition flex items-center gap-1 ${
                                c.isActive
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                              title={c.isActive ? 'Click to Disable Coupon' : 'Click to Enable Coupon'}
                            >
                              {c.isActive ? 'Active' : 'Disabled'}
                            </button>

                            {/* Delete Coupon */}
                            <button
                              type="button"
                              onClick={() =>
                                confirmAction({
                                  title: `Delete Coupon ${c.code}`,
                                  message: `Are you sure you want to permanently delete coupon code "${c.code}"?`,
                                  actionType: 'DELETE',
                                  onConfirm: () => deleteCoupon(c.id),
                                })
                              }
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                              title="Delete Coupon"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="text-xl font-black text-white">
                            {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `NPR ${formatPrice(c.discountValue)} OFF`}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Target Plan: <span className="font-bold text-slate-200">{c.applicablePlan || 'ALL PLANS'}</span>
                          </p>
                        </div>

                        {/* Validity Dates & Usage */}
                        <div className="space-y-1 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <span>Valid Dates:</span>
                            <span className="font-mono text-slate-300">
                              {c.startDate || c.endDate ? `${c.startDate || 'Any'} → ${c.endDate || 'No Expiry'}` : 'Lifetime Valid'}
                            </span>
                          </div>
                          {isExpired && <p className="text-[10px] text-rose-400 font-bold">⚠️ Expired on {c.endDate}</p>}
                          {isUpcoming && <p className="text-[10px] text-amber-400 font-bold">⏳ Starts on {c.startDate}</p>}
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                            <span>Times Redeemed:</span>
                            <span className="font-mono font-bold text-purple-400">{c.timesUsed} uses</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CREATE COUPON MODAL */}
          {showCouponModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="relative max-w-lg w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-6 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-purple-400" />
                    <h3 className="text-lg font-black text-white">Create New Offer Coupon</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCouponModal(false)}
                    className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateCoupon} className="space-y-4">
                  {/* Coupon Code */}
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                      Coupon Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DASHAIN20, WELCOME500"
                      value={cpnCode}
                      onChange={(e) => setCpnCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 font-mono text-white text-sm font-bold uppercase tracking-wider outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Discount Type & Value */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                        Discount Type
                      </label>
                      <select
                        value={cpnDiscountType}
                        onChange={(e) => setCpnDiscountType(e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT')}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold outline-none focus:border-purple-500"
                      >
                        <option value="PERCENTAGE">Percentage (% Off)</option>
                        <option value="FIXED_AMOUNT">Flat Amount (NPR Off)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                        {cpnDiscountType === 'PERCENTAGE' ? 'Discount % *' : 'Flat NPR Off *'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        required
                        value={cpnDiscountValue}
                        onChange={(e) => setCpnDiscountValue(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 font-mono text-white text-sm font-bold outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Applicable Plan */}
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                      Applicable Plan
                    </label>
                    <select
                      value={cpnApplicablePlan}
                      onChange={(e) => setCpnApplicablePlan(e.target.value as SubscriptionPlan | 'ALL')}
                      className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold outline-none focus:border-purple-500"
                    >
                      <option value="ALL">All Plans (Monthly, Quarterly, Yearly, etc.)</option>
                      <option value="MONTHLY">Monthly Plan Only</option>
                      <option value="QUARTERLY">Quarterly Plan Only</option>
                      <option value="HALF_YEARLY">Half-Yearly Plan Only</option>
                      <option value="YEARLY">Yearly Pro Plan Only</option>
                      <option value="ENTERPRISE">Enterprise Plan Only</option>
                    </select>
                  </div>

                  {/* Start & End Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                        Start Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={cpnStartDate}
                        onChange={(e) => setCpnStartDate(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                        End Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={cpnEndDate}
                        onChange={(e) => setCpnEndDate(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Initial Status Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs font-bold text-white">Enable Coupon Immediately</span>
                    <button
                      type="button"
                      onClick={() => setCpnIsActive(!cpnIsActive)}
                      className={`px-3 py-1 rounded-full text-xs font-extrabold transition ${
                        cpnIsActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {cpnIsActive ? 'ACTIVE' : 'DISABLED'}
                    </button>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCouponModal(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-lg shadow-purple-600/30 transition active:scale-95"
                    >
                      Create Coupon Code
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 5: STAFF IDS & LOGIN ACCOUNT CREATION REQUESTS */}
      {activeAdminSubTab === 'STAFF_IDS' && (
        <div className="space-y-6">
          {/* HEADER BANNER */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <Users className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-extrabold text-white">Staff IDs & Account Creation Requests</h2>
              </div>
              <p className="text-xs text-slate-400 max-w-2xl">
                Review all requests sent by store owners across Dukaan POS to create Staff User IDs and passwords for their staff members. Manage login credentials, assigned roles, basic salaries, and system permissions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-slate-300">
                Total Staff Accounts: <span className="text-purple-400 font-extrabold">{staffList.length}</span>
              </span>
            </div>
          </div>

          {/* METRIC SUMMARY CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div
              onClick={() => setStaffFilterStatus('ALL')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                staffFilterStatus === 'ALL'
                  ? 'bg-purple-950/60 border-purple-500 text-white'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>All Staff Requests</span>
                <Users className="h-4 w-4 text-purple-400" />
              </div>
              <p className="text-2xl font-black text-white font-mono">{staffList.length}</p>
            </div>

            <div
              onClick={() => setStaffFilterStatus('PENDING')}
              className={`p-4 rounded-2xl border transition cursor-pointer relative overflow-hidden ${
                staffFilterStatus === 'PENDING'
                  ? 'bg-amber-950/60 border-amber-500 text-white'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              {staffList.filter((s) => s.accountRequestStatus === 'PENDING').length > 0 && (
                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
              )}
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>Pending Approval</span>
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-400 font-mono">
                {staffList.filter((s) => s.accountRequestStatus === 'PENDING').length}
              </p>
            </div>

            <div
              onClick={() => setStaffFilterStatus('APPROVED')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                staffFilterStatus === 'APPROVED'
                  ? 'bg-emerald-950/60 border-emerald-500 text-white'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>Approved & Active IDs</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400 font-mono">
                {staffList.filter((s) => s.accountRequestStatus === 'APPROVED' || (!s.accountRequestStatus && s.username)).length}
              </p>
            </div>

            <div
              onClick={() => setStaffFilterStatus('REJECTED')}
              className={`p-4 rounded-2xl border transition cursor-pointer ${
                staffFilterStatus === 'REJECTED'
                  ? 'bg-rose-950/60 border-rose-500 text-white'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
                <span>Declined Requests</span>
                <UserX className="h-4 w-4 text-rose-400" />
              </div>
              <p className="text-2xl font-black text-rose-400 font-mono">
                {staffList.filter((s) => s.accountRequestStatus === 'REJECTED').length}
              </p>
            </div>
          </div>

          {/* STORE OWNER STAFF USER ID ACCESS REQUESTS BANNER */}
          {registeredUsers.some((u) => u.staffUserIdAccessStatus === 'PENDING') && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-3 shadow-lg">
              <div className="flex items-center justify-between font-extrabold text-sm border-b border-amber-500/20 pb-2">
                <span className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-400 animate-bounce" />
                  <span>Store Owners Requesting Staff User ID Feature Access ({registeredUsers.filter((u) => u.staffUserIdAccessStatus === 'PENDING').length})</span>
                </span>
                <span className="text-xs text-amber-300/80 font-mono">Permission Request</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {registeredUsers
                  .filter((u) => u.staffUserIdAccessStatus === 'PENDING')
                  .map((reqUser) => (
                    <div key={reqUser.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-extrabold text-white text-sm">{reqUser.shopName || reqUser.name}</p>
                        <p className="text-slate-400">Owner: {reqUser.name} • @{reqUser.username}</p>
                        <p className="text-slate-400 text-[11px]">Ph: {reqUser.phone || 'N/A'} • {reqUser.district || 'Bagmati'}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => approveStaffUserIdAccess(reqUser.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1 shadow transition active:scale-95"
                          id={`approve-owner-staff-access-${reqUser.id}`}
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Grant Access</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectStaffUserIdAccess(reqUser.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                          id={`reject-owner-staff-access-${reqUser.id}`}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* SEARCH & FILTER TABS BAR */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by Staff Name, Username, Phone, Store..."
                value={staffSearchTerm}
                onChange={(e) => setStaffSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
                id="staff-ids-search-input"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto w-full sm:w-auto shrink-0">
              {[
                { id: 'ALL', label: 'All Requests' },
                { id: 'PENDING', label: 'Pending Approval' },
                { id: 'APPROVED', label: 'Approved Staff IDs' },
                { id: 'REJECTED', label: 'Declined' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStaffFilterStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    staffFilterStatus === tab.id
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  id={`staff-filter-tab-${tab.id}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* STAFF REQUEST CARDS LIST */}
          {(() => {
            const filteredStaff = staffList.filter((s) => {
              const matchSearch =
                s.name.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
                (s.username && s.username.toLowerCase().includes(staffSearchTerm.toLowerCase())) ||
                (s.phone && s.phone.includes(staffSearchTerm)) ||
                (s.role && s.role.toLowerCase().includes(staffSearchTerm.toLowerCase())) ||
                (s.storeBranch && s.storeBranch.toLowerCase().includes(staffSearchTerm.toLowerCase()));

              if (staffFilterStatus === 'PENDING') {
                return matchSearch && s.accountRequestStatus === 'PENDING';
              }
              if (staffFilterStatus === 'APPROVED') {
                return matchSearch && (s.accountRequestStatus === 'APPROVED' || (!s.accountRequestStatus && s.username));
              }
              if (staffFilterStatus === 'REJECTED') {
                return matchSearch && s.accountRequestStatus === 'REJECTED';
              }
              return matchSearch;
            });

            if (filteredStaff.length === 0) {
              return (
                <div className="text-center py-12 bg-slate-900/50 rounded-3xl border border-dashed border-slate-800 space-y-3">
                  <Users className="h-10 w-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-400">No staff account requests match your filter.</p>
                  <p className="text-xs text-slate-500">Try adjusting your search terms or filter selection.</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStaff.map((staff) => {
                  const isPending = staff.accountRequestStatus === 'PENDING';
                  const isApproved = staff.accountRequestStatus === 'APPROVED' || (!staff.accountRequestStatus && staff.username);
                  const isRejected = staff.accountRequestStatus === 'REJECTED';
                  const showPass = showPasswordState[staff.id] || false;

                  return (
                    <div
                      key={staff.id}
                      className={`p-5 rounded-3xl border transition flex flex-col justify-between space-y-4 shadow-xl ${
                        isPending
                          ? 'bg-slate-900/90 border-amber-500/40 shadow-amber-950/20'
                          : isApproved
                          ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/40'
                          : 'bg-slate-950/80 border-slate-800/80 opacity-75'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Header: Name, Role & Status Tag */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shadow ${getAvatarBg(staff.name)}`}>
                              {getInitials(staff.name)}
                            </div>
                            <div>
                              <h3 className="font-extrabold text-base text-white">{staff.name}</h3>
                              <span className="inline-block px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-bold mt-0.5">
                                {staff.role || 'Staff Member'}
                              </span>
                            </div>
                          </div>

                          {/* Status Tag */}
                          {isPending && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold flex items-center gap-1 animate-pulse shrink-0">
                              <Clock className="h-3 w-3 text-amber-400" />
                              <span>Pending</span>
                            </span>
                          )}
                          {isApproved && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              <span>Approved</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-extrabold flex items-center gap-1 shrink-0">
                              <UserX className="h-3 w-3 text-rose-400" />
                              <span>Declined</span>
                            </span>
                          )}
                        </div>

                        {/* STAFF LOGIN CREDENTIALS BOX */}
                        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-medium">Staff User ID / Username:</span>
                            <span className="font-mono font-extrabold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                              {staff.username || 'Not assigned yet'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                            <span className="text-slate-400 font-medium">Account Password:</span>
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
                                {showPass ? staff.password || '••••••••' : '••••••••'}
                              </span>
                              {staff.password && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowPasswordState((prev) => ({ ...prev, [staff.id]: !prev[staff.id] }))
                                  }
                                  className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white transition"
                                  title={showPass ? 'Hide Password' : 'Reveal Password'}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* REQUIRED DETAILS GRID */}
                        <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <Store className="h-3.5 w-3.5 text-slate-500" />
                              <span>Store / Branch:</span>
                            </span>
                            <span className="font-bold text-white text-right truncate max-w-[170px]">
                              {staff.storeBranch || 'Main Outlet'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-slate-500" />
                              <span>Contact Phone:</span>
                            </span>
                            <span className="font-mono text-slate-200">{staff.phone || 'N/A'}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                              <span>Basic Monthly Salary:</span>
                            </span>
                            <span className="font-mono font-bold text-emerald-400">
                              NPR {formatPrice(staff.basicSalary || 0)} / {staff.salaryType || 'Month'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-500" />
                              <span>Join / Request Date:</span>
                            </span>
                            <span className="font-mono text-slate-300">{staff.joinDate || '2026-07-20'}</span>
                          </div>

                          {staff.address && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Address:</span>
                              <span className="text-slate-300 truncate max-w-[170px]">{staff.address}</span>
                            </div>
                          )}

                          {staff.notes && (
                            <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 italic">
                              "{staff.notes}"
                            </p>
                          )}
                        </div>

                        {/* PERMISSIONS GRANTED */}
                        <div className="pt-2 border-t border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Assigned Module Access:
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                staff.permissions?.canDoSales ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-950 text-slate-600'
                              }`}
                            >
                              POS Billing
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                staff.permissions?.canManageStock ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-950 text-slate-600'
                              }`}
                            >
                              Inventory Stock
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                staff.permissions?.canDoPurchase ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-950 text-slate-600'
                              }`}
                            >
                              Purchases
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                staff.permissions?.canViewReports ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-950 text-slate-600'
                              }`}
                            >
                              Reports
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ACTION BUTTONS FOOTER */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                        {isPending ? (
                          <>
                            <button
                              type="button"
                              onClick={() => approveStaffAccount(staff.id)}
                              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
                              id={`approve-staff-account-btn-${staff.id}`}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Approve & Issue ID</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => rejectStaffAccount(staff.id)}
                              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 font-bold text-xs border border-slate-700 transition"
                              id={`reject-staff-account-btn-${staff.id}`}
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <div className="w-full flex items-center justify-between">
                            <span className="text-[11px] text-slate-500">
                              {isApproved ? 'Active Staff User ID' : 'Request Declined'}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                confirmAction({
                                  title: `Delete Staff Record: ${staff.name}`,
                                  message: `Are you sure you want to delete staff account record for "${staff.name}" (${staff.username || 'No ID'})?`,
                                  actionType: 'DELETE',
                                  onConfirm: () => deleteStaffMember(staff.id),
                                })
                              }
                              className="p-1.5 rounded-lg bg-slate-950 text-slate-500 hover:text-rose-400 transition"
                              title="Delete Staff Account"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Admin Photo Preview Modal */}
      {adminPhotoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden p-2 border border-slate-700 shadow-2xl">
            <button
              type="button"
              onClick={() => setAdminPhotoModal(null)}
              className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-full z-10"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={adminPhotoModal} alt="Support Attachment Full View" className="max-h-[80vh] w-auto mx-auto rounded-xl object-contain" />
          </div>
        </div>
      )}

      {/* APPROVAL & SUBSCRIPTION EXPIRY MODAL */}
      {selectedUserForApproval && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Approve Account Subscription</h3>
              </div>
              <button
                onClick={() => setSelectedUserForApproval(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <p className="font-bold text-white text-sm">{selectedUserForApproval.shopName || selectedUserForApproval.name}</p>
                <p className="text-slate-400">Owner: {selectedUserForApproval.name} • @{selectedUserForApproval.username}</p>
                <p className="text-slate-400">Location: {selectedUserForApproval.province || 'Bagmati Province'}, {selectedUserForApproval.district || 'Kathmandu'}</p>
                <p className="text-slate-400">Email: {selectedUserForApproval.email} • Ph: {selectedUserForApproval.phone || 'N/A'}</p>
              </div>

              {/* Select Subscription Plan */}
              <div>
                <label className="block text-slate-300 font-bold mb-2">
                  Subscription Tier Plan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'MONTHLY', name: 'Monthly Plan', price: `NPR ${formatPrice(planPrices.monthlyNpr)} / mo` },
                    { id: 'QUARTERLY', name: 'Quarterly Plan', price: `NPR ${formatPrice(planPrices.quarterlyNpr ?? 4000)} / 3 mo` },
                    { id: 'HALF_YEARLY', name: 'Half-Yearly Plan', price: `NPR ${formatPrice(planPrices.halfYearlyNpr ?? 7500)} / 6 mo` },
                    { id: 'YEARLY', name: 'Yearly Value', price: `NPR ${formatPrice(planPrices.yearlyNpr)} / yr` },
                    { id: 'ENTERPRISE', name: 'Enterprise Custom', price: `NPR ${formatPrice(planPrices.enterpriseNpr)} / yr` },
                    { id: '7_DAY_TRIAL', name: `${planPrices.trialDays}-Day Free Trial`, price: 'NPR 0' },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setApprovalPlan(p.id as SubscriptionPlan)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        approvalPlan === p.id
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="font-bold text-white">{p.name}</p>
                      <p className="text-[10px] text-blue-400 font-mono">{p.price}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Preset Days */}
              <div>
                <label className="block text-slate-300 font-bold mb-2">
                  Approval Expiration Duration
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { days: 7, label: '+7 Days' },
                    { days: 30, label: '1 Month (+30d)' },
                    { days: 180, label: '6 Months (+180d)' },
                    { days: 365, label: '1 Year (+365d)' },
                    { days: 1095, label: '3 Years' },
                  ].map((btn) => (
                    <button
                      type="button"
                      key={btn.days}
                      onClick={() => handleDaysChange(btn.days)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition ${
                        approvalDays === btn.days
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Input */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  Exact Approved Expiry Date (YYYY-MM-DD)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    value={customApprovalDate}
                    onChange={(e) => setCustomApprovalDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold outline-none focus:border-emerald-500"
                    id="admin-approval-custom-date-input"
                  />
                </div>
              </div>

              {/* Submit Modal Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedUserForApproval(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmApproval}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition active:scale-95"
                  id="confirm-admin-user-approval-btn"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirm Approval Until {customApprovalDate}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ADMIN CHANGE USER PASSWORD MODAL */}
      {selectedUserForPasswordChange && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => {
                setSelectedUserForPasswordChange(null);
                setPassNotice(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <KeyRound className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Change Account Password
                </h3>
                <p className="text-xs text-slate-400">
                  Account: <strong className="text-amber-300">{selectedUserForPasswordChange.shopName || selectedUserForPasswordChange.name}</strong> (@{selectedUserForPasswordChange.username})
                </p>
              </div>
            </div>

            {passNotice && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  passNotice.isError
                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {passNotice.isError ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
                <span>{passNotice.message}</span>
              </div>
            )}

            <form onSubmit={handleAdminChangePasswordSubmit} className="space-y-4 pt-1">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPasswordModalState ? 'text' : 'password'}
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Minimum 4 characters (8+ recommended)"
                    className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordModalState(!showPasswordModalState)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPasswordModalState ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrengthIndicator password={newPasswordInput} isDark={true} />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">
                  Confirm New Password *
                </label>
                <input
                  type={showPasswordModalState ? 'text' : 'password'}
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUserForPasswordChange(null);
                    setPassNotice(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-600/20 transition active:scale-95 cursor-pointer"
                  id="save-admin-changed-password-btn"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Save New Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PLAN PERKS & FEATURES MODAL */}
      {editingPlanKey && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  <span>Customize {editingPlanTitle} Features & Perks</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Changes will immediately update the Landing Page pricing section & Signup modal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlanKey(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {perkSavedNotice && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Perks updated successfully! Landing & Signup pages synced.</span>
              </div>
            )}

            {/* List of existing perks with delete/edit */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Current Feature Bullet Points ({editingPlanLines.length}):
              </label>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {editingPlanLines.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">No perk items added yet. Add one below!</p>
                ) : (
                  editingPlanLines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-slate-500 font-mono text-xs w-5 text-right">{idx + 1}.</span>
                      <input
                        type="text"
                        value={line}
                        onChange={(e) => handleUpdatePerkLine(idx, e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-amber-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePerkLine(idx)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition shrink-0"
                        title="Delete perk"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add New Perk Input */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300">
                + Add New Feature Bullet Point:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPerkInput}
                  onChange={(e) => setNewPerkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPerkLine();
                    }
                  }}
                  placeholder="e.g. Priority WhatsApp & Phone Support 24/7"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddPerkLine}
                  className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 transition shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Line</span>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset to standard default features for this plan?')) {
                    const defaults: Record<string, string[]> = {
                      monthlyFeatures: [
                        'Fast POS Billing & Thermal Receipts',
                        'Khata Udharo & Customer Directory',
                        '1 Staff User ID & Password Account',
                        'Sales, Purchase & Advance Payments Entries',
                        'Basic Sales & Inventory Analytics',
                      ],
                      quarterlyFeatures: [
                        'All Monthly Plan Features Included',
                        'Up to 3 Staff User IDs & Passwords',
                        'Sales, Purchase & Advance Payments Entries',
                        'Multi-Branch Store Outlet Support',
                        'Audit Trail (Who performed which entry)',
                        'Priority Customer Support',
                      ],
                      halfYearlyFeatures: [
                        'All Quarterly Plan Features Included',
                        'Up to 5 Staff User IDs & Passwords',
                        'Custom Staff Permissions & Salary Tracking',
                        'Multiple Store Outlets & Branch Switching',
                        'Full Audit Trail & User Activity Logs',
                        'Cloud Data Backup & Syncing',
                      ],
                      yearlyFeatures: [
                        'Unlimited Staff User Accounts & Passwords',
                        'Multi-Store Chains & Centralized Inventory',
                        'Complete Audit Trail & Staff Action Logs',
                        'Sales, Purchase, Expenses & Advance Payments',
                        'Custom Receipt Headers, VAT & PAN Invoicing',
                        'VIP 24/7 Priority Support Manager',
                      ],
                    };
                    if (editingPlanKey && defaults[editingPlanKey]) {
                      setEditingPlanLines(defaults[editingPlanKey]);
                    }
                  }
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 underline"
              >
                Reset Default Perks
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPlanKey(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePlanPerks}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition active:scale-95"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Plan Perks</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
