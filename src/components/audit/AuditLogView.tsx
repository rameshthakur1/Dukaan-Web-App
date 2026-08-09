import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AuditLogEntry } from '../../types';
import {
  FileSpreadsheet,
  Search,
  Filter,
  UserCheck,
  Building2,
  Calendar,
  Clock,
  Printer,
  ShoppingBag,
  ShoppingCart,
  Wallet,
  DollarSign,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Download,
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const {
    auditLogs,
    storeBranches,
    shopProfile,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.amount && String(log.amount).includes(searchTerm));

      const matchesType = actionTypeFilter === 'ALL' || log.actionType === actionTypeFilter;
      const matchesBranch = branchFilter === 'ALL' || log.storeBranch === branchFilter;

      return matchesSearch && matchesType && matchesBranch;
    });
  }, [auditLogs, searchTerm, actionTypeFilter, branchFilter]);

  // Summary Metrics
  const totalEntries = auditLogs.length;
  const salesCount = auditLogs.filter((l) => l.actionType === 'SALE_ENTRY' || l.actionType === 'SALE').length;
  const purchaseCount = auditLogs.filter((l) => l.actionType === 'PURCHASE_ENTRY' || l.actionType === 'PURCHASE').length;
  const advanceCount = auditLogs.filter((l) => l.actionType === 'ADVANCE_PAYMENT').length;

  const handlePrint = () => {
    window.print();
  };

  const getBadgeColor = (type: AuditLogEntry['actionType']) => {
    switch (type) {
      case 'SALE':
      case 'SALE_ENTRY':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'PURCHASE':
      case 'PURCHASE_ENTRY':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'ADVANCE_PAYMENT':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'EXPENSE':
      case 'EXPENSE_ENTRY':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'STAFF_MANAGEMENT':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getActionIcon = (type: AuditLogEntry['actionType']) => {
    switch (type) {
      case 'SALE':
      case 'SALE_ENTRY':
        return <ShoppingBag className="h-4 w-4 text-blue-600" />;
      case 'PURCHASE':
      case 'PURCHASE_ENTRY':
        return <ShoppingCart className="h-4 w-4 text-amber-600" />;
      case 'ADVANCE_PAYMENT':
        return <Wallet className="h-4 w-4 text-emerald-600" />;
      case 'EXPENSE':
      case 'EXPENSE_ENTRY':
        return <DollarSign className="h-4 w-4 text-rose-600" />;
      case 'STAFF_MANAGEMENT':
        return <UserCheck className="h-4 w-4 text-purple-600" />;
      default:
        return <Building2 className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              System Audit Trail & Entry Logs
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recorded entries of sales, purchases, advance payments, and staff actions with User ID tracking
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 transition active:scale-95 shadow-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Export / Print Report</span>
          </button>
        </div>
      </div>

      {/* Metrics Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-tight sm:tracking-normal truncate">Total Logged Entries</span>
            <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500 shrink-0" />
          </div>
          <p className="text-sm sm:text-2xl font-black text-slate-900 dark:text-white mt-1 sm:mt-2 font-mono truncate">{totalEntries}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-xs font-bold text-blue-600 uppercase tracking-tight sm:tracking-normal truncate">Sales Entries</span>
            <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 shrink-0" />
          </div>
          <p className="text-sm sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 sm:mt-2 font-mono truncate">{salesCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-xs font-bold text-amber-600 uppercase tracking-tight sm:tracking-normal truncate">Purchase Entries</span>
            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 shrink-0" />
          </div>
          <p className="text-sm sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 sm:mt-2 font-mono truncate">{purchaseCount}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-xs font-bold text-emerald-600 uppercase tracking-tight sm:tracking-normal truncate">Advance Payments</span>
            <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 shrink-0" />
          </div>
          <p className="text-sm sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 sm:mt-2 font-mono truncate">{advanceCount}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by staff user ID, action, or details..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Filter className="h-3.5 w-3.5" /> Filter:
          </div>

          <select
            value={actionTypeFilter}
            onChange={(e) => setActionTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
          >
            <option value="ALL">All Action Types</option>
            <option value="SALE_ENTRY">Sales Entries</option>
            <option value="PURCHASE_ENTRY">Purchase Entries</option>
            <option value="ADVANCE_PAYMENT">Advance Payments</option>
            <option value="EXPENSE_ENTRY">Expense Entries</option>
            <option value="STAFF_MANAGEMENT">Staff Management</option>
            <option value="BRANCH_MANAGEMENT">Store Branch Actions</option>
          </select>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
          >
            <option value="ALL">All Store Outlets</option>
            {storeBranches.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Stream Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Action Type</th>
                <th className="p-3.5">Performed By (User ID)</th>
                <th className="p-3.5">Store Branch</th>
                <th className="p-3.5">Entry Details</th>
                <th className="p-3.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-800 dark:text-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No activity logs recorded matching your filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getBadgeColor(
                          log.actionType
                        )}`}
                      >
                        {getActionIcon(log.actionType)}
                        <span>{log.actionType.replace('_', ' ')}</span>
                      </span>
                    </td>

                    <td className="p-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                        <span>{log.performedBy}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-normal">
                          {log.performedByRole}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-blue-500" />
                        <span>{log.storeBranch || 'Main Store Branch'}</span>
                      </div>
                    </td>

                    <td className="p-3.5 max-w-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      {log.details}
                    </td>

                    <td className="p-3.5 text-right font-extrabold font-mono text-slate-900 dark:text-white whitespace-nowrap">
                      {log.amount !== undefined ? `${shopProfile.currencySymbol} ${log.amount.toLocaleString()}` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
