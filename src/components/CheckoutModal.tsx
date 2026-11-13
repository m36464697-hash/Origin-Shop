import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  ArrowLeft,
  Package,
  CreditCard,
  Printer,
  Clock,
  ShoppingBag
} from 'lucide-react';
import { CartItem, Order, PaymentMethod, StoreBranding, GoogleUserProfile } from '../types/store';
import { formatPrice, generateLicenseKey, getPaymentMethodDetails } from '../utils/formatters';
import { THEME_PALETTES } from '../utils/theme';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  branding: StoreBranding;
  discountAmount: number;
  appliedPromo?: string;
  currentUser: GoogleUserProfile | null;
  onOpenGoogleAuth: () => void;
  onOrderPlaced: (order: Order) => void;
  onSaveUserProfile?: (profilePatch: Partial<GoogleUserProfile>) => void;
  onClearCart: () => void;
  onOpenInvoice?: (order: Order) => void;
  onOpenPortal?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  branding,
  discountAmount,
  appliedPromo,
  currentUser,
  onOpenGoogleAuth,
  onOrderPlaced,
  onSaveUserProfile,
  onClearCart,
  onOpenInvoice,
  onOpenPortal,
}) => {
  const gateways = branding.paymentGateways;
  const hasPhysical = items.some((item) => item.product.type === 'physical');

  const getFirstEnabledPaymentMethod = (): PaymentMethod => {
    if (gateways.vodafoneCash.enabled) return 'vodafone_cash';
    if (gateways.instapay.enabled) return 'instapay';
    if (gateways.fawry.enabled) return 'fawry';
    if (gateways.meeza.enabled) return 'meeza';
    if (gateways.card.enabled) return 'card';
    if (gateways.cod.enabled && hasPhysical) return 'cod';
    return 'vodafone_cash';
  };

  const [step, setStep] = useState<'info' | 'payment' | 'processing' | 'success'>('info');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(getFirstEnabledPaymentMethod);

  // Customer Form State (strictly isolated per active account)
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [city, setCity] = useState(currentUser?.city || 'القاهرة');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [postalCode, setPostalCode] = useState(currentUser?.postalCode || '');

  // Payment inputs
  const [walletPhoneUsed, setWalletPhoneUsed] = useState('');
  const [instapayRef, setInstapayRef] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Order Result State
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [copiedWallet, setCopiedWallet] = useState(false);

  // Reset checkout modal when reopened with items
  useEffect(() => {
    if (isOpen && items.length > 0) {
      setStep('info');
      setCreatedOrder(null);
      setPaymentMethod(getFirstEnabledPaymentMethod());
    }
  }, [isOpen]);

  // Reset & sync customer fields whenever active user switches (strict account isolation!)
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setCity(currentUser.city || 'القاهرة');
      setAddress(currentUser.address || '');
      setPostalCode(currentUser.postalCode || '');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setCity('القاهرة');
      setAddress('');
      setPostalCode('');
    }
  }, [currentUser?.id]);

  if (!isOpen) return null;

  const theme = THEME_PALETTES[branding.primaryTheme] || THEME_PALETTES.slate;

  // Calculations (Zero VAT)
  const subtotal = items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const hasDigital = items.some((item) => item.product.type === 'digital');
  const physicalSubtotal = items
    .filter((item) => item.product.type === 'physical')
    .reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const shippingBase = branding.defaultShippingFee ?? 35;
  const shippingFee = !hasPhysical || physicalSubtotal >= branding.freeShippingThreshold ? 0 : shippingBase;
  const codFee = paymentMethod === 'cod' && hasPhysical && gateways.cod.enabled ? gateways.cod.extraFee : 0;
  const total = Math.max(0, subtotal - discountAmount + shippingFee + codFee);

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (branding.requireAuthForCheckout && !currentUser) {
      onOpenGoogleAuth();
      return;
    }
    if (currentUser && onSaveUserProfile) {
      onSaveUserProfile({
        name: name.trim() || currentUser.name,
        phone: phone.trim(),
        city: city.trim(),
        address: address.trim(),
        postalCode: postalCode.trim(),
      });
    }
    setStep('payment');
  };

  const handleProcessOrder = () => {
    setStep('processing');

    setTimeout(() => {
      const orderId = `ORIGIN-${Math.floor(10000 + Math.random() * 90000)}`;
      const nowIso = new Date().toISOString();
      const fawryCode = `788${Math.floor(100000 + Math.random() * 900000)}`;

      const newOrder: Order = {
        id: orderId,
        userId: currentUser?.id || 'guest',
        createdAt: nowIso,
        customer: {
          name: name.trim() || 'عميل المتجر',
          email: email.trim(),
          phone: phone.trim(),
          city: city.trim(),
          address: hasPhysical ? address.trim() : undefined,
          postalCode: hasPhysical ? postalCode.trim() : undefined
        },
        items: items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          name: item.product.name,
          type: item.product.type,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image,
          fileName: item.product.digitalFile?.fileName,
          fileSize: item.product.digitalFile?.fileSize,
          fileData: item.product.digitalFile?.fileData,
          licenseKey: item.product.type === 'digital' ? generateLicenseKey('ORIGIN') : undefined
        })),
        subtotal,
        discount: discountAmount,
        couponCode: appliedPromo,
        shippingFee: shippingFee + codFee,
        tax: 0, // Zero VAT
        total,
        paymentMethod,
        paymentDetails: {
          walletNumberUsed: paymentMethod === 'vodafone_cash' ? walletPhoneUsed.trim() : undefined,
          fawryRefNumber: paymentMethod === 'fawry' ? fawryCode : undefined,
          instapayRef: paymentMethod === 'instapay' ? instapayRef.trim() || 'INSTA-REF' : undefined,
          cashOnDeliveryConfirmed: paymentMethod === 'cod'
        },
        paymentStatus: 'pending',
        orderStatus: 'pending',
        digitalDeliveries: [], // Held for manual admin verification & delivery
        trackingNumber: hasPhysical ? `EGY-EXP-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
        carrier: hasPhysical ? 'بوسطة Bosta للشحن السريع في مصر' : undefined
      };

      setCreatedOrder(newOrder);
      onOrderPlaced(newOrder);
      onClearCart();
      setStep('success');
    }, 900);
  };

  const handleCopyWalletNumber = () => {
    navigator.clipboard.writeText(gateways.vodafoneCash.walletNumber);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden text-right font-sans my-6">
        {/* Modal Top Bar */}
        <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-sm text-zinc-950">
              {step === 'success'
                ? `تم استلام طلبك بنجاح من ${branding.storeName}`
                : 'إتمام الشراء والدفع الآمن (مصر)'}
            </span>
          </div>
          {step !== 'processing' && (
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step 1: Customer Details */}
        {step === 'info' && (
          <form onSubmit={handleProceedToPayment} className="p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-950">بيانات العميل والتوصيل</h3>
              <p className="text-xs text-zinc-500">
                {hasDigital && !hasPhysical
                  ? 'أدخل اسمك وبريدك الإلكتروني ورقم هاتفك لاستلام طلبك الرقمي في حسابك وفاتورتك دون أي مصاريف شحن.'
                  : 'أدخل بياناتك وعنوانك بدقة لتنفيذ الطلب وشحن المنتجات العادية داخل مصر.'}
              </p>
            </div>

            {currentUser ? (
              <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <div>
                    <span className="font-bold text-zinc-950 block">
                      مسجل الدخول بحساب Google: {currentUser.name}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">{currentUser.email}</span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  ✓ تم الربط
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs flex flex-wrap items-center justify-between gap-2">
                <span className="text-zinc-600 text-[11px]">
                  {branding.requireAuthForCheckout
                    ? 'مطلوب تسجيل الدخول بحساب Google لإتمام هذا الطلب وحفظه في حسابك'
                    : 'سجل دخولك بحساب Google لحفظ طلباتك وإشعاراتك وعنوانك بشكل مستقل'}
                </span>
                <button
                  type="button"
                  onClick={onOpenGoogleAuth}
                  className="px-3 py-1.5 rounded-xl bg-zinc-950 text-xs font-bold text-white hover:bg-zinc-800 cursor-pointer"
                >
                  تسجيل الدخول بجوجل
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="اكتب اسمك الثلاثي..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  البريد الإلكتروني (للفاتورة والتواصل) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">رقم الهاتف المحمول *</label>
                <input
                  type="tel"
                  required
                  placeholder="01012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">المحافظة / المدينة *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                >
                  <option value="القاهرة">القاهرة</option>
                  <option value="الجيزة">الجيزة</option>
                  <option value="الإسكندرية">الإسكندرية</option>
                  <option value="المنصورة">المنصورة</option>
                  <option value="طنطا">طنطا</option>
                  <option value="الشرقية">الشرقية</option>
                  <option value="المنوفية">المنوفية</option>
                  <option value="بورسعيد">بورسعيد</option>
                  <option value="السويس">السويس</option>
                  <option value="الإسماعيلية">الإسماعيلية</option>
                  <option value="أسيوط">أسيوط</option>
                  <option value="سوهاج">سوهاج</option>
                  <option value="قنا">قنا</option>
                  <option value="الأقصر">الأقصر</option>
                  <option value="أسوان">أسوان</option>
                  <option value="محافظة أخرى">محافظة أخرى</option>
                </select>
              </div>
            </div>

            {hasPhysical && (
              <div className="space-y-4 pt-2 border-t border-zinc-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-950">
                  <Package className="w-4 h-4 text-zinc-900" />
                  <span>عنوان شحن وتوصيل المنتجات العادية</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    العنوان بالتفصيل *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="اكتب عنوانك بالتفصيل لتسهيل وصول المندوب..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs text-zinc-500">المبلغ الإجمالي (بدون ضريبة مضافة):</span>
                <p className="text-xl font-black text-zinc-950 tabular-nums">
                  {formatPrice(total, branding.currencySymbol)}
                </p>
              </div>
              <button
                type="submit"
                className={`py-3 px-6 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 cursor-pointer ${theme.primary}`}
              >
                <span>متابعة لطرق الدفع المصرية</span>
                <ArrowLeft className="w-4 h-4 rtl:rotate-0 rotate-180" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Egyptian Payment Gateways */}
        {step === 'payment' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-950">اختر وسيلة الدفع</h3>
                <p className="text-xs text-zinc-500">طرق دفع محلية معتمدة وسريعة داخل جمهورية مصر العربية</p>
              </div>
              <button
                type="button"
                onClick={() => setStep('info')}
                className="text-xs text-zinc-600 hover:text-zinc-950 underline cursor-pointer"
              >
                تعديل البيانات
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gateways.vodafoneCash.enabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('vodafone_cash')}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-start justify-between cursor-pointer ${
                    paymentMethod === 'vodafone_cash'
                      ? 'border-zinc-950 bg-zinc-50 ring-2 ring-zinc-950 shadow-xs'
                      : 'border-zinc-200 bg-white hover:border-zinc-400'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-950 block">فودافون كاش والمحافظ الذكية</span>
                    <span className="text-[11px] text-zinc-500 block">Vodafone, Orange, Etisalat, WE</span>
                  </div>
                  <span className="text-lg">📱</span>
                </button>
              )}

              {gateways.instapay.enabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('instapay')}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-start justify-between cursor-pointer ${
                    paymentMethod === 'instapay'
                      ? 'border-zinc-950 bg-zinc-50 ring-2 ring-zinc-950 shadow-xs'
                      : 'border-zinc-200 bg-white hover:border-zinc-400'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-950 block">إنستاباي InstaPay</span>
                    <span className="text-[11px] text-zinc-500 block">تحويل بنكي لحظي عبر المعرف أو الرقم</span>
                  </div>
                  <span className="text-lg">⚡</span>
                </button>
              )}

              {gateways.fawry.enabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('fawry')}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-start justify-between cursor-pointer ${
                    paymentMethod === 'fawry'
                      ? 'border-zinc-950 bg-zinc-50 ring-2 ring-zinc-950 shadow-xs'
                      : 'border-zinc-200 bg-white hover:border-zinc-400'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-950 block">فوري Fawry Pay</span>
                    <span className="text-[11px] text-zinc-500 block">كود دفع مرجعي لماكينات فوري</span>
                  </div>
                  <span className="text-lg">🟡</span>
                </button>
              )}

              {gateways.meeza.enabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('meeza')}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-start justify-between cursor-pointer ${
                    paymentMethod === 'meeza'
                      ? 'border-zinc-950 bg-zinc-50 ring-2 ring-zinc-950 shadow-xs'
                      : 'border-zinc-200 bg-white hover:border-zinc-400'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-950 block">بطاقة ميزة الوطنية</span>
                    <span className="text-[11px] text-zinc-500 block">كافة كروت ميزة من البنوك والبريد</span>
                  </div>
                  <span className="text-lg">🇪🇬</span>
                </button>
              )}

              {gateways.card.enabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-start justify-between cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-zinc-950 bg-zinc-50 ring-2 ring-zinc-950 shadow-xs'
                      : 'border-zinc-200 bg-white hover:border-zinc-400'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-950 block">بطاقات Visa / MasterCard</span>
                    <span className="text-[11px] text-zinc-500 block">دفع مباشر آمن ومشفر</span>
                  </div>
                  <span className="text-lg">💳</span>
                </button>
              )}

              {gateways.cod.enabled && hasPhysical && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-start justify-between cursor-pointer ${
                    paymentMethod === 'cod'
                      ? 'border-zinc-950 bg-zinc-50 ring-2 ring-zinc-950 shadow-xs'
                      : 'border-zinc-200 bg-white hover:border-zinc-400'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-950 block">الدفع عند الاستلام (COD)</span>
                    <span className="text-[11px] text-zinc-500 block">ادفع نقداً لمندوب الشحن عند الاستلام</span>
                  </div>
                  <span className="text-lg">💵</span>
                </button>
              )}
            </div>

            {/* Method Instructions */}
            {paymentMethod === 'vodafone_cash' && (
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-zinc-500 block">رقم محفظة التحويل الرسمية:</span>
                    <span className="text-sm font-mono font-black text-rose-600">
                      {gateways.vodafoneCash.walletNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyWalletNumber}
                    className="px-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-zinc-900 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    {copiedWallet ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWallet ? 'تم النسخ' : 'نسخ الرقم'}</span>
                  </button>
                </div>
                <p className="text-zinc-600 leading-relaxed text-[11px]">{gateways.vodafoneCash.instructions}</p>
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-zinc-700">
                    رقم المحفظة المحول منها (لتسريع التحقق):
                  </label>
                  <input
                    type="text"
                    placeholder="010xxxxxxxx"
                    value={walletPhoneUsed}
                    onChange={(e) => setWalletPhoneUsed(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'instapay' && (
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-zinc-500 block">معرف إنستاباي (IPA):</span>
                    <span className="text-xs font-mono font-black text-purple-700">
                      {gateways.instapay.ipaAddress}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block">أو رقم هاتف الحساب:</span>
                    <span className="text-xs font-mono font-black text-purple-700">{gateways.instapay.phone}</span>
                  </div>
                </div>
                <p className="text-zinc-600 leading-relaxed text-[11px]">{gateways.instapay.instructions}</p>
                <div>
                  <label className="block text-[11px] font-semibold mb-1 text-zinc-700">
                    الرقم المرجعي لعملية إنستاباي (اختياري):
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: REF-1092847"
                    value={instapayRef}
                    onChange={(e) => setInstapayRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'fawry' && (
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2 text-xs">
                <div className="font-bold text-zinc-950">
                  🟡 كود الخدمة في ماكينات فوري: {gateways.fawry.merchantCode}
                </div>
                <p className="text-zinc-600 text-[11px] leading-relaxed">
                  سيتم إصدار كود سداد فوري مرجعي خاص بطلبك عند التأكيد أدناه، وتستطيع السداد في أقرب فرع فوري خلال 48 ساعة.
                </p>
              </div>
            )}

            {(paymentMethod === 'meeza' || paymentMethod === 'card') && (
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">رقم البطاقة (16 رقم)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="5078 •••• •••• ••••"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-mono"
                    />
                    <CreditCard className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">الصلاحية (MM/YY)</label>
                    <input
                      type="text"
                      placeholder="08/28"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 mb-1">رمز CVV</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="•••"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'cod' && (
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
                <span className="font-bold block text-zinc-950">الدفع نقداً عند الباب</span>
                <p className="text-zinc-600 text-[11px]">
                  سيقوم مندوب الشحن بالتواصل معك هاتفياً قبل الوصول. يرجى تجهيز المبلغ المطلوب نقداً.
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs text-zinc-500">المجموع النهائي (0% ضريبة مضافة):</span>
                <p className="text-2xl font-black text-zinc-950 tabular-nums">
                  {formatPrice(total, branding.currencySymbol)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleProcessOrder}
                className={`py-3.5 px-8 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer ${theme.primary}`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>تأكيد الطلب وإرساله للمراجعة</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <div className="p-12 text-center space-y-4">
            <div className="w-14 h-14 border-4 border-zinc-950 border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-zinc-950">جاري تسجيل طلبك...</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              يتم الآن حفظ بيانات الطلب وتوجيهه لمراجعة التحويل المالي في {branding.storeName}...
            </p>
          </div>
        )}

        {/* Step 4: Pending Payment Review */}
        {step === 'success' && createdOrder && (
          <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
            <div className="text-center space-y-2 pb-4 border-b border-zinc-200">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-zinc-950">
                تم استلام طلبك وهو قيد التحقق من وصول الأموال
              </h3>
              <p className="text-xs text-zinc-600">
                رقم الطلب الخاص بك:{' '}
                <span className="font-mono font-bold text-zinc-950">{createdOrder.id}</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-2 text-amber-950 leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>فترة المراجعة وتأكيد الدفع اليدوي</span>
              </div>
              <p>
                يقوم مسؤول متجر <strong>{branding.storeName}</strong> حالياً بمراجعة وتأكيد عملية التحويل الخاصة بك عبر (
                {getPaymentMethodDetails(createdOrder.paymentMethod).name}).
              </p>
              <p className="text-[11px] text-amber-800 space-y-1">
                {createdOrder.items.some((i) => i.type === 'digital') && (
                  <span className="block">
                    ⚡ للطلبات الرقمية: فور التأكد من وصول المبلغ، سيتم تسليم طلبك الرقمي مباشرة في{' '}
                    <strong>خانة الإشعارات بالموقع</strong> وحفظه بشكل دائم في قسم <strong>«طلباتي»</strong>.
                  </span>
                )}
                {createdOrder.items.some((i) => i.type === 'physical') && (
                  <span className="block">
                    📦 للمنتجات العادية: سيتم تجهيز شحنتك وإرسالها لعنوانك مع تحديث رقم التتبع داخل قسم{' '}
                    <strong>«طلباتي»</strong>.
                  </span>
                )}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">العميل:</span>
                <span className="font-bold text-zinc-950">{createdOrder.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">البريد الإلكتروني:</span>
                <span className="font-mono text-zinc-700">{createdOrder.customer.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">طريقة الدفع:</span>
                <span className="font-bold text-zinc-900">
                  {getPaymentMethodDetails(createdOrder.paymentMethod).name}
                </span>
              </div>
              {createdOrder.paymentDetails?.walletNumberUsed && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">رقم المحفظة المحول منها:</span>
                  <span className="font-mono font-bold text-zinc-950">
                    {createdOrder.paymentDetails.walletNumberUsed}
                  </span>
                </div>
              )}
              {createdOrder.paymentDetails?.instapayRef && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">الرقم المرجعي InstaPay:</span>
                  <span className="font-mono font-bold text-zinc-950">
                    {createdOrder.paymentDetails.instapayRef}
                  </span>
                </div>
              )}
              {createdOrder.paymentDetails?.fawryRefNumber && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">كود فوري المرجعي:</span>
                  <span className="font-mono font-bold text-zinc-950">
                    {createdOrder.paymentDetails.fawryRefNumber}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-zinc-200 font-bold">
                <span>الإجمالي المطلوب:</span>
                <span className="text-sm font-mono text-zinc-950">
                  {formatPrice(createdOrder.total, branding.currencySymbol)}
                </span>
              </div>
            </div>

            {createdOrder.trackingNumber && (
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-zinc-950">
                  <Package className="w-4 h-4 text-zinc-900" />
                  <span>تفاصيل شحنة المنتج العادي</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">شركة التوصيل:</span>
                    <span className="font-semibold text-zinc-900">{createdOrder.carrier}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">رقم التتبع:</span>
                    <span className="font-mono font-bold text-zinc-950">{createdOrder.trackingNumber}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenInvoice) onOpenInvoice(createdOrder);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold rounded-xl border border-zinc-300 bg-zinc-50 text-zinc-950 hover:bg-zinc-100 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-zinc-900" />
                  <span>طباعة / تنزيل الفاتورة كصورة (PNG)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenPortal) onOpenPortal();
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold rounded-xl border border-zinc-300 hover:bg-zinc-100 transition-colors flex items-center justify-center gap-1.5 text-zinc-800 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>الانتقال إلى طلباتي</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer ${theme.primary}`}
              >
                العودة للمتجر
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
