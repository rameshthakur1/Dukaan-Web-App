import React, { useState } from 'react';
import { X, RotateCcw, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod, Product } from '../../types';

interface AddSalesReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddSalesReturnModal: React.FC<AddSalesReturnModalProps> = ({ isOpen, onClose }) => {
  const { invoices, products, addSalesReturn } = useApp();

  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('CASH');
  const [reason, setReason] = useState<string>('Damaged / Defective item');

  const [returnItems, setReturnItems] = useState<
    {
      productId: string;
      productName: string;
      unitName: string;
      quantity: number;
      refundUnitPrice: number;
      totalRefund: number;
    }[]
  >([]);

  if (!isOpen) return null;

  const handleInvoiceChange = (invNo: string) => {
    setSelectedInvoiceNo(invNo);
    const matched = invoices.find((i) => i.invoiceNo === invNo);
    if (matched) {
      setCustomerName(matched.customerName);
      setCustomerPhone(matched.customerPhone || '');
      setReturnItems(
        matched.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          unitName: item.unitName,
          quantity: item.quantity,
          refundUnitPrice: item.unitPrice,
          totalRefund: item.totalPrice,
        }))
      );
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
            totalRefund: newQty * item.refundUnitPrice,
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
    if (!customerName) {
      alert('Please enter or select a customer name');
      return;
    }
    if (returnItems.length === 0) {
      alert('Please add at least one item to return');
      return;
    }

    addSalesReturn({
      invoiceNo: selectedInvoiceNo || 'MANUAL-RET',
      customerName,
      customerPhone,
      items: returnItems,
      totalRefundAmount,
      refundMethod,
      reason,
      performedBy: 'Store Cashier',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="flex flex-col w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">Record Sales Return (Customer Return)</h3>
              <p className="text-xs text-slate-500">Auto-restocks inventory and logs customer refund</p>
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
                Select Original Invoice (Optional)
              </label>
              <select
                value={selectedInvoiceNo}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">-- Direct Manual Return --</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.invoiceNo}>
                    {inv.invoiceNo} - {inv.customerName} (NPR {inv.netAmount})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Name"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Refund Payment Method
              </label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="CASH">Cash Refund</option>
                <option value="ESEWA">eSewa Wallet</option>
                <option value="KHALTI">Khalti Wallet</option>
                <option value="FONEPAY">Fonepay / Bank QR</option>
                <option value="UDHARO">Customer Credit Balance (Khata Adjustment)</option>
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
                placeholder="Reason for return"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between items-center">
              <span>Returned Items List</span>
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
                        refundUnitPrice: firstProd.unit.primarySellingPrice,
                        totalRefund: firstProd.unit.primarySellingPrice,
                      },
                    ]);
                  }
                }}
                className="flex items-center gap-1 text-[11px] text-rose-600 font-bold hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Add Product
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
                                      refundUnitPrice: prod.unit.primarySellingPrice,
                                      totalRefund: it.quantity * prod.unit.primarySellingPrice,
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
                            {p.name} ({p.unit.primarySellingPrice} NPR)
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
                      className="text-rose-500 hover:text-rose-700 p-1"
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
              <span className="text-xs text-slate-400 font-bold block">Total Refund</span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400">
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
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition shadow-xs"
              >
                Confirm Sales Return
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
