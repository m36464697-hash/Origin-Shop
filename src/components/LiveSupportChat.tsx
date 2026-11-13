import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ShieldCheck, Headphones } from 'lucide-react';
import { StoreBranding, Order, SupportTicket, GoogleUserProfile } from '../types/store';
import { THEME_PALETTES } from '../utils/theme';

interface LiveSupportChatProps {
  branding: StoreBranding;
  orders: Order[];
  supportTickets: SupportTicket[];
  currentUser?: GoogleUserProfile | null;
  onNewCustomerMessage: (ticket: SupportTicket) => void;
}

const QUICK_TOPICS = [
  {
    id: 'voda',
    label: 'كيف يتم التحويل عبر فودافون كاش؟',
    reply:
      'يمكنك التحويل لرقم محفظة المتجر الظاهر في صفحة الدفع، وإدخال رقم المحفظة المحول منها ليقوم مسؤول المتجر بمطابقة التحويل وتأكيد طلبك.'
  },
  {
    id: 'insta',
    label: 'طريقة الدفع عبر تطبيق إنستاباي؟',
    reply:
      'قم بفتح تطبيق InstaPay واختر إرسال نقود، ثم اكتب معرف الحساب (IPA) الخاص بالمتجر وسيتم مراجعة التحويل وتفعيل طلبك.'
  },
  {
    id: 'fawry',
    label: 'كيف أدفع من خلال فوري؟',
    reply:
      'اختر فوري عند إتمام الطلب وسيظهر لك كود دفع مرجعي. توجه لأي ماكينة فوري واطلب دفع كود الخدمة بالرقم المرجعي.'
  },
  {
    id: 'digital',
    label: 'كيف أستلم الطلب الرقمي؟',
    reply:
      'بعد مراجعة وصول المبلغ، يقوم مسؤول Origin Shop بتأكيد وتسليم طلبك الرقمي مباشرة في خانة الإشعارات وحفظه في قسم «طلباتي»، بينما تُشحن المنتجات العادية لعنوانك.'
  }
];

export const LiveSupportChat: React.FC<LiveSupportChatProps> = ({
  branding,
  supportTickets,
  currentUser,
  onNewCustomerMessage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [inputText, setInputText] = useState('');
  const [unreadBadge, setUnreadBadge] = useState(1);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTicketId(null);
    if (currentUser) {
      setCustomerName(currentUser.name || '');
      setCustomerEmail(currentUser.email || '');
    } else {
      setCustomerName('');
      setCustomerEmail('');
    }
  }, [currentUser?.id]);

  const theme = THEME_PALETTES[branding.primaryTheme] || THEME_PALETTES.slate;
  const currentTicket = supportTickets.find((t) => t.id === activeTicketId) || supportTickets[0];

  useEffect(() => {
    if (isOpen) {
      setUnreadBadge(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, supportTickets]);

  const handleSend = (textToSend?: string): SupportTicket | null => {
    const text = textToSend || inputText;
    if (!text.trim()) return null;

    const timestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const displayName = customerName.trim() || 'عميل المتجر';

    let savedTicket: SupportTicket;
    if (currentTicket) {
      savedTicket = {
        ...currentTicket,
        status: 'unread',
        replies: [
          ...currentTicket.replies,
          {
            id: `rep-${Date.now()}`,
            sender: 'customer',
            senderName: displayName,
            text: text.trim(),
            timestamp
          }
        ]
      };
      onNewCustomerMessage(savedTicket);
    } else {
      const newTicketId = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;
      savedTicket = {
        id: newTicketId,
        userId: currentUser?.id || 'guest',
        customerName: displayName,
        customerEmail: customerEmail.trim() || 'customer@originshop.eg',
        subject: `استفسار جديد من ${displayName}`,
        message: text.trim(),
        createdAt: new Date().toISOString(),
        status: 'unread',
        replies: [
          {
            id: `rep-${Date.now()}`,
            sender: 'customer',
            senderName: displayName,
            text: text.trim(),
            timestamp
          }
        ]
      };
      setActiveTicketId(newTicketId);
      onNewCustomerMessage(savedTicket);
    }

    if (!textToSend) setInputText('');
    return savedTicket;
  };

  const handleTopicClick = (topic: (typeof QUICK_TOPICS)[0]) => {
    const ticketAfterSend = handleSend(topic.label);
    if (!ticketAfterSend) return;

    setTimeout(() => {
      const timestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
      const botReplyTicket: SupportTicket = {
        ...ticketAfterSend,
        replies: [
          ...ticketAfterSend.replies,
          {
            id: `rep-bot-${Date.now()}`,
            sender: 'agent',
            senderName: `مساعد ${branding.storeName}`,
            text: topic.reply,
            timestamp
          }
        ]
      };
      onNewCustomerMessage(botReplyTicket);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 left-6 z-40 text-right font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`relative flex items-center gap-2.5 px-4 py-3.5 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${theme.primary}`}
        >
          <Headphones className="w-5 h-5 text-white" />
          <span className="text-xs font-bold hidden sm:inline text-white">الدعم الفني المباشر</span>
          {unreadBadge > 0 && (
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white animate-pulse" />
          )}
        </button>
      )}

      {isOpen && (
        <div className="w-[90vw] sm:w-96 bg-white rounded-3xl shadow-2xl border border-zinc-200 flex flex-col h-[520px] overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-zinc-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center font-black text-xs">
                  OS
                </div>
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-950 absolute bottom-0 right-0" />
              </div>
              <div>
                <h4 className="font-bold text-xs">فريق دعم {branding.storeName}</h4>
                <p className="text-[10px] text-emerald-400">متواجدون للرد المباشر من لوحة الإدارة</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick FAQ Questions */}
          <div className="px-3 py-2 bg-zinc-50 border-b border-zinc-200 flex gap-1.5 overflow-x-auto text-[11px]">
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicClick(topic)}
                className="px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {topic.label}
              </button>
            ))}
          </div>

          {/* Messages Flow */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-50/50 text-xs">
            <div className="p-3 rounded-2xl bg-white border border-zinc-200 text-zinc-700 space-y-1">
              <span className="font-bold text-[11px] text-zinc-950 block">
                مرحباً بك في {branding.storeName}!
              </span>
              <p className="text-[11px] leading-relaxed">
                أرسل رسالتك وسيتلقاها مسؤول المتجر فوراً في لوحة التحكم ويرد عليك مباشرة هنا.
              </p>
            </div>

            {currentTicket &&
              currentTicket.replies?.map((rep) => (
                <div
                  key={rep.id}
                  className={`flex flex-col ${rep.sender === 'customer' ? 'items-start' : 'items-end'}`}
                >
                  <span className="text-[10px] text-zinc-400 mb-0.5 px-1">
                    {rep.senderName} · {rep.timestamp}
                  </span>
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      rep.sender === 'customer'
                        ? 'bg-zinc-950 text-white rounded-tr-none'
                        : 'bg-white text-zinc-900 border border-zinc-200 rounded-tl-none shadow-2xs'
                    }`}
                  >
                    <p>{rep.text}</p>
                  </div>
                </div>
              ))}

            <div ref={messagesEndRef} />
          </div>

          {(!currentTicket || currentTicket.replies.length <= 1) && (
            <div className="px-3 py-1.5 bg-zinc-100 border-t border-zinc-200 flex gap-2 text-[10px]">
              <input
                type="text"
                placeholder="اسمك (اختياري)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-1/2 px-2 py-1 rounded bg-white border border-zinc-300 text-zinc-900"
              />
              <input
                type="text"
                placeholder="رقم الهاتف أو البريد"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-1/2 px-2 py-1 rounded bg-white border border-zinc-300 text-zinc-900"
              />
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-zinc-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="اكتب استفسارك هنا لمسؤول المتجر..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-zinc-300 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <button
                type="submit"
                className={`p-2.5 rounded-xl text-white transition-all cursor-pointer ${theme.primary}`}
                title="إرسال"
              >
                <Send className="w-4 h-4 rtl:rotate-180" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1.5 px-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>تصل الرسالة فوراً للوحة الإدارة</span>
              </span>
              <span>دعم مباشر 24/7</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
