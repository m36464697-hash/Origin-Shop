/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db, ADMIN_EMAIL, OperationType, handleFirestoreError } from './firebase';

import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { CustomerPortalModal } from './components/CustomerPortalModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { LiveSupportChat } from './components/LiveSupportChat';
import { NotificationCenter } from './components/NotificationCenter';
import { Footer } from './components/Footer';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { InvoiceModal } from './components/InvoiceModal';
import { TrendingTicker } from './components/TrendingTicker';
import { PolicyModal, PolicyType } from './components/PolicyModal';

import {
  Product,
  Order,
  Customer,
  CartItem,
  StoreBranding,
  NotificationItem,
  OrderStatus,
  SupportTicket,
  GoogleUserProfile,
  Coupon,
  ProductReview,
  DigitalDelivery,
  DigitalDeliveryType
} from './types/store';
import {
  INITIAL_BRANDING,
  INITIAL_PRODUCTS,
  INITIAL_COUPONS
} from './data/initialData';
import { THEME_PALETTES } from './utils/theme';
import { DownloadCloud, Package, Plus, CheckCircle2, FileText, AlertTriangle } from 'lucide-react';

function safeLoadJSON<T>(primaryKey: string, fallbackKey: string | null, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(primaryKey) || (fallbackKey ? localStorage.getItem(fallbackKey) : null);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function safeSaveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Could not persist ${key} to localStorage:`, err);
  }
}

function stripUndefined<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function acctKey(scopeId: string, suffix: string): string {
  return `origin_acct_${scopeId}_${suffix}`;
}

function getKnownAccountScopes(): string[] {
  const scopes = safeLoadJSON<string[]>('origin_known_scopes', null, ['guest']);
  return Array.from(new Set(['guest', ...scopes]));
}

function registerAccountScope(scopeId: string): void {
  const scopes = getKnownAccountScopes();
  if (!scopes.includes(scopeId)) {
    safeSaveJSON('origin_known_scopes', [...scopes, scopeId]);
  }
}

export default function App() {
  // Clean up any ancient legacy keys
  useEffect(() => {
    ['medrar_products', 'medrar_orders', 'medrar_customers', 'medrar_notifications', 'medrar_branding'].forEach((k) => {
      if (localStorage.getItem(k)) localStorage.removeItem(k);
    });
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('eshop_theme');
    localStorage.removeItem('origin_theme');
  }, []);

  // Store-wide public states
  const [branding, setBranding] = useState<StoreBranding>(() => {
    const parsed = safeLoadJSON<StoreBranding | null>('origin_branding', 'eshop_branding', null);
    if (parsed && parsed.paymentGateways) {
      return {
        ...INITIAL_BRANDING,
        ...parsed,
        storeName: parsed.storeName === 'E-SHOP' ? 'Origin Shop' : (parsed.storeName || 'Origin Shop'),
        logoUrl: !parsed.logoUrl || parsed.logoUrl === '/origin-logo.png' ? './origin-logo.png' : parsed.logoUrl,
      };
    }
    return INITIAL_BRANDING;
  });

  const [products, setProducts] = useState<Product[]>(() =>
    safeLoadJSON<Product[]>('origin_products', 'eshop_products', INITIAL_PRODUCTS)
  );

  const [coupons, setCoupons] = useState<Coupon[]>(() =>
    safeLoadJSON<Coupon[]>('origin_coupons', 'eshop_coupons', INITIAL_COUPONS)
  );

  // Authenticated User State (Real Firebase Auth)
  const [currentUser, setCurrentUser] = useState<GoogleUserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isCloudAdmin, setIsCloudAdmin] = useState(false);
  const [isGoogleAuthOpen, setIsGoogleAuthOpen] = useState(false);

  const accountScopeId = currentUser?.id || 'guest';

  // Strictly isolated per-account states!
  const [orders, setOrders] = useState<Order[]>(() =>
    safeLoadJSON<Order[]>(acctKey('guest', 'orders'), null, [])
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    safeLoadJSON<NotificationItem[]>(acctKey('guest', 'notifications'), null, [])
  );
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() =>
    safeLoadJSON<SupportTicket[]>(acctKey('guest', 'tickets'), null, [])
  );
  const [cart, setCart] = useState<CartItem[]>(() =>
    safeLoadJSON<CartItem[]>(acctKey('guest', 'cart'), null, [])
  );

  // Admin aggregated views (populated ONLY when Admin Dashboard is unlocked)
  const [adminCloudOrders, setAdminCloudOrders] = useState<Order[]>([]);
  const [adminCloudTickets, setAdminCloudTickets] = useState<SupportTicket[]>([]);
  const [adminCloudCustomers, setAdminCloudCustomers] = useState<Customer[]>([]);

  const [appliedPromo, setAppliedPromo] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Admin authentication & view state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);

  // Navigation & Filter state
  const [activeFilter, setActiveFilter] = useState<'all' | 'digital' | 'physical'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Panels state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [activePolicy, setActivePolicy] = useState<PolicyType | null>(null);

  useEffect(() => {
    document.title = `${branding.storeName || 'Origin Shop'} | متجر الطلبات الرقمية والمنتجات العادية`;
  }, [branding.storeName]);

  // Helper to update branding & sync public settings to Firestore if Cloud Admin
  const handleUpdateBranding = useCallback(
    (nextBranding: StoreBranding) => {
      setBranding(nextBranding);
      safeSaveJSON('origin_branding', nextBranding);

      if (isCloudAdmin && auth.currentUser) {
        const { adminPassword: _omitPassword, ...publicPayload } = nextBranding;
        setDoc(doc(db, 'settings', 'public_branding'), stripUndefined(publicPayload), { merge: true }).catch(
          (err) => handleFirestoreError(err, OperationType.WRITE, 'settings/public_branding')
        );
      }
    },
    [isCloudAdmin]
  );

  // 1. Firebase Auth State Listener + Instant Per-Account Bucket Switching
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const savedProfile = safeLoadJSON<Partial<GoogleUserProfile>>(
          acctKey(fbUser.uid, 'profile'),
          null,
          {}
        );
        const profile: GoogleUserProfile = {
          id: fbUser.uid,
          name: savedProfile.name || fbUser.displayName || 'مستخدم Google',
          email: fbUser.email || '',
          avatar:
            fbUser.photoURL ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
              fbUser.displayName || fbUser.email || 'Origin'
            )}&backgroundColor=09090b`,
          givenName: fbUser.displayName ? fbUser.displayName.split(' ')[0] : 'المستخدم',
          phone: savedProfile.phone || '',
          city: savedProfile.city || 'القاهرة',
          address: savedProfile.address || '',
          postalCode: savedProfile.postalCode || '',
        };

        registerAccountScope(fbUser.uid);
        setCurrentUser(profile);
        setIsCloudAdmin(Boolean(fbUser.emailVerified && fbUser.email === ADMIN_EMAIL));

        // Immediately swap to this account's isolated local cache (prevents cross-account flash!)
        setOrders(safeLoadJSON<Order[]>(acctKey(fbUser.uid, 'orders'), null, []));
        setNotifications(safeLoadJSON<NotificationItem[]>(acctKey(fbUser.uid, 'notifications'), null, []));
        setSupportTickets(safeLoadJSON<SupportTicket[]>(acctKey(fbUser.uid, 'tickets'), null, []));
        setCart(safeLoadJSON<CartItem[]>(acctKey(fbUser.uid, 'cart'), null, []));
        setAppliedPromo('');
        setDiscountAmount(0);

        // Ensure Firestore user document exists for this UID
        setDoc(
          doc(db, 'users', fbUser.uid),
          stripUndefined({
            uid: fbUser.uid,
            name: profile.name,
            email: profile.email,
            avatar: profile.avatar,
            updatedAt: new Date().toISOString(),
          }),
          { merge: true }
        ).catch(() => {
          // Ignore silent boot sync errors if offline
        });
      } else {
        setCurrentUser(null);
        setIsCloudAdmin(false);

        // Swap back to isolated guest scope immediately
        setOrders(safeLoadJSON<Order[]>(acctKey('guest', 'orders'), null, []));
        setNotifications(safeLoadJSON<NotificationItem[]>(acctKey('guest', 'notifications'), null, []));
        setSupportTickets(safeLoadJSON<SupportTicket[]>(acctKey('guest', 'tickets'), null, []));
        setCart(safeLoadJSON<CartItem[]>(acctKey('guest', 'cart'), null, []));
        setAppliedPromo('');
        setDiscountAmount(0);
      }
      setIsAuthReady(true);
    });

    return () => unsub();
  }, []);

  // 2. Public Storefront Firestore Listeners (Products, Coupons, Public Branding)
  useEffect(() => {
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        if (!snap.empty) {
          const cloudProds = snap.docs.map((d) => d.data() as Product);
          setProducts(cloudProds);
        }
      },
      () => {
        // Keep local catalog gracefully if permissions/offline
      }
    );

    const unsubCoupons = onSnapshot(
      collection(db, 'coupons'),
      (snap) => {
        if (!snap.empty) {
          const cloudCoupons = snap.docs.map((d) => d.data() as Coupon);
          setCoupons(cloudCoupons);
        }
      },
      () => {}
    );

    const unsubBranding = onSnapshot(
      doc(db, 'settings', 'public_branding'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<StoreBranding>;
          setBranding((prev) => ({
            ...prev,
            ...data,
            adminPassword: prev.adminPassword,
          }));
        }
      },
      () => {}
    );

    return () => {
      unsubProducts();
      unsubCoupons();
      unsubBranding();
    };
  }, []);

  // 3. Per-Account Isolated Firestore Listeners (Strictly scoped by currentUser.id)
  useEffect(() => {
    if (!isAuthReady || !currentUser) return;
    const uid = currentUser.id;

    // User profile & cart sync
    const unsubUser = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as any;
          setCurrentUser((prev) =>
            prev && prev.id === uid
              ? {
                  ...prev,
                  name: data.name || prev.name,
                  phone: data.phone ?? prev.phone,
                  city: data.city ?? prev.city,
                  address: data.address ?? prev.address,
                  postalCode: data.postalCode ?? prev.postalCode,
                }
              : prev
          );
          if (Array.isArray(data.cartItems)) {
            setCart(data.cartItems);
            safeSaveJSON(acctKey(uid, 'cart'), data.cartItems);
          }
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}`)
    );

    // Account-only orders
    const ordersQ = query(collection(db, 'orders'), where('userId', '==', uid));
    const unsubOrders = onSnapshot(
      ordersQ,
      (snap) => {
        const cloudOrders = snap.docs
          .map((d) => d.data() as Order)
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        if (cloudOrders.length > 0) {
          setOrders(cloudOrders);
          safeSaveJSON(acctKey(uid, 'orders'), cloudOrders);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    // Account-only notifications
    const notifsQ = query(collection(db, 'notifications'), where('userId', '==', uid));
    const unsubNotifs = onSnapshot(
      notifsQ,
      (snap) => {
        const cloudNotifs = snap.docs
          .map((d) => d.data() as NotificationItem)
          .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
        if (cloudNotifs.length > 0) {
          setNotifications(cloudNotifs);
          safeSaveJSON(acctKey(uid, 'notifications'), cloudNotifs);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
    );

    // Account-only support tickets
    const ticketsQ = query(collection(db, 'tickets'), where('userId', '==', uid));
    const unsubTickets = onSnapshot(
      ticketsQ,
      (snap) => {
        const cloudTickets = snap.docs
          .map((d) => d.data() as SupportTicket)
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        if (cloudTickets.length > 0) {
          setSupportTickets(cloudTickets);
          safeSaveJSON(acctKey(uid, 'tickets'), cloudTickets);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'tickets')
    );

    return () => {
      unsubUser();
      unsubOrders();
      unsubNotifs();
      unsubTickets();
    };
  }, [isAuthReady, currentUser?.id]);

  // 4. Cloud Admin Listeners (only when signed in as verified ADMIN_EMAIL)
  useEffect(() => {
    if (!isCloudAdmin || !isAdminAuthenticated) return;

    const unsubAllOrders = onSnapshot(
      collection(db, 'orders'),
      (snap) => {
        const all = snap.docs
          .map((d) => d.data() as Order)
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setAdminCloudOrders(all);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
    );

    const unsubAllTickets = onSnapshot(
      collection(db, 'tickets'),
      (snap) => {
        const all = snap.docs
          .map((d) => d.data() as SupportTicket)
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setAdminCloudTickets(all);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'tickets')
    );

    const unsubAllUsers = onSnapshot(
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
        setAdminCloudCustomers(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'users')
    );

    return () => {
      unsubAllOrders();
      unsubAllTickets();
      unsubAllUsers();
    };
  }, [isCloudAdmin, isAdminAuthenticated]);

  // Sync shared store data to localStorage
  useEffect(() => { safeSaveJSON('origin_branding', branding); }, [branding]);
  useEffect(() => { safeSaveJSON('origin_products', products); }, [products]);
  useEffect(() => { safeSaveJSON('origin_coupons', coupons); }, [coupons]);

  // Sync active account's private data to ITS OWN scoped localStorage bucket
  useEffect(() => {
    registerAccountScope(accountScopeId);
    safeSaveJSON(acctKey(accountScopeId, 'orders'), orders);
  }, [accountScopeId, orders]);

  useEffect(() => {
    registerAccountScope(accountScopeId);
    safeSaveJSON(acctKey(accountScopeId, 'notifications'), notifications);
  }, [accountScopeId, notifications]);

  useEffect(() => {
    registerAccountScope(accountScopeId);
    safeSaveJSON(acctKey(accountScopeId, 'tickets'), supportTickets);
  }, [accountScopeId, supportTickets]);

  useEffect(() => {
    registerAccountScope(accountScopeId);
    safeSaveJSON(acctKey(accountScopeId, 'cart'), cart);
  }, [accountScopeId, cart]);

  // Persist cart to Firestore /users/{uid} when signed in
  const syncCartToCloud = useCallback(
    (nextCart: CartItem[]) => {
      if (currentUser && auth.currentUser?.uid === currentUser.id) {
        setDoc(
          doc(db, 'users', currentUser.id),
          stripUndefined({
            uid: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            cartItems: nextCart.slice(0, 50),
            updatedAt: new Date().toISOString(),
          }),
          { merge: true }
        ).catch(() => {});
      }
    },
    [currentUser]
  );

  // Save per-account delivery profile (phone, city, address)
  const handleSaveUserProfile = (patch: Partial<GoogleUserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...patch };
    setCurrentUser(updated);
    safeSaveJSON(acctKey(currentUser.id, 'profile'), updated);

    if (auth.currentUser?.uid === currentUser.id) {
      setDoc(
        doc(db, 'users', currentUser.id),
        stripUndefined({
          uid: currentUser.id,
          name: updated.name,
          email: updated.email,
          phone: updated.phone || '',
          city: updated.city || 'القاهرة',
          address: updated.address || '',
          postalCode: updated.postalCode || '',
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      ).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.id}`));
    }
  };

  // Aggregate all local + cloud orders/tickets ONLY for Admin Dashboard
  const adminAggregatedOrders = useMemo(() => {
    if (!isAdminAuthenticated) return [];
    const map = new Map<string, Order>();
    adminCloudOrders.forEach((o) => map.set(o.id, o));
    getKnownAccountScopes().forEach((scope) => {
      const scopeOrders = safeLoadJSON<Order[]>(acctKey(scope, 'orders'), null, []);
      scopeOrders.forEach((o) => {
        if (!map.has(o.id)) map.set(o.id, o);
      });
    });
    orders.forEach((o) => {
      if (!map.has(o.id)) map.set(o.id, o);
    });
    return Array.from(map.values()).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [isAdminAuthenticated, adminCloudOrders, orders]);

  const adminAggregatedTickets = useMemo(() => {
    if (!isAdminAuthenticated) return [];
    const map = new Map<string, SupportTicket>();
    adminCloudTickets.forEach((t) => map.set(t.id, t));
    getKnownAccountScopes().forEach((scope) => {
      const scopeTickets = safeLoadJSON<SupportTicket[]>(acctKey(scope, 'tickets'), null, []);
      scopeTickets.forEach((t) => {
        if (!map.has(t.id)) map.set(t.id, t);
      });
    });
    supportTickets.forEach((t) => {
      if (!map.has(t.id)) map.set(t.id, t);
    });
    return Array.from(map.values()).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [isAdminAuthenticated, adminCloudTickets, supportTickets]);

  const adminAggregatedCustomers = useMemo(() => {
    if (!isAdminAuthenticated) return [];
    const byEmail = new Map<string, Customer>();
    adminCloudCustomers.forEach((c) => {
      if (c.email) byEmail.set(c.email, { ...c });
    });
    adminAggregatedOrders.forEach((ord) => {
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
  }, [isAdminAuthenticated, adminCloudCustomers, adminAggregatedOrders]);

  const theme = THEME_PALETTES[branding.primaryTheme] || THEME_PALETTES.slate;

  // Helper to write to a specific customer's isolated account bucket (when admin acts on another user's order/ticket)
  const updateTargetAccountOrder = (targetUserId: string, updater: (list: Order[]) => Order[]) => {
    const scope = targetUserId || 'guest';
    const currentList = safeLoadJSON<Order[]>(acctKey(scope, 'orders'), null, []);
    const nextList = updater(currentList);
    safeSaveJSON(acctKey(scope, 'orders'), nextList);
    if (scope === accountScopeId) {
      setOrders(nextList);
    }
  };

  const pushTargetAccountNotification = (targetUserId: string, notif: NotificationItem) => {
    const scope = targetUserId || 'guest';
    const currentList = safeLoadJSON<NotificationItem[]>(acctKey(scope, 'notifications'), null, []);
    const nextList = [notif, ...currentList];
    safeSaveJSON(acctKey(scope, 'notifications'), nextList);
    if (scope === accountScopeId) {
      setNotifications(nextList);
    }

    if (isCloudAdmin && targetUserId && targetUserId !== 'guest') {
      setDoc(doc(db, 'notifications', notif.id), stripUndefined(notif)).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `notifications/${notif.id}`)
      );
    }
  };

  // Manual Digital Delivery Fulfillment from Admin
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
    const targetOrder = adminAggregatedOrders.find((o) => o.id === orderId) || orders.find((o) => o.id === orderId);
    const targetUserId = targetOrder?.userId || accountScopeId;

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

    const updatedDeliveries = [newDelivery, ...(targetOrder?.digitalDeliveries || [])];

    updateTargetAccountOrder(targetUserId, (list) =>
      list.map((o) =>
        o.id !== orderId
          ? o
          : {
              ...o,
              orderStatus: 'completed',
              paymentStatus: 'paid',
              digitalDeliveries: updatedDeliveries,
            }
      )
    );

    if (isCloudAdmin && targetOrder) {
      updateDoc(doc(db, 'orders', orderId), stripUndefined({
        orderStatus: 'completed',
        paymentStatus: 'paid',
        digitalDeliveries: updatedDeliveries,
      })).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`));
    }

    const deliveryNotif: NotificationItem = {
      id: `notif-del-${Date.now()}`,
      userId: targetUserId,
      createdAtMs: Date.now(),
      title: `تم تأكيد الدفع وتسليم طلبك: ${payload.productName}`,
      message: `تم التحقق من وصول المبلغ بنجاح وإرسال محتوى الطلب الرقمي إلى حسابك. يمكنك استعراضه مباشرة من هنا أو في قسم طلباتي.`,
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
    };

    pushTargetAccountNotification(targetUserId, deliveryNotif);
  };

  // Manual Payment Confirmation from Admin
  const handleConfirmOrderPayment = (orderId: string) => {
    const targetOrder = adminAggregatedOrders.find((o) => o.id === orderId) || orders.find((o) => o.id === orderId);
    const targetUserId = targetOrder?.userId || accountScopeId;
    const nextStatus: OrderStatus =
      targetOrder?.orderStatus === 'pending' ? 'processing' : targetOrder?.orderStatus || 'processing';

    updateTargetAccountOrder(targetUserId, (list) =>
      list.map((o) =>
        o.id !== orderId
          ? o
          : {
              ...o,
              paymentStatus: 'paid',
              orderStatus: nextStatus,
            }
      )
    );

    if (isCloudAdmin && targetOrder) {
      updateDoc(doc(db, 'orders', orderId), {
        paymentStatus: 'paid',
        orderStatus: nextStatus,
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`));
    }

    pushTargetAccountNotification(targetUserId, {
      id: `notif-pay-${Date.now()}`,
      userId: targetUserId,
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

  // Google Login Handlers
  const handleGoogleLoginSuccess = (profile: GoogleUserProfile) => {
    setIsGoogleAuthOpen(false);
    const welcomeNotif: NotificationItem = {
      id: `notif-auth-${Date.now()}`,
      userId: profile.id,
      createdAtMs: Date.now(),
      title: `مرحباً بك يا ${profile.givenName || profile.name}!`,
      message: `تم ربط حسابك (${profile.email}) بنظام البيانات المستقل في ${branding.storeName}.`,
      time: 'الآن',
      read: false,
      type: 'order',
    };
    const prev = safeLoadJSON<NotificationItem[]>(acctKey(profile.id, 'notifications'), null, []);
    const next = [welcomeNotif, ...prev];
    safeSaveJSON(acctKey(profile.id, 'notifications'), next);
    setNotifications(next);
  };

  const handleGoogleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  // Handle Admin Dashboard toggle with Password protection
  const handleAdminToggle = () => {
    if (isAdminView) {
      setIsAdminView(false);
    } else if (isAdminAuthenticated) {
      setIsAdminView(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setIsAdminLoginOpen(false);
    setIsAdminView(true);
  };

  // Cart actions
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    if (!product.inStock) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const next = existing
        ? prev.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
          )
        : [...prev, { product, quantity }];
      syncCartToCloud(next);
      return next;
    });

    setAddedNotice(`تمت إضافة "${product.name}" إلى السلة`);
    setTimeout(() => setAddedNotice(null), 3000);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart((prev) => {
      const next = prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item));
      syncCartToCloud(next);
      return next;
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => {
      const next = prev.filter((item) => item.product.id !== productId);
      syncCartToCloud(next);
      return next;
    });
  };

  const handleClearCart = () => {
    setCart([]);
    syncCartToCloud([]);
    setAppliedPromo('');
    setDiscountAmount(0);
  };

  // Dynamic Coupon Validation
  const handleApplyPromo = (code: string): { success: boolean; message?: string } => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'يرجى كتابة رمز الكوبون' };
    }

    const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const coupon = coupons.find((c) => c.code.toUpperCase() === cleanCode);

    if (!coupon) {
      return { success: false, message: 'كود الخصم غير صحيح أو غير موجود' };
    }
    if (!coupon.active) {
      return { success: false, message: 'هذا الكوبون غير مفعّل حالياً' };
    }
    if (coupon.expiresAt) {
      const expiry = new Date(coupon.expiresAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiry < today) {
        return { success: false, message: 'عذراً، انتهت صلاحية هذا الكوبون' };
      }
    }
    if (coupon.maxUsage && coupon.maxUsage > 0 && (coupon.usageCount || 0) >= coupon.maxUsage) {
      return { success: false, message: 'تم استنفاد الحد الأقصى لاستخدام هذا الكوبون' };
    }
    if (coupon.minSpend && coupon.minSpend > 0 && subtotal < coupon.minSpend) {
      return {
        success: false,
        message: `الحد الأدنى لقيمة المشتريات لتفعيل هذا الكوبون هو ${coupon.minSpend} ج.م`
      };
    }

    let calculatedDiscount = 0;
    if (coupon.discountType === 'percentage') {
      calculatedDiscount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && coupon.maxDiscount > 0) {
        calculatedDiscount = Math.min(calculatedDiscount, coupon.maxDiscount);
      }
    } else {
      calculatedDiscount = Math.min(coupon.discountValue, subtotal);
    }

    setAppliedPromo(coupon.code);
    setDiscountAmount(calculatedDiscount);

    const nextUsage = (coupon.usageCount || 0) + 1;
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, usageCount: nextUsage } : c))
    );

    if (auth.currentUser?.emailVerified) {
      updateDoc(doc(db, 'coupons', coupon.id), { usageCount: nextUsage }).catch(() => {});
    }

    return {
      success: true,
      message: `تم تطبيق الخصم بنجاح (${coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `${coupon.discountValue} ج.م`})`
    };
  };

  // Customer Reviews Handler
  const handleAddReview = (productId: string, rating: number, comment: string, reviewerName: string) => {
    const nameToUse = reviewerName.trim() || currentUser?.name || 'عميل موثق';
    const newRev: ProductReview = {
      id: `rev-${Date.now()}`,
      customerName: nameToUse,
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
      verifiedPurchase: true
    };

    const applyReview = (p: Product): Product => {
      const updatedReviews = [newRev, ...(p.reviews || [])];
      const avg = Number(
        (updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length).toFixed(1)
      );
      return {
        ...p,
        reviews: updatedReviews,
        rating: avg,
        reviewsCount: updatedReviews.length
      };
    };

    setProducts((prev) => {
      const next = prev.map((p) => {
        if (p.id !== productId) return p;
        const updated = applyReview(p);
        if (auth.currentUser?.emailVerified) {
          updateDoc(doc(db, 'products', productId), stripUndefined({
            reviews: updated.reviews,
            rating: updated.rating,
            reviewsCount: updated.reviewsCount,
          })).catch(() => {});
        }
        return updated;
      });
      return next;
    });
    setSelectedProduct((prev) => (prev && prev.id === productId ? applyReview(prev) : prev));
  };

  // Coupons Admin Handlers
  const handleAddCoupon = (newCoupon: Coupon) => {
    setCoupons((prev) => [newCoupon, ...prev]);
    if (isCloudAdmin) {
      setDoc(doc(db, 'coupons', newCoupon.id), stripUndefined(newCoupon)).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `coupons/${newCoupon.id}`)
      );
    }
  };

  const handleToggleCoupon = (couponId: string) => {
    setCoupons((prev) =>
      prev.map((c) => {
        if (c.id !== couponId) return c;
        const nextActive = !c.active;
        if (isCloudAdmin) {
          updateDoc(doc(db, 'coupons', couponId), { active: nextActive }).catch((err) =>
            handleFirestoreError(err, OperationType.UPDATE, `coupons/${couponId}`)
          );
        }
        return { ...c, active: nextActive };
      })
    );
  };

  const handleDeleteCoupon = (couponId: string) => {
    const removed = coupons.find((c) => c.id === couponId);
    setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    if (appliedPromo && removed?.code === appliedPromo) {
      setAppliedPromo('');
      setDiscountAmount(0);
    }
    if (isCloudAdmin) {
      deleteDoc(doc(db, 'coupons', couponId)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `coupons/${couponId}`)
      );
    }
  };

  const handleBuyNow = (product: Product, quantity: number = 1) => {
    if (!product.inStock) return;
    const nextCart = [{ product, quantity }];
    setCart(nextCart);
    syncCartToCloud(nextCart);
    setIsCheckoutOpen(true);
  };

  // Order Placement (starts as 'pending' payment verification, strictly isolated to active account)
  const handleOrderPlaced = (newOrder: Order) => {
    const ownerUid = currentUser?.id || 'guest';
    const scopedOrder: Order = { ...newOrder, userId: ownerUid };

    setOrders((prev) => [scopedOrder, ...prev]);

    if (currentUser && auth.currentUser?.uid === currentUser.id) {
      setDoc(doc(db, 'orders', scopedOrder.id), stripUndefined(scopedOrder)).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `orders/${scopedOrder.id}`)
      );
    }

    // Update product salesCount & stockCount
    setProducts((prev) =>
      prev.map((prod) => {
        const orderedItem = scopedOrder.items.find((i) => i.productId === prod.id);
        if (!orderedItem) return prod;
        const updatedStock =
          prod.type === 'physical' && prod.stockCount !== undefined
            ? Math.max(0, prod.stockCount - orderedItem.quantity)
            : prod.stockCount;
        const nextProd = {
          ...prod,
          salesCount: (prod.salesCount || 0) + orderedItem.quantity,
          stockCount: updatedStock,
          inStock: updatedStock !== undefined ? updatedStock > 0 : prod.inStock
        };
        if (auth.currentUser?.emailVerified) {
          updateDoc(doc(db, 'products', prod.id), stripUndefined({
            salesCount: nextProd.salesCount,
            ...(updatedStock !== undefined ? { stockCount: updatedStock, inStock: nextProd.inStock } : {}),
          })).catch(() => {});
        }
        return nextProd;
      })
    );

    const hasDigital = scopedOrder.items.some((i) => i.type === 'digital');
    const hasPhysical = scopedOrder.items.some((i) => i.type === 'physical');
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: ownerUid,
      createdAtMs: Date.now(),
      title: `تم استلام طلبك #${scopedOrder.id} — قيد مراجعة الدفع`,
      message:
        hasDigital && !hasPhysical
          ? `شكراً لتسوقك من ${branding.storeName}. طلبك الرقمي الآن في مرحلة التحقق من وصول المبلغ، وبمجرد التأكيد سيصلك مباشرة هنا كإشعار وفي قسم «طلباتي» دون أي مصاريف شحن.`
          : hasDigital && hasPhysical
          ? `شكراً لتسوقك من ${branding.storeName}. طلبك قيد مراجعة الدفع؛ سيتم تسليم طلباتك الرقمية إلكترونياً في حسابك وشحن المنتجات العادية لعنوانك داخل مصر.`
          : `شكراً لتسوقك من ${branding.storeName}. طلبك للمنتجات العادية قيد مراجعة التحويل وتجهيز الشحنة للتوصيل لعنوانك داخل مصر.`,
      time: 'الآن',
      read: false,
      type: 'order',
      actionLabel: 'متابعة في طلباتي',
      targetView: 'orders'
    };

    setNotifications((prev) => [newNotif, ...prev]);
    if (currentUser && auth.currentUser?.uid === currentUser.id) {
      setDoc(doc(db, 'notifications', newNotif.id), stripUndefined(newNotif)).catch(() => {});
    }
  };

  // Admin Order Status Update
  const handleUpdateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    tracking?: string,
    carrier?: string
  ) => {
    const targetOrder = adminAggregatedOrders.find((o) => o.id === orderId) || orders.find((o) => o.id === orderId);
    const targetUserId = targetOrder?.userId || accountScopeId;

    const nextPaymentStatus =
      status === 'completed' || status === 'delivered'
        ? 'paid'
        : status === 'cancelled'
        ? 'refunded'
        : targetOrder?.paymentStatus || 'pending';

    updateTargetAccountOrder(targetUserId, (list) =>
      list.map((o) =>
        o.id !== orderId
          ? o
          : {
              ...o,
              orderStatus: status,
              paymentStatus: nextPaymentStatus,
              trackingNumber: tracking !== undefined ? tracking : o.trackingNumber,
              carrier: carrier !== undefined ? carrier : o.carrier
            }
      )
    );

    if (isCloudAdmin && targetOrder) {
      updateDoc(doc(db, 'orders', orderId), stripUndefined({
        orderStatus: status,
        paymentStatus: nextPaymentStatus,
        ...(tracking !== undefined ? { trackingNumber: tracking } : {}),
        ...(carrier !== undefined ? { carrier } : {}),
      })).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`));
    }

    const statusMsgMap: Record<OrderStatus, string> = {
      pending: 'في انتظار مراجعة الدفع',
      processing: 'قيد التجهيز والتأكيد',
      shipped: 'تم الشحن للتوصيل',
      delivered: 'تم التوصيل بنجاح',
      completed: 'مكتمل ومسلّم',
      cancelled: 'تم إلغاء الطلب'
    };

    pushTargetAccountNotification(targetUserId, {
      id: `notif-${Date.now()}`,
      userId: targetUserId,
      createdAtMs: Date.now(),
      title: `تحديث حالة طلبك #${orderId}`,
      message: `تم تحديث حالة طلبك إلى: ${statusMsgMap[status]}${tracking ? ` (رقم التتبع: ${tracking})` : ''}.`,
      time: 'الآن',
      read: false,
      type: status === 'shipped' ? 'shipping' : 'order',
      actionLabel: 'عرض في طلباتي',
      targetView: 'orders'
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    const targetOrder = adminAggregatedOrders.find((o) => o.id === orderId) || orders.find((o) => o.id === orderId);
    const targetUserId = targetOrder?.userId || accountScopeId;
    updateTargetAccountOrder(targetUserId, (list) => list.filter((o) => o.id !== orderId));

    if (isCloudAdmin) {
      deleteDoc(doc(db, 'orders', orderId)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`)
      );
    }
  };

  // Admin Products management
  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
    if (isCloudAdmin) {
      setDoc(doc(db, 'products', newProduct.id), stripUndefined(newProduct)).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `products/${newProduct.id}`)
      );
    }
  };

  const handleEditProduct = (updatedProduct: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
    setSelectedProduct((prev) => (prev && prev.id === updatedProduct.id ? updatedProduct : prev));
    if (isCloudAdmin) {
      setDoc(doc(db, 'products', updatedProduct.id), stripUndefined(updatedProduct), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `products/${updatedProduct.id}`)
      );
    }
  };

  const handleToggleProductStock = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const nextStock = !p.inStock;
        if (isCloudAdmin) {
          updateDoc(doc(db, 'products', productId), { inStock: nextStock }).catch((err) =>
            handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`)
          );
        }
        return { ...p, inStock: nextStock };
      })
    );
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    if (selectedProduct?.id === productId) setSelectedProduct(null);
    if (isCloudAdmin) {
      deleteDoc(doc(db, 'products', productId)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `products/${productId}`)
      );
    }
  };

  // Support tickets / Messages handling (isolated per userId)
  const handleNewCustomerMessage = (ticket: SupportTicket) => {
    const scopedTicket: SupportTicket = { ...ticket, userId: currentUser?.id || 'guest' };
    setSupportTickets((prev) => {
      const existing = prev.find((t) => t.id === scopedTicket.id);
      return existing
        ? prev.map((t) => (t.id === scopedTicket.id ? scopedTicket : t))
        : [scopedTicket, ...prev];
    });

    if (currentUser && auth.currentUser?.uid === currentUser.id) {
      setDoc(doc(db, 'tickets', scopedTicket.id), stripUndefined(scopedTicket), { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `tickets/${scopedTicket.id}`)
      );
    }
  };

  const handleReplyToTicket = (ticketId: string, replyText: string) => {
    const targetTicket = adminAggregatedTickets.find((t) => t.id === ticketId) || supportTickets.find((t) => t.id === ticketId);
    const targetUserId = targetTicket?.userId || accountScopeId;
    const timestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    const newReply = {
      id: `rep-admin-${Date.now()}`,
      sender: 'admin' as const,
      senderName: `مسؤول متجر ${branding.storeName}`,
      text: replyText,
      timestamp
    };

    const currentScopeList = safeLoadJSON<SupportTicket[]>(acctKey(targetUserId, 'tickets'), null, []);
    const nextList = currentScopeList.map((t) =>
      t.id !== ticketId
        ? t
        : {
            ...t,
            status: 'replied' as const,
            replies: [...t.replies, newReply]
          }
    );
    safeSaveJSON(acctKey(targetUserId, 'tickets'), nextList);
    if (targetUserId === accountScopeId) {
      setSupportTickets(nextList);
    }

    if (isCloudAdmin && targetTicket) {
      updateDoc(doc(db, 'tickets', ticketId), stripUndefined({
        status: 'replied',
        replies: [...targetTicket.replies, newReply],
      })).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `tickets/${ticketId}`));
    }
  };

  // Notifications actions
  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (currentUser && auth.currentUser?.uid === currentUser.id) {
      updateDoc(doc(db, 'notifications', id), { read: true }).catch(() => {});
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => {
      prev.forEach((n) => {
        if (!n.read && currentUser && auth.currentUser?.uid === currentUser.id) {
          updateDoc(doc(db, 'notifications', n.id), { read: true }).catch(() => {});
        }
      });
      return prev.map((n) => ({ ...n, read: true }));
    });
  };

  const handleNotificationAction = (targetView?: 'downloads' | 'orders' | 'catalog') => {
    if (targetView === 'downloads' || targetView === 'orders') {
      setIsPortalOpen(true);
    }
  };

  // Backup Export & Settings Reset
  const handleExportBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      storeName: branding.storeName,
      branding,
      products,
      coupons,
      orders: adminAggregatedOrders,
      tickets: adminAggregatedTickets,
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
    handleUpdateBranding({
      ...INITIAL_BRANDING,
      adminPassword: branding.adminPassword,
    });
  };

  // Categories extraction
  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filtering Products
  const filteredProducts = products.filter((p) => {
    const matchesType = activeFilter === 'all' || p.type === activeFilter;
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchesType && matchesCategory && matchesSearch;
  });

  const cartTotalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans text-right">
      {/* Toast Notification */}
      {addedNotice && (
        <div className="fixed top-20 right-6 z-50 bg-zinc-950 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 border border-zinc-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{addedNotice}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        branding={branding}
        cartCount={cartTotalItems}
        currentUser={currentUser}
        onOpenGoogleAuth={() => setIsGoogleAuthOpen(true)}
        onSignOut={handleGoogleSignOut}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={handleAdminToggle}
        onOpenPortal={() => setIsPortalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        notifications={notifications}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        isAdminView={isAdminView}
        onToggleAdminView={handleAdminToggle}
      />

      {/* Maintenance Banner if enabled in Admin Settings */}
      {!isAdminView && branding.maintenanceMode && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-950 px-4 py-3 text-xs font-bold flex items-center justify-center gap-2 text-center">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{branding.maintenanceMessage || 'المتجر في وضع الصيانة المؤقت، نعود إليكم قريباً.'}</span>
        </div>
      )}

      {/* CONDITIONAL RENDER: ADMIN DASHBOARD vs STOREFRONT */}
      {isAdminView ? (
        <AdminDashboard
          orders={adminAggregatedOrders}
          products={products}
          customers={adminAggregatedCustomers}
          branding={branding}
          supportTickets={adminAggregatedTickets}
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
          isCloudAdmin={isCloudAdmin}
          onConnectCloudAdmin={() => setIsGoogleAuthOpen(true)}
          onCloseAdmin={() => setIsAdminView(false)}
          onLockAdmin={() => {
            setIsAdminView(false);
            setIsAdminAuthenticated(false);
          }}
        />
      ) : (
        <main className="flex-1 bg-white">
          {/* Section 1: Pure White Hero */}
          <HeroSection
            branding={branding}
            onExploreClick={() => {
              document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onFilterDigital={() => {
              setActiveFilter('digital');
              document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onFilterPhysical={() => {
              setActiveFilter('physical');
              document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            totalProductsCount={products.length}
          />

          {/* Section 1.5: Trending & Highest Rated Products Moving Ticker */}
          {branding.showTrendingTicker !== false && (
            <TrendingTicker
              products={products}
              branding={branding}
              onSelectProduct={(p) => setSelectedProduct(p)}
            />
          )}

          {/* Section 2: Products Catalog */}
          <section id="catalog-section" className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
                  <span>كتالوج منتجات {branding.storeName}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{filteredProducts.length} منتجات</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-zinc-950">
                  {activeFilter === 'digital'
                    ? 'الطلبات الرقمية'
                    : activeFilter === 'physical'
                    ? 'المنتجات العادية'
                    : branding.catalogTitle || 'كافة المعروضات المتاحة للطلب'}
                </h2>
              </div>

              {categories.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                        activeCategory === cat
                          ? 'bg-zinc-950 text-white shadow-2xs font-semibold'
                          : 'bg-white text-zinc-600 hover:text-zinc-950 border border-zinc-200'
                      }`}
                    >
                      {cat === 'all' ? 'جميع التصنيفات' : cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {products.length === 0 ? (
              <div className="py-16 px-6 text-center rounded-3xl bg-zinc-50/70 border-2 border-dashed border-zinc-200 space-y-4 max-w-2xl mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-zinc-950 text-white flex items-center justify-center mx-auto shadow-sm">
                  <Package className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-zinc-950">
                    الكتالوج فارغ وجاهز لإضافة منتجاتك الحقيقية
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                    بصفتك مسؤول متجر {branding.storeName}، يمكنك الدخول إلى لوحة التحكم لإضافة أول منتج وتحديد السعر بالجنيه المصري وإدارة تسليم طلباتك.
                  </p>
                </div>
                <button
                  onClick={handleAdminToggle}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm inline-flex items-center gap-2 cursor-pointer ${theme.primary}`}
                >
                  <Plus className="w-4 h-4" />
                  <span>دخول لوحة التحكم وإضافة منتجات</span>
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <p className="text-zinc-500 text-sm">لا توجد منتجات تطابق الفلاتر المحددة.</p>
                <button
                  onClick={() => {
                    setActiveFilter('all');
                    setActiveCategory('all');
                    setSearchQuery('');
                  }}
                  className="text-xs font-bold text-zinc-950 underline cursor-pointer"
                >
                  عرض كافة المنتجات
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredProducts.map((product) => {
                  const isAdded = cart.some((item) => item.product.id === product.id);
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      branding={branding}
                      onAddToCart={(p) => handleAddToCart(p, 1)}
                      onViewDetails={(p) => setSelectedProduct(p)}
                      isAdded={isAdded}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 3: Value Proposition (Editable from Admin Storefront Editor) */}
          {branding.showValueSection !== false && (
            <section className="py-12 bg-zinc-50/60 border-y border-zinc-200/80">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                  <div className="space-y-2.5 p-6 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold text-lg">
                      📱
                    </div>
                    <h3 className="font-bold text-base text-zinc-950">
                      {branding.valueCard1Title || 'طرق دفع مصرية فورية'}
                    </h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {branding.valueCard1Desc ||
                        'ادفع عبر فودافون كاش، إنستاباي InstaPay، فوري، كروت ميزة، البطاقات البنكية أو الدفع عند الاستلام للمنتجات العادية.'}
                    </p>
                  </div>

                  <div className="space-y-2.5 p-6 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold">
                      <DownloadCloud className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-zinc-950">
                      {branding.valueCard2Title || 'تسليم موثق للطلبات الرقمية وشحن للمنتجات العادية'}
                    </h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {branding.valueCard2Desc ||
                        'الطلبات الرقمية تصلك إلكترونياً مباشرة في الإشعارات وقسم «طلباتي» فور تأكيد الدفع، والمنتجات العادية تُشحن لعنوانك مع تتبع مباشر.'}
                    </p>
                  </div>

                  <div className="space-y-2.5 p-6 rounded-2xl bg-white border border-zinc-200 shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-zinc-950">
                      {branding.valueCard3Title || 'فواتير قابلة للتنزيل كصورة PNG'}
                    </h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {branding.valueCard3Desc ||
                        'احصل على فاتورة معتمدة لطلبك خالية تماماً من الضريبة المضافة (0%) مع إمكانية تنزيلها فوراً كصورة عالية الدقة.'}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      )}

      {/* Password Protected Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
        branding={branding}
      />

      {/* Product Detail Modal with Customer Reviews */}
      <ProductModal
        product={selectedProduct}
        branding={branding}
        currentUser={currentUser}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        onAddReview={handleAddReview}
      />

      {/* Cart Slide-over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={() => {
          if (branding.maintenanceMode) return;
          if (branding.requireAuthForCheckout && !currentUser) {
            setIsGoogleAuthOpen(true);
            return;
          }
          setIsCheckoutOpen(true);
        }}
        branding={branding}
        appliedPromo={appliedPromo}
        onApplyPromo={handleApplyPromo}
        discountAmount={discountAmount}
      />

      {/* Secure Egyptian Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        branding={branding}
        discountAmount={discountAmount}
        appliedPromo={appliedPromo}
        currentUser={currentUser}
        onOpenGoogleAuth={() => setIsGoogleAuthOpen(true)}
        onOrderPlaced={handleOrderPlaced}
        onSaveUserProfile={handleSaveUserProfile}
        onClearCart={handleClearCart}
        onOpenInvoice={(order) => setSelectedInvoiceOrder(order)}
        onOpenPortal={() => {
          setIsCheckoutOpen(false);
          setIsPortalOpen(true);
        }}
      />

      {/* Real Google Sign-In Authentication Modal */}
      <GoogleAuthModal
        isOpen={isGoogleAuthOpen}
        onClose={() => setIsGoogleAuthOpen(false)}
        currentUser={currentUser}
        onSuccess={handleGoogleLoginSuccess}
        onSignOut={handleGoogleSignOut}
      />

      {/* Customer Portal Modal (Scoped Strictly to Active Account's Orders) */}
      <CustomerPortalModal
        isOpen={isPortalOpen}
        onClose={() => setIsPortalOpen(false)}
        orders={orders}
        branding={branding}
        onOpenInvoice={(order) => setSelectedInvoiceOrder(order)}
      />

      {/* Downloadable PNG Order Invoice Modal */}
      <InvoiceModal
        isOpen={!!selectedInvoiceOrder}
        order={selectedInvoiceOrder}
        branding={branding}
        onClose={() => setSelectedInvoiceOrder(null)}
      />

      {/* Smart Notifications Center (Scoped Strictly to Active Account) */}
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onActionClick={handleNotificationAction}
        branding={branding}
      />

      {/* Live Support Chat (Scoped Strictly to Active Account) */}
      <LiveSupportChat
        branding={branding}
        orders={orders}
        supportTickets={supportTickets}
        currentUser={currentUser}
        onNewCustomerMessage={handleNewCustomerMessage}
      />

      {/* Legal & Store Policies Modal */}
      <PolicyModal
        isOpen={!!activePolicy}
        activePolicy={activePolicy || 'privacy'}
        onSelectPolicy={(policy) => setActivePolicy(policy)}
        onClose={() => setActivePolicy(null)}
        branding={branding}
      />

      {/* Footer */}
      {!isAdminView && (
        <Footer
          branding={branding}
          onOpenPortal={() => setIsPortalOpen(true)}
          onFilterDigital={() => {
            setActiveFilter('digital');
            document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          onFilterPhysical={() => {
            setActiveFilter('physical');
            document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenPolicy={(policy) => setActivePolicy(policy)}
        />
      )}
    </div>
  );
}
