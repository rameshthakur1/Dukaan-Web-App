import React, { useState } from 'react';
import { Invoice } from '../../types';
import { useApp } from '../../context/AppContext';
import { Printer, Share2, X, CheckCircle, Smartphone, QrCode } from 'lucide-react';

interface ThermalReceiptModalProps {
  invoice: Invoice;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ invoice, onClose }) => {
  const { shopProfile } = useApp();
  const [receiptWidth, setReceiptWidth] = useState<'58mm' | '80mm' | 'A4'>(
    shopProfile.thermalPrinterType === '58mm' ? '58mm' : '80mm'
  );

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = `*${shopProfile.shopName}*\n*Tax Invoice: ${invoice.invoiceNo}*\nDate: ${new Date(invoice.createdAt).toLocaleDateString()}\nCustomer: ${invoice.customerName} (${invoice.customerPhone})\n\n` +
      invoice.items.map((i) => `• ${i.productName} (${i.quantity} ${i.unitName}) @ NPR ${i.unitPrice} = NPR ${i.totalPrice}`).join('\n') +
      `\n\nSubtotal: NPR ${invoice.subtotal}\nDiscount: NPR ${invoice.discount}\n*Net Total: NPR ${invoice.netAmount}*\n` +
      `Paid via Cash: NPR ${invoice.splitPayment.cash}, QR: NPR ${invoice.splitPayment.qr}, Udharo: NPR ${invoice.splitPayment.udharo}\n\nThank you for shopping with us!`;

    const encoded = encodeURIComponent(text);
    const phone = invoice.customerPhone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone.length >= 10 ? '977' + phone : phone}?text=${encoded}`, '_blank');
  };

  const getWidthClass = () => {
    if (receiptWidth === '58mm') return 'w-[280px] text-xs';
    if (receiptWidth === '80mm') return 'w-[360px] text-xs';
    return 'w-full max-w-xl text-sm';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible !important;
          }
          #printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 16px !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 my-auto overflow-hidden">
        {/* Header Controls (No Print) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
              Receipt & Invoice Preview ({invoice.invoiceNo})
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Format toggle */}
            <div className="flex items-center rounded-lg bg-slate-200/80 p-1 dark:bg-slate-800 text-xs font-semibold">
              {(['58mm', '80mm', 'A4'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setReceiptWidth(fmt)}
                  className={`rounded-md px-2.5 py-1 transition cursor-pointer ${
                    receiptWidth === fmt
                      ? 'bg-white text-indigo-600 shadow-xs dark:bg-indigo-600 dark:text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Canvas */}
        <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-4 sm:p-8 flex justify-center items-start min-h-[350px]">
          {/* Paper Thermal Container - Complete background wrapping down to bottom for all sizes */}
          <div
            id="printable-receipt"
            className={`${getWidthClass()} bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-5 sm:p-6 shadow-2xl rounded-2xl border-2 border-slate-200 dark:border-slate-700 font-mono transition-all shrink-0 flex flex-col space-y-3`}
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1">
              <h2 className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white uppercase font-sans">
                {shopProfile.shopName}
              </h2>
              {shopProfile.tagline && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans italic">
                  "{shopProfile.tagline}"
                </p>
              )}
              <p className="text-[11px] leading-tight text-slate-600 dark:text-slate-300 font-sans">
                {typeof shopProfile.address === 'string'
                  ? shopProfile.address
                  : (shopProfile.address?.fullAddress || `${shopProfile.address?.municipality || ''}, ${shopProfile.address?.district || ''}`)}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">
                Phone: {shopProfile.phone}
              </p>
              {shopProfile.panVatNo && (
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-sans">
                  PAN/VAT No: {shopProfile.panVatNo}
                </p>
              )}
              <p className="text-[10px] text-slate-400 font-sans pt-0.5">
                Shop Code: {shopProfile.shopCode}
              </p>
            </div>

            {/* Meta Info */}
            <div className="py-2 border-b border-dashed border-slate-300 dark:border-slate-700 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Invoice:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{invoice.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Date:</span>
                <span className="text-slate-800 dark:text-slate-200">{new Date(invoice.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Customer:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{invoice.customerName}</span>
              </div>
              {invoice.customerPhone !== 'N/A' && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Phone:</span>
                  <span className="text-slate-800 dark:text-slate-200">{invoice.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Cashier:</span>
                <span className="text-slate-800 dark:text-slate-200">{invoice.cashierName}</span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="py-2 border-b border-dashed border-slate-300 dark:border-slate-700">
              <div className="flex justify-between font-bold text-[11px] mb-2 pb-1 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <span className="w-1/2">Item</span>
                <span className="w-1/6 text-center">Qty</span>
                <span className="w-1/3 text-right">Amt (NPR)</span>
              </div>
              <div className="space-y-2">
                {invoice.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px] leading-tight">
                    <div className="w-1/2 pr-1">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {item.productName}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        @{item.unitPrice} / {item.unitName}
                      </div>
                    </div>
                    <div className="w-1/6 text-center font-medium text-slate-800 dark:text-slate-200">
                      {item.quantity} {item.unitName}
                    </div>
                    <div className="w-1/3 text-right font-bold text-slate-900 dark:text-slate-100">
                      {item.totalPrice.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="py-2.5 border-b border-dashed border-slate-300 dark:border-slate-700 text-[11px] space-y-1.5">
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>Subtotal:</span>
                <span className="font-bold">NPR {invoice.subtotal.toLocaleString()}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Discount:</span>
                  <span>- NPR {invoice.discount.toLocaleString()}</span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>VAT ({shopProfile.vatRate}%):</span>
                  <span>+ NPR {invoice.taxAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm pt-1.5 text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800">
                <span>NET TOTAL:</span>
                <span className="text-indigo-600 dark:text-indigo-400">NPR {invoice.netAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Split Payment Breakdown */}
            <div className="py-2 border-b border-dashed border-slate-300 dark:border-slate-700 text-[11px] space-y-1">
              <span className="font-bold text-[10px] uppercase text-slate-500 dark:text-slate-400 block">Payment Breakdown:</span>
              {invoice.splitPayment.cash > 0 && (
                <div className="flex justify-between text-slate-800 dark:text-slate-200">
                  <span>• Cash Received:</span>
                  <span className="font-bold">NPR {invoice.splitPayment.cash.toLocaleString()}</span>
                </div>
              )}
              {invoice.splitPayment.qr > 0 && (
                <div className="flex justify-between text-indigo-600 dark:text-indigo-400 font-bold">
                  <span>• Digital QR ({invoice.splitPayment.qrType || 'Fonepay/eSewa'}):</span>
                  <span>NPR {invoice.splitPayment.qr.toLocaleString()}</span>
                </div>
              )}
              {invoice.splitPayment.udharo > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
                  <span>• Udharo Khata Credit:</span>
                  <span>NPR {invoice.splitPayment.udharo.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Footer Thank You - Full background container enclosure */}
            <div className="pt-3 pb-1 text-center space-y-1 text-[10px] text-slate-500 dark:text-slate-400 font-sans">
              <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Dhanyabad! Thank you for your visit!
              </p>
              <p>Goods once sold can be exchanged within 3 days with receipt.</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 pt-1 font-mono">
                Powered by Dukaan POS • www.dukaanpos.np
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons (No Print) */}
        <div className="no-print flex items-center justify-between border-t border-slate-200 px-5 py-3.5 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 active:scale-95 cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Send Bill via WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 active:scale-95 cursor-pointer"
              id="print-thermal-btn"
            >
              <Printer className="h-4 w-4" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
