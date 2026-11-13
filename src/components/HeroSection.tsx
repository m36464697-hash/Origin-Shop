import React from 'react';
import { DownloadCloud, ArrowLeft, PackageCheck } from 'lucide-react';
import { StoreBranding } from '../types/store';
import { BrandWordmark } from './BrandWordmark';

interface HeroSectionProps {
  branding: StoreBranding;
  onExploreClick: () => void;
  onFilterDigital: () => void;
  onFilterPhysical: () => void;
  totalProductsCount: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  branding,
  onExploreClick,
  onFilterDigital,
  onFilterPhysical,
  totalProductsCount,
}) => {
  return (
    <section className="relative overflow-hidden py-10 sm:py-14 md:py-20 bg-white border-b border-zinc-200/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 text-center flex flex-col items-center">
          {/* Brand Wordmark Kicker matching the Logo Font */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-600">
            <BrandWordmark storeName={branding.storeName} size="sm" />
            <span aria-hidden="true" className="text-zinc-300">·</span>
            <span>{branding.heroBadgeText || branding.storeTagline}</span>
          </div>

          {/* Display Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-950 leading-[1.2] text-balance max-w-3xl">
            {branding.heroHeadline || 'طلبات رقمية ومنتجات عادية موثقة بدفع محلي آمن'}
          </h1>

          {/* Short Branded Description */}
          <p className="text-sm sm:text-base md:text-lg text-zinc-600 leading-relaxed max-w-2xl">
            {branding.heroDescription ||
              'احصل على طلباتك الرقمية إلكترونياً مباشرة في حسابك بعد تأكيد الدفع دون مصاريف شحن، أو اطلب المنتجات العادية لتصلك لباب منزلك في جميع محافظات مصر.'}
          </p>

          {/* Functional Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              onClick={onExploreClick}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-zinc-950 hover:bg-zinc-800 text-white shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>{branding.heroPrimaryCta || 'تصفح كافة المنتجات'}</span>
              <ArrowLeft className="w-4 h-4 rtl:rotate-0 rotate-180" />
            </button>

            <button
              onClick={onFilterDigital}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-200 transition-colors shadow-2xs cursor-pointer"
            >
              <DownloadCloud className="w-4 h-4 text-zinc-900" />
              <span>{branding.heroDigitalCta || 'الطلبات الرقمية'}</span>
            </button>

            <button
              onClick={onFilterPhysical}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border border-zinc-200 transition-colors shadow-2xs cursor-pointer"
            >
              <PackageCheck className="w-4 h-4 text-zinc-900" />
              <span>{branding.heroPhysicalCta || 'المنتجات العادية'}</span>
            </button>
          </div>

          {/* Clean White Trust Proof Strip */}
          {branding.showHeroStats !== false && (
            <div className="w-full max-w-2xl pt-8 mt-2 border-t border-zinc-200 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-2xl bg-zinc-50/70 border border-zinc-200/70">
                <p className="text-lg md:text-xl font-black text-zinc-950 tabular-nums">
                  {totalProductsCount}
                </p>
                <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5">منتجات متاحة</p>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50/70 border border-zinc-200/70">
                <p className="text-lg md:text-xl font-black text-zinc-950 tabular-nums">0%</p>
                <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5">ضريبة قيمة مضافة</p>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50/70 border border-zinc-200/70">
                <p className="text-lg md:text-xl font-black text-zinc-950 tabular-nums">24 / 7</p>
                <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5">دعم ومراجعة فورية</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
