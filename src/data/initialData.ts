import { Product, Order, Customer, StoreBranding, NotificationItem, SupportTicket, Coupon } from '../types/store';

export const INITIAL_BRANDING: StoreBranding = {
  storeName: 'Origin Shop',
  storeTagline: 'متجر الطلبات الرقمية والمنتجات العادية المعتمد في مصر',
  logoUrl: './origin-logo.png',
  primaryTheme: 'slate',
  fontChoice: 'cairo',
  announcementText: '✨ مرحباً بكم في Origin Shop - طلبات رقمية ومنتجات عادية موثقة بدفع مصري آمن',
  showAnnouncement: true,
  currency: 'EGP',
  currencySymbol: 'ج.م',
  taxRate: 0, // 0% VAT - Tax removed
  defaultShippingFee: 35,
  freeShippingThreshold: 500,
  estimatedShippingTime: '1 - 3 أيام عمل لجميع محافظات مصر',
  contactPhone: '01023456789',
  whatsappNumber: '201023456789',
  contactEmail: 'support@originshop.eg',
  workingHours: 'يومياً من 10 صباحاً حتى 12 منتصف الليل',
  invoiceFooterNote: 'هذه الفاتورة صادرة إلكترونياً من Origin Shop وبقيمة ضريبة مضافة 0%.',
  allowReviews: true,
  showTrendingTicker: true,
  requireAuthForCheckout: false,
  maintenanceMode: false,
  maintenanceMessage: 'المتجر في وضع الصيانة المؤقت لتحديث المنتجات، نعود إليكم خلال دقائق.',
  heroBadgeText: 'المتجر المعتمد للطلبات الرقمية والمنتجات العادية في مصر',
  heroHeadline: 'طلبات رقمية ومنتجات عادية موثقة بدفع محلي آمن',
  heroDescription: 'احصل على طلباتك الرقمية إلكترونياً مباشرة في حسابك بعد تأكيد الدفع دون مصاريف شحن، أو اطلب المنتجات العادية لتصلك لباب منزلك في جميع محافظات مصر.',
  heroPrimaryCta: 'تصفح كافة المنتجات',
  heroDigitalCta: 'الطلبات الرقمية',
  heroPhysicalCta: 'المنتجات العادية',
  showHeroStats: true,
  catalogTitle: 'كافة المعروضات المتاحة للطلب',
  showValueSection: true,
  valueCard1Title: 'طرق دفع مصرية فورية',
  valueCard1Desc: 'ادفع عبر فودافون كاش، إنستاباي InstaPay، فوري، كروت ميزة، البطاقات البنكية أو الدفع عند الاستلام للمنتجات العادية.',
  valueCard2Title: 'تسليم موثق للطلبات الرقمية وشحن للمنتجات العادية',
  valueCard2Desc: 'الطلبات الرقمية تصلك إلكترونياً مباشرة في الإشعارات وقسم «طلباتي» فور تأكيد الدفع، والمنتجات العادية تُشحن لعنوانك مع تتبع مباشر.',
  valueCard3Title: 'فواتير قابلة للتنزيل كصورة PNG',
  valueCard3Desc: 'احصل على فاتورة معتمدة لطلبك خالية تماماً من الضريبة المضافة (0%) مع إمكانية تنزيلها فوراً كصورة عالية الدقة.',
  adminPassword: 'admin',
  paymentGateways: {
    vodafoneCash: {
      enabled: true,
      walletNumber: '01023456789',
      instructions: 'حول إجمالي المبلغ على رقم محفظة فودافون كاش / المحافظ الإلكترونية، وسيتم مراجعة التحويل وتأكيد طلبك وتسليم منتجك فوراً.'
    },
    instapay: {
      enabled: true,
      ipaAddress: 'originshop@instapay',
      phone: '01023456789',
      instructions: 'قم بالتحويل اللحظي عبر تطبيق إنستاباي InstaPay إلى عنوان الدفع أو رقم الهاتف الموضح.'
    },
    fawry: {
      enabled: true,
      merchantCode: '78942',
      instructions: 'ادفع عبر أي منفذ فوري في مصر باستخدام كود الخدمة 788 ورقم المرجع الخاص بالطلب.'
    },
    meeza: {
      enabled: true,
      instructions: 'الدفع المباشر ببطاقة ميزة الوطنية المصرية من كافة البنوك المصرية والبريد المصري.'
    },
    card: {
      enabled: true,
      instructions: 'الدفع الإلكتروني الآمن ببطاقات فيزا وماستركارد بجميع البنوك.'
    },
    cod: {
      enabled: true,
      extraFee: 25,
      instructions: 'الدفع نقداً عند استلام الشحنة من مندوب التوصيل (متاح للمنتجات العادية فقط في مصر).'
    }
  }
};

// Initial admin-managed coupons with full controls
export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coup-1',
    code: 'WELCOME10',
    discountType: 'percentage',
    discountValue: 10,
    minSpend: 100,
    active: true,
    usageCount: 0,
    expiresAt: '2027-12-31'
  },
  {
    id: 'coup-2',
    code: 'ORIGIN20',
    discountType: 'percentage',
    discountValue: 20,
    minSpend: 200,
    active: true,
    usageCount: 0,
    expiresAt: '2027-12-31'
  },
  {
    id: 'coup-3',
    code: 'SAVE50',
    discountType: 'fixed',
    discountValue: 50,
    minSpend: 300,
    active: true,
    usageCount: 0,
    expiresAt: '2027-12-31'
  }
];

// Clean slate: No fake mock products!
export const INITIAL_PRODUCTS: Product[] = [];

// Clean slate: No fake mock orders!
export const INITIAL_ORDERS: Order[] = [];

// Clean slate: No fake customers!
export const INITIAL_CUSTOMERS: Customer[] = [];

// Clean slate: No fake notifications!
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

// Clean slate: No fake support tickets!
export const INITIAL_TICKETS: SupportTicket[] = [];
