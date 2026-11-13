import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle, Loader2, RefreshCw, LogOut } from 'lucide-react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { GoogleUserProfile } from '../types/store';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: GoogleUserProfile | null;
  onSuccess: (user: GoogleUserProfile) => void;
  onSignOut: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
  onSignOut,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGooglePopupSignIn = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      const profile: GoogleUserProfile = {
        id: fbUser.uid,
        name: fbUser.displayName || 'مستخدم Google',
        email: fbUser.email || '',
        avatar:
          fbUser.photoURL ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
            fbUser.displayName || fbUser.email || 'Origin'
          )}&backgroundColor=09090b`,
        givenName: fbUser.displayName ? fbUser.displayName.split(' ')[0] : 'المستخدم',
      };

      onSuccess(profile);
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setErrorMsg('تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg('حظر المتصفح النافذة المنبثقة. يرجى السماح بالنوافذ المنبثقة ثم المحاولة مرة أخرى.');
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMsg('هذا النطاق غير مضاف في إعدادات المصادقة الخاصة بالمشروع.');
      } else {
        setErrorMsg('حدث خطأ أثناء الاتصال بحساب Google. يرجى المحاولة مجدداً.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await signOut(auth);
      onSignOut();
      onClose();
    } catch (err) {
      console.error('Sign out error:', err);
      setErrorMsg('تعذر تسجيل الخروج، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 text-right font-sans">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-200 space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Google Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-zinc-200 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-zinc-950">
            {currentUser ? 'إدارة حسابك في Origin Shop' : 'تسجيل الدخول بحساب Google'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
            لكل حساب مسجل مساحة بيانات مستقلة تماماً لحفظ طلباتك، سلة المشتريات، إشعاراتك، وبيانات التوصيل بأمان تام.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {currentUser ? (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center gap-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-11 h-11 rounded-full object-cover border border-zinc-200"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-zinc-950 truncate">{currentUser.name}</p>
                <p className="text-[11px] text-zinc-500 font-mono truncate">{currentUser.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  ✓ متصل — بيانات هذا الحساب معزولة ومحمية
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGooglePopupSignIn}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>التبديل إلى حساب Google آخر</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج من هذا الحساب</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGooglePopupSignIn}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl border border-zinc-300 bg-white hover:bg-zinc-50 disabled:opacity-50 text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xs transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-700" />
                  <span>جاري فتح نافذة Google الآمنة...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>المتابعة بحساب Google</span>
                </>
              )}
            </button>

            <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-600 leading-relaxed space-y-1">
              <p className="font-bold text-zinc-900">مزايا الحساب المربوط:</p>
              <p>• حفظ طلباتك وإشعارات المنتجات الرقمية لكل حساب على حدة.</p>
              <p>• حفظ السلة وبيانات الشحن تلقائياً عند العودة من أي جهاز.</p>
            </div>
          </div>
        )}

        <div className="pt-2 text-[10px] text-center text-zinc-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>مصادقة حقيقية مشفرة عبر Firebase Authentication</span>
        </div>
      </div>
    </div>
  );
};
