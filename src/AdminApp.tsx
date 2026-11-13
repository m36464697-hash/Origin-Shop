/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  ShieldCheck,
  Lock,
  LogOut,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  ADMIN_EMAIL,
  OperationType,
  handleFirestoreError,
} from './firebase';
import { AdminDashboard } from './components/AdminDashboard';
import { InvoiceModal } from './components/InvoiceModal';
import { BrandWordmark } from './components/BrandWordmark';
import {
  Product,
  Order,
  Customer,
  StoreBranding,
  NotificationItem,
  OrderStatus,
  SupportTicket,
  Coupon,
  DigitalDelivery,
  DigitalDeliveryType,
} from './types/store';
import {
  INITIAL_BRANDING,
  INITIAL_PRODUCTS,
  INITIAL_COUPONS,
} from './data/initialData';

function stripUndefined<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export default function AdminApp() {
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Real-time Cloud Firestore Admin State
  const [branding, setBranding] = useState<StoreBranding>(INITIAL_BRANDING);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [cloudUsers, setCloudUsers] = useState<Customer[]>([]);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  const isAuthorizedAdmin = Boolean(
    fbUser && fbUser.emailVerified && fbUser.email === ADMIN_EMAIL
  );

  // 1. Auth Listener (Strict verification against ADMIN_EMAIL)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. Real-time Firestore Subscriptions (ONLY active after verified Admin login)
  useEffect(() => {
    if (!isAuthorizedAdmin) return;

    const unsubBranding = onSnapshot(
      doc(db, 'settings', 'public_branding'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<StoreBranding>;
          setBranding((prev) => ({
            ...prev,
            ...data,
          }));
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'settings/public_branding')
    );

    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Product);
        setProducts(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'products')
    );

    const unsubCoupons = onSnapshot(
      collection(db, 'coupons'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Coupon);
        setCoupons(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'coupons')
    );

    const unsubOrders = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as Order)
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setOrders(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    const unsubTickets = onSnapshot(
      collection(db, 'tickets'),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as SupportTicket)
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setSupportTickets(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'tickets')
    );

    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list: Customer[] = snap.docs.map((d) => {
          const u = d.data() as any;
          return {
            id: u.uid || d.id,
            userId: u.uid || d.id,
            name: u.name || 'عميل Google',
            email: u.email || '',
            phone: u.phone || '-',
            city: u.city || 'القاهرة',
            ordersCount: 0,
            totalSpent: 0,
            joinedDate: (u.updatedAt || new Date().toISOString()).split('T')[0],
            status: 'active',
            avatar: u.avatar,
          };
        });
        setCloudUsers(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'users')
    );

    return () => {
      unsubBranding();
      unsubProducts();
      unsubCoupons();
      unsubOrders();
      unsubTickets();
      unsubUsers();
    };
  }, [isAuthorizedAdmin]);

  useEffect(() => {
    document.title = `${branding.storeName || 'Origin Shop'} | بوابة الإدارة الخاصة`;
  }, [branding.storeName]);

  // Derived Customers directory combining registered users + order metrics
  const customers = useMemo(() => {
    const byEmail = new Map<string, Customer>();
    cloudUsers.forEach((c) => {
      if (c.email) byEmail.set(c.email, { ...c });
    });
    orders.forEach((ord) => {
      const email = ord.customer.email;
      const prev = byEmail.get(email);
      if (prev) {
        prev.ordersCount += 1;
        prev.totalSpent += ord.total;
        if (ord.customer.phone) prev.phone = ord.customer.phone;
        if (ord.customer.city) prev.city = ord.customer.city;
      } else {
        byEmail.set(email, {
          id: ord.userId || `cust-${email}`,
          userId: ord.userId,
          name: ord.customer.name,
          email,
          phone: ord.customer.phone,
          city: ord.customer.city || 'القاهرة',
          ordersCount: 1,
          totalSpent: ord.total,
          joinedDate: (ord.createdAt || new Date().toISOString()).split('T')[0],
          status: 'active',
        });
      }
    });
    return Array.from(byEmail.values());
  }, [cloudUsers, orders]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setAuthError('تم إغلاق نافذة تسجيل الدخول قبل الإتمام.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setAuthError(
          'هذا النطاق غير مضاف في إعدادات المصادقة (Authorized domains) داخل Firebase Console.'
        );
      } else {
        setAuthError('تعذّر إتمام تسجيل الدخول بحساب Google. حاول مرة أخرى.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Admin sign out error:', err);
    }
  };

  // Cloud Firestore Admin Handlers
  const handleUpdateBranding = useCallback((nextBranding: StoreBranding) => {
    setBranding(nextBranding);
    const { adminPassword: _omitPassword, ...publicPayload } = nextBranding;
    setDoc(
      doc(db, 'settings', 'public_branding'),
      stripUndefined(publicPayload),
      { merge: true }
    ).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, 'settings/public_branding')
    );
  }, []);

  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
    setDoc(doc(db, 'products', newProduct.id), stripUndefined(newProduct)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `products/${newProduct.id}`)
    );
  };

  const handleEditProduct = (updatedProduct: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
    setDoc(
      doc(db, 'products', updatedProduct.id),
      stripUndefined(updatedProduct),
      { merge: true }
    ).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `products/${updatedProduct.id}`)
    );
  };

  const handleToggleProductStock = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const nextStock = !p.inStock;
        updateDoc(doc(db, 'products', productId), { inStock: nextStock }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`)
        );
        return { ...p, inStock: nextStock };
      })
    );
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    deleteDoc(doc(db, 'products', productId)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `products/${productId}`)
    );
  };

  const handleAddCoupon = (newCoupon: Coupon) => {
    setCoupons((prev) => [newCoupon, ...prev]);
    setDoc(doc(db, 'coupons', newCoupon.id), stripUndefined(newCoupon)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `coupons/${newCoupon.id}`)
    );
  };

  const handleToggleCoupon = (couponId: string) => {
    setCoupons((prev) =>
      prev.map((c) => {
        if (c.id !== couponId) return c;
        const nextActive = !c.active;
        updateDoc(doc(db, 'coupons', couponId), { active: nextActive }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `coupons/${couponId}`)
        );
        return { ...c, active: nextActive };
      })
    );
  };

  const handleDeleteCoupon = (couponId: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    deleteDoc(doc(db, 'coupons', couponId)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `coupons/${couponId}`)
    );
  };

  const pushUserNotification = (targetUserId: string, notif: NotificationItem) => {
    if (!targetUserId || targetUserId === 'guest') return;
    setDoc(doc(db, 'notifications', notif.id), stripUndefined(notif)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `notifications/${notif.id}`)
    );
  };

  const handleConfirmOrderPayment = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;
    const nextStatus: OrderStatus =
      targetOrder.orderStatus === 'pending' ? 'processing' : targetOrder.orderStatus;

    updateDoc(doc(db, 'orders', orderId), {
      paymentStatus: 'paid',
      orderStatus: nextStatus,
    }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`));

    pushUserNotification(targetOrder.userId || '', {
      id: `notif-pay-${Date.now()}`,
      userId: targetOrder.userId || '',
      createdAtMs: Date.now(),
      title: `تم تأكيد استلام مبلغ الطلب #${orderId}`,
      message: `أكد مسؤول ${branding.storeName} استلام المبلغ بنجاح، وجاري الآن استكمال تجهيز وتسليم طلبك.`,
      time: 'الآن',
      read: false,
      type: 'order',
      actionLabel: 'متابعة الطلب',
      targetView: 'orders',
    });
  };

  const handleDeliverDigitalOrder = (
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
  ) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const now = new Date().toISOString();
    const newDelivery: DigitalDelivery = {
      productId: `deliv-${Date.now()}`,
      productName: payload.productName,
      deliveryType: payload.deliveryType,
      textContent: payload.textContent,
      imageData: payload.imageData,
      fileName: payload.fileName || `${payload.productName}.zip`,
      fileSize: 'مرفق معتمد',
      licenseKey: payload.licenseKey || `ORIGIN-${Math.floor(100000 + Math.random() * 900000)}`,
      downloadCount: 0,
      maxDownloads: 10,
      expiresAt: '2030-12-31',
      downloadUrl: '#',
      fileData: payload.fileData,
      deliveredAt: now,
    };

    const updatedDeliveries = [newDelivery, ...(targetOrder.digitalDeliveries || [])];

    updateDoc(
      doc(db, 'orders', orderId),
      stripUndefined({
        orderStatus: 'completed',
        paymentStatus: 'paid',
        digitalDeliveries: updatedDeliveries,
      })
    ).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`));

    pushUserNotification(targetOrder.userId || '', {
      id: `notif-del-${Date.now()}`,
      userId: targetOrder.userId || '',
      createdAtMs: Date.now(),
      title: `تم تأكيد الدفع وتسليم طلبك: ${payload.productName}`,
      message:
        'تم التحقق من وصول المبلغ بنجاح وإرسال محتوى الطلب الرقمي إلى حسابك. يمكنك استعراضه مباشرة من هنا أو في قسم طلباتي.',
      time: 'الآن',
      read: false,
      type: 'delivery',
      actionLabel: 'عرض في طلباتي',
      targetView: 'orders',
      deliveryPayload: {
        orderId,
        productName: payload.productName,
        deliveryType: payload.deliveryType,
        textContent: payload.textContent,
        imageData: payload.imageData,
        fileData: payload.fileData,
        fileName: payload.fileName,
        licenseKey: payload.licenseKey,
      },
    });
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    tracking?: string,
    carrier?: string
  ) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const nextPaymentStatus =
      status === 'completed' || status === 'delivered'
        ? 'paid'
        : status === 'cancelled'
        ? 'refunded'
        : targetOrder.paymentStatus;

    updateDoc(
      doc(db, 'orders', orderId),
      stripUndefined({
        orderStatus: status,
        paymentStatus: nextPaymentStatus,
        ...(tracking !== undefined ? { trackingNumber: tracking } : {}),
        ...(carrier !== undefined ? { carrier } : {}),
      })
    ).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`));

    const statusMsgMap: Record<OrderStatus, string> = {
      pending: 'في انتظار مراجعة الدفع',
      processing: 'قيد التجهيز والتأكيد',
      shipped: 'تم الشحن للتوصيل',
      delivered: 'تم التوصيل بنجاح',
      completed: 'مكتمل ومسلّم',
      cancelled: 'تم إلغاء الطلب',
    };

    pushUserNotification(targetOrder.userId || '', {
      id: `notif-${Date.now()}`,
      userId: targetOrder.userId || '',
      createdAtMs: Date.now(),
      title: `تحديث حالة طلبك #${orderId}`,
      message: `تم تحديث حالة طلبك إلى: ${statusMsgMap[status]}${
        tracking ? ` (رقم التتبع: ${tracking})` : ''
      }.`,
      time: 'الآن',
      read: false,
      type: status === 'shipped' ? 'shipping' : 'order',
      actionLabel: 'عرض في طلباتي',
      targetView: 'orders',
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    deleteDoc(doc(db, 'orders', orderId)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`)
    );
  };

  const handleReplyToTicket = (ticketId: string, replyText: string) => {
    const targetTicket = supportTickets.find((t) => t.id === ticketId);
    if (!targetTicket) return;

    const timestamp = new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const newReply = {
      id: `rep-admin-${Date.now()}`,
      sender: 'admin' as const,
      senderName: `مسؤول متجر ${branding.storeName}`,
      text: replyText,
      timestamp,
    };

    updateDoc(
      doc(db, 'tickets', ticketId),
      stripUndefined({
        status: 'replied',
        replies: [...targetTicket.replies, newReply],
      })
    ).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `tickets/${ticketId}`));
  };

  const handleExportBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      storeName: branding.storeName,
      branding,
      products,
      coupons,
      orders,
      tickets: supportTickets,
      customers,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `origin-shop-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleResetDefaults = () => {
    handleUpdateBranding(INITIAL_BRANDING);
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 text-right font-sans">
        <div className="flex flex-col items-center gap-3 text-zinc-600">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-950" />
          <p className="text-xs font-bold">جاري التحقق من جلسة الإدارة الآمنة...</p>
        </div>
      </div>
    );
  }

  // Gate 1 & 2: Google Auth strictly restricted to verified ADMIN_EMAIL
  if (!isAuthorizedAdmin) {
    const isWrongAccount = Boolean(fbUser && fbUser.email !== ADMIN_EMAIL);
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 text-right font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl border border-zinc-200 shadow-xl p-7 sm:p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-14 px-4 py-2 rounded-2xl bg-black border border-zinc-900 flex items-center justify-center shadow-sm">
              <img
                src="./origin-logo.png"
                alt="Origin Shop"
                className="h-full w-auto max-w-[140px] object-contain"
              />
            </div>
            <BrandWordmark storeName="Origin Shop" size="md" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-100 border border-zinc-200 text-[11px] font-bold text-zinc-700">
              <Lock className="w-3.5 h-3.5 text-zinc-950" />
              <span>بوابة الإدارة الخاصة والمستقلة</span>
            </div>
          </div>

          {isWrongAccount && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>هذا الحساب غير مخوّل للوصول للوحة التحكم</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                الحساب المسجل حالياً (<span className="font-mono font-bold">{fbUser?.email}</span>) لا يملك صلاحيات الإدارة. يُسمح بالدخول لحساب مالك المتجر المعتمد فقط.
              </p>
            </div>
          )}

          {authError && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2 font-semibold leading-relaxed">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 space-y-1.5 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-zinc-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>حماية معزولة بالكامل عن متجر العملاء</span>
            </div>
            <p className="text-[11px]">
              تعمل هذه البوابة على نطاق مستقل ومؤمّن بمصادقة Google وقواعد أمان Firestore؛ جميع التعديلات تظهر فوراً في موقع المتجر الرئيسي.
            </p>
          </div>

          <div className="space-y-2.5">
            {isWrongAccount ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج والدخول بحساب الإدارة</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isSigningIn}
                onClick={handleGoogleSignIn}
                className="w-full py-3.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 disabled:opacity-60 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                {isSigningIn ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>تسجيل الدخول بحساب الإدارة المعتمد (Google)</span>
              </button>
            )}

            <a
              href={import.meta.env.VITE_STOREFRONT_URL || 'https://origin-shop.onrender.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>زيارة واجهة المتجر العامة</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans text-right">
      <AdminDashboard
        orders={orders}
        products={products}
        customers={customers}
        branding={branding}
        supportTickets={supportTickets}
        coupons={coupons}
        onUpdateBranding={handleUpdateBranding}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onConfirmOrderPayment={handleConfirmOrderPayment}
        onDeleteOrder={handleDeleteOrder}
        onAddProduct={handleAddProduct}
        onEditProduct={handleEditProduct}
        onToggleProductStock={handleToggleProductStock}
        onDeleteProduct={handleDeleteProduct}
        onReplyToTicket={handleReplyToTicket}
        onAddCoupon={handleAddCoupon}
        onToggleCoupon={handleToggleCoupon}
        onDeleteCoupon={handleDeleteCoupon}
        onDeliverDigitalOrder={handleDeliverDigitalOrder}
        onOpenInvoice={(order) => setSelectedInvoiceOrder(order)}
        onExportBackup={handleExportBackup}
        onResetDefaults={handleResetDefaults}
        isCloudAdmin={true}
        isStandaloneAdmin={true}
        storefrontUrl={import.meta.env.VITE_STOREFRONT_URL || 'https://origin-shop.onrender.com'}
        onLockAdmin={handleSignOut}
        onCloseAdmin={handleSignOut}
      />

      <InvoiceModal
        isOpen={!!selectedInvoiceOrder}
        order={selectedInvoiceOrder}
        branding={branding}
        onClose={() => setSelectedInvoiceOrder(null)}
      />
    </div>
  );
}
