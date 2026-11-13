import React from 'react';
import { X, ShieldCheck, FileCheck2, RotateCcw, DownloadCloud, Package, Phone, Mail } from 'lucide-react';
import { StoreBranding } from '../types/store';

export type PolicyType = 'privacy' | 'terms' | 'refund';

interface PolicyModalProps {
  isOpen: boolean;
  activePolicy: PolicyType;
  onSelectPolicy: (policy: PolicyType) => void;
  onClose: () => void;
  branding: StoreBranding;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  isOpen,
  activePolicy,
  onSelectPolicy,
  onClose,
  branding,
}) => {
  if (!isOpen) return null;

  const storeName = branding.storeName || 'Origin Shop';

  const tabs: { id: PolicyType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'privacy', label: 'سياسة الخصوصية', icon: ShieldCheck },
    { id: 'terms', label: 'شروط الاستخدام والتراخيص', icon: FileCheck2 },
    { id: 'refund', label: 'ضمان الجودة والاسترجاع', icon: RotateCcw },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden text-right my-6"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-200 flex items-center justify-between gap-3 bg-zinc-50/70">
          <div>
            <h3 className="font-black text-base sm:text-lg text-zinc-950">
              السياسات والضمانات الرسمية — {storeName}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              وضوح كامل في الحقوق والالتزامات الخاصة بالطلبات الرقمية والمنتجات العادية
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="p-2 text-zinc-400 hover:text-zinc-950 rounded-xl hover:bg-zinc-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Policy Tabs */}
        <div className="px-5 pt-4 pb-3 border-b border-zinc-200 bg-white flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activePolicy === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectPolicy(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Policy Content */}
        <div className="p-6 sm:p-8 max-h-[65vh] overflow-y-auto space-y-5 text-xs sm:text-sm text-zinc-700 leading-relaxed">
          {activePolicy === 'privacy' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-950 font-black text-base">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h4>سياسة الخصوصية وحماية بيانات العملاء</h4>
              </div>

              {branding.privacyPolicyText?.trim() ? (
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 whitespace-pre-wrap leading-loose">
                  {branding.privacyPolicyText}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                    <h5 className="font-bold text-zinc-950">1. البيانات التي نجمعها</h5>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      نجمع فقط البيانات الضرورية لإتمام طلباتك وتقديم خدمة ما بعد البيع، مثل الاسم، البريد الإلكتروني، رقم الهاتف، وعنوان التوصيل داخل مصر في حال شراء المنتجات العادية.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                    <h5 className="font-bold text-zinc-950">2. عزل الحسابات وسرية المعلومات</h5>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      كل حساب مسجل عبر Google يتم عزله بالكامل؛ لا يمكن لأي مستخدم آخر الاطلاع على سلة مشترياتك أو طلباتك أو إشعاراتك أو محادثات الدعم الفني الخاصة بك.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                    <h5 className="font-bold text-zinc-950">3. أمان المعاملات وعدم مشاركة البيانات</h5>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      لا يقوم متجر {storeName} ببيع أو تأجير أو مشاركة بياناتك الشخصية أو أرقام محافظ الدفع مع أي أطراف خارجية غير شركات الشحن المعتمدة عند شحن المنتجات العادية فقط.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activePolicy === 'terms' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-950 font-black text-base">
                <FileCheck2 className="w-5 h-5 text-zinc-900" />
                <h4>شروط الاستخدام والتراخيص في {storeName}</h4>
              </div>

              {branding.termsPolicyText?.trim() ? (
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 whitespace-pre-wrap leading-loose">
                  {branding.termsPolicyText}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-zinc-950">
                      <DownloadCloud className="w-4 h-4 text-zinc-900" />
                      <h5>أولاً: الطلبات الرقمية</h5>
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      • تدخل الطلبات الرقمية مرحلة مراجعة التحويل المالي للتأكد من وصول المبلغ، وبمجرد التأكيد من الإدارة يتم تسليم الطلب إلكترونياً مباشرة في خانة الإشعارات وقسم «طلباتي» بحسابك.
                      <br />
                      • التراخيص والاشتراكات والمنتجات الرقمية مخصصة للاستخدام الشخصي أو التجاري المصرح به في وصف المنتج، ولا يجوز إعادة بيعها أو توزيعها دون إذن رسمي.
                      <br />• لا تُفرض أي رسوم شحن على الطلبات الرقمية، والضريبة المضافة هي 0%.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-zinc-950">
                      <Package className="w-4 h-4 text-zinc-900" />
                      <h5>ثانياً: المنتجات العادية (المادية)</h5>
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      • تخضع المنتجات العادية لتوفر المخزون الفعلي وتُشحن إلى العنوان المسجل في الطلب داخل محافظات جمهورية مصر العربية خلال ({branding.estimatedShippingTime || '1 - 3 أيام عمل'}).
                      <br />
                      • يتحمل العميل مسؤولية إدخال رقم الهاتف والعنوان بشكل دقيق لضمان سرعة التواصل من مندوب الشحن، كما يتوفر خيار الدفع عند الاستلام للمنتجات العادية حسب إعدادات المتجر.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activePolicy === 'refund' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-950 font-black text-base">
                <RotateCcw className="w-5 h-5 text-emerald-600" />
                <h4>ضمان الجودة وسياسة الاستبدال والاسترجاع</h4>
              </div>

              {branding.refundPolicyText?.trim() ? (
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 whitespace-pre-wrap leading-loose">
                  {branding.refundPolicyText}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                    <h5 className="font-bold text-zinc-950">1. ضمان الطلبات الرقمية</h5>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      • يمكنك إلغاء الطلب واسترداد المبلغ بالكامل في حال تم الطلب قبل قيام الإدارة بتأكيد وتسليم الطلب الرقمي لحسابك.
                      <br />
                      • بعد تسليم الطلب الرقمي، يلتزم {storeName} بضمان تشغيل وصحة الطلب الرقمي بالكامل أو استبداله فوراً بدون أي تكلفة إذا ثبت وجود أي خلل فني من طرفنا.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                    <h5 className="font-bold text-zinc-950">2. استبدال واسترجاع المنتجات العادية</h5>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      • يحق للعميل استبدال أو إرجاع المنتجات العادية خلال 14 يوماً من تاريخ الاستلام في حالة وجود عيب صناعة أو عدم مطابقة المواصفات المعلنة، بشرط احتفاظ المنتج بحالته الأصلية وتغليفه.
                      <br />• يمكنك الاحتفاظ بفاتورة الطلب الإلكترونية (PNG) كمرجع رسمي ومعتمد لطلبات الضمان أو الاستبدال.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Store Contact Footer inside Modal */}
          <div className="p-4 rounded-2xl bg-zinc-950 text-white flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold block">هل لديك استفسار حول السياسات أو طلبك؟</span>
              <span className="text-[11px] text-zinc-400">
                {branding.workingHours || 'فريق الدعم متاح لخدمتك يومياً'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
              {branding.contactPhone && (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{branding.contactPhone}</span>
                </span>
              )}
              {branding.contactEmail && (
                <span className="flex items-center gap-1.5 text-zinc-200">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{branding.contactEmail}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
