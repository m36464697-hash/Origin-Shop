import React, { useState } from 'react';
import {
  X,
  Bell,
  DownloadCloud,
  Truck,
  Tag,
  Check,
  CheckCheck,
  Copy,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Download
} from 'lucide-react';
import { NotificationItem, StoreBranding } from '../types/store';
import { triggerAutomaticDownload } from '../utils/fileDownloader';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onActionClick: (targetView?: 'downloads' | 'orders' | 'catalog') => void;
  branding: StoreBranding;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onActionClick,
  branding,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDownloadFile = (payload: NonNullable<NotificationItem['deliveryPayload']>) => {
    triggerAutomaticDownload({
      fileName: payload.fileName || `${payload.productName}.zip`,
      productName: payload.productName,
      licenseKey: payload.licenseKey || 'ORIGIN-ACTIVE',
      fileData: payload.fileData
    });
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'delivery':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'download':
        return <DownloadCloud className="w-4 h-4 text-sky-600" />;
      case 'shipping':
        return <Truck className="w-4 h-4 text-amber-600" />;
      case 'promo':
        return <Tag className="w-4 h-4 text-rose-600" />;
      default:
        return <Bell className="w-4 h-4 text-zinc-900" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-start animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between text-right border-r border-zinc-200 animate-in slide-in-from-left duration-300">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-zinc-900" />
            <h3 className="font-bold text-sm text-zinc-950">مركز الإشعارات والتسليمات</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-950 text-white tabular-nums">
                {unreadCount} جديد
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action bar */}
        {unreadCount > 0 && (
          <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between text-xs">
            <span className="text-zinc-500">لديك تنبيهات غير مقروءة</span>
            <button
              onClick={onMarkAllAsRead}
              className="text-zinc-950 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>تحديد الكل كمقروء</span>
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-16 text-zinc-400">
              <Bell className="w-8 h-8 opacity-40" />
              <p className="text-xs">لا توجد إشعارات حالياً</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const payload = notif.deliveryPayload;
              const isDelivery = notif.type === 'delivery' || !!payload;

              return (
                <div
                  key={notif.id}
                  onClick={() => onMarkAsRead(notif.id)}
                  className={`p-3.5 rounded-2xl border transition-all text-xs space-y-2.5 ${
                    notif.read
                      ? 'bg-white border-zinc-200'
                      : isDelivery
                      ? 'bg-emerald-50/50 border-emerald-300 shadow-xs'
                      : 'bg-zinc-50 border-zinc-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-zinc-100 shrink-0">{getIcon(notif.type)}</div>
                      <h4 className="font-bold text-zinc-950 line-clamp-1">{notif.title}</h4>
                    </div>
                    <span className="text-[10px] text-zinc-400 tabular-nums shrink-0">{notif.time}</span>
                  </div>

                  <p className="text-zinc-600 leading-relaxed pr-8">{notif.message}</p>

                  {payload && (
                    <div className="mt-2 pr-8 space-y-2">
                      {payload.deliveryType === 'text' && payload.textContent && (
                        <div className="p-3 rounded-xl bg-zinc-950 text-white border border-zinc-800 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-zinc-400">
                            <span className="flex items-center gap-1 font-mono">
                              <FileText className="w-3.5 h-3.5 text-emerald-400" />
                              <span>تفاصيل الطلب المسلّم:</span>
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyText(notif.id, payload.textContent || '');
                              }}
                              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              {copiedId === notif.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>تم النسخ!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>نسخ المحتوى</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="font-mono text-xs text-emerald-400 select-all whitespace-pre-wrap break-all bg-black/40 p-2 rounded-lg">
                            {payload.textContent}
                          </div>
                        </div>
                      )}

                      {payload.deliveryType === 'image' && payload.imageData && (
                        <div className="p-2.5 rounded-xl bg-zinc-100 border border-zinc-200 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-800">
                            <span className="flex items-center gap-1">
                              <ImageIcon className="w-3.5 h-3.5 text-zinc-900" />
                              <span>مرفق الطلب المسلّم:</span>
                            </span>
                            <a
                              href={payload.imageData}
                              download={`delivered_${payload.productName}.png`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] text-zinc-950 underline flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              <span>تحميل الصورة</span>
                            </a>
                          </div>
                          <img
                            src={payload.imageData}
                            alt="Delivered product"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage(payload.imageData || null);
                            }}
                            className="w-full max-h-44 object-cover rounded-lg border border-zinc-300 cursor-pointer"
                          />
                        </div>
                      )}

                      {payload.deliveryType === 'file' && (
                        <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <DownloadCloud className="w-4 h-4 text-zinc-900 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-bold text-zinc-900 text-xs truncate">
                                {payload.fileName || `${payload.productName}.zip`}
                              </p>
                              {payload.licenseKey && (
                                <p className="text-[10px] font-mono text-zinc-500">
                                  المرجع: {payload.licenseKey}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadFile(payload);
                            }}
                            className="px-3 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Download className="w-3 h-3" />
                            <span>تنزيل</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pr-8 pt-1 flex justify-start gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(notif.id);
                        onClose();
                        onActionClick('orders');
                      }}
                      className="px-3 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {notif.actionLabel || 'عرض في طلباتي'} ←
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50 text-center">
          <p className="text-[11px] text-zinc-500">
            تصلك إشعارات فورية من {branding.storeName} فور تأكيد الدفع وتسليم طلبك
          </p>
        </div>
      </div>

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
        >
          <div className="relative max-w-xl w-full bg-white p-2 rounded-2xl shadow-2xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-black/60 text-white p-1 rounded-full hover:bg-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewImage} alt="Preview" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};
