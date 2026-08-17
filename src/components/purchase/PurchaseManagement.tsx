import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StockPurchase } from '../../types';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import {
  Truck,
  Plus,
  Package,
  FileText,
  DollarSign,
  Building2,
  Layers,
  CheckCircle2,
  Search,
  Calendar,
  AlertCircle,
  Hash,
  Tag,
  ArrowRight,
  Camera,
  Barcode,
  Scan,
  Sparkles,
  Check,
} from 'lucide-react';

export const PurchaseManagement: React.FC = () => {
  const { purchases, suppliers, products, recordStockPurchase } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Barcode Scanner Modal states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeScanRowIndex, setActiveScanRowIndex] = useState<number | 'QUICK' | null>(null);
  const [quickScanInput, setQuickScanInput] = useState('');
  const [scanNotification, setScanNotification] = useState<string | null>(null);

  // Form states
  const [supplierNameInput, setSupplierNameInput] = useState('');
  const [supplierPhoneInput, setSupplierPhoneInput] = useState('');
  const [invoiceRefInput, setInvoiceRefInput] = useState('');
  const [cashPaidInput, setCashPaidInput] = useState<number | string>('');
  const [notesInput, setNotesInput] = useState('');

  // Purchase items array
  const [purchaseItems, setPurchaseItems] = useState<
    {
      productName: string;
      sku: string;
      barcode: string;
      cartonBarcode?: string;
      conversionRatio?: number | string;
      secondaryCostPrice?: number | string;
      secondarySellingPrice?: number | string;
      secondaryUnit?: string;
      category: string;
      unitName: string;
      quantity: number | string;
      costPrice: number | string;
      sellingPrice: number | string;
    }[]
  >([
    {
      productName: '',
      sku: '',
      barcode: '',
      category: 'General Grocery',
      unitName: 'Packet',
      quantity: 1,
      costPrice: '',
      sellingPrice: '',
    },
  ]);

  // Find product by term (barcode, SKU, ID, cartonBarcode, or name)
  const findCatalogProduct = (term: string) => {
    if (!term.trim()) return null;
    const clean = term.trim().toLowerCase();
    return products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === clean) ||
        (p.sku && p.sku.toLowerCase() === clean) ||
        (p.id && p.id.toLowerCase() === clean) ||
        (p.name && p.name.toLowerCase() === clean) ||
        (p.cartonBarcode && p.cartonBarcode.toLowerCase() === clean) ||
        (p.unit?.secondaryBarcode && p.unit.secondaryBarcode.toLowerCase() === clean)
    );
  };

  // Handle auto-filling product when scanned or manually typed
  const processScannedOrTypedCode = (code: string, targetRowIndex?: number | null) => {
    if (!code.trim()) return;
    const matched = findCatalogProduct(code);

    if (matched) {
      setScanNotification(
        `✅ Matched existing: [${(matched.id || '').toUpperCase()}] ${matched.name} | Cost: NPR ${matched.unit?.primaryCostPrice ?? 0} | Selling: NPR ${matched.unit?.primarySellingPrice ?? 0}`
      );
      setTimeout(() => setScanNotification(null), 5000);

      const updated = [...purchaseItems];
      if (targetRowIndex !== undefined && targetRowIndex !== null && typeof targetRowIndex === 'number' && targetRowIndex >= 0) {
        // Update specific row
        updated[targetRowIndex] = {
          ...updated[targetRowIndex],
          productName: matched.name,
          sku: matched.sku || '',
          barcode: matched.barcode || '',
          cartonBarcode: matched.cartonBarcode || matched.unit?.secondaryBarcode || '',
          conversionRatio: matched.unit?.conversionRatio ?? 1,
          secondaryCostPrice: matched.unit?.secondaryCostPrice,
          secondarySellingPrice: matched.unit?.secondarySellingPrice,
          secondaryUnit: matched.unit?.secondaryUnit,
          category: matched.category || 'General Grocery',
          unitName: matched.unit?.primaryUnit || 'Packet',
          costPrice: matched.unit?.primaryCostPrice ?? 0,
          sellingPrice: matched.unit?.primarySellingPrice ?? 0,
        };
        setPurchaseItems(updated);
      } else {
        // Quick Scan: Fill first empty row or append new row
        const emptyIdx = updated.findIndex((i) => !i.productName.trim());
        if (emptyIdx !== -1) {
          updated[emptyIdx] = {
            ...updated[emptyIdx],
            productName: matched.name,
            sku: matched.sku || '',
            barcode: matched.barcode || '',
            cartonBarcode: matched.cartonBarcode || matched.unit?.secondaryBarcode || '',
            conversionRatio: matched.unit?.conversionRatio ?? 1,
            secondaryCostPrice: matched.unit?.secondaryCostPrice,
            secondarySellingPrice: matched.unit?.secondarySellingPrice,
            secondaryUnit: matched.unit?.secondaryUnit,
            category: matched.category || 'General Grocery',
            unitName: matched.unit?.primaryUnit || 'Packet',
            costPrice: matched.unit?.primaryCostPrice ?? 0,
            sellingPrice: matched.unit?.primarySellingPrice ?? 0,
            quantity: 1,
          };
        } else {
          updated.push({
            productName: matched.name,
            sku: matched.sku,
            barcode: matched.barcode,
            cartonBarcode: matched.cartonBarcode || matched.unit.secondaryBarcode,
            conversionRatio: matched.unit.conversionRatio,
            secondaryCostPrice: matched.unit.secondaryCostPrice,
            secondarySellingPrice: matched.unit.secondarySellingPrice,
            secondaryUnit: matched.unit.secondaryUnit,
            category: matched.category,
            unitName: matched.unit.primaryUnit,
            quantity: 1,
            costPrice: matched.unit.primaryCostPrice,
            sellingPrice: matched.unit.primarySellingPrice,
          });
        }
        setPurchaseItems(updated);
      }
    } else {
      // New / Unregistered item
      setScanNotification(
        `ℹ️ Code "${code}" is not in catalog yet. Fill details below to auto-save it to catalog upon purchase!`
      );
      setTimeout(() => setScanNotification(null), 5000);

      const updated = [...purchaseItems];
      if (targetRowIndex !== undefined && targetRowIndex !== null && typeof targetRowIndex === 'number' && targetRowIndex >= 0) {
        updated[targetRowIndex] = {
          ...updated[targetRowIndex],
          barcode: code,
          sku: updated[targetRowIndex].sku || code,
        };
        setPurchaseItems(updated);
      } else {
        updated.push({
          productName: '',
          sku: code,
          barcode: code,
          category: 'General Grocery',
          unitName: 'Packet',
          quantity: 1,
          costPrice: '',
          sellingPrice: '',
        });
        setPurchaseItems(updated);
      }
    }
  };

  // Handle Scan Modal Success
  const handleScanSuccess = (scannedCode: string) => {
    processScannedOrTypedCode(scannedCode, typeof activeScanRowIndex === 'number' ? activeScanRowIndex : null);
    setActiveScanRowIndex(null);
  };

  // Selected supplier from dropdown helper
  const handleSelectSupplier = (name: string) => {
    const matched = suppliers.find((s) => s.name === name);
    if (matched) {
      setSupplierNameInput(matched.name);
      setSupplierPhoneInput(matched.phone);
    } else {
      setSupplierNameInput(name);
    }
  };

  // Populate item fields if selected from existing catalog dropdown
  const handleSelectExistingProduct = (index: number, prodName: string) => {
    const prod = products.find((p) => p.name === prodName);
    const updated = [...purchaseItems];
    if (prod) {
      updated[index] = {
        ...updated[index],
        productName: prod.name,
        sku: prod.sku,
        barcode: prod.barcode,
        cartonBarcode: prod.cartonBarcode || prod.unit.secondaryBarcode,
        conversionRatio: prod.unit.conversionRatio,
        secondaryCostPrice: prod.unit.secondaryCostPrice,
        secondarySellingPrice: prod.unit.secondarySellingPrice,
        secondaryUnit: prod.unit.secondaryUnit,
        category: prod.category,
        unitName: prod.unit.primaryUnit,
        costPrice: prod.unit.primaryCostPrice,
        sellingPrice: prod.unit.primarySellingPrice,
      };
    } else {
      updated[index].productName = prodName;
    }
    setPurchaseItems(updated);
  };

  // Add Item Row
  const addItemRow = () => {
    setPurchaseItems([
      ...purchaseItems,
      {
        productName: '',
        sku: '',
        barcode: '',
        category: 'General Grocery',
        unitName: 'Packet',
        quantity: 1,
        costPrice: '',
        sellingPrice: '',
      },
    ]);
  };

  // Remove Item Row
  const removeItemRow = (index: number) => {
    if (purchaseItems.length === 1) return;
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  // Total Purchase Bill Amount
  const totalPurchaseBill = purchaseItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const cost = Number(item.costPrice) || 0;
    return sum + qty * cost;
  }, 0);
  const numCashPaid = Number(cashPaidInput) || 0;
  const supplierUdharoCredit = Math.max(0, totalPurchaseBill - numCashPaid);

  // Submit Purchase Entry
  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierNameInput.trim()) {
      alert('Please enter or select a Supplier Name.');
      return;
    }

    const validItems = purchaseItems
      .filter((i) => i.productName.trim() && (Number(i.quantity) || 0) > 0)
      .map((i) => ({
        productName: i.productName.trim(),
        sku: i.sku || '',
        barcode: i.barcode || '',
        cartonBarcode: i.cartonBarcode || undefined,
        conversionRatio: i.conversionRatio !== undefined && i.conversionRatio !== '' ? Number(i.conversionRatio) : undefined,
        secondaryCostPrice: i.secondaryCostPrice !== undefined && i.secondaryCostPrice !== '' ? Number(i.secondaryCostPrice) : undefined,
        secondarySellingPrice: i.secondarySellingPrice !== undefined && i.secondarySellingPrice !== '' ? Number(i.secondarySellingPrice) : undefined,
        secondaryUnit: i.secondaryUnit || undefined,
        category: i.category || 'General Grocery',
        unitName: i.unitName || 'Packet',
        quantity: Number(i.quantity) || 1,
        costPrice: Number(i.costPrice) || 0,
        sellingPrice: Number(i.sellingPrice) || 0,
      }));

    if (validItems.length === 0) {
      alert('Please enter at least one valid purchase item with product name and quantity.');
      return;
    }

    recordStockPurchase({
      supplierName: supplierNameInput.trim(),
      supplierPhone: supplierPhoneInput.trim(),
      invoiceRef: invoiceRefInput.trim() || 'REF-N/A',
      items: validItems,
      cashPaid: numCashPaid,
      notes: notesInput.trim(),
    });

    setIsModalOpen(false);
    // Reset form
    setSupplierNameInput('');
    setSupplierPhoneInput('');
    setInvoiceRefInput('');
    setCashPaidInput('');
    setNotesInput('');
    setPurchaseItems([
      {
        productName: '',
        sku: '',
        barcode: '',
        category: 'General Grocery',
        unitName: 'Packet',
        quantity: 1,
        costPrice: '',
        sellingPrice: '',
      },
    ]);
  };


  // Filtered purchases
  const filteredPurchases = purchases.filter(
    (p) =>
      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.purchaseNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.invoiceRef.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      {/* Search & Purchases List Table */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            Wholesale Purchase Bills ({filteredPurchases.length})
          </h3>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search supplier or purchase ref..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <button
              onClick={() => {
                setIsModalOpen(true);
                setCashPaidInput(0);
              }}
              className="flex items-center gap-1.5 shrink-0 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              id="log-stock-purchase-btn"
              title="Log New Stock Purchase"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Log Purchase</span>
            </button>
          </div>
        </div>

        {/* Purchase Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/90 text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
                <th className="p-3 font-semibold border-r border-slate-200 dark:border-slate-800">Purchase No</th>
                <th className="p-3 font-semibold border-r border-slate-200 dark:border-slate-800">Supplier Name</th>
                <th className="p-3 font-semibold border-r border-slate-200 dark:border-slate-800">Vendor Ref</th>
                <th className="p-3 font-semibold border-r border-slate-200 dark:border-slate-800">Date</th>
                <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Bill Total</th>
                <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Cash Paid</th>
                <th className="p-3 font-semibold text-right">Vendor Udharo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No purchase logs found. Click "Log New Stock Purchase" to record wholesale inventory inflow.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800/80 last:border-b-0">
                    <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 border-r border-slate-200 dark:border-slate-800/80">
                      {pur.purchaseNo}
                    </td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800/80">
                      {pur.supplierName}
                    </td>
                    <td className="p-3 font-mono text-slate-500 border-r border-slate-200 dark:border-slate-800/80">{pur.invoiceRef}</td>
                    <td className="p-3 text-slate-500 border-r border-slate-200 dark:border-slate-800/80">
                      {new Date(pur.purchaseDate).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right font-extrabold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800/80">
                      NPR {pur.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-800/80">
                      NPR {pur.cashPaid.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-extrabold text-amber-600 dark:text-amber-400">
                      {pur.supplierCredit > 0 ? `NPR ${pur.supplierCredit.toLocaleString()}` : 'Cleared'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOG NEW STOCK PURCHASE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Record Wholesale Stock Purchase
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="p-6 space-y-5">
              {/* Supplier & Ref Form */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Supplier / Vendor Name *
                  </label>
                  <input
                    type="text"
                    required
                    list="supplier-options"
                    value={supplierNameInput}
                    onChange={(e) => handleSelectSupplier(e.target.value)}
                    placeholder="e.g. CG Foods Nepal"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <datalist id="supplier-options">
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name} label={`[${s.id.toUpperCase()}] ${s.phone}`} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Supplier Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={supplierPhoneInput}
                    onChange={(e) => setSupplierPhoneInput(e.target.value)}
                    placeholder="e.g. 9851022334"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Vendor Bill Ref No.
                  </label>
                  <input
                    type="text"
                    value={invoiceRefInput}
                    onChange={(e) => setInvoiceRefInput(e.target.value)}
                    placeholder="e.g. CG-BILL-9982"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-semibold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Stock Items Received
                    </label>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      ⚡ Scan barcode or select existing product — auto-fills Name, Code, Buying Price & Selling Price!
                    </p>
                  </div>

                  {/* Camera Barcode Scan & Quick Search Button Bar */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveScanRowIndex('QUICK');
                        setIsScannerOpen(true);
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition active:scale-95"
                      id="scan-barcode-camera-btn"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Scan Barcode Camera</span>
                    </button>
                  </div>
                </div>

                {/* Quick Scan / Manual Type Search Bar */}
                <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/60 p-2 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                  <div className="relative flex-1">
                    <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-600 dark:text-indigo-400" />
                    <input
                      type="text"
                      value={quickScanInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuickScanInput(val);
                        // Auto-detect 13-digit EAN/UPC/GTIN barcode automatically
                        if (/^\d{13}$/.test(val.trim())) {
                          processScannedOrTypedCode(val.trim());
                          setQuickScanInput('');
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          processScannedOrTypedCode(quickScanInput);
                          setQuickScanInput('');
                        }
                      }}
                      placeholder="Type or scan 13-digit Barcode / Product Code / SKU..."
                      className="w-full rounded-lg border border-indigo-200 bg-white pl-9 pr-3 py-1.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-600 dark:border-indigo-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      processScannedOrTypedCode(quickScanInput);
                      setQuickScanInput('');
                    }}
                    className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Auto-Fill</span>
                  </button>
                </div>

                {/* Transient Scan Notification Toast */}
                {scanNotification && (
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200 shadow-xs transition">
                    {scanNotification}
                  </div>
                )}

                {/* Item Rows Cards */}
                <div className="space-y-3">
                  {purchaseItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40 shadow-xs"
                    >
                      {/* Row Top: Barcode / Code + Name + Scan Button */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        {/* Barcode / SKU Input */}
                        <div className="sm:col-span-4 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                            <span>Barcode / Product Code</span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveScanRowIndex(index);
                                setIsScannerOpen(true);
                              }}
                              className="text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 hover:underline text-[10px] font-bold"
                            >
                              <Camera className="h-3 w-3" />
                              <span>Scan</span>
                            </button>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={item.barcode || item.sku}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = [...purchaseItems];
                                updated[index].barcode = val;
                                updated[index].sku = val;
                                setPurchaseItems(updated);
                              }}
                              onBlur={(e) => {
                                if (e.target.value.trim()) {
                                  processScannedOrTypedCode(e.target.value, index);
                                }
                              }}
                              placeholder="Barcode or SKU..."
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>

                        {/* Item Name */}
                        <div className="sm:col-span-7 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Product Name *
                          </label>
                          <input
                            type="text"
                            required
                            list={`product-options-${index}`}
                            value={item.productName}
                            onChange={(e) => {
                              const nameVal = e.target.value;
                              handleSelectExistingProduct(index, nameVal);
                            }}
                            placeholder="Type product name or select from catalog..."
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          />
                          <datalist id={`product-options-${index}`}>
                            {products.map((p) => (
                              <option
                                key={p.id}
                                value={p.name}
                                label={`[${p.id.toUpperCase()}] Buying: NPR ${p.unit.primaryCostPrice} | Selling: NPR ${p.unit.primarySellingPrice}`}
                              />
                            ))}
                          </datalist>
                        </div>

                        {/* Delete Row Button */}
                        <div className="sm:col-span-1 text-right flex sm:justify-end items-center pt-2 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => removeItemRow(index)}
                            className="p-1 text-slate-400 hover:text-red-500 transition"
                            title="Remove row"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Row Bottom: Quantity, Buying Price (Cost), Selling Price, Subtotal */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        {/* Quantity */}
                        <div className="sm:col-span-3 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Quantity ({item.unitName || 'Pcs'})
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                const updated = [...purchaseItems];
                                updated[index].quantity = val;
                                setPurchaseItems(updated);
                              }
                            }}
                            onBlur={(e) => {
                              if (!e.target.value || Number(e.target.value) <= 0) {
                                const updated = [...purchaseItems];
                                updated[index].quantity = 1;
                                setPurchaseItems(updated);
                              }
                            }}
                            placeholder="1"
                            className="no-spinner w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </div>

                        {/* Cost Price (Buying Price) */}
                        <div className="sm:col-span-3 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Buying Cost (NPR) *
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.costPrice}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                const updated = [...purchaseItems];
                                updated[index].costPrice = val;
                                setPurchaseItems(updated);
                              }
                            }}
                            placeholder="0"
                            className="no-spinner w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-right text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          />
                        </div>

                        {/* Selling Price */}
                        <div className="sm:col-span-3 space-y-1">
                          <label className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                            Selling Price (NPR)
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.sellingPrice}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                const updated = [...purchaseItems];
                                updated[index].sellingPrice = val;
                                setPurchaseItems(updated);
                              }
                            }}
                            placeholder="0"
                            className="no-spinner w-full rounded-lg border border-indigo-200 bg-indigo-50/50 px-2.5 py-1.5 text-right text-xs font-bold text-indigo-700 outline-none focus:border-indigo-600 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300"
                          />
                        </div>

                        {/* Line Subtotal */}
                        <div className="sm:col-span-3 text-right space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Subtotal
                          </label>
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                            NPR {((Number(item.quantity) || 0) * (Number(item.costPrice) || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Optional Box / Carton Details Section */}
                      <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-700/60">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <span>Optional Carton / Box Packaging Details</span>
                          </span>
                          <span className="text-[9px] text-slate-400 italic">Optional</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">Box Barcode</label>
                            <input
                              type="text"
                              value={item.cartonBarcode || ''}
                              onChange={(e) => {
                                const updated = [...purchaseItems];
                                updated[index].cartonBarcode = e.target.value;
                                setPurchaseItems(updated);
                              }}
                              placeholder="e.g. 890123...BOX"
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">1 Box = Pcs</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.conversionRatio ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || /^\d*$/.test(val)) {
                                  const updated = [...purchaseItems];
                                  updated[index].conversionRatio = val;
                                  setPurchaseItems(updated);
                                }
                              }}
                              placeholder="e.g. 24"
                              className="no-spinner w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">Box Buy Price</label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={item.secondaryCostPrice ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                  const updated = [...purchaseItems];
                                  updated[index].secondaryCostPrice = val;
                                  setPurchaseItems(updated);
                                }
                              }}
                              placeholder="Box Cost Price"
                              className="no-spinner w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">Box Sell Price</label>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={item.secondarySellingPrice ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                  const updated = [...purchaseItems];
                                  updated[index].secondarySellingPrice = val;
                                  setPurchaseItems(updated);
                                }
                              }}
                              placeholder="Box Selling Price"
                              className="no-spinner w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-indigo-600 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-indigo-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addItemRow}
                  className="flex items-center gap-1.5 rounded-xl border border-dashed border-indigo-300 bg-white px-3.5 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:bg-slate-800 dark:text-indigo-400 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Another Item Row</span>
                </button>
              </div>

              {/* Payment Settlement Breakdown */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Total Wholesale Purchase Amount:
                  </span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    NPR {totalPurchaseBill.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-4 text-xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    Cash Paid to Vendor Now:
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-500">NPR</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={cashPaidInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setCashPaidInput(val);
                        }
                      }}
                      placeholder="0"
                      className="no-spinner w-32 rounded-lg border border-slate-200 bg-white px-3 py-1 text-right font-bold text-xs text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:border-indigo-500"
                    />
                  </div>
                </div>


                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    Pending Udharo Credit to Supplier:
                  </span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">
                    NPR {supplierUdharoCredit.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  id="confirm-stock-purchase-btn"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Log Purchase & Update Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Camera Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          setActiveScanRowIndex(null);
        }}
        onScanSuccess={handleScanSuccess}
        title="Scan Item Barcode for Purchase"
      />
    </div>
  );
};
