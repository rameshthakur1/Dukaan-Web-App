import React, { useState, useMemo } from 'react';
import { Invoice } from '../../types';
import { useApp } from '../../context/AppContext';
import { Printer, Share2, X, CheckCircle, Smartphone, QrCode, FileText, Download, Loader2, Globe, ExternalLink } from 'lucide-react';
import { shareInvoiceViaWhatsApp, downloadInvoicePdf } from '../../utils/pdfGenerator';

interface ThermalReceiptModalProps {
  invoice: Invoice;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ invoice, onClose }) => {
  const { shopProfile, activeShopCode, activeShopName, customers } = useApp();
  const [receiptWidth, setReceiptWidth] = useState<'58mm' | '80mm' | 'A4'>(
    shopProfile.thermalPrinterType === '58mm' ? '58mm' : '80mm'
  );
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [shareSuccessNotice, setShareSuccessNotice] = useState<string | null>(null);

  // Lookup matched customer to get customer PAN/VAT if available
  const customerPan = useMemo(() => {
    if (!customers || customers.length === 0) return undefined;
    const matched = customers.find(
      (c) =>
        (invoice.customerId && c.id === invoice.customerId) ||
        (invoice.customerPhone && invoice.customerPhone !== 'N/A' && c.phone === invoice.customerPhone) ||
        (invoice.customerName && invoice.customerName !== 'Walk-in Customer' && c.name.toLowerCase() === invoice.customerName.toLowerCase())
    );
    return matched?.panVat;
  }, [customers, invoice]);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = async (mode: 'auto' | 'web') => {
    if (isSharingWhatsApp) return;
    setIsSharingWhatsApp(true);
    setShareSuccessNotice(null);
    try {
      const res = await shareInvoiceViaWhatsApp(invoice, shopProfile, {
        activeShopCode,
        activeShopName,
        customerPan,
        mode,
      });

      if (mode === 'web' || res.method === 'WHATSAPP_WEB') {
        setShareSuccessNotice('📄 PDF downloaded! WhatsApp Web opened. Attach the downloaded PDF directly in your chat.');
      } else {
        setShareSuccessNotice('📄 PDF Bill generated & ready to send via WhatsApp.');
      }
      setTimeout(() => setShareSuccessNotice(null), 6000);
    } catch (err) {
      console.error('Failed to share PDF via WhatsApp', err);
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  const handlePdfDownload = async () => {
    if (isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    try {
      await downloadInvoicePdf(invoice, shopProfile, {
        activeShopCode,
        activeShopName,
        customerPan,
      });
    } catch (err) {
      console.error('Failed to download invoice PDF', err);
    } finally {
      setIsDownloadingPdf(false);
    }
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

      <div className="relative flex max-h-[94vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 my-auto overflow-hidden">
        {/* Header Controls (No Print) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                Receipt & Invoice ({invoice.invoiceNo})
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                PAN / VAT compliant official bill preview
              </p>
            </div>
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
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Informative notification when sharing via WhatsApp Web */}
        {shareSuccessNotice && (
          <div className="no-print bg-emerald-50 dark:bg-emerald-950/80 border-b border-emerald-200 dark:border-emerald-800 px-5 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{shareSuccessNotice}</span>
            </div>
            <button
              onClick={() => setShareSuccessNotice(null)}
              className="text-emerald-600 dark:text-emerald-300 hover:text-emerald-900 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

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
                {activeShopName || shopProfile.shopName}
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
                Phone: {shopProfile.phone || 'N/A'}
              </p>

              {/* Prominent Store PAN / VAT Number Display */}
              <div className="pt-0.5">
                <span className="inline-block rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 py-0.5 text-[11px] font-extrabold text-slate-900 dark:text-slate-100 font-sans tracking-wide">
                  PAN / VAT NO: {shopProfile.panVatNo || '987654321'}
                </span>
              </div>

              <p className="text-[10px] text-slate-400 font-sans pt-0.5">
                Shop Code: {activeShopCode || shopProfile.shopCode}
              </p>
            </div>

            {/* Meta Info */}
            <div className="py-2 border-b border-dashed border-slate-300 dark:border-slate-700 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Invoice No:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{invoice.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Date & Time:</span>
                <span className="text-slate-800 dark:text-slate-200">{new Date(invoice.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Customer:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{invoice.customerName}</span>
              </div>
              {invoice.customerPhone && invoice.customerPhone !== 'N/A' && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Mobile:</span>
                  <span className="text-slate-800 dark:text-slate-200">{invoice.customerPhone}</span>
                </div>
              )}
              {customerPan ? (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">Customer PAN:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{customerPan}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Seller PAN/VAT:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{shopProfile.panVatNo || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Cashier:</span>
                <span className="text-slate-800 dark:text-slate-200">{invoice.cashierName || 'Store Owner'}</span>
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

            {/* Totals Breakdown with VAT / PAN calculations */}
            <div className="py-2.5 border-b border-dashed border-slate-300 dark:border-slate-700 text-[11px] space-y-1.5">
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>Gross Subtotal:</span>
                <span className="font-bold">NPR {invoice.subtotal.toLocaleString()}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Discount:</span>
                  <span>- NPR {invoice.discount.toLocaleString()}</span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <>
                  <div className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>Taxable Subtotal:</span>
                    <span className="font-bold">NPR {(invoice.netAmount - invoice.taxAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>VAT ({shopProfile.vatRate || 13}%):</span>
                    <span className="font-bold">+ NPR {invoice.taxAmount.toLocaleString()}</span>
                  </div>
                </>
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

            {/* Footer Thank You */}
            <div className="pt-3 pb-1 text-center space-y-1 text-[10px] text-slate-500 dark:text-slate-400 font-sans">
              <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Dhanyabad! Thank you for your visit!
              </p>
              <p>Goods once sold can be exchanged within 3 days with receipt.</p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 pt-1 font-mono">
                Official Tax Bill • PAN: {shopProfile.panVatNo || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons (No Print) */}
        <div className="no-print flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-t border-slate-200 px-5 py-3.5 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
          {/* WhatsApp & PDF export actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. WhatsApp Web Button (Dedicated for desktop / web users) */}
            <button
              onClick={() => handleWhatsAppShare('web')}
              disabled={isSharingWhatsApp}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500 bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-extrabold text-white shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
              title="Download PDF Bill & launch WhatsApp Web directly to chat"
            >
              {isSharingWhatsApp ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              <span>WhatsApp Web (PDF)</span>
            </button>

            {/* 2. WhatsApp Mobile / Universal Share */}
            <button
              onClick={() => handleWhatsAppShare('auto')}
              disabled={isSharingWhatsApp}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 dark:border-emerald-800 px-3.5 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition active:scale-95 cursor-pointer disabled:opacity-50"
              title="Share PDF file on mobile or open WhatsApp"
            >
              <Share2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>WhatsApp App</span>
            </button>

            {/* 3. Direct Download PDF */}
            <button
              onClick={handlePdfDownload}
              disabled={isDownloadingPdf}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer active:scale-95 disabled:opacity-50"
              title="Download official PDF copy to your device"
            >
              {isDownloadingPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
              ) : (
                <Download className="h-3.5 w-3.5 text-indigo-500" />
              )}
              <span>Save PDF</span>
            </button>
          </div>

          {/* Close & Thermal Print dialog */}
          <div className="flex items-center gap-2 justify-end">
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
              <span>Print Bill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
