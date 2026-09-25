import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, ShieldAlert, ArrowLeft, KeyRound } from 'lucide-react';
import { adminLogin } from '../lib/api';
import { B4G_LOGO_DATA_URL } from '../lib/logo';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  defaultPasswordChanged?: boolean;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  defaultPasswordChanged,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('لطفاً رمز عبور را وارد کنید.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await adminLogin(password);
      setPassword('');
      onLoginSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'رمز عبور وارد شده نادرست است.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Heading */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/40 mb-3 bg-slate-900 flex items-center justify-center">
            <img
              src={B4G_LOGO_DATA_URL}
              alt="B4G Core Logo"
              className="w-full h-full object-cover select-none"
              referrerPolicy="no-referrer"
            />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">ورود مالک پنل</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            تنها مالک سیستم با داشتن رمز عبور مجاز به افزودن، ویرایش و حذف کانفیگ‌ها می‌باشد.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              رمز عبور مالک:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                dir="ltr"
                placeholder="Password"
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Hint for password */}
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 text-[11px]">
            <KeyRound className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span>رمز پیش‌فرض سیستم: </span>
              <code className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300 font-mono font-bold">admin</code>
              <span className="text-slate-400 mx-1">یا</span>
              <code className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300 font-mono font-bold">PC_KING</code>
              <span className="block text-slate-400 text-[10px] mt-0.5">
                پس از ورود، از بخش تنظیمات مالک می‌توانید رمز عبور را به دلخواه خود تغییر دهید.
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-medium text-sm transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>در حال بررسی رمز...</span>
            ) : (
              <>
                <span>ورود به پنل</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
