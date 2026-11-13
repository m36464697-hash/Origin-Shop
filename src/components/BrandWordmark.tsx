import React from 'react';

interface BrandWordmarkProps {
  storeName?: string;
  size?: 'sm' | 'md' | 'lg';
  lightText?: boolean;
}

/**
 * Renders the store name using the same heavy geometric lowercase rounded typography
 * as the official "origin Shop" logo.
 */
export const BrandWordmark: React.FC<BrandWordmarkProps> = ({
  storeName,
  size = 'md',
  lightText = false,
}) => {
  const isDefaultBrand = !storeName || storeName.trim().toLowerCase() === 'origin shop';

  const textSizes = {
    sm: 'text-lg sm:text-xl',
    md: 'text-xl sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
  };

  const shopSizes = {
    sm: 'text-xs',
    md: 'text-xs sm:text-sm',
    lg: 'text-sm sm:text-base',
  };

  const mainColor = lightText ? 'text-white' : 'text-zinc-950';
  const subColor = lightText ? 'text-zinc-300' : 'text-zinc-700';

  if (!isDefaultBrand) {
    return (
      <span
        dir="ltr"
        className={`font-brand font-black tracking-tight ${textSizes[size]} ${mainColor} leading-none inline-block`}
      >
        {storeName}
      </span>
    );
  }

  return (
    <span
      dir="ltr"
      className={`font-brand inline-flex items-baseline gap-1 select-none leading-none ${mainColor}`}
    >
      <span className={`font-black tracking-[-0.04em] lowercase ${textSizes[size]}`}>
        origin
      </span>
      <span className={`font-extrabold italic tracking-tight ${shopSizes[size]} ${subColor}`}>
        Shop
      </span>
      <sup className="text-[9px] font-bold opacity-60 -top-2">®</sup>
    </span>
  );
};
