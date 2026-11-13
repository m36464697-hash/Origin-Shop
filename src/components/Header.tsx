import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Bell, 
  SlidersHorizontal, 
  Search, 
  DownloadCloud, 
  Package, 
  X, 
  LogOut, 
  ChevronDown 
} from 'lucide-react';
import { StoreBranding, NotificationItem, GoogleUserProfile } from '../types/store';
import { BrandWordmark } from './BrandWordmark';

interface HeaderProps {
  branding: StoreBranding;
  cartCount: number;
  currentUser: GoogleUserProfile | null;
  onOpenGoogleAuth: () => void;
  onSignOut: () => void;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  onOpenPortal: () => void;
  onOpenNotifications: () => void;
  notifications: NotificationItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: 'all' | 'digital' | 'physical';
  onFilterChange: (filter: 'all' | 'digital' | 'physical') => void;
  isAdminView: boolean;
  onToggleAdminView: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  branding,
  cartCount,
  currentUser,
  onOpenGoogleAuth,
  onSignOut,
  onOpenCart,
  onOpenPortal,
  onOpenNotifications,
  notifications,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  isAdminView,
  onToggleAdminView,
}) => {
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/90 transition-colors font-sans">
      
      {/* Optional Top Announcement Bar */}
      {branding.showAnnouncement && branding.announcementText && (
        <div className="bg-zinc-950 text-zinc-100 text-[11px] sm:text-xs py-2 px-4 text-center font-medium border-b border-zinc-900">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <span className="line-clamp-1">{branding.announcementText}</span>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-2 md:gap-6">
        
        {/* Zone 1: Enlarged Official Logo & Matching Geometric Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => {
              if (isAdminView) onToggleAdminView();
              onFilterChange('all');
            }} 
            className="flex items-center gap-3 text-right group focus:outline-none cursor-pointer"
          >
            {/* Large crisp Origin Shop Logo container */}
            <div className="h-11 sm:h-12 px-3 py-1.5 rounded-xl bg-black flex items-center justify-center border border-zinc-900 shadow-sm group-hover:scale-[1.03] transition-transform shrink-0">
              <img
                src={branding.logoUrl || './origin-logo.png'}
                alt="Origin Shop Logo"
                className="h-full w-auto max-w-[115px] sm:max-w-[135px] object-contain"
              />
            </div>

            <div className="hidden xs:flex sm:flex flex-col text-right">
              <BrandWordmark storeName={branding.storeName} size="md" />
              <span className="text-[10px] text-zinc-400 font-medium mt-0.5 hidden md:block">
                {branding.storeTagline || 'المتجر المعتمد للطلبات الرقمية والمنتجات العادية'}
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links & Segmented Filter Control */}
        <nav className="hidden lg:flex items-center gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200">
          <button
            onClick={() => {
              if (isAdminView) onToggleAdminView();
              onFilterChange('all');
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              !isAdminView && activeFilter === 'all'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            كافة المنتجات
          </button>

          <button
            onClick={() => {
              if (isAdminView) onToggleAdminView();
              onFilterChange('digital');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              !isAdminView && activeFilter === 'digital'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <DownloadCloud className="w-3.5 h-3.5 text-zinc-900" />
            <span>الطلبات الرقمية</span>
          </button>

          <button
            onClick={() => {
              if (isAdminView) onToggleAdminView();
              onFilterChange('physical');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              !isAdminView && activeFilter === 'physical'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-zinc-900" />
            <span>المنتجات العادية</span>
          </button>

          <button
            onClick={onOpenPortal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-zinc-900" />
            <span>طلباتي</span>
          </button>
        </nav>

        {/* Zone 3: Actions (Search, Notifications, Cart, Google Auth, Admin) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Search Toggle */}
          <div className="relative">
            {showSearchInput ? (
              <div className="flex items-center bg-white border border-zinc-300 rounded-xl px-2.5 py-1.5 shadow-xs w-36 sm:w-52 animate-in fade-in zoom-in-95">
                <Search className="w-4 h-4 text-zinc-400 ml-1.5 shrink-0" />
                <input
                  type="text"
                  placeholder="ابحث..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  autoFocus
                  className="w-full bg-transparent text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
                <button
                  onClick={() => {
                    setShowSearchInput(false);
                    onSearchChange('');
                  }}
                  className="text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearchInput(true)}
                title="بحث"
                className="p-2 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Smart Notification Bell */}
          <button
            onClick={onOpenNotifications}
            title="الإشعارات والتحديثات"
            className="relative p-2 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-zinc-950 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Cart Trigger */}
          <button
            onClick={onOpenCart}
            title="سلة المشتريات"
            className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-zinc-800 hover:bg-zinc-100 rounded-xl transition-all border border-zinc-200 shadow-2xs cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-900" />
            <span className="hidden sm:inline text-xs font-semibold">السلة</span>
            {cartCount > 0 && (
              <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-zinc-950 text-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* Google Sign-In Profile Widget */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-zinc-200 bg-white hover:border-zinc-400 transition-colors cursor-pointer"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="hidden md:inline text-xs font-bold text-zinc-900 max-w-[90px] truncate">
                  {currentUser.givenName || currentUser.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-white border border-zinc-200 shadow-xl p-2 z-50 text-right animate-in fade-in zoom-in-95">
                  <div className="p-2 border-b border-zinc-100 mb-1">
                    <p className="font-bold text-xs text-zinc-900 truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-zinc-400 font-mono truncate">{currentUser.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenPortal();
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-zinc-900" />
                    <span>طلباتي ومشترياتي</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenGoogleAuth();
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-zinc-900" />
                    <span>إدارة / تبديل الحساب</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenGoogleAuth}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors cursor-pointer"
              title="تسجيل الدخول بجوجل لحفظ بياناتك ومشترياتك"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="hidden sm:inline">دخول</span>
            </button>
          )}

          {/* Admin Dashboard Switcher CTA */}
          <button
            onClick={onToggleAdminView}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              isAdminView
                ? 'bg-zinc-950 text-white border-transparent shadow-xs'
                : 'bg-white text-zinc-800 border-zinc-200 hover:border-zinc-400'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isAdminView ? 'العودة للمتجر' : 'لوحة التحكم'}
            </span>
          </button>

        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center justify-around px-3 py-2 bg-zinc-50 border-t border-zinc-200 text-xs">
        <button
          onClick={() => {
            if (isAdminView) onToggleAdminView();
            onFilterChange('all');
          }}
          className={`px-3 py-1 rounded-lg font-medium cursor-pointer ${
            !isAdminView && activeFilter === 'all'
              ? 'bg-white text-zinc-950 shadow-2xs font-bold border border-zinc-200/70'
              : 'text-zinc-600'
          }`}
        >
          الكل
        </button>
        <button
          onClick={() => {
            if (isAdminView) onToggleAdminView();
            onFilterChange('digital');
          }}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium cursor-pointer ${
            !isAdminView && activeFilter === 'digital'
              ? 'bg-white text-zinc-950 shadow-2xs font-bold border border-zinc-200/70'
              : 'text-zinc-600'
          }`}
        >
          <DownloadCloud className="w-3.5 h-3.5 text-zinc-900" />
          <span>طلبات رقمية</span>
        </button>
        <button
          onClick={() => {
            if (isAdminView) onToggleAdminView();
            onFilterChange('physical');
          }}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium cursor-pointer ${
            !isAdminView && activeFilter === 'physical'
              ? 'bg-white text-zinc-950 shadow-2xs font-bold border border-zinc-200/70'
              : 'text-zinc-600'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-zinc-900" />
          <span>منتجات عادية</span>
        </button>
        <button
          onClick={onOpenPortal}
          className="px-3 py-1 text-zinc-700 hover:text-zinc-950 font-semibold cursor-pointer"
        >
          طلباتي
        </button>
      </div>
    </header>
  );
};
