/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, OperationType, handleFirestoreError } from './firebase';

import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { CustomerPortalModal } from './components/CustomerPortalModal';
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
  CartItem,
  StoreBranding,
  NotificationItem,
  SupportTicket,
  GoogleUserProfile,
  Coupon,
  ProductReview
} from './types/store';
import {
  INITIAL_BRANDING,
  INITIAL_PRODUCTS,
  INITIAL_COUPONS
} from './data/initialData';
import { DownloadCloud, Package, CheckCircle2, FileText, AlertTriangle } from 'lucide-react';

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

  const [appliedPromo, setAppliedPromo] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

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

      {/* Main Header (Pure Customer Storefront - No Admin Controls) */}
      <Header
        branding={branding}
        cartCount={cartTotalItems}
        currentUser={currentUser}
        onOpenGoogleAuth={() => setIsGoogleAuthOpen(true)}
        onSignOut={handleGoogleSignOut}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenPortal={() => setIsPortalOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        notifications={notifications}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Maintenance Banner if enabled in Admin Settings */}
      {branding.maintenanceMode && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-950 px-4 py-3 text-xs font-bold flex items-center justify-center gap-2 text-center">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{branding.maintenanceMessage || 'المتجر في وضع الصيانة المؤقت، نعود إليكم قريباً.'}</span>
        </div>
      )}

      {/* STOREFRONT MAIN */}
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
                    لا توجد معروضات متاحة حالياً
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                    يعمل فريق {branding.storeName} على تجهيز أحدث الطلبات الرقمية والمنتجات العادية الآن. ترقبوا توفرها في الكتالوج خلال لحظات!
                  </p>
                </div>
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
    </div>
  );
}
