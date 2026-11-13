import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  DownloadCloud,
  Package,
  Check,
  ShieldCheck,
  Star,
  MessageSquare,
  Send,
  UserCheck
} from 'lucide-react';
import { Product, StoreBranding, GoogleUserProfile } from '../types/store';
import { formatPrice } from '../utils/formatters';
import { THEME_PALETTES } from '../utils/theme';

interface ProductModalProps {
  product: Product | null;
  branding: StoreBranding;
  currentUser: GoogleUserProfile | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
  onAddReview: (productId: string, rating: number, comment: string, reviewerName: string) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  branding,
  currentUser,
  onClose,
  onAddToCart,
  onBuyNow,
  onAddReview,
}) => {
  const [quantity, setQuantity] = useState(1);

  // Review submission state
  const [userRating, setUserRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState(currentUser?.name || '');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Reset modal inputs cleanly when switching products or login changes
  useEffect(() => {
    setQuantity(1);
    setReviewComment('');
    setUserRating(5);
    setHoverRating(0);
    setReviewSubmitted(false);
  }, [product?.id]);

  useEffect(() => {
    setReviewerName(currentUser?.name || '');
  }, [currentUser?.id, currentUser?.name]);

  if (!product) return null;

  const theme = THEME_PALETTES[branding.primaryTheme] || THEME_PALETTES.slate;
  const isDigital = product.type === 'digital';

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    const name = reviewerName.trim() || currentUser?.name || 'عميل موثق';
    onAddReview(product.id, userRating, reviewComment.trim(), name);
    setReviewComment('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden text-right">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 p-2 text-zinc-500 hover:text-zinc-950 bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-zinc-200 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[85vh] overflow-y-auto">
          {/* Media Column */}
          <div className="md:col-span-5 bg-zinc-50 p-6 flex flex-col justify-between space-y-4 border-l border-zinc-200/80">
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Digital Specific Info Card */}
              {isDigital && (
                <div className="p-4 rounded-xl bg-white border border-zinc-200 text-xs space-y-2 shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-zinc-950">
                    <DownloadCloud className="w-4 h-4 text-zinc-900" />
                    <span>آلية تسليم الطلب الرقمي</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">
                    بعد مراجعة وتأكيد وصول التحويل المالي من إدارة {branding.storeName}، يتم تسليم طلبك الرقمي إلكترونياً مباشرة إلى خانة الإشعارات وقسم «طلباتي» بحسابك دون أي مصاريف شحن.
                  </p>
                  {product.digitalFile?.licenseType && (
                    <div className="pt-1 border-t border-zinc-100 text-[11px] text-zinc-600 flex justify-between">
                      <span className="text-zinc-400">نوع الترخيص:</span>
                      <span className="font-semibold text-zinc-900">{product.digitalFile.licenseType}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Physical Specific Info Card */}
              {!isDigital && product.physicalDetails && (
                <div className="p-4 rounded-xl bg-white border border-zinc-200 text-xs space-y-2 shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-zinc-950">
                    <Package className="w-4 h-4 text-zinc-900" />
                    <span>مواصفات شحن المنتج العادي في مصر</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-zinc-700 pt-1">
                    <div>
                      <span className="text-zinc-400 block text-[10px]">الوزن الصافي:</span>
                      <span className="font-semibold">{product.physicalDetails.weight}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">الأبعاد:</span>
                      <span className="font-semibold">{product.physicalDetails.dimensions}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">مدة الشحن:</span>
                      <span className="font-semibold">{product.physicalDetails.shippingDays}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block text-[10px]">رمز التخزين:</span>
                      <span className="font-mono text-[11px] font-semibold">{product.physicalDetails.sku}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 flex items-center justify-center gap-2 text-xs text-zinc-500 border-t border-zinc-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ضمان أصالة المنتج ودعم فني مباشر</span>
            </div>
          </div>

          {/* Details & Purchase Column */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-white">
            <div className="space-y-4">
              {/* Category & Rating */}
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span className="font-semibold text-zinc-700">{product.category}</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-zinc-950 tabular-nums">{product.rating}</span>
                  <span>({product.reviewsCount} تقييم)</span>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-zinc-950 leading-tight">
                {product.name}
              </h2>

              {/* Price Banner */}
              <div className="flex flex-wrap items-baseline gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-2xl sm:text-3xl font-black text-zinc-950 tabular-nums">
                  {formatPrice(product.price, branding.currencySymbol)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="text-sm text-zinc-400 line-through tabular-nums">
                    {formatPrice(product.compareAtPrice, branding.currencySymbol)}
                  </span>
                )}
                <span
                  className={`text-xs font-bold mr-auto ${
                    product.inStock ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {!product.inStock
                    ? '✕ غير متوفر حالياً'
                    : isDigital
                    ? '✓ طلب رقمي متاح للتنفيذ'
                    : '✓ منتج عادي متاح للشحن السريع'}
                </span>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-zinc-950">تفاصيل المنتج:</h4>
                <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>

              {/* Custom Features List */}
              {product.features && product.features.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <h4 className="text-xs font-bold text-zinc-950">ميزات ومحتويات المنتج:</h4>
                  <ul className="space-y-1">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-zinc-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CUSTOMER REVIEWS SECTION */}
              <div className="space-y-3 pt-3 border-t border-zinc-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-zinc-950 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-zinc-900" />
                    <span>تقييمات وآراء العملاء ({product.reviews?.length || 0})</span>
                  </h4>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="font-bold text-amber-500 tabular-nums">★ {product.rating}</span>
                    <span className="text-zinc-400">/ 5</span>
                  </div>
                </div>

                {product.reviews && product.reviews.length > 0 ? (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {product.reviews.map((rev) => (
                      <div key={rev.id} className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/70 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-zinc-900">{rev.customerName}</span>
                            {rev.verifiedPurchase && (
                              <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                                <UserCheck className="w-3 h-3" />
                                <span>مشتري موثق</span>
                              </span>
                            )}
                          </div>
                          <div className="flex text-amber-400 text-xs">
                            {'★'.repeat(rev.rating)}
                            {'☆'.repeat(5 - rev.rating)}
                          </div>
                        </div>
                        <p className="text-zinc-600 text-[11px] leading-relaxed">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-400 bg-zinc-50 border border-zinc-200/60 p-2.5 rounded-xl text-center">
                    كن أول من يكتب تقييماً وتجربة لهذا المنتج!
                  </p>
                )}

                {/* Submit New Review Form */}
                {branding.allowReviews !== false ? (
                  <form
                    onSubmit={handleSubmitReview}
                    className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900">أضف تقييمك للمنتج:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setUserRating(star)}
                            className="text-base transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                          >
                            <span className={star <= (hoverRating || userRating) ? 'text-amber-400' : 'text-zinc-300'}>
                              ★
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="اسمك (أو سيظهر اسم حسابك)"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs text-zinc-900"
                      />
                      <input
                        type="text"
                        required
                        placeholder="رأيك في جودة المنتج وتجربتك..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs text-zinc-900"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {reviewSubmitted ? (
                        <span className="text-[11px] text-emerald-600 font-bold">
                          ✓ شكراً لك! تم إضافة تقييمك بنجاح.
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400">تقييمك يساعد باقي المشترين</span>
                      )}

                      <button
                        type="submit"
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${theme.primary}`}
                      >
                        <Send className="w-3 h-3 rtl:rotate-180" />
                        <span>نشر التقييم</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-[11px] text-zinc-400 text-center py-1">
                    تم إيقاف إضافة تقييمات جديدة مؤقتاً من إعدادات المتجر.
                  </p>
                )}
              </div>
            </div>

            {/* Purchase Module */}
            <div className="pt-4 border-t border-zinc-200 space-y-3">
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                {/* Stepper */}
                <div className="flex items-center border border-zinc-300 rounded-xl overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 text-xs font-bold text-zinc-950 tabular-nums">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart */}
                <button
                  type="button"
                  disabled={!product.inStock}
                  onClick={() => {
                    onAddToCart(product, quantity);
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 border border-zinc-200 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>إضافة للسلة</span>
                </button>

                {/* Buy Now */}
                <button
                  type="button"
                  disabled={!product.inStock}
                  onClick={() => {
                    onBuyNow(product, quantity);
                    onClose();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer ${theme.primary}`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{product.inStock ? 'شراء الآن' : 'نفذت الكمية'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
