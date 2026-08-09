import React from 'react';
import {
  X,
  Printer,
  FileText,
  Building2,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { Invoice, Product, Expense, ShopProfile } from '../../types';

interface ReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateFilterLabel: string;
  customStartDate?: string;
  customEndDate?: string;
  shopProfile: ShopProfile;
  kpiInvoices: Invoice[];
  kpiExpenses: Expense[];
  products: Product[];
  kpiTotalRevenue: number;
  kpiTotalProfit: number;
  kpiTotalExpenses: number;
  kpiNetOperatingProfit: number;
  kpiTotalCash: number;
  kpiTotalQr: number;
  kpiTotalUdharo: number;
}

export const ReportPdfModal: React.FC<ReportPdfModalProps> = ({
  isOpen,
  onClose,
  dateFilterLabel,
  customStartDate,
  customEndDate,
  shopProfile,
  kpiInvoices,
  kpiExpenses,
  products,
  kpiTotalRevenue,
  kpiTotalProfit,
  kpiTotalExpenses,
  kpiNetOperatingProfit,
  kpiTotalCash,
  kpiTotalQr,
  kpiTotalUdharo,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDateStr = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const rangeDescription =
    dateFilterLabel === 'Custom Date' && customStartDate && customEndDate
      ? `${customStartDate} to ${customEndDate}`
      : `${dateFilterLabel} Report`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #pdf-printable-report, #pdf-printable-report * {
            visibility: visible !important;
          }
          #pdf-printable-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 20px !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="flex flex-col w-full max-w-3xl max-h-[92vh] rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="no-print flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Shop Analytics & Financial Report PDF</span>
              </h3>
              <p className="text-xs text-slate-500">Preview & download/print official PDF statement</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-md active:scale-95"
              id="print-pdf-report-btn"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT DOCUMENT CONTAINER */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100" id="pdf-printable-report">
          {/* Shop Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-800 pb-5 gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {shopProfile.shopName || 'DUKAAN RETAIL STORE'}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1">
                {typeof shopProfile.address === 'string'
                  ? shopProfile.address
                  : (shopProfile.address?.fullAddress || `${shopProfile.address?.municipality || ''}, ${shopProfile.address?.district || ''}`)} | Tel: {shopProfile.phone}
              </p>
              {shopProfile.panVatNo && (
                <p className="text-xs text-slate-500 font-semibold">
                  PAN / VAT No: <span className="font-bold text-slate-800 dark:text-slate-200">{shopProfile.panVatNo}</span>
                </p>
              )}
            </div>

            <div className="sm:text-right bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <span className="inline-block rounded-md bg-blue-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white uppercase tracking-wider mb-1">
                Official Statement
              </span>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                FINANCIAL SUMMARY REPORT
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-bold mt-0.5">
                Period: {rangeDescription}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Generated: {currentDateStr}
              </p>
            </div>
          </div>

          {/* Key Financial Metrics Table */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span>1. Key Performance Indicators (NPR)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Sales Revenue</span>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400 block mt-1">
                  NPR {kpiTotalRevenue.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">{kpiInvoices.length} Bills Issued</span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-emerald-50/50 dark:bg-slate-800/50">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Gross Profit</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block mt-1">
                  NPR {kpiTotalProfit.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Selling - Buying Price</span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-rose-50/50 dark:bg-slate-800/50">
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase block">Shop Overheads / Expenses</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400 block mt-1">
                  NPR {kpiTotalExpenses.toLocaleString()}
                </span>
                <span className="text-[10px] text-rose-700 dark:text-rose-400 font-medium">{kpiExpenses.length} Expense Logs</span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-indigo-50/50 dark:bg-slate-800/50">
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase block">Net Operating Income</span>
                <span className={`text-lg font-black block mt-1 ${kpiNetOperatingProfit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
                  NPR {kpiNetOperatingProfit.toLocaleString()}
                </span>
                <span className="text-[10px] text-indigo-700 dark:text-indigo-400 font-medium">Profit - Overheads</span>
              </div>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">
              2. Payment Collection Breakdown
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Payment Mode</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount (NPR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  <tr>
                    <td className="py-2 px-3 font-bold text-teal-700 dark:text-teal-400">Cash in Till</td>
                    <td className="py-2 px-3 text-slate-500">Physical currency collected at counter</td>
                    <td className="py-2 px-3 text-right font-extrabold text-slate-900 dark:text-slate-100">
                      NPR {kpiTotalCash.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-indigo-700 dark:text-indigo-400">Digital QR Payments</td>
                    <td className="py-2 px-3 text-slate-500">eSewa, Khalti & Fonepay mobile QR transfers</td>
                    <td className="py-2 px-3 text-right font-extrabold text-slate-900 dark:text-slate-100">
                      NPR {kpiTotalQr.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-amber-700 dark:text-amber-400">Customer Udharo (Credit)</td>
                    <td className="py-2 px-3 text-slate-500">Unsettled credit logged into customer Khata</td>
                    <td className="py-2 px-3 text-right font-extrabold text-slate-900 dark:text-slate-100">
                      NPR {kpiTotalUdharo.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Shop Expenses Section */}
          {kpiExpenses.length > 0 && (
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-rose-600" />
                <span>3. Shop Expense Logs ({kpiExpenses.length})</span>
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Title / Description</th>
                      <th className="py-2 px-3">Paid To</th>
                      <th className="py-2 px-3 text-right">Amount (NPR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {kpiExpenses.map((exp) => (
                      <tr key={exp.id}>
                        <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{exp.expenseDate}</td>
                        <td className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300">{exp.category}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">{exp.title}</td>
                        <td className="py-2 px-3 text-slate-500">{exp.paidTo || '-'}</td>
                        <td className="py-2 px-3 text-right font-extrabold text-rose-600 dark:text-rose-400">
                          NPR {exp.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-700">
                    <tr>
                      <td colSpan={4} className="py-2 px-3 text-slate-700 dark:text-slate-300">Total Shop Expenses:</td>
                      <td className="py-2 px-3 text-right text-rose-600 dark:text-rose-400 font-extrabold">
                        NPR {kpiTotalExpenses.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Statement Footer */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300">
                Dukaan POS - Retail Store Management
              </p>
              <p>Computer Generated Official Financial Summary</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-600 dark:text-slate-400">Authorized Signature & Stamp</p>
              <div className="h-8 border-b border-dashed border-slate-400 w-36 mt-1 ml-auto"></div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar (Hidden on Print) */}
        <div className="no-print px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition shadow-md"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report / Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
