import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { NEPAL_PROVINCES } from '../../data/initialData';
import { PasswordStrengthIndicator } from '../common/PasswordStrengthIndicator';
import {
  Store,
  MapPin,
  Printer,
  CheckCircle2,
  UserCheck,
  KeyRound,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  AlertTriangle,
  Mail,
  Phone,
  Hash,
  Sparkles,
  ShieldAlert,
  Percent,
  Receipt,
  Building2,
  Copy,
  Check,
} from 'lucide-react';

type ProfileSectionTab = 'GENERAL' | 'PASSWORD' | 'DELETE_ACCOUNT' | 'PRINTER_TAX';

export const ShopProfileView: React.FC = () => {
  const {
    shopProfile,
    updateShopProfile,
    currentUser,
    changeCurrentPassword,
    deleteSelfAccount,
    confirmAction,
  } = useApp();

  // Active section tab
  const [activeTab, setActiveTab] = useState<ProfileSectionTab>('GENERAL');

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const effectiveShopCode = isSuperAdmin
    ? (currentUser?.shopCode || shopProfile.shopCode || 'DUKAAN-8821')
    : (currentUser?.shopCode || (shopProfile.shopCode && shopProfile.shopCode !== 'DUKAAN-8821' && shopProfile.shopCode !== 'SHOP-0001' ? shopProfile.shopCode : 'SHOP-01'));
  const effectiveShopName = currentUser?.shopName || (shopProfile.shopName && shopProfile.shopName !== 'Dukaan.io Corporate HQ' && shopProfile.shopName !== 'My Store' ? shopProfile.shopName : (isSuperAdmin ? 'Dukaan.io Corporate HQ' : 'My Store'));

  // General Details State (strictly populated with user's own details)
  const [shopName, setShopName] = useState(() => {
    if (!isSuperAdmin) {
      return currentUser?.shopName || (shopProfile.shopName && shopProfile.shopName !== 'Dukaan.io Corporate HQ' && shopProfile.shopName !== 'My Store' ? shopProfile.shopName : '');
    }
    return currentUser?.shopName || shopProfile.shopName || 'Dukaan.io Corporate HQ';
  });

  const [ownerName, setOwnerName] = useState(() => {
    if (!isSuperAdmin) {
      return currentUser?.name || (shopProfile.ownerName && !shopProfile.ownerName.includes('Super Admin') && shopProfile.ownerName !== 'Store Owner' ? shopProfile.ownerName : '');
    }
    return currentUser?.name || shopProfile.ownerName || 'Super Admin';
  });

  const [phone, setPhone] = useState(() => {
    if (!isSuperAdmin) {
      return currentUser?.phone || (shopProfile.phone && shopProfile.phone !== '9800805092' && shopProfile.phone !== '9801234567' ? shopProfile.phone : '');
    }
    return currentUser?.phone || shopProfile.phone || '';
  });

  const [email, setEmail] = useState(() => {
    if (!isSuperAdmin) {
      return currentUser?.email || (shopProfile.email && shopProfile.email !== 'admin@dukan' ? shopProfile.email : '');
    }
    return currentUser?.email || shopProfile.email || '';
  });

  const [tagline, setTagline] = useState(shopProfile.tagline || '');
  const [logoUrl, setLogoUrl] = useState(shopProfile.logoUrl || '');

  // Address State (blank for first time until user fills and saves)
  const [province, setProvince] = useState(shopProfile.address?.province || currentUser?.province || '');
  const [district, setDistrict] = useState(shopProfile.address?.district || currentUser?.district || '');
  const [municipality, setMunicipality] = useState(shopProfile.address?.municipality || '');
  const [wardNo, setWardNo] = useState(shopProfile.address?.wardNo || '');
  const [tole, setTole] = useState(shopProfile.address?.tole || '');

  // Keep state in sync with shopProfile & currentUser
  useEffect(() => {
    if (currentUser) {
      if (!isSuperAdmin) {
        if (currentUser.shopName) setShopName(currentUser.shopName);
        if (currentUser.name) setOwnerName(currentUser.name);
        if (currentUser.phone) setPhone(currentUser.phone);
        if (currentUser.email) setEmail(currentUser.email);
      }
    }
  }, [currentUser, isSuperAdmin]);

  useEffect(() => {
    if (shopProfile) {
      if (isSuperAdmin) {
        if (shopProfile.shopName) setShopName(shopProfile.shopName);
        if (shopProfile.ownerName) setOwnerName(shopProfile.ownerName);
        if (shopProfile.phone) setPhone(shopProfile.phone);
        if (shopProfile.email) setEmail(shopProfile.email);
      } else {
        if (shopProfile.shopName && shopProfile.shopName !== 'Dukaan.io Corporate HQ' && shopProfile.shopName !== 'My Store') {
          setShopName(shopProfile.shopName);
        }
        if (shopProfile.ownerName && !shopProfile.ownerName.includes('Super Admin') && shopProfile.ownerName !== 'Store Owner') {
          setOwnerName(shopProfile.ownerName);
        }
        if (shopProfile.phone && shopProfile.phone !== '9800805092' && shopProfile.phone !== '9801234567') {
          setPhone(shopProfile.phone);
        }
        if (shopProfile.email && shopProfile.email !== 'admin@dukan') {
          setEmail(shopProfile.email);
        }
      }
      if (shopProfile.tagline !== undefined) setTagline(shopProfile.tagline);
      if (shopProfile.logoUrl !== undefined) setLogoUrl(shopProfile.logoUrl);
      if (shopProfile.address) {
        setProvince(shopProfile.address.province || currentUser?.province || '');
        setDistrict(shopProfile.address.district || currentUser?.district || '');
        setMunicipality(shopProfile.address.municipality || '');
        setWardNo(shopProfile.address.wardNo || '');
        setTole(shopProfile.address.tole || '');
      }
    }
  }, [shopProfile, isSuperAdmin, currentUser?.province, currentUser?.district]);

  // Thermal printer & VAT State
  const [thermalPrinterType, setThermalPrinterType] = useState(shopProfile.thermalPrinterType || '80mm');
  const [panVatNo, setPanVatNo] = useState(shopProfile.panVatNo || '');
  const [enableVat, setEnableVat] = useState(shopProfile.enableVat ?? false);
  const [vatRate, setVatRate] = useState(shopProfile.vatRate ?? 13);
  const [currencySymbol, setCurrencySymbol] = useState(shopProfile.currencySymbol || 'NPR');

  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [copiedCodeNotice, setCopiedCodeNotice] = useState(false);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{ message: string; isError: boolean } | null>(null);

  // Delete Account States
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Available districts for selected province
  const selectedProvinceObj = NEPAL_PROVINCES.find((p) => p.name === province);
  const availableDistricts = selectedProvinceObj ? selectedProvinceObj.districts : [];

  // Auto Generate Unique Shop Code based on province & district
  const generateUniqueShopCode = (prov: string, dist: string) => {
    const pCode = prov.slice(0, 3).toUpperCase();
    const dCode = dist.slice(0, 3).toUpperCase();
    const num = Math.floor(1000 + Math.random() * 9000);
    return `DUKAAN-${pCode}-${dCode}-${num}`;
  };

  const addressParts = [
    tole.trim(),
    wardNo.trim() ? `Ward ${wardNo.trim()}` : '',
    municipality.trim(),
    district.trim(),
    province.trim(),
  ].filter(Boolean);
  const currentFullAddress = addressParts.join(', ');

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();

    const fullAddress = currentFullAddress;
    const autoShopCode = effectiveShopCode;

    updateShopProfile({
      ...shopProfile,
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      tagline: tagline.trim(),
      logoUrl: logoUrl.trim(),
      shopCode: autoShopCode,
      address: {
        province,
        district,
        municipality: municipality.trim(),
        wardNo: wardNo.trim(),
        tole: tole.trim(),
        fullAddress,
      },
    });

    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const handleSavePrinterTax = (e: React.FormEvent) => {
    e.preventDefault();

    updateShopProfile({
      ...shopProfile,
      thermalPrinterType,
      panVatNo: panVatNo.trim(),
      enableVat,
      vatRate: Number(vatRate) || 0,
      currencySymbol: currencySymbol.trim() || 'NPR',
    });

    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);

    if (newPassword.length < 4) {
      setPasswordNotice({ message: 'New password must be at least 4 characters long.', isError: true });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordNotice({ message: 'New password and confirm password do not match.', isError: true });
      return;
    }

    const result = changeCurrentPassword(currentPassword, newPassword);
    if (result.success) {
      setPasswordNotice({ message: result.message, isError: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordNotice(null), 4000);
    } else {
      setPasswordNotice({ message: result.message, isError: true });
    }
  };

  const handleDeleteAccountClick = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setDeletePasswordError(null);

    if (!deletePassword.trim()) {
      setDeletePasswordError('Please enter your account password to verify ownership before deleting.');
      return;
    }

    confirmAction({
      title: 'Permanently Delete Store Account & Supabase Data?',
      message: `Are you sure you want to permanently delete your store account (${effectiveShopName})? All products, invoices, customer khata balances, supplier ledgers, expenses, and ALL data stored in the Supabase database will be permanently wiped. This action CANNOT be undone.`,
      actionType: 'DELETE',
      confirmText: 'Verify Password & Delete Everything',
      cancelText: 'Cancel & Keep Account',
      onConfirm: async () => {
        setIsDeletingAccount(true);
        try {
          const res = await deleteSelfAccount(deletePassword.trim());
          if (!res.success) {
            setDeletePasswordError(res.message);
          }
        } catch (err: any) {
          setDeletePasswordError(err?.message || 'An error occurred while deleting the account.');
        } finally {
          setIsDeletingAccount(false);
        }
      },
    });
  };

  const handleCopyCode = () => {
    if (effectiveShopCode) {
      navigator.clipboard.writeText(effectiveShopCode);
      setCopiedCodeNotice(true);
      setTimeout(() => setCopiedCodeNotice(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Shop Profile & Settings</span>
              <span className="text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                {effectiveShopCode}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage store details, geographic address, account password, thermal printer & tax configuration.
            </p>
          </div>
        </div>

        {isSavedNotice && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 animate-fade-in border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Profile settings updated successfully!</span>
          </div>
        )}
      </div>

      {/* 4 Section Navigation Sub-Tabs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('GENERAL')}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'GENERAL'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          id="tab-general-store-details"
        >
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate">General Store & Address</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PASSWORD')}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'PASSWORD'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          id="tab-change-password"
        >
          <KeyRound className="h-4 w-4 shrink-0" />
          <span className="truncate">Change Password</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PRINTER_TAX')}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'PRINTER_TAX'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          id="tab-printer-tax-settings"
        >
          <Printer className="h-4 w-4 shrink-0" />
          <span className="truncate">Printer & Tax Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DELETE_ACCOUNT')}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'DELETE_ACCOUNT'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40'
          }`}
          id="tab-delete-account"
        >
          <Trash2 className="h-4 w-4 shrink-0" />
          <span className="truncate">Delete Account</span>
        </button>
      </div>

      {/* SECTION 1: General Store & Ownership Details (Includes Address) */}
      {activeTab === 'GENERAL' && (
        <form onSubmit={handleSaveGeneral} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                    <UserCheck className="h-4.5 w-4.5 text-indigo-500" />
                    <span>General Store & Ownership Details</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Basic Shop Profile</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Store className="h-3.5 w-3.5 text-slate-400" />
                      <span>Shop Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="e.g. Pokhara Super Market"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                      <span>Owner / Manager Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Ramesh Shrestha"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>Contact Mobile Number *</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9800000000"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>Shop Email Address</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="store@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Store Tagline / Slogan
                    </label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Quality Groceries at Wholesale Rates in Pokhara"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Official Nepal Geographic Address Infrastructure */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                    <MapPin className="h-4.5 w-4.5 text-emerald-500" />
                    <span>Shop Address & Location Details</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Nepal Location Hierarchy</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Province No. / Name
                    </label>
                    <select
                      value={province}
                      onChange={(e) => {
                        const newProv = e.target.value;
                        setProvince(newProv);
                        const pObj = NEPAL_PROVINCES.find((p) => p.name === newProv);
                        if (pObj && pObj.districts.length > 0) {
                          setDistrict(pObj.districts[0]);
                        } else {
                          setDistrict('');
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="">-- Select Province --</option>
                      {NEPAL_PROVINCES.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      District
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="">-- Select District --</option>
                      {availableDistricts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Municipality / Nagarpalika / Gaunpalika
                    </label>
                    <input
                      type="text"
                      value={municipality}
                      onChange={(e) => setMunicipality(e.target.value)}
                      placeholder="e.g. Pokhara Metropolitan City"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Ward No.
                      </label>
                      <input
                        type="text"
                        value={wardNo}
                        onChange={(e) => setWardNo(e.target.value)}
                        placeholder="e.g. 8"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Tole / Street Name
                      </label>
                      <input
                        type="text"
                        value={tole}
                        onChange={(e) => setTole(e.target.value)}
                        placeholder="e.g. Srijana Chowk"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Formatted Invoice Address Preview:
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{currentFullAddress || 'No address set yet'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar Meta Card */}
            <div className="space-y-6">
              {/* Unique Shop Code Card */}
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6 shadow-2xs dark:border-indigo-900/50 dark:bg-indigo-950/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    Unique Nepal Store Code
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCodeNotice ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCodeNotice ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-base font-black text-indigo-900 dark:text-indigo-100 bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 text-center select-all">
                  {effectiveShopCode}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  System-assigned shop identifier for cloud synchronization and multi-terminal syncing.
                </p>
              </div>

              {/* Logo URL Optional */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Shop Logo Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                {logoUrl && (
                  <div className="flex items-center gap-3 pt-2">
                    <img src={logoUrl} alt="Shop Logo" className="h-12 w-12 object-contain rounded-lg border border-slate-200 p-1 bg-white" />
                    <span className="text-[11px] text-slate-500">Logo preview</span>
                  </div>
                )}
              </div>

              {/* Action Submit */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-bold text-white shadow-md transition hover:bg-indigo-700 active:scale-95 text-xs cursor-pointer"
                id="save-general-profile-btn"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save General Profile & Address</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SECTION 2: Change Password */}
      {activeTab === 'PASSWORD' && (
        <div className="max-w-2xl mx-auto w-full">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  <KeyRound className="h-4.5 w-4.5 text-indigo-500" />
                  <span>Account Security & Change Password</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update login password for store owner / current session user.
                </p>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                <UserCheck className="h-3.5 w-3.5 text-indigo-500" />
                <span>@{currentUser?.username || currentUser?.email || 'owner'}</span>
              </div>
            </div>

            {passwordNotice && (
              <div
                className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                  passwordNotice.isError
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-200 dark:border-rose-900'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900'
                }`}
              >
                {passwordNotice.isError ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
                <span>{passwordNotice.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Current Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current active password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-mono text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    New Password *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-mono text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 text-xs font-mono text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Indicator */}
              <PasswordStrengthIndicator password={newPassword} isDark={false} />

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition active:scale-95 cursor-pointer"
                  id="update-my-password-btn"
                >
                  <Lock className="h-4 w-4" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 3: Delete Account */}
      {activeTab === 'DELETE_ACCOUNT' && (
        <div className="max-w-2xl mx-auto w-full">
          <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-2xs dark:border-rose-900 dark:bg-slate-900 space-y-6">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 pb-4 border-b border-rose-100 dark:border-rose-900/50">
              <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/80">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-rose-900 dark:text-rose-200 text-base">
                  Delete Store Account
                </h3>
                <p className="text-xs text-rose-700/80 dark:text-rose-300/80">
                  Permanently wipe store data from Supabase and terminate account access.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-200 space-y-2">
              <span className="font-bold block text-sm">Warning: This action cannot be reversed!</span>
              <p>
                Deleting your account will immediately remove store profile{' '}
                <strong className="underline">{effectiveShopName}</strong>, erase all product inventory items,
                sales invoices, customer khata registers, supplier payment history, expense logs, and login credentials.
              </p>
              <p className="font-semibold text-rose-700 dark:text-rose-300">
                ⚡ All corresponding records stored in the Supabase cloud database will also be permanently wiped.
              </p>
            </div>

            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                The following store datasets will be completely wiped from Supabase:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pl-4 list-disc">
                <li>All product items, stock inventory, and wholesale prices</li>
                <li>Sales invoices, POS billing logs, and sales return registers</li>
                <li>Customer Khata balances & Supplier credit ledgers</li>
                <li>Shop profile metadata, location address, and staff accounts</li>
                <li>Supabase database user account & synced tables</li>
              </ul>
            </div>

            {/* PASSWORD VERIFICATION FORM */}
            <form onSubmit={handleDeleteAccountClick} className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="space-y-1.5 max-w-md">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <span>Enter Password to Verify Account *</span>
                </label>
                <div className="relative">
                  <input
                    type={showDeletePassword ? 'text' : 'password'}
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      if (deletePasswordError) setDeletePasswordError(null);
                    }}
                    placeholder="Enter your current password"
                    required
                    className="w-full rounded-xl border border-rose-200 bg-rose-50/50 px-3.5 py-2.5 pr-10 text-xs font-medium text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-slate-100 dark:focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  You must verify your password before deleting the account and erasing all Supabase data.
                </p>
              </div>

              {deletePasswordError && (
                <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 dark:bg-rose-950/80 dark:border-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>{deletePasswordError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-4">
                <span className="text-xs text-slate-500">
                  Store Code: <code className="font-mono font-bold text-slate-700 dark:text-slate-300">{effectiveShopCode}</code>
                </span>

                <button
                  type="submit"
                  disabled={!deletePassword.trim() || isDeletingAccount}
                  className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
                  id="delete-account-btn"
                >
                  {isDeletingAccount ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Verify Password & Delete Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 4: Thermal Printer & Tax Settings */}
      {activeTab === 'PRINTER_TAX' && (
        <form onSubmit={handleSavePrinterTax} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Config */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  <Printer className="h-4.5 w-4.5 text-indigo-500" />
                  <span>Thermal Printer & Tax Settings</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">Receipt Formatting</span>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Paper Width */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Receipt className="h-4 w-4 text-indigo-500" />
                    <span>Thermal Printer / Receipt Width *</span>
                  </label>
                  <select
                    value={thermalPrinterType}
                    onChange={(e) => setThermalPrinterType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="58mm">58mm Thermal Printer (Mini Bluetooth / POS Roll)</option>
                    <option value="80mm">80mm Thermal Printer (Standard High-Speed POS Roll)</option>
                    <option value="Standard_A4">Standard Desktop Printer (A4 / A5 Full Sheet Invoice)</option>
                  </select>
                </div>

                {/* PAN / VAT */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Hash className="h-4 w-4 text-indigo-500" />
                    <span>PAN / VAT Registration Number</span>
                  </label>
                  <input
                    type="text"
                    value={panVatNo}
                    onChange={(e) => setPanVatNo(e.target.value)}
                    placeholder="e.g. 609821345"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Currency Symbol */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Currency Symbol / Code
                  </label>
                  <input
                    type="text"
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    placeholder="NPR"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* VAT Toggle & Rate */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 sm:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                        Enable Nepal 13% VAT Calculation
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Automatically calculates VAT component during POS billing and invoicing.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableVat}
                      onChange={(e) => setEnableVat(e.target.checked)}
                      className="h-5 w-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>

                  {enableVat && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                        VAT Tax Rate (%):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={vatRate}
                        onChange={(e) => setVatRate(Number(e.target.value))}
                        className="w-24 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none"
                      />
                      <span className="text-xs text-slate-500 font-bold">%</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
                  id="save-printer-tax-btn"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Save Printer & Tax Settings</span>
                </button>
              </div>
            </div>

            {/* Thermal Receipt Preview Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Thermal Receipt Header Preview
              </span>

              <div className="mx-auto w-full max-w-[240px] bg-amber-50/70 text-slate-900 p-4 rounded-xl border border-amber-200/80 font-mono text-[11px] shadow-2xs space-y-2 text-center">
                <p className="font-bold text-xs uppercase">{shopName || 'MY DUKAAN STORE'}</p>
                <p className="text-[10px] text-slate-600">{currentFullAddress}</p>
                <p className="text-[10px] font-bold">Tel: {phone || '9800000000'}</p>
                {panVatNo && <p className="text-[10px] text-slate-700">PAN/VAT: {panVatNo}</p>}
                <div className="border-b border-dashed border-slate-400 my-1" />
                <p className="text-[10px] text-slate-500">
                  Paper Mode: <span className="font-bold">{thermalPrinterType}</span>
                </p>
                <p className="text-[10px] text-slate-500">
                  VAT Mode: <span className="font-bold">{enableVat ? `${vatRate}% Enabled` : 'Disabled'}</span>
                </p>
                <div className="border-b border-dashed border-slate-400 my-1" />
                <p className="text-[9px] text-slate-400 italic">Thank you for visiting!</p>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

