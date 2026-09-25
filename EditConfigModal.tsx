import React, { useState, useEffect } from 'react';
import { ConfigItem } from '../types';
import { X, Save, AlertCircle } from 'lucide-react';
import { adminUpdateConfig } from '../lib/api';

interface EditConfigModalProps {
  config: ConfigItem | null;
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

export const EditConfigModal: React.FC<EditConfigModalProps> = ({ config, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [protocol, setProtocol] = useState('vless');
  const [countryCode, setCountryCode] = useState('DE');
  const [countryName, setCountryName] = useState('آلمان 🇩🇪');
  const [networkTag, setNetworkTag] = useState('تمام اپراتورها');
  const [configText, setConfigText] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setTitle(config.title);
      setProtocol(config.protocol);
      setCountryCode(config.countryCode || 'DE');
      setCountryName(config.countryName || 'آلمان 🇩🇪');
      setNetworkTag(config.networkTag || 'تمام اپراتورها');
      setConfigText(config.config);
      setIsPinned(Boolean(config.isPinned));
      setIsActive(config.isActive !== false);
    }
  }, [config]);

  if (!config) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configText.trim()) {
      setError('لینک یا متن کانفیگ الزامی است.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await adminUpdateConfig(config.id, {
        title: title.trim() || 'کانفیگ',
        protocol: protocol as any,
        countryCode,
        countryName,
        networkTag,
        config: configText.trim(),
        isPinned,
        isActive,
      });

      onSuccess('کانفیگ با موفقیت ویرایش شد.');
      onClose();
    } catch (err: any) {
      setError(err.message || 'خطا در ویرایش کانفیگ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-white mb-1">ویرایش کانفیگ</h3>
        <p className="text-xs text-slate-400 mb-4">بروزرسانی اطلاعات و وضعیت نمایش سرور</p>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              عنوان نمایشی:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                پروتکل:
              </label>
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="vless">VLESS</option>
                <option value="vmess">VMess</option>
                <option value="trojan">Trojan</option>
                <option value="ss">Shadowsocks</option>
                <option value="wireguard">WireGuard</option>
                <option value="hysteria2">Hysteria 2</option>
                <option value="tuic">TUIC</option>
                <option value="warp">WARP</option>
                <option value="custom">سایر</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                کشور:
              </label>
              <select
                value={countryCode}
                onChange={(e) => {
                  const c = COUNTRIES.find((x) => x.code === e.target.value);
                  if (c) {
                    setCountryCode(c.code);
                    setCountryName(c.name);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              اپراتور هدف:
            </label>
            <select
              value={networkTag}
              onChange={(e) => setNetworkTag(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              لینک یا متن کانفیگ:
            </label>
            <textarea
              rows={3}
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              dir="ltr"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500 bg-slate-950"
              />
              <span>نمایش در پنل عمومی (فعال)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500 bg-slate-950"
              />
              <span>پین در بالای لیست</span>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-medium transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>در حال ذخیره...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>ذخیره تغییرات</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
