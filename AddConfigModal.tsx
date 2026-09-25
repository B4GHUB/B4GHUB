import React, { useState } from 'react';
import { X, Plus, Layers, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { adminAddConfig } from '../lib/api';

interface AddConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const COUNTRIES = [
  { code: 'DE', name: 'آلمان 🇩🇪' },
  { code: 'NL', name: 'هلند 🇳🇱' },
  { code: 'FI', name: 'فنلاند 🇫🇮' },
  { code: 'US', name: 'آمریکا 🇺🇸' },
  { code: 'FR', name: 'فرانسه 🇫🇷' },
  { code: 'GB', name: 'انگلستان 🇬🇧' },
  { code: 'TR', name: 'ترکیه 🇹🇷' },
  { code: 'SE', name: 'سوئد 🇸🇪' },
  { code: 'CA', name: 'کانادا 🇨🇦' },
  { code: 'IR', name: 'ایران 🇮🇷' },
];

const OPERATORS = [
  'تمام اپراتورها',
  'همراه اول',
  'ایرانسل',
  'همراه اول و ایرانسل',
  'رایتل',
  'مخابرات و وای‌فای',
];

export const AddConfigModal: React.FC<AddConfigModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [tab, setTab] = useState<'single' | 'bulk'>('single');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Single Form State
  const [title, setTitle] = useState('');
  const [protocol, setProtocol] = useState('vless');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [networkTag, setNetworkTag] = useState(OPERATORS[0]);
  const [configText, setConfigText] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  // Bulk Form State
  const [bulkText, setBulkText] = useState('');

  if (!isOpen) return null;

  // Auto-detect protocol if user pastes in single mode
  const handleConfigTextChange = (val: string) => {
    setConfigText(val);
    const trimmed = val.trim();
    if (trimmed.startsWith('vless://')) setProtocol('vless');
    else if (trimmed.startsWith('vmess://')) setProtocol('vmess');
    else if (trimmed.startsWith('trojan://')) setProtocol('trojan');
    else if (trimmed.startsWith('ss://')) setProtocol('ss');
    else if (trimmed.startsWith('hysteria2://') || trimmed.startsWith('hy2://')) setProtocol('hysteria2');
    else if (trimmed.startsWith('tuic://')) setProtocol('tuic');
    else if (trimmed.startsWith('wireguard://') || trimmed.includes('[Interface]')) setProtocol('wireguard');

    // extract remark
    if (!title && trimmed.includes('#')) {
      try {
        const hash = decodeURIComponent(trimmed.split('#')[1]);
        if (hash) setTitle(hash);
      } catch {
        // ignore
      }
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configText.trim()) {
      setError('لینک یا متن کانفیگ الزامی است.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await adminAddConfig({
        singleConfig: {
          title: title.trim() || 'کانفیگ اختصاصی',
          protocol: protocol as any,
          config: configText.trim(),
          countryCode: country.code,
          countryName: country.name,
          networkTag,
          isPinned,
          isActive: true,
        },
      });

      // Reset
      setTitle('');
      setConfigText('');
      setIsPinned(false);
      onSuccess('کانفیگ جدید با موفقیت اضافه شد.');
      onClose();
    } catch (err: any) {
      setError(err.message || 'خطا در افزودن کانفیگ');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 5);

    if (lines.length === 0) {
      setError('حداقل یک خط کانفیگ معتبر وارد کنید.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await adminAddConfig({ bulkText });
      setBulkText('');
      onSuccess(res.message || `${lines.length} کانفیگ با موفقیت اضافه شد.`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'خطا در افزودن دسته‌ای کانفیگ‌ها');
    } finally {
      setLoading(false);
    }
  };

  const bulkLineCount = bulkText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 5).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">افزودن کانفیگ جدید</h3>
            <p className="text-xs text-slate-400">فقط شما به عنوان مدیر دسترسی به ثبت کانفیگ دارید</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setTab('single');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === 'single'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>افزودن تکی با تنظیمات</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('bulk');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === 'bulk'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>افزودن دسته‌ای (چند کانفیگ همزمان)</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* SINGLE MODE */}
        {tab === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                لینک یا متن کانفیگ: <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={configText}
                onChange={(e) => handleConfigTextChange(e.target.value)}
                placeholder="vless://... یا vmess://... یا trojan://..."
                dir="ltr"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  نام / عنوان نمایشی سرور:
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: سرور پرسرعت آلمان"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  پروتکل کانفیگ:
                </label>
                <select
                  value={protocol}
                  onChange={(e) => setProtocol(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="vless">VLESS</option>
                  <option value="vmess">VMess</option>
                  <option value="trojan">Trojan</option>
                  <option value="ss">Shadowsocks</option>
                  <option value="wireguard">WireGuard</option>
                  <option value="hysteria2">Hysteria 2</option>
                  <option value="tuic">TUIC</option>
                  <option value="warp">WARP</option>
                  <option value="custom">سایر / سفارشی</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  کشور و پرچم:
                </label>
                <select
                  value={country.code}
                  onChange={(e) => {
                    const c = COUNTRIES.find((x) => x.code === e.target.value);
                    if (c) setCountry(c);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  اپراتور پیشنهادی:
                </label>
                <select
                  value={networkTag}
                  onChange={(e) => setNetworkTag(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {OPERATORS.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="pinned-checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-950"
              />
              <label htmlFor="pinned-checkbox" className="text-slate-300 cursor-pointer">
                پین کردن به عنوان کانفیگ ویژه در بالای لیست
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-medium transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>در حال ثبت...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>ثبت و انتشار کانفیگ</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* BULK MODE */
          <form onSubmit={handleBulkSubmit} className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-medium text-slate-300">
                  متن کانفیگ‌ها (هر کانفیگ در یک خط):
                </label>
                <span className="text-cyan-400 font-mono font-medium">
                  {bulkLineCount} خط شناسایی شد
                </span>
              </div>
              <textarea
                rows={8}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="vless://...&#10;vmess://...&#10;trojan://..."
                dir="ltr"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                سیستم به صورت هوشمند نوع پروتکل، نام سرور و کشور را از لینک‌های وارد شده استخراج خواهد کرد.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || bulkLineCount === 0}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-medium transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>در حال پردازش و ثبت کانفیگ‌ها...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>افزودن تمام {bulkLineCount} کانفیگ</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
