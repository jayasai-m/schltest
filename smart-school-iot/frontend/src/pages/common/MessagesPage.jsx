import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Inbox,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
  RefreshCw,
  Search,
  Plus,
  X,
  User,
  Building2,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  Reply,
  ExternalLink
} from 'lucide-react';
import { messageService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';

export const MessagesPage = () => {
  const { user } = useAuth();
  const { t } = useLang();

  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'sent'
  const [inboxMessages, setInboxMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recipientsData, setRecipientsData] = useState({ admin: null, schools: [], inspectors: [] });

  // Compose Modal State
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(''); // JSON string of { role, user_id, school_id, email, name }
  const [recipientEmailOverride, setRecipientEmailOverride] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [sendEmail, setSendEmail] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // View Message Modal State
  const [viewMessage, setViewMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const loadData = async () => {
    try {
      setLoading(true);
      const [inboxRes, sentRes, unreadRes, recRes] = await Promise.all([
        messageService.getInbox(),
        messageService.getSent(),
        messageService.getUnreadCount(),
        messageService.getRecipients()
      ]);
      setInboxMessages(inboxRes.data || []);
      setSentMessages(sentRes.data || []);
      setUnreadCount(unreadRes.data?.unread_count || 0);
      setRecipientsData(recRes.data || { admin: null, schools: [], inspectors: [] });
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenMessage = async (msg) => {
    setViewMessage(msg);
    if (!msg.is_read && activeTab === 'inbox') {
      try {
        await messageService.markAsRead(msg.id);
        setInboxMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking message read:', err);
      }
    }
  };

  const handleReply = (msg) => {
    setViewMessage(null);
    let target = null;
    if (msg.sender_role === 'ADMIN') {
      target = {
        role: 'ADMIN',
        user_id: msg.sender_id,
        name: msg.sender_name,
        email: msg.sender_email
      };
    } else if (msg.sender_role === 'SCHOOL') {
      target = {
        role: 'SCHOOL',
        school_id: msg.sender_school_id,
        name: msg.sender_school_name || msg.sender_name,
        email: msg.sender_email
      };
    } else if (msg.sender_role === 'INSPECTOR') {
      target = {
        role: 'INSPECTOR',
        user_id: msg.sender_id,
        name: msg.sender_name,
        email: msg.sender_email
      };
    }

    if (target) {
      setSelectedRecipient(JSON.stringify(target));
      setRecipientEmailOverride(target.email || '');
    }
    setSubject(msg.subject.startsWith('Re: ') ? msg.subject : `Re: ${msg.subject}`);
    setContent(`\n\n--- On ${new Date(msg.created_at).toLocaleString()}, ${msg.sender_name} wrote:\n${msg.content}`);
    setComposeOpen(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedRecipient) {
      setFeedback({ type: 'error', message: 'Please select a recipient' });
      return;
    }
    if (!subject.trim() || !content.trim()) {
      setFeedback({ type: 'error', message: 'Subject and content cannot be empty' });
      return;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(selectedRecipient);
    } catch {
      setFeedback({ type: 'error', message: 'Invalid recipient selected' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const targetEmail = recipientEmailOverride.trim() || parsed.email;
      const payload = {
        recipient_role: parsed.role,
        recipient_school_id: parsed.school_id || null,
        recipient_user_id: parsed.user_id || null,
        recipient_email: targetEmail,
        subject: subject.trim(),
        content: content.trim(),
        priority,
        send_email: sendEmail
      };

      await messageService.sendMessage(payload);
      setFeedback({
        type: 'success',
        message: sendEmail
          ? `Message sent! SMTP email notification dispatched to ${targetEmail}.`
          : 'Message sent successfully in-system.'
      });

      // Reset form
      setSubject('');
      setContent('');
      setSelectedRecipient('');
      setRecipientEmailOverride('');
      setPriority('NORMAL');

      // Refresh sent list
      const sentRes = await messageService.getSent();
      setSentMessages(sentRes.data || []);

      setTimeout(() => {
        setComposeOpen(false);
        setFeedback(null);
      }, 1800);
    } catch (err) {
      console.error('Failed to send message:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to dispatch message.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter messages
  const currentList = activeTab === 'inbox' ? inboxMessages : sentMessages;
  const filteredList = currentList.filter((m) => {
    const query = searchQuery.toLowerCase();
    const matchQuery =
      m.subject?.toLowerCase().includes(query) ||
      m.content?.toLowerCase().includes(query) ||
      m.sender_name?.toLowerCase().includes(query) ||
      m.recipient_name?.toLowerCase().includes(query) ||
      m.sender_email?.toLowerCase().includes(query) ||
      m.recipient_email?.toLowerCase().includes(query);

    const matchPriority = priorityFilter === 'ALL' || m.priority === priorityFilter;
    return matchQuery && matchPriority;
  });

  const getPriorityBadge = (p) => {
    if (p === 'URGENT') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3 h-3 mr-1" /> URGENT
        </span>
      );
    }
    if (p === 'NOTICE') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Info className="w-3 h-3 mr-1" /> NOTICE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        NORMAL
      </span>
    );
  };

  const getRoleBadge = (role) => {
    if (role === 'ADMIN') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <ShieldCheck className="w-3 h-3 mr-1" /> Admin
        </span>
      );
    }
    if (role === 'INSPECTOR') {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
          <UserCheck className="w-3 h-3 mr-1" /> Inspector
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <Building2 className="w-3 h-3 mr-1" /> School
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-700">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Official Communications & Mail Dispatch</h1>
              <p className="text-xs text-slate-500">
                Direct messaging between Admin, Schools, and Inspectors with automatic SMTP email dispatch
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            Refresh
          </button>
          <button
            onClick={() => setComposeOpen(true)}
            className="flex items-center px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Compose Message
          </button>
        </div>
      </div>

      {/* Tabs and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'inbox'
                ? 'bg-white text-slate-900 border border-slate-200/60 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-3.5 h-3.5 mr-2 text-teal-600" />
            Inbox
            {unreadCount > 0 && (
              <span className="ml-2 px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'sent'
                ? 'bg-white text-slate-900 border border-slate-200/60 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5 mr-2 text-teal-600" />
            Sent Messages ({sentMessages.length})
          </button>
        </div>

        {/* Filter & Search */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subject, content, user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-sm w-56 sm:w-64"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-teal-600 shadow-sm font-medium"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent Only</option>
            <option value="NOTICE">Notice Only</option>
            <option value="NORMAL">Normal Only</option>
          </select>
        </div>
      </div>

      {/* Messages List Container */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
            Loading messages...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              {activeTab === 'inbox' ? <Inbox className="w-6 h-6" /> : <Send className="w-6 h-6" />}
            </div>
            <p className="text-sm font-semibold text-slate-800">
              {activeTab === 'inbox' ? 'Your inbox is empty' : 'No sent messages yet'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {activeTab === 'inbox'
                ? 'Official communications from administrators, schools, or assigned inspectors will appear here.'
                : 'Click "Compose Message" above to dispatch communications with instant email delivery.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map((msg) => {
              const isUnread = activeTab === 'inbox' && !msg.is_read;
              return (
                <div
                  key={msg.id}
                  onClick={() => handleOpenMessage(msg)}
                  className={`p-4 sm:p-5 flex items-start justify-between cursor-pointer transition-colors duration-150 ${
                    isUnread
                      ? 'bg-teal-50/50 hover:bg-teal-50/80'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start space-x-3.5 flex-1 min-w-0 pr-4">
                    {/* Unread indicator */}
                    <div className="pt-1 shrink-0">
                      {isUnread ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-teal-600 shadow-sm shadow-teal-500/50" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-transparent" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Top line: Sender / Recipient + Roles + Priority */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {activeTab === 'inbox' ? msg.sender_name : `To: ${msg.recipient_name}`}
                        </span>

                        {activeTab === 'inbox' ? getRoleBadge(msg.sender_role) : getRoleBadge(msg.recipient_role)}
                        {getPriorityBadge(msg.priority)}

                        {activeTab === 'sent' && (
                          msg.email_sent ? (
                            <span className="inline-flex items-center text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Mail Delivered
                            </span>
                          ) : msg.email_error ? (
                            <span className="inline-flex items-center text-[10px] text-rose-700 font-medium bg-rose-50 px-2 py-0.5 rounded border border-rose-200" title={msg.email_error}>
                              <AlertTriangle className="w-3 h-3 mr-1" /> Mail Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              In-App
                            </span>
                          )
                        )}
                      </div>

                      {/* Subject */}
                      <p className={`text-sm tracking-tight truncate ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {msg.subject}
                      </p>

                      {/* Snippet */}
                      <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>

                  {/* Timestamp & Action */}
                  <div className="shrink-0 text-right space-y-2">
                    <p className="text-[11px] text-slate-500 flex items-center justify-end font-medium">
                      <Clock className="w-3 h-3 mr-1 text-slate-400" />
                      {new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View Message Modal */}
      {viewMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  {getPriorityBadge(viewMessage.priority)}
                  <span className="text-xs text-slate-500">
                    {new Date(viewMessage.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">{viewMessage.subject}</h2>
              </div>
              <button
                onClick={() => setViewMessage(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Sender & Recipient Metadata */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">From:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900">{viewMessage.sender_name}</span>
                    {getRoleBadge(viewMessage.sender_role)}
                    <span className="text-teal-700 font-mono text-[11px]">&lt;{viewMessage.sender_email}&gt;</span>
                  </div>
                </div>

                {viewMessage.sender_school_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Affiliated School:</span>
                    <span className="font-medium text-slate-800">{viewMessage.sender_school_name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">To:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900">{viewMessage.recipient_name}</span>
                    {getRoleBadge(viewMessage.recipient_role)}
                    <span className="text-teal-700 font-mono text-[11px]">&lt;{viewMessage.recipient_email}&gt;</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">SMTP Email Delivery:</span>
                  {viewMessage.email_sent ? (
                    <span className="text-emerald-700 font-medium flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Dispatched to {viewMessage.recipient_email}
                    </span>
                  ) : viewMessage.email_error ? (
                    <span className="text-rose-700 font-medium">Failed: {viewMessage.email_error}</span>
                  ) : (
                    <span className="text-slate-600">In-System Message</span>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Message Content
                </label>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                  {viewMessage.content}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setViewMessage(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Close
              </button>

              {activeTab === 'inbox' && (
                <button
                  onClick={() => handleReply(viewMessage)}
                  className="flex items-center px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <Reply className="w-3.5 h-3.5 mr-1.5" />
                  Reply
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compose Message Modal */}
      {composeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-teal-50 border border-teal-200 rounded-lg text-teal-700">
                  <Send className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Compose Official Message</h2>
              </div>
              <button
                onClick={() => setComposeOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="p-6 overflow-y-auto space-y-4 flex-1">
              {feedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center space-x-2 border ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Recipient Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Recipient *</label>
                <select
                  required
                  value={selectedRecipient}
                  onChange={(e) => {
                    setSelectedRecipient(e.target.value);
                    if (e.target.value) {
                      try {
                        const p = JSON.parse(e.target.value);
                        setRecipientEmailOverride(p.email || '');
                      } catch {}
                    } else {
                      setRecipientEmailOverride('');
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-teal-600 shadow-sm"
                >
                  <option value="">-- Select Recipient --</option>

                  {/* Central Admin Option (available to Schools & Inspectors) */}
                  {recipientsData.admin && (
                    <optgroup label="Central Administration">
                      <option value={JSON.stringify(recipientsData.admin)}>
                        {recipientsData.admin.label}
                      </option>
                    </optgroup>
                  )}

                  {/* Schools Option (available to Admin & Inspectors) */}
                  {recipientsData.schools?.length > 0 && (
                    <optgroup label="Registered Schools">
                      {recipientsData.schools.map((s) => (
                        <option key={s.school_id} value={JSON.stringify(s)}>
                          {s.label}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {/* Inspectors Option (available to Admin & Schools) */}
                  {recipientsData.inspectors?.length > 0 && (
                    <optgroup label="Field Inspectors">
                      {recipientsData.inspectors.map((ins) => (
                        <option key={ins.user_id} value={JSON.stringify(ins)}>
                          {ins.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {selectedRecipient && (
                  <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-600">
                        Target Email Address for Notification:
                      </label>
                      <span className="text-[10px] text-teal-700 font-medium">Editable for testing</span>
                    </div>
                    <input
                      type="email"
                      required
                      value={recipientEmailOverride}
                      onChange={(e) => setRecipientEmailOverride(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-teal-900 font-mono focus:outline-none focus:border-teal-600 shadow-sm"
                    />
                    <p className="text-[10px] text-slate-500">
                      You can replace this with your personal email (e.g. springvolmail@gmail.com) to test receiving the email in your own inbox.
                    </p>
                  </div>
                )}
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Priority Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['NORMAL', 'NOTICE', 'URGENT'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPriority(lvl)}
                      className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        priority === lvl
                          ? lvl === 'URGENT'
                            ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-sm'
                            : lvl === 'NOTICE'
                            ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-sm'
                            : 'bg-teal-50 text-teal-700 border-teal-300 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Drinking Water Station Calibration & Sensor Status"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 shadow-sm"
                />
              </div>

              {/* Message Body */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Message Content *</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Type your official communication here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 resize-none font-sans shadow-sm"
                />
              </div>

              {/* Email Notification Option */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 bg-white border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Dispatch Instant Email Notification via SMTP
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 pl-6 leading-relaxed">
                  Sends an official HTML notification to the recipient's registered email inbox via Google SMTP (<code className="text-teal-700 font-mono bg-teal-50 px-1 py-0.5 rounded border border-teal-200">springvolmail@gmail.com</code>).
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setComposeOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Dispatching...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
