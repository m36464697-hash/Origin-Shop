import { OrderStatus, PaymentMethod } from '../types/store';

export function formatPrice(amount: number, currencySymbol: string = 'ج.م'): string {
  return `${amount.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currencySymbol}`;
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return isoString;
  }
}

export function generateLicenseKey(prefix = 'ORIGIN'): string {
  const segment1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const segment2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const segment3 = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${segment1}-${segment2}-${segment3}`;
}

export function getOrderStatusLabel(status: OrderStatus): { label: string; bg: string; text: string } {
  switch (status) {
    case 'completed':
      return { label: 'مكتمل ومسلّم', bg: 'bg-emerald-50 border border-emerald-200', text: 'text-emerald-700' };
    case 'processing':
      return { label: 'قيد التجهيز', bg: 'bg-sky-50 border border-sky-200', text: 'text-sky-700' };
    case 'shipped':
      return { label: 'تم الشحن للتوصيل', bg: 'bg-blue-50 border border-blue-200', text: 'text-blue-700' };
    case 'delivered':
      return { label: 'تم التوصيل للعميل', bg: 'bg-teal-50 border border-teal-200', text: 'text-teal-700' };
    case 'cancelled':
      return { label: 'ملغي', bg: 'bg-rose-50 border border-rose-200', text: 'text-rose-700' };
    case 'pending':
    default:
      return { label: 'بانتظار مراجعة الدفع', bg: 'bg-amber-50 border border-amber-200', text: 'text-amber-700' };
  }
}

export function getPaymentMethodDetails(method: PaymentMethod): { name: string; badge: string; color: string } {
  switch (method) {
    case 'vodafone_cash':
      return { name: 'فودافون كاش والمحافظ الذكية', badge: '📱 محفظة إلكترونية', color: 'text-rose-600' };
    case 'instapay':
      return { name: 'إنستاباي InstaPay', badge: '⚡ تحويل لحظي', color: 'text-purple-600' };
    case 'fawry':
      return { name: 'فوري Fawry Pay', badge: '🟡 كود دفع فوري', color: 'text-amber-600' };
    case 'meeza':
      return { name: 'بطاقة ميزة الوطنية', badge: '🇪🇬 كارت ميزة', color: 'text-emerald-600' };
    case 'card':
      return { name: 'بطاقة بنكية (Visa / MasterCard)', badge: '💳 بطاقة ائتمان', color: 'text-blue-600' };
    case 'cod':
      return { name: 'الدفع عند الاستلام', badge: '💵 نقداً عند الباب', color: 'text-zinc-700' };
    default:
      return { name: method, badge: 'دفع إلكتروني', color: 'text-zinc-700' };
  }
}
