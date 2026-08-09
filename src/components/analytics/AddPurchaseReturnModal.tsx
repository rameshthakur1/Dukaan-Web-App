import React, { useState } from 'react';
import { X, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod } from '../../types';

interface AddPurchaseReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPurchaseReturnModal: React.FC<AddPurchaseReturnModalProps> = ({ isOpen, onClose }) => {
  const { suppliers, products, purchases, addPurchaseReturn } = useApp();

  const [selectedPurchaseNo, setSelectedPurchaseNo] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('UDHARO');
  const [reason, setReason] = useState<string>('Damaged / Near Expiry batch returned');

  const [returnItems, setReturnItems] = useState<
    {
      productId: string;
      productName: string;
      unitName: string;
      quantity: number;
      costPrice: number;
      totalRefund: number;
    }[]
  >([]);

  if (!isOpen) return null;

  const handlePurchaseChange = (purNo: string) => {
    setSelectedPurchaseNo(purNo);
    const matched = purchases.find((p) => p.purchaseNo === purNo);
    if (matched) {
      setSupplierId(matched.supplierId || '');
      setSupplierName(matched.supplierName);
      setReturnItems(
        matched.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          unitName: item.unitName,
          quantity: item.quantity,
          costPrice: item.costPrice,
          totalRefund: item.totalAmount,
        }))
      );
    }
  };

  const handleSupplierChange = (supId: string) => {
    setSupplierId(supId);
    const sup = suppliers.find((s) => s.id === supId);
    if (sup) {
      setSupplierName(sup.name);
    }
  };

  const handleQtyChange = (index: number, qty: number) => {
    setReturnItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const newQty = Math.max(1, qty);
          return {
            ...item,
            quantity: newQty,
            totalRefund: newQty * item.costPrice,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    setReturnItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalRefundAmount = returnItems.reduce((sum, item) => sum + item.totalRefund, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName) {
      alert('Please select or enter supplier name');
      return;
    }
    if (returnItems.length === 0) {
      alert('Please add at least one item to return');
      return;
    }

    addPurchaseReturn({
      purchaseNo: selectedPurchaseNo || 'MANUAL-PR',
      supplierId,
      supplierName,
      items: returnItems,
      totalRefundAmount,
      refundMethod,
      reason,
      performedBy: 'Store Manager',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="flex flex-col w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Record Purchase Return (To Vendor)</h3>
              <p className="text-xs text-slate-500">Reduces stock & vendor credit liability</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Purchase Order (Optional)
              </label>
              <select
                value={selectedPurchaseNo}
                onChange={(e) => handlePurchaseChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">-- Direct Vendor Return --</option>
                {purchases.map((p) => (
                  <option key={p.id} value={p.purchaseNo}>
                    {p.purchaseNo} - {p.supplierName} (NPR {p.totalAmount})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vendor / Supplier *
              </label>
              <select
                value={supplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.companyName || 'Supplier'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Adjustment Method
              </label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="UDHARO">Reduce Supplier Udharo (Payables)</option>
                <option value="CASH">Cash Refund Received</option>
                <option value="BANK">Bank Transfer Received</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Return Reason
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for vendor return"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between items-center">
              <span>Items Returned to Vendor</span>
              <button
                type="button"
                onClick={() => {
                  if (products.length > 0) {
                    const firstProd = products[0];
                    setReturnItems((prev) => [
                      ...prev,
                      {
                        productId: firstProd.id,
                        productName: firstProd.name,
                        unitName: firstProd.unit.primaryUnit,
                        quantity: 1,
                        costPrice: firstProd.unit.primaryCostPrice,
                        totalRefund: firstProd.unit.primaryCostPrice,
                      },
                    ]);
                  }
                }}
                className="flex items-center gap-1 text-[11px] text-amber-600 font-bold hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add Item
              </button>
            </div>

            <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
              {returnItems.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-4">No items added to return list.</p>
              ) : (
                returnItems.map((item, idx) => (
                  <div key={idx} className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-xs">
                    <div className="flex-1 min-w-[140px]">
                      <select
                        value={item.productId}
                        onChange={(e) => {
                          const prod = products.find((p) => p.id === e.target.value);
                          if (prod) {
                            setReturnItems((prev) =>
                              prev.map((it, i) =>
                                i === idx
                                  ? {
                                      ...it,
                                      productId: prod.id,
                                      productName: prod.name,
                                      unitName: prod.unit.primaryUnit,
                                      costPrice: prod.unit.primaryCostPrice,
                                      totalRefund: it.quantity * prod.unit.primaryCostPrice,
                                    }
                                  : it
                              )
                            );
                          }
                        }}
                        className="w-full rounded-md border border-slate-200 bg-white p-1 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Cost: {p.unit.primaryCostPrice} NPR)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-20">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                        className="w-full rounded-md border border-slate-200 bg-white p-1 text-xs text-center font-bold dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="w-24 text-right font-bold text-slate-900 dark:text-slate-100">
                      NPR {item.totalRefund.toLocaleString()}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-amber-500 hover:text-amber-700 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
            <div>
              <span className="text-xs text-slate-400 font-bold block">Total Refund/Credit</span>
              <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                NPR {totalRefundAmount.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shadow-xs"
              >
                Confirm Purchase Return
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
