import React, { useState } from 'react';
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  DownloadCloud,
  Package,
  Tag,
  ShieldCheck,
  Check
} from 'lucide-react';
import { CartItem, StoreBranding } from '../types/store';
import { formatPrice } from '../utils/formatters';
import { THEME_PALETTES } from '../utils/theme';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  branding: StoreBranding;
  appliedPromo: string;
  onApplyPromo: (code: string) => { success: boolean; message?: string };
  discountAmount: number;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  branding,
  appliedPromo,
  onApplyPromo,
  discountAmount,
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const theme = THEME_PALETTES[branding.primaryTheme] || THEME_PALETTES.slate;

  // Calculations (Zero VAT)
  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const hasPhysical = items.some((item) => item.product.type === 'physical');
  const physicalSubtotal = items
    .filter((item) => item.product.type === 'physical')
    .reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const shippingBase = branding.defaultShippingFee ?? 35;
  const shippingFee = !hasPhysical || physicalSubtotal >= branding.freeShippingThreshold ? 0 : shippingBase;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = onApplyPromo(promoInput.trim().toUpperCase());
    if (res.success) {
      setPromoMessage({ text: res.message || 'تم تطبيق كود الخصم بنجاح!', isError: false });
    } else {
      setPromoMessage({ text: res.message || 'كود الخصم غير صحيح أو غير مفعل', isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between text-right border-l border-zinc-200 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-zinc-900" />
            <h3 className="font-bold text-base text-zinc-950">سلة المشتريات</h3>
            <span className="text-xs text-zinc-500 tabular-nums">({items.length} عناصر)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        {hasPhysical && (
          <div className="px-5 py-2.5 bg-zinc-50 border-b border-zinc-200 text-xs">
            {physicalSubtotal >= branding.freeShippingThreshold ? (
              <p className="text-emerald-600 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>تهانينا! لقد حصلت على شحن مجاني للمنتجات العادية.</span>
              </p>
            ) : (
              <p className="text-zinc-600">
                أضف منتجات عادية بقيمة{' '}
                <span className="font-bold text-zinc-950 tabular-nums">
                  {formatPrice(branding.freeShippingThreshold - physicalSubtotal, branding.currencySymbol)}
                </span>{' '}
                إضافية للحصول على شحن مجاني داخل مصر!
              </p>
            )}
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-16">
              <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-zinc-900">سلتك فارغة حالياً</h4>
              <p className="text-xs text-zinc-500 max-w-xs">
                استكشف المعروضات وأضف الطلبات الرقمية أو المنتجات العادية التي ترغب بشرائها.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-3 p-3 rounded-2xl bg-zinc-50 border border-zinc-200"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-18 h-18 rounded-xl object-cover bg-zinc-200 shrink-0"
                />

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        {item.product.type === 'digital' ? (
                          <>
                            <DownloadCloud className="w-3 h-3 text-zinc-800" />
                            <span>طلب رقمي · تسليم إلكتروني</span>
                          </>
                        ) : (
                          <>
                            <Package className="w-3 h-3 text-zinc-800" />
                            <span>منتج عادي · شحن وتوصيل</span>
                          </>
                        )}
                      </span>
                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="text-xs font-bold text-zinc-950 line-clamp-1 mt-0.5">
                      {item.product.name}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-bold text-zinc-950 tabular-nums">
                      {formatPrice(item.product.price * item.quantity, branding.currencySymbol)}
                    </span>

                    <div className="flex items-center border border-zinc-300 rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="px-2 py-0.5 text-xs text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-semibold tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="px-2 py-0.5 text-xs text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Summary */}
        {items.length > 0 && (
          <div className="p-5 border-t border-zinc-200 bg-white space-y-4">
            <form onSubmit={handlePromoSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-3" />
                <input
                  type="text"
                  placeholder="أدخل كود الكوبون..."
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 text-xs rounded-xl border border-zinc-300 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 uppercase font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white transition-colors cursor-pointer"
              >
                تطبيق
              </button>
            </form>

            {promoMessage && (
              <p className={`text-[11px] font-semibold ${promoMessage.isError ? 'text-rose-600' : 'text-emerald-600'}`}>
                {promoMessage.isError ? '✕ ' : '✓ '}
                {promoMessage.text}
              </p>
            )}

            <div className="space-y-1.5 text-xs text-zinc-600 pt-2 border-t border-zinc-100">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-semibold text-zinc-950 tabular-nums">
                  {formatPrice(subtotal, branding.currencySymbol)}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>الخصم المطبق ({appliedPromo}):</span>
                  <span className="font-semibold tabular-nums">
                    - {formatPrice(discountAmount, branding.currencySymbol)}
                  </span>
                </div>
              )}

              {hasPhysical && (
                <div className="flex justify-between">
                  <span>تكلفة الشحن والتوصيل:</span>
                  <span className="font-semibold tabular-nums">
                    {shippingFee === 0 ? 'مجاني' : formatPrice(shippingFee, branding.currencySymbol)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm font-bold text-zinc-950 pt-2 border-t border-zinc-200">
                <span>الإجمالي النهائي (0% ضريبة):</span>
                <span className="text-base font-extrabold tabular-nums">
                  {formatPrice(total, branding.currencySymbol)}
                </span>
              </div>
            </div>

            {branding.maintenanceMode ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold text-center">
                {branding.maintenanceMessage || 'المتجر في وضع الصيانة المؤقت، تم إيقاف استقبال الطلبات حالياً.'}
              </div>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onCheckout();
                }}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${theme.primary}`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>متابعة إتمام الطلب والدفع</span>
                <ArrowLeft className="w-4 h-4 rtl:rotate-0 rotate-180" />
              </button>
            )}

            <p className="text-[10px] text-center text-zinc-400">
              🔒 دفع محلي آمن ومشفر عبر {branding.storeName}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
