import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  DownloadCloud,
  Copy,
  Check,
  Search,
  Clock,
  Printer,
  FileText,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { Order, StoreBranding, DigitalDelivery } from '../types/store';
import { formatDate, formatPrice, getOrderStatusLabel, getPaymentMethodDetails } from '../utils/formatters';
import { triggerAutomaticDownload } from '../utils/fileDownloader';

interface CustomerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  branding: StoreBranding;
  onOpenInvoice: (order: Order) => void;
}

export const CustomerPortalModal: React.FC<CustomerPortalModalProps> = ({
  isOpen,
  onClose,
  orders,
  branding,
  onOpenInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredOrders = searchQuery.trim()
    ? orders.filter(
        (o) =>
          o.customer.email.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          o.id.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          o.customer.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          o.customer.phone.includes(searchQuery.trim())
      )
    : orders;

  const handleCopyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadFile = (delivery: DigitalDelivery, order: Order) => {
    triggerAutomaticDownload({
      fileName: delivery.fileName || `${delivery.productName}.zip`,
      productName: delivery.productName,
      licenseKey: delivery.licenseKey || 'ORIGIN-ACTIVE',
      customerName: order.customer.name,
      orderId: order.id,
      fileData: delivery.fileData
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden text-right font-sans my-8">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-zinc-950">طلباتي ومشترياتي</h3>
              <p className="text-xs text-zinc-500">
                متابعة حالة طلباتك، استلام الطلبات الرقمية بعد التأكيد، تتبع المنتجات العادية، وتنزيل الفواتير كصور
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-900 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-4 bg-zinc-50 border-b border-zinc-200">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="ابحث برقم الطلب (مثال: ORIGIN-12345) أو بالبريد الإلكتروني..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-zinc-300 bg-white text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[68vh] overflow-y-auto">
          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-zinc-900">لا توجد طلبات مسجلة حالياً</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                عند إتمام أي عملية شراء، ستظهر هنا تفاصيل طلبك مع الفاتورة المعتمدة وحالة تسليم المنتجات.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const statusMeta = getOrderStatusLabel(order.orderStatus);
              const paymentMeta = getPaymentMethodDetails(order.paymentMethod);
              const isPendingPayment = order.paymentStatus === 'pending';

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-2xs space-y-4 p-5 transition-all hover:border-zinc-300"
                >
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-950 font-mono">طلب #{order.id}</span>
                        <span className="text-zinc-300">·</span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        العميل: <strong className="text-zinc-800">{order.customer.name}</strong> ·{' '}
                        {paymentMeta.name}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isPendingPayment ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 animate-pulse" />
                          <span>قيد مراجعة التحويل</span>
                        </span>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${statusMeta.bg} ${statusMeta.text}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{statusMeta.label}</span>
                        </span>
                      )}

                      <button
                        onClick={() => onOpenInvoice(order)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>طباعة / تنزيل الفاتورة كصورة</span>
                      </button>
                    </div>
                  </div>

                  {isPendingPayment && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold">طلبك قيد المراجعة والتحقق من وصول الأموال</p>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          يقوم مسؤول المتجر حالياً بمطابقة عملية التحويل. بمجرد التأكيد، سيتم تسليم طلبك الرقمي مباشرة في خانة الإشعارات وهنا في طلباتي، أو تجهيز شحنة المنتجات العادية للتوصيل.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                      المنتجات المشمولة في الطلب ({order.items.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80"
                        >
                          <img
                            src={item.image}
                            alt={item.productName || item.name}
                            className="w-10 h-10 rounded-lg object-cover bg-zinc-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0 text-xs">
                            <p className="font-bold text-zinc-950 truncate">{item.productName || item.name}</p>
                            <p className="text-[11px] text-zinc-500">
                              {item.quantity} × {formatPrice(item.price, branding.currencySymbol)}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-zinc-200 text-zinc-700">
                            {item.type === 'digital' ? 'طلب رقمي' : 'منتج عادي'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FULFILLED DIGITAL DELIVERIES */}
                  {order.digitalDeliveries && order.digitalDeliveries.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-zinc-100">
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تفاصيل الطلبات الرقمية المسلّمة:</span>
                      </span>

                      <div className="space-y-2.5">
                        {order.digitalDeliveries.map((delivery, dIdx) => (
                          <div
                            key={dIdx}
                            className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-zinc-950">{delivery.productName}</span>
                              {delivery.deliveredAt && (
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  تم التسليم: {formatDate(delivery.deliveredAt)}
                                </span>
                              )}
                            </div>

                            {delivery.textContent && (
                              <div className="p-3 rounded-xl bg-zinc-950 text-white border border-zinc-800 space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                                  <span className="flex items-center gap-1 font-mono">
                                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>بيانات وتفاصيل الطلب المسلّم:</span>
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleCopyText(`del-${order.id}-${dIdx}`, delivery.textContent || '')
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    {copiedKey === `del-${order.id}-${dIdx}` ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span>تم النسخ!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>نسخ المحتوى</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <div className="font-mono text-xs text-emerald-400 select-all whitespace-pre-wrap break-all bg-black/50 p-2 rounded-lg">
                                  {delivery.textContent}
                                </div>
                              </div>
                            )}

                            {delivery.imageData && (
                              <div className="p-2.5 rounded-xl bg-white border border-zinc-200 space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-800">
                                  <span className="flex items-center gap-1">
                                    <ImageIcon className="w-3.5 h-3.5 text-zinc-900" />
                                    <span>مرفق الطلب المسلّم:</span>
                                  </span>
                                  <a
                                    href={delivery.imageData}
                                    download={`delivered_${delivery.productName}.png`}
                                    className="text-[10px] text-zinc-950 underline font-bold"
                                  >
                                    تحميل الصورة
                                  </a>
                                </div>
                                <img
                                  src={delivery.imageData}
                                  alt="Delivered product"
                                  onClick={() => setPreviewImage(delivery.imageData || null)}
                                  className="w-full max-h-48 object-cover rounded-lg border border-zinc-200 cursor-pointer"
                                />
                              </div>
                            )}

                            {delivery.deliveryType === 'file' || delivery.fileData ? (
                              <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-2 text-xs">
                                  <DownloadCloud className="w-4 h-4 text-zinc-900" />
                                  <span className="text-zinc-700 font-mono">
                                    {delivery.fileName || `${delivery.productName}.zip`}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleDownloadFile(delivery, order)}
                                  className="px-3.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                                >
                                  <DownloadCloud className="w-3.5 h-3.5" />
                                  <span>تحميل الملف</span>
                                </button>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {order.trackingNumber && (
                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-400">شركة الشحن</span>
                        <p className="font-bold text-zinc-900">{order.carrier || 'شحن إكسبريس مصر'}</p>
                      </div>
                      <div className="text-left rtl:text-right">
                        <span className="text-[10px] text-zinc-400">رقم التتبع:</span>
                        <p className="font-mono font-bold text-zinc-950">{order.trackingNumber}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs">
                    <span className="text-zinc-500">
                      الإجمالي النهائي:{' '}
                      <strong className="text-zinc-950 tabular-nums">
                        {formatPrice(order.total, branding.currencySymbol)}
                      </strong>{' '}
                      (0% ضريبة)
                    </span>
                    <button
                      onClick={() => onOpenInvoice(order)}
                      className="text-zinc-950 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <span>عرض الفاتورة وتنزيلها كصورة</span>
                      <span>←</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50 text-center">
          <p className="text-[11px] text-zinc-500">
            لأي استفسار بخصوص طلباتك، يمكنك التواصل فوراً عبر الدعم المباشر في {branding.storeName}
          </p>
        </div>
      </div>

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="relative max-w-2xl w-full bg-white p-2 rounded-2xl shadow-2xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-black/70 text-white p-1.5 rounded-full hover:bg-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewImage} alt="Preview" className="w-full h-auto max-h-[85vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};
