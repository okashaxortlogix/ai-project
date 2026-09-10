"use client";

import React from "react";
import { X, ShoppingCart, Trash2, ArrowRight, ShieldCheck } from "lucide-react";
import { Product } from "@/lib/data";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: { product: Product; quantity: number }[];
  onRemove: (productId: string) => void;
  onClear: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onRemove,
  onClear,
}: CartDrawerProps) {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        {/* Cart Top Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Shopping Cart</h3>
            <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
              {cartItems.reduce((acc, curr) => acc + curr.quantity, 0)} items
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="p-4 flex-1 overflow-y-auto divide-y divide-slate-100">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
              <ShoppingCart className="w-12 h-12 stroke-1 text-slate-300" />
              <div className="font-semibold text-slate-600">Your cart is empty</div>
              <p className="text-xs text-slate-400 max-w-xs">
                Ask the Sales Agent for personalized laptop or hardware recommendations!
              </p>
            </div>
          ) : (
            cartItems.map(({ product, quantity }) => (
              <div key={product.id} className="py-3 flex items-center gap-3">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-14 h-14 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 truncate">
                    {product.name}
                  </h4>
                  <div className="text-xs text-slate-500 mt-0.5">
                    ${product.price} × {quantity}
                  </div>
                  <div className="font-bold text-blue-600 text-xs mt-0.5">
                    ${product.price * quantity}
                  </div>
                </div>

                <button
                  onClick={() => onRemove(product.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Shipping</span>
                <span className="text-emerald-600 font-semibold">Free</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-200">
                <span>Total</span>
                <span className="text-blue-600">${subtotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                alert(`Order for $${subtotal.toFixed(2)} placed successfully! Confirmation email and invoice sent.`);
                onClear();
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-[#1677FF] hover:bg-blue-600 text-white rounded-xl font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-Bit SSL Encrypted Enterprise Checkout</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
