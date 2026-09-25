import React from 'react';
import { Plus, Settings, ShieldAlert, CheckCircle, Server, BarChart3, Lock, Zap, Gift, Sliders, Download } from 'lucide-react';
import { AdminStats } from '../types';

interface AdminBarProps {
  stats?: AdminStats;
  defaultPasswordChanged?: boolean;
  onOpenAddConfig: () => void;
  onOpenSettings: () => void;
  onOpenTestConfigSettings?: () => void;
  onOpenGiftCodeSettings?: () => void;
  onOpenConfigsManagement?: () => void;
}

export const AdminBar: React.FC<AdminBarProps> = ({
  stats,
  defaultPasswordChanged,
  onOpenAddConfig,
  onOpenSettings,
  onOpenTestConfigSettings,
  onOpenGiftCodeSettings,
  onOpenConfigsManagement,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
      {/* Alert if default password is used */}
      {!defaultPasswordChanged && (
        <div className="mb-3 p-3.5 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg shadow-amber-950/20">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">رمز عبور پیش‌فرض هنوز تغییر نکرده است!</span>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                رمز ورود اولیه <code className="bg-slate-950/60 px-1.5 py-0.5 rounded font-mono font-bold">admin123</code> است. جهت امنیت پنل، آن را تغییر دهید.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition-colors"
          >
            تغییر سریع رمز عبور
          </button>
        </div>
      )}

      {/* Admin Stats Strip */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-cyan-500/30 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-cyan-400">میز کار مدیر سیستم</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                دسترسی اختصاصی ادمین
              </span>
            </div>
            <p className="text-xs text-slate-400">
              فقط شما حق درج و مدیریت کانفیگ‌ها و مخزن تست را دارید
            </p>
          </div>
        </div>

        {/* Stats metrics */}
        <div className="flex items-center gap-4 text-xs">
          <div className="text-center px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">کل کانفیگ‌ها</span>
            <span className="text-sm font-bold text-white font-mono">{stats?.totalConfigs ?? 0}</span>
          </div>
          <div className="text-center px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">کانفیگ‌های فعال</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">{stats?.activeConfigs ?? 0}</span>
          </div>
          <div className="text-center px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">مجموع کپی‌ها</span>
            <span className="text-sm font-bold text-cyan-400 font-mono">{stats?.totalCopies ?? 0}</span>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenConfigsManagement || onOpenSettings}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/25 ring-1 ring-cyan-400/30"
            title="تغییر، اصلاح متنی و درست‌سازی خودکار تمام کانفیگ‌های سایت"
          >
            <Sliders className="w-4 h-4" />
            <span>مدیریت و اصلاح کانفیگ‌ها</span>
          </button>
          <button
            onClick={onOpenGiftCodeSettings || onOpenSettings}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20"
            title="صدور و مدیریت کدهای هدیه جهت اهدا از طریق پشتیبانی"
          >
            <Gift className="w-4 h-4" />
            <span>کدهای هدیه</span>
          </button>
          <a
            href="/download-github-index"
            download="index.html"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95"
            title="دانلود مستقیم فایل کامل و به‌روز index.html با تمام کانفیگ‌های ثبت‌شده برای آپلود در گیت‌هاب"
          >
            <Download className="w-4 h-4" />
            <span>دانلود فایل گیت‌هاب</span>
          </a>
          <button
            onClick={onOpenAddConfig}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن کانفیگ جدید</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>تنظیمات و تغییر رمز</span>
          </button>
        </div>
      </div>
    </div>
  );
};
