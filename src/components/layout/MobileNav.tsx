import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import {
  ShoppingCart,
  Package,
  BookOpen,
  BarChart3,
  Menu,
  X,
  LayoutDashboard,
  Truck,
  Users,
  Building2,
  FileText,
  UserCheck,
  Store,
  Cloud,
  Gift,
  MessageSquare,
  Headphones,
  Sun,
  Moon,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Receipt,
  CreditCard,
  Smartphone,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    activeAdminSubTab,
    setActiveAdminSubTab,
    darkMode,
    toggleDarkMode,
    shopProfile,
    products,
    logout,
    currentUser,
    adminViewMode,
    setAdminViewMode,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
  } = useApp();

  const lowStockCount = products.filter((p) => p.stockQty <= p.minStockAlert).length;
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const handleTabSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileDrawerOpen(false);
  };

  const storeOperations = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'pos', label: 'Billing Station', icon: ShoppingCart },
    { id: 'products', label: 'Product Inventory', icon: Package },
    { id: 'purchases', label: 'Stock Purchase Entry', icon: Truck },
    { id: 'expenses', label: 'Shop Expenses', icon: Receipt },
    { id: 'khata', label: 'Udharo Khata Ledger', icon: BookOpen },
    { id: 'customers', label: 'Customer Directory', icon: Users },
    { id: 'suppliers', label: 'Supplier Directory', icon: Building2 },
    { id: 'staff', label: 'Staff & Basic Salary', icon: UserCheck },
    { id: 'history', label: 'History & Audit Trail', icon: FileText },
    { id: 'reports', label: 'Financial Analytics', icon: BarChart3 },
  ];

  const adminOperation = { id: 'admin_panel', label: 'Admin & Approvals', icon: ShieldCheck };

  const drawerOperations = isSuperAdmin
    ? adminViewMode === 'ADMIN_ONLY'
      ? [adminOperation]
      : storeOperations
    : storeOperations;

  const drawerSettings =
    isSuperAdmin && adminViewMode === 'ADMIN_ONLY'
      ? []
      : [
          { id: 'profile', label: 'Shop Profile & Address', icon: Store },
          { id: 'referrals', label: 'Refer a Friend', icon: Gift },
          { id: 'suggestions', label: 'Support & Help Desk', icon: Headphones },
        ];

  return (
    <>
      {/* Smartphone Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-15 w-full items-center justify-around border-t border-slate-200 bg-white/95 px-1.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden shadow-lg pb-safe">
        <button
          onClick={() => handleTabSelect('pos')}
          className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-2.5 py-1 text-[10px] font-bold transition active:scale-95 ${
            activeTab === 'pos'
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
          id="mobile-pos-tab"
        >
          <div className="relative">
            <ShoppingCart className="h-4.5 w-4.5" />
          </div>
          <span>Billing</span>
        </button>

        <button
          onClick={() => handleTabSelect('products')}
          className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-2.5 py-1 text-[10px] font-bold transition active:scale-95 ${
            activeTab === 'products'
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
          id="mobile-products-tab"
        >
          <div className="relative">
            <Package className="h-4.5 w-4.5" />
            {lowStockCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            )}
          </div>
          <span>Stock</span>
        </button>

        <button
          onClick={() => handleTabSelect('khata')}
          className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-2.5 py-1 text-[10px] font-bold transition active:scale-95 ${
            activeTab === 'khata'
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
          id="mobile-khata-tab"
        >
          <BookOpen className="h-4.5 w-4.5" />
          <span>Khata</span>
        </button>

        <button
          onClick={() => handleTabSelect('reports')}
          className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-2.5 py-1 text-[10px] font-bold transition active:scale-95 ${
            activeTab === 'reports'
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
          id="mobile-reports-tab"
        >
          <BarChart3 className="h-4.5 w-4.5" />
          <span>Reports</span>
        </button>

        <button
          onClick={() => handleTabSelect('purchases')}
          className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-2.5 py-1 text-[10px] font-bold transition active:scale-95 ${
            activeTab === 'purchases'
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
          id="mobile-purchases-tab"
        >
          <Truck className="h-4.5 w-4.5" />
          <span>Purchase</span>
        </button>
      </nav>

      {/* Drawer Backdrop Overlay */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* Slide-out Mobile Drawer */}
      <div
        className={`fixed bottom-0 top-0 left-0 z-50 flex w-72 flex-col bg-slate-900 text-slate-200 shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-xs shadow-xs">
              D
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-xs tracking-wide">Dukaan POS</span>
              <span className="text-[10px] text-slate-400 truncate max-w-[140px]">{shopProfile.shopName}</span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* Admin Mode Switcher Widget for Mobile Drawer */}
          {isSuperAdmin && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Admin View Mode</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${
                    adminViewMode === 'ADMIN_ONLY'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {adminViewMode === 'ADMIN_ONLY' ? 'Admin Only' : 'Demo Store'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setAdminViewMode('ADMIN_ONLY')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
                    adminViewMode === 'ADMIN_ONLY'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                  id="mobile-drawer-admin-only-btn"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminViewMode('DEMO_STORE')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1 ${
                    adminViewMode === 'DEMO_STORE'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                  id="mobile-drawer-demo-store-btn"
                >
                  <Store className="h-3.5 w-3.5" />
                  <span>Demo</span>
                </button>
              </div>
            </div>
          )}

          <div>
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Operations
            </div>
            <div className="space-y-1">
              {drawerOperations.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isAdminPanel = item.id === 'admin_panel';

                const adminSubItems = [
                  { id: 'STORES' as const, label: 'Stores Registry', icon: Store },
                  { id: 'ANALYTICS' as const, label: 'Platform Analytics', icon: BarChart3 },
                  { id: 'COMMUNICATION' as const, label: 'Support & Broadcasts', icon: Headphones },
                  { id: 'PRICING' as const, label: 'Subscription Pricing', icon: CreditCard },
                  { id: 'STAFF_IDS' as const, label: 'Staff IDs Requests', icon: Users },
                ];

                return (
                  <React.Fragment key={item.id}>
                    <button
                      onClick={() => handleTabSelect(item.id as ActiveTab)}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold ${
                        isActive ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-400' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    </button>

                    {isAdminPanel && (
                      <div className="ml-5 pl-2.5 space-y-1 border-l-2 border-slate-800 my-1">
                        {adminSubItems.map((sub) => {
                          const SubIcon = sub.icon;
                          const isSubActive = activeTab === 'admin_panel' && activeAdminSubTab === sub.id;
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                setActiveTab('admin_panel');
                                setActiveAdminSubTab(sub.id);
                                setIsMobileDrawerOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${
                                isSubActive
                                  ? 'bg-blue-600/20 text-blue-300 font-bold border-l-2 border-blue-400'
                                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <SubIcon className="h-3.5 w-3.5" />
                                <span>{sub.label}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Settings & Extras
            </div>
            <div className="space-y-1">
              {drawerSettings.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabSelect(item.id as ActiveTab)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold ${
                      isActive ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-400' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="h-3 w-3 opacity-60" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drawer footer */}
        <div className="border-t border-slate-800 p-3 space-y-2">
          {currentUser && (
            <div className="px-2 py-1.5 flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200 truncate">{currentUser.name}</span>
              <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-blue-400">
                {currentUser.username}
              </span>
            </div>
          )}

          <button
            onClick={toggleDarkMode}
            className="flex w-full items-center justify-between rounded-lg bg-slate-800 p-2.5 text-xs font-medium text-slate-300"
          >
            <span>Appearance Theme</span>
            <div className="flex items-center gap-1.5 font-semibold text-amber-400">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4 text-slate-300" />}
              <span>{darkMode ? 'Dark' : 'Light'}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMobileDrawerOpen(false);
              logout();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800/80 p-2.5 text-xs font-bold text-red-200 transition active:scale-98"
            id="3-dash-drawer-logout-btn"
          >
            <LogOut className="h-4 w-4 text-red-400" />
            <span>Log Out of Demo Account</span>
          </button>
        </div>
      </div>
    </>
  );
};
