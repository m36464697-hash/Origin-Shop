import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Users,
  Package,
  Palette,
  DownloadCloud,
  TrendingUp,
  Plus,
  Search,
  Check,
  Trash2,
  Sparkles,
  ArrowRight,
  CreditCard,
  MessageSquare,
  Lock,
  Upload,
  CheckCircle2,
  X,
  Send,
  KeyRound,
  Tag,
  Percent,
  Printer,
  Pencil,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  Truck,
  Download,
  RotateCcw,
  ShieldCheck,
  Store,
  Cloud,
  LayoutTemplate,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';
import {
  Order,
  Product,
  Customer,
  StoreBranding,
  OrderStatus,
  SupportTicket,
  PaymentGatewaysConfig,
  Coupon,
  DigitalDeliveryType
} from '../types/store';
import { formatPrice, formatDate, getOrderStatusLabel, getPaymentMethodDetails } from '../utils/formatters';
import { THEME_PALETTES } from '../utils/theme';
import { INITIAL_BRANDING } from '../data/initialData';
import { BrandWordmark } from './BrandWordmark';

interface AdminDashboardProps {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  branding: StoreBranding;
  supportTickets: SupportTicket[];
  coupons: Coupon[];
  onUpdateBranding: (branding: StoreBranding) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, tracking?: string, carrier?: string) => void;
  onConfirmOrderPayment?: (orderId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
  onAddProduct: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onToggleProductStock?: (productId: string) => void;
  onDeleteProduct: (productId: string) => void;
  onReplyToTicket: (ticketId: string, replyText: string) => void;
  onAddCoupon: (coupon: Coupon) => void;
  onToggleCoupon: (couponId: string) => void;
  onDeleteCoupon: (couponId: string) => void;
  onDeliverDigitalOrder?: (
    orderId: string,
    payload: {
      productName: string;
      deliveryType: DigitalDeliveryType;
      textContent?: string;
      imageData?: string;
      fileData?: string;
      fileName?: string;
      licenseKey?: string;
    }
  ) => void;
  onOpenInvoice?: (order: Order) => void;
  onExportBackup?: () => void;
  onResetDefaults?: () => void;
  isCloudAdmin?: boolean;
  onConnectCloudAdmin?: () => void;
  onLockAdmin?: () => void;
  onCloseAdmin: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  products,
  customers,
  branding,
  supportTickets,
  coupons,
  onUpdateBranding,
  onUpdateOrderStatus,
  onConfirmOrderPayment,
  onDeleteOrder,
  onAddProduct,
  onEditProduct,
  onToggleProductStock,
  onDeleteProduct,
  onReplyToTicket,
  onAddCoupon,
  onToggleCoupon,
  onDeleteCoupon,
  onDeliverDigitalOrder,
  onOpenInvoice,
  onExportBackup,
  onResetDefaults,
  isCloudAdmin,
  onConnectCloudAdmin,
  onLockAdmin,
  onCloseAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'products' | 'coupons' | 'payments' | 'messages' | 'customers' | 'storefront' | 'branding'
  >('overview');

  // Orders & Filters
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [confirmDeleteOrderId, setConfirmDeleteOrderId] = useState<string | null>(null);

  // Derived live selectedOrder so modal never displays stale data
  const selectedOrder = selectedOrderId ? orders.find((o) => o.id === selectedOrderId) || null : null;

  // Manual Digital Product Delivery State
  const [selectedDigitalItemIdx, setSelectedDigitalItemIdx] = useState<number>(0);
  const [deliveryFormat, setDeliveryFormat] = useState<DigitalDeliveryType>('text');
  const [deliveryText, setDeliveryText] = useState('');
  const [deliveryImage, setDeliveryImage] = useState<string | undefined>(undefined);
  const [deliveryFile, setDeliveryFile] = useState<string | undefined>(undefined);
  const [deliveryFileName, setDeliveryFileName] = useState('');
  const [deliveryNotice, setDeliveryNotice] = useState<{ text: string; isError?: boolean } | null>(null);

  // Tracking inputs
  const [newTracking, setNewTracking] = useState('');
  const [newCarrier, setNewCarrier] = useState('شحن إكسبريس مصر (Bosta / Aramex)');

  // Products Filters & Delete Confirm
  const [productSearch, setProductSearch] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState<'all' | 'digital' | 'physical'>('all');
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);

  // Add / Edit Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProdName, setNewProdName] = useState('');
  const [newProdNameEn, setNewProdNameEn] = useState('');
  const [newProdType, setNewProdType] = useState<'digital' | 'physical'>('digital');
  const [newProdCategory, setNewProdCategory] = useState('منتجات رقمية');
  const [newProdPrice, setNewProdPrice] = useState<number>(150);
  const [newProdComparePrice, setNewProdComparePrice] = useState<number | undefined>(undefined);
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [featuresList, setFeaturesList] = useState<string[]>(['تسليم موثق', 'دعم فني مباشر']);
  const [currentFeatureInput, setCurrentFeatureInput] = useState('');

  // Digital Product Upload specific
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState('');
  const [uploadedFileData, setUploadedFileData] = useState<string | undefined>(undefined);
  const [digitalLicenseType, setDigitalLicenseType] = useState('ترخيص استخدام شخصي وتجاري');
  const [digitalDownloadsAllowed, setDigitalDownloadsAllowed] = useState(5);

  // Physical Product specific
  const [physicalWeight, setPhysicalWeight] = useState('500 غرام');
  const [physicalDimensions, setPhysicalDimensions] = useState('20 × 15 × 5 سم');
  const [physicalShippingDays, setPhysicalShippingDays] = useState('1 - 2 أيام عمل داخل مصر');
  const [physicalSku, setPhysicalSku] = useState(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
  const [physicalStock, setPhysicalStock] = useState(10);

  // Coupon management form state
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState<number>(15);
  const [newCouponMinSpend, setNewCouponMinSpend] = useState<number>(0);
  const [newCouponMaxDiscount, setNewCouponMaxDiscount] = useState<number>(0);
  const [newCouponMaxUsage, setNewCouponMaxUsage] = useState<number>(0);
  const [newCouponExpiresAt, setNewCouponExpiresAt] = useState<string>('2027-12-31');

  // Support Ticket reply modal (derived by ID to avoid stale object)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const selectedTicket = selectedTicketId
    ? supportTickets.find((t) => t.id === selectedTicketId) || null
    : null;

  // Password & Branding states
  const [newPassword, setNewPassword] = useState('');
  const [passwordSavedNotice, setPasswordSavedNotice] = useState(false);
  const [settingsSavedNotice, setSettingsSavedNotice] = useState(false);
  const [confirmResetStore, setConfirmResetStore] = useState(false);
  const [gateways, setGateways] = useState<PaymentGatewaysConfig>(branding.paymentGateways);
  const [gatewaysSavedNotice, setGatewaysSavedNotice] = useState(false);

  useEffect(() => {
    setGateways(branding.paymentGateways);
  }, [branding.paymentGateways]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      onUpdateBranding({ ...branding, logoUrl: event.target?.result as string });
      setSettingsSavedNotice(true);
      setTimeout(() => setSettingsSavedNotice(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  const theme = THEME_PALETTES[branding.primaryTheme] || THEME_PALETTES.slate;

  // Real KPI calculations
  const totalRevenue = orders.reduce((acc, o) => acc + (o.paymentStatus === 'paid' ? o.total : 0), 0);
  const pendingOrders = orders.filter((o) => o.orderStatus === 'pending' || o.paymentStatus === 'pending');
  const digitalDeliveriesCount = orders.reduce((acc, o) => acc + (o.digitalDeliveries?.length || 0), 0);
  const unreadTicketsCount = supportTickets.filter((t) => t.status === 'unread').length;

  const filteredOrders = orders.filter((o) => {
    const matchesFilter = orderFilter === 'all' || o.orderStatus === orderFilter;
    const q = orderSearch.toLowerCase();
    const matchesSearch =
      !q ||
      o.id.toLowerCase().includes(q) ||
      o.customer.name.toLowerCase().includes(q) ||
      o.customer.email.toLowerCase().includes(q) ||
      o.customer.phone.includes(q);
    return matchesFilter && matchesSearch;
  });

  const filteredProducts = products.filter((p) => {
    const matchesType = productTypeFilter === 'all' || p.type === productTypeFilter;
    const q = productSearch.toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  const openOrderModal = (order: Order) => {
    setSelectedOrderId(order.id);
    setSelectedDigitalItemIdx(0);
    setDeliveryFormat('text');
    setDeliveryText('');
    setDeliveryImage(undefined);
    setDeliveryFile(undefined);
    setDeliveryFileName('');
    setDeliveryNotice(null);
    setConfirmDeleteOrderId(null);
    setNewTracking(order.trackingNumber || '');
    setNewCarrier(order.carrier || 'شحن إكسبريس مصر');
  };

  const openAddProductModal = () => {
    setEditingProductId(null);
    setNewProdName('');
    setNewProdNameEn('');
    setNewProdType('digital');
    setNewProdCategory('منتجات رقمية');
    setNewProdPrice(150);
    setNewProdComparePrice(undefined);
    setNewProdDesc('');
    setNewProdImage('');
    setFeaturesList(['تسليم موثق', 'دعم فني مباشر']);
    setCurrentFeatureInput('');
    setUploadedFileName('');
    setUploadedFileSize('');
    setUploadedFileData(undefined);
    setDigitalLicenseType('ترخيص استخدام شخصي وتجاري');
    setDigitalDownloadsAllowed(5);
    setPhysicalWeight('500 غرام');
    setPhysicalDimensions('20 × 15 × 5 سم');
    setPhysicalShippingDays('1 - 2 أيام عمل داخل مصر');
    setPhysicalSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setPhysicalStock(10);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProductId(prod.id);
    setNewProdName(prod.name);
    setNewProdNameEn(prod.nameEn || '');
    setNewProdType(prod.type);
    setNewProdCategory(prod.category);
    setNewProdPrice(prod.price);
    setNewProdComparePrice(prod.compareAtPrice);
    setNewProdDesc(prod.description);
    setNewProdImage(prod.image);
    setFeaturesList(prod.features?.length ? [...prod.features] : ['تسليم موثق']);
    setCurrentFeatureInput('');
    setUploadedFileName(prod.digitalFile?.fileName || '');
    setUploadedFileSize(prod.digitalFile?.fileSize || '');
    setUploadedFileData(prod.digitalFile?.fileData);
    setDigitalLicenseType(prod.digitalFile?.licenseType || 'ترخيص استخدام شخصي وتجاري');
    setDigitalDownloadsAllowed(prod.digitalFile?.totalDownloadsAllowed || 5);
    setPhysicalWeight(prod.physicalDetails?.weight || '500 غرام');
    setPhysicalDimensions(prod.physicalDetails?.dimensions || '20 × 15 × 5 سم');
    setPhysicalShippingDays(prod.physicalDetails?.shippingDays || '1 - 2 أيام عمل داخل مصر');
    setPhysicalSku(prod.physicalDetails?.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setPhysicalStock(prod.stockCount ?? 10);
    setIsProductModalOpen(true);
  };

  const handleDigitalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setUploadedFileSize(file.size > 1024 * 1024 ? `${sizeInMB} MB` : `${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedFileData(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewProdImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddFeature = () => {
    if (currentFeatureInput.trim()) {
      setFeaturesList((prev) => [...prev, currentFeatureInput.trim()]);
      setCurrentFeatureInput('');
    }
  };

  const handleRemoveFeature = (idx: number) => {
    setFeaturesList((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const finalImage =
      newProdImage.trim() ||
      (newProdType === 'digital'
        ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
        : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80');

    const existingProd = editingProductId ? products.find((p) => p.id === editingProductId) : null;

    const productData: Product = {
      id: editingProductId || `prod-${Date.now()}`,
      name: newProdName.trim(),
      nameEn: newProdNameEn.trim() || newProdName.trim(),
      type: newProdType,
      category: newProdCategory.trim() || (newProdType === 'digital' ? 'منتجات رقمية' : 'منتجات عامة'),
      price: Math.max(1, Number(newProdPrice)),
      compareAtPrice:
        newProdComparePrice && newProdComparePrice > Number(newProdPrice)
          ? Number(newProdComparePrice)
          : undefined,
      image: finalImage,
      description: newProdDesc.trim() || 'منتج معتمد وعالي الجودة من متجر Origin Shop.',
      features: featuresList.length > 0 ? featuresList : ['تسليم موثق', 'دعم فني مباشر'],
      inStock: existingProd ? existingProd.inStock : true,
      stockCount: newProdType === 'physical' ? Number(physicalStock) : undefined,
      salesCount: existingProd ? existingProd.salesCount : 0,
      rating: existingProd ? existingProd.rating : 5.0,
      reviewsCount: existingProd ? existingProd.reviewsCount : 0,
      reviews: existingProd ? existingProd.reviews : [],
      digitalFile:
        newProdType === 'digital'
          ? {
              fileName: uploadedFileName || 'طلب رقمي مخصص',
              fileSize: uploadedFileSize || 'حسب الطلب',
              fileFormat: uploadedFileName ? uploadedFileName.split('.').pop()?.toUpperCase() || 'FILE' : 'DIGITAL',
              version: '1.0.0',
              licenseType: digitalLicenseType,
              totalDownloadsAllowed: Number(digitalDownloadsAllowed) || 5,
              fileData: uploadedFileData
            }
          : undefined,
      physicalDetails:
        newProdType === 'physical'
          ? {
              weight: physicalWeight,
              dimensions: physicalDimensions,
              shippingDays: physicalShippingDays,
              sku: physicalSku
            }
          : undefined
    };

    if (editingProductId && onEditProduct) {
      onEditProduct(productData);
    } else {
      onAddProduct(productData);
    }
    setIsProductModalOpen(false);
    setEditingProductId(null);
  };

  const handleSaveGateways = () => {
    onUpdateBranding({ ...branding, paymentGateways: gateways });
    setGatewaysSavedNotice(true);
    setTimeout(() => setGatewaysSavedNotice(false), 3000);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    onUpdateBranding({ ...branding, adminPassword: newPassword.trim() });
    setNewPassword('');
    setPasswordSavedNotice(true);
    setTimeout(() => setPasswordSavedNotice(false), 3000);
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim() || newCouponValue <= 0) return;

    const newCoupon: Coupon = {
      id: `coup-${Date.now()}`,
      code: newCouponCode.trim().toUpperCase(),
      discountType: newCouponType,
      discountValue: Number(newCouponValue),
      minSpend: newCouponMinSpend > 0 ? Number(newCouponMinSpend) : undefined,
      maxDiscount: newCouponMaxDiscount > 0 ? Number(newCouponMaxDiscount) : undefined,
      maxUsage: newCouponMaxUsage > 0 ? Number(newCouponMaxUsage) : undefined,
      expiresAt: newCouponExpiresAt || undefined,
      active: true,
      usageCount: 0
    };

    onAddCoupon(newCoupon);
    setIsAddCouponOpen(false);
    setNewCouponCode('');
    setNewCouponValue(15);
    setNewCouponMinSpend(0);
    setNewCouponMaxDiscount(0);
    setNewCouponMaxUsage(0);
  };

  const handleDeliveryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setDeliveryImage(event.target?.result as string);
      setDeliveryNotice(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDeliveryFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDeliveryFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setDeliveryFile(event.target?.result as string);
      setDeliveryNotice(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFulfillDigitalDelivery = () => {
    if (!selectedOrder) return;
    const digitalItems = selectedOrder.items.filter((i) => i.type === 'digital');
    const targetItem = digitalItems[selectedDigitalItemIdx] || digitalItems[0] || selectedOrder.items[0];
    if (!targetItem) return;

    if (deliveryFormat === 'text' && !deliveryText.trim()) {
      setDeliveryNotice({ text: 'يرجى كتابة النص أو الكود أو بيانات الحساب قبل الإرسال.', isError: true });
      return;
    }
    if (deliveryFormat === 'image' && !deliveryImage) {
      setDeliveryNotice({ text: 'يرجى اختيار ورفع صورة المنتج أولاً.', isError: true });
      return;
    }
    if (deliveryFormat === 'file' && !deliveryFile) {
      setDeliveryNotice({ text: 'يرجى اختيار الملف المراد إرساله للعميل أولاً.', isError: true });
      return;
    }

    if (onDeliverDigitalOrder) {
      const prodName = targetItem.productName || targetItem.name || 'منتج رقمي';
      onDeliverDigitalOrder(selectedOrder.id, {
        productName: prodName,
        deliveryType: deliveryFormat,
        textContent: deliveryFormat === 'text' ? deliveryText.trim() : undefined,
        imageData: deliveryFormat === 'image' ? deliveryImage : undefined,
        fileData: deliveryFormat === 'file' ? deliveryFile : undefined,
        fileName: deliveryFormat === 'file' ? deliveryFileName || `${prodName}.zip` : undefined,
        licenseKey: `ORIGIN-${Math.floor(100000 + Math.random() * 900000)}`
      });
    }

    setDeliveryNotice({ text: 'تم تأكيد استلام الأموال وإرسال المنتج كإشعار للعميل بنجاح!' });
    setDeliveryText('');
    setDeliveryImage(undefined);
    setDeliveryFile(undefined);
    setDeliveryFileName('');
    setTimeout(() => setDeliveryNotice(null), 4000);
  };

  const handleSendTicketReply = () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    onReplyToTicket(selectedTicket.id, replyMessage.trim());
    setReplyMessage('');
    setSelectedTicketId(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-16 text-right font-sans">
      {/* Top Admin Navigation Header with Enlarged Logo & Matching Brand Font */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={onCloseAdmin}
                className="px-3 py-2 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold border border-zinc-200 cursor-pointer shrink-0"
              >
                <ArrowRight className="w-4 h-4 rtl:rotate-0 rotate-180" />
                <span>العودة للمتجر</span>
              </button>
              <div className="h-6 w-px bg-zinc-200 hidden sm:block" />
              <div className="flex items-center gap-2.5">
                <div className="h-10 sm:h-11 px-2.5 py-1 rounded-xl bg-black flex items-center justify-center border border-zinc-900 shrink-0">
                  <img
                    src={branding.logoUrl || './origin-logo.png'}
                    alt="Origin Shop"
                    className="h-full w-auto max-w-[100px] object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <BrandWordmark storeName={branding.storeName} size="sm" />
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>لوحة الإدارة والتحكم</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onConnectCloudAdmin && (
                <button
                  type="button"
                  onClick={onConnectCloudAdmin}
                  className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                    isCloudAdmin
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                  title="مزامنة الطلبات والمنتجات عبر Firebase Firestore"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{isCloudAdmin ? 'مزامنة السحابة نشطة ✓' : 'ربط حساب الإدارة بالسحابة'}</span>
                </button>
              )}

              {onLockAdmin && (
                <button
                  type="button"
                  onClick={onLockAdmin}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="قفل لوحة التحكم وتسجيل الخروج من جلسة الإدارة"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>قفل اللوحة</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl overflow-x-auto text-xs font-semibold border border-zinc-200">
            {[
              { id: 'overview', label: 'الرئيسية', icon: TrendingUp },
              { id: 'products', label: `المنتجات (${products.length})`, icon: Package },
              {
                id: 'orders',
                label: `الطلبات (${orders.length})`,
                icon: ShoppingBag,
                badge: pendingOrders.length
              },
              { id: 'coupons', label: `الكوبونات (${coupons.length})`, icon: Tag },
              { id: 'payments', label: 'طرق الدفع', icon: CreditCard },
              {
                id: 'messages',
                label: 'الرسائل والدعم',
                icon: MessageSquare,
                badge: unreadTicketsCount
              },
              { id: 'customers', label: `العملاء (${customers.length})`, icon: Users },
              { id: 'storefront', label: 'واجهة الموقع', icon: LayoutTemplate },
              { id: 'branding', label: 'الإعدادات والأمان', icon: Palette }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap relative cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-white text-zinc-950 shadow-2xs font-bold border border-zinc-200/80'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold leading-none">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Real KPI strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                <span className="text-xs text-zinc-500 font-semibold">إجمالي المبيعات المؤكدة</span>
                <p className="text-2xl font-black text-zinc-950 tabular-nums">
                  {formatPrice(totalRevenue, branding.currencySymbol)}
                </p>
                <p className="text-[11px] text-zinc-400">من إجمالي {orders.length} طلبات حقيقية</p>
              </div>

              <button
                onClick={() => {
                  setActiveTab('orders');
                  setOrderFilter('pending');
                }}
                className="p-5 rounded-2xl bg-white border border-zinc-200 hover:border-zinc-400 shadow-2xs space-y-1 text-right transition-all cursor-pointer"
              >
                <span className="text-xs text-zinc-500 font-semibold">طلبات بانتظار تأكيد الدفع</span>
                <p className="text-2xl font-black text-amber-600 tabular-nums">{pendingOrders.length}</p>
                <p className="text-[11px] text-zinc-500">اضغط لمراجعة التحويلات والتسليم</p>
              </button>

              <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                <span className="text-xs text-zinc-500 font-semibold">المنتجات في المتجر</span>
                <p className="text-2xl font-black text-zinc-950 tabular-nums">{products.length}</p>
                <p className="text-[11px] text-zinc-400">
                  {products.filter((p) => p.type === 'digital').length} طلب رقمي ·{' '}
                  {products.filter((p) => p.type === 'physical').length} منتج عادي
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                <span className="text-xs text-zinc-500 font-semibold">التسليمات والرسائل</span>
                <p className="text-2xl font-black text-zinc-950 tabular-nums">{digitalDeliveriesCount}</p>
                <p className="text-[11px] text-emerald-600 font-semibold">
                  {unreadTicketsCount} رسائل عملاء غير مقروءة
                </p>
              </div>
            </div>

            {/* Quick Actions Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950 text-white space-y-4 shadow-md border border-zinc-900">
              <div className="max-w-2xl space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 text-xs font-semibold text-zinc-200">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>إدارة متجرك بالكامل من مكان واحد</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black">
                  مرحباً بك في لوحة تحكم {branding.storeName}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  أضف الطلبات الرقمية والمنتجات العادية، راجع تحويلات العملاء وأكد استلام الأموال، سلّم الطلبات الرقمية مباشرة لحساب وإشعارات العميل، وتابع الشحن والكوبونات والرسائل.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => {
                    setActiveTab('products');
                    openAddProductModal();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs shadow-sm hover:bg-zinc-100 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة منتج جديد الآن</span>
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors flex items-center gap-2 border border-white/20 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>مراجعة الطلبات ({pendingOrders.length} قيد الانتظار)</span>
                </button>

                <button
                  onClick={() => setActiveTab('payments')}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors flex items-center gap-2 border border-white/20 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>إعدادات الدفع المصرية</span>
                </button>
              </div>
            </div>

            {/* Pending Payment Verification Quick Queue */}
            {pendingOrders.length > 0 && (
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    <h4 className="font-bold text-sm text-zinc-950">
                      طلبات بانتظار التحقق من وصول المبلغ ({pendingOrders.length})
                    </h4>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('orders');
                      setOrderFilter('pending');
                    }}
                    className="text-xs font-bold text-zinc-900 hover:underline cursor-pointer"
                  >
                    عرض الكل ←
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pendingOrders.slice(0, 4).map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-zinc-950">#{ord.id}</span>
                          <span className="text-zinc-500">· {ord.customer.name}</span>
                        </div>
                        <p className="text-[11px] text-zinc-600">
                          {getPaymentMethodDetails(ord.paymentMethod).name} ·{' '}
                          <strong className="text-zinc-950">
                            {formatPrice(ord.total, branding.currencySymbol)}
                          </strong>
                        </p>
                      </div>
                      <button
                        onClick={() => openOrderModal(ord)}
                        className="px-3.5 py-2 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 cursor-pointer shrink-0"
                      >
                        مراجعة وتسليم
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-950">
                  كتالوج منتجات المتجر ({products.length})
                </h3>
                <p className="text-xs text-zinc-500">
                  أضف وعدّل الطلبات الرقمية والمنتجات العادية، تحكم في حالة التوفر والمخزون والأسعار بالجنيه المصري
                </p>
              </div>

              <button
                onClick={openAddProductModal}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer ${theme.primary}`}
              >
                <Plus className="w-4 h-4" />
                <span>إضافة منتج جديد</span>
              </button>
            </div>

            {products.length > 0 && (
              <div className="p-4 rounded-2xl bg-white border border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="ابحث باسم المنتج أو التصنيف..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-zinc-300 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
                <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl w-full sm:w-auto justify-center">
                  {[
                    { id: 'all', label: 'الكل' },
                    { id: 'digital', label: 'الطلبات الرقمية' },
                    { id: 'physical', label: 'المنتجات العادية' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setProductTypeFilter(f.id as any)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer ${
                        productTypeFilter === f.id
                          ? 'bg-white text-zinc-950 shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-950'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {products.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border-2 border-dashed border-zinc-300 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center mx-auto">
                  <Package className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-zinc-950">لا توجد أي منتجات في المتجر حتى الآن</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    ابدأ بإضافة أول طلب رقمي أو منتج عادي لعرضه في واجهة المتجر والبدء في استقبال الطلبات!
                  </p>
                </div>
                <button
                  onClick={openAddProductModal}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer ${theme.primary}`}
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة منتجك الأول</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className={`p-5 rounded-2xl bg-white border flex flex-col justify-between shadow-2xs space-y-4 ${
                      prod.inStock ? 'border-zinc-200' : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-zinc-100">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-black/80 text-white text-[10px] font-bold">
                          {prod.type === 'digital' ? '⚡ طلب رقمي' : '📦 منتج عادي'}
                        </span>
                        {onToggleProductStock && (
                          <button
                            onClick={() => onToggleProductStock(prod.id)}
                            className={`absolute top-2 left-2 px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                              prod.inStock
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-rose-600 text-white hover:bg-rose-700'
                            }`}
                          >
                            {prod.inStock ? 'متوفر ✓' : 'غير متوفر ✕'}
                          </button>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                          <span>{prod.category}</span>
                          <span className="font-bold text-zinc-950 tabular-nums">
                            {formatPrice(prod.price, branding.currencySymbol)}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-zinc-950 mt-1 line-clamp-1">{prod.name}</h4>
                      </div>

                      <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{prod.description}</p>

                      {prod.features && prod.features.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-bold text-zinc-400 block">ميزات المنتج:</span>
                          <div className="flex flex-wrap gap-1">
                            {prod.features.map((feat, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md border border-zinc-200/70"
                              >
                                ✓ {feat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                      <span className="text-xs text-zinc-500">
                        المبيعات: <strong className="text-zinc-900 tabular-nums">{prod.salesCount}</strong>
                      </span>

                      <div className="flex items-center gap-1.5">
                        {onEditProduct && (
                          <button
                            onClick={() => openEditProductModal(prod)}
                            className="px-2.5 py-1.5 text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            title="تعديل المنتج"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                        )}

                        {confirmDeleteProductId === prod.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                onDeleteProduct(prod.id);
                                setConfirmDeleteProductId(null);
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                            >
                              تأكيد الحذف
                            </button>
                            <button
                              onClick={() => setConfirmDeleteProductId(null)}
                              className="px-2 py-1 rounded-lg bg-zinc-100 text-zinc-600 text-[10px] font-bold cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteProductId(prod.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="حذف المنتج"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-white border border-zinc-200 flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="relative w-full lg:w-80">
                <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="بحث برقم الطلب، العميل، الهاتف..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 text-xs rounded-xl border border-zinc-300 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto w-full lg:w-auto p-1 bg-zinc-100 rounded-xl border border-zinc-200">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'pending', label: `بانتظار مراجعة الدفع (${pendingOrders.length})` },
                  { id: 'processing', label: 'قيد التجهيز' },
                  { id: 'shipped', label: 'تم الشحن' },
                  { id: 'completed', label: 'مكتمل' },
                  { id: 'cancelled', label: 'ملغي' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setOrderFilter(f.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      orderFilter === f.id
                        ? 'bg-white text-zinc-950 shadow-2xs font-bold'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="rounded-2xl bg-white border border-zinc-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs min-w-[780px]">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold">
                    <tr>
                      <th className="p-4">رقم الطلب</th>
                      <th className="p-4">العميل</th>
                      <th className="p-4">المنتجات</th>
                      <th className="p-4">الإجمالي</th>
                      <th className="p-4">طريقة الدفع</th>
                      <th className="p-4">حالة الدفع</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-zinc-400">
                          لا توجد طلبات مطابقة حالياً
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const statusMeta = getOrderStatusLabel(order.orderStatus);
                        const payMeta = getPaymentMethodDetails(order.paymentMethod);
                        return (
                          <tr key={order.id} className="hover:bg-zinc-50/80 transition-colors">
                            <td className="p-4 font-mono font-bold text-zinc-950">{order.id}</td>
                            <td className="p-4">
                              <span className="font-semibold block text-zinc-950">{order.customer.name}</span>
                              <span className="text-[11px] text-zinc-400 font-mono">
                                {order.customer.phone} · {order.customer.email}
                              </span>
                            </td>
                            <td className="p-4 max-w-xs">
                              <span className="line-clamp-1 text-zinc-700">
                                {order.items.map((i) => `${i.productName || i.name} (×${i.quantity})`).join(', ')}
                              </span>
                            </td>
                            <td className="p-4 font-extrabold text-zinc-950 tabular-nums">
                              {formatPrice(order.total, branding.currencySymbol)}
                            </td>
                            <td className="p-4">
                              <span className={`font-semibold text-xs ${payMeta.color}`}>{payMeta.name}</span>
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  order.paymentStatus === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {order.paymentStatus === 'paid' ? 'مدفوع ✓' : 'قيد المراجعة'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${statusMeta.bg} ${statusMeta.text}`}>
                                {statusMeta.label}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => openOrderModal(order)}
                                className="px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                              >
                                إدارة وتسليم
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COUPONS MANAGEMENT */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-zinc-950">إدارة كوبونات وقسائم التخفيض</h2>
                <p className="text-xs text-zinc-500">
                  تحكم كامل في أكواد الخصم، نسب التخفيض، المبالغ الثابتة، الحد الأدنى، الحد الأقصى للاستخدام، وتواريخ الصلاحية
                </p>
              </div>

              <button
                onClick={() => setIsAddCouponOpen(true)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer ${theme.primary}`}
              >
                <Plus className="w-4 h-4" />
                <span>إضافة كود خصم جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                <span className="text-xs text-zinc-500 font-semibold">إجمالي الكوبونات</span>
                <p className="text-2xl font-black text-zinc-950 tabular-nums">{coupons.length}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                <span className="text-xs text-zinc-500 font-semibold">الكوبونات النشطة</span>
                <p className="text-2xl font-black text-emerald-600 tabular-nums">
                  {coupons.filter((c) => c.active).length}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-1">
                <span className="text-xs text-zinc-500 font-semibold">مرات الاستخدام</span>
                <p className="text-2xl font-black text-zinc-950 tabular-nums">
                  {coupons.reduce((acc, c) => acc + (c.usageCount || 0), 0)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs min-w-[700px]">
                  <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200 font-bold">
                    <tr>
                      <th className="p-4">كود الكوبون</th>
                      <th className="p-4">نوع الخصم</th>
                      <th className="p-4">القيمة</th>
                      <th className="p-4">الحد الأدنى</th>
                      <th className="p-4">تاريخ الانتهاء</th>
                      <th className="p-4">الاستخدام</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {coupons.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-zinc-400">
                          لا توجد كوبونات مضافة حالياً.
                        </td>
                      </tr>
                    ) : (
                      coupons.map((coupon) => (
                        <tr key={coupon.id} className="hover:bg-zinc-50/70 transition-colors">
                          <td className="p-4 font-mono font-bold text-zinc-950">
                            <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-950 border border-zinc-200">
                              {coupon.code}
                            </span>
                          </td>
                          <td className="p-4 font-semibold text-zinc-600">
                            {coupon.discountType === 'percentage' ? 'نسبة مئوية (%)' : 'مبلغ ثابت (ج.م)'}
                          </td>
                          <td className="p-4 font-bold text-zinc-950 tabular-nums">
                            {coupon.discountType === 'percentage'
                              ? `${coupon.discountValue}%`
                              : `${coupon.discountValue} ج.م`}
                          </td>
                          <td className="p-4 text-zinc-500 tabular-nums">
                            {coupon.minSpend && coupon.minSpend > 0 ? `${coupon.minSpend} ج.م` : 'بدون حد أدنى'}
                          </td>
                          <td className="p-4 text-zinc-500 tabular-nums">
                            {coupon.expiresAt ? coupon.expiresAt : 'صالح دائماً'}
                          </td>
                          <td className="p-4 font-mono text-zinc-600">
                            {coupon.usageCount || 0} {coupon.maxUsage ? `/ ${coupon.maxUsage}` : 'مرة'}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => onToggleCoupon(coupon.id)}
                              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                coupon.active
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-zinc-100 text-zinc-500 border border-zinc-200 hover:bg-zinc-200'
                              }`}
                            >
                              {coupon.active ? '✓ نشط' : 'معطل'}
                            </button>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => onDeleteCoupon(coupon.id)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="حذف الكوبون"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EGYPTIAN PAYMENT GATEWAYS */}
        {activeTab === 'payments' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-950">
                  التحكم الكامل في طرق الدفع المصرية
                </h3>
                <p className="text-xs text-zinc-500">
                  قم بتفعيل أو تعطيل بوابات الدفع وتحديث أرقام المحافظ وحسابات التحويل للمتجر
                </p>
              </div>
              <button
                onClick={handleSaveGateways}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${theme.primary}`}
              >
                <Check className="w-4 h-4" />
                <span>حفظ إعدادات الدفع</span>
              </button>
            </div>

            {gatewaysSavedNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>تم حفظ وتحديث إعدادات طرق الدفع بنجاح في متجرك!</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Vodafone Cash */}
              <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
                      📱
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-950">فودافون كاش والمحافظ الذكية</h4>
                      <span className="text-[10px] text-zinc-400">Vodafone, Orange, Etisalat, WE</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gateways.vodafoneCash.enabled}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          vodafoneCash: { ...gateways.vodafoneCash, enabled: e.target.checked }
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600" />
                  </label>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-zinc-600">
                      رقم محفظة التحويل
                    </label>
                    <input
                      type="text"
                      value={gateways.vodafoneCash.walletNumber}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          vodafoneCash: { ...gateways.vodafoneCash, walletNumber: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-zinc-600">
                      تعليمات التحويل للعميل
                    </label>
                    <textarea
                      rows={2}
                      value={gateways.vodafoneCash.instructions}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          vodafoneCash: { ...gateways.vodafoneCash, instructions: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* InstaPay */}
              <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                      ⚡
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-950">إنستاباي InstaPay</h4>
                      <span className="text-[10px] text-zinc-400">التحويل البنكي اللحظي المباشر</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gateways.instapay.enabled}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          instapay: { ...gateways.instapay, enabled: e.target.checked }
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600" />
                  </label>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-zinc-600">
                      معرف إنستاباي (IPA Address)
                    </label>
                    <input
                      type="text"
                      value={gateways.instapay.ipaAddress}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          instapay: { ...gateways.instapay, ipaAddress: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-zinc-600">
                      رقم الهاتف المرتبط بإنستاباي
                    </label>
                    <input
                      type="text"
                      value={gateways.instapay.phone}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          instapay: { ...gateways.instapay, phone: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Fawry */}
              <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                      🟡
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-950">فوري Fawry Pay</h4>
                      <span className="text-[10px] text-zinc-400">الدفع عبر منافذ وفروع فوري</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gateways.fawry.enabled}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          fawry: { ...gateways.fawry, enabled: e.target.checked }
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600" />
                  </label>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-zinc-600">
                      كود التاجر / الخدمة
                    </label>
                    <input
                      type="text"
                      value={gateways.fawry.merchantCode}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          fawry: { ...gateways.fawry, merchantCode: e.target.value }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Meeza Card */}
              <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                      🇪🇬
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-950">بطاقة ميزة الوطنية المصرية</h4>
                      <span className="text-[10px] text-zinc-400">كافة البنوك والبريد المصري</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gateways.meeza.enabled}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          meeza: { ...gateways.meeza, enabled: e.target.checked }
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                  </label>
                </div>
                <p className="text-xs text-zinc-500">
                  تتيح للعملاء الدفع بكروت ميزة الوطنية من كافة البنوك والبريد المصري.
                </p>
              </div>

              {/* COD */}
              <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center font-bold text-sm">
                      💵
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-950">الدفع عند الاستلام (COD)</h4>
                      <span className="text-[10px] text-zinc-400">للمنتجات العادية في مصر</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gateways.cod.enabled}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          cod: { ...gateways.cod, enabled: e.target.checked }
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900" />
                  </label>
                </div>
                <div className="text-xs">
                  <label className="block text-[11px] font-semibold mb-1 text-zinc-600">
                    رسوم التحصيل الإضافية عند الباب (ج.م)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={gateways.cod.extraFee}
                    onChange={(e) =>
                      setGateways({
                        ...gateways,
                        cod: { ...gateways.cod, extraFee: Number(e.target.value) }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Cards */}
              <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                      💳
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-950">بطاقات Visa / MasterCard</h4>
                      <span className="text-[10px] text-zinc-400">الدفع الإلكتروني المباشر</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gateways.card.enabled}
                      onChange={(e) =>
                        setGateways({
                          ...gateways,
                          card: { ...gateways.card, enabled: e.target.checked }
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
                <p className="text-xs text-zinc-500">
                  تتيح للعملاء الدفع بالبطاقات البنكية المحلية والدولية بأمان تام.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CUSTOMER MESSAGES */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-950">
                صندوق رسائل العملاء والدعم الفني ({supportTickets.length})
              </h3>
              <p className="text-xs text-zinc-500">
                استقبل رسائل واستفسارات زوار المتجر والرد عليها مباشرة لتصلهم في نافذة الدعم المباشر
              </p>
            </div>

            {supportTickets.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-zinc-200 space-y-2">
                <MessageSquare className="w-8 h-8 text-zinc-400 mx-auto" />
                <p className="text-xs text-zinc-500">لا توجد رسائل جديدة من العملاء حالياً.</p>
                <p className="text-[11px] text-zinc-400">
                  عندما يرسل أي عميل رسالة عبر زر الدعم الفني المباشر، ستظهر هنا فوراً.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {supportTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-4 rounded-2xl border transition-all text-xs space-y-3 bg-white ${
                      ticket.status === 'unread' ? 'border-zinc-950 shadow-xs' : 'border-zinc-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-zinc-950">{ticket.customerName}</span>
                        <span className="text-zinc-400">· {ticket.customerEmail}</span>
                        {ticket.customerPhone && (
                          <span className="font-mono text-zinc-500">({ticket.customerPhone})</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                            ticket.status === 'unread'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {ticket.status === 'unread' ? 'رسالة جديدة' : 'تم الرد'}
                        </span>
                        <span className="text-zinc-400 tabular-nums">{formatDate(ticket.createdAt)}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 space-y-1">
                      <h5 className="font-bold text-zinc-900">{ticket.subject}</h5>
                      <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
                    </div>

                    {ticket.replies && ticket.replies.length > 0 && (
                      <div className="space-y-1.5 pr-3 border-r-2 border-zinc-900">
                        <span className="text-[10px] font-bold text-zinc-500">سجل المحادثة:</span>
                        {ticket.replies.map((rep) => (
                          <div key={rep.id} className="text-[11px] p-2 rounded-lg bg-zinc-50 text-zinc-800 border border-zinc-200/70">
                            <span className="font-bold block text-[10px] text-zinc-950">
                              {rep.senderName} ({rep.timestamp}):
                            </span>
                            {rep.text}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${theme.primary}`}
                      >
                        <Send className="w-3.5 h-3.5 rtl:rotate-180" />
                        <span>الرد على العميل</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: CUSTOMERS DIRECTORY (Mobile Scrollable) */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white border border-zinc-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs min-w-[650px]">
                  <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold">
                    <tr>
                      <th className="p-4">اسم العميل</th>
                      <th className="p-4">البريد الإلكتروني</th>
                      <th className="p-4">رقم الهاتف</th>
                      <th className="p-4">المحافظة</th>
                      <th className="p-4">الطلبات</th>
                      <th className="p-4">إجمالي الإنفاق</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-zinc-400">
                          لا يوجد عملاء مسجلون بعد (ستظهر بيانات العملاء تلقائياً عند إجراء أول طلب حقيقي)
                        </td>
                      </tr>
                    ) : (
                      customers.map((cust) => (
                        <tr key={cust.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="p-4 font-bold text-zinc-950">{cust.name}</td>
                          <td className="p-4 font-mono text-zinc-600">{cust.email}</td>
                          <td className="p-4 font-mono text-zinc-600">{cust.phone}</td>
                          <td className="p-4 text-zinc-600">{cust.city}</td>
                          <td className="p-4 font-bold tabular-nums">{cust.ordersCount} طلبات</td>
                          <td className="p-4 font-extrabold text-zinc-950 tabular-nums">
                            {formatPrice(cust.totalSpent, branding.currencySymbol)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: STOREFRONT UI & CONTENT EDITOR */}
        {activeTab === 'storefront' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-950">
                  تخصيص وتعديل واجهة الموقع والسياسات
                </h3>
                <p className="text-xs text-zinc-500">
                  عدّل عناوين الواجهة الرئيسية والأزرار وأقسام المزايا ونصوص السياسات وتُحفظ مباشرة في المتجر
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onUpdateBranding({
                    ...branding,
                    heroBadgeText: INITIAL_BRANDING.heroBadgeText,
                    heroHeadline: INITIAL_BRANDING.heroHeadline,
                    heroDescription: INITIAL_BRANDING.heroDescription,
                    heroPrimaryCta: INITIAL_BRANDING.heroPrimaryCta,
                    heroDigitalCta: INITIAL_BRANDING.heroDigitalCta,
                    heroPhysicalCta: INITIAL_BRANDING.heroPhysicalCta,
                    showHeroStats: true,
                    catalogTitle: INITIAL_BRANDING.catalogTitle,
                    showValueSection: true,
                    valueCard1Title: INITIAL_BRANDING.valueCard1Title,
                    valueCard1Desc: INITIAL_BRANDING.valueCard1Desc,
                    valueCard2Title: INITIAL_BRANDING.valueCard2Title,
                    valueCard2Desc: INITIAL_BRANDING.valueCard2Desc,
                    valueCard3Title: INITIAL_BRANDING.valueCard3Title,
                    valueCard3Desc: INITIAL_BRANDING.valueCard3Desc
                  });
                  setSettingsSavedNotice(true);
                  setTimeout(() => setSettingsSavedNotice(false), 3000);
                }}
                className="px-4 py-2 rounded-xl bg-white border border-zinc-300 hover:bg-zinc-100 text-xs font-bold text-zinc-800 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة نصوص الواجهة الافتراضية</span>
              </button>
            </div>

            {settingsSavedNotice && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>تم تحديث نصوص واجهة الموقع وتطبيقها فوراً!</span>
              </div>
            )}

            {/* Card 1: Hero Section Customization */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <LayoutTemplate className="w-5 h-5 text-zinc-950" />
                  <div>
                    <h4 className="font-bold text-sm text-zinc-950">القسم الرئيسي للواجهة (Hero Section)</h4>
                    <p className="text-[11px] text-zinc-500">أول قسم يراه الزائر عند فتح المتجر</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={branding.showHeroStats !== false}
                    onChange={(e) => onUpdateBranding({ ...branding, showHeroStats: e.target.checked })}
                    className="w-4 h-4 accent-zinc-950 cursor-pointer"
                  />
                  <span>عرض شريط الإحصائيات أسفل المقدمة</span>
                </label>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">نص الشارة العلوية للمتجر</label>
                  <input
                    type="text"
                    value={branding.heroBadgeText || ''}
                    onChange={(e) => onUpdateBranding({ ...branding, heroBadgeText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">العنوان الرئيسي الكبير بالواجهة</label>
                  <input
                    type="text"
                    value={branding.heroHeadline || ''}
                    onChange={(e) => onUpdateBranding({ ...branding, heroHeadline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs font-bold text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">الوصف التوضيحي تحت العنوان</label>
                  <textarea
                    rows={2}
                    value={branding.heroDescription || ''}
                    onChange={(e) => onUpdateBranding({ ...branding, heroDescription: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold mb-1 text-zinc-700">نص الزر الأساسي</label>
                    <input
                      type="text"
                      value={branding.heroPrimaryCta || ''}
                      onChange={(e) => onUpdateBranding({ ...branding, heroPrimaryCta: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 text-xs font-bold text-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-zinc-700">زر الطلبات الرقمية</label>
                    <input
                      type="text"
                      value={branding.heroDigitalCta || ''}
                      onChange={(e) => onUpdateBranding({ ...branding, heroDigitalCta: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 text-xs font-bold text-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-zinc-700">زر المنتجات العادية</label>
                    <input
                      type="text"
                      value={branding.heroPhysicalCta || ''}
                      onChange={(e) => onUpdateBranding({ ...branding, heroPhysicalCta: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 text-xs font-bold text-zinc-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Catalog Header, Ticker, Announcement & Value Cards */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-zinc-950" />
                  <div>
                    <h4 className="font-bold text-sm text-zinc-950">الكتالوج والأشرطة التفاعلية وبطاقات المزايا</h4>
                    <p className="text-[11px] text-zinc-500">تحكم في عنوان المعروضات، الأشرطة المتحركة، والبطاقات الثلاث أسفل المتجر</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">عنوان قسم الكتالوج بالرئيسية</label>
                  <input
                    type="text"
                    value={branding.catalogTitle || ''}
                    onChange={(e) => onUpdateBranding({ ...branding, catalogTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs font-bold text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">نص الشريط الإعلاني العلوي</label>
                  <input
                    type="text"
                    value={branding.announcementText}
                    onChange={(e) => onUpdateBranding({ ...branding, announcementText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <label className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-2 cursor-pointer">
                  <span className="font-bold text-zinc-900">عرض الشريط الإعلاني العلوي</span>
                  <input
                    type="checkbox"
                    checked={branding.showAnnouncement}
                    onChange={(e) => onUpdateBranding({ ...branding, showAnnouncement: e.target.checked })}
                    className="w-4 h-4 accent-zinc-950 cursor-pointer"
                  />
                </label>

                <label className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-2 cursor-pointer">
                  <span className="font-bold text-zinc-900">شريط الأكثر طلباً وتقييماً</span>
                  <input
                    type="checkbox"
                    checked={branding.showTrendingTicker !== false}
                    onChange={(e) => onUpdateBranding({ ...branding, showTrendingTicker: e.target.checked })}
                    className="w-4 h-4 accent-zinc-950 cursor-pointer"
                  />
                </label>

                <label className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-2 cursor-pointer">
                  <span className="font-bold text-zinc-900">عرض قسم بطاقات المزايا</span>
                  <input
                    type="checkbox"
                    checked={branding.showValueSection !== false}
                    onChange={(e) => onUpdateBranding({ ...branding, showValueSection: e.target.checked })}
                    className="w-4 h-4 accent-zinc-950 cursor-pointer"
                  />
                </label>
              </div>

              {branding.showValueSection !== false && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-zinc-100 text-xs">
                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                    <span className="text-[11px] font-bold text-zinc-500 block">البطاقة الأولى (الدفع)</span>
                    <input
                      type="text"
                      value={branding.valueCard1Title || ''}
                      onChange={(e) => onUpdateBranding({ ...branding, valueCard1Title: e.target.value })}
                      placeholder="عنوان البطاقة"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-xs font-bold"
                    />
                    <textarea
                      rows={3}
                      value={branding.valueCard1Desc || ''}
                      onChange={(e) => onUpdateBranding({ ...branding, valueCard1Desc: e.target.value })}
                      placeholder="وصف البطاقة"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-[11px]"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                    <span className="text-[11px] font-bold text-zinc-500 block">البطاقة الثانية (آلية التسليم)</span>
                    <input
                      type="text"
                      value={branding.valueCard2Title || ''}
                      onChange={(e) => onUpdateBranding({ ...branding, valueCard2Title: e.target.value })}
                      placeholder="عنوان البطاقة"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-xs font-bold"
                    />
                    <textarea
                      rows={3}
                      value={branding.valueCard2Desc || ''}
                      onChange={(e) => onUpdateBranding({ ...branding, valueCard2Desc: e.target.value })}
                      placeholder="وصف البطاقة"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-[11px]"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                    <span className="text-[11px] font-bold text-zinc-500 block">البطاقة الثالثة (الفواتير)</span>
                    <input
                      type="text"
                      value={branding.valueCard3Title || ''}
                      onChange={(e) => onUpdateBranding({ ...branding, valueCard3Title: e.target.value })}
                      placeholder="عنوان البطاقة"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-xs font-bold"
                    />
                    <textarea
                      rows={3}
                      value={branding.valueCard3Desc || ''}
                      onChange={(e) => onUpdateBranding({ ...branding, valueCard3Desc: e.target.value })}
                      placeholder="وصف البطاقة"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 bg-white text-[11px]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Card 3: Legal Policies Editor */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                <FileCheck2 className="w-5 h-5 text-zinc-950" />
                <div>
                  <h4 className="font-bold text-sm text-zinc-950">تعديل نصوص السياسات والشروط القانونية</h4>
                  <p className="text-[11px] text-zinc-500">
                    اترك أي حقل فارغاً لاستخدام النص الافتراضي المعتمد لـ Origin Shop، أو اكتب نصك الخاص ليظهر في نافذة السياسات أسفل المتجر
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-zinc-700">سياسة الخصوصية</label>
                    {branding.privacyPolicyText && (
                      <button
                        type="button"
                        onClick={() => onUpdateBranding({ ...branding, privacyPolicyText: '' })}
                        className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer"
                      >
                        استخدام النص الافتراضي
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="اتركه فارغاً لاستخدام سياسة الخصوصية المعتمدة لـ Origin Shop..."
                    value={branding.privacyPolicyText || ''}
                    onChange={(e) => onUpdateBranding({ ...branding, privacyPolicyText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900 leading-relaxed"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-zinc-700">شروط الاستخدام والتراخيص</label>
                    {branding.termsPolicyText && (
                      <button
                        type="button"
                        onClick={() => onUpdateBranding({ ...branding, termsPolicyText: '' })}
                        className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer"
                      >
                        استخدام النص الافتراضي
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="اتركه فارغاً لاستخدام شروط الاستخدام والتراخيص المعتمدة لـ Origin Shop..."
                    value={branding.termsPolicyText || ''}
                    onChange={(e) => onUpdateBranding({ ...branding, termsPolicyText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900 leading-relaxed"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-zinc-700">ضمان الجودة والاسترجاع</label>
                    {branding.refundPolicyText && (
                      <button
                        type="button"
                        onClick={() => onUpdateBranding({ ...branding, refundPolicyText: '' })}
                        className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer"
                      >
                        استخدام النص الافتراضي
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    placeholder="اتركه فارغاً لاستخدام سياسة ضمان الجودة والاسترجاع المعتمدة لـ Origin Shop..."
                    value={branding.refundPolicyText || ''}
                    onChange={(e) => onUpdateBranding({ ...branding, refundPolicyText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: COMPREHENSIVE STORE SETTINGS & SECURITY */}
        {activeTab === 'branding' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {settingsSavedNotice && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>تم تحديث إعدادات المتجر وحفظها بنجاح!</span>
              </div>
            )}

            {/* Section 1: Store Identity, Logo & Contact Details */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-zinc-950" />
                  <div>
                    <h3 className="font-bold text-base text-zinc-950">الهوية والشعار ومعلومات التواصل</h3>
                    <p className="text-xs text-zinc-500">تظهر هذه البيانات في الواجهة الرئيسية والتذييل والفواتير الإلكترونية</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">اسم المتجر الرسمي</label>
                  <input
                    type="text"
                    value={branding.storeName}
                    onChange={(e) => onUpdateBranding({ ...branding, storeName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs font-bold text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">الوصف المختصر (Tagline)</label>
                  <input
                    type="text"
                    value={branding.storeTagline}
                    onChange={(e) => onUpdateBranding({ ...branding, storeTagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900"
                  />
                </div>

                {/* Custom Logo Upload or URL */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2.5">
                  <label className="block font-bold text-zinc-900">شعار المتجر (Logo)</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="h-12 px-3 py-1.5 rounded-xl bg-black border border-zinc-800 flex items-center justify-center shrink-0">
                      <img
                        src={branding.logoUrl || './origin-logo.png'}
                        alt="Current Logo"
                        className="h-full w-auto max-w-[110px] object-contain"
                      />
                    </div>
                    <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-zinc-950 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-zinc-800">
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع شعار جديد</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                    <button
                      type="button"
                      onClick={() => onUpdateBranding({ ...branding, logoUrl: './origin-logo.png' })}
                      className="px-3.5 py-2 rounded-xl bg-white border border-zinc-300 text-zinc-700 hover:text-zinc-950 font-semibold text-xs cursor-pointer"
                    >
                      استعادة الشعار الأصلي
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-semibold mb-1 text-zinc-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-zinc-500" />
                    <span>رقم الهاتف الرسمي</span>
                  </label>
                  <input
                    type="text"
                    value={branding.contactPhone || ''}
                    onChange={(e) => onUpdateBranding({ ...branding, contactPhone: e.target.value })}
                    placeholder="01023456789"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs font-mono text-zinc-900"
                  />
                </div>
                <div>
                  <label className="font-semibold mb-1 text-zinc-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-zinc-500" />
                    <span>البريد الإلكتروني للدعم</span>
                  </label>
                  <input
                    type="email"
                    value={branding.contactEmail || ''}
                    onChange={(e) => onUpdateBranding({ ...branding, contactEmail: e.target.value })}
                    placeholder="support@originshop.eg"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs font-mono text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">مواعيد العمل والدعم</label>
                  <input
                    type="text"
                    value={branding.workingHours || ''}
                    onChange={(e) => onUpdateBranding({ ...branding, workingHours: e.target.value })}
                    placeholder="يومياً من 10 صباحاً حتى 12 منتصف الليل"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">ملاحظة تذييل الفاتورة</label>
                  <input
                    type="text"
                    value={branding.invoiceFooterNote || ''}
                    onChange={(e) => onUpdateBranding({ ...branding, invoiceFooterNote: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Shipping, Checkout & Store Feature Controls */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-5">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                <Truck className="w-5 h-5 text-zinc-950" />
                <div>
                  <h3 className="font-bold text-base text-zinc-950">إعدادات الشحن والطلبات والتحكم بالواجهة</h3>
                  <p className="text-xs text-zinc-500">تخصيص تكلفة الشحن، قواعد الطلب، وميزات العرض بالمتجر</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">رسوم الشحن الافتراضية ({branding.currencySymbol})</label>
                  <input
                    type="number"
                    min={0}
                    value={branding.defaultShippingFee ?? 35}
                    onChange={(e) =>
                      onUpdateBranding({ ...branding, defaultShippingFee: Math.max(0, Number(e.target.value)) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs font-mono text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">الحد الأدنى للشحن المجاني ({branding.currencySymbol})</label>
                  <input
                    type="number"
                    min={0}
                    value={branding.freeShippingThreshold}
                    onChange={(e) =>
                      onUpdateBranding({ ...branding, freeShippingThreshold: Math.max(0, Number(e.target.value)) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs font-mono text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">مدة التوصيل المتوقعة</label>
                  <input
                    type="text"
                    value={branding.estimatedShippingTime || ''}
                    onChange={(e) => onUpdateBranding({ ...branding, estimatedShippingTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900"
                  />
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <label className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-2 cursor-pointer">
                  <div>
                    <span className="font-bold text-zinc-900 block">الشريط المتحرك للمنتجات الأكثر طلباً</span>
                    <span className="text-[11px] text-zinc-500">إظهار شريط المنتجات الأعلى تقييماً في الرئيسية</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={branding.showTrendingTicker !== false}
                    onChange={(e) => onUpdateBranding({ ...branding, showTrendingTicker: e.target.checked })}
                    className="w-4 h-4 accent-zinc-950 cursor-pointer shrink-0"
                  />
                </label>

                <label className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-2 cursor-pointer">
                  <div>
                    <span className="font-bold text-zinc-900 block">إتاحة تقييمات العملاء</span>
                    <span className="text-[11px] text-zinc-500">السماح للزوار بإضافة تقييمات وآراء داخل صفحة المنتج</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={branding.allowReviews !== false}
                    onChange={(e) => onUpdateBranding({ ...branding, allowReviews: e.target.checked })}
                    className="w-4 h-4 accent-zinc-950 cursor-pointer shrink-0"
                  />
                </label>

                <label className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-2 cursor-pointer">
                  <div>
                    <span className="font-bold text-zinc-900 block">إلزام تسجيل الدخول عند الطلب</span>
                    <span className="text-[11px] text-zinc-500">مطالبة العميل بتسجيل الدخول بحساب Google قبل إتمام الشراء</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!branding.requireAuthForCheckout}
                    onChange={(e) => onUpdateBranding({ ...branding, requireAuthForCheckout: e.target.checked })}
                    className="w-4 h-4 accent-zinc-950 cursor-pointer shrink-0"
                  />
                </label>

                <label className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between gap-2 cursor-pointer">
                  <div>
                    <span className="font-bold text-amber-950 block">وضع الصيانة المؤقت</span>
                    <span className="text-[11px] text-amber-700">عرض تنبيه الصيانة وإيقاف الطلبات الجديدة مؤقتاً</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!branding.maintenanceMode}
                    onChange={(e) => onUpdateBranding({ ...branding, maintenanceMode: e.target.checked })}
                    className="w-4 h-4 accent-amber-600 cursor-pointer shrink-0"
                  />
                </label>
              </div>

              {branding.maintenanceMode && (
                <div className="text-xs">
                  <label className="block font-semibold mb-1 text-amber-900">رسالة الصيانة الظاهرة للزوار</label>
                  <input
                    type="text"
                    value={branding.maintenanceMessage || ''}
                    onChange={(e) => onUpdateBranding({ ...branding, maintenanceMessage: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-xs text-zinc-900"
                  />
                </div>
              )}
            </div>

            {/* Section 3: Announcement Bar & Color Palette */}
            <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-base text-zinc-950">الشريط الإعلاني وتخصيص الألوان</h3>
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between pt-1">
                  <label className="font-semibold text-zinc-700">عرض الشريط الإعلاني العلوي</label>
                  <input
                    type="checkbox"
                    checked={branding.showAnnouncement}
                    onChange={(e) => onUpdateBranding({ ...branding, showAnnouncement: e.target.checked })}
                    className="w-4 h-4 accent-zinc-950 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">نص الشريط الإعلاني العلوي</label>
                  <input
                    type="text"
                    value={branding.announcementText}
                    onChange={(e) => onUpdateBranding({ ...branding, announcementText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2 text-zinc-700">لون الأزرار والهوية الأساسية</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.entries(THEME_PALETTES).map(([key, pal]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onUpdateBranding({ ...branding, primaryTheme: key as any })}
                        className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                          branding.primaryTheme === key
                            ? 'border-zinc-950 bg-zinc-50 ring-2 ring-zinc-950'
                            : 'border-zinc-200 hover:border-zinc-400'
                        }`}
                      >
                        <span className="text-xs font-bold text-zinc-950">{pal.name}</span>
                        <div className={`w-4 h-4 rounded-full ${pal.primary}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Security Password & Backup / Reset */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password Card */}
              <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-zinc-950" />
                  <div>
                    <h3 className="font-bold text-sm text-zinc-950">كلمة مرور لوحة التحكم</h3>
                    <p className="text-[11px] text-zinc-500">حماية لوحة الإدارة بكلمة مرور سرية</p>
                  </div>
                </div>

                {branding.adminPassword === 'admin' && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2 font-semibold leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      تنبيه أمني قبل النشر: ما زلت تستخدم كلمة المرور المبدئية. يُنصح بشدة بتعيين كلمة مرور خاصة وقوية لحماية لوحة الإدارة قبل نشر الموقع للعامة.
                    </span>
                  </div>
                )}

                {passwordSavedNotice && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم تحديث كلمة المرور بنجاح!</span>
                  </div>
                )}

                <form onSubmit={handleSavePassword} className="space-y-2.5">
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-zinc-400 absolute right-3 top-3" />
                    <input
                      type="text"
                      placeholder="أدخل كلمة مرور جديدة..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <button
                    type="submit"
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${theme.primary}`}
                  >
                    حفظ كلمة المرور الجديدة
                  </button>
                </form>
                <p className="text-[11px] text-zinc-400">
                  الحالية: <span className="font-mono font-bold text-zinc-900">{branding.adminPassword}</span>
                </p>
              </div>

              {/* Backup & Factory Reset Card */}
              <div className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-zinc-950" />
                  <div>
                    <h3 className="font-bold text-sm text-zinc-950">النسخ الاحتياطي وإدارة البيانات</h3>
                    <p className="text-[11px] text-zinc-500">تصدير بيانات المتجر أو استعادة الإعدادات الافتراضية</p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  {onExportBackup && (
                    <button
                      type="button"
                      onClick={onExportBackup}
                      className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>تصدير نسخة احتياطية كاملة (JSON)</span>
                    </button>
                  )}

                  {onResetDefaults && (
                    confirmResetStore ? (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                        <p className="text-[11px] font-bold text-rose-800 text-center">
                          هل أنت متأكد من استعادة إعدادات التصميم الافتراضية؟ (لن تُحذف المنتجات أو الطلبات)
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onResetDefaults();
                              setConfirmResetStore(false);
                              setSettingsSavedNotice(true);
                              setTimeout(() => setSettingsSavedNotice(false), 3000);
                            }}
                            className="flex-1 py-2 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
                          >
                            نعم، استعادة
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmResetStore(false)}
                            className="flex-1 py-2 rounded-lg bg-white border border-zinc-300 text-zinc-700 font-bold cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmResetStore(true)}
                        className="w-full py-2.5 px-4 rounded-xl bg-zinc-50 hover:bg-rose-50 text-zinc-700 hover:text-rose-700 border border-zinc-200 hover:border-rose-200 font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>استعادة الإعدادات الافتراضية</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* REPLY TICKET MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <h3 className="font-bold text-sm text-zinc-950">الرد على العميل: {selectedTicket.customerName}</h3>
              <button onClick={() => setSelectedTicketId(null)} className="text-zinc-400 hover:text-zinc-700 cursor-pointer">
                ✕
              </button>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
              <span className="font-bold text-zinc-800 block">{selectedTicket.subject}</span>
              <p className="text-zinc-600">{selectedTicket.message}</p>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-700">نص الرد الرسمي:</label>
              <textarea
                rows={4}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="اكتب ردك للعميل هنا وسوف يصل إليه فوراً في الدردشة المباشرة..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTicketId(null)}
                className="px-4 py-2 rounded-xl bg-zinc-100 text-xs font-semibold text-zinc-700 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSendTicketReply}
                className={`px-5 py-2 rounded-xl text-xs font-bold cursor-pointer ${theme.primary}`}
              >
                إرسال الرد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAILS & DIGITAL FULFILLMENT MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 space-y-5 text-right max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-zinc-950 font-mono">
                  إدارة الطلب #{selectedOrder.id}
                </h3>
                <p className="text-xs text-zinc-400">{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button onClick={() => setSelectedOrderId(null)} className="p-1 text-zinc-400 hover:text-zinc-800 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Customer & Payment Details */}
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                <span className="font-bold text-zinc-950 block">{selectedOrder.customer.name}</span>
                <span className="text-zinc-500 block font-mono">
                  {selectedOrder.customer.email} · {selectedOrder.customer.phone}
                </span>
                {selectedOrder.customer.address && (
                  <span className="text-zinc-700 block">
                    العنوان: {selectedOrder.customer.city}، {selectedOrder.customer.address}
                  </span>
                )}
                <div className="pt-1.5 border-t border-zinc-200/70 flex items-center justify-between">
                  <span>
                    طريقة الدفع: <strong>{getPaymentMethodDetails(selectedOrder.paymentMethod).name}</strong>
                  </span>
                  <span className="font-extrabold text-zinc-950 tabular-nums text-sm">
                    {formatPrice(selectedOrder.total, branding.currencySymbol)}
                  </span>
                </div>
              </div>

              {/* Payment Verification Box */}
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 space-y-2">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <span className="font-bold text-zinc-800">حالة الدفع والتحويل:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedOrder.paymentStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {selectedOrder.paymentStatus === 'paid' ? '✓ تم استلام وتأكيد المبلغ' : '⏳ بانتظار تأكيد وصول الأموال'}
                  </span>
                </div>

                {selectedOrder.paymentDetails?.walletNumberUsed && (
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-zinc-500">رقم المحفظة المحول منها:</span>
                    <strong className="text-zinc-950">{selectedOrder.paymentDetails.walletNumberUsed}</strong>
                  </div>
                )}
                {selectedOrder.paymentDetails?.instapayRef && (
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-zinc-500">مرجع InstaPay:</span>
                    <strong className="text-zinc-950">{selectedOrder.paymentDetails.instapayRef}</strong>
                  </div>
                )}
                {selectedOrder.paymentDetails?.fawryRefNumber && (
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-zinc-500">كود فوري المرجعي:</span>
                    <strong className="text-zinc-950">{selectedOrder.paymentDetails.fawryRefNumber}</strong>
                  </div>
                )}

                {selectedOrder.paymentStatus !== 'paid' && onConfirmOrderPayment && (
                  <button
                    type="button"
                    onClick={() => onConfirmOrderPayment(selectedOrder.id)}
                    className="w-full mt-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد استلام المبلغ يدوياً الآن ✓</span>
                  </button>
                )}
              </div>

              {/* DIGITAL ORDER FULFILLMENT SECTION */}
              {selectedOrder.items.some((i) => i.type === 'digital') && (
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-950 flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-4 h-4 text-zinc-900" />
                      <span>تسليم الطلب الرقمي وإرسال إشعار للعميل:</span>
                    </span>
                  </div>

                  {/* Digital Item Picker if more than 1 digital item */}
                  {selectedOrder.items.filter((i) => i.type === 'digital').length > 1 && (
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-zinc-700">
                        اختر الطلب المراد تسليمه:
                      </label>
                      <select
                        value={selectedDigitalItemIdx}
                        onChange={(e) => setSelectedDigitalItemIdx(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-bold text-zinc-900"
                      >
                        {selectedOrder.items
                          .filter((i) => i.type === 'digital')
                          .map((item, idx) => (
                            <option key={idx} value={idx}>
                              {item.productName || item.name} (×{item.quantity})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Format Selector */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'text', label: 'بيانات / كود الطلب' },
                      { id: 'image', label: 'صورة مرفقة' },
                      { id: 'file', label: 'مرفق للتحميل' }
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => {
                          setDeliveryFormat(fmt.id as DigitalDeliveryType);
                          setDeliveryNotice(null);
                        }}
                        className={`p-2 rounded-xl text-center text-[11px] font-bold border transition-all cursor-pointer ${
                          deliveryFormat === fmt.id
                            ? 'bg-zinc-950 text-white border-zinc-950'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>

                  {deliveryFormat === 'text' && (
                    <textarea
                      rows={3}
                      placeholder="اكتب هنا كود التفعيل أو بيانات الحساب أو الرسالة للعميل..."
                      value={deliveryText}
                      onChange={(e) => {
                        setDeliveryText(e.target.value);
                        setDeliveryNotice(null);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-mono text-zinc-900"
                    />
                  )}

                  {deliveryFormat === 'image' && (
                    <div className="p-3 rounded-xl border-2 border-dashed border-zinc-300 bg-white text-center space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleDeliveryImageUpload}
                        className="text-xs text-zinc-600 max-w-full"
                      />
                      {deliveryImage && (
                        <p className="text-[10px] text-emerald-600 font-bold">
                          ✓ تم تجهيز الصورة للإرسال
                        </p>
                      )}
                    </div>
                  )}

                  {deliveryFormat === 'file' && (
                    <div className="p-3 rounded-xl border-2 border-dashed border-zinc-300 bg-white text-center space-y-2">
                      <input
                        type="file"
                        onChange={handleDeliveryFileUpload}
                        className="text-xs text-zinc-600 max-w-full"
                      />
                      {deliveryFileName && (
                        <p className="text-[10px] text-emerald-600 font-bold">
                          ✓ تم إرفاق الملف: {deliveryFileName}
                        </p>
                      )}
                    </div>
                  )}

                  {deliveryNotice && (
                    <div
                      className={`p-2.5 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 ${
                        deliveryNotice.isError
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {deliveryNotice.isError && <AlertCircle className="w-4 h-4 shrink-0" />}
                      <span>{deliveryNotice.text}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleFulfillDigitalDelivery}
                    className="w-full py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>تأكيد استلام المبلغ وإرسال الطلب كإشعار للعميل</span>
                  </button>

                  {/* Show already delivered payloads inside modal */}
                  {selectedOrder.digitalDeliveries && selectedOrder.digitalDeliveries.length > 0 && (
                    <div className="pt-2 border-t border-zinc-200 space-y-1.5">
                      <span className="text-[10px] font-bold text-emerald-700 block">
                        الطلبات الرقمية المرسلة لهذا الطلب ({selectedOrder.digitalDeliveries.length}):
                      </span>
                      {selectedOrder.digitalDeliveries.map((del, dIdx) => (
                        <div
                          key={dIdx}
                          className="p-2.5 rounded-xl bg-white border border-zinc-200 text-[11px] flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-zinc-900 block truncate">{del.productName}</span>
                            <span className="text-zinc-500 text-[10px]">
                              {del.deliveryType === 'text'
                                ? `محتوى الطلب: ${(del.textContent || '').slice(0, 40)}...`
                                : del.deliveryType === 'image'
                                ? 'صورة مرفقة مع الطلب'
                                : `مرفق الطلب: ${del.fileName}`}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] shrink-0">
                            أُرسل ✓
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Status Update Controls */}
              <div className="space-y-2 pt-2 border-t border-zinc-200">
                <label className="block font-bold text-zinc-900">تحديث حالة الطلب:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'] as OrderStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => onUpdateOrderStatus(selectedOrder.id, st, newTracking, newCarrier)}
                        className={`p-2 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                          selectedOrder.orderStatus === st
                            ? 'bg-zinc-950 text-white border-zinc-950'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        {getOrderStatusLabel(st).label}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Shipping info (shown when physical item exists or anytime for flexibility) */}
              {selectedOrder.items.some((i) => i.type === 'physical') && (
                <div className="space-y-2 pt-2 border-t border-zinc-200">
                  <label className="block font-bold text-zinc-900">بيانات شركة الشحن والتتبع:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="شركة الشحن (مثل: Bosta)"
                      value={newCarrier}
                      onChange={(e) => setNewCarrier(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="رقم التتبع"
                      value={newTracking}
                      onChange={(e) => setNewTracking(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 text-xs font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateOrderStatus(selectedOrder.id, 'shipped', newTracking, newCarrier)}
                    className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    حفظ وتحديث بيانات الشحن
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenInvoice) onOpenInvoice(selectedOrder);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-xs font-bold flex items-center gap-1.5 transition-colors text-zinc-800 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-zinc-900" />
                  <span>طباعة / تنزيل الفاتورة كصورة</span>
                </button>

                {onDeleteOrder && (
                  confirmDeleteOrderId === selectedOrder.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteOrder(selectedOrder.id);
                          setSelectedOrderId(null);
                          setConfirmDeleteOrderId(null);
                        }}
                        className="px-3 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
                      >
                        تأكيد الحذف
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteOrderId(null)}
                        className="px-2.5 py-2 rounded-xl bg-zinc-100 text-zinc-600 text-xs font-bold cursor-pointer"
                      >
                        تراجع
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteOrderId(selectedOrder.id)}
                      className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                className="px-5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProduct}
            className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-200 space-y-5 text-right max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <h3 className="font-black text-base sm:text-lg text-zinc-950">
                  {editingProductId ? 'تعديل بيانات المنتج' : `إضافة منتج جديد لكتالوج ${branding.storeName}`}
                </h3>
                <p className="text-xs text-zinc-500">
                  حدد نوع المنتج والميزات والسعر بالجنيه المصري
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Type Selector */}
              <div>
                <label className="block font-bold mb-1.5 text-zinc-800">نوع المنتج *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewProdType('digital')}
                    className={`p-3 rounded-xl border text-right transition-all flex items-center gap-2 cursor-pointer ${
                      newProdType === 'digital'
                        ? 'border-zinc-950 bg-zinc-50 ring-2 ring-zinc-950'
                        : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    <DownloadCloud className="w-5 h-5 text-zinc-900" />
                    <div>
                      <span className="font-bold block text-zinc-950">طلب رقمي</span>
                      <span className="text-[10px] text-zinc-500">خدمة أو اشتراك أو محتوى يُسلّم إلكترونياً داخل حساب العميل</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewProdType('physical')}
                    className={`p-3 rounded-xl border text-right transition-all flex items-center gap-2 cursor-pointer ${
                      newProdType === 'physical'
                        ? 'border-zinc-950 bg-zinc-50 ring-2 ring-zinc-950'
                        : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    <Package className="w-5 h-5 text-zinc-900" />
                    <div>
                      <span className="font-bold block text-zinc-950">منتج عادي</span>
                      <span className="text-[10px] text-zinc-500">منتج مادي ملموس يُشحن لعنوان العميل داخل مصر</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">اسم المنتج *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: اشتراك سنوي معتمد أو ساعة ذكية"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">التصنيف *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: اشتراكات، قوالب، إلكترونيات"
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">السعر بالجنيه المصري (ج.م) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 text-xs font-mono text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">السعر قبل الخصم (اختياري)</label>
                  <input
                    type="number"
                    placeholder="مثال: 250"
                    value={newProdComparePrice || ''}
                    onChange={(e) =>
                      setNewProdComparePrice(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 text-xs font-mono text-zinc-900"
                  />
                </div>
              </div>

              {/* Image Upload or URL */}
              <div className="space-y-1">
                <label className="block font-semibold text-zinc-700">صورة المنتج</label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <label className="cursor-pointer flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-dashed border-zinc-400 bg-zinc-50 text-zinc-800 hover:bg-zinc-100 transition-colors shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>رفع صورة من جهازك</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProductImageUpload}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="أو ضع رابط الصورة المباشر هنا..."
                    value={newProdImage}
                    onChange={(e) => setNewProdImage(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 text-xs font-mono text-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-zinc-700">وصف المنتج وتفاصيله *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="اكتب وصفاً واضحاً ومفصلاً لمميزات المنتج..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 text-xs text-zinc-900"
                />
              </div>

              {/* Features Builder */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                <label className="block font-bold text-zinc-900">ميزات المنتج</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="أضف ميزة للمنتج..."
                    value={currentFeatureInput}
                    onChange={(e) => setCurrentFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl border border-zinc-300 bg-white text-xs text-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3.5 py-2 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 cursor-pointer"
                  >
                    + إضافة
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {featuresList.map((feat, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-[11px] text-zinc-700"
                    >
                      <span>✓ {feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-zinc-400 hover:text-rose-500 font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {newProdType === 'digital' && (
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                      <DownloadCloud className="w-4 h-4" />
                      <span>إعدادات الطلب الرقمي</span>
                    </span>
                    <span className="text-[10px] text-zinc-500">إرفاق مرفق افتراضي اختياري</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    ملاحظة: عند شراء العميل لطلب رقمي، يدخل الطلب في مرحلة مراجعة التحويل، ويمكنك تأكيده وتسليمه مباشرة من قسم الطلبات ليصله في الإشعارات وقسم «طلباتي».
                  </p>
                  <div className="p-3 rounded-xl border-2 border-dashed border-zinc-300 bg-white text-center space-y-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs">
                      <Upload className="w-4 h-4" />
                      <span>إرفاق مرفق اختياري من جهازك</span>
                      <input type="file" onChange={handleDigitalFileUpload} className="hidden" />
                    </label>
                    {uploadedFileName && (
                      <p className="text-[11px] text-emerald-700 font-bold">
                        ✓ تم إرفاق: {uploadedFileName} ({uploadedFileSize})
                      </p>
                    )}
                  </div>
                </div>
              )}

              {newProdType === 'physical' && (
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3">
                  <span className="font-bold text-zinc-900 block">مواصفات الشحن والمخزون للمنتج العادي:</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 mb-1">المخزون المتاح</label>
                      <input
                        type="number"
                        min={0}
                        value={physicalStock}
                        onChange={(e) => setPhysicalStock(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 mb-1">رمز SKU</label>
                      <input
                        type="text"
                        value={physicalSku}
                        onChange={(e) => setPhysicalSku(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 mb-1">مدة الشحن المتوقعة</label>
                      <input
                        type="text"
                        value={physicalShippingDays}
                        onChange={(e) => setPhysicalShippingDays(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-600 mb-1">الوزن</label>
                      <input
                        type="text"
                        value={physicalWeight}
                        onChange={(e) => setPhysicalWeight(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer ${theme.primary}`}
              >
                {editingProductId ? 'حفظ التعديلات' : 'إضافة المنتج للمتجر'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD COUPON MODAL */}
      {isAddCouponOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCoupon}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 border border-zinc-200 shadow-2xl text-right"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-950">إضافة كود خصم جديد</h3>
                  <p className="text-[11px] text-zinc-400">تحكم كامل في قيمة وشروط صلاحية الكوبون</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCouponOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-zinc-700">كود الكوبون *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ORIGIN20"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 bg-zinc-50 font-mono font-bold text-sm text-zinc-950 uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1.5 text-zinc-700">نوع الخصم *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCouponType('percentage')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                      newCouponType === 'percentage'
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-200 text-zinc-600'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>نسبة مئوية (%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCouponType('fixed')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                      newCouponType === 'fixed'
                        ? 'border-zinc-950 bg-zinc-950 text-white'
                        : 'border-zinc-200 text-zinc-600'
                    }`}
                  >
                    <span>مبلغ ثابت (ج.م)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">
                    قيمة الخصم {newCouponType === 'percentage' ? '(%)' : '(ج.م)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={newCouponType === 'percentage' ? 100 : 50000}
                    value={newCouponValue}
                    onChange={(e) => setNewCouponValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 font-mono text-xs text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">الحد الأدنى للطلب (ج.م)</label>
                  <input
                    type="number"
                    min={0}
                    value={newCouponMinSpend}
                    onChange={(e) => setNewCouponMinSpend(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 font-mono text-xs text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">الحد الأقصى للخصم (اختياري)</label>
                  <input
                    type="number"
                    min={0}
                    value={newCouponMaxDiscount}
                    onChange={(e) => setNewCouponMaxDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 font-mono text-xs text-zinc-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-zinc-700">حد مرات الاستخدام (0 = مفتوح)</label>
                  <input
                    type="number"
                    min={0}
                    value={newCouponMaxUsage}
                    onChange={(e) => setNewCouponMaxUsage(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 font-mono text-xs text-zinc-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-zinc-700">تاريخ انتهاء الصلاحية</label>
                <input
                  type="date"
                  value={newCouponExpiresAt}
                  onChange={(e) => setNewCouponExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 bg-zinc-50 font-mono text-xs text-zinc-900"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddCouponOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-100 text-xs font-bold text-zinc-600 hover:bg-zinc-200 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className={`px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer ${theme.primary}`}
              >
                حفظ الكوبون وتفعيله
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
