import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice, ShopProfile } from '../types';

export interface ShareInvoiceOptions {
  activeShopCode?: string;
  activeShopName?: string;
  customerPan?: string;
  mode?: 'auto' | 'app' | 'web';
}

/**
 * Generates an official PDF blob/file and downloadable object for an invoice.
 */
export async function generateInvoicePdfBlob(
  invoice: Invoice,
  shopProfile: ShopProfile,
  options?: ShareInvoiceOptions | string,
  activeShopNameParam?: string
): Promise<{ blob: Blob; filename: string }> {
  // Support both legacy arguments (activeShopCode, activeShopName) and modern options object
  const opts: ShareInvoiceOptions =
    typeof options === 'string'
      ? { activeShopCode: options, activeShopName: activeShopNameParam }
      : options || {};

  const activeShopCode = opts.activeShopCode || shopProfile.shopCode || 'SHOP-01';
  const activeShopName = opts.activeShopName || shopProfile.shopName || 'Retail Store';
  const customerPan = opts.customerPan;

  const filename = `Invoice_${invoice.invoiceNo}_${(invoice.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  // Check if printable receipt DOM element exists in current view
  const receiptElement = document.getElementById('printable-receipt');

  if (receiptElement) {
    try {
      // Capture the styled receipt visually via html2canvas
      const canvas = await html2canvas(receiptElement, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 80; // 80mm standard receipt width
      const pageHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [imgWidth, Math.max(pageHeight + 10, 100)],
      });

      pdf.addImage(imgData, 'PNG', 0, 5, imgWidth, pageHeight);
      const blob = pdf.output('blob');
      return { blob, filename };
    } catch (e) {
      console.warn('html2canvas capture failed, falling back to programmatic PDF generation', e);
    }
  }

  // High-fidelity Programmatic Fallback jsPDF generator
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const shopTitle = activeShopName;
  const shopPhone = shopProfile.phone || '';
  const shopAddress =
    typeof shopProfile.address === 'string'
      ? shopProfile.address
      : shopProfile.address?.fullAddress || `${shopProfile.address?.municipality || ''}, ${shopProfile.address?.district || ''}`;
  const panVatNo = shopProfile.panVatNo ? `PAN / VAT No: ${shopProfile.panVatNo}` : '';

  let y = 18;

  // Header Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(shopTitle.toUpperCase(), 105, y, { align: 'center' });
  y += 6.5;

  if (shopProfile.tagline) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`"${shopProfile.tagline}"`, 105, y, { align: 'center' });
    y += 5;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  if (shopAddress) {
    doc.text(shopAddress, 105, y, { align: 'center' });
    y += 5;
  }
  if (shopPhone) {
    doc.text(`Phone: ${shopPhone}`, 105, y, { align: 'center' });
    y += 5;
  }

  // Store PAN / VAT Badge in PDF Header
  if (panVatNo) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(panVatNo, 105, y, { align: 'center' });
    y += 5.5;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Shop Code: ${activeShopCode}`, 105, y, { align: 'center' });
  y += 7;

  // Horizontal divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);
  y += 8;

  // Tax Invoice Title & Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(`TAX INVOICE: ${invoice.invoiceNo}`, 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Date & Time: ${new Date(invoice.createdAt).toLocaleString()}`, 196, y, { align: 'right' });
  y += 7;

  // Customer & Bill Info Box (includes PAN & VAT numbers)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Customer Name: ${invoice.customerName}`, 18, y + 6);
  doc.text(`Customer Phone: ${invoice.customerPhone || 'N/A'}`, 18, y + 12);
  if (customerPan) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Customer PAN/VAT: ${customerPan}`, 18, y + 18);
    doc.setFont('helvetica', 'normal');
  } else {
    doc.text(`Customer PAN: N/A`, 18, y + 18);
  }

  const rightColX = 110;
  doc.text(`Cashier: ${invoice.cashierName || 'Store Owner'}`, rightColX, y + 6);
  doc.text(`Payment Status: ${invoice.paymentStatus || 'PAID'}`, rightColX, y + 12);
  if (shopProfile.panVatNo) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Seller PAN/VAT: ${shopProfile.panVatNo}`, rightColX, y + 18);
    doc.setFont('helvetica', 'normal');
  }
  y += 28;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('#', 18, y + 5.5);
  doc.text('Item Description', 30, y + 5.5);
  doc.text('Qty & Unit', 110, y + 5.5, { align: 'center' });
  doc.text('Unit Price', 150, y + 5.5, { align: 'right' });
  doc.text('Amount (NPR)', 190, y + 5.5, { align: 'right' });
  y += 10;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  invoice.items.forEach((item, idx) => {
    if (y > 255) {
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(30, 41, 59);
    doc.text(`${idx + 1}`, 18, y);
    doc.text(item.productName.substring(0, 45), 30, y);
    doc.text(`${item.quantity} ${item.unitName}`, 110, y, { align: 'center' });
    doc.text(`NPR ${item.unitPrice.toLocaleString()}`, 150, y, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`NPR ${item.totalPrice.toLocaleString()}`, 190, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 7;
  });

  y += 2;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, 196, y);
  y += 7;

  // Financial summary
  const startX = 115;
  doc.setFont('helvetica', 'normal');
  doc.text('Gross Subtotal:', startX, y);
  doc.text(`NPR ${invoice.subtotal.toLocaleString()}`, 190, y, { align: 'right' });
  y += 6;

  if (invoice.discount > 0) {
    doc.setTextColor(16, 185, 129);
    doc.text('Discount:', startX, y);
    doc.text(`- NPR ${invoice.discount.toLocaleString()}`, 190, y, { align: 'right' });
    doc.setTextColor(71, 85, 105);
    y += 6;
  }

  if (invoice.taxAmount > 0) {
    const taxableSubtotal = invoice.netAmount - invoice.taxAmount;
    doc.text('Taxable Amount:', startX, y);
    doc.text(`NPR ${taxableSubtotal.toLocaleString()}`, 190, y, { align: 'right' });
    y += 6;

    doc.text(`VAT (${shopProfile.vatRate || 13}%):`, startX, y);
    doc.text(`+ NPR ${invoice.taxAmount.toLocaleString()}`, 190, y, { align: 'right' });
    y += 6;
  }

  // Net total Box
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(startX - 4, y - 2, 85, 11, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(79, 70, 229);
  doc.text('NET TOTAL:', startX, y + 5.5);
  doc.text(`NPR ${invoice.netAmount.toLocaleString()}`, 190, y + 5.5, { align: 'right' });
  y += 17;

  // Payment Breakdown
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Payment Mode: Cash: NPR ${invoice.splitPayment?.cash || 0} | QR: NPR ${invoice.splitPayment?.qr || 0} | Udharo: NPR ${invoice.splitPayment?.udharo || 0}`,
    14,
    y
  );
  y += 12;

  // Footer note
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Dhanyabad! Thank you for your business! Goods once sold can be exchanged within 3 days with receipt.', 105, y, {
    align: 'center',
  });

  const blob = doc.output('blob');
  return { blob, filename };
}

/**
 * Downloads the invoice PDF to local device
 */
export async function downloadInvoicePdf(
  invoice: Invoice,
  shopProfile: ShopProfile,
  options?: ShareInvoiceOptions | string,
  activeShopNameParam?: string
) {
  const opts: ShareInvoiceOptions =
    typeof options === 'string'
      ? { activeShopCode: options, activeShopName: activeShopNameParam }
      : options || {};

  const { blob, filename } = await generateInvoicePdfBlob(invoice, shopProfile, opts);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Sends / shares the official invoice PDF via WhatsApp or WhatsApp Web.
 */
export async function shareInvoiceViaWhatsApp(
  invoice: Invoice,
  shopProfile: ShopProfile,
  options?: ShareInvoiceOptions | string,
  activeShopNameParam?: string
): Promise<{ method: 'NATIVE_FILE_SHARE' | 'WHATSAPP_WEB' | 'WHATSAPP_APP' }> {
  const opts: ShareInvoiceOptions =
    typeof options === 'string'
      ? { activeShopCode: options, activeShopName: activeShopNameParam }
      : options || {};

  const mode = opts.mode || 'auto';
  const activeShopName = opts.activeShopName || shopProfile.shopName;
  const panInfo = shopProfile.panVatNo ? `\n*PAN/VAT No:* ${shopProfile.panVatNo}` : '';

  const { blob, filename } = await generateInvoicePdfBlob(invoice, shopProfile, opts);
  const file = new File([blob], filename, { type: 'application/pdf' });

  const phone = (invoice.customerPhone || '').replace(/[^0-9]/g, '');
  const formattedPhone = phone.length >= 10 ? (phone.startsWith('977') ? phone : '977' + phone) : phone;

  const captionText =
    `📄 *TAX INVOICE BILL (PDF)*\n` +
    `*${activeShopName}*${panInfo}\n` +
    `*Bill No:* ${invoice.invoiceNo}\n` +
    `*Date:* ${new Date(invoice.createdAt).toLocaleDateString()}\n` +
    `*Customer:* ${invoice.customerName} (${invoice.customerPhone})\n` +
    `*Net Total:* NPR ${invoice.netAmount.toLocaleString()}\n\n` +
    `📎 Attached is the official PDF copy of your bill.\nThank you for shopping with us!`;

  // Always auto-download the generated PDF file so the user has the physical PDF ready
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);

  // If specific mode is WhatsApp Web requested by user
  if (mode === 'web') {
    const encoded = encodeURIComponent(captionText);
    const whatsappWebUrl = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encoded}`;
    window.open(whatsappWebUrl, '_blank');
    return { method: 'WHATSAPP_WEB' };
  }

  // If auto mode and native Web Share API with files is supported (e.g. mobile Chrome, Safari, Android/iOS)
  if (mode === 'auto' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `Bill ${invoice.invoiceNo} - ${activeShopName}`,
        text: captionText,
      });
      return { method: 'NATIVE_FILE_SHARE' };
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.log('Navigator share failed, falling back to WhatsApp link', err);
      } else {
        return { method: 'NATIVE_FILE_SHARE' };
      }
    }
  }

  // Universal WhatsApp Link
  const encoded = encodeURIComponent(captionText);
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encoded}`;
  window.open(whatsappUrl, '_blank');

  return { method: 'WHATSAPP_APP' };
}
