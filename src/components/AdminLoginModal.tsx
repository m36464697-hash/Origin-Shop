import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { StoreBranding } from '../types/store';
import { THEME_PALETTES } from '../utils/theme';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  branding: StoreBranding;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  branding,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const theme = THEME_PALETTES[branding.primaryTheme] || THEME_PALETTES.slate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === branding.adminPassword) {
      setError(false);
      setPassword('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 text-right">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-200 space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-zinc-950 text-white flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-zinc-950">تسجيل الدخول إلى لوحة التحكم</h3>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
            لوحة إدارة {branding.storeName} محمية برمز مرور سري لضمان عدم وصول أي شخص غير مصرح له
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              كلمة مرور المسؤول (Admin Password)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                placeholder="أدخل كلمة المرور..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-xs text-zinc-950 bg-zinc-50 focus:outline-none transition-all ${
                  error
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-zinc-300 focus:ring-2 focus:ring-zinc-900'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-[11px] text-rose-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${theme.primary}`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>الدخول إلى لوحة التحكم</span>
          </button>
        </form>
      </div>
    </div>
  );
};
