import React from 'react';
import { DownloadCloud, Package, Star, Eye, ShoppingBag, Check } from 'lucide-react';
import { Product, StoreBranding } from '../types/store';
import { formatPrice } from '../utils/formatters';
import { THEME_PALETTES } from '../utils/theme';

interface ProductCardProps {
  product: Product;
  branding: StoreBranding;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  isAdded?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  branding,
  onAddToCart,
  onViewDetails,
  isAdded = false,
}) => {
  const theme = THEME_PALETTES[branding.primaryTheme] || THEME_PALETTES.slate;
  const isDigital = product.type === 'digital';

  return (
    <article className="group relative flex flex-col bg-white rounded-2xl border border-zinc-200 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg text-right">
      {/* Product Image Container */}
      <div
        onClick={() => onViewDetails(product)}
        className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 cursor-pointer"
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        <div className="absolute top-3 right-3 left-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-[11px] font-medium">
            {isDigital ? (
              <>
                <DownloadCloud className="w-3.5 h-3.5 text-zinc-200" />
                <span>طلب رقمي</span>
              </>
            ) : (
              <>
                <Package className="w-3.5 h-3.5 text-zinc-200" />
                <span>منتج عادي · شحن</span>
              </>
            )}
          </div>

          {!product.inStock ? (
            <div className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-bold">
              غير متوفر
            </div>
          ) : product.compareAtPrice && product.compareAtPrice > product.price ? (
            <div className="px-2 py-0.5 rounded-md bg-zinc-950 text-white text-[10px] font-bold">
              وفر {product.compareAtPrice - product.price} {branding.currencySymbol}
            </div>
          ) : null}
        </div>

        {/* Quick View Hover Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 text-zinc-950 text-xs font-semibold shadow-sm backdrop-blur-xs">
            <Eye className="w-3.5 h-3.5" />
            <span>عرض المواصفات</span>
          </span>
        </div>
      </div>

      {/* Product Information Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{product.category}</span>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-zinc-800 tabular-nums">{product.rating}</span>
              <span className="text-[11px]">({product.reviewsCount})</span>
            </div>
          </div>

          <h3
            onClick={() => onViewDetails(product)}
            className="text-base font-bold text-zinc-950 line-clamp-2 leading-snug cursor-pointer hover:text-zinc-600 transition-colors"
          >
            {product.name}
          </h3>

          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-zinc-950 tabular-nums">
                {formatPrice(product.price, branding.currencySymbol)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-xs text-zinc-400 line-through tabular-nums">
                  {formatPrice(product.compareAtPrice, branding.currencySymbol)}
                </span>
              )}
            </div>
            <span className="text-[10px] text-zinc-400">
              {isDigital ? 'طلب رقمي · تسليم إلكتروني لحسابك' : 'منتج عادي · شحن وتوصيل لجميع المحافظات'}
            </span>
          </div>

          <button
            disabled={!product.inStock}
            onClick={() => onAddToCart(product)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isAdded ? 'bg-emerald-600 text-white' : `${theme.primary}`
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>تمت الإضافة</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{product.inStock ? 'إضافة' : 'نفذ'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};
