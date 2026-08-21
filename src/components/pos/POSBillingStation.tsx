import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, SplitPayment, Invoice, CartItem } from '../../types';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import { PairMobileScannerModal } from './PairMobileScannerModal';
import { MobileScannerCompanion } from './MobileScannerCompanion';
import { usePOSRealtimeBroadcast } from '../../hooks/usePOSRealtimeBroadcast';
import { findProductAndUnitByBarcode } from '../../utils/barcodeMatcher';
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
  Maximize2,
  Minimize2,
  Smartphone,
  Radio,
  Wifi,
  CheckCircle2,
  Truck,
  Building2,
  PowerOff,
  Unlink,
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
    suppliers,
    addSupplier,
    recordStockPurchase,
    shopProfile,
    addProduct,
    activeShopCode,
    activeShopName,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'PRODUCTS' | 'CART'>('PRODUCTS');

  // Quick Add Unstocked Product Modal state (includes Supplier details & auto-ledger)
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [quickAddBarcode, setQuickAddBarcode] = useState('');
  const [quickAddName, setQuickAddName] = useState('');
  const [quickAddSellingPrice, setQuickAddSellingPrice] = useState<number | ''>('');
  const [quickAddCostPrice, setQuickAddCostPrice] = useState<number | ''>('');
  const [quickAddCategory, setQuickAddCategory] = useState('General Grocery');
  const [quickAddUnit, setQuickAddUnit] = useState('Packet');
  const [quickAddStockQty, setQuickAddStockQty] = useState<number>(10);
  const [quickAddSupplierMode, setQuickAddSupplierMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [quickAddSupplierId, setQuickAddSupplierId] = useState<string>('');
  const [quickAddSupplierName, setQuickAddSupplierName] = useState<string>('');
  const [quickAddSupplierPhone, setQuickAddSupplierPhone] = useState<string>('');
  const [quickAddSupplierPan, setQuickAddSupplierPan] = useState<string>('');
  const [quickAddSupplierAddress, setQuickAddSupplierAddress] = useState<string>('');
  const [quickAddPaidStatus, setQuickAddPaidStatus] = useState<'PAID' | 'CREDIT'>('PAID');

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showProfitInCheckout, setShowProfitInCheckout] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountInput, setDiscountInput] = useState<number>(0);

  // Full Screen Cart Overview Modal state
  const [isCartFullscreenOpen, setIsCartFullscreenOpen] = useState(false);
  const [fullscreenCartSearch, setFullscreenCartSearch] = useState('');

  // Close fullscreen cart on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartFullscreenOpen) {
        setIsCartFullscreenOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartFullscreenOpen]);

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

  // Filter categories - only show categories with in-stock products
  const categories = useMemo(() => {
    const inStock = products.filter((p) => Number(p.stockQty || 0) > 0);
    const set = new Set(inStock.map((p) => p.category));
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filtered products list - completely hide any product whose stock is 0 or less
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Hide products with 0 stock in billing
      if (Number(p.stockQty || 0) <= 0) return false;

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
    if (suppliers.length > 0) {
      setQuickAddSupplierMode('EXISTING');
      setQuickAddSupplierId(suppliers[0].id);
      setQuickAddSupplierName(suppliers[0].name);
      setQuickAddSupplierPhone(suppliers[0].phone || '');
    } else {
      setQuickAddSupplierMode('NEW');
      setQuickAddSupplierId('');
      setQuickAddSupplierName('');
      setQuickAddSupplierPhone('');
    }
    setQuickAddSupplierPan('');
    setQuickAddSupplierAddress('');
    setQuickAddPaidStatus('PAID');
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

    // Determine supplier information
    let finalSupplierId = '';
    let finalSupplierName = '';
    let finalSupplierPhone = '';

    if (quickAddSupplierMode === 'EXISTING' && quickAddSupplierId) {
      const foundSupplier = suppliers.find((s) => s.id === quickAddSupplierId);
      if (foundSupplier) {
        finalSupplierId = foundSupplier.id;
        finalSupplierName = foundSupplier.name;
        finalSupplierPhone = foundSupplier.phone || '';
      }
    }

    // If new supplier mode or typing an unregistered supplier name
    if (quickAddSupplierMode === 'NEW' && quickAddSupplierName.trim()) {
      const sName = quickAddSupplierName.trim();
      const sPhone = quickAddSupplierPhone.trim() || 'N/A';

      // Check if already in supplier list
      const existing = suppliers.find(
        (s) => s.name.toLowerCase() === sName.toLowerCase() || (sPhone !== 'N/A' && s.phone === sPhone)
      );

      if (existing) {
        finalSupplierId = existing.id;
        finalSupplierName = existing.name;
        finalSupplierPhone = existing.phone;
      } else {
        // Record down the unregistered supplier into the supplier list
        const createdSupplier = addSupplier({
          name: sName,
          phone: sPhone,
          companyName: sName,
          address: quickAddSupplierAddress.trim() || undefined,
          panVat: quickAddSupplierPan.trim() || undefined,
          notes: 'Auto-registered during POS Quick Barcode Add',
        });
        finalSupplierId = createdSupplier.id;
        finalSupplierName = createdSupplier.name;
        finalSupplierPhone = createdSupplier.phone;
      }
    }

    const price = Number(quickAddSellingPrice);
    const cost = quickAddCostPrice !== '' ? Number(quickAddCostPrice) : Math.round(price * 0.85);
    const stockQty = Number(quickAddStockQty) || 1;
    const barcodeVal = quickAddBarcode.trim();

    // 1. Add product to inventory
    const newProd = addProduct({
      name: quickAddName.trim(),
      sku: `SKU-${barcodeVal || Date.now().toString().slice(-6)}`,
      barcode: barcodeVal,
      category: quickAddCategory || 'General Grocery',
      stockQty: stockQty,
      minStockAlert: 5,
      supplierId: finalSupplierId || undefined,
      supplierName: finalSupplierName || undefined,
      unit: {
        primaryUnit: quickAddUnit || 'Packet',
        primarySellingPrice: price,
        primaryCostPrice: cost,
      },
    });

    // 2. Record stock purchase in supplier ledger if supplier details are provided
    if (finalSupplierName) {
      const totalCostAmount = stockQty * cost;
      const cashPaid = quickAddPaidStatus === 'PAID' ? totalCostAmount : 0;

      recordStockPurchase({
        supplierName: finalSupplierName,
        supplierPhone: finalSupplierPhone,
        invoiceRef: `PUR-POS-${Date.now().toString().slice(-6)}`,
        items: [
          {
            productName: newProd.name,
            sku: newProd.sku,
            barcode: newProd.barcode,
            unitName: quickAddUnit || 'Packet',
            quantity: stockQty,
            costPrice: cost,
            sellingPrice: price,
          },
        ],
        cashPaid: cashPaid,
        notes: `Quick Initial Stock on Barcode Scan [${barcodeVal}] (Supplier: ${finalSupplierName})`,
      });
    }

    // 3. Immediately add item to current POS cart for sale
    addToCart(newProd, 1, 'PRIMARY');
    setIsQuickAddModalOpen(false);
  };

  // Process single barcode string
  const processSingleBarcode = (codeToProcess: string): {
    status: 'SUCCESS' | 'OUT_OF_STOCK' | 'NOT_FOUND';
    product: Product | null;
    unitPrice: number;
    unitType: 'PRIMARY' | 'SECONDARY';
    unitName: string;
  } => {
    const cleanCode = (codeToProcess || '').trim();
    if (!cleanCode) {
      return { status: 'NOT_FOUND', product: null, unitPrice: 0, unitType: 'PRIMARY', unitName: 'Unit' };
    }

    const matched = findProductAndUnitByBarcode(products, cleanCode);
    if (matched) {
      addToCart(matched.product, 1, matched.unitType);
      setBarcodeInput('');
      return {
        status: 'SUCCESS',
        product: matched.product,
        unitPrice: matched.unitPrice,
        unitType: matched.unitType,
        unitName: matched.unitName,
      };
    }

    // Unstocked barcode scanned / typed! Open Quick Add modal
    handleUnstockedBarcode(cleanCode);
    setBarcodeInput('');
    return {
      status: 'NOT_FOUND',
      product: null,
      unitPrice: 0,
      unitType: 'PRIMARY',
      unitName: 'Unit',
    };
  };

  // Handle direct Barcode Scanner submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processSingleBarcode(barcodeInput);
  };

  // Real-time Supabase Broadcast connection for wireless mobile barcode scanning
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [isMobileCompanionOpen, setIsMobileCompanionOpen] = useState(false);
  const [mobileScanNotice, setMobileScanNotice] = useState<{
    text: string;
    code: string;
    productName?: string;
    timestamp: number;
  } | null>(null);

  const {
    isConnected: isRealtimeConnected,
    activeDevices,
    latencyMs,
    sendTestChime,
    broadcastScanAck,
    broadcastCatalogSync,
    broadcastCartSync,
    broadcastQuantityUpdate,
    broadcastRemoveItem,
    broadcastClearCart,
    broadcastCustomerSync,
    broadcastDisconnect,
  } = usePOSRealtimeBroadcast({
    shopCode: activeShopCode || shopProfile.shopCode || 'SHOP-01',
    role: 'DESKTOP_POS',
    onRequestCatalogSyncReceived: () => {
      if (products.length > 0) {
        broadcastCatalogSync(products);
      }
    },
    onBarcodeReceived: (payload) => {
      const ackResult = processSingleBarcode(payload.barcode);
      // Send immediate ACK back to the mobile phone scanner with exact matched product & rate
      broadcastScanAck({
        barcode: payload.barcode,
        status: ackResult.status,
        product: ackResult.product,
        unitPrice: ackResult.unitPrice,
        unitType: ackResult.unitType,
        unitName: ackResult.unitName,
        quantity: 1,
        targetDeviceId: payload.deviceId,
      });

      const productName = ackResult.product?.name || payload.productName;
      setMobileScanNotice({
        text: productName
          ? `📱 ${payload.deviceName}: Scanned "${productName}"`
          : `📱 ${payload.deviceName}: Scanned Barcode [${payload.barcode}]`,
        code: payload.barcode,
        productName: productName,
        timestamp: Date.now(),
      });
      setTimeout(() => {
        setMobileScanNotice((prev) => (prev && prev.timestamp === payload.timestamp ? null : prev));
      }, 4500);
    },
    onCartSyncReceived: (payload) => {
      if (Array.isArray(payload.cart)) {
        setPosCart(payload.cart);
      }
      if (payload.customerName !== undefined) setCustomerName(payload.customerName);
      if (payload.customerPhone !== undefined) setCustomerPhone(payload.customerPhone);
      if (payload.discount !== undefined) setDiscountInput(payload.discount);
    },
    onQuantityUpdateReceived: (payload) => {
      updateCartQuantity(payload.productId, payload.quantity, payload.selectedUnit);
    },
    onRemoveItemReceived: (payload) => {
      removeFromCart(payload.productId, payload.selectedUnit);
    },
    onClearCartReceived: () => {
      clearCart();
    },
    onCustomerSyncReceived: (payload) => {
      if (payload.customerName !== undefined) setCustomerName(payload.customerName);
      if (payload.customerPhone !== undefined) setCustomerPhone(payload.customerPhone);
      if (payload.discount !== undefined) setDiscountInput(payload.discount);
    },
  });

  // Automatically broadcast catalog to mobile devices when products change or connection is ready
  useEffect(() => {
    if (isRealtimeConnected && products.length > 0) {
      broadcastCatalogSync(products);
    }
  }, [isRealtimeConnected, products, broadcastCatalogSync]);

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

  // Filtered cart items for fullscreen cart search
  const filteredFullscreenCart = useMemo(() => {
    if (!fullscreenCartSearch.trim()) return posCart;
    const q = fullscreenCartSearch.toLowerCase().trim();
    return posCart.filter(
      (item) =>
        item.product.name.toLowerCase().includes(q) ||
        (item.product.barcode && item.product.barcode.toLowerCase().includes(q)) ||
        (item.product.sku && item.product.sku.toLowerCase().includes(q)) ||
        (item.product.category && item.product.category.toLowerCase().includes(q)) ||
        (item.unitName && item.unitName.toLowerCase().includes(q))
    );
  }, [posCart, fullscreenCartSearch]);

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
    <div className="flex flex-1 min-h-0 w-full flex-col gap-2 lg:gap-4 lg:flex-row overflow-hidden bg-slate-50 dark:bg-slate-950">
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

        {posCart.length > 0 && (
          <button
            type="button"
            onClick={() => setIsCartFullscreenOpen(true)}
            className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition shadow-2xs"
            title="Expand Full Screen Cart"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* LEFT COLUMN: Product Catalog & Barcode Station (65% desktop) */}
      <div className={`flex-1 min-h-0 flex-col gap-2 lg:gap-4 min-w-0 overflow-hidden ${mobileTab === 'PRODUCTS' ? 'flex' : 'hidden lg:flex'}`}>
        {/* Top Search & Express Barcode Scanner Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center justify-between">
          {/* Text Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product name, SKU, or category..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-500"
            />
          </div>

          {/* Express Barcode Scanner Form & Camera Scanner Button & Mobile Wireless Gun Pairing */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
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
                className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shrink-0 cursor-pointer"
                title="Add scanned item"
              >
                Scan
              </button>
              <button
                type="button"
                onClick={() => setIsCameraScannerOpen(true)}
                className="flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 shrink-0 transition active:scale-95 cursor-pointer"
                title="Scan with webcam / camera"
              >
                <Camera className="h-3.5 w-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Camera</span>
              </button>
            </form>

            {/* Live Mobile Barcode Scanner Pairing & Disconnect Button (Supabase Realtime) - Only for Desktop / Web View */}
            <div className="hidden md:flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsPairModalOpen(true)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition active:scale-95 cursor-pointer shrink-0 border ${
                  activeDevices.some((d) => d.role === 'MOBILE_SCANNER')
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700 shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 hover:bg-indigo-100'
                }`}
                title="Pair Phone as Wireless Laser Barcode Gun via Supabase Realtime Broadcast"
                id="pair-mobile-scanner-btn"
              >
                <span className="flex h-2 w-2 relative shrink-0">
                  {isRealtimeConnected && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isRealtimeConnected ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  ></span>
                </span>
                <Smartphone className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">
                  {activeDevices.some((d) => d.role === 'MOBILE_SCANNER')
                    ? `Phone Synced (${activeDevices.filter((d) => d.role === 'MOBILE_SCANNER').length})`
                    : 'Pair Phone Scanner'}
                </span>
              </button>

              {activeDevices.some((d) => d.role === 'MOBILE_SCANNER') && (
                <button
                  type="button"
                  onClick={() => broadcastDisconnect(undefined, 'Cashier disconnected mobile scanner from POS')}
                  className="flex items-center gap-1 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-2 py-2 text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
                  title="Disconnect phone scanner to avoid unnecessary scans"
                >
                  <PowerOff className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">Disconnect</span>
                </button>
              )}
            </div>
          </div>
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
      <div className={`w-full flex-1 lg:flex-initial flex-col rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 lg:w-96 shrink-0 min-h-0 overflow-hidden ${mobileTab === 'CART' ? 'flex' : 'hidden lg:flex'}`}>
        {/* Multi-Bill Sessions & Pause/Hold Toolbar */}
        <div className="flex flex-col border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-950/70 p-2.5 sm:p-3 gap-2 shrink-0">
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
        <div className="p-2.5 border-b border-slate-200 bg-slate-100/60 dark:border-slate-800 dark:bg-slate-900/60 shrink-0">
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
        <div className="flex items-center justify-between border-b border-slate-200 px-3 sm:px-4 py-2.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
              Items in Cart ({totalCartItems})
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            {posCart.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCartFullscreenOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg border border-indigo-200 dark:border-indigo-800 transition shadow-2xs cursor-pointer"
                title="Expand Cart to Full Screen to view, search, and edit all items"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Full Screen</span>
              </button>
            )}
            {posCart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] font-bold text-red-500 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 px-2 py-1 rounded-lg transition cursor-pointer"
              >
                Clear Cart
              </button>
            )}
          </div>
        </div>

        {/* Cart Itemized List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3 space-y-2">
          {posCart.length === 0 ? (
            <div className="flex h-full min-h-[70px] flex-col items-center justify-center text-center p-3 sm:p-6 text-slate-400">
              <ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300 dark:text-slate-700 mb-1.5" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">Cart is empty</p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 max-w-xs mt-0.5">
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
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          updateCartQuantity(item.product.id, Math.max(1, val), item.selectedUnit);
                        }
                      }}
                      className="w-8 text-center font-mono font-extrabold text-xs text-slate-900 dark:text-slate-100 bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      title="Direct edit quantity"
                    />
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
        <div className="border-t border-slate-200 bg-slate-50 p-2.5 sm:p-4 dark:border-slate-800 dark:bg-slate-950/95 space-y-1.5 sm:space-y-2 shrink-0">
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

          <div className="flex justify-between items-baseline pt-1 border-t border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">Net Total:</span>
            <span className="text-base sm:text-lg font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
              NPR {cartNetTotal.toLocaleString()}
            </span>
          </div>

          <button
            disabled={posCart.length === 0}
            onClick={openCheckout}
            className="w-full mt-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] py-2.5 sm:py-3 px-4 font-extrabold text-white shadow-md transition disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600 text-xs sm:text-sm cursor-pointer"
            id="proceed-checkout-btn"
          >
            <span>{posCart.length === 0 ? 'Proceed to Checkout' : `Proceed to Checkout • NPR ${cartNetTotal.toLocaleString()}`}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* FLEXIBLE SPLIT PAYMENT CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto pb-20 sm:pb-4">
          <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 my-auto overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 sm:px-6 py-3.5 sm:py-4 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
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

            <form onSubmit={handleFinalCheckout} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
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
          const cleanCode = scannedCode.trim();
          const matched = findProductAndUnitByBarcode(products, cleanCode);

          if (matched) {
            addToCart(matched.product, 1, matched.unitType);
            return;
          }

          // Unstocked barcode scanned! Open Quick Add modal
          handleUnstockedBarcode(cleanCode);
        }}
        title="Scan Barcode to Add to Cart"
      />

      {/* QUICK ADD UNSTOCKED PRODUCT MODAL */}
      {isQuickAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                  <Barcode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Unstocked Barcode Scanned</h3>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Quick register item & supplier details to sell immediately</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAddModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickAddProduct} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-900/50 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-200">Scanned Barcode: </span>
                  <span className="font-mono font-black text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 ml-1.5 shadow-xs">
                    {quickAddBarcode}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                  New Item
                </span>
              </div>

              {/* 1. Item Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Item & Pricing Details</span>
                </h4>

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
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-indigo-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Purchase / Cost Price (NPR)</label>
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
                      <option value="Litre">Litre</option>
                      <option value="Dozen">Dozen</option>
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
              </div>

              {/* 2. Supplier & Purchase Source Details */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Supplier & Purchase Source</span>
                  </h4>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                    Auto-recorded in Supplier List
                  </span>
                </div>

                {/* Mode Selector */}
                <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickAddSupplierMode('EXISTING');
                      if (suppliers.length > 0 && !quickAddSupplierId) {
                        setQuickAddSupplierId(suppliers[0].id);
                        setQuickAddSupplierName(suppliers[0].name);
                        setQuickAddSupplierPhone(suppliers[0].phone || '');
                      }
                    }}
                    className={`flex-1 rounded-lg py-1.5 font-bold transition cursor-pointer ${
                      quickAddSupplierMode === 'EXISTING'
                        ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-300'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    Select Existing ({suppliers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickAddSupplierMode('NEW');
                      setQuickAddSupplierId('');
                    }}
                    className={`flex-1 rounded-lg py-1.5 font-bold transition cursor-pointer ${
                      quickAddSupplierMode === 'NEW'
                        ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-300'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    + Register New Supplier
                  </button>
                </div>

                {quickAddSupplierMode === 'EXISTING' ? (
                  suppliers.length > 0 ? (
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Choose Supplier</label>
                        <select
                          value={quickAddSupplierId}
                          onChange={(e) => {
                            const found = suppliers.find((s) => s.id === e.target.value);
                            setQuickAddSupplierId(e.target.value);
                            if (found) {
                              setQuickAddSupplierName(found.name);
                              setQuickAddSupplierPhone(found.phone || '');
                            }
                          }}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        >
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} {s.phone ? `(${s.phone})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {quickAddSupplierPhone && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                          <Phone className="h-3 w-3 text-indigo-500" />
                          <span>Supplier Contact: <strong className="text-slate-700 dark:text-slate-300">{quickAddSupplierPhone}</strong></span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-200">
                      No suppliers registered yet. Please click &quot;Register New Supplier&quot; above to record the supplier.
                    </div>
                  )
                ) : (
                  <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Supplier / Vendor Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={quickAddSupplierName}
                        onChange={(e) => setQuickAddSupplierName(e.target.value)}
                        placeholder="e.g. Himalayan Wholesale Distributors"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Contact / Phone</label>
                        <input
                          type="text"
                          value={quickAddSupplierPhone}
                          onChange={(e) => setQuickAddSupplierPhone(e.target.value)}
                          placeholder="e.g. 9801234567"
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">PAN / VAT No.</label>
                        <input
                          type="text"
                          value={quickAddSupplierPan}
                          onChange={(e) => setQuickAddSupplierPan(e.target.value)}
                          placeholder="Optional"
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Address / City</label>
                      <input
                        type="text"
                        value={quickAddSupplierAddress}
                        onChange={(e) => setQuickAddSupplierAddress(e.target.value)}
                        placeholder="e.g. New Road, Kathmandu"
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                )}

                {/* Purchase Payment Status for Initial Stock */}
                <div className="pt-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Supplier Payment for this Stock:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setQuickAddPaidStatus('PAID')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        quickAddPaidStatus === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700 shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Paid (Cash / Bank)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuickAddPaidStatus('CREDIT')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        quickAddPaidStatus === 'CREDIT'
                          ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700 shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Supplier Credit (Udharo)</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuickAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 px-5 py-2.5 text-xs font-bold text-white transition shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Register & Add to Cart</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN CART PRODUCTS OVERVIEW MODAL */}
      {isCartFullscreenOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 md:p-6 animate-in fade-in duration-150">
          <div className="flex flex-col h-[94vh] w-full max-w-6xl rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 px-4 sm:px-6 py-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 shrink-0">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                      Cart Products (Full Screen)
                    </h3>
                    <span className="rounded-full bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      {posCart.length} item{posCart.length === 1 ? '' : 's'} • {totalCartItems} total qty
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Spacious view to see all cart items, edit quantities directly, remove products, and proceed to checkout
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {/* Real-time search inside cart */}
                <div className="relative min-w-[170px] sm:min-w-[240px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={fullscreenCartSearch}
                    onChange={(e) => setFullscreenCartSearch(e.target.value)}
                    placeholder="Search in cart..."
                    className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-7 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  {fullscreenCartSearch && (
                    <button
                      type="button"
                      onClick={() => setFullscreenCartSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {posCart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to clear all products from the cart?')) {
                        clearCart();
                        setIsCartFullscreenOpen(false);
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/60 transition cursor-pointer"
                    title="Clear All Cart Items"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Clear All</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsCartFullscreenOpen(false)}
                  className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Close Full Screen Cart (Esc)"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Products Table */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 bg-slate-50/50 dark:bg-slate-950/40">
              {posCart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
                    <ShoppingCart className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">Cart is Empty</h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    No products added to the current bill yet. Scan barcodes or select items from catalog to start billing.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCartFullscreenOpen(false)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition cursor-pointer"
                  >
                    <Barcode className="h-4 w-4" />
                    <span>Return to Catalog & Scan</span>
                  </button>
                </div>
              ) : filteredFullscreenCart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center p-6 text-slate-400">
                  <Search className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No matching items found in cart</p>
                  <p className="text-xs text-slate-500 mt-0.5">Try searching with a different term.</p>
                  <button
                    type="button"
                    onClick={() => setFullscreenCartSearch('')}
                    className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Clear Search Filter
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desktop / Tablet High Density Table View */}
                  <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-4 w-12 text-center">#</th>
                          <th className="py-3 px-4">Product Details</th>
                          <th className="py-3 px-4 w-28 text-center">Unit</th>
                          <th className="py-3 px-4 w-32 text-right">Unit Price</th>
                          <th className="py-3 px-4 w-48 text-center">Quantity (Editable)</th>
                          <th className="py-3 px-4 w-36 text-right">Subtotal</th>
                          <th className="py-3 px-4 w-20 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                        {filteredFullscreenCart.map((item, idx) => (
                          <tr
                            key={`${item.product.id}-${item.selectedUnit}-${idx}`}
                            className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition group"
                          >
                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                                  {item.product.name}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 flex-wrap">
                                  {item.product.category && (
                                    <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 font-semibold text-slate-600 dark:text-slate-400">
                                      {item.product.category}
                                    </span>
                                  )}
                                  {item.product.barcode && (
                                    <span className="font-mono text-slate-400 flex items-center gap-1">
                                      <Barcode className="h-3 w-3" /> {item.product.barcode}
                                    </span>
                                  )}
                                  {item.product.currentStock !== undefined && (
                                    <span className="text-slate-400">
                                      In Stock: {item.product.currentStock}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-block rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 px-2 py-0.5 font-bold text-indigo-700 dark:text-indigo-300">
                                {item.unitName}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                              NPR {item.unitPrice.toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200 dark:border-slate-700/80 w-fit mx-auto shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => updateCartQuantity(item.product.id, item.quantity - 1, item.selectedUnit)}
                                  className="p-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition cursor-pointer"
                                  title="Decrease quantity"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (!isNaN(val)) {
                                      updateCartQuantity(item.product.id, Math.max(1, val), item.selectedUnit);
                                    }
                                  }}
                                  className="w-14 text-center font-mono font-black text-sm bg-transparent text-slate-900 dark:text-slate-100 outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  title="Click and type exact quantity directly"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, item.selectedUnit)}
                                  className="p-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition cursor-pointer"
                                  title="Increase quantity"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                              NPR {item.totalPrice.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.product.id, item.selectedUnit)}
                                className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition cursor-pointer"
                                title="Remove item from cart"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View (< md) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
                    {filteredFullscreenCart.map((item, idx) => (
                      <div
                        key={`${item.product.id}-${item.selectedUnit}-${idx}`}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                #{idx + 1}
                              </span>
                              {item.product.category && (
                                <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                                  {item.product.category}
                                </span>
                              )}
                            </div>
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 mt-0.5">
                              {item.product.name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                              <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.2 font-bold text-indigo-700 dark:text-indigo-300">
                                {item.unitName}
                              </span>
                              <span>• NPR {item.unitPrice.toLocaleString()}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id, item.selectedUnit)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition cursor-pointer shrink-0"
                            title="Remove product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                          {/* Quantity control with direct input */}
                          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.product.id, item.quantity - 1, item.selectedUnit)}
                              className="p-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-200 active:scale-95 transition cursor-pointer"
                              title="Decrease"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) {
                                  updateCartQuantity(item.product.id, Math.max(1, val), item.selectedUnit);
                                }
                              }}
                              className="w-12 text-center font-mono font-black text-sm bg-transparent text-slate-900 dark:text-slate-100 outline-none"
                              title="Type quantity"
                            />
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, item.selectedUnit)}
                              className="p-1.5 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-200 active:scale-95 transition cursor-pointer"
                              title="Increase"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Subtotal</span>
                            <span className="font-extrabold font-mono text-sm text-indigo-600 dark:text-indigo-400">
                              NPR {item.totalPrice.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Summary & Checkout Bar */}
            <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-5 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-6 shadow-lg">
              {/* Financial Breakdown */}
              <div className="flex items-center gap-3 sm:gap-6 text-xs flex-wrap">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] sm:text-[11px]">Subtotal</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                    NPR {cartSubtotal.toLocaleString()}
                  </span>
                </div>
                {discountInput > 0 && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] sm:text-[11px]">Discount</span>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                      - NPR {discountInput.toLocaleString()}
                    </span>
                  </div>
                )}
                {cartTax > 0 && (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px] sm:text-[11px]">VAT ({shopProfile.vatRate}%)</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                      + NPR {cartTax.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="border-l border-slate-200 dark:border-slate-700 pl-3 sm:pl-4">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] sm:text-[11px] font-bold">Net Total</span>
                  <span className="text-sm sm:text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                    NPR {cartNetTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCartFullscreenOpen(false)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <Barcode className="h-4 w-4" />
                  <span>Scan More</span>
                </button>
                <button
                  type="button"
                  disabled={posCart.length === 0}
                  onClick={() => {
                    setIsCartFullscreenOpen(false);
                    openCheckout();
                  }}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-md transition disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* FLOATING REAL-TIME SCAN NOTIFICATION BANNER */}
      {mobileScanNotice && (
        <div className="fixed top-18 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200 max-w-sm">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950/95 border-2 border-emerald-500 p-3.5 text-white shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-xs text-white truncate">{mobileScanNotice.text}</p>
                <p className="text-[10px] text-emerald-300 font-mono">
                  Live Barcode Scan via Supabase Realtime
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileScanNotice(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* PAIR MOBILE SCANNER MODAL */}
      <PairMobileScannerModal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
        shopCode={activeShopCode || shopProfile.shopCode || 'SHOP-01'}
        shopName={activeShopName || shopProfile.shopName || 'Retail Store'}
        isConnected={isRealtimeConnected}
        activeDevices={activeDevices}
        latencyMs={latencyMs}
        onSendTestPing={sendTestChime}
        onOpenLocalScanner={() => {
          setIsPairModalOpen(false);
          setIsMobileCompanionOpen(true);
        }}
        onDisconnectDevice={(targetDeviceId) =>
          broadcastDisconnect(targetDeviceId, 'Cashier disconnected mobile scanner')
        }
        onDisconnectAll={() =>
          broadcastDisconnect(undefined, 'Cashier disconnected all mobile scanners')
        }
      />

      {/* MOBILE SCANNER COMPANION MODAL */}
      {isMobileCompanionOpen && (
        <MobileScannerCompanion
          onClose={() => setIsMobileCompanionOpen(false)}
          shopCodeParam={activeShopCode || shopProfile.shopCode}
          shopNameParam={activeShopName || shopProfile.shopName}
        />
      )}
    </div>
  );
};
