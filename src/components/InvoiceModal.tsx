import React, { useRef, useState } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { Order, StoreBranding } from '../types/store';
import { formatDate, formatPrice, getOrderStatusLabel, getPaymentMethodDetails } from '../utils/formatters';
import { BrandWordmark } from './BrandWordmark';

interface InvoiceModalProps {
  order: Order | null;
  branding: StoreBranding;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Pure HTML5 Canvas fallback renderer so PNG download ALWAYS succeeds
 * even if browser stylesheets or html2canvas encounter edge-case CSS functions.
 */
async function renderFallbackInvoicePNG(order: Order, branding: StoreBranding): Promise<string> {
  const width = 1200;
  const rowHeight = 56;
  const height = Math.max(920, 620 + order.items.length * rowHeight);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unsupported');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Outer Border
  ctx.strokeStyle = '#e4e4e7';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  // Header Banner
  ctx.fillStyle = '#09090b';
  ctx.fillRect(24, 24, width - 48, 130);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.font = 'bold 34px Cairo, Arial, sans-serif';
  ctx.fillText(`${branding.storeName} ®`, width - 64, 82);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '18px Cairo, Arial, sans-serif';
  ctx.fillText(branding.storeTagline || 'متجر المنتجات الرقمية والتقنية الموثق', width - 64, 118);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px monospace';
  ctx.fillText(`#${order.id}`, 64, 82);
  ctx.fillStyle = '#d4d4d8';
  ctx.font = '16px Cairo, Arial, sans-serif';
  ctx.fillText(`التاريخ: ${formatDate(order.createdAt)}`, 64, 118);

  // Customer & Payment Info Box
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(56, 184, width - 112, 160);
  ctx.strokeStyle = '#e4e4e7';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(56, 184, width - 112, 160);

  const paymentMeta = getPaymentMethodDetails(order.paymentMethod);
  const statusMeta = getOrderStatusLabel(order.orderStatus);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#71717a';
  ctx.font = 'bold 16px Cairo, Arial, sans-serif';
  ctx.fillText('بيانات المشتري:', width - 84, 220);
  ctx.fillStyle = '#18181b';
  ctx.font = 'bold 22px Cairo, Arial, sans-serif';
  ctx.fillText(order.customer.name, width - 84, 255);
  ctx.fillStyle = '#52525b';
  ctx.font = '18px Cairo, Arial, sans-serif';
  ctx.fillText(`${order.customer.email} · ${order.customer.phone}`, width - 84, 288);
  if (order.customer.address || order.customer.city) {
    ctx.fillText(`${order.customer.city || ''} ${order.customer.address || ''}`, width - 84, 320);
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = '#71717a';
  ctx.font = 'bold 16px Cairo, Arial, sans-serif';
  ctx.fillText('الدفع والحالة:', 84, 220);
  ctx.fillStyle = '#18181b';
  ctx.font = 'bold 20px Cairo, Arial, sans-serif';
  ctx.fillText(paymentMeta.name, 84, 255);
  ctx.fillStyle = order.paymentStatus === 'paid' ? '#059669' : '#d97706';
  ctx.font = 'bold 18px Cairo, Arial, sans-serif';
  ctx.fillText(order.paymentStatus === 'paid' ? 'تم استلام المبلغ ✓' : 'قيد مراجعة الدفع', 84, 288);
  ctx.fillStyle = '#3f3f46';
  ctx.fillText(`الحالة: ${statusMeta.label}`, 84, 320);

  // Table Header
  let y = 380;
  ctx.fillStyle = '#f4f4f5';
  ctx.fillRect(56, y, width - 112, 48);
  ctx.strokeRect(56, y, width - 112, 48);

  ctx.fillStyle = '#27272a';
  ctx.font = 'bold 18px Cairo, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('المنتج', width - 84, y + 31);
  ctx.textAlign = 'center';
  ctx.fillText('الكمية', 440, y + 31);
  ctx.textAlign = 'left';
  ctx.fillText('الإجمالي', 84, y + 31);

  y += 48;
  order.items.forEach((item, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#fafafa';
    ctx.fillRect(56, y, width - 112, rowHeight);
    ctx.strokeStyle = '#e4e4e7';
    ctx.strokeRect(56, y, width - 112, rowHeight);

    ctx.fillStyle = '#18181b';
    ctx.font = 'bold 18px Cairo, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText((item.productName || item.name || '').slice(0, 48), width - 84, y + 35);

    ctx.textAlign = 'center';
    ctx.fillText(String(item.quantity), 440, y + 35);

    ctx.textAlign = 'left';
    ctx.fillText(formatPrice(item.price * item.quantity, branding.currencySymbol), 84, y + 35);
    y += rowHeight;
  });

  // Totals
  y += 42;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#52525b';
  ctx.font = '18px Cairo, Arial, sans-serif';
  ctx.fillText(`المجموع الفرعي: ${formatPrice(order.subtotal, branding.currencySymbol)}`, 84, y);
  if (order.discount > 0) {
    y += 34;
    ctx.fillStyle = '#059669';
    ctx.fillText(`الخصم: - ${formatPrice(order.discount, branding.currencySymbol)}`, 84, y);
  }
  if (order.shippingFee > 0) {
    y += 34;
    ctx.fillStyle = '#52525b';
    ctx.fillText(`الشحن: ${formatPrice(order.shippingFee, branding.currencySymbol)}`, 84, y);
  }
  y += 34;
  ctx.fillStyle = '#71717a';
  ctx.fillText(`ضريبة القيمة المضافة: 0%`, 84, y);

  y += 48;
  ctx.fillStyle = '#09090b';
  ctx.font = 'bold 28px Cairo, Arial, sans-serif';
  ctx.fillText(`الإجمالي النهائي: ${formatPrice(order.total, branding.currencySymbol)}`, 84, y);

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = '#71717a';
  ctx.font = '15px Cairo, Arial, sans-serif';
  ctx.fillText(
    branding.invoiceFooterNote || 'هذه الفاتورة صادرة إلكترونياً من Origin Shop وبقيمة ضريبة مضافة 0%.',
    width / 2,
    height - 52
  );

  return canvas.toDataURL('image/png');
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  branding,
  isOpen,
  onClose,
}) => {
  // Hooks MUST run before any conditional return!
  const invoiceCardRef = useRef<HTMLDivElement>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !order) return null;

  const paymentMeta = getPaymentMethodDetails(order.paymentMethod);
  const statusMeta = getOrderStatusLabel(order.orderStatus);

  const triggerPngDownload = (dataUrl: string) => {
    const link = document.createElement('a');
    link.download = `فاتورة-${order.id}-origin-shop.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  // Download Invoice as a crisp high-DPI PNG image
  const handleDownloadInvoiceImage = async () => {
    if (!invoiceCardRef.current || isGeneratingImage) return;

    setIsGeneratingImage(true);
    try {
      await new Promise((r) => setTimeout(r, 100));

      const canvas = await html2canvas(invoiceCardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Strip Tailwind v4 modern CSS color functions (oklch / oklab / color-mix) so html2canvas CSS parser never throws
          clonedDoc.querySelectorAll('style').forEach((styleTag) => {
            if (styleTag.textContent) {
              styleTag.textContent = styleTag.textContent
                .replace(/oklch\([^)]*\)/g, '#18181b')
                .replace(/oklab\([^)]*\)/g, '#18181b')
                .replace(/color-mix\([^;{}]+\)/g, '#18181b');
            }
          });
          const el = clonedDoc.getElementById('printable-invoice-capture');
          if (el) {
            el.style.backgroundColor = '#ffffff';
            el.style.color = '#18181b';
          }
        },
      });

      const dataUrl = canvas.toDataURL('image/png');
      triggerPngDownload(dataUrl);
    } catch (err) {
      console.warn('html2canvas encountered an issue, using Canvas 2D PNG fallback:', err);
      try {
        const fallbackUrl = await renderFallbackInvoicePNG(order, branding);
        triggerPngDownload(fallbackUrl);
      } catch (fallbackErr) {
        console.error('Fallback PNG generation failed:', fallbackErr);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Container */}
      <div className="relative w-full max-w-3xl bg-[#ffffff] text-[#18181b] rounded-3xl shadow-2xl border border-[#e4e4e7] overflow-hidden text-right font-sans my-6 print:m-0 print:border-none print:shadow-none print:rounded-none print:w-full">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="p-4 sm:p-5 bg-[#fafafa] border-b border-[#e4e4e7] flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#09090b] text-[#ffffff] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#18181b]">
                فاتورة طلب معتمدة #{order.id}
              </h3>
              <p className="text-[11px] text-[#71717a]">
                تنزيل فوري كصورة PNG عالية الجودة على جهازك
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Download as Image Button */}
            <button
              onClick={handleDownloadInvoiceImage}
              disabled={isGeneratingImage}
              className="px-4 py-2.5 rounded-xl bg-[#09090b] hover:bg-[#27272a] disabled:opacity-50 text-[#ffffff] text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              title="تنزيل الفاتورة كصورة PNG على جهازك"
            >
              {isGeneratingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#d4d4d8]" />
                  <span>جاري تجهيز صورة الفاتورة...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#34d399]" />
                  <span>تم تنزيل الفاتورة كصورة بنجاح!</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 text-[#ffffff]" />
                  <span>طباعة وتنزيل الفاتورة كصورة (PNG)</span>
                </>
              )}
            </button>

            {/* Native Print button */}
            <button
              onClick={handleNativePrint}
              className="p-2.5 text-[#52525b] hover:text-[#18181b] rounded-xl hover:bg-[#e4e4e7] transition-colors border border-[#e4e4e7] cursor-pointer"
              title="طباعة عبر المتصفح"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-[#71717a] hover:text-[#18181b] rounded-xl hover:bg-[#e4e4e7] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* INVOICE BODY (Hex-safe colors for 100% reliable PNG capture) */}
        <div
          id="printable-invoice-capture"
          ref={invoiceCardRef}
          style={{ backgroundColor: '#ffffff', color: '#18181b' }}
          className="p-6 sm:p-10 space-y-8 print:p-6"
        >
          {/* Top Brand & Invoice Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-[#e4e4e7] pb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3.5">
                <div className="h-14 px-3 py-1.5 rounded-xl bg-[#000000] text-[#ffffff] flex items-center justify-center shrink-0 border border-[#18181b]">
                  <img
                    src={branding.logoUrl || './origin-logo.png'}
                    alt="Origin Shop Logo"
                    crossOrigin="anonymous"
                    className="h-full w-auto max-w-[140px] object-contain"
                  />
                </div>
                <div>
                  <BrandWordmark storeName={branding.storeName} size="lg" />
                  <span className="text-[11px] text-[#71717a] font-medium block mt-1">
                    {branding.storeTagline || 'متجر المنتجات الرقمية والتقنية الموثق'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#71717a] pt-1">
                جمهورية مصر العربية · فاتورة بيع إلكترونية معتمدة
                {branding.contactPhone ? ` · هاتف: ${branding.contactPhone}` : ''}
              </p>
            </div>

            <div className="text-right sm:text-left space-y-1.5">
              <div className="inline-block px-3 py-1 rounded-lg bg-[#f4f4f5] text-[#18181b] text-xs font-mono font-bold border border-[#e4e4e7]">
                فاتورة رقم #{order.id}
              </div>
              <p className="text-xs text-[#71717a] font-mono">
                تاريخ الإصدار: {formatDate(order.createdAt)}
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-[#3f3f46] sm:justify-end">
                <span>حالة الطلب:</span>
                <span className="px-2 py-0.5 rounded-md bg-[#f4f4f5] border border-[#e4e4e7] font-medium text-[#18181b]">
                  {statusMeta.label}
                </span>
              </div>
            </div>
          </div>

          {/* Customer & Payment Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#fafafa] p-5 rounded-2xl border border-[#e4e4e7] text-xs">
            {/* Customer Details */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider block">
                بيانات المشتري (العميل)
              </span>
              <p className="font-bold text-sm text-[#18181b]">{order.customer.name}</p>
              <p className="text-[#52525b] font-mono">{order.customer.email}</p>
              <p className="text-[#52525b] font-mono">{order.customer.phone}</p>
              {(order.customer.address || order.customer.city) && (
                <p className="text-[#71717a] text-[11px]">
                  {[order.customer.city, order.customer.address].filter(Boolean).join(' - ')}
                </p>
              )}
            </div>

            {/* Payment & Verification Details */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-[#a1a1aa] uppercase tracking-wider block">
                طريقة الدفع والتأكيد
              </span>
              <p className="font-bold text-sm text-[#18181b] flex items-center gap-1.5">
                <span>{paymentMeta.badge}</span>
                <span>{paymentMeta.name}</span>
              </p>
              <p className="text-[#52525b]">
                حالة التحويل: {order.paymentStatus === 'paid' ? 'تم استلام المبلغ بنجاح ✓' : 'قيد المراجعة والتأكيد'}
              </p>
              {order.paymentDetails?.walletNumberUsed && (
                <p className="text-[#71717a] font-mono text-[11px]">
                  محفظة العميل: {order.paymentDetails.walletNumberUsed}
                </p>
              )}
              {order.paymentDetails?.instapayRef && (
                <p className="text-[#71717a] font-mono text-[11px]">
                  مرجع إنستاباي: {order.paymentDetails.instapayRef}
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-[#e4e4e7] rounded-2xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#f4f4f5] text-[#3f3f46] font-bold border-b border-[#e4e4e7]">
                <tr>
                  <th className="p-3.5">المنتج والوصف</th>
                  <th className="p-3.5 text-center">النوع</th>
                  <th className="p-3.5 text-center">الكمية</th>
                  <th className="p-3.5 text-left rtl:text-right">سعر الوحدة</th>
                  <th className="p-3.5 text-left rtl:text-right">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f4f4f5]">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-3.5 font-semibold text-[#18181b]">
                      <div>{item.productName || item.name}</div>
                      <span className="text-[10px] text-[#71717a] font-normal">
                        {item.type === 'digital'
                          ? 'طلب رقمي · تسليم إلكتروني بالحساب'
                          : 'منتج عادي · شحن وتوصيل'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#f4f4f5] text-[#27272a] border border-[#e4e4e7]">
                        {item.type === 'digital' ? 'طلب رقمي' : 'منتج عادي'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-[#27272a]">
                      {item.quantity}
                    </td>
                    <td className="p-3.5 font-mono text-[#52525b] text-left rtl:text-right">
                      {formatPrice(item.price, branding.currencySymbol)}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-[#18181b] text-left rtl:text-right">
                      {formatPrice(item.price * item.quantity, branding.currencySymbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals & Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-[#e4e4e7] pt-6">
            <div className="space-y-2 text-xs text-[#71717a] max-w-sm">
              <div className="flex items-center gap-1.5 font-bold text-[#27272a]">
                <ShieldCheck className="w-4 h-4 text-[#18181b]" />
                <span>ضمان ومصادقة {branding.storeName}</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {branding.invoiceFooterNote ||
                  'هذه الفاتورة تم إصدارها إلكترونياً ولا تتطلب توقيعاً خطياً. قيمة الضريبة المضافة 0%، وكافة الأسعار المعروضة صافية.'}
              </p>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-[#52525b]">
                <span>المجموع الفرعي:</span>
                <span className="font-mono font-bold">{formatPrice(order.subtotal, branding.currencySymbol)}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-[#059669] font-bold">
                  <span>خصم الكوبون {order.couponCode ? `(${order.couponCode})` : ''}:</span>
                  <span className="font-mono">- {formatPrice(order.discount, branding.currencySymbol)}</span>
                </div>
              )}

              {order.shippingFee > 0 && (
                <div className="flex justify-between text-[#52525b]">
                  <span>رسوم التوصيل:</span>
                  <span className="font-mono">{formatPrice(order.shippingFee, branding.currencySymbol)}</span>
                </div>
              )}

              <div className="flex justify-between text-[#a1a1aa] text-[11px]">
                <span>ضريبة القيمة المضافة (0%):</span>
                <span className="font-mono">0.00 {branding.currencySymbol}</span>
              </div>

              <div className="border-t border-[#e4e4e7] pt-2 flex justify-between text-sm sm:text-base font-black text-[#18181b]">
                <span>الإجمالي النهائي المطلوب:</span>
                <span className="font-mono text-[#09090b] font-black">
                  {formatPrice(order.total, branding.currencySymbol)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer note inside card */}
          <div className="border-t border-[#f4f4f5] pt-4 flex flex-wrap items-center justify-between text-[11px] text-[#a1a1aa] font-mono">
            <span>{branding.storeName.toUpperCase()} · VERIFIED ELECTRONIC INVOICE</span>
            <span>{branding.contactEmail || 'مصر · جميع الحقوق محفوظة'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
