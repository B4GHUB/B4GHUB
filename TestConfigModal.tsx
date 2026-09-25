import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Zap,
  Check,
  Copy,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Wifi,
  Sparkles,
  ExternalLink,
  Smartphone,
  Headphones,
  AlertTriangle,
} from 'lucide-react';
import { TestConfigPublicStatus } from '../types';
import {
  getPublicTestConfigStatus,
  claimPublicTestConfig,
  getStoredTestClaimedConfig,
} from '../lib/api';
import { soundManager } from '../lib/sound';
import { RgbFrame } from './MovingBorderBeam';

interface TestConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSupport: () => void;
}

export const TestConfigModal: React.FC<TestConfigModalProps> = ({
  isOpen,
  onClose,
  onOpenSupport,
}) => {
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<TestConfigPublicStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Active delivered config (either freshly claimed or cached from previous claim)
  const [claimedData, setClaimedData] = useState<{
    config: string;
    title?: string;
    protocol?: string;
    durationText?: string;
    description?: string;
    alreadyClaimed?: boolean;
    claimedAt?: string;
  } | null>(null);

  const currentConfig = claimedData?.config || status?.config;

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentConfig && showQr) {
      QRCode.toDataURL(currentConfig, {
        width: 300,
        margin: 2,
        color: {
          dark: '#090d16',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR', err));
    }
  }, [currentConfig, showQr]);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      // Check local cache first
      const cached = getStoredTestClaimedConfig();
      if (cached && cached.config) {
        setClaimedData(cached);
      }

      const res = await getPublicTestConfigStatus();
      setStatus(res);

      if (res.alreadyClaimed && res.config) {
        setClaimedData({
          config: res.config,
          title: res.title,
          protocol: res.protocol,
          durationText: res.durationText,
          description: res.description,
          alreadyClaimed: true,
          claimedAt: res.claimedAt,
        });
      }
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری اطلاعات کانفیگ تست');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    setError(null);
    try {
      const res = await claimPublicTestConfig();
      soundManager.playClickSound();
      setClaimedData({
        config: res.config,
        title: res.title,
        protocol: res.protocol,
        durationText: res.durationText,
        description: res.description,
        alreadyClaimed: false,
        claimedAt: res.claimedAt,
      });
      // Update status state
      setStatus((prev) => (prev ? { ...prev, alreadyClaimed: true, config: res.config } : null));
    } catch (err: any) {
      soundManager.playClickSound();
      if (err.alreadyClaimed && err.data?.config) {
        setClaimedData({
          config: err.data.config,
          title: err.data.title,
          protocol: err.data.protocol,
          durationText: err.data.durationText,
          alreadyClaimed: true,
          claimedAt: err.data.claimedAt,
        });
      }
      setError(err.message || 'خطا در دریافت کانفیگ تست');
    } finally {
      setClaiming(false);
    }
  };

  const handleCopy = () => {
    if (!claimedData?.config) return;
    navigator.clipboard.writeText(claimedData.config.trim());
    setCopied(true);
    soundManager.playClickSound();
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  const isClaimed = Boolean(claimedData || status?.alreadyClaimed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-3xl w-full max-w-xl shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-cyan-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  دریافت کانفیگ تست رایگان
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  یکبار مصرف
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تست سرعت و پایداری شبکه B4G قبل از خرید اشتراک
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-300 text-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
              <span className="text-xs text-slate-400">در حال بررسی سهمیه تست...</span>
            </div>
          ) : (
            <>
              {/* Error Banner */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">توجه:</span>
                    <p className="text-[11px] text-rose-300/90 leading-relaxed mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Status & Limits Notice */}
              <div className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-slate-200">
                    قوانین و شرایط دریافت تست:
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    جهت تضمین کیفیت شبکه، هر کاربر و دستگاه{' '}
                    <strong className="text-amber-400 font-bold">فقط ۱ بار</strong> امکان دریافت
                    کانفیگ تست را دارد. این کانفیگ توسط مدیریت به صورت مستقیم تنظیم و نظارت می‌شود.
                  </p>
                </div>
              </div>

              {/* Unclaimed State: Offer details & Claim button */}
              {!isClaimed && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {status?.title || 'کانفیگ تست پرسرعت B4G'}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-950/70 text-cyan-400 border border-cyan-500/30 uppercase font-mono font-bold">
                        {status?.protocol || 'VLESS'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <span className="text-slate-400 block text-[10px]">مدت اعتبار تست:</span>
                          <span className="font-semibold text-slate-200 font-mono">
                            {status?.durationText || 'تست ۲ ساعته - ۱ گیگابایت'}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-slate-400 block text-[10px]">اپراتورهای پشتیبانی:</span>
                          <span className="font-semibold text-slate-200">
                            {status?.networkTag || 'تمام اپراتورها'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {status?.description && (
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {status.description}
                      </p>
                    )}
                  </div>

                  {/* Claim Button */}
                  <button
                    onClick={handleClaim}
                    disabled={claiming || status?.enabled === false}
                    className={`w-full py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                      status?.enabled === false
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 via-sky-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-slate-950 shadow-cyan-500/25 active:scale-98'
                    }`}
                  >
                    {claiming ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin"></div>
                        <span>در حال صدور کانفیگ تست برای شما...</span>
                      </>
                    ) : status?.enabled === false ? (
                      <span>دریافت کانفیگ تست در حال حاضر غیرفعال است</span>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current" />
                        <span>دریافت آنی کانفیگ تست (رایگان)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Claimed State: Display the config */}
              {isClaimed && currentConfig && (
                <div className="space-y-3.5">
                  {/* Status Banner */}
                  <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-bold text-xs">
                        {claimedData?.alreadyClaimed
                          ? 'کانفیگ تست قبلی شما (هر کاربر فقط ۱ بار مجاز است)'
                          : 'کانفیگ تست اختصاصی با موفقیت به شما اختصاص یافت!'}
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                      تست فعال
                    </span>
                  </div>

                  {/* Config Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">
                        {claimedData?.title || status?.title || 'کانفیگ تست اختصاصی B4G'}
                      </span>
                      <span className="font-mono text-cyan-400">
                        {claimedData?.durationText || status?.durationText || 'تست ۲ ساعته'}
                      </span>
                    </div>

                    <RgbFrame rounded="rounded-xl" borderWidth={1.5} duration={3.5} glow={true}>
                      <div
                        dir="ltr"
                        className="p-3 bg-slate-900/95 font-mono text-[11px] text-cyan-300 break-all select-all max-h-28 overflow-y-auto leading-relaxed"
                      >
                        {currentConfig}
                      </div>
                    </RgbFrame>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleCopy}
                        className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
                          copied
                            ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20 active:scale-98'
                        }`}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'کانفیگ کپی شد!' : 'کپی کانفیگ'}</span>
                      </button>

                      <button
                        onClick={() => setShowQr(!showQr)}
                        className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700/80 flex items-center gap-1.5 transition-colors"
                      >
                        <QrCode className="w-4 h-4 text-cyan-400" />
                        <span>{showQr ? 'بستن بارکد' : 'اسکن بارکد QR'}</span>
                      </button>
                    </div>
                  </div>

                  {/* QR Code view */}
                  {showQr && (
                    <div className="p-4 rounded-2xl bg-white flex flex-col items-center justify-center gap-3 animate-fade-in text-slate-900 shadow-xl">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="QR Code"
                          className="w-44 h-44 rounded-xl border border-slate-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                          در حال تولید بارکد...
                        </div>
                      )}
                      <p className="text-[11px] text-slate-600 font-semibold text-center">
                        این بارکد را با نرم‌افزار v2rayNG ،Streisand ،Nekoray یا Shadowrocket اسکن کنید
                      </p>
                    </div>
                  )}

                  {/* Notice about 1-time limit */}
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200/90 text-[11px] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      سهمیه تست شما ثبت شد و امکان دریافت کانفیگ تست جدید وجود ندارد.
                    </span>
                  </div>

                  {/* Support CTA */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/60 to-cyan-950/60 border border-sky-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-sky-200">
                    <div className="flex items-center gap-2.5">
                      <Headphones className="w-5 h-5 text-sky-400 shrink-0" />
                      <div>
                        <span className="font-bold text-xs text-white block">
                          خرید اشتراک دائمی و نامحدود
                        </span>
                        <p className="text-[11px] text-sky-300/80 mt-0.5">
                          ترافیک نامحدود، بدون قطعی و پشتیبانی ۲۴ ساعته
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenSupport();
                      }}
                      className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shrink-0 transition-colors shadow-sm"
                    >
                      خرید اشتراک
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/70 flex items-center justify-between text-slate-400 text-[11px]">
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>سازگار با اندروید، آیفون، ویندوز و مک</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
