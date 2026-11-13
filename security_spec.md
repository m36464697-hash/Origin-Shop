# Origin Shop Firestore Security Specification

## 1. Data Invariants
1. **Strict Account Isolation**: Every user's profile, cart, orders, notifications, and support tickets are bound strictly to their authenticated `uid` (`request.auth.uid`). Account A can never read, list, create, or modify Account B's orders, cart, notifications, or tickets.
2. **Checkout Integrity**: Customer-created orders MUST initialize with `paymentStatus == 'pending'`, `orderStatus == 'pending'`, `tax == 0`, and `userId == request.auth.uid`. Customers cannot self-confirm payment or grant themselves digital deliveries.
3. **Admin Exclusivity**: Product catalog writes, coupon creation/deletion, payment confirmation, digital fulfillment, and store configuration updates require `isAdmin()` (explicit `/admins/{uid}` membership or verified runtime admin email `m36464697@gmail.com` with `email_verified == true`).
4. **No Password Exposure**: Public `/settings/branding` never stores `adminPassword`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Cross-Account Order Read**: User B attempts `get(/orders/ORDER_A)` where `userId == UID_A`.
2. **Cross-Account Order List Scraping**: User B queries `/orders` without `where('userId', '==', UID_B)`.
3. **Order Forgery (Self-Paid)**: User A attempts `create /orders/ORD1` with `paymentStatus: 'paid'` or `orderStatus: 'completed'`.
4. **Order Impersonation**: User A creates `/orders/ORD1` setting `userId: UID_B`.
5. **Shadow Field Injection on User Profile**: User A writes `/users/UID_A` with extra `isAdmin: true` or `role: 'admin'`.
6. **Admin Spoofing (Unverified Email)**: Attacker sets `email: 'm36464697@gmail.com'` with `email_verified: false`.
7. **PII Leak in User Collection**: User B attempts `get(/users/UID_A)` or `list(/users)`.
8. **Product Price Tampering by Customer**: User A updates `/products/PROD1` setting `price: 1` (affectedKeys != reviews-only).
9. **Coupon Code Tampering by Customer**: User A creates `/coupons/FREE100` with `discountValue: 100`.
10. **Cross-Account Notification Hijack**: User A reads or marks `read: true` on `/notifications/NOTIF_B` belonging to `UID_B`.
11. **Oversized ID Poisoning**: Attacker writes `/orders/${'a'.repeat(500)}`.
12. **Ticket Impersonation**: User A creates `/tickets/TCK1` with `userId: UID_B` or marks own ticket `status: 'replied'`.
