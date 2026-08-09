import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Gift,
  Share2,
  Copy,
  CheckCircle2,
  Send,
  Image as ImageIcon,
  X,
  MessageSquare,
  MessageCircle,
  Headphones,
  Eye,
  Users,
  UserCheck,
  UserX,
  Building2,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  Bot,
  Paperclip,
  Trash2,
  Clock,
  Award,
} from 'lucide-react';
import { AuthUser } from '../../types';

export const ReferAndSuggestView: React.FC = () => {
  const {
    activeTab,
    referralInfo,
    shopProfile,
    supportMessages,
    sendSupportMessage,
    currentUser,
    registeredUsers,
    isAccountTrialExpired,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [referralFilter, setReferralFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Support View Options (Support & Help Desk vs Live Chat)
  const [supportSubTab, setSupportSubTab] = useState<'SUPPORT' | 'LIVE_CHAT'>('SUPPORT');

  // Support Form State
  const [supportSubject, setSupportSubject] = useState('');
  const [supportCategory, setSupportCategory] = useState('Hardware & Printing');
  const [supportMessageText, setSupportMessageText] = useState('');
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);
  const [submittedNotice, setSubmittedNotice] = useState(false);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<string | null>(null);

  // Live Chat State
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      sender: 'USER' | 'AGENT';
      senderName: string;
      text: string;
      time: string;
      photo?: string;
    }>
  >(() => {
    try {
      const saved = localStorage.getItem('dukaan_live_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'msg-1',
        sender: 'AGENT',
        senderName: 'Dukaan Support Specialist',
        text: 'Namaste! 🙏 Welcome to Dukaan Live Support. How can we assist your retail store today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [liveChatInput, setLiveChatInput] = useState('');
  const [liveChatPhoto, setLiveChatPhoto] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('dukaan_live_chat_messages', JSON.stringify(chatMessages));
    } catch (e) {
      console.error(e);
    }
  }, [chatMessages]);

  useEffect(() => {
    if (supportSubTab === 'LIVE_CHAT') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, supportSubTab, isTyping]);

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralInfo.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppRefer = () => {
    const text = `Namaste! I am using Dukaan POS Billing Web App for my retail store (${shopProfile.shopName}). Use my referral code *${referralInfo.referralCode}* when creating your store account! For every ${referralInfo.requiredActiveUsers} active store(s) that join, members unlock ${referralInfo.rewardFreeMonths} month(s) of free membership extension!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Image Upload Handler for Support Form
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setAttachedPhotos((prev) => [...prev, uploadEvent.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setAttachedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Photo Upload Handler for Live Chat
  const handleLiveChatPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        setLiveChatPhoto(uploadEvent.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendLiveChatMessage = (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : liveChatInput;
    if (!text.trim() && !liveChatPhoto) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `chat-${Date.now()}`,
      sender: 'USER' as const,
      senderName: currentUser?.name || shopProfile.ownerName || 'You',
      text: text.trim(),
      time: timeStr,
      photo: liveChatPhoto || undefined,
    };

    // Dispatch to AppContext supportMessages so it lands in Super Admin Live Support Chat Inbox immediately
    sendSupportMessage({
      subject: text.trim().slice(0, 35) || 'Live Chat Inquiry',
      category: 'Live Chat',
      message: text.trim(),
      photos: liveChatPhoto ? [liveChatPhoto] : [],
    });

    setChatMessages((prev) => [...prev, userMsg]);
    setLiveChatInput('');
    setLiveChatPhoto(null);
  };

  const handleClearChatHistory = () => {
    setChatMessages([
      {
        id: 'msg-1',
        sender: 'AGENT',
        senderName: 'Dukaan Support Specialist',
        text: 'Namaste! 🙏 Welcome to Dukaan Live Support. How can we assist your retail store today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessageText.trim()) return;

    sendSupportMessage({
      subject: supportSubject.trim(),
      category: supportCategory,
      message: supportMessageText.trim(),
      photos: attachedPhotos,
    });

    setSupportSubject('');
    setSupportMessageText('');
    setAttachedPhotos([]);
    setSubmittedNotice(true);
    setTimeout(() => setSubmittedNotice(false), 4000);
  };

  // Filter messages for current user (or show all if guest/demo)
  const mySupportMessages = supportMessages.filter(
    (m) => m.senderUserId === currentUser?.id || m.senderPhone === currentUser?.phone || m.senderName === currentUser?.name
  );
  const displayMessages = mySupportMessages.length > 0 ? mySupportMessages : supportMessages;

  // Render Support Center Tab
  if (activeTab === 'suggestions') {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
        <div className="max-w-3xl mx-auto w-full space-y-5">
          
          {/* Top 2 Option Sub-Tab Selector */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-200/70 dark:bg-slate-900 rounded-2xl border border-slate-300/80 dark:border-slate-800 shadow-xs">
            <button
              type="button"
              onClick={() => setSupportSubTab('SUPPORT')}
              id="support-helpdesk-option-btn"
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all ${
                supportSubTab === 'SUPPORT'
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 shadow-md border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Headphones className="h-4 w-4 shrink-0" />
              <span>Support & Help Desk</span>
            </button>

            <button
              type="button"
              onClick={() => setSupportSubTab('LIVE_CHAT')}
              id="support-live-chat-option-btn"
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all ${
                supportSubTab === 'LIVE_CHAT'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-md border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative shrink-0">
                <MessageCircle className="h-4 w-4 text-emerald-500" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <span>Live Chat</span>
              <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-mono font-extrabold shrink-0 border border-emerald-500/20 hidden sm:inline-block">
                Online 🟢
              </span>
            </button>
          </div>

          {/* OPTION 1: SUPPORT & HELP DESK */}
          {supportSubTab === 'SUPPORT' && (
            <div className="space-y-6">
              {/* Main Support Header Card */}
              <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <Headphones className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                      Store Support & Help Desk
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Send SMS text messages and photos directly to Super Admin for hardware, QR, or account assistance.
                    </p>
                  </div>
                </div>

                {submittedNotice && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-100 p-3.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span>Your support message & photos have been sent to Super Admin successfully!</span>
                  </div>
                )}

                {/* Support Message Form */}
                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Topic / Category *
                      </label>
                      <select
                        value={supportCategory}
                        onChange={(e) => setSupportCategory(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <option value="Hardware & Printing">Hardware & Thermal Printer Setup</option>
                        <option value="QR Payments">Fonepay / Khalti QR Verification</option>
                        <option value="Account Renewal">Subscription & Trial Renewal</option>
                        <option value="Inventory Help">Stock & Category Guidance</option>
                        <option value="Bug Report">System Bug & Error Report</option>
                        <option value="General SMS">General Query / SMS</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Subject Line *
                      </label>
                      <input
                        type="text"
                        required
                        value={supportSubject}
                        onChange={(e) => setSupportSubject(e.target.value)}
                        placeholder="e.g. Printer margin alignment screenshot"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        id="support-subject-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      SMS / Message Text *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={supportMessageText}
                      onChange={(e) => setSupportMessageText(e.target.value)}
                      placeholder="Describe your query or issue in detail for Super Admin..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      id="support-message-input"
                    />
                  </div>

                  {/* Attach Photos Section */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>Attach Photos / Screenshots (Optional)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Images convert automatically</span>
                    </label>

                    {/* Photo Previews */}
                    {attachedPhotos.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                        {attachedPhotos.map((photo, idx) => (
                          <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-950">
                            <img src={photo} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(idx)}
                              className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 shadow-md hover:bg-red-700 transition"
                              title="Remove Photo"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="support-photo-upload"
                        className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
                      >
                        <ImageIcon className="h-4 w-4 text-blue-500" />
                        <span>Upload Photos / Receipts</span>
                        <input
                          id="support-photo-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-slate-400">
                        {attachedPhotos.length} photo(s) selected
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white shadow-md transition hover:bg-blue-700 text-xs active:scale-98"
                    id="submit-support-msg-btn"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send SMS & Photos to Admin</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* OPTION 2: LIVE CHAT */}
          {supportSubTab === 'LIVE_CHAT' && (
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              
              {/* Live Chat Top Header Bar */}
              <div className="flex items-center justify-between p-4 bg-slate-900 text-white border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                      <Bot className="h-6 w-6" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm flex items-center gap-2">
                      <span>Dukaan Support Specialist</span>
                      <span className="px-2 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-400/30 font-mono">
                        24/7 LIVE
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-300 flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-emerald-400" />
                      <span>Online • Replies in under 1 minute</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearChatHistory}
                  className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition flex items-center gap-1"
                  title="Clear Chat History"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Clear Chat</span>
                </button>
              </div>

              {/* Quick Prompt FAQ Suggestions */}
              <div className="p-3 bg-slate-100 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Quick Topics:</span>
                <button
                  type="button"
                  onClick={() => handleSendLiveChatMessage('How to setup thermal printer & paper size?')}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 transition shrink-0 shadow-xs"
                >
                  🖨️ Thermal Printer
                </button>
                <button
                  type="button"
                  onClick={() => handleSendLiveChatMessage('How do I enable Fonepay Dynamic QR bill printing?')}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 transition shrink-0 shadow-xs"
                >
                  📱 Fonepay Dynamic QR
                </button>
                <button
                  type="button"
                  onClick={() => handleSendLiveChatMessage('How to manage Khata & Udharo customer credit balances?')}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 transition shrink-0 shadow-xs"
                >
                  📓 Khata Ledger
                </button>
                <button
                  type="button"
                  onClick={() => handleSendLiveChatMessage('How to renew store plan subscription?')}
                  className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 transition shrink-0 shadow-xs"
                >
                  💳 Plan Renewal
                </button>
              </div>

              {/* Chat Conversation Scroll Body */}
              <div className="p-4 h-[420px] overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
                {(() => {
                  const userThread = supportMessages.find(
                    (m) =>
                      (currentUser?.id && m.senderUserId === currentUser.id) ||
                      (shopProfile.shopName && shopProfile.shopName !== 'Retail Store' && m.senderShopName === shopProfile.shopName) ||
                      (shopProfile.phone && shopProfile.phone !== 'N/A' && m.senderPhone === shopProfile.phone)
                  );

                  const displayHistory = userThread?.chatHistory && userThread.chatHistory.length > 0
                    ? userThread.chatHistory
                    : chatMessages.map((m) => ({
                        id: m.id,
                        sender: m.sender as 'USER' | 'ADMIN',
                        text: m.text,
                        time: m.time,
                        photos: m.photo ? [m.photo] : [],
                      }));

                  return displayHistory.map((item) => {
                    const isUser = item.sender === 'USER';
                    return (
                      <div
                        key={item.id}
                        className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                            isUser
                              ? 'bg-blue-600 text-white'
                              : 'bg-emerald-600 text-white ring-2 ring-emerald-500/30'
                          }`}
                        >
                          {isUser ? (currentUser?.name || shopProfile.ownerName || 'U').charAt(0).toUpperCase() : <Headphones className="h-4 w-4" />}
                        </div>

                        <div className={`max-w-[80%] sm:max-w-[70%] space-y-1 ${isUser ? 'items-end text-right' : 'items-start'}`}>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
                            <span className="font-bold">{isUser ? (currentUser?.name || shopProfile.ownerName || 'You') : 'Super Admin'}</span>
                            <span>• {item.time}</span>
                          </div>

                          <div
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                              isUser
                                ? 'bg-blue-600 text-white rounded-tr-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-emerald-500/30 rounded-tl-xs'
                            }`}
                          >
                            {item.photos && item.photos.length > 0 && (
                              <div className="mb-2 space-y-1">
                                {item.photos.map((p, pIdx) => (
                                  <div key={pIdx} className="rounded-xl overflow-hidden border border-slate-300 dark:border-slate-600 max-h-48">
                                    <img src={p} alt="Attached" className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            )}
                            <p>{item.text}</p>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}

                <div ref={chatBottomRef} />
              </div>

              {/* Live Chat Input Form */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2">
                {liveChatPhoto && (
                  <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl w-max border border-slate-200 dark:border-slate-700">
                    <img src={liveChatPhoto} alt="Upload preview" className="w-10 h-10 object-cover rounded-lg" />
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Photo attached</span>
                    <button
                      type="button"
                      onClick={() => setLiveChatPhoto(null)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendLiveChatMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <label
                    htmlFor="live-chat-photo-input"
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-pointer transition shrink-0"
                    title="Attach Photo"
                  >
                    <Paperclip className="h-4 w-4 text-blue-500" />
                    <input
                      id="live-chat-photo-input"
                      type="file"
                      accept="image/*"
                      onChange={handleLiveChatPhotoUpload}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="text"
                    value={liveChatInput}
                    onChange={(e) => setLiveChatInput(e.target.value)}
                    placeholder="Type your question or request here..."
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    id="live-chat-text-input"
                  />

                  <button
                    type="submit"
                    disabled={!liveChatInput.trim() && !liveChatPhoto}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1.5 shrink-0 active:scale-95"
                    id="send-live-chat-msg-btn"
                  >
                    <span>Send</span>
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Full Image Modal */}
        {selectedPhotoModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden p-2 border border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedPhotoModal(null)}
                className="absolute top-4 right-4 bg-slate-800/80 hover:bg-slate-700 text-white p-2 rounded-full z-10"
              >
                <X className="h-5 w-5" />
              </button>
              <img src={selectedPhotoModal} alt="Attached Full View" className="max-h-[80vh] w-auto mx-auto rounded-lg object-contain" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Filter registered users who joined using current user's referral code or ID
  const currentUserRefCode = referralInfo.referralCode || currentUser?.myReferralCode || 'DK8A2X';
  const referredStores = registeredUsers.filter(
    (u) =>
      (u.referredByCode && u.referredByCode.trim().toUpperCase() === currentUserRefCode.trim().toUpperCase()) ||
      (u.referredByUserId && currentUser?.id && u.referredByUserId === currentUser.id)
  );

  const activeCount = referredStores.filter(
    (u) => (u.status === 'APPROVED' || u.status === 'TRIAL_ACTIVE') && !isAccountTrialExpired(u)
  ).length;

  const inactiveCount = referredStores.filter(
    (u) => u.status === 'EXPIRED' || u.status === 'REJECTED' || isAccountTrialExpired(u)
  ).length;

  const filteredReferredList = referredStores.filter((u) => {
    const isActive = (u.status === 'APPROVED' || u.status === 'TRIAL_ACTIVE') && !isAccountTrialExpired(u);
    if (referralFilter === 'ACTIVE') return isActive;
    if (referralFilter === 'INACTIVE') return !isActive;
    return true;
  });

  // Render Refer & Earn Tab (default / activeTab === 'referrals')
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* REFERRAL HEADER & CODE CARD */}
        <div className="flex flex-col gap-5 rounded-2xl border border-indigo-200 bg-white p-6 shadow-xs dark:border-indigo-900/50 dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                <Gift className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    Refer a Retail Friend & Earn Rewards
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] font-extrabold border border-indigo-500/20">
                    6-DIGIT CODE
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Share your 6-character referral code with store owners. Track active and inactive members who joined using your code.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleWhatsAppRefer}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-extrabold text-white shadow-md transition hover:bg-emerald-700 text-xs shrink-0 active:scale-95"
            >
              <Share2 className="h-4 w-4" />
              <span>Share Code via WhatsApp</span>
            </button>
          </div>

          {/* 6-DIGIT CODE DISPLAY BOX */}
          <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-5 text-white shadow-lg border border-indigo-800/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Your Exclusive 6-Digit Referral Code</span>
              </span>
              <span className="text-[11px] font-mono font-black bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-400/30 shrink-0">
                EVERY {referralInfo.requiredActiveUsers} ACTIVE STORES = {referralInfo.rewardFreeMonths} MONTH FREE MEMBERSHIP
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-950/80 rounded-xl px-4 py-3 border border-indigo-500/40 font-mono font-black text-xl sm:text-2xl text-amber-300 tracking-widest text-center shadow-inner">
                {currentUserRefCode}
              </div>
              <button
                type="button"
                onClick={handleCopyReferral}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-xs font-extrabold text-white shadow-md transition active:scale-95 shrink-0"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Code Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* PROGRESS BAR TO NEXT FREE MONTH */}
            <div className="pt-2 border-t border-indigo-800/60 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-indigo-200">
                <span>Progress to Next {referralInfo.rewardFreeMonths} Month Free Membership Extension</span>
                <span className="font-mono font-extrabold text-amber-300">
                  {referralInfo.nextRewardProgress} / {referralInfo.requiredActiveUsers} Active Stores
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-indigo-500/30">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round((referralInfo.nextRewardProgress / referralInfo.requiredActiveUsers) * 100))}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-indigo-300/80">
                {referralInfo.requiredActiveUsers - referralInfo.nextRewardProgress === 0
                  ? '🎉 Congratulations! You have unlocked your next free membership reward.'
                  : `Need ${referralInfo.requiredActiveUsers - referralInfo.nextRewardProgress} more active referred store(s) to get +${referralInfo.rewardFreeMonths} month(s) free membership.`}
              </p>
            </div>
          </div>

          {/* STATS SUMMARY CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                <span>Total Referred</span>
                <Users className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{referredStores.length}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 space-y-1">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <span>Active Stores</span>
                <UserCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/20 space-y-1">
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-bold">
                <span>Inactive Stores</span>
                <UserX className="h-4 w-4 text-rose-500" />
              </div>
              <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{inactiveCount}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/20 space-y-1">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-bold">
                <span>Free Membership Earned</span>
                <Award className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                {referralInfo.earnedFreeMonths} {referralInfo.earnedFreeMonths === 1 ? 'Month' : 'Months'}
              </p>
            </div>
          </div>
        </div>

        {/* REFERRED MEMBERS & STORES LIST TABLE */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" />
                <span>Stores Joined via Your Referral Code ({referredStores.length})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time active and inactive account status for shopkeepers using code <strong className="font-mono text-indigo-500">{currentUserRefCode}</strong>
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setReferralFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                  referralFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({referredStores.length})
              </button>
              <button
                type="button"
                onClick={() => setReferralFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 ${
                  referralFilter === 'ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setReferralFilter('INACTIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 ${
                  referralFilter === 'INACTIVE'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Inactive ({inactiveCount})
              </button>
            </div>
          </div>

          {filteredReferredList.length === 0 ? (
            <div className="p-10 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                <Gift className="h-6 w-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                  {referralFilter === 'ALL'
                    ? 'No store referrals yet'
                    : referralFilter === 'ACTIVE'
                    ? 'No active referral members'
                    : 'No inactive referral members'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {referralFilter === 'ALL'
                    ? `Share your code "${currentUserRefCode}" with nearby shop owners. When they sign up using your code, their store details and active status will appear here.`
                    : 'Filter adjusted. Try switching back to "All" to view all joined referrals.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredReferredList.map((usr) => {
                const isActive = (usr.status === 'APPROVED' || usr.status === 'TRIAL_ACTIVE') && !isAccountTrialExpired(usr);
                return (
                  <div
                    key={usr.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-800 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700/60 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-sm flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                          {usr.shopName ? usr.shopName.charAt(0).toUpperCase() : usr.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                            <span>{usr.shopName || usr.name}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {usr.shopCode || usr.id}
                            </span>
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <span>Owner: <strong>{usr.name}</strong></span>
                          </p>
                        </div>
                      </div>

                      {/* Active/Inactive Status Badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isActive ? (
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active Member</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1.5 shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            <span>Inactive / Expired</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{usr.phone || 'No phone provided'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{usr.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>Joined: {usr.registeredAt || usr.trialStartDate || 'Recently'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/60 dark:border-slate-700/40">
                      <span className="text-slate-500">
                        Subscription Plan: <strong className="text-indigo-600 dark:text-indigo-400 uppercase font-mono">{usr.subscriptionPlan}</strong>
                      </span>
                      <span className="font-mono text-slate-400 text-[10px]">
                        Referred Code: <strong className="text-slate-700 dark:text-slate-200">{usr.referredByCode || currentUserRefCode}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
