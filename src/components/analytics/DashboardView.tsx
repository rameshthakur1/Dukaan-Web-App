import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Wallet,
  QrCode,
  CreditCard,
  Plus,
  Truck,
  BookOpen,
  Cloud,
  Package,
  Bell,
  Clock,
  AlertCircle,
  Share2,
  Calendar,
  CheckCircle2,
  X,
  ExternalLink,
  Sparkles,
  Percent,
  Receipt,
  TrendingDown,
  Printer,
  Trophy,
  Flame,
  ArrowDownRight,
  Tag,
  BarChart2,
  Box,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Invoice, Product, Expense, StockPurchase } from '../../types';
import { ShopExpensesModal } from './ShopExpensesModal';
import { ReportPdfModal } from './ReportPdfModal';

export const DashboardView: React.FC = () => {
  const { invoices, products, customers, suppliers, expenses, purchases, setActiveTab, triggerCloudBackup, shopProfile, currentUser, activeShopCode, activeShopName } = useApp();

  // Shop Expenses modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPdfExportModalOpen, setIsPdfExportModalOpen] = useState(false);

  // Notification Popup Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'DUE_DATES' | 'LOW_STOCK'>('DUE_DATES');

  // Shared Date Filter State (All Time, Daily, Weekly, Monthly, 3 Month, 6 Month, Yearly, Custom Date)
  type DateFilterOption = 'ALL' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | '3_MONTH' | '6_MONTH' | 'YEARLY' | 'CUSTOM';
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('WEEKLY');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Filter label map
  const filterLabelMap: Record<DateFilterOption, string> = {
    ALL: 'All Time',
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    '3_MONTH': '3 Month',
    '6_MONTH': '6 Month',
    YEARLY: 'Yearly',
    CUSTOM: 'Custom Date',
  };

  // Helper to filter invoices by date for KPI metrics
  const getKpiFilteredInvoices = (): Invoice[] => {
    if (dateFilter === 'ALL') return invoices;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return invoices.filter((inv) => {
      if (!inv.createdAt) return true;
      const invDate = new Date(inv.createdAt);
      const invDateStr = inv.createdAt.split('T')[0];

      switch (dateFilter) {
        case 'DAILY':
          return invDateStr === todayStr || (now.getTime() - invDate.getTime()) <= 86400000;
        case 'WEEKLY':
          return (now.getTime() - invDate.getTime()) <= 7 * 86400000;
        case 'MONTHLY':
          return (now.getTime() - invDate.getTime()) <= 30 * 86400000;
        case '3_MONTH':
          return (now.getTime() - invDate.getTime()) <= 90 * 86400000;
        case '6_MONTH':
          return (now.getTime() - invDate.getTime()) <= 180 * 86400000;
        case 'YEARLY':
          return (now.getTime() - invDate.getTime()) <= 365 * 86400000;
        case 'CUSTOM': {
          let valid = true;
          if (customStartDate) {
            valid = valid && invDateStr >= customStartDate;
          }
          if (customEndDate) {
            valid = valid && invDateStr <= customEndDate;
          }
          return valid;
        }
        default:
          return true;
      }
    });
  };

  // Helper to filter expenses by date for KPI metrics
  const getKpiFilteredExpenses = (): Expense[] => {
    if (dateFilter === 'ALL') return expenses;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return expenses.filter((exp) => {
      if (!exp.expenseDate) return true;
      const expDate = new Date(exp.expenseDate);
      const expDateStr = exp.expenseDate.split('T')[0];

      switch (dateFilter) {
        case 'DAILY':
          return expDateStr === todayStr || (now.getTime() - expDate.getTime()) <= 86400000;
        case 'WEEKLY':
          return (now.getTime() - expDate.getTime()) <= 7 * 86400000;
        case 'MONTHLY':
          return (now.getTime() - expDate.getTime()) <= 30 * 86400000;
        case '3_MONTH':
          return (now.getTime() - expDate.getTime()) <= 90 * 86400000;
        case '6_MONTH':
          return (now.getTime() - expDate.getTime()) <= 180 * 86400000;
        case 'YEARLY':
          return (now.getTime() - expDate.getTime()) <= 365 * 86400000;
        case 'CUSTOM': {
          let valid = true;
          if (customStartDate) {
            valid = valid && expDateStr >= customStartDate;
          }
          if (customEndDate) {
            valid = valid && expDateStr <= customEndDate;
          }
          return valid;
        }
        default:
          return true;
      }
    });
  };

  // Helper to calculate profit for a single invoice (Selling Price - Buying/Cost Price)
  const calculateInvoiceProfit = (inv: Invoice, productsList: Product[]): number => {
    const totalCost = inv.items.reduce((costSum, item) => {
      const prod = productsList.find((p) => p.id === item.productId || p.sku === item.sku);
      if (!prod) {
        return costSum + item.quantity * (item.unitPrice * 0.7);
      }
      const isSecondary = item.unitName === prod.unit.secondaryUnit;
      const unitCost = isSecondary
        ? (prod.unit.secondaryCostPrice ?? (prod.unit.primaryCostPrice * (prod.unit.conversionRatio || 1)))
        : prod.unit.primaryCostPrice;
      return costSum + item.quantity * unitCost;
    }, 0);

    return inv.netAmount - totalCost;
  };

  // Helper to filter stock purchases by date for KPI metrics
  const getKpiFilteredPurchases = (): StockPurchase[] => {
    if (!purchases || purchases.length === 0) return [];
    if (dateFilter === 'ALL') return purchases;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return purchases.filter((p) => {
      if (!p) return false;
      if (!p.purchaseDate) return true;
      const pDate = new Date(p.purchaseDate);
      if (isNaN(pDate.getTime())) return true;
      const pDateStr = p.purchaseDate.split('T')[0];
      const diffMs = now.getTime() - pDate.getTime();

      switch (dateFilter) {
        case 'DAILY':
          return pDateStr === todayStr || Math.abs(diffMs) <= 86400000;
        case 'WEEKLY':
          return diffMs <= 7 * 86400000 || pDateStr >= new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
        case 'MONTHLY':
          return diffMs <= 30 * 86400000 || pDateStr >= new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
        case '3_MONTH':
          return diffMs <= 90 * 86400000 || pDateStr >= new Date(now.getTime() - 90 * 86400000).toISOString().split('T')[0];
        case '6_MONTH':
          return diffMs <= 180 * 86400000 || pDateStr >= new Date(now.getTime() - 180 * 86400000).toISOString().split('T')[0];
        case 'YEARLY':
          return diffMs <= 365 * 86400000 || pDateStr >= new Date(now.getTime() - 365 * 86400000).toISOString().split('T')[0];
        case 'CUSTOM': {
          let valid = true;
          if (customStartDate) valid = valid && pDateStr >= customStartDate;
          if (customEndDate) valid = valid && pDateStr <= customEndDate;
          return valid;
        }
        default:
          return true;
      }
    });
  };

  const kpiInvoices = getKpiFilteredInvoices();
  const kpiExpenses = getKpiFilteredExpenses();
  const kpiPurchases = getKpiFilteredPurchases();

  // Metrics calculations based on date filter
  const kpiTotalRevenue = kpiInvoices.reduce((sum, inv) => sum + inv.netAmount, 0);
  const kpiTotalProfit = kpiInvoices.reduce((sum, inv) => sum + calculateInvoiceProfit(inv, products), 0);
  const kpiTotalCash = kpiInvoices.reduce((sum, inv) => sum + (inv.splitPayment?.cash || 0), 0);
  const kpiTotalQr = kpiInvoices.reduce((sum, inv) => sum + (inv.splitPayment?.qr || 0), 0);
  const kpiTotalUdharo = kpiInvoices.reduce((sum, inv) => sum + (inv.splitPayment?.udharo || 0), 0);
  const kpiTotalExpenses = kpiExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const kpiTotalPurchases = kpiPurchases.reduce((sum, p) => {
    const rawTotal =
      Number(p.totalAmount) ||
      Number((p as any).total_amount) ||
      Number((p as any).grand_total) ||
      Number((p as any).amount) ||
      (Array.isArray(p.items)
        ? p.items.reduce((itemSum, it: any) => {
            const qty = Number(it.quantity ?? it.qty ?? 1);
            const cost = Number(it.costPrice ?? it.purchasePrice ?? it.purchase_price ?? it.cost_price ?? it.unitPrice ?? 0);
            const sub = Number(it.totalAmount ?? it.total_amount ?? it.subtotal ?? (qty * cost));
            return itemSum + sub;
          }, 0)
        : 0);
    return sum + (rawTotal || 0);
  }, 0);
  const kpiNetOperatingProfit = kpiTotalProfit - kpiTotalExpenses;

  const profitMarginPercent = kpiTotalRevenue > 0 ? ((kpiTotalProfit / kpiTotalRevenue) * 100).toFixed(1) : '0';

  // Fallback / Total stats
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.netAmount, 0);
  const totalCashCollected = invoices.reduce((sum, inv) => sum + (inv.splitPayment?.cash || 0), 0);
  const totalQrCollected = invoices.reduce((sum, inv) => sum + (inv.splitPayment?.qr || 0), 0);
  const totalUdharoGiven = invoices.reduce((sum, inv) => sum + (inv.splitPayment?.udharo || 0), 0);

  const lowStockProducts = products.filter((p) => p.stockQty <= p.minStockAlert);
  const outOfStockCount = lowStockProducts.filter((p) => p.stockQty === 0).length;
  const totalInventoryValuation = products.reduce((sum, p) => sum + (p.stockQty * (p.unit.primaryCostPrice || 0)), 0);

  const pendingCustomerUdharo = customers.reduce((sum, c) => sum + c.currentBalance, 0);

  // Shop specific performance intelligence calculations
  const currentShopName = activeShopName;
  const currentShopCode = activeShopCode;

  // Calculate top product category for this shop
  const topCategoryData = useMemo(() => {
    const map: Record<string, number> = {};
    kpiInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId || p.sku === item.sku);
        const cat = prod?.category || 'General';
        map[cat] = (map[cat] || 0) + item.totalPrice;
      });
    });
    let topCat = 'General Grocery';
    let maxVal = 0;
    Object.entries(map).forEach(([cat, val]) => {
      if (val > maxVal) {
        maxVal = val;
        topCat = cat;
      }
    });
    return { topCat, maxVal };
  }, [kpiInvoices, products]);

  // Calculate Store Performance Score (0-100) dynamically
  const shopPerformanceScore = useMemo(() => {
    let score = 50;
    if (kpiTotalRevenue > 100000) score += 20;
    else if (kpiTotalRevenue > 25000) score += 15;
    else if (kpiTotalRevenue > 5000) score += 10;
    else if (kpiTotalRevenue > 0) score += 5;

    const marginVal = Number(profitMarginPercent);
    if (marginVal > 25) score += 20;
    else if (marginVal > 15) score += 15;
    else if (marginVal > 5) score += 10;
    else if (marginVal > 0) score += 5;

    if (products.length > 0) {
      const lowPct = lowStockProducts.length / products.length;
      if (lowPct === 0) score += 15;
      else if (lowPct < 0.25) score += 10;
      else if (lowPct < 0.5) score += 5;
    }

    const totalCollected = kpiTotalCash + kpiTotalQr;
    if (kpiTotalRevenue > 0) {
      const colRatio = totalCollected / kpiTotalRevenue;
      if (colRatio >= 0.8) score += 15;
      else if (colRatio >= 0.5) score += 10;
      else score += 5;
    }

    return Math.min(100, Math.max(15, score));
  }, [kpiTotalRevenue, profitMarginPercent, products, lowStockProducts, kpiTotalCash, kpiTotalQr]);

  const performanceTier = useMemo(() => {
    if (shopPerformanceScore >= 85) return { grade: 'A+', title: 'Elite Revenue Leader', badgeColor: 'bg-emerald-600 text-white' };
    if (shopPerformanceScore >= 70) return { grade: 'A', title: 'High Profit Retailer', badgeColor: 'bg-blue-600 text-white' };
    if (shopPerformanceScore >= 55) return { grade: 'B', title: 'Steady Operational Shop', badgeColor: 'bg-indigo-600 text-white' };
    return { grade: 'C', title: 'Emerging Store (Growth Mode)', badgeColor: 'bg-amber-600 text-white' };
  }, [shopPerformanceScore]);

  // Udharo Due Date Notification Calculations
  const todayStr = new Date().toISOString().split('T')[0];

  const overdueCustomers = customers.filter(
    (c) => c.currentBalance > 0 && c.dueDate && c.dueDate < todayStr
  );
  const dueTodayCustomers = customers.filter(
    (c) => c.currentBalance > 0 && c.dueDate && c.dueDate === todayStr
  );

  const overdueSuppliers = suppliers.filter(
    (s) => s.pendingPayable > 0 && s.dueDate && s.dueDate < todayStr
  );
  const dueTodaySuppliers = suppliers.filter(
    (s) => s.pendingPayable > 0 && s.dueDate && s.dueDate === todayStr
  );

  const totalDueAlertsCount =
    overdueCustomers.length + dueTodayCustomers.length + overdueSuppliers.length + dueTodaySuppliers.length;

  const totalNotificationAlerts = totalDueAlertsCount + lowStockProducts.length;

  // Auto-open modal pop up EVERY time user opens/views Dashboard if there are active alerts
  useEffect(() => {
    if (totalNotificationAlerts > 0) {
      setIsModalOpen(true);
      // Auto select tab that has alerts
      if (totalDueAlertsCount > 0) {
        setActiveModalTab('DUE_DATES');
      } else {
        setActiveModalTab('LOW_STOCK');
      }
    }
  }, [totalNotificationAlerts, totalDueAlertsCount]);

  // WhatsApp reminder generator for dashboard
  const sendWhatsAppReminder = (customerName: string, phone: string, balance: number, dueDate?: string) => {
    const text = `Namaste ${customerName} ji,\nThis is a friendly reminder from *${shopProfile.shopName}* (${shopProfile.phone}).\n\nYour pending Khata balance of *NPR ${balance.toLocaleString()}* was due on *${dueDate || 'today'}*.\n\nKindly settle the bill via Cash or eSewa/Khalti when possible.\nThank you!`;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const formattedPhone = cleanPhone.startsWith('977') ? cleanPhone : `977${cleanPhone}`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Compute trend data dynamically based on selected date filter from actual user invoices
  const getSalesTrendData = () => {
    const now = new Date();

    if (dateFilter === 'DAILY') {
      const timeSlots = ['08:00 AM', '10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM', '08:00 PM'];
      const slotBuckets = timeSlots.map((slot) => ({ day: slot, revenue: 0, salesCount: 0 }));

      kpiInvoices.forEach((inv) => {
        if (!inv.createdAt) return;
        const d = new Date(inv.createdAt);
        const hr = d.getHours();
        let idx = 0;
        if (hr < 9) idx = 0;
        else if (hr < 11) idx = 1;
        else if (hr < 13) idx = 2;
        else if (hr < 15) idx = 3;
        else if (hr < 17) idx = 4;
        else if (hr < 19) idx = 5;
        else idx = 6;

        slotBuckets[idx].revenue += inv.netAmount;
        slotBuckets[idx].salesCount += 1;
      });

      return slotBuckets;
    }

    if (dateFilter === 'WEEKLY') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayMap: Record<string, { revenue: number; salesCount: number }> = {
        Mon: { revenue: 0, salesCount: 0 },
        Tue: { revenue: 0, salesCount: 0 },
        Wed: { revenue: 0, salesCount: 0 },
        Thu: { revenue: 0, salesCount: 0 },
        Fri: { revenue: 0, salesCount: 0 },
        Sat: { revenue: 0, salesCount: 0 },
        Sun: { revenue: 0, salesCount: 0 },
      };

      kpiInvoices.forEach((inv) => {
        if (!inv.createdAt) return;
        const d = new Date(inv.createdAt);
        const dayName = days[d.getDay()];
        if (dayMap[dayName]) {
          dayMap[dayName].revenue += inv.netAmount;
          dayMap[dayName].salesCount += 1;
        }
      });

      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
        day,
        revenue: dayMap[day].revenue,
        salesCount: dayMap[day].salesCount,
      }));
    }

    if (dateFilter === 'MONTHLY') {
      const buckets = [
        { day: 'Week 1', revenue: 0, salesCount: 0 },
        { day: 'Week 2', revenue: 0, salesCount: 0 },
        { day: 'Week 3', revenue: 0, salesCount: 0 },
        { day: 'Week 4', revenue: 0, salesCount: 0 },
      ];

      kpiInvoices.forEach((inv) => {
        if (!inv.createdAt) return;
        const d = new Date(inv.createdAt);
        const dayOfMonth = d.getDate();
        const weekIdx = Math.min(Math.floor((dayOfMonth - 1) / 7), 3);
        buckets[weekIdx].revenue += inv.netAmount;
        buckets[weekIdx].salesCount += 1;
      });

      return buckets;
    }

    if (dateFilter === 'YEARLY') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const buckets = monthNames.map((m) => ({ day: m, revenue: 0, salesCount: 0 }));

      kpiInvoices.forEach((inv) => {
        if (!inv.createdAt) return;
        const d = new Date(inv.createdAt);
        const monthIdx = d.getMonth();
        if (buckets[monthIdx]) {
          buckets[monthIdx].revenue += inv.netAmount;
          buckets[monthIdx].salesCount += 1;
        }
      });

      return buckets;
    }

    if (dateFilter === '3_MONTH' || dateFilter === '6_MONTH') {
      const monthCount = dateFilter === '3_MONTH' ? 3 : 6;
      const buckets = Array.from({ length: monthCount }, (_, i) => ({
        day: `Month ${i + 1}`,
        revenue: 0,
        salesCount: 0,
      }));

      kpiInvoices.forEach((inv) => {
        if (!inv.createdAt) return;
        const d = new Date(inv.createdAt);
        const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        const bucketIdx = monthCount - 1 - diffMonths;
        if (bucketIdx >= 0 && bucketIdx < monthCount) {
          buckets[bucketIdx].revenue += inv.netAmount;
          buckets[bucketIdx].salesCount += 1;
        }
      });

      return buckets;
    }

    if (dateFilter === 'CUSTOM') {
      const total = kpiInvoices.reduce((sum, inv) => sum + inv.netAmount, 0);
      return [
        { day: customStartDate || 'Start Date', revenue: Math.round(total * 0.2), salesCount: Math.round(kpiInvoices.length * 0.2) },
        { day: 'Mid Period', revenue: Math.round(total * 0.5), salesCount: Math.round(kpiInvoices.length * 0.5) },
        { day: customEndDate || 'End Date', revenue: total, salesCount: kpiInvoices.length },
      ];
    }

    const total = kpiInvoices.reduce((sum, inv) => sum + inv.netAmount, 0);
    return [
      { day: 'All Time Sales', revenue: total, salesCount: kpiInvoices.length },
    ];
  };

  const salesTrendData = getSalesTrendData();

  // Payment Breakdown Donut Chart Data - Strictly based on user's actual collections
  const paymentBreakdownData = [
    { name: 'Cash', value: kpiTotalCash, color: '#10b981' }, // Emerald
    { name: 'QR (eSewa/Fonepay)', value: kpiTotalQr, color: '#6366f1' }, // Indigo
    { name: 'Udharo Credit', value: kpiTotalUdharo, color: '#f59e0b' }, // Amber
  ];

  // Top 5 & Bottom 5 Product Sales Calculations
  const productPerformanceList = useMemo(() => {
    return products.map((prod) => {
      let unitsSold = 0;
      let totalRevenue = 0;
      let totalCost = 0;

      kpiInvoices.forEach((inv) => {
        inv.items.forEach((item) => {
          if (item.productId === prod.id || item.sku === prod.sku) {
            const isSecondary = item.unitName === prod.unit.secondaryUnit;
            const ratio = isSecondary ? (prod.unit.conversionRatio || 1) : 1;
            const primaryEquivalentQty = item.quantity * ratio;

            unitsSold += primaryEquivalentQty;
            totalRevenue += item.totalPrice;

            const unitCost = isSecondary
              ? (prod.unit.secondaryCostPrice ?? (prod.unit.primaryCostPrice * ratio))
              : prod.unit.primaryCostPrice;

            totalCost += item.quantity * unitCost;
          }
        });
      });

      const totalProfit = totalRevenue - totalCost;
      const profitMarginPct = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      const primaryCost = prod.unit.primaryCostPrice || 0;
      const primarySelling = prod.unit.primarySellingPrice || 0;
      const unitProfit = primarySelling - primaryCost;
      const unitMarginPct = primarySelling > 0 ? (unitProfit / primarySelling) * 100 : 0;

      return {
        product: prod,
        unitsSold,
        totalRevenue,
        totalCost,
        totalProfit,
        profitMarginPct,
        unitProfit,
        unitMarginPct,
      };
    });
  }, [products, kpiInvoices]);

  // Top 5 Selling Products (sorted descending by unitsSold, then totalRevenue)
  const top5Products = useMemo(() => {
    return [...productPerformanceList]
      .sort((a, b) => {
        if (b.unitsSold !== a.unitsSold) return b.unitsSold - a.unitsSold;
        return b.totalRevenue - a.totalRevenue;
      })
      .slice(0, 5);
  }, [productPerformanceList]);

  // Bottom 5 Selling Products (sorted ascending by unitsSold, then totalRevenue)
  const bottom5Products = useMemo(() => {
    return [...productPerformanceList]
      .sort((a, b) => {
        if (a.unitsSold !== b.unitsSold) return a.unitsSold - b.unitsSold;
        return a.totalRevenue - b.totalRevenue;
      })
      .slice(0, 5);
  }, [productPerformanceList]);

  // View state for Product Sales Performance tab
  const [productTab, setProductTab] = useState<'BOTH' | 'TOP' | 'BOTTOM'>('BOTH');

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      {/* Quick Action Station */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center gap-2.5">
          <span className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm shrink-0">
            Quick Billing Actions:
          </span>

          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2 w-full">
            <button
              onClick={() => setActiveTab('pos')}
              className="flex items-center justify-center gap-1 rounded-xl bg-blue-600 px-1.5 py-2 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 active:bg-blue-800 text-center"
              id="dash-quick-pos-btn"
            >
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">New Billing Sale</span>
            </button>

            <button
              onClick={() => setActiveTab('purchases')}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-1.5 py-2 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 text-center"
            >
              <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
              <span className="truncate">Record Purchase</span>
            </button>

            <button
              onClick={() => setActiveTab('khata')}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-1.5 py-2 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 text-center"
            >
              <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 shrink-0" />
              <span className="truncate">Udharo Khata</span>
            </button>

            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center justify-center gap-1 rounded-xl border border-rose-300 bg-rose-50 px-1.5 py-2 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-bold text-rose-900 shadow-xs hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/80 dark:text-rose-200 transition active:scale-95 text-center"
              id="dash-quick-expenses-btn"
            >
              <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-600 shrink-0" />
              <span className="truncate">Shop Expenses</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="relative flex items-center justify-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-1.5 py-2 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-bold text-amber-900 shadow-xs hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-200 text-center"
              id="dash-notifications-btn"
            >
              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 animate-bounce shrink-0" />
              <span className="truncate">Alerts ({totalNotificationAlerts})</span>
              {totalNotificationAlerts > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-extrabold text-white shadow-xs">
                  {totalNotificationAlerts}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Section Header & Date Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span>Financial Key Metrics</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time revenue, profit, cash, QR, and credit breakdown
          </p>
        </div>

        {/* Date Filter Control for KPI Boxes & Export PDF */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Date Range:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
              id="kpi-date-filter-select"
            >
              <option value="ALL" className="dark:bg-slate-900">All Time</option>
              <option value="DAILY" className="dark:bg-slate-900">Daily</option>
              <option value="WEEKLY" className="dark:bg-slate-900">Weekly</option>
              <option value="MONTHLY" className="dark:bg-slate-900">Monthly</option>
              <option value="3_MONTH" className="dark:bg-slate-900">3 Month</option>
              <option value="6_MONTH" className="dark:bg-slate-900">6 Month</option>
              <option value="YEARLY" className="dark:bg-slate-900">Yearly</option>
              <option value="CUSTOM" className="dark:bg-slate-900">Custom Date</option>
            </select>
          </div>

          {dateFilter === 'CUSTOM' && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-xl shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                id="kpi-custom-start-date"
              />
              <span className="text-xs text-slate-400 font-bold">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                id="kpi-custom-end-date"
              />
            </div>
          )}

          <button
            onClick={() => setIsPdfExportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/90 px-3.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/80 dark:text-blue-300 transition shadow-2xs active:scale-95 cursor-pointer"
            id="dash-export-pdf-btn"
            title="Export financial statement to PDF"
          >
            <Printer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Export to PDF</span>
          </button>
        </div>
      </div>

      {/* 6 KPI Stat Cards arranged in 3 cols (2 lines) on mobile */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {/* Card 1: Revenue */}
        <div className="flex flex-col justify-between rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-tight sm:tracking-wider text-slate-500 truncate">
              Total Revenue
            </span>
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <h3 className="text-xs sm:text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
              NPR {kpiTotalRevenue.toLocaleString()}
            </h3>
            <p className="text-[8px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 sm:mt-1 flex items-center gap-0.5 truncate">
              <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
              <span className="truncate">Sales ({kpiInvoices.length} bills)</span>
            </p>
          </div>
        </div>

        {/* Card 2: Net Profit (Gross Profit - Shop Expenses) */}
        <div className="flex flex-col justify-between rounded-xl sm:rounded-2xl border border-emerald-200 bg-emerald-50/30 p-2.5 sm:p-4 shadow-2xs dark:border-emerald-900/50 dark:bg-slate-900/90">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-tight sm:tracking-wider text-emerald-700 dark:text-emerald-400 truncate">
              Gross Profit
            </span>
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <h3 className="text-xs sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
              NPR {kpiTotalProfit.toLocaleString()}
            </h3>
            <p className="text-[8px] sm:text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5 sm:mt-1 truncate">
              Net Op: NPR {kpiNetOperatingProfit.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Card 3: Shop Expenses (Unclickable metric card) */}
        <div
          className="flex flex-col justify-between rounded-xl sm:rounded-2xl border border-rose-200 bg-rose-50/40 p-2.5 sm:p-4 shadow-2xs dark:border-rose-900/50 dark:bg-slate-900/90 pointer-events-none select-none"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-tight sm:tracking-wider text-rose-700 dark:text-rose-400 truncate">
              Shop Expenses
            </span>
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
              <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <h3 className="text-xs sm:text-xl font-bold text-rose-600 dark:text-rose-400 truncate">
              NPR {kpiTotalExpenses.toLocaleString()}
            </h3>
            <p className="text-[8px] sm:text-[10px] text-rose-700 dark:text-rose-300 font-semibold mt-0.5 sm:mt-1 flex items-center gap-0.5 truncate">
              <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
              <span className="truncate">Rent, Electric & Overheads</span>
            </p>
          </div>
        </div>

        {/* Card 4: Cash Collected */}
        <div className="flex flex-col justify-between rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-tight sm:tracking-wider text-slate-500 truncate">
              Cash In Hand
            </span>
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
              <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <h3 className="text-xs sm:text-xl font-bold text-teal-600 dark:text-teal-400 truncate">
              NPR {kpiTotalCash.toLocaleString()}
            </h3>
            <p className="text-[8px] sm:text-[10px] text-slate-500 mt-0.5 sm:mt-1 truncate">Direct cash till receipts</p>
          </div>
        </div>

        {/* Card 5: Stock Purchases */}
        <div className="flex flex-col justify-between rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-tight sm:tracking-wider text-slate-500 truncate">
              Stock Purchases
            </span>
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <h3 className="text-xs sm:text-xl font-bold text-blue-600 dark:text-blue-400 truncate">
              NPR {kpiTotalPurchases.toLocaleString()}
            </h3>
            <p className="text-[8px] sm:text-[10px] text-slate-500 mt-0.5 sm:mt-1 truncate">
              Stock Buy Inflow ({kpiPurchases.length} logs)
            </p>
          </div>
        </div>

        {/* Card 6: Customer Udharo */}
        <div className="flex flex-col justify-between rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-tight sm:tracking-wider text-slate-500 truncate">
              Customer Udharo (Due)
            </span>
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-2">
            <h3 className="text-xs sm:text-xl font-bold text-amber-600 dark:text-amber-400 truncate">
              NPR {pendingCustomerUdharo.toLocaleString()}
            </h3>
            <p className="text-[8px] sm:text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 sm:mt-1 truncate">
              {pendingCustomerUdharo > 0
                ? `${customers.filter((c) => c.currentBalance > 0).length} owe credit`
                : 'All khata cleared'}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Area Chart: Revenue Trend (2 cols) */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {filterLabelMap[dateFilter]} Turnover & Revenue Trend
              </h3>
              <p className="text-xs text-slate-500">Real-time sales performance breakdown (NPR)</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-slate-800 dark:bg-slate-800/80">
                <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-slate-800 outline-none dark:text-slate-200 cursor-pointer"
                  id="trend-date-filter-dropdown"
                >
                  <option value="ALL" className="dark:bg-slate-900">All Time</option>
                  <option value="DAILY" className="dark:bg-slate-900">Daily</option>
                  <option value="WEEKLY" className="dark:bg-slate-900">Weekly</option>
                  <option value="MONTHLY" className="dark:bg-slate-900">Monthly</option>
                  <option value="3_MONTH" className="dark:bg-slate-900">3 Month</option>
                  <option value="6_MONTH" className="dark:bg-slate-900">6 Month</option>
                  <option value="YEARLY" className="dark:bg-slate-900">Yearly</option>
                  <option value="CUSTOM" className="dark:bg-slate-900">Custom Date</option>
                </select>
              </div>

              {dateFilter === 'CUSTOM' && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`NPR ${Number(val).toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Cash Flow Breakdown (1 col) */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Cash Flow Breakdown
            </h3>
            <p className="text-xs text-slate-500">Payment method split ratio</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`NPR ${Number(val).toLocaleString()}`, 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {paymentBreakdownData.map((item) => (
              <div key={item.name} className="flex items-center justify-between font-semibold">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="text-slate-900 dark:text-slate-100">
                  NPR {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Store Performance Intelligence Card - Custom for each User / Shop */}
      <div className="flex flex-col gap-4 rounded-2xl border border-blue-200/80 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-5 sm:p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/30 border border-blue-500/40 text-blue-400 font-black text-lg shadow-inner">
              <Zap className="h-6 w-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-extrabold text-white tracking-tight">
                  {currentShopName}
                </h3>
                <span className="rounded-md bg-blue-950 border border-blue-800 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-300">
                  {currentShopCode}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${performanceTier.badgeColor}`}>
                  Grade {performanceTier.grade} • {performanceTier.title}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Store user: <strong className="text-amber-300">@{currentUser?.username || 'user'}</strong> • Live performance rating & financial breakdown for {filterLabelMap[dateFilter]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl self-start md:self-auto">
            <div className="text-right">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Store Health Score</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {shopPerformanceScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Net Profit Margin</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {profitMarginPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Live Metrics Grid for this Shop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">Shop Sales Revenue</span>
            <span className="text-sm sm:text-base font-extrabold text-blue-400 block truncate">
              NPR {kpiTotalRevenue.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block">{kpiInvoices.length} Bills Generated</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">Stock Purchases</span>
            <span className="text-sm sm:text-base font-extrabold text-amber-400 block truncate">
              NPR {kpiTotalPurchases.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block">{kpiPurchases.length} Purchase Invoices</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">Net Operating Profit</span>
            <span className={`text-sm sm:text-base font-extrabold block truncate ${kpiNetOperatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              NPR {kpiNetOperatingProfit.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block">After Expenses (NPR {kpiTotalExpenses.toLocaleString()})</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">Total Stock Assets</span>
            <span className="text-sm sm:text-base font-extrabold text-purple-300 block truncate">
              NPR {totalInventoryValuation.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block">{products.length} Products Cataloged</span>
          </div>
        </div>

        {/* Dynamic Shop Insight Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-blue-950/50 border border-blue-900/60 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
            <span className="text-blue-200">
              <strong>Top Performing Category for {currentShopName}:</strong> <span className="text-amber-300 font-bold">{topCategoryData.topCat}</span> (NPR {topCategoryData.maxVal.toLocaleString()})
            </span>
          </div>
          <span className="text-[11px] text-blue-300 shrink-0 font-medium">
            Udharo Khata Debt: <strong className="text-amber-300">NPR {pendingCustomerUdharo.toLocaleString()}</strong>
          </span>
        </div>
      </div>

      {/* Top 5 & Bottom 5 Selling Products Performance Section */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span>Product Sales Performance ({filterLabelMap[dateFilter]})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Detailed breakdown of Top 5 Best-Selling items and Bottom 5 Slow-Moving inventory items
            </p>
          </div>

          {/* View Filter Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setProductTab('BOTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                productTab === 'BOTH'
                  ? 'bg-white text-slate-900 shadow-2xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              All (Top & Bottom)
            </button>
            <button
              type="button"
              onClick={() => setProductTab('TOP')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                productTab === 'TOP'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>Top 5 Only</span>
            </button>
            <button
              type="button"
              onClick={() => setProductTab('BOTTOM')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                productTab === 'BOTTOM'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <ArrowDownRight className="h-3.5 w-3.5" />
              <span>Bottom 5 Only</span>
            </button>
          </div>
        </div>

        {/* Grid Container */}
        <div className={`grid grid-cols-1 ${productTab === 'BOTH' ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
          {/* Top 5 Best Sellers Column */}
          {(productTab === 'BOTH' || productTab === 'TOP') && (
            <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/20 p-3 sm:p-4 dark:border-emerald-900/40 dark:bg-emerald-950/10">
              <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-900/40 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-xs">
                    <Flame className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-emerald-950 dark:text-emerald-300">
                      Top 5 Best-Selling Products
                    </h4>
                    <p className="text-[10px] text-emerald-800 dark:text-emerald-400">Highest volume & revenue contributors</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {top5Products.length} Items
                </span>
              </div>

              <div className="space-y-3">
                {top5Products.length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-500">No products recorded yet.</p>
                ) : (
                  top5Products.map((item, idx) => {
                    const p = item.product;
                    const rank = idx + 1;
                    const rankColors = [
                      'bg-amber-500 text-white ring-2 ring-amber-300 dark:ring-amber-600', // Gold #1
                      'bg-slate-400 text-white', // Silver #2
                      'bg-amber-700 text-white', // Bronze #3
                      'bg-emerald-600 text-white', // #4
                      'bg-emerald-600 text-white', // #5
                    ];

                    return (
                      <div
                        key={p.id}
                        className="rounded-xl border border-emerald-100 bg-white p-3 shadow-2xs transition hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900/90"
                      >
                        {/* Header line: Rank, Name, Category */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                          <div className="flex items-center gap-2">
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${rankColors[idx] || 'bg-slate-600 text-white'}`}>
                              #{rank}
                            </span>
                            <div>
                              <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                                <span>{p.name}</span>
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  {p.category}
                                </span>
                              </h5>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                <span>SKU: {p.sku}</span>
                                {p.barcode && <span>• Barcode: {p.barcode}</span>}
                                {p.rackNo && <span>• Rack: {p.rackNo}</span>}
                              </div>
                            </div>
                          </div>

                          {/* Stock Status Pill */}
                          <div className="text-right shrink-0">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              p.stockQty === 0
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : p.stockQty <= p.minStockAlert
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                              Stock: {p.stockQty} {p.unit.primaryUnit}
                            </span>
                          </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 text-xs">
                          <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                            <span className="block text-[9px] font-semibold text-slate-400 uppercase">Units Sold</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                              {item.unitsSold} {p.unit.primaryUnit}
                            </span>
                          </div>

                          <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                            <span className="block text-[9px] font-semibold text-slate-400 uppercase">Total Revenue</span>
                            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                              NPR {item.totalRevenue.toLocaleString()}
                            </span>
                          </div>

                          <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                            <span className="block text-[9px] font-semibold text-slate-400 uppercase">Pricing (Cost/Sell)</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-[10px]">
                              NPR {p.unit.primaryCostPrice} / NPR {p.unit.primarySellingPrice}
                            </span>
                          </div>

                          <div className="rounded-lg bg-emerald-50/60 p-2 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/50">
                            <span className="block text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Total Profit (Margin)</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                              NPR {item.totalProfit.toLocaleString()} ({item.profitMarginPct.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Bottom 5 Lowest Selling Products Column */}
          {(productTab === 'BOTH' || productTab === 'BOTTOM') && (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/20 p-3 sm:p-4 dark:border-amber-900/40 dark:bg-amber-950/10">
              <div className="flex items-center justify-between border-b border-amber-200/60 dark:border-amber-900/40 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
                    <ArrowDownRight className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-amber-950 dark:text-amber-300">
                      Bottom 5 Lowest-Selling Products
                    </h4>
                    <p className="text-[10px] text-amber-800 dark:text-amber-400">Slow-moving or zero sales inventory items</p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  {bottom5Products.length} Items
                </span>
              </div>

              <div className="space-y-3">
                {bottom5Products.length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-500">No products recorded yet.</p>
                ) : (
                  bottom5Products.map((item, idx) => {
                    const p = item.product;
                    const rank = idx + 1;

                    return (
                      <div
                        key={p.id}
                        className="rounded-xl border border-amber-100 bg-white p-3 shadow-2xs transition hover:border-amber-300 dark:border-slate-800 dark:bg-slate-900/90"
                      >
                        {/* Header line: Rank, Name, Category */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black">
                              #{rank}
                            </span>
                            <div>
                              <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                                <span>{p.name}</span>
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  {p.category}
                                </span>
                                {item.unitsSold === 0 && (
                                  <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-200">
                                    0 Sales (Slow Mover)
                                  </span>
                                )}
                              </h5>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                <span>SKU: {p.sku}</span>
                                {p.barcode && <span>• Barcode: {p.barcode}</span>}
                                {p.rackNo && <span>• Rack: {p.rackNo}</span>}
                              </div>
                            </div>
                          </div>

                          {/* Stock Status Pill */}
                          <div className="text-right shrink-0">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              p.stockQty === 0
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : p.stockQty <= p.minStockAlert
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                              Stock: {p.stockQty} {p.unit.primaryUnit}
                            </span>
                          </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 text-xs">
                          <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                            <span className="block text-[9px] font-semibold text-slate-400 uppercase">Units Sold</span>
                            <span className={`font-bold text-xs ${item.unitsSold === 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
                              {item.unitsSold} {p.unit.primaryUnit}
                            </span>
                          </div>

                          <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                            <span className="block text-[9px] font-semibold text-slate-400 uppercase">Total Revenue</span>
                            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                              NPR {item.totalRevenue.toLocaleString()}
                            </span>
                          </div>

                          <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50">
                            <span className="block text-[9px] font-semibold text-slate-400 uppercase">Pricing (Cost/Sell)</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-[10px]">
                              NPR {p.unit.primaryCostPrice} / NPR {p.unit.primarySellingPrice}
                            </span>
                          </div>

                          <div className="rounded-lg bg-amber-50/60 p-2 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/50">
                            <span className="block text-[9px] font-semibold text-amber-800 dark:text-amber-400 uppercase">Unit Margin</span>
                            <span className="font-extrabold text-amber-700 dark:text-amber-300 text-xs">
                              NPR {item.unitProfit} ({item.unitMarginPct.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low Stock Warnings */}
        <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50/20 p-6 shadow-2xs dark:border-amber-900/50 dark:bg-amber-950/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Low Stock Reorder Notifications ({lowStockProducts.length})
                </h3>
                {outOfStockCount > 0 && (
                  <p className="text-[10px] font-bold text-red-600 dark:text-red-400">
                    🚨 {outOfStockCount} item(s) completely OUT OF STOCK
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setActiveTab('products')}
              className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
            >
              Catalog →
            </button>
          </div>

          <div className="space-y-2.5">
            {lowStockProducts.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>All inventory products are sufficiently stocked!</span>
              </div>
            ) : (
              lowStockProducts.map((p) => {
                const isOutOfStock = p.stockQty === 0;
                const isCritical = !isOutOfStock && p.stockQty <= Math.ceil(p.minStockAlert / 2);

                return (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-white p-3 shadow-2xs dark:border-amber-900 dark:bg-slate-900"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100">{p.name}</h5>
                        {isOutOfStock ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.2 text-[9px] font-black text-red-800 dark:bg-red-950 dark:text-red-200 uppercase">
                            Out of Stock
                          </span>
                        ) : isCritical ? (
                          <span className="rounded-full bg-orange-100 px-2 py-0.2 text-[9px] font-black text-orange-800 dark:bg-orange-950 dark:text-orange-200 uppercase">
                            Critical
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2 py-0.2 text-[9px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                            Low Stock
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">
                        SKU: {p.sku} {p.barcode ? `| Barcode: ${p.barcode}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-right text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        {p.stockQty} / {p.minStockAlert} {p.unit.primaryUnit}
                      </span>
                      <button
                        onClick={() => setActiveTab('purchases')}
                        className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white transition hover:bg-indigo-700"
                        title="Record purchase to restock this product"
                      >
                        <Truck className="h-3 w-3" />
                        <span>Reorder</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Invoices Stream */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Recent POS Invoices</h3>
            <button
              onClick={() => setActiveTab('history')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View Full History →
            </button>
          </div>

          <div className="space-y-2.5">
            {invoices.slice(0, 4).map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/40 text-xs"
              >
                <div>
                  <div className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {inv.invoiceNo}
                  </div>
                  <div className="text-slate-500">{inv.customerName}</div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-slate-900 dark:text-slate-100">
                    NPR {inv.netAmount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AUTOMATIC POP-UP NOTIFICATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-amber-50 via-orange-50 to-indigo-50 px-6 py-4 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md animate-bounce">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                    <span>Dashboard Priority Alerts</span>
                    <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-black text-white">
                      {totalNotificationAlerts} Action Required
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Auto-generated business alerts requiring your attention today
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                title="Dismiss Popup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-6">
              <button
                onClick={() => setActiveModalTab('DUE_DATES')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition ${
                  activeModalTab === 'DUE_DATES'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Udharo Payment Dues ({totalDueAlertsCount})</span>
              </button>

              <button
                onClick={() => setActiveModalTab('LOW_STOCK')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition ${
                  activeModalTab === 'LOW_STOCK'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Low & Out of Stock ({lowStockProducts.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {activeModalTab === 'DUE_DATES' && (
                <div className="space-y-3">
                  {totalDueAlertsCount === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Pending Udharo Dues Today!</h4>
                      <p className="text-xs text-slate-500 max-w-xs mt-1">
                        All customer credit promises and vendor payments are up-to-date.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Customer Dues */}
                      {overdueCustomers.map((c) => (
                        <div key={`modal-overdue-cust-${c.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/50 p-3.5 dark:border-red-900/60 dark:bg-slate-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{c.name}</span>
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-800 dark:bg-red-950 dark:text-red-200">
                                Overdue Date: {c.dueDate}
                              </span>
                            </div>
                            <div className="text-xs font-extrabold text-red-600 dark:text-red-400 mt-0.5">
                              Customer Pending Balance: NPR {c.currentBalance.toLocaleString()}
                            </div>
                            {c.dueNotes && <p className="text-[10px] text-slate-500 italic mt-0.5">"{c.dueNotes}"</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => sendWhatsAppReminder(c.name, c.phone, c.currentBalance, c.dueDate)}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                              <span>WhatsApp</span>
                            </button>
                            <button
                              onClick={() => { setIsModalOpen(false); setActiveTab('khata'); }}
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                            >
                              <span>Collect</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {dueTodayCustomers.map((c) => (
                        <div key={`modal-today-cust-${c.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/50 p-3.5 dark:border-amber-800 dark:bg-slate-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{c.name}</span>
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200 animate-pulse">
                                Due Today!
                              </span>
                            </div>
                            <div className="text-xs font-extrabold text-amber-700 dark:text-amber-400 mt-0.5">
                              Customer Pending Balance: NPR {c.currentBalance.toLocaleString()}
                            </div>
                            {c.dueNotes && <p className="text-[10px] text-slate-500 italic mt-0.5">"{c.dueNotes}"</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => sendWhatsAppReminder(c.name, c.phone, c.currentBalance, c.dueDate)}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                              <span>WhatsApp</span>
                            </button>
                            <button
                              onClick={() => { setIsModalOpen(false); setActiveTab('khata'); }}
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                            >
                              <span>Collect</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Supplier Dues */}
                      {overdueSuppliers.map((s) => (
                        <div key={`modal-overdue-sup-${s.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/30 p-3.5 dark:border-red-900/60 dark:bg-slate-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{s.name} (Supplier)</span>
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold text-red-800 dark:bg-red-950 dark:text-red-200">
                                Overdue: {s.dueDate}
                              </span>
                            </div>
                            <div className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 mt-0.5">
                              Payable to Vendor: NPR {s.pendingPayable.toLocaleString()}
                            </div>
                            {s.dueNotes && <p className="text-[10px] text-slate-500 italic mt-0.5">"{s.dueNotes}"</p>}
                          </div>
                          <button
                            onClick={() => { setIsModalOpen(false); setActiveTab('khata'); }}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                          >
                            <span>Pay Vendor</span>
                          </button>
                        </div>
                      ))}

                      {dueTodaySuppliers.map((s) => (
                        <div key={`modal-today-sup-${s.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/30 p-3.5 dark:border-amber-800 dark:bg-slate-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{s.name} (Supplier)</span>
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                                Due Today!
                              </span>
                            </div>
                            <div className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 mt-0.5">
                              Payable to Vendor: NPR {s.pendingPayable.toLocaleString()}
                            </div>
                            {s.dueNotes && <p className="text-[10px] text-slate-500 italic mt-0.5">"{s.dueNotes}"</p>}
                          </div>
                          <button
                            onClick={() => { setIsModalOpen(false); setActiveTab('khata'); }}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                          >
                            <span>Pay Vendor</span>
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {activeModalTab === 'LOW_STOCK' && (
                <div className="space-y-3">
                  {lowStockProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Inventory Sufficiently Stocked!</h4>
                      <p className="text-xs text-slate-500 max-w-xs mt-1">
                        All items in your catalog meet minimum stock threshold requirements.
                      </p>
                    </div>
                  ) : (
                    lowStockProducts.map((p) => {
                      const isOutOfStock = p.stockQty === 0;
                      return (
                        <div
                          key={`modal-low-stock-${p.id}`}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-white p-3.5 shadow-2xs dark:border-slate-700 dark:bg-slate-800"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{p.name}</span>
                              {isOutOfStock ? (
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-black text-red-800 dark:bg-red-950 dark:text-red-200 uppercase">
                                  Out of Stock
                                </span>
                              ) : (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                                  Low Stock
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              SKU: {p.sku} | Barcode: {p.barcode || 'N/A'}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                              {p.stockQty} / {p.minStockAlert} {p.unit.primaryUnit}
                            </span>
                            <button
                              onClick={() => { setIsModalOpen(false); setActiveTab('purchases'); }}
                              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-700"
                            >
                              <Truck className="h-3.5 w-3.5" />
                              <span>Reorder</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/60">
              <span className="text-xs font-medium text-slate-500">
                Opening dashboard automatically displays active business notifications.
              </span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shop Expenses Management Modal */}
      <ShopExpensesModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />

      {/* Printable Report PDF Modal */}
      <ReportPdfModal
        isOpen={isPdfExportModalOpen}
        onClose={() => setIsPdfExportModalOpen(false)}
        dateFilterLabel={
          dateFilter === 'ALL'
            ? 'All Time'
            : dateFilter === 'DAILY'
            ? 'Daily'
            : dateFilter === 'WEEKLY'
            ? 'Weekly'
            : dateFilter === 'MONTHLY'
            ? 'Monthly'
            : dateFilter === '3_MONTH'
            ? '3 Months'
            : dateFilter === '6_MONTH'
            ? '6 Months'
            : dateFilter === 'YEARLY'
            ? 'Yearly'
            : 'Custom Date'
        }
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        shopProfile={shopProfile}
        kpiInvoices={kpiInvoices}
        kpiExpenses={kpiExpenses}
        products={products}
        kpiTotalRevenue={kpiTotalRevenue}
        kpiTotalProfit={kpiTotalProfit}
        kpiTotalExpenses={kpiTotalExpenses}
        kpiNetOperatingProfit={kpiNetOperatingProfit}
        kpiTotalCash={kpiTotalCash}
        kpiTotalQr={kpiTotalQr}
        kpiTotalUdharo={kpiTotalUdharo}
      />
    </div>
  );
};
