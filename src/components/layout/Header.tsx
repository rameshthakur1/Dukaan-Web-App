import React from 'react';
import { useApp } from '../../context/AppContext';
import { isAnnouncementTargetedToUser } from '../../utils/announcementUtils';
import {
  Plus,
  Menu,
  LogOut,
  User,
  ShieldCheck,
  Store,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    isSidebarHidden,
    toggleSidebar,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    activeTab,
    setActiveTab,
    shopProfile,
    products,
    logout,
    currentUser,
    adminViewMode,
    setAdminViewMode,
    impersonatedUser,
    stopImpersonatingStore,
    systemAnnouncements,
  } = useApp();

  const lowStockCount = products.filter((p) => p.stockQty <= p.minStockAlert).length;
  const effectiveUser = impersonatedUser || currentUser;
  const activeAnnouncements = systemAnnouncements.filter(
    (a) => a.active && isAnnouncementTargetedToUser(a, effectiveUser)
  );

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Business Overview & Dashboard';
      case 'pos':
        return 'Billing Station';
      case 'products':
        return 'Product Catalog & Stock';
      case 'purchases':
        return 'Purchase & Supplier Logging';
      case 'expenses':
        return 'Shop Expenses & Overheads';
      case 'khata':
        return 'Khata & Udharo Credit Ledger';
      case 'customers':
        return 'Customer Directory';
      case 'suppliers':
        return 'Supplier Directory';
      case 'staff':
        return 'Staff & Basic Salary Management';
      case 'history':
        return 'History & Activity Log';
      case 'reports':
        return 'Financial Reports & Analytics';
      case 'profile':
        return 'Shop Profile & Nepal Location';
      case 'referrals':
        return 'Refer & Earn Rewards';
      case 'suggestions':
        return 'Support & Help Desk';
      case 'backup':
        return 'Cloud Backup & Sync Center';
      case 'admin_panel':
        return 'Super Admin Control Panel';
      default:
        return 'Dukaan POS';
    }
  };

  return (
    <div className="sticky top-0 z-30 flex flex-col w-full">
      {/* Impersonation ("View As Store") Active Banner */}
      {(impersonatedUser || (currentUser?.role === 'SUPER_ADMIN' && adminViewMode === 'DEMO_STORE')) && (
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
            <ShieldCheck className="h-4 w-4 text-purple-200" />
            <span>
              <strong>SHOP IMPERSONATION MODE:</strong> Viewing Store:{' '}
              <u className="font-extrabold">{impersonatedUser?.shopName || shopProfile.shopName}</u>{' '}
              ({impersonatedUser?.name || shopProfile.ownerName} • Ph: {impersonatedUser?.phone || shopProfile.phone})
            </span>
          </div>

          <button
            type="button"
            onClick={stopImpersonatingStore}
            className="px-3 py-1 bg-white text-purple-900 rounded-lg text-xs font-extrabold shadow-xs hover:bg-purple-100 transition active:scale-95 flex items-center gap-1"
            id="exit-impersonation-btn"
          >
            <span>Exit Store View & Return to Admin Panel</span>
          </button>
        </div>
      )}

      {/* System Announcement Banner if active */}
      {activeAnnouncements.length > 0 && currentUser?.role !== 'SUPER_ADMIN' && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-extrabold flex items-center justify-between border-b border-amber-600">
          <div className="flex items-center gap-2 truncate">
            <span>{activeAnnouncements[0].title}:</span>
            <span className="font-medium truncate">{activeAnnouncements[0].content}</span>
          </div>
          <span className="text-[10px] bg-slate-950 text-white px-2 py-0.5 rounded-md font-mono shrink-0">
            Platform Update
          </span>
        </div>
      )}

      <header className="flex h-14 sm:h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-3 sm:px-6 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-900/95">
      {/* Left side: Sidebar Toggle & Page Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* 3-Dash Menu Toggle Button */}
        <button
          type="button"
          onClick={() => {
            if (window.innerWidth < 1024) {
              setIsMobileDrawerOpen(true);
            } else {
              toggleSidebar();
            }
          }}
          className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 active:scale-95"
          title="Toggle Navigation Menu"
          id="toggle-sidebar-menu-btn"
        >
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 sm:text-base truncate">
              {getTabTitle()}
            </h1>
            <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 md:inline-flex shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Store
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            <span className="truncate max-w-[120px] sm:max-w-none font-medium text-slate-700 dark:text-slate-300">
              {shopProfile.shopName}
            </span>
            <span>•</span>
            <span className="font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded text-[10px]">
              {shopProfile.shopCode}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Quick Actions, Backup Status & Theme Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick POS Button (Hidden in ADMIN_ONLY mode for Super Admin) */}
        {activeTab !== 'pos' && (currentUser?.role !== 'SUPER_ADMIN' || adminViewMode === 'DEMO_STORE') && (
          <button
            onClick={() => setActiveTab('pos')}
            className="hidden items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 active:bg-blue-800 sm:flex"
            id="quick-pos-btn"
          >
            <Plus className="h-4 w-4" />
            <span>New Sale (POS)</span>
          </button>
        )}

        {/* Low stock alert quick link */}
        {lowStockCount > 0 && activeTab !== 'products' && (
          <button
            onClick={() => setActiveTab('products')}
            className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200 transition hover:bg-amber-100 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300"
            title={`${lowStockCount} products are low in stock`}
            id="low-stock-alert-header"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>{lowStockCount} Low Stock</span>
          </button>
        )}

        {/* User Pill & Logout Button */}
        <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200 dark:border-slate-800">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="font-mono text-[11px]">{currentUser?.username || 'admin'}</span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/60 dark:hover:bg-red-900/80 dark:border-red-900/60 dark:text-red-300 transition active:scale-95"
            title="Log out of Dukaan account"
            id="header-logout-btn"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  </div>
);
};
