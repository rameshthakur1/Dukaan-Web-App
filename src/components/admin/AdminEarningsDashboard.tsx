import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SubscriptionPlan, AuthUser, SubscriptionSaleTransaction } from '../../types';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  CheckCircle2,
  Sparkles,
  Zap,
  Tag,
  Store,
  Clock,
  ArrowUpRight,
  Filter,
  BarChart2,
  PieChart,
  PlusCircle,
  X,
  Check,
  Award,
  ShieldCheck,
  ShoppingBag,
  Info,
  Layers,
  Crown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export type DateFilterPreset = 'TODAY' | 'LAST_WEEK' | 'LAST_MONTH' | 'LAST_YEAR' | 'CUSTOM';

export const AdminEarningsDashboard: React.FC = () => {
  const {
    registeredUsers,
    subscriptionSales,
    recordSubscriptionSale,
    deleteSubscriptionSale,
    planPrices,
    approveUserRequest,
  } = useApp();

  // Date Filter State
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('LAST_MONTH');
  
  // Custom Date range
  const getTodayIso = () => new Date().toISOString().split('T')[0];
  const getPastIso = (days: number) => new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const [customStartDate, setCustomStartDate] = useState<string>(getPastIso(30));
  const [customEndDate, setCustomEndDate] = useState<string>(getTodayIso());

  // Chart view modes
  const [chartMetric, setChartMetric] = useState<'REVENUE' | 'SALES_COUNT' | 'BOTH'>('REVENUE');
  const [chartType, setChartType] = useState<'AREA' | 'BAR'>('AREA');

  // Date Range Calculation
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (datePreset === 'TODAY') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (datePreset === 'LAST_WEEK') {
      start = new Date(now.getTime() - 7 * 86400000);
      start.setHours(0, 0, 0, 0);
    } else if (datePreset === 'LAST_MONTH') {
      start = new Date(now.getTime() - 30 * 86400000);
      start.setHours(0, 0, 0, 0);
    } else if (datePreset === 'LAST_YEAR') {
      start = new Date(now.getTime() - 365 * 86400000);
      start.setHours(0, 0, 0, 0);
    } else {
      start = customStartDate ? new Date(customStartDate) : new Date(now.getTime() - 30 * 86400000);
      start.setHours(0, 0, 0, 0);
      end = customEndDate ? new Date(customEndDate) : end;
      end.setHours(23, 59, 59, 999);
    }

    return { startMs: start.getTime(), endMs: end.getTime(), startDateStr: start.toISOString().split('T')[0], endDateStr: end.toISOString().split('T')[0] };
  }, [datePreset, customStartDate, customEndDate]);

  // Combine subscriptionSales + synthetic baseline from registeredUsers for robust coverage
  const combinedSalesList = useMemo(() => {
    const list: SubscriptionSaleTransaction[] = [...subscriptionSales];
    
    // Add baseline records from registered users if they are not already in sales log
    registeredUsers.forEach((u) => {
      if (u.role === 'SUPER_ADMIN') return;
      const dateStr = u.registeredAt ? u.registeredAt.split('T')[0] : getTodayIso();
      const hasSale = list.some((s) => s.userId === u.id);
      if (!hasSale && u.status === 'APPROVED') {
        let amt = 0;
        if (u.subscriptionPlan === 'MONTHLY') amt = planPrices.monthlyNpr;
        else if (u.subscriptionPlan === 'QUARTERLY') amt = planPrices.quarterlyNpr ?? 4000;
        else if (u.subscriptionPlan === 'HALF_YEARLY') amt = planPrices.halfYearlyNpr ?? 7500;
        else if (u.subscriptionPlan === 'YEARLY') amt = planPrices.yearlyNpr;

        list.push({
          id: `SALE-AUTO-${u.id}`,
          userId: u.id,
          userName: u.name,
          shopName: u.shopName || u.name,
          shopCode: u.shopCode,
          plan: u.subscriptionPlan,
          amount: amt,
          paymentMethod: 'Verified Membership Approval',
          transactionDate: dateStr,
          notes: 'Automatic store activation sale record',
        });
      }
    }
    );

    return list.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }, [subscriptionSales, registeredUsers, planPrices]);

  // Filtered Sales for selected time range
  const filteredSales = useMemo(() => {
    return combinedSalesList.filter((s) => {
      const txMs = new Date(s.transactionDate).getTime();
      return txMs >= dateRangeBounds.startMs && txMs <= dateRangeBounds.endMs;
    });
  }, [combinedSalesList, dateRangeBounds]);

  // Key Macro Financial Metrics
  const totalEarningsNpr = useMemo(() => {
    return filteredSales.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [filteredSales]);

  const totalSalesCount = useMemo(() => {
    return filteredSales.length;
  }, [filteredSales]);

  const averageSaleValue = useMemo(() => {
    if (totalSalesCount === 0) return 0;
    return Math.round(totalEarningsNpr / totalSalesCount);
  }, [totalEarningsNpr, totalSalesCount]);

  // Subscription Model Breakdown (How many times sold & revenue)
  const modelBreakdown = useMemo(() => {
    const plans: SubscriptionPlan[] = ['MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', '7_DAY_TRIAL'];

    return plans.map((plan) => {
      // Filter sales in period
      const salesInPeriod = filteredSales.filter((s) => s.plan === plan);
      const periodCount = salesInPeriod.length;
      const periodRevenue = salesInPeriod.reduce((acc, curr) => acc + (curr.amount || 0), 0);

      // Filter all time sales
      const allTimeSales = combinedSalesList.filter((s) => s.plan === plan);
      const allTimeCount = allTimeSales.length;
      const allTimeRevenue = allTimeSales.reduce((acc, curr) => acc + (curr.amount || 0), 0);

      let unitPrice = 0;
      let label = '';
      let badgeBg = '';
      let badgeText = '';

      if (plan === 'MONTHLY') {
        unitPrice = planPrices.monthlyNpr;
        label = 'Monthly Plan';
        badgeBg = 'bg-purple-500/20 border-purple-500/30 text-purple-300';
      } else if (plan === 'QUARTERLY') {
        unitPrice = planPrices.quarterlyNpr ?? 4000;
        label = 'Quarterly Plan';
        badgeBg = 'bg-teal-500/20 border-teal-500/30 text-teal-300';
      } else if (plan === 'HALF_YEARLY') {
        unitPrice = planPrices.halfYearlyNpr ?? 7500;
        label = 'Half-Yearly Plan';
        badgeBg = 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300';
      } else if (plan === 'YEARLY') {
        unitPrice = planPrices.yearlyNpr;
        label = 'Yearly Pro Plan';
        badgeBg = 'bg-amber-500/20 border-amber-500/30 text-amber-300';
      } else {
        unitPrice = 0;
        label = `${planPrices.trialDays || 7}-Day Free Trial`;
        badgeBg = 'bg-blue-500/20 border-blue-500/30 text-blue-300';
      }

      const revSharePct = totalEarningsNpr > 0 ? Math.round((periodRevenue / totalEarningsNpr) * 100) : 0;
      const salesSharePct = totalSalesCount > 0 ? Math.round((periodCount / totalSalesCount) * 100) : 0;

      return {
        plan,
        label,
        unitPrice,
        periodCount,
        periodRevenue,
        allTimeCount,
        allTimeRevenue,
        revSharePct,
        salesSharePct,
        badgeBg,
      };
    });
  }, [filteredSales, combinedSalesList, planPrices, totalEarningsNpr, totalSalesCount]);

  // Top Performing Plan
  const topPlan = useMemo(() => {
    const sorted = [...modelBreakdown].sort((a, b) => b.periodRevenue - a.periodRevenue);
    return sorted[0] || modelBreakdown[3];
  }, [modelBreakdown]);

  // Graph Data Aggregation by Date
  const graphChartData = useMemo(() => {
    const daysDiff = Math.ceil((dateRangeBounds.endMs - dateRangeBounds.startMs) / (1000 * 3600 * 24));
    
    // Generate dates map
    const dateMap: Record<string, { date: string; dateLabel: string; revenue: number; salesCount: number }> = {};

    // If preset is today, populate hourly/today
    if (datePreset === 'TODAY') {
      const todayStr = getTodayIso();
      const dateLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateMap[todayStr] = { date: todayStr, dateLabel, revenue: 0, salesCount: 0 };
    } else {
      // Create entries for days
      const loopDays = Math.min(Math.max(daysDiff, 1), 60); // Cap graph points for performance
      for (let i = loopDays; i >= 0; i--) {
        const d = new Date(dateRangeBounds.endMs - i * 86400000);
        const iso = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dateMap[iso] = { date: iso, dateLabel: label, revenue: 0, salesCount: 0 };
      }
    }

    // Fill with sales data
    filteredSales.forEach((s) => {
      const iso = s.transactionDate.split('T')[0];
      if (!dateMap[iso]) {
        const d = new Date(s.transactionDate);
        const label = isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dateMap[iso] = { date: iso, dateLabel: label, revenue: 0, salesCount: 0 };
      }
      dateMap[iso].revenue += s.amount || 0;
      dateMap[iso].salesCount += 1;
    });

    return Object.values(dateMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredSales, dateRangeBounds, datePreset]);

  return (
    <div className="space-y-6">
      {/* TOP DASHBOARD HEADER & QUICK ACTIONS */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Super Admin Revenue Engine
            </span>
            <span className="text-xs text-slate-400 font-mono">Live Sync</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Admin Earnings & Subscription Sales</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Track total platform earnings, filter revenue across time ranges, and inspect how many times each subscription model was registered with real coupon-discounted amounts.
          </p>
        </div>
      </div>

      {/* TIME RANGE PRESET FILTER BAR */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-bold">
            <Filter className="h-4 w-4 text-emerald-400" />
            <span>Select Revenue & Sales Time Filter:</span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setDatePreset('TODAY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                datePreset === 'TODAY'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDatePreset('LAST_WEEK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                datePreset === 'LAST_WEEK'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Last 7 Days (Week)
            </button>
            <button
              onClick={() => setDatePreset('LAST_MONTH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                datePreset === 'LAST_MONTH'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Last 30 Days (Month)
            </button>
            <button
              onClick={() => setDatePreset('LAST_YEAR')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                datePreset === 'LAST_YEAR'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Last 365 Days (Year)
            </button>
            <button
              onClick={() => setDatePreset('CUSTOM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                datePreset === 'CUSTOM'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Custom Date Range
            </button>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {datePreset === 'CUSTOM' && (
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-[11px] text-emerald-400 font-mono">
              ({dateRangeBounds.startDateStr} to {dateRangeBounds.endDateStr})
            </span>
          </div>
        )}
      </div>

      {/* MACRO FINANCIAL METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Admin Earnings */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Total Admin Earnings</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
              NPR {totalEarningsNpr.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-bold">Earned</span> in selected time period
            </p>
          </div>
        </div>

        {/* Subscription Models Sold */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Subscriptions Sold</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-purple-300 font-mono tracking-tight">
              {totalSalesCount} <span className="text-base font-normal text-slate-400">Sales</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Total subscription orders processed
            </p>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Average Revenue / Sale</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-teal-300 font-mono tracking-tight">
              NPR {averageSaleValue.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Average yield per subscription sale
            </p>
          </div>
        </div>

        {/* Top Performing Subscription Model */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Top Revenue Model</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Crown className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-xl font-extrabold text-amber-300 truncate">
              {topPlan?.label || 'Yearly Pro'}
            </p>
            <p className="text-[11px] text-amber-400/80 font-mono font-bold mt-1">
              {topPlan?.revSharePct || 0}% of Total Period Revenue
            </p>
          </div>
        </div>
      </div>

      {/* REVENUE GRAPH CHART SECTION (RECHARTS) */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-emerald-400" />
              <span>Earnings Trend & Sales Graph</span>
            </h3>
            <p className="text-xs text-slate-400">
              Visual breakdown of earnings (NPR) & subscription sales count over time
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Metric Toggle */}
            <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center text-xs">
              <button
                onClick={() => setChartMetric('REVENUE')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  chartMetric === 'REVENUE' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Revenue (NPR)
              </button>
              <button
                onClick={() => setChartMetric('SALES_COUNT')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  chartMetric === 'SALES_COUNT' ? 'bg-purple-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sales Count
              </button>
              <button
                onClick={() => setChartMetric('BOTH')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  chartMetric === 'BOTH' ? 'bg-blue-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Both
              </button>
            </div>

            {/* Chart Type Toggle */}
            <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 flex items-center text-xs">
              <button
                onClick={() => setChartType('AREA')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  chartType === 'AREA' ? 'bg-slate-800 text-white' : 'text-slate-500'
                }`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType('BAR')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  chartType === 'BAR' ? 'bg-slate-800 text-white' : 'text-slate-500'
                }`}
              >
                Bar
              </button>
            </div>
          </div>
        </div>

        {/* Recharts Render Container */}
        <div className="w-full h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'AREA' ? (
              <AreaChart data={graphChartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAdminRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAdminSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="dateLabel" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => (val >= 1000 ? `${val / 1000}k` : val)} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                  formatter={(value: any, name: any) => [
                    name === 'revenue' ? `NPR ${Number(value).toLocaleString()}` : `${value} sales`,
                    name === 'revenue' ? 'Earnings' : 'Subscriptions Sold',
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                {(chartMetric === 'REVENUE' || chartMetric === 'BOTH') && (
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorAdminRev)"
                    name="revenue"
                  />
                )}
                {(chartMetric === 'SALES_COUNT' || chartMetric === 'BOTH') && (
                  <Area
                    type="monotone"
                    dataKey="salesCount"
                    stroke="#c084fc"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorAdminSales)"
                    name="salesCount"
                  />
                )}
              </AreaChart>
            ) : (
              <BarChart data={graphChartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="dateLabel" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                  formatter={(value: any, name: any) => [
                    name === 'revenue' ? `NPR ${Number(value).toLocaleString()}` : `${value} sales`,
                    name === 'revenue' ? 'Earnings' : 'Subscriptions Sold',
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                {(chartMetric === 'REVENUE' || chartMetric === 'BOTH') && (
                  <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} name="revenue" />
                )}
                {(chartMetric === 'SALES_COUNT' || chartMetric === 'BOTH') && (
                  <Bar dataKey="salesCount" fill="#c084fc" radius={[6, 6, 0, 0]} name="salesCount" />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* SUBSCRIPTION MODEL SALES BREAKDOWN (WHICH SUBSCRIPTION MODEL SOLD HOW MANY TIMES) */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-400" />
              <span>Subscription Model Sales Breakdown</span>
            </h3>
            <p className="text-xs text-slate-400">
              Detailed report showing which subscription plan model was sold how many times & revenue generated
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
            5 Subscription Models Tracked
          </span>
        </div>

        {/* Plan Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modelBreakdown.map((item) => (
            <div
              key={item.plan}
              className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header Badge & Unit Price */}
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${item.badgeBg}`}>
                    {item.label}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {item.unitPrice > 0 ? `NPR ${item.unitPrice.toLocaleString()}` : 'Free'}
                  </span>
                </div>

                {/* Times Sold Count (Selected Range vs All-time) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Period Sales
                    </span>
                    <p className="text-2xl font-black text-white font-mono">
                      {item.periodCount} <span className="text-xs font-normal text-slate-400">times</span>
                    </p>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      {item.salesSharePct}% of sales
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Total Revenue
                    </span>
                    <p className="text-xl font-black text-emerald-400 font-mono truncate">
                      NPR {item.periodRevenue.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.revSharePct}% rev share
                    </span>
                  </div>
                </div>

                {/* Progress Share Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Revenue Share</span>
                    <span className="font-mono font-bold text-white">{item.revSharePct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(item.revSharePct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT SUBSCRIPTION SALES TRANSACTIONS TABLE */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Recent Subscription Orders & Sales Ledger</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Showing {filteredSales.length} Transactions
          </span>
        </div>

        {filteredSales.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-2">
            <Info className="h-8 w-8 mx-auto text-slate-600" />
            <p>No subscription sales recorded in this selected time range.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Store Name & Owner</th>
                  <th className="p-3">Subscription Model</th>
                  <th className="p-3">Amount (NPR)</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3 font-mono text-slate-400">{sale.transactionDate}</td>
                    <td className="p-3">
                      <div className="font-bold text-white">{sale.shopName}</div>
                      <div className="text-[11px] text-slate-400">{sale.userName} ({sale.shopCode})</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[11px]">
                        {sale.plan}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-400">
                      NPR {(sale.amount || 0).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {sale.paymentMethod || 'FonePay'}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-400 max-w-xs truncate">
                      {sale.notes || 'N/A'}
                    </td>
                    <td className="p-3 text-right">
                      {sale.id.startsWith('SALE-AUTO-') ? (
                        <span className="text-[10px] text-slate-500 font-mono">Auto</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => deleteSubscriptionSale(sale.id)}
                          className="text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          title="Delete sale entry"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
