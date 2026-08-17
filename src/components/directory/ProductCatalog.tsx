import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import {
  Package,
  Plus,
  Search,
  Edit3,
  Trash2,
  AlertTriangle,
  Layers,
  Barcode,
  CheckCircle2,
  MapPin,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';

export const ProductCatalog: React.FC = () => {
  const { products, shopProfile, addProduct, updateProduct, deleteProduct, confirmAction } = useApp();
  const currencySymbol = shopProfile?.currencySymbol || 'NPR';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'AVAILABLE' | 'LOW_STOCK'>('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [cartonBarcode, setCartonBarcode] = useState('');
  const [rackNo, setRackNo] = useState('');
  const [category, setCategory] = useState('General Grocery');
  const [stockQty, setStockQty] = useState<number>(0);
  const [minStockAlert, setMinStockAlert] = useState<number>(10);

  // Unit pricing
  const [primaryUnit, setPrimaryUnit] = useState('Packet');
  const [primaryCostPrice, setPrimaryCostPrice] = useState<number>(0);
  const [primarySellingPrice, setPrimarySellingPrice] = useState<number>(0);

  const [secondaryUnit, setSecondaryUnit] = useState('');
  const [conversionRatio, setConversionRatio] = useState<number>(12);
  const [secondaryCostPrice, setSecondaryCostPrice] = useState<number>(0);
  const [secondarySellingPrice, setSecondarySellingPrice] = useState<number>(0);

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setSku(`SKU-${Date.now().toString().slice(-6)}`);
    setBarcode(`890${Date.now().toString().slice(-9)}`);
    setCartonBarcode('');
    setRackNo('');
    setCategory('General Grocery');
    setStockQty(50);
    setMinStockAlert(10);
    setPrimaryUnit('Packet');
    setPrimaryCostPrice(20);
    setPrimarySellingPrice(25);
    setSecondaryUnit('');
    setConversionRatio(12);
    setSecondaryCostPrice(240);
    setSecondarySellingPrice(300);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setBarcode(p.barcode);
    setCartonBarcode(p.cartonBarcode || p.unit.secondaryBarcode || '');
    setRackNo(p.rackNo || '');
    setCategory(p.category);
    setStockQty(p.stockQty);
    setMinStockAlert(p.minStockAlert);
    setPrimaryUnit(p.unit.primaryUnit);
    setPrimaryCostPrice(p.unit.primaryCostPrice);
    setPrimarySellingPrice(p.unit.primarySellingPrice);
    setSecondaryUnit(p.unit.secondaryUnit || '');
    setConversionRatio(p.unit.conversionRatio || 12);
    setSecondaryCostPrice(p.unit.secondaryCostPrice || 0);
    setSecondarySellingPrice(p.unit.secondarySellingPrice || 0);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formattedCartonBar = secondaryUnit.trim() && cartonBarcode.trim() ? cartonBarcode.trim() : undefined;

    const unitPayload = {
      primaryUnit,
      primaryCostPrice: Number(primaryCostPrice),
      primarySellingPrice: Number(primarySellingPrice),
      secondaryUnit: secondaryUnit.trim() || undefined,
      conversionRatio: secondaryUnit.trim() ? Number(conversionRatio) : undefined,
      secondaryCostPrice: secondaryUnit.trim() ? Number(secondaryCostPrice) : undefined,
      secondarySellingPrice: secondaryUnit.trim() ? Number(secondarySellingPrice) : undefined,
      secondaryBarcode: formattedCartonBar,
    };

    if (editingProduct) {
      confirmAction({
        title: 'Confirm Save Product Edits',
        message: `Are you sure you want to save changes to product "${editingProduct.name}"?`,
        actionType: 'EDIT',
        onConfirm: () => {
          updateProduct({
            ...editingProduct,
            name: name.trim(),
            sku: sku.trim(),
            barcode: barcode.trim(),
            cartonBarcode: formattedCartonBar,
            rackNo: rackNo.trim() || undefined,
            category,
            stockQty: Number(stockQty),
            minStockAlert: Number(minStockAlert),
            unit: unitPayload,
          });
          setIsModalOpen(false);
        },
      });
      return;
    } else {
      addProduct({
        name: name.trim(),
        sku: sku.trim(),
        barcode: barcode.trim(),
        cartonBarcode: formattedCartonBar,
        rackNo: rackNo.trim() || undefined,
        category,
        stockQty: Number(stockQty),
        minStockAlert: Number(minStockAlert),
        unit: unitPayload,
      });
      setIsModalOpen(false);
    }
  };

  const filtered = products.filter((p) => {
    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.rackNo && p.rackNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.cartonBarcode && p.cartonBarcode.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesStock = true;
    if (stockFilter === 'AVAILABLE') {
      matchesStock = p.stockQty > 0;
    } else if (stockFilter === 'LOW_STOCK') {
      matchesStock = p.stockQty <= p.minStockAlert;
    }

    return matchesCat && matchesQuery && matchesStock;
  });

  const availableCount = products.filter((p) => p.stockQty > 0).length;
  const lowStockCount = products.filter((p) => p.stockQty <= p.minStockAlert).length;

  const totalPurchaseValue = products.reduce((sum, p) => sum + p.stockQty * (p.unit?.primaryCostPrice ?? 0), 0);
  const totalSalesValue = products.reduce((sum, p) => sum + p.stockQty * (p.unit?.primarySellingPrice ?? 0), 0);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      {/* 2 Summary Stat Boxes at Top (1 line / 2 cols on mobile) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {/* Box 1: Total Value of Purchased */}
        <div className="flex flex-col justify-between rounded-xl sm:rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider text-slate-500 truncate">
              Total Value Purchased
            </span>
            <div className="flex h-6 w-6 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <ShoppingBag className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-3">
            <h3 className="text-xs sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 truncate">
              {currencySymbol} {totalPurchaseValue.toLocaleString()}
            </h3>
            <p className="text-[8px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 font-medium truncate">
              Cost ({products.length} items)
            </p>
          </div>
        </div>

        {/* Box 2: Total Value of Sales */}
        <div className="flex flex-col justify-between rounded-xl sm:rounded-2xl border border-emerald-200 bg-emerald-50/40 p-2.5 sm:p-4 shadow-2xs dark:border-emerald-900/50 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider text-emerald-700 dark:text-emerald-400 truncate">
              Total Value of Sales
            </span>
            <div className="flex h-6 w-6 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-1.5 sm:mt-3">
            <h3 className="text-xs sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 truncate">
              {currencySymbol} {totalSalesValue.toLocaleString()}
            </h3>
            <p className="text-[8px] sm:text-xs text-emerald-700 dark:text-emerald-300 mt-0.5 sm:mt-1 font-medium truncate">
              Est. Margin: {currencySymbol} {(totalSalesValue - totalPurchaseValue).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Controls & Product Master Table */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as 'ALL' | 'AVAILABLE' | 'LOW_STOCK')}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="AVAILABLE">Available Items ({availableCount})</option>
              <option value="ALL">All Items ({products.length})</option>
              <option value="LOW_STOCK">Low Stock Items ({lowStockCount})</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, Product ID, SKU, or barcode..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 shrink-0 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              id="add-product-btn"
              title="Add New Product"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Product</span>
            </button>
          </div>
        </div>

        {/* Mobile Product Cards View */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              No products found matching filters.
            </div>
          ) : (
            filtered.map((p) => {
              const isLow = p.stockQty <= p.minStockAlert;
              return (
                <div
                  key={`mob-${p.id}`}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{p.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-200/60 dark:border-indigo-800/60">
                          {p.id.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">• {p.category}</span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${
                        isLow
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                      }`}
                    >
                      {isLow && <AlertTriangle className="h-3 w-3" />}
                      <span>
                        {p.stockQty} {p.unit.primaryUnit}
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block font-medium">Selling Price</span>
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-xs">
                        NPR {p.unit.primarySellingPrice}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Cost Price</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        NPR {p.unit.primaryCostPrice}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">SKU / Barcode</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate block">
                        {p.sku} • {p.barcode}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Rack No</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-indigo-500 shrink-0" />
                        <input
                          type="text"
                          value={p.rackNo || ''}
                          onChange={(e) => updateProduct({ ...p, rackNo: e.target.value.trim() || undefined })}
                          placeholder="Rack..."
                          className="w-16 rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px] font-bold text-slate-800 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {p.unit.secondaryUnit ? `1 ${p.unit.secondaryUnit} = ${p.unit.conversionRatio} ${p.unit.primaryUnit}` : 'Single Unit'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg flex items-center gap-1"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          confirmAction({
                            title: 'Confirm Delete Product',
                            message: `Are you sure you want to delete product "${p.name}"? This will remove it from the product catalog.`,
                            actionType: 'DELETE',
                            onConfirm: () => deleteProduct(p.id),
                          });
                        }}
                        className="px-2 py-1 text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-950/60 rounded-lg flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Master Desktop Table */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/90 text-slate-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300">
                <th className="p-3 font-semibold border-r border-slate-200 dark:border-slate-800">Product ID & Name</th>
                <th className="p-3 font-semibold border-r border-slate-200 dark:border-slate-800">SKU / Barcode</th>
                <th className="p-3 font-semibold text-center border-r border-slate-200 dark:border-slate-800">Rack No.</th>
                <th className="p-3 font-semibold text-center border-r border-slate-200 dark:border-slate-800">Stock Level</th>
                <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Cost Price</th>
                <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Selling Price</th>
                <th className="p-3 font-semibold text-right border-r border-slate-200 dark:border-slate-800">Dual Unit Conversion</th>
                <th className="p-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isLow = p.stockQty <= p.minStockAlert;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800/80 last:border-b-0">
                      <td className="p-3 border-r border-slate-200 dark:border-slate-800/80">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{p.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-200/60 dark:border-indigo-800/60">
                            {p.id.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">• {p.category}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-slate-500 border-r border-slate-200 dark:border-slate-800/80">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">SKU: {p.sku}</div>
                        <div className="text-[10px] space-y-0.5 mt-0.5">
                          <div>Single: <span className="font-bold text-slate-800 dark:text-slate-200">{p.barcode}</span></div>
                          {(p.cartonBarcode || p.unit.secondaryBarcode) && (
                            <div className="text-amber-700 dark:text-amber-400 font-bold">
                              Box Bar: {p.cartonBarcode || p.unit.secondaryBarcode}
                            </div>
                          )}
                        </div>
                      </td>
                      {/* Rack No Column with fast inline edit */}
                      <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800/80">
                        <div className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <input
                            type="text"
                            value={p.rackNo || ''}
                            onChange={(e) => updateProduct({ ...p, rackNo: e.target.value.trim() || undefined })}
                            placeholder="Set Rack..."
                            className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-900 transition"
                            title="Enter rack or shelf location number"
                          />
                        </div>
                      </td>
                      <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800/80">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isLow
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                          }`}
                        >
                          {isLow && <AlertTriangle className="h-3 w-3" />}
                          <span>
                            {p.stockQty} {p.unit.primaryUnit}
                          </span>
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800/80">
                        NPR {p.unit.primaryCostPrice}
                      </td>
                      <td className="p-3 text-right font-extrabold text-indigo-600 dark:text-indigo-400 border-r border-slate-200 dark:border-slate-800/80">
                        NPR {p.unit.primarySellingPrice}
                      </td>
                      <td className="p-3 text-right text-slate-500 font-medium border-r border-slate-200 dark:border-slate-800/80">
                        {p.unit.secondaryUnit ? (
                          <div>
                            1 {p.unit.secondaryUnit} = {p.unit.conversionRatio} {p.unit.primaryUnit}
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">Single Unit</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                            title="Edit Product"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              confirmAction({
                                title: 'Confirm Delete Product',
                                message: `Are you sure you want to delete product "${p.name}"? This will remove it from the product catalog.`,
                                actionType: 'DELETE',
                                onConfirm: () => deleteProduct(p.id),
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {editingProduct ? 'Edit Product Details' : 'Add New Product to Catalog'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Wai Wai Noodles 75g"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Dairy, Snacks"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Rack No / Shelf Location</span>
                  </label>
                  <input
                    type="text"
                    value={rackNo}
                    onChange={(e) => setRackNo(e.target.value)}
                    placeholder="e.g. Rack A-1, Shelf 2"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Single Product Barcode *
                  </label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="e.g. 890123400101 (Packet/Piece)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Current Stock Qty
                    </label>
                    <span className="text-[10px] text-amber-600 font-semibold dark:text-amber-400">
                      {editingProduct ? 'Locked (Auto-managed)' : 'Initial Balance'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={stockQty}
                    disabled={!!editingProduct}
                    onChange={(e) => setStockQty(Number(e.target.value))}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-bold outline-none ${
                      editingProduct
                        ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                        : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                    }`}
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                    Stock increases via Purchase Bills and decreases via Sales Invoices.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Min Stock Reorder Alert
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Unit Pricing Section */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Primary Unit Pricing
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={primaryUnit}
                    onChange={(e) => setPrimaryUnit(e.target.value)}
                    placeholder="Unit (Packet/Piece)"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <input
                    type="number"
                    value={primaryCostPrice}
                    onChange={(e) => setPrimaryCostPrice(Number(e.target.value))}
                    placeholder="Cost (NPR)"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <input
                    type="number"
                    value={primarySellingPrice}
                    onChange={(e) => setPrimarySellingPrice(Number(e.target.value))}
                    placeholder="Sell (NPR)"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-indigo-600 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400"
                  />
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 pt-2 flex items-center justify-between">
                  <span>Secondary Package Unit (Optional e.g. Carton / Box)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={secondaryUnit}
                    onChange={(e) => setSecondaryUnit(e.target.value)}
                    placeholder="Unit Name (e.g. Carton)"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <input
                    type="number"
                    value={conversionRatio}
                    onChange={(e) => setConversionRatio(Number(e.target.value))}
                    placeholder="Pcs/Box (e.g. 30)"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <input
                    type="number"
                    value={secondaryCostPrice}
                    onChange={(e) => setSecondaryCostPrice(Number(e.target.value))}
                    placeholder="Box Cost Price"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <input
                    type="number"
                    value={secondarySellingPrice}
                    onChange={(e) => setSecondarySellingPrice(Number(e.target.value))}
                    placeholder="Box Selling Price"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-indigo-600 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400"
                  />
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <Barcode className="h-3.5 w-3.5" />
                    <span>Carton / Box Barcode (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={cartonBarcode}
                    onChange={(e) => setCartonBarcode(e.target.value)}
                    placeholder="e.g. 890123400101-BOX (Scanned when selling entire Carton)"
                    className="w-full rounded-xl border border-amber-200 bg-amber-50/50 px-3 py-1.5 text-xs font-mono text-slate-900 outline-none focus:border-amber-500 dark:border-amber-900/60 dark:bg-slate-800 dark:text-amber-200"
                  />
                  <p className="text-[10px] text-slate-500 italic">
                    Scanning this barcode in POS automatically adds the item as a full Box/Carton with Box Price & deducts {conversionRatio || 'N'} single units from inventory!
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  id="save-product-modal-btn"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
