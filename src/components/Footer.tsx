import React from 'react';
import { ShieldCheck, DownloadCloud, Package, Lock } from 'lucide-react';
import { StoreBranding } from '../types/store';
import { BrandWordmark } from './BrandWordmark';
import { PolicyType } from './PolicyModal';

interface FooterProps {
  branding: StoreBranding;
  onOpenPortal: () => void;
  onFilterDigital: () => void;
  onFilterPhysical: () => void;
  onOpenPolicy: (policy: PolicyType) => void;
}

export const Footer: React.FC<FooterProps> = ({
  branding,
  onOpenPortal,
  onFilterDigital,
  onFilterPhysical,
  onOpenPolicy,
}) => {
  return (
    <footer className="bg-white border-t border-zinc-200 text-right transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* Brand Info with Enlarged Logo & Matching Font */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex flex-col items-start gap-2.5">
              <div className="h-12 px-3 py-1.5 rounded-xl bg-black flex items-center justify-center shrink-0 border border-zinc-900 shadow-xs">
                <img
                  src={branding.logoUrl || './origin-logo.png'}
                  alt="Origin Shop Logo"
                  className="h-full w-auto max-w-[130px] object-contain"
                />
              </div>
              <BrandWordmark storeName={branding.storeName} size="md" />
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {branding.storeTagline || 'متجر الطلبات الرقمية والمنتجات العادية المعتمد في مصر'}
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-emerald-600 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>متجر رسمي معتمد وموثق</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-zinc-900 uppercase tracking-wider">
              أقسام المتجر
            </h4>
            <ul className="space-y-2 text-xs text-zinc-600">
              <li>
                <button type="button" onClick={onFilterDigital} className="hover:text-zinc-950 transition-colors cursor-pointer">
                  الطلبات الرقمية (تسليم إلكتروني)
                </button>
              </li>
              <li>
                <button type="button" onClick={onFilterPhysical} className="hover:text-zinc-950 transition-colors cursor-pointer">
                  المنتجات العادية (شحن وتوصيل)
                </button>
              </li>
              <li>
                <button type="button" onClick={onOpenPortal} className="hover:text-zinc-950 transition-colors cursor-pointer">
                  طلباتي ومشترياتي
                </button>
              </li>
            </ul>
          </div>

          {/* Guarantees & Terms */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-zinc-900 uppercase tracking-wider">
              الضمان والتسليم
            </h4>
            <ul className="space-y-2 text-xs text-zinc-600">
              <li className="flex items-center gap-1.5">
                <DownloadCloud className="w-3.5 h-3.5 text-zinc-800 shrink-0" />
                <span>الطلبات الرقمية تُسلّم لحسابك بعد تأكيد الدفع</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-zinc-800 shrink-0" />
                <span>شحن المنتجات العادية لجميع محافظات مصر</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>دفع محلي آمن ومحمي 100%</span>
              </li>
            </ul>
          </div>

          {/* Supported Egyptian Payment Logos & Contact Info */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-zinc-900 uppercase tracking-wider">
              طرق الدفع والتواصل
            </h4>
            <div className="flex flex-wrap gap-2 text-xs text-zinc-700">
              <span className="px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200 font-semibold text-rose-600">فودافون كاش</span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200 font-semibold text-purple-600">إنستاباي InstaPay</span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200 font-semibold text-amber-700">فوري Fawry</span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200 font-semibold text-emerald-700">ميزة Meeza</span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200 font-semibold">Visa / MasterCard</span>
            </div>
            {(branding.contactPhone || branding.contactEmail) && (
              <div className="pt-1 space-y-0.5 text-[11px] text-zinc-500 font-mono">
                {branding.contactPhone && <p>هاتف / واتساب: {branding.contactPhone}</p>}
                {branding.contactEmail && <p>{branding.contactEmail}</p>}
                {branding.workingHours && <p className="font-sans text-[10px] text-zinc-400">{branding.workingHours}</p>}
              </div>
            )}
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <div className="flex items-center gap-1.5">
            <span>© 2026</span>
            <BrandWordmark storeName={branding.storeName} size="sm" />
            <span>· جميع الحقوق محفوظة.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px]">
            <button
              type="button"
              onClick={() => onOpenPolicy('privacy')}
              className="hover:text-zinc-950 hover:underline underline-offset-4 transition-colors font-medium cursor-pointer"
            >
              سياسة الخصوصية
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onOpenPolicy('terms')}
              className="hover:text-zinc-950 hover:underline underline-offset-4 transition-colors font-medium cursor-pointer"
            >
              شروط الاستخدام والتراخيص
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => onOpenPolicy('refund')}
              className="hover:text-zinc-950 hover:underline underline-offset-4 transition-colors font-medium cursor-pointer"
            >
              ضمان الجودة والاسترجاع
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
