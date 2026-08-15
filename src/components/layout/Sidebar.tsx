import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  BookOpen,
  Users,
  Building2,
  FileText,
  BarChart3,
  Store,
  Cloud,
  Gift,
  MessageSquare,
  Headphones,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  UserCheck,
  LogOut,
  Receipt,
  CreditCard,
} from 'lucide-react';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
  badge?: number;
  highlight?: boolean;
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    activeAdminSubTab,
    setActiveAdminSubTab,
    products,
    shopProfile,
    customers,
    isSidebarHidden,
    toggleSidebar,
    logout,
    currentUser,
    registeredUsers,
    supportMessages,
    getDaysRemainingInTrial,
    adminViewMode,
    setAdminViewMode,
    staffList,
  } = useApp();

  const lowStockCount = products.filter((p) => p.stockQty <= p.minStockAlert).length;
  const totalCustomerUdharoCount = customers.filter((c) => c.currentBalance > 0).length;
  const pendingApprovalsCount = registeredUsers.filter((u) => u.status === 'PENDING_APPROVAL').length;
  const newSupportMessagesCount = supportMessages.filter((m) => m.status === 'NEW').length;
  const pendingStaffRequestsCount = staffList.filter((s) => s.accountRequestStatus === 'PENDING').length + registeredUsers.filter((u) => u.staffUserIdAccessStatus === 'PENDING').length;

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const currentShopName = currentUser?.shopName || (shopProfile.shopName && shopProfile.shopName !== 'My Store' && shopProfile.shopName !== 'Dukaan.io Corporate HQ' ? shopProfile.shopName : (isSuperAdmin ? 'Dukaan.io Corporate HQ' : 'My Store'));
  const currentShopCode = currentUser?.shopCode || (shopProfile.shopCode && shopProfile.shopCode !== 'SHOP-0001' && shopProfile.shopCode !== 'DUKAAN-8821' ? shopProfile.shopCode : (isSuperAdmin ? 'DUKAAN-8821' : 'SHOP-01'));
  const currentOwnerName = currentUser?.name || shopProfile.ownerName || 'Store Owner';

  const storeNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Billing', icon: ShoppingCart, highlight: true },
    { id: 'products', label: 'Product Catalog', icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: 'purchases', label: 'Purchase Entry', icon: Truck },
    { id: 'expenses', label: 'Shop Expenses', icon: Receipt },
    { id: 'khata', label: 'Udharo Khata', icon: BookOpen, badge: totalCustomerUdharoCount > 0 ? totalCustomerUdharoCount : undefined },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'suppliers', label: 'Suppliers', icon: Building2 },
    { id: 'staff', label: 'Staff & Basic Salary', icon: UserCheck },
    { id: 'history', label: 'History & Audit Trail', icon: FileText },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  ];

  const adminNavItem: NavItem = {
    id: 'admin_panel',
    label: 'Admin & Approvals',
    icon: ShieldCheck,
    badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
  };

  let mainNavItems: NavItem[] = [];
  if (isSuperAdmin) {
    if (adminViewMode === 'ADMIN_ONLY') {
      mainNavItems = [adminNavItem];
    } else {
      mainNavItems = storeNavItems;
    }
  } else {
    mainNavItems = storeNavItems;
  }

  const secondaryNavItems: NavItem[] =
    isSuperAdmin && adminViewMode === 'ADMIN_ONLY'
      ? []
      : [
          { id: 'profile', label: 'Shop & Location Profile', icon: Store },
          { id: 'referrals', label: 'Refer & Earn', icon: Gift },
          { id: 'suggestions', label: 'Support & Help Desk', icon: Headphones },
        ];

  if (isSidebarHidden) {
    return null;
  }

  return (
    <aside className="hidden h-screen w-60 flex-col bg-[#0F172A] text-slate-300 lg:flex shrink-0 border-r border-slate-800 transition-all duration-300">
      {/* Brand & Store Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-lg shadow-xs">
            D
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-white">Dukaan</span>
            </div>
            <p className="text-[10px] text-blue-400 uppercase tracking-wider font-bold truncate max-w-[120px]" title={currentShopName}>
              {currentShopName}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          title="Hide Sidebar"
          id="sidebar-hide-btn"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Super Admin View Mode Toggle (ADMIN ONLY vs DEMO STORE) */}
      {isSuperAdmin && (
        <div className="mx-3 my-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 shadow-inner">
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

          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setAdminViewMode('ADMIN_ONLY')}
              className={`py-1.5 text-[10px] font-bold rounded-md transition flex items-center justify-center gap-1 ${
                adminViewMode === 'ADMIN_ONLY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              id="sidebar-mode-admin-only-btn"
            >
              <ShieldCheck className="h-3 w-3" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminViewMode('DEMO_STORE')}
              className={`py-1.5 text-[10px] font-bold rounded-md transition flex items-center justify-center gap-1 ${
                adminViewMode === 'DEMO_STORE'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              id="sidebar-mode-demo-store-btn"
            >
              <Store className="h-3 w-3" />
              <span>Demo</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="px-4 mb-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          Main Menu
        </div>
        <nav className="space-y-0.5 px-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isAdminPanel = item.id === 'admin_panel';

            const adminSubItems = [
              { id: 'STORES' as const, label: 'Stores Registry', icon: Store, badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined },
              { id: 'ANALYTICS' as const, label: 'Platform Analytics', icon: BarChart3 },
              { id: 'COMMUNICATION' as const, label: 'Support & Broadcasts', icon: Headphones, badge: newSupportMessagesCount > 0 ? newSupportMessagesCount : undefined },
              { id: 'PRICING' as const, label: 'Subscription Pricing', icon: CreditCard },
              { id: 'STAFF_IDS' as const, label: 'Staff IDs Requests', icon: Users, badge: pendingStaffRequestsCount > 0 ? pendingStaffRequestsCount : undefined },
              { id: 'LANDING_CONTENT' as const, label: 'About Us & Mission', icon: BookOpen },
            ];

            return (
              <React.Fragment key={item.id}>
                <button
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`group flex w-full items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-all ${
                    isActive
                      ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-400 rounded-r-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                  id={`nav-${item.id}-btn`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>

                {isAdminPanel && (
                  <div className="ml-5 pl-2.5 my-1 space-y-1 border-l-2 border-slate-800/80">
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
                          }}
                          className={`group flex w-full items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold rounded-md transition-all ${
                            isSubActive
                              ? 'bg-blue-600/20 text-blue-300 font-extrabold border-l-2 border-blue-400'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                          }`}
                          id={`nav-admin-sub-${sub.id.toLowerCase()}-btn`}
                        >
                          <div className="flex items-center gap-2">
                            <SubIcon className={`h-3.5 w-3.5 shrink-0 ${isSubActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                            <span>{sub.label}</span>
                          </div>
                          {sub.badge !== undefined && (
                            <span className="rounded-full px-1.5 py-0.2 text-[9px] font-extrabold bg-amber-400 text-slate-950">
                              {sub.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        <div className="mt-6 px-4 mb-2 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          Store Config
        </div>
        <nav className="space-y-0.5 px-2">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group flex w-full items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition-all ${
                  isActive
                    ? 'bg-blue-600/10 border-l-4 border-blue-500 text-blue-400 rounded-r-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                id={`nav-sec-${item.id}-btn`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 text-slate-500" />
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile & Shop Code & Logout */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800 space-y-2">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800/80 shadow-xs">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 font-extrabold border border-blue-500/30 text-xs">
            {(currentShopName || 'ST').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-xs font-bold text-slate-100" title={currentShopName}>
              {currentShopName}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] text-slate-400 font-medium">Code:</span>
              <span className="truncate text-[10px] text-blue-400 font-mono font-bold">
                {currentShopCode}
              </span>
            </div>
          </div>
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" title="Secure Authenticated Session" />
        </div>

        <button
          type="button"
          onClick={logout}
          className="w-full py-1.5 px-3 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-900/60 text-red-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-98"
          id="sidebar-logout-btn"
        >
          <LogOut className="h-3.5 w-3.5 text-red-400" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
