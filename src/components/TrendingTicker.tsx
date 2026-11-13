import React from 'react';
import { Star, Flame, ArrowLeft, Sparkles, TrendingUp } from 'lucide-react';
import { Product, StoreBranding } from '../types/store';
import { formatPrice } from '../utils/formatters';

interface TrendingTickerProps {
  products: Product[];
  branding: StoreBranding;
  onSelectProduct: (product: Product) => void;
}

export const TrendingTicker: React.FC<TrendingTickerProps> = ({
  products,
  branding,
  onSelectProduct,
}) => {
  // Sort products by highest rating and sales count
  const trendingProducts = [...products]
    .sort((a, b) => ((b.rating || 0) * 10 + (b.salesCount || 0)) - ((a.rating || 0) * 10 + (a.salesCount || 0)))
    .slice(0, 10);

  if (trendingProducts.length === 0) {
    return (
      <div className="w-full bg-zinc-900 text-white py-3 px-4 border-y border-zinc-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold tracking-wide">ORIGIN SHOP TRENDING:</span>
            <span className="text-zinc-300">
              شريط المنتجات الأكثر طلباً والأعلى تقييماً — أضف أولى منتجاتك لتظهر تلقائياً هنا
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">24/7 معتمد · دفع محلي آمن</span>
        </div>
      </div>
    );
  }

  // Duplicate items for continuous seamless ticker flow
  const tickerItems = [...trendingProducts, ...trendingProducts, ...trendingProducts];

  return (
    <div className="w-full bg-zinc-900 text-white border-y border-zinc-800 overflow-hidden py-2.5 relative select-none">
      
      {/* Visual Header Tag on the right in RTL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded bg-white text-zinc-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>الأكثر طلباً والأعلى تقييماً</span>
          </div>
          <span className="text-zinc-400 text-[11px] hidden sm:inline">
            أبرز المنتجات المختارة في Origin Shop بناءً على مبيعات وتقييمات العملاء
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>تحديث مباشر</span>
        </div>
      </div>

      {/* Ticker Track with Pause on Hover */}
      <div className="relative w-full overflow-hidden group">
        
        {/* Soft edge gradient fades */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-zinc-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-zinc-900 to-transparent z-10 pointer-events-none" />

        <div className="flex items-center gap-4 w-max animate-ticker group-hover:[animation-play-state:paused] py-1">
          {tickerItems.map((prod, index) => (
            <button
              key={`${prod.id}-${index}`}
              onClick={() => onSelectProduct(prod)}
              className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/90 border border-zinc-700/70 text-right transition-all hover:scale-[1.02] cursor-pointer shrink-0 max-w-[320px]"
            >
              <img
                src={prod.image}
                alt={prod.name}
                className="w-9 h-9 rounded-lg object-cover bg-zinc-950 shrink-0 border border-zinc-700"
              />
              <div className="min-w-0 pr-1 text-right">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-white truncate max-w-[140px]">
                    {prod.name}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {prod.type === 'digital' ? 'طلب رقمي' : 'منتج عادي'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {formatPrice(prod.price, branding.currencySymbol)}
                  </span>
                  <span className="text-zinc-600">·</span>
                  <div className="flex items-center gap-0.5 text-[10px] text-amber-400">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span>{prod.rating || 5}</span>
                  </div>
                  {prod.salesCount > 0 && (
                    <>
                      <span className="text-zinc-600">·</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {prod.salesCount}+ مبيعات
                      </span>
                    </>
                  )}
                </div>
              </div>
              <ArrowLeft className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
