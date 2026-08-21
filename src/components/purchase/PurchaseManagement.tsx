import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StockPurchase } from '../../types';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import { findProductAndUnitByBarcode, isBarcodeMatch } from '../../utils/barcodeMatcher';
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
  Eye,
  Printer,
  X,
  Wallet,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const PurchaseManagement: React.FC = () => {
  const { purchases, suppliers, products, recordStockPurchase, shopProfile } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<StockPurchase | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

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
    const match = findProductAndUnitByBarcode(products, term.trim());
    if (match) return match.product;

    const clean = term.trim().toLowerCase();
    return products.find(
      (p) =>
        (p.name && p.name.toLowerCase().includes(clean)) ||
        (p.id && p.id.toLowerCase() === clean) ||
        isBarcodeMatch(p.barcode, term) ||
        isBarcodeMatch(p.sku, term) ||
        isBarcodeMatch(p.cartonBarcode, term) ||
        isBarcodeMatch(p.unit?.secondaryBarcode, term)
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
            cartonBarcode: matched.cartonBarcode || matched.unit?.secondaryBarcode,
            conversionRatio: matched.unit?.conversionRatio ?? 1,
            secondaryCostPrice: matched.unit?.secondaryCostPrice,
            secondarySellingPrice: matched.unit?.secondarySellingPrice,
            secondaryUnit: matched.unit?.secondaryUnit,
            category: matched.category,
            unitName: matched.unit?.primaryUnit || 'Packet',
            quantity: 1,
            costPrice: matched.unit?.primaryCostPrice ?? 0,
            sellingPrice: matched.unit?.primarySellingPrice ?? 0,
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
    const matched = suppliers.find((s) => s.name.toLowerCase() === name.trim().toLowerCase());
    if (matched) {
      setSupplierNameInput(matched.name);
      setSupplierPhoneInput(matched.phone && matched.phone !== 'N/A' ? matched.phone : '');
    } else {
      setSupplierNameInput(name);
    }
  };

  // Populate item fields if selected from existing catalog dropdown
  const handleSelectExistingProduct = (index: number, prodName: string) => {
    const prod = products.find((p) => p.name.toLowerCase() === prodName.trim().toLowerCase());
    const updated = [...purchaseItems];
    if (prod) {
      updated[index] = {
        ...updated[index],
        productName: prod.name,
        sku: prod.sku || '',
        barcode: prod.barcode || '',
        cartonBarcode: prod.cartonBarcode || prod.unit?.secondaryBarcode || '',
        conversionRatio: prod.unit?.conversionRatio ?? 1,
        secondaryCostPrice: prod.unit?.secondaryCostPrice,
        secondarySellingPrice: prod.unit?.secondarySellingPrice,
        secondaryUnit: prod.unit?.secondaryUnit,
        category: prod.category,
        unitName: prod.unit?.primaryUnit || 'Packet',
        costPrice: prod.unit?.primaryCostPrice ?? 0,
        sellingPrice: prod.unit?.primarySellingPrice ?? 0,
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

  // Filtered purchases from Supabase / AppContext
  const filteredPurchases = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return purchases.filter(
      (p) =>
        p.supplierName.toLowerCase().includes(q) ||
        p.purchaseNo.toLowerCase().includes(q) ||
        p.invoiceRef.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q)) ||
        p.items.some((it) => it.productName.toLowerCase().includes(q) || (it.barcode && it.barcode.toLowerCase().includes(q)))
    );
  }, [purchases, searchQuery]);

  // Aggregate metrics
  const totalPurchasesAmount = filteredPurchases.reduce((s, p) => s + (p.totalAmount || 0), 0);
  const totalCashPaid = filteredPurchases.reduce((s, p) => s + (p.cashPaid || 0), 0);
  const totalSupplierCredit = filteredPurchases.reduce((s, p) => s + (p.supplierCredit || 0), 0);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Truck className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Total Purchases</span>
          </div>
          <div className="mt-2 text-lg font-extrabold text-slate-900 dark:text-slate-100">
            NPR {totalPurchasesAmount.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Total wholesale inventory purchases</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Cash Paid</span>
          </div>
          <div className="mt-2 text-lg font-extrabold text-slate-900 dark:text-slate-100">
            NPR {totalCashPaid.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Total paid in cash to suppliers</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Wallet className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Vendor Udharo</span>
          </div>
          <div className="mt-2 text-lg font-extrabold text-slate-900 dark:text-slate-100">
            NPR {totalSupplierCredit.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Pending credit balance to suppliers</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <FileText className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Purchase Bills</span>
          </div>
          <div className="mt-2 text-lg font-extrabold text-slate-900 dark:text-slate-100">
            {filteredPurchases.length} Bills
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Recorded inward stock invoices</p>
        </div>
      </div>

      {/* Main Search & Purchases List Table */}
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
                placeholder="Search supplier, bill no, ref..."
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
                <th className="p-3 font-semibold text-center border-r border-slate-200 dark:border-slate-800">Items</th>
                <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Bill Total</th>
                <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Cash Paid</th>
                <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Vendor Udharo</th>
                <th className="p-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-400">
                    No purchase logs found in Supabase database. Click "Log Purchase" to record wholesale inventory inflow.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((pur) => {
                  const isExpanded = expandedRowId === pur.id;
                  return (
                    <React.Fragment key={pur.id}>
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800/80 last:border-b-0">
                        <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 border-r border-slate-200 dark:border-slate-800/80">
                          <button
                            onClick={() => setExpandedRowId(isExpanded ? null : pur.id)}
                            className="flex items-center gap-1 hover:underline text-left"
                          >
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            <span>{pur.purchaseNo}</span>
                          </button>
                        </td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800/80">
                          {pur.supplierName}
                        </td>
                        <td className="p-3 font-mono text-slate-500 border-r border-slate-200 dark:border-slate-800/80">{pur.invoiceRef || 'REF-N/A'}</td>
                        <td className="p-3 text-slate-500 border-r border-slate-200 dark:border-slate-800/80">
                          {new Date(pur.purchaseDate).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800/80 font-medium text-slate-600 dark:text-slate-400">
                          {pur.items.length} items ({pur.items.reduce((s, i) => s + (Number(i.quantity) || 0), 0)} pcs)
                        </td>
                        <td className="p-3 text-right font-extrabold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800/80">
                          NPR {pur.totalAmount.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-800/80">
                          NPR {pur.cashPaid.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-extrabold border-r border-slate-200 dark:border-slate-800/80">
                          {pur.supplierCredit > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                              NPR {pur.supplierCredit.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">Cleared</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setViewingPurchase(pur)}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900 transition"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View Bill</span>
                          </button>
                        </td>
                      </tr>

                      {/* Expandable item lines */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 dark:bg-slate-800/30">
                          <td colSpan={9} className="p-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Items in Purchase {pur.purchaseNo} ({pur.supplierName}):
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {pur.items.map((it, itemIdx) => (
                                  <div
                                    key={itemIdx}
                                    className="rounded-lg border border-slate-100 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-800/60 text-xs"
                                  >
                                    <div className="font-bold text-slate-900 dark:text-slate-100">
                                      {it.productName}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      Barcode: {it.barcode || it.sku || 'N/A'}
                                    </div>
                                    <div className="flex justify-between items-center mt-1 text-[11px]">
                                      <span>
                                        {it.quantity} {it.unitName} × NPR {it.costPrice}
                                      </span>
                                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                                        NPR {it.totalAmount.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
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

            {/* SCAN NOTIFICATION BANNER INSIDE MODAL */}
            {scanNotification && (
              <div className="mx-6 mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs font-medium text-indigo-900 shadow-2xs dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200 animate-in fade-in duration-200">
                {scanNotification}
              </div>
            )}

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
                      <option key={s.id} value={s.name} label={`[${s.id.toUpperCase()}] ${s.phone || ''}`} />
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

              {/* Quick Barcode Scanner Bar */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60">
                <div className="flex items-center gap-2">
                  <Barcode className="h-4 w-4 text-indigo-500 shrink-0" />
                  <input
                    type="text"
                    value={quickScanInput}
                    onChange={(e) => setQuickScanInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        processScannedOrTypedCode(quickScanInput, null);
                        setQuickScanInput('');
                      }
                    }}
                    placeholder="Scan Barcode or Type Product Name/SKU to auto-fill..."
                    className="w-full bg-transparent text-xs font-medium text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setActiveScanRowIndex('QUICK');
                      setIsScannerOpen(true);
                    }}
                    className="flex items-center gap-1 shrink-0 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>Camera</span>
                  </button>
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
                      ⚡ Entering new items here auto-saves them into your inventory catalog!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="flex items-center gap-1 self-start sm:self-auto rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Another Item Row</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {purchaseItems.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-3 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-4 space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            Product Name *
                          </label>
                          <input
                            type="text"
                            required
                            list={`catalog-options-${index}`}
                            value={item.productName}
                            onChange={(e) => handleSelectExistingProduct(index, e.target.value)}
                            placeholder="e.g. Wai Wai Noodles 75g"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          />
                          <datalist id={`catalog-options-${index}`}>
                            {products.map((p) => (
                              <option key={p.id} value={p.name} label={`[Stock: ${p.stockQty}] Cost: NPR ${p.unit?.primaryCostPrice ?? 0}`} />
                            ))}
                          </datalist>
                        </div>

                        <div className="sm:col-span-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                              Barcode / SKU
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveScanRowIndex(index);
                                setIsScannerOpen(true);
                              }}
                              className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"
                            >
                              <Camera className="h-3 w-3" /> Scan
                            </button>
                          </div>
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
                            placeholder="Scan or type barcode"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            Unit
                          </label>
                          <select
                            value={item.unitName}
                            onChange={(e) => {
                              const updated = [...purchaseItems];
                              updated[index].unitName = e.target.value;
                              setPurchaseItems(updated);
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          >
                            <option value="Packet">Packet</option>
                            <option value="Piece">Piece</option>
                            <option value="Kg">Kg</option>
                            <option value="Box">Box</option>
                            <option value="Carton">Carton</option>
                            <option value="Liter">Liter</option>
                            <option value="Gram">Gram</option>
                            <option value="Dozen">Dozen</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            required
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...purchaseItems];
                              updated[index].quantity = e.target.value;
                              setPurchaseItems(updated);
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          />
                        </div>

                        <div className="sm:col-span-1 flex justify-center pb-1">
                          {purchaseItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemRow(index)}
                              className="text-slate-400 hover:text-rose-500 p-1 transition"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Pricing Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            Buying Cost Price (NPR) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            required
                            value={item.costPrice}
                            onChange={(e) => {
                              const updated = [...purchaseItems];
                              updated[index].costPrice = e.target.value;
                              setPurchaseItems(updated);
                            }}
                            placeholder="e.g. 18.00"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            Store Selling Price (NPR)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.sellingPrice}
                            onChange={(e) => {
                              const updated = [...purchaseItems];
                              updated[index].sellingPrice = e.target.value;
                              setPurchaseItems(updated);
                            }}
                            placeholder="e.g. 20.00"
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-600 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400"
                          />
                        </div>

                        <div className="flex items-center justify-between sm:justify-end sm:gap-4 self-end pb-1.5 text-xs">
                          <span className="text-slate-500 font-medium">Row Subtotal:</span>
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">
                            NPR {((Number(item.quantity) || 0) * (Number(item.costPrice) || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Settlement Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Purchase Notes / Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="e.g. Delivered via truck, credit payable in 15 days"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 resize-none"
                  />
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-800/60">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Total Bill Amount:</span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      NPR {totalPurchaseBill.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Cash Paid Now (NPR):
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={cashPaidInput}
                      onChange={(e) => setCashPaidInput(e.target.value)}
                      placeholder="0"
                      className="w-32 text-right rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-emerald-600 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400"
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Supplier Udharo (Credit):
                    </span>
                    <span
                      className={`text-sm font-extrabold ${
                        supplierUdharoCredit > 0
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {supplierUdharoCredit > 0 ? `NPR ${supplierUdharoCredit.toLocaleString()}` : 'Cleared'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Record Stock Purchase</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW & PRINT PURCHASE BILL MODAL */}
      {viewingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Stock Purchase Voucher #{viewingPurchase.purchaseNo}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Vendor Ref: {viewingPurchase.invoiceRef || 'N/A'} • {new Date(viewingPurchase.purchaseDate).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingPurchase(null)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto" id="printable-purchase-bill">
              {/* Store & Supplier Header */}
              <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-800">
                <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  {shopProfile.shopName || 'Main Store'}
                </h4>
                <p className="text-xs text-slate-500">
                  Phone: {shopProfile.phone || 'N/A'} | PAN/VAT: {shopProfile.panVatNo || 'N/A'}
                </p>
                <div className="mt-2 inline-block rounded-md bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  WHOLESALE STOCK PURCHASE BILL
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1.5 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier Name:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewingPurchase.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vendor Ref No:</span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{viewingPurchase.invoiceRef || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Purchase Date:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{new Date(viewingPurchase.purchaseDate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cash Paid:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">NPR {viewingPurchase.cashPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Supplier Credit (Udharo):</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {viewingPurchase.supplierCredit > 0 ? `NPR ${viewingPurchase.supplierCredit.toLocaleString()}` : 'Cleared'}
                  </span>
                </div>
                {viewingPurchase.performedBy && (
                  <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Logged By:</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">{viewingPurchase.performedBy}</span>
                  </div>
                )}
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">Item Breakdown</h5>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  {viewingPurchase.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between p-2.5 text-xs bg-white dark:bg-slate-900">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{item.productName}</div>
                        <div className="text-[10px] text-slate-500">
                          {item.quantity} {item.unitName} × NPR {item.costPrice.toLocaleString()} (Sell: NPR {item.sellingPrice})
                        </div>
                      </div>
                      <div className="font-extrabold text-slate-900 dark:text-slate-100">
                        NPR {item.totalAmount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 text-sm font-extrabold">
                <span className="text-slate-700 dark:text-slate-300">Total Purchase Amount</span>
                <span className="text-indigo-600 dark:text-indigo-400">NPR {viewingPurchase.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Printer className="h-4 w-4" />
                <span>Print Bill</span>
              </button>

              <button
                onClick={() => setViewingPurchase(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BARCODE SCANNER MODAL */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          setActiveScanRowIndex(null);
        }}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
};
