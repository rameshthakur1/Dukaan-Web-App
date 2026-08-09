import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, SplitPayment, Invoice, CartItem } from '../../types';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import {
  Search,
  Barcode,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  CreditCard,
  QrCode,
  Wallet,
  AlertCircle,
  UserPlus,
  Tag,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
  Phone,
  UserCheck,
  Eye,
  EyeOff,
  Camera,
  MapPin,
  Pause,
  Play,
  Clock,
  Bookmark,
  X,
  FileText,
  DollarSign,
} from 'lucide-react';

interface BillTabState {
  id: string;
  tabLabel: string;
  cart: CartItem[];
  discount: number;
  selectedCustomerId?: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
}

interface HeldBillState {
  id: string;
  holdNote: string;
  cart: CartItem[];
  discount: number;
  selectedCustomerId?: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  netTotal: number;
  heldAt: string;
}

const LOCAL_STORAGE_HELD_BILLS = 'DUKAAN_HELD_BILLS_v2';
const LOCAL_STORAGE_ACTIVE_TABS = 'DUKAAN_ACTIVE_BILL_TABS_v2';

export const POSBillingStation: React.FC = () => {
  const {
    products,
    posCart,
    setPosCart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    completeSaleInvoice,
    customers,
    shopProfile,
    addProduct,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'PRODUCTS' | 'CART'>('PRODUCTS');

  // Quick Add Unstocked Product Modal state
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [quickAddBarcode, setQuickAddBarcode] = useState('');
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddSellingPrice, setQuickAddSellingPrice] = useState<number | ''>('');
  const [quickAddCostPrice, setQuickAddCostPrice] = useState<number | ''>('');
  const [quickAddCategory, setQuickAddCategory] = useState('General Grocery');
  const [quickAddUnit, setQuickAddUnit] = useState('Packet');
  const [quickAddStockQty, setQuickAddStockQty] = useState<number>(10);

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showProfitInCheckout, setShowProfitInCheckout] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountInput, setDiscountInput] = useState<number>(0);

  // Multi-Bill Tabs & Pause/Hold state
  const [billTabs, setBillTabs] = useState<BillTabState[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ACTIVE_TABS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'tab-1',
        tabLabel: 'Bill #1',
        cart: [],
        discount: 0,
        createdAt: new Date().toISOString(),
      },
    ];
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => billTabs[0]?.id || 'tab-1');

  const [heldBills, setHeldBills] = useState<HeldBillState[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_HELD_BILLS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [holdNoteInput, setHoldNoteInput] = useState('');
  const [isHeldBillsDrawerOpen, setIsHeldBillsDrawerOpen] = useState(false);

  // Keep active bill tab synchronized with current cart & discount state
  useEffect(() => {
    setBillTabs((prevTabs) =>
      prevTabs.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              cart: posCart,
              discount: discountInput,
              selectedCustomerId,
              customerName,
              customerPhone,
            }
          : t
      )
    );
  }, [posCart, discountInput, selectedCustomerId, customerName, customerPhone, activeTabId]);

  // Persist active tabs & held bills to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_TABS, JSON.stringify(billTabs));
    } catch (e) {
      console.error(e);
    }
  }, [billTabs]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_HELD_BILLS, JSON.stringify(heldBills));
    } catch (e) {
      console.error(e);
    }
  }, [heldBills]);

  // Split payment inputs
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [qrAmount, setQrAmount] = useState<number>(0);
  const [qrType, setQrType] = useState<'ESEWA' | 'KHALTI' | 'FONEPAY'>('ESEWA');
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [udharoAmount, setUdharoAmount] = useState<number>(0);

  // Generated receipt invoice
  const [activeReceipt, setActiveReceipt] = useState<Invoice | null>(null);

  // Multi-Bill Tab Handlers
  const handleSwitchTab = (targetTabId: string) => {
    if (targetTabId === activeTabId) return;
    const targetTab = billTabs.find((t) => t.id === targetTabId);
    if (!targetTab) return;

    // Save current active tab state
    setBillTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              cart: posCart,
              discount: discountInput,
              selectedCustomerId,
              customerName,
              customerPhone,
            }
          : t
      )
    );

    setActiveTabId(targetTabId);
    setPosCart(targetTab.cart || []);
    setDiscountInput(targetTab.discount || 0);
    setSelectedCustomerId(targetTab.selectedCustomerId || '');
    setCustomerName(targetTab.customerName || '');
    setCustomerPhone(targetTab.customerPhone || '');
  };

  const handleAddNewTab = () => {
    const newNum = billTabs.length + 1;
    const newTab: BillTabState = {
      id: `tab-${Date.now()}`,
      tabLabel: `Bill #${newNum}`,
      cart: [],
      discount: 0,
      createdAt: new Date().toISOString(),
    };

    setBillTabs((prev) => [
      ...prev.map((t) =>
        t.id === activeTabId
          ? { ...t, cart: posCart, discount: discountInput }
          : t
      ),
      newTab,
    ]);

    setActiveTabId(newTab.id);
    setPosCart([]);
    setDiscountInput(0);
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
  };

  const handleCloseTab = (tabIdToClose: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const tab = billTabs.find((t) => t.id === tabIdToClose);
    if (tab && tab.cart.length > 0) {
      if (!confirm(`Are you sure you want to close "${tab.tabLabel}"? Cart items will be cleared.`)) {
        return;
      }
    }

    if (billTabs.length === 1) {
      const freshTab: BillTabState = {
        id: `tab-${Date.now()}`,
        tabLabel: 'Bill #1',
        cart: [],
        discount: 0,
        createdAt: new Date().toISOString(),
      };
      setBillTabs([freshTab]);
      setActiveTabId(freshTab.id);
      setPosCart([]);
      setDiscountInput(0);
      return;
    }

    const remaining = billTabs.filter((t) => t.id !== tabIdToClose);
    setBillTabs(remaining);

    if (activeTabId === tabIdToClose) {
      const nextTab = remaining[remaining.length - 1];
      setActiveTabId(nextTab.id);
      setPosCart(nextTab.cart || []);
      setDiscountInput(nextTab.discount || 0);
      setSelectedCustomerId(nextTab.selectedCustomerId || '');
      setCustomerName(nextTab.customerName || '');
      setCustomerPhone(nextTab.customerPhone || '');
    }
  };

  // Pause & Hold Bill Handlers
  const handleConfirmHoldBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (posCart.length === 0) return;

    const currentTab = billTabs.find((t) => t.id === activeTabId);
    const noteLabel =
      holdNoteInput.trim() ||
      customerName.trim() ||
      currentTab?.tabLabel ||
      `Hold #${heldBills.length + 1}`;

    const newHeldBill: HeldBillState = {
      id: `held-${Date.now()}`,
      holdNote: noteLabel,
      cart: [...posCart],
      discount: discountInput,
      selectedCustomerId,
      customerName,
      customerPhone,
      subtotal: cartSubtotal,
      netTotal: cartNetTotal,
      heldAt: new Date().toISOString(),
    };

    setHeldBills((prev) => [newHeldBill, ...prev]);
    setIsHoldModalOpen(false);
    setHoldNoteInput('');

    // Clear current tab after holding
    setPosCart([]);
    setDiscountInput(0);
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerPhone('');

    setBillTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              cart: [],
              discount: 0,
              selectedCustomerId: '',
              customerName: '',
              customerPhone: '',
            }
          : t
      )
    );
  };

  const handleResumeHeldBill = (held: HeldBillState) => {
    if (posCart.length === 0) {
      setPosCart(held.cart);
      setDiscountInput(held.discount || 0);
      setSelectedCustomerId(held.selectedCustomerId || '');
      setCustomerName(held.customerName || '');
      setCustomerPhone(held.customerPhone || '');

      setBillTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? {
                ...t,
                tabLabel: held.holdNote ? `Bill (${held.holdNote})` : t.tabLabel,
                cart: held.cart,
                discount: held.discount || 0,
              }
            : t
        )
      );
    } else {
      const newTab: BillTabState = {
        id: `tab-${Date.now()}`,
        tabLabel: held.holdNote ? `Bill (${held.holdNote})` : `Bill #${billTabs.length + 1}`,
        cart: held.cart,
        discount: held.discount || 0,
        selectedCustomerId: held.selectedCustomerId,
        customerName: held.customerName,
        customerPhone: held.customerPhone,
        createdAt: new Date().toISOString(),
      };

      setBillTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
      setPosCart(held.cart);
      setDiscountInput(held.discount || 0);
      setSelectedCustomerId(held.selectedCustomerId || '');
      setCustomerName(held.customerName || '');
      setCustomerPhone(held.customerPhone || '');
    }

    setHeldBills((prev) => prev.filter((h) => h.id !== held.id));
    setIsHeldBillsDrawerOpen(false);
  };

  const handleDeleteHeldBill = (heldId: string) => {
    if (confirm('Are you sure you want to discard this held bill?')) {
      setHeldBills((prev) => prev.filter((h) => h.id !== heldId));
    }
  };

  // Filter categories
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        (p.rackNo && p.rackNo.toLowerCase().includes(q)) ||
        (p.cartonBarcode && p.cartonBarcode.toLowerCase().includes(q)) ||
        (p.unit.secondaryBarcode && p.unit.secondaryBarcode.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleUnstockedBarcode = (code: string) => {
    setQuickAddBarcode(code);
    setQuickAddName('');
    setQuickAddSellingPrice('');
    setQuickAddCostPrice('');
    setQuickAddCategory('General Grocery');
    setQuickAddUnit('Packet');
    setQuickAddStockQty(10);
    setIsQuickAddModalOpen(true);
  };

  const handleSaveQuickAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddName.trim()) {
      alert('Please enter product name.');
      return;
    }
    if (quickAddSellingPrice === '' || Number(quickAddSellingPrice) < 0) {
      alert('Please enter a valid selling price.');
      return;
    }

    const price = Number(quickAddSellingPrice);
    const cost = quickAddCostPrice !== '' ? Number(quickAddCostPrice) : Math.round(price * 0.85);

    const newProd = addProduct({
      name: quickAddName.trim(),
      sku: `SKU-${quickAddBarcode || Date.now().toString().slice(-6)}`,
      barcode: quickAddBarcode.trim(),
      category: quickAddCategory || 'General Grocery',
      stockQty: Number(quickAddStockQty) || 1,
      minStockAlert: 5,
      unit: {
        primaryUnit: quickAddUnit || 'Packet',
        primarySellingPrice: price,
        primaryCostPrice: cost,
      },
    });

    addToCart(newProd, 1, 'PRIMARY');
    setIsQuickAddModalOpen(false);
  };

  // Process single barcode string
  const processSingleBarcode = (codeToProcess: string) => {
    const cleanCode = codeToProcess.trim().toLowerCase();
    if (!cleanCode) return;

    // 1. Check primary single product barcode or SKU
    const primaryMatched = products.find(
      (p) =>
        p.barcode.toLowerCase() === cleanCode ||
        p.sku.toLowerCase() === cleanCode
    );

    if (primaryMatched) {
      addToCart(primaryMatched, 1, 'PRIMARY');
      setBarcodeInput('');
      return;
    }

    // 2. Check carton / box barcode
    const cartonMatched = products.find(
      (p) =>
        (p.cartonBarcode && p.cartonBarcode.toLowerCase() === cleanCode) ||
        (p.unit.secondaryBarcode && p.unit.secondaryBarcode.toLowerCase() === cleanCode)
    );

    if (cartonMatched) {
      addToCart(cartonMatched, 1, 'SECONDARY');
      setBarcodeInput('');
      return;
    }

    // Unstocked barcode scanned / typed! Open Quick Add modal
    handleUnstockedBarcode(codeToProcess.trim());
    setBarcodeInput('');
  };

  // Handle direct Barcode Scanner submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processSingleBarcode(barcodeInput);
  };

  // Cart Calculations
  const cartSubtotal = posCart.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalCartItems = useMemo(() => posCart.reduce((sum, item) => sum + item.quantity, 0), [posCart]);
  const cartTax = shopProfile.enableVat ? (cartSubtotal - discountInput) * (shopProfile.vatRate / 100) : 0;
  const cartNetTotal = Math.max(0, cartSubtotal - discountInput + cartTax);

  const cartTotalCost = useMemo(() => {
    return posCart.reduce((sum, item) => {
      let costPerUnit = item.product.unit.primaryCostPrice;
      if (item.selectedUnit === 'SECONDARY') {
        costPerUnit =
          item.product.unit.secondaryCostPrice ??
          item.product.unit.primaryCostPrice * (item.product.unit.conversionRatio || 1);
      }
      return sum + costPerUnit * item.quantity;
    }, 0);
  }, [posCart]);

  const cartEstimatedProfit = cartNetTotal - cartTotalCost;

  // Open Checkout Modal
  const openCheckout = () => {
    if (posCart.length === 0) return;
    setIsCheckoutOpen(true);
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setCashAmount(cartNetTotal);
    setQrAmount(0);
    setAdvanceAmount(0);
    setUdharoAmount(0);
  };

  // Customer Select Handler from Directory
  const handleSelectCustomer = (val: string) => {
    if (!val || val === 'NEW') {
      setSelectedCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
      setAdvanceAmount(0);
    } else {
      const cust = customers.find((c) => c.id === val || c.phone === val);
      if (cust) {
        setSelectedCustomerId(cust.id);
        setCustomerName(cust.name);
        setCustomerPhone(cust.phone);
        // Auto check if customer has advance balance
        if ((cust.advanceBalance || 0) > 0) {
          const autoAdvance = Math.min(cust.advanceBalance || 0, cartNetTotal);
          setAdvanceAmount(autoAdvance);
          setCashAmount(Math.max(0, cartNetTotal - autoAdvance));
        }
      }
    }
  };

  // Auto Split Fill Helper
  const handleFullCash = () => {
    setCashAmount(cartNetTotal);
    setQrAmount(0);
    setAdvanceAmount(0);
    setUdharoAmount(0);
  };

  const handleFullQr = () => {
    setCashAmount(0);
    setQrAmount(cartNetTotal);
    setAdvanceAmount(0);
    setUdharoAmount(0);
  };

  const handleFullUdharo = () => {
    setCashAmount(0);
    setQrAmount(0);
    setAdvanceAmount(0);
    setUdharoAmount(cartNetTotal);
  };

  // Submit Final Checkout Sale
  const handleFinalCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const splitTotal = Number(cashAmount) + Number(qrAmount) + Number(advanceAmount) + Number(udharoAmount);

    if (splitTotal < cartNetTotal) {
      alert(
        `Total payment entered (NPR ${splitTotal}) is less than Net Invoice Total (NPR ${cartNetTotal}). Remaining NPR ${cartNetTotal - splitTotal} must be set as Udharo or paid via Cash/QR.`
      );
      return;
    }

    if (udharoAmount > 0 && !customerName.trim()) {
      alert('Customer Name and Phone Number are required for Udharo / Credit sales.');
      return;
    }

    const createdInvoice = completeSaleInvoice({
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || 'N/A',
      discount: Number(discountInput),
      splitPayment: {
        cash: Number(cashAmount),
        qr: Number(qrAmount),
        qrType: qrAmount > 0 ? qrType : undefined,
        advance: Number(advanceAmount),
        udharo: Number(udharoAmount),
      },
    });

    setIsCheckoutOpen(false);
    setActiveReceipt(createdInvoice);

    // Reset Form & Clear Current Bill Tab
    setCustomerName('');
    setCustomerPhone('');
    setSelectedCustomerId('');
    setDiscountInput(0);
    setPosCart([]);

    setBillTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              cart: [],
              discount: 0,
              customerName: '',
              customerPhone: '',
              selectedCustomerId: '',
            }
          : t
      )
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-3 p-3 lg:gap-4 lg:p-6 lg:flex-row overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* MOBILE VIEW SEGMENTED TOGGLE (Shown on screens < lg) */}
      <div className="flex lg:hidden items-center justify-between gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('PRODUCTS')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition ${
            mobileTab === 'PRODUCTS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          id="mobile-tab-products-btn"
        >
          <Barcode className="h-4 w-4" />
          <span>Scan & Catalog</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('CART')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition ${
            mobileTab === 'CART'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          id="mobile-tab-cart-btn"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Cart ({totalCartItems})</span>
          {totalCartItems > 0 && (
            <span className="font-mono text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-full">
              NPR {cartNetTotal.toLocaleString()}
            </span>
          )}
        </button>
      </div>

      {/* LEFT COLUMN: Product Catalog & Barcode Station (65% desktop) */}
      <div className={`flex-1 flex-col gap-3 lg:gap-4 min-w-0 overflow-hidden ${mobileTab === 'PRODUCTS' ? 'flex' : 'hidden lg:flex'}`}>
        {/* Top Search & Express Barcode Scanner Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center justify-between">
          {/* Text Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product name, SKU, or category..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-500"
            />
          </div>

          {/* Express Barcode Scanner Form & Camera Scanner Button */}
          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-500" />
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setBarcodeInput(val);
                  // Auto detect 13-digit EAN/UPC/GTIN barcode
                  if (/^\d{13}$/.test(val.trim())) {
                    processSingleBarcode(val.trim());
                  }
                }}
                placeholder="Scan / Enter Barcode SKU..."
                className="w-32 sm:w-44 rounded-xl border border-indigo-200 bg-indigo-50/50 pl-9 pr-3 py-2 text-xs font-mono font-semibold text-indigo-900 outline-none transition focus:border-indigo-600 focus:bg-white dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-200"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shrink-0"
              title="Add scanned item"
            >
              Scan
            </button>
            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              className="flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 shrink-0 transition active:scale-95"
              title="Scan with camera"
            >
              <Camera className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Camera</span>
            </button>
          </form>
        </div>

        {/* Categories horizontal filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid Area */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center">
              <Package className="h-10 w-10 text-slate-400 mb-2" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No products found</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Try searching for a different keyword or scan a valid product SKU.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((p) => {
                const isLowStock = p.stockQty <= p.minStockAlert;
                const isOutOfStock = p.stockQty === 0;

                return (
                  <div
                    key={p.id}
                    className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 transition-all shadow-2xs ${
                      isOutOfStock
                        ? 'border-red-200 bg-red-50/20 opacity-60 dark:border-red-950 dark:bg-red-950/10'
                        : isLowStock
                        ? 'border-amber-200 bg-amber-50/20 hover:border-amber-400 dark:border-amber-900/50 dark:bg-amber-950/10'
                        : 'border-slate-200 bg-white hover:border-indigo-400 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div>
                      {/* Top Category & Stock Badge */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="truncate text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {p.category}
                        </span>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {p.stockQty} {p.unit.primaryUnit}
                        </span>
                      </div>

                      {/* Name */}
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                        {p.name}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center justify-between">
                        <span>SKU: {p.sku}</span>
                        {p.rackNo && (
                          <span className="font-sans font-bold text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-200 dark:border-indigo-800 flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5" />
                            {p.rackNo}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Pricing & Add to Cart Controls */}
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400">Price:</span>
                          <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                            NPR {p.unit.primarySellingPrice}
                          </p>
                        </div>
                        {p.unit.secondarySellingPrice && (
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400">{p.unit.secondaryUnit}:</span>
                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              NPR {p.unit.secondarySellingPrice}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Add Buttons */}
                      <div className="flex gap-1.5 mt-2.5">
                        <button
                          onClick={() => addToCart(p, 1, 'PRIMARY')}
                          className={`flex-1 flex items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-bold text-white transition ${
                            isOutOfStock
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-slate-900 hover:bg-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-500'
                          }`}
                          title={isOutOfStock ? '0 Stock in inventory, but click to sell item on hand' : 'Add to cart'}
                        >
                          <Plus className="h-3 w-3" />
                          <span>+ {p.unit.primaryUnit}</span>
                        </button>

                        {p.unit.secondaryUnit && (
                          <button
                            onClick={() => addToCart(p, 1, 'SECONDARY')}
                            className="flex items-center justify-center gap-1 rounded-xl bg-indigo-50 px-2 py-1.5 text-[11px] font-bold text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900"
                            title={`Add 1 ${p.unit.secondaryUnit}`}
                          >
                            <Layers className="h-3 w-3" />
                            <span>{p.unit.secondaryUnit.split(' ')[0]}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Quick Cart Floating Banner when on PRODUCTS tab */}
        {mobileTab === 'PRODUCTS' && posCart.length > 0 && (
          <div className="lg:hidden p-2.5 bg-slate-900 dark:bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-2.5 pl-2">
              <div className="relative">
                <ShoppingCart className="h-5 w-5 text-indigo-400" />
                <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 font-black text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center">
                  {totalCartItems}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Cart Net Total</p>
                <p className="text-sm font-extrabold text-amber-300 font-mono">NPR {cartNetTotal.toLocaleString()}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileTab('CART')}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-md active:scale-95 transition"
            >
              <span>View Cart & Pay</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: POS Cart Sidebar (35% desktop, toggleable on mobile) */}
      <div className={`w-full flex-col rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 lg:w-96 shrink-0 h-full overflow-hidden ${mobileTab === 'CART' ? 'flex' : 'hidden lg:flex'}`}>
        {/* Multi-Bill Sessions & Pause/Hold Toolbar */}
        <div className="flex flex-col border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-950/70 p-3 gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-indigo-500" />
              Active Bills ({billTabs.length})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setHoldNoteInput(customerName || '');
                  setIsHoldModalOpen(true);
                }}
                disabled={posCart.length === 0}
                className="flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-600 disabled:opacity-40 transition shadow-2xs active:scale-95"
                title="Pause / Hold current bill"
                id="hold-bill-btn"
              >
                <Pause className="h-3 w-3" />
                <span>Hold</span>
              </button>

              <button
                onClick={() => setIsHeldBillsDrawerOpen(true)}
                className="relative flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 transition active:scale-95"
                id="held-bills-drawer-btn"
              >
                <Clock className="h-3 w-3 text-amber-400" />
                <span>Held ({heldBills.length})</span>
              </button>
            </div>
          </div>

          {/* Horizontal Multi-Bill Tab Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {billTabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              const itemCount = isActive
                ? posCart.reduce((sum, i) => sum + i.quantity, 0)
                : tab.cart.reduce((sum, i) => sum + i.quantity, 0);

              return (
                <div
                  key={tab.id}
                  onClick={() => handleSwitchTab(tab.id)}
                  className={`group flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition cursor-pointer border shrink-0 ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  <span className="truncate max-w-[85px]">{tab.tabLabel}</span>
                  {itemCount > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[9px] font-extrabold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200'
                      }`}
                    >
                      {itemCount}
                    </span>
                  )}
                  {billTabs.length > 1 && (
                    <button
                      onClick={(e) => handleCloseTab(tab.id, e)}
                      className={`rounded-full p-0.5 transition ${
                        isActive
                          ? 'hover:bg-indigo-700 text-white/80 hover:text-white'
                          : 'hover:bg-slate-200 text-slate-400 dark:hover:bg-slate-800'
                      }`}
                      title="Close tab"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}

            <button
              onClick={handleAddNewTab}
              className="flex items-center gap-1 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 px-2 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 shrink-0 transition active:scale-95"
              title="Open parallel bill tab"
              id="add-new-bill-tab-btn"
            >
              <Plus className="h-3 w-3" />
              <span>New Bill</span>
            </button>
          </div>
        </div>

        {/* Express Barcode Scanner Form in Cart View */}
        <div className="p-2.5 border-b border-slate-200 bg-slate-100/60 dark:border-slate-800 dark:bg-slate-900/60">
          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Barcode className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-500" />
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setBarcodeInput(val);
                  if (/^\d{13}$/.test(val.trim())) {
                    processSingleBarcode(val.trim());
                  }
                }}
                placeholder="Scan barcode SKU..."
                className="w-full rounded-xl border border-indigo-200 bg-white pl-8 pr-2 py-1.5 text-xs font-mono font-semibold text-indigo-900 outline-none focus:border-indigo-600 dark:border-indigo-900/60 dark:bg-slate-950 dark:text-indigo-200"
                id="cart-view-barcode-input"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition shrink-0"
            >
              Scan
            </button>
            <button
              type="button"
              onClick={() => setIsCameraScannerOpen(true)}
              className="flex items-center gap-1 rounded-xl bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 shrink-0 transition"
              title="Camera Scan"
            >
              <Camera className="h-3.5 w-3.5 text-indigo-400" />
            </button>
          </form>
        </div>

        {/* Cart Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
              Items in Cart ({totalCartItems})
            </h3>
          </div>
          {posCart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11px] font-bold text-red-500 hover:text-red-700 dark:text-red-400 transition"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Cart Itemized List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {posCart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingCart className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">Cart is empty</p>
              <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                Scan product barcode or select items from catalog to build bill.
              </p>
            </div>
          ) : (
            posCart.map((item, idx) => (
              <div
                key={`${item.product.id}-${item.selectedUnit}-${idx}`}
                className="flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900/90"
              >
                {/* Product Name & Remove Button */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h5 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {item.product.name}
                    </h5>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                        {item.unitName}
                      </span>
                      <span>• Price: <strong className="font-bold text-slate-800 dark:text-slate-200">NPR {item.unitPrice}</strong></span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id, item.selectedUnit)}
                    className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition shrink-0"
                    title="Remove product"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Quantity Controls & Item Total Price */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.product.id, item.quantity - 1, item.selectedUnit)}
                      className="p-1 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition"
                      title="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-7 text-center font-mono font-extrabold text-xs text-slate-900 dark:text-slate-100">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, item.selectedUnit)}
                      className="p-1 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition"
                      title="Increase quantity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Total Price</span>
                    <span className="font-extrabold font-mono text-xs text-indigo-600 dark:text-indigo-400">
                      NPR {item.totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Total Breakdown & Checkout Trigger */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/80 space-y-2">
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              NPR {cartSubtotal.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Tag className="h-3.5 w-3.5 text-indigo-500" />
              Discount (NPR):
            </span>
            <input
              type="number"
              min="0"
              value={discountInput}
              onChange={(e) => setDiscountInput(Math.max(0, Number(e.target.value)))}
              className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-right font-bold text-xs text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {shopProfile.enableVat && (
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>VAT ({shopProfile.vatRate}%):</span>
              <span className="font-semibold">NPR {cartTax.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">Net Total:</span>
            <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
              NPR {cartNetTotal.toLocaleString()}
            </span>
          </div>

          <button
            disabled={posCart.length === 0}
            onClick={openCheckout}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:bg-slate-300 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-sm"
            id="proceed-checkout-btn"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* FLEXIBLE SPLIT PAYMENT CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Checkout & Split Payment Station
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span>
                    Total Payable: <strong className="font-extrabold text-indigo-600 dark:text-indigo-400">NPR {cartNetTotal.toLocaleString()}</strong>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded-lg">
                    <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">Est. Profit:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-[11px]">
                      {showProfitInCheckout ? `NPR ${cartEstimatedProfit.toLocaleString()}` : '••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowProfitInCheckout(!showProfitInCheckout)}
                      className="ml-0.5 p-0.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 transition"
                      title={showProfitInCheckout ? "Hide Profit" : "Show Profit"}
                    >
                      {showProfitInCheckout ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFinalCheckout} className="p-6 space-y-5">
              {/* Customer Auto Directory Lookup */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <UserPlus className="h-4 w-4 text-indigo-500" />
                    Customer Directory Info
                  </label>
                  {selectedCustomerId ? (
                    <span className="text-[10px] text-amber-600 font-bold dark:text-amber-400 flex items-center gap-1">
                      <span>🔒 Selected from Directory (Locked)</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-bold dark:text-emerald-400">
                      ✨ New Customer Mode
                    </span>
                  )}
                </div>

                {/* Saved Customer Dropdown Selector & New Customer Button */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="">➕ New / Walk-in Customer (Type details below)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.id.toUpperCase()}] {c.name} ({c.phone}) - Udharo: NPR {c.currentBalance}
                      </option>
                    ))}
                  </select>

                  {selectedCustomerId ? (
                    <button
                      type="button"
                      onClick={() => handleSelectCustomer('NEW')}
                      className="shrink-0 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-100 border border-indigo-200 dark:bg-indigo-950/60 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-900 transition flex items-center gap-1"
                      title="Switch to New Customer"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span className="whitespace-nowrap">New Customer</span>
                    </button>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <input
                      type="text"
                      required={udharoAmount > 0}
                      disabled={!!selectedCustomerId}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer Name (e.g. Hari Thapa)"
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-medium outline-none transition ${
                        selectedCustomerId
                          ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400 font-semibold'
                          : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <input
                      type="tel"
                      required={udharoAmount > 0}
                      disabled={!!selectedCustomerId}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Mobile No (e.g. 9851098765)"
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-medium outline-none transition ${
                        selectedCustomerId
                          ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400 font-semibold'
                          : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                      }`}
                    />
                  </div>
                </div>

                {selectedCustomerId && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    To edit saved customer details, use Customer Directory. To sell to a new customer, click{' '}
                    <button
                      type="button"
                      onClick={() => handleSelectCustomer('NEW')}
                      className="font-bold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 dark:hover:text-indigo-300"
                    >
                      New Customer
                    </button>.
                  </p>
                )}
              </div>

              {/* Flexible Split Payment Section */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Split Payment Method Breakdown
                  </label>

                  {/* 1-Click Auto Fill Buttons */}
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={handleFullCash}
                      className="rounded-md bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-200"
                    >
                      100% Cash
                    </button>
                    <button
                      type="button"
                      onClick={handleFullQr}
                      className="rounded-md bg-indigo-100 px-2 py-0.5 font-bold text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-950 dark:text-indigo-200"
                    >
                      100% QR
                    </button>
                    <button
                      type="button"
                      onClick={handleFullUdharo}
                      className="rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200"
                    >
                      100% Udharo
                    </button>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  {/* Cash Amount */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      <Wallet className="h-4 w-4" />
                      <span>Cash Paid:</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-500">NPR</span>
                      <input
                        type="number"
                        min="0"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(Math.max(0, Number(e.target.value)))}
                        className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-right font-bold text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {/* QR / Digital Wallet (eSewa, Khalti, Fonepay) */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                      <QrCode className="h-4 w-4" />
                      <span>QR / Wallet:</span>
                      <select
                        value={qrType}
                        onChange={(e) => setQrType(e.target.value as any)}
                        className="ml-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-800 outline-none dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200"
                      >
                        <option value="ESEWA">eSewa</option>
                        <option value="KHALTI">Khalti</option>
                        <option value="FONEPAY">Fonepay</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-500">NPR</span>
                      <input
                        type="number"
                        min="0"
                        value={qrAmount}
                        onChange={(e) => setQrAmount(Math.max(0, Number(e.target.value)))}
                        className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-right font-bold text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {/* Use Advance Deposit */}
                  {selectedCustomerId && (
                    <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-xs font-bold text-teal-700 dark:text-teal-400">
                        <DollarSign className="h-4 w-4" />
                        <span>Use Advance Deposit:</span>
                        {(() => {
                          const cust = customers.find((c) => c.id === selectedCustomerId);
                          if (cust && (cust.advanceBalance || 0) > 0) {
                            return (
                              <span className="text-[10px] bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 px-1.5 py-0.5 rounded-md font-extrabold">
                                (Avail: NPR {cust.advanceBalance.toLocaleString()})
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-500">NPR</span>
                        <input
                          type="number"
                          min="0"
                          value={advanceAmount}
                          onChange={(e) => setAdvanceAmount(Math.max(0, Number(e.target.value)))}
                          className="w-28 rounded-lg border border-teal-200 bg-teal-50/50 px-3 py-1.5 text-right font-bold text-xs text-teal-900 outline-none focus:border-teal-500 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100"
                        />
                      </div>
                    </div>
                  )}

                  {/* Udharo / Credit Balance */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                      <CreditCard className="h-4 w-4" />
                      <span>Udharo (Credit):</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-500">NPR</span>
                      <input
                        type="number"
                        min="0"
                        value={udharoAmount}
                        onChange={(e) => setUdharoAmount(Math.max(0, Number(e.target.value)))}
                        className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-right font-bold text-xs text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Validation & Overpayment Status Indicators */}
                {(() => {
                  const splitTotal = Number(cashAmount) + Number(qrAmount) + Number(advanceAmount) + Number(udharoAmount);
                  if (splitTotal < cartNetTotal) {
                    return (
                      <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                        <span>
                          Total Entered: NPR {splitTotal.toLocaleString()} • Short by NPR {(cartNetTotal - splitTotal).toLocaleString()}
                        </span>
                      </div>
                    );
                  }
                  if (splitTotal > cartNetTotal) {
                    const overpaid = splitTotal - cartNetTotal;
                    return (
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                        <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>
                          Overpayment of NPR {overpaid.toLocaleString()} will be automatically saved as Customer Advance Deposit!
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  id="confirm-invoice-sale-btn"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Complete Sale & Generate Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAUSE & HOLD BILL MODAL */}
      {isHoldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <Pause className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Pause & Hold Bill</h3>
                  <p className="text-xs text-slate-500">Save current bill data safely to serve next customer</p>
                </div>
              </div>
              <button
                onClick={() => setIsHoldModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmHoldBill} className="mt-4 space-y-4">
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200">
                <p className="font-bold flex items-center gap-1.5">
                  <ShoppingCart className="h-3.5 w-3.5 text-amber-600" />
                  Holding {posCart.reduce((s, i) => s + i.quantity, 0)} items • Net NPR {cartNetTotal.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Customer / Table / Reference Note (Optional)
                </label>
                <input
                  type="text"
                  autoFocus
                  value={holdNoteInput}
                  onChange={(e) => setHoldNoteInput(e.target.value)}
                  placeholder="e.g. Ram Dai - Cash payment pending, Table 3, etc."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  id="hold-bill-note-input"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHoldModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shadow-md"
                  id="confirm-hold-bill-submit-btn"
                >
                  <Bookmark className="h-4 w-4" />
                  <span>Confirm & Hold Bill</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HELD BILLS DRAWER / MODAL */}
      {isHeldBillsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Held / Paused Bills ({heldBills.length})
                  </h3>
                  <p className="text-xs text-slate-500">Restore or manage paused billing sessions without losing data</p>
                </div>
              </div>
              <button
                onClick={() => setIsHeldBillsDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {heldBills.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center text-center text-slate-400">
                  <Bookmark className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">No held bills found</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                    When a customer needs time to collect money or pick more items, click "Hold" to save their cart safely.
                  </p>
                </div>
              ) : (
                heldBills.map((held) => (
                  <div
                    key={held.id}
                    className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                            {held.holdNote || 'Unnamed Bill'}
                          </span>
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            PAUSED
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Held at {new Date(held.heldAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                          NPR {held.netTotal.toLocaleString()}
                        </span>
                        <p className="text-[10px] text-slate-500">
                          {held.cart.reduce((s, i) => s + i.quantity, 0)} items
                        </p>
                      </div>
                    </div>

                    {/* Items summary */}
                    <div className="rounded-lg bg-white p-2.5 text-[11px] text-slate-600 dark:bg-slate-900 dark:text-slate-300 border border-slate-100 dark:border-slate-800/80">
                      {held.cart.map((i) => `${i.product.name} (${i.quantity} ${i.unitName})`).join(', ')}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleDeleteHeldBill(held.id)}
                        className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/30 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Discard</span>
                      </button>
                      <button
                        onClick={() => handleResumeHeldBill(held)}
                        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-xs"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>Resume & Checkout</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsHeldBillsDrawerOpen(false)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white dark:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {activeReceipt && (
        <ThermalReceiptModal invoice={activeReceipt} onClose={() => setActiveReceipt(null)} />
      )}

      {/* CAMERA BARCODE SCANNER MODAL */}
      <BarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScanSuccess={(scannedCode) => {
          const cleanCode = scannedCode.trim().toLowerCase();

          const primaryMatched = products.find(
            (p) =>
              p.barcode.toLowerCase() === cleanCode ||
              p.sku.toLowerCase() === cleanCode ||
              p.id.toLowerCase() === cleanCode
          );

          if (primaryMatched) {
            addToCart(primaryMatched, 1, 'PRIMARY');
            return;
          }

          const cartonMatched = products.find(
            (p) =>
              (p.cartonBarcode && p.cartonBarcode.toLowerCase() === cleanCode) ||
              (p.unit.secondaryBarcode && p.unit.secondaryBarcode.toLowerCase() === cleanCode)
          );

          if (cartonMatched) {
            addToCart(cartonMatched, 1, 'SECONDARY');
            return;
          }

          // Unstocked barcode scanned! Open Quick Add modal
          handleUnstockedBarcode(scannedCode.trim());
        }}
        title="Scan Barcode to Add to Cart"
      />

      {/* QUICK ADD UNSTOCKED PRODUCT MODAL */}
      {isQuickAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <Barcode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Unstocked Barcode Scanned</h3>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Quick add to inventory & sell immediately</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickAddProduct} className="mt-4 space-y-3.5">
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-900/50 text-xs">
                <span className="font-bold text-amber-900 dark:text-amber-200">Scanned Barcode: </span>
                <span className="font-mono font-extrabold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                  {quickAddBarcode}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Product / Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickAddName}
                  onChange={(e) => setQuickAddName(e.target.value)}
                  placeholder="e.g. Current Biscuits / Wai Wai Noodles"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Selling Price (NPR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={quickAddSellingPrice}
                    onChange={(e) => setQuickAddSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 50"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-indigo-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cost Price (NPR)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={quickAddCostPrice}
                    onChange={(e) => setQuickAddCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 40 (Optional)"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Unit</label>
                  <select
                    value={quickAddUnit}
                    onChange={(e) => setQuickAddUnit(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="Packet">Packet</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Kg">Kg</option>
                    <option value="Box">Box</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
                  <input
                    type="text"
                    value={quickAddCategory}
                    onChange={(e) => setQuickAddCategory(e.target.value)}
                    placeholder="General"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="col-span-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Initial Stock</label>
                  <input
                    type="number"
                    min="1"
                    value={quickAddStockQty}
                    onChange={(e) => setQuickAddStockQty(Math.max(1, Number(e.target.value)))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsQuickAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-md"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Save Product & Add to Cart</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
