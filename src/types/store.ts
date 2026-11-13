export type ProductType = 'physical' | 'digital';

export interface ProductReview {
  id: string;
  customerName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
  verifiedPurchase?: boolean;
}

export interface DigitalFile {
  fileName: string;
  fileSize: string;
  fileFormat: string;
  version: string;
  licenseType: string;
  totalDownloadsAllowed: number;
  fileData?: string; // Stored file data/content for custom admin uploads
  checksum?: string;
  directDownloadUrl?: string;
}

export interface PhysicalDetails {
  weight: string;
  dimensions: string;
  shippingDays: string;
  sku: string;
}

export interface Product {
  id: string;
  name: string;
  nameEn?: string;
  type: ProductType;
  category: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  gallery?: string[];
  description: string;
  descriptionEn?: string;
  features: string[];
  inStock: boolean;
  stockCount?: number;
  salesCount: number;
  rating: number;
  reviewsCount: number;
  reviews?: ProductReview[];
  featured?: boolean;
  digitalFile?: DigitalFile;
  physicalDetails?: PhysicalDetails;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  name?: string;
  type: ProductType;
  price: number;
  quantity: number;
  image: string;
  licenseKey?: string;
  fileName?: string;
  fileSize?: string;
  fileData?: string;
}

export type DigitalDeliveryType = 'text' | 'image' | 'file';

export interface DigitalDelivery {
  productId: string;
  productName: string;
  deliveryType?: DigitalDeliveryType; // 'text' | 'image' | 'file'
  // For text/code/credentials:
  textContent?: string;
  // For images/screenshots:
  imageData?: string;
  imageCaption?: string;
  // For files:
  fileName: string;
  fileSize: string;
  licenseKey: string;
  downloadCount: number;
  maxDownloads: number;
  expiresAt: string;
  downloadUrl: string;
  fileData?: string;
  deliveredAt?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
export type PaymentMethod = 
  | 'vodafone_cash' 
  | 'instapay' 
  | 'fawry' 
  | 'meeza' 
  | 'card' 
  | 'cod';

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';

export interface Order {
  id: string;
  userId?: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  shippingFee: number;
  tax: number; // 0 EGP (VAT removed)
  total: number;
  paymentMethod: PaymentMethod;
  paymentDetails?: {
    walletNumberUsed?: string;
    fawryRefNumber?: string;
    instapayRef?: string;
    cashOnDeliveryConfirmed?: boolean;
  };
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  digitalDeliveries: DigitalDelivery[];
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  ordersCount: number;
  totalSpent: number;
  joinedDate: string;
  status: 'active' | 'vip' | 'new';
  avatar?: string;
}

export interface GoogleUserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  givenName?: string;
  phone?: string;
  city?: string;
  address?: string;
  postalCode?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed'; // % or EGP
  discountValue: number;
  minSpend?: number;
  maxDiscount?: number;
  expiresAt?: string;
  active: boolean;
  usageCount: number;
  maxUsage?: number;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  createdAtMs?: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'order' | 'download' | 'shipping' | 'promo' | 'delivery';
  actionLabel?: string;
  targetView?: 'downloads' | 'orders' | 'catalog';
  deliveryPayload?: {
    orderId: string;
    productName: string;
    deliveryType: DigitalDeliveryType;
    textContent?: string;
    imageData?: string;
    fileData?: string;
    fileName?: string;
    licenseKey?: string;
  };
}

export interface ChatReply {
  id: string;
  sender: 'customer' | 'agent' | 'admin';
  senderName: string;
  text: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  subject: string;
  message: string;
  orderRef?: string;
  createdAt: string;
  status: 'unread' | 'read' | 'replied';
  replies: ChatReply[];
}

export interface PaymentGatewaysConfig {
  vodafoneCash: {
    enabled: boolean;
    walletNumber: string;
    instructions: string;
  };
  instapay: {
    enabled: boolean;
    ipaAddress: string;
    phone: string;
    instructions: string;
  };
  fawry: {
    enabled: boolean;
    merchantCode: string;
    instructions: string;
  };
  meeza: {
    enabled: boolean;
    instructions: string;
  };
  card: {
    enabled: boolean;
    instructions: string;
  };
  cod: {
    enabled: boolean;
    extraFee: number;
    instructions: string;
  };
}

export interface StoreBranding {
  storeName: string;
  storeTagline: string;
  logoUrl?: string;
  primaryTheme: 'emerald' | 'amber' | 'indigo' | 'slate' | 'rose';
  fontChoice: 'cairo' | 'tajawal' | 'system';
  announcementText: string;
  showAnnouncement: boolean;
  currency: 'EGP' | 'SAR' | 'USD';
  currencySymbol: string;
  taxRate: number; // 0 for zero VAT
  defaultShippingFee: number;
  freeShippingThreshold: number;
  estimatedShippingTime?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  contactEmail?: string;
  workingHours?: string;
  invoiceFooterNote?: string;
  allowReviews: boolean;
  showTrendingTicker: boolean;
  requireAuthForCheckout: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  // Storefront Interface Customization (Editable in Admin Dashboard)
  heroBadgeText?: string;
  heroHeadline?: string;
  heroDescription?: string;
  heroPrimaryCta?: string;
  heroDigitalCta?: string;
  heroPhysicalCta?: string;
  showHeroStats?: boolean;
  catalogTitle?: string;
  showValueSection?: boolean;
  valueCard1Title?: string;
  valueCard1Desc?: string;
  valueCard2Title?: string;
  valueCard2Desc?: string;
  valueCard3Title?: string;
  valueCard3Desc?: string;
  // Editable Store Policies
  privacyPolicyText?: string;
  termsPolicyText?: string;
  refundPolicyText?: string;
  adminPassword: string;
  paymentGateways: PaymentGatewaysConfig;
}
