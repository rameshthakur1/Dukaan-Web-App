import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';

// Feature Views
import { DashboardView } from './components/analytics/DashboardView';
import { POSBillingStation } from './components/pos/POSBillingStation';
import { PurchaseManagement } from './components/purchase/PurchaseManagement';
import { KhataLedger } from './components/khata/KhataLedger';
import { ProductCatalog } from './components/directory/ProductCatalog';
import { CustomerDirectory } from './components/directory/CustomerDirectory';
import { SupplierDirectory } from './components/directory/SupplierDirectory';
import { StaffManagement } from './components/staff/StaffManagement';
import { AuditLogView } from './components/audit/AuditLogView';
import { ReportsView } from './components/analytics/ReportsView';
import { ShopProfileView } from './components/profile/ShopProfileView';
import { TransactionHistory } from './components/history/TransactionHistory';
import { ReferAndSuggestView } from './components/more/ReferAndSuggestView';
import { CloudBackupModal } from './components/more/CloudBackupModal';
import { ShopExpensesManagement } from './components/analytics/ShopExpensesManagement';
import { LoginPage } from './components/auth/LoginPage';
import { AdminPanel } from './components/admin/AdminPanel';
import { AppLoadingProgress } from './components/common/AppLoadingProgress';
import { DeletingAccountOverlay } from './components/common/DeletingAccountOverlay';
import { Clock, AlertTriangle, ShieldCheck, Phone, Mail, LogOut, Zap } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeTab,
    isAuthenticated,
    currentUser,
    shopProfile,
    isAccountTrialExpired,
    getDaysRemainingInTrial,
    logout,
    setActiveTab,
    adminViewMode,
    isSessionLoading,
    setIsSessionLoading,
    isGlobalDeletingAccount,
    globalDeletingDetails,
  } = useApp();

  // If currently deleting account, show circular deleting overlay immediately
  if (isGlobalDeletingAccount) {
    return (
      <DeletingAccountOverlay
        shopName={globalDeletingDetails?.shopName || currentUser?.shopName || shopProfile?.shopName || 'Store Account'}
        shopCode={globalDeletingDetails?.shopCode || currentUser?.shopCode || shopProfile?.shopCode}
      />
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // After login until data load, show sliding bar animation from 1 to 100
  if (isSessionLoading) {
    return (
      <AppLoadingProgress
        shopName={currentUser?.shopName || shopProfile?.shopName || 'My Store'}
        shopCode={currentUser?.shopCode || shopProfile?.shopCode || 'SHOP-01'}
        userName={currentUser?.name}
        onComplete={() => setIsSessionLoading(false)}
      />
    );
  }

  // Check if trial/subscription is expired
  const isExpired = isAccountTrialExpired(currentUser);
  if (isExpired && currentUser?.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen w-screen bg-[#080d1a] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 text-center shadow-2xl relative z-10">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">7-Day Free Trial Expired</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your 7-day free trial period for <strong className="text-white">{currentUser?.shopName || 'your store'}</strong> ({currentUser?.shopCode}) has ended on <span className="text-red-400 font-mono font-bold">{currentUser?.trialExpiryDate}</span>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-left space-y-2 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Account User:</span>
              <span className="text-white">@{currentUser?.username}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Selected Plan:</span>
              <span className="text-amber-400 font-bold">{currentUser?.subscriptionPlan || '7_DAY_TRIAL'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Account Status:</span>
              <span className="text-red-400 font-bold">EXPIRED / APPROVAL REQUIRED</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800/80 text-xs text-blue-200 flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0" />
              <span>Contact Dukaan Admin to approve or renew your store.</span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition active:scale-95"
              id="trial-expired-logout-btn"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out & Switch Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const remainingDays = getDaysRemainingInTrial(currentUser);
  const showTrialBanner = currentUser?.role !== 'SUPER_ADMIN' && currentUser?.status === 'TRIAL_ACTIVE';

  const renderActiveView = () => {
    if (currentUser?.role === 'SUPER_ADMIN' && adminViewMode === 'ADMIN_ONLY' && activeTab !== 'suggestions') {
      return <AdminPanel />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'pos':
        return <POSBillingStation />;
      case 'purchases':
        return <PurchaseManagement />;
      case 'expenses':
        return <ShopExpensesManagement />;
      case 'khata':
        return <KhataLedger />;
      case 'products':
        return <ProductCatalog />;
      case 'customers':
        return <CustomerDirectory />;
      case 'suppliers':
        return <SupplierDirectory />;
      case 'staff':
        return <StaffManagement />;
      case 'audit_logs':
      case 'history':
        return <TransactionHistory />;
      case 'reports':
        return <ReportsView />;
      case 'profile':
        return <ShopProfileView />;
      case 'referrals':
      case 'suggestions':
        return <ReferAndSuggestView />;
      case 'backup':
        return <CloudBackupModal />;
      case 'admin_panel':
        return <AdminPanel />;
      default:
        return <POSBillingStation />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] dark:bg-slate-950 font-sans text-[#0F172A] dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
      {/* Fixed Widescreen Desktop Sidebar (Hidden on mobile) */}
      <Sidebar />

      {/* Main Content Body */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Top Trial Remaining Alert Banner for Trial Users */}
        {showTrialBanner && (
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white px-4 py-2 border-b border-blue-800 flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-300 fill-current animate-pulse" />
              <span>
                <strong>7-Day Free Trial Active:</strong> You have <strong className="text-amber-300 font-mono text-sm px-1.5 py-0.5 rounded bg-blue-950 border border-blue-700">{remainingDays} Days</strong> left in your trial for <em>{currentUser?.shopName}</em>.
              </span>
            </div>
            <span className="hidden sm:inline-block text-[11px] text-blue-300 bg-blue-950/80 px-2.5 py-1 rounded-full border border-blue-800">
              Registration sent for Admin Approval
            </span>
          </div>
        )}

        {/* Scrollable Active View Area */}
        <main
          className={`flex-1 ${
            activeTab === 'pos'
              ? 'flex flex-col min-h-0 overflow-hidden p-2 sm:p-3 lg:p-6 pb-16 lg:pb-0'
              : 'overflow-y-auto p-4 sm:p-6 pb-20 lg:pb-6'
          }`}
        >
          {renderActiveView()}
        </main>

        {/* Mobile Bottom Navigation & Drawer */}
        <MobileNav />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
