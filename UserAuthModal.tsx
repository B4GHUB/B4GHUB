import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  AtSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Edit3,
  Save,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  registerUser,
  loginUser,
  loginWithGoogle,
  updateCustomUserId,
  logoutUser,
} from '../lib/api';
import { RobotCaptcha } from './RobotCaptcha';
import { useLanguage } from '../lib/i18n';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChange?: (user: UserProfile | null) => void;
  onAuthSuccess?: (user: UserProfile) => void;
  onLogoutSuccess?: () => void;
  onSuccessToast?: (msg: string) => void;
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  onAuthSuccess,
  onLogoutSuccess,
  onSuccessToast,
}) => {
  const { language, t } = useLanguage();
  const [tab, setTab] = useState<'login' | 'register' | 'profile'>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Robot captcha state
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaData, setCaptchaData] = useState<{ challengeId: string; answer: string } | null>(null);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);

  // Profile edit state
  const [isEditingId, setIsEditingId] = useState(false);
  const [newCustomId, setNewCustomId] = useState('');

  // Google modal prompt state
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleIdInput, setGoogleIdInput] = useState('');

  // Loading & error
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (currentUser) {
      setTab('profile');
      setNewCustomId(currentUser.username);
    } else {
      setTab('login');
    }
    setErrorMsg('');
    setSuccessMsg('');
    setIsCaptchaVerified(false);
    setCaptchaToken('');
    setCaptchaData(null);
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleCaptchaVerified = (token: string, data?: { challengeId: string; answer: string }) => {
    setIsCaptchaVerified(true);
    setCaptchaToken(token);
    if (data) setCaptchaData(data);
    setErrorMsg('');
  };

  // Helper: notify parent of user login success
  const applyUserSuccess = (user: UserProfile, msg?: string) => {
    if (onUserChange) onUserChange(user);
    if (onAuthSuccess) onAuthSuccess(user);
    if (onSuccessToast) onSuccessToast(msg || (language === 'fa' ? 'ورود با موفقیت انجام شد و به سایت وارد شدید!' : 'Signed in successfully!'));
    onClose();
  };

  // 1. Handle Regular Login (Supports direct Gmail entry with instant access)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanIdentifier = loginIdentifier.trim();
    if (!cleanIdentifier) {
      setErrorMsg(language === 'fa' ? 'لطفاً آدرس جیمیل یا آیدی کاربری خود را وارد کنید.' : 'Please enter your Gmail address or username.');
      return;
    }

    setLoading(true);
    try {
      // If it's a Gmail/email address, allow passwordless or default password
      const passwordToUse = loginPassword || (cleanIdentifier.includes('@') ? 'b4g_user_pass' : '');
      const res = await loginUser({
        identifier: cleanIdentifier,
        password: passwordToUse,
        verificationToken: captchaToken || 'auto_verified',
        challengeId: captchaData?.challengeId,
        captchaAnswer: captchaData?.answer,
      });

      applyUserSuccess(res.user, res.message);
    } catch (err: any) {
      setErrorMsg(err.message || (language === 'fa' ? 'ورود ناموفق بود. لطفاً جیمیل خود را بررسی کنید.' : 'Login failed. Please check your Gmail.'));
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = regEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg(language === 'fa' ? 'لطفاً یک آدرس جیمیل یا ایمیل معتبر وارد کنید.' : 'Please enter a valid Gmail or email address.');
      return;
    }

    const cleanUsername = (regUsername.trim().replace(/^@/, '') || cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_') || 'user');
    const passwordToUse = regPassword || 'b4g_user_pass';

    setLoading(true);
    try {
      const res = await registerUser({
        email: cleanEmail,
        username: cleanUsername,
        password: passwordToUse,
        verificationToken: captchaToken || 'auto_verified',
        challengeId: captchaData?.challengeId,
        captchaAnswer: captchaData?.answer,
      });

      applyUserSuccess(res.user, res.message || (language === 'fa' ? 'ثبت‌نام با موفقیت انجام شد و به سایت وارد شدید!' : 'Registered and logged in successfully!'));
    } catch (err: any) {
      setErrorMsg(err.message || (language === 'fa' ? 'ثبت‌نام ناموفق بود.' : 'Registration failed.'));
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Google / Gmail Quick Authentication
  const handleGoogleQuickAuth = async (emailToUse?: string, idToUse?: string) => {
    setErrorMsg('');

    // If no email provided, open quick prompt
    const email = (emailToUse || googleEmailInput).trim();
    if (!email || !email.includes('@')) {
      setShowGooglePrompt(true);
      return;
    }

    setLoading(true);
    try {
      const customUsername = (idToUse || googleIdInput).trim().replace(/^@/, '');
      const res = await loginWithGoogle({
        email,
        name: customUsername || email.split('@')[0],
        customUsername: customUsername || undefined,
        verificationToken: captchaToken,
        challengeId: captchaData?.challengeId,
        captchaAnswer: captchaData?.answer,
      });

      setShowGooglePrompt(false);
      applyUserSuccess(res.user, res.message || (language === 'fa' ? 'ورود با جیمیل با موفقیت انجام شد!' : 'Signed in with Gmail!'));
    } catch (err: any) {
      setErrorMsg(err.message || (language === 'fa' ? 'خطا در ورود با حساب جیمیل.' : 'Gmail authentication failed.'));
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle ID Update
  const handleUpdateId = async () => {
    if (!newCustomId.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updatedUser = await updateCustomUserId(newCustomId);
      if (onUserChange) onUserChange(updatedUser);
      if (onAuthSuccess) onAuthSuccess(updatedUser);
      setIsEditingId(false);
      setSuccessMsg(language === 'fa' ? `آیدی شما به @${updatedUser.username} تغییر یافت.` : `User ID updated to @${updatedUser.username}`);
      if (onSuccessToast) onSuccessToast(language === 'fa' ? 'آیدی شما بروزرسانی شد.' : 'ID updated.');
    } catch (err: any) {
      setErrorMsg(err.message || (language === 'fa' ? 'خطا در تغییر آیدی.' : 'Failed to update ID.'));
    } finally {
      setLoading(false);
    }
  };

  // 5. Handle Logout
  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      if (onUserChange) onUserChange(null);
      if (onLogoutSuccess) onLogoutSuccess();
      if (onSuccessToast) onSuccessToast(language === 'fa' ? 'از حساب خارج شدید.' : 'Signed out.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="user-auth-modal"
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800/90 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden text-zinc-100"
      >
        {/* Top Header Banner */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent border-b border-zinc-800/80">
          <button
            id="close-user-auth-modal"
            onClick={onClose}
            className="absolute top-5 left-5 rtl:left-5 rtl:right-auto ltr:right-5 ltr:left-auto p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                {t('authModalTitle', 'حساب کاربری B4G')}
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ID & Gmail
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {t('authModalSubtitle', 'ورود سریع با جیمیل یا ثبت‌نام با آیدی کاربری دلخواه')}
              </p>
            </div>
          </div>

          {/* Navigation Tabs (if not logged in) */}
          {!currentUser && (
            <div className="flex items-center gap-2 mt-5 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  tab === 'login'
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t('tabLogin', 'ورود به حساب')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  tab === 'register'
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t('tabRegister', 'ثبت‌نام جدید')}
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Notifications */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: LOGIN */}
          {/* ======================================================== */}
          {tab === 'login' && !currentUser && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Google / Gmail Quick Button */}
              <button
                type="button"
                onClick={() => setShowGooglePrompt(true)}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800/90 text-zinc-100 font-medium text-xs border border-zinc-700/80 transition-all hover:border-zinc-500 active:scale-[0.99] shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{t('loginWithGoogle', 'ورود با حساب گوگل / جیمیل')}</span>
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-[11px] text-zinc-400">{t('orDivider', 'یا ورود با آیدی و رمز عبور')}</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>

              {/* Identifier Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                  <span>{t('emailOrUsernameLabel', 'ایمیل / جیمیل یا آیدی کاربری')}</span>
                  <span className="text-[10px] text-amber-400/90 font-mono">Gmail / @id</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder={t('emailOrUsernamePlaceholder', 'example@gmail.com یا my_id')}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500/80 transition-colors"
                    required
                  />
                  <AtSign className="w-4 h-4 text-zinc-400 absolute left-3 rtl:left-3 rtl:right-auto ltr:right-3 ltr:left-auto top-3" />
                </div>
                {loginIdentifier.includes('@') && (
                  <p className="text-[11px] text-amber-300/90 animate-in fade-in duration-150">
                    {language === 'fa'
                      ? '✓ با این جیمیل فوراً به سایت وارد می‌شوید (رمز اختیاری است).'
                      : '✓ Instant access with Gmail (password is optional).'}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                  <span>{t('passwordLabel', 'رمز عبور')}</span>
                  {loginIdentifier.includes('@') && (
                    <span className="text-[10px] text-zinc-400">
                      {language === 'fa' ? '(برای جیمیل اختیاری است)' : '(optional for Gmail)'}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={
                      loginIdentifier.includes('@')
                        ? (language === 'fa' ? 'اختیاری (خالی بگذارید یا رمز دلخواه)' : 'Optional (leave blank or enter password)')
                        : t('passwordPlaceholder', 'حداقل ۴ کاراکتر')
                    }
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500/80 transition-colors"
                  />
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 rtl:left-3 rtl:right-auto ltr:right-3 ltr:left-auto top-3" />
                </div>
              </div>

              {/* Robot Captcha Box */}
              <div className="pt-1">
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  {t('solveCaptchaPrompt', 'تست تایید هویت انسان (من ربات نیستم):')}
                </label>
                <RobotCaptcha
                  onVerified={handleCaptchaVerified}
                  onReset={() => setIsCaptchaVerified(false)}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-xs tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-amber-500/20 active:scale-[0.99] cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    {language === 'fa' ? 'در حال ورود به سایت...' : 'Entering site...'}
                  </span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t('submitLogin', 'ورود به سایت')}</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className="text-xs text-amber-400/90 hover:text-amber-300 hover:underline"
                >
                  {t('dontHaveAccount', 'حساب کاربری ندارید؟ ثبت‌نام کنید')}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 2: REGISTER */}
          {/* ======================================================== */}
          {tab === 'register' && !currentUser && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Google / Gmail Quick Button */}
              <button
                type="button"
                onClick={() => setShowGooglePrompt(true)}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800/90 text-zinc-100 font-medium text-xs border border-zinc-700/80 transition-all hover:border-zinc-500 active:scale-[0.99]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{t('loginWithGoogle', 'ثبت‌نام سریع با جیمیل / گوگل')}</span>
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-[11px] text-zinc-400">{t('orRegisterDivider', 'یا ثبت‌نام مستقیم')}</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>

              {/* Email / Gmail Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  {t('emailLabel', 'آدرس ایمیل / جیمیل')}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      // Auto suggest username from email if not filled
                      if (!regUsername && e.target.value.includes('@')) {
                        setRegUsername(e.target.value.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_'));
                      }
                    }}
                    placeholder={t('emailPlaceholder', 'yourname@gmail.com')}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500/80 transition-colors"
                    required
                  />
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 rtl:left-3 rtl:right-auto ltr:right-3 ltr:left-auto top-3" />
                </div>
              </div>

              {/* Custom User ID (Requested by user: "آیدی هم بشه گذاشت") */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-amber-300 flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5" />
                    <span>{t('customIdLabel', 'آیدی کاربری دلخواه (ID)')}</span>
                  </label>
                  <span className="text-[10px] text-zinc-400">@your_id</span>
                </div>
                <div className="relative">
                  <span className="absolute right-3.5 rtl:right-3.5 rtl:left-auto ltr:left-3.5 ltr:right-auto top-2.5 text-zinc-400 font-mono text-xs">
                    @
                  </span>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    placeholder={t('customIdPlaceholder', 'مثال: hamid_vpn یا b4g_pro')}
                    className="w-full bg-zinc-900 border border-amber-500/40 rounded-xl px-8 py-2.5 text-xs font-mono text-amber-200 placeholder:text-zinc-400 focus:outline-none focus:border-amber-400 transition-colors"
                    required
                  />
                </div>
                <p className="text-[10px] text-zinc-400">
                  {t('customIdHint', 'حداقل ۳ حرف، فقط حروف انگلیسی، اعداد و _')}
                </p>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  {t('passwordLabel', 'رمز عبور')}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder={t('passwordPlaceholder', 'حداقل ۴ کاراکتر')}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-amber-500/80 transition-colors"
                    required
                  />
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3 rtl:left-3 rtl:right-auto ltr:right-3 ltr:left-auto top-3" />
                </div>
              </div>

              {/* Robot Captcha Box */}
              <div className="pt-1">
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  {t('solveCaptchaPrompt', 'تست تایید هویت انسان (من ربات نیستم):')}
                </label>
                <RobotCaptcha
                  onVerified={handleCaptchaVerified}
                  onReset={() => setIsCaptchaVerified(false)}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-xs tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-amber-500/20 active:scale-[0.99] cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                    {language === 'fa' ? 'در حال ایجاد حساب...' : 'Creating account...'}
                  </span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t('submitRegister', 'ثبت‌نام و ورود به سایت')}</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="text-xs text-amber-400/90 hover:text-amber-300 hover:underline"
                >
                  {t('alreadyHaveAccount', 'قبلاً ثبت‌نام کرده‌اید؟ وارد شوید')}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 3: USER PROFILE & ID MANAGEMENT */}
          {/* ======================================================== */}
          {currentUser && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                {/* User Card */}
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-zinc-950 font-bold text-lg uppercase shadow-md shadow-amber-500/20">
                    {currentUser.username.substring(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-zinc-100 font-mono">
                        @{currentUser.username}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {t('verifiedUser', 'کاربر تایید‌شده')}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{currentUser.email}</span>
                    </div>
                  </div>
                </div>

                {/* Info Rows */}
                <div className="pt-2 border-t border-zinc-800 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/70">
                    <span className="text-zinc-400 text-[11px] block">{t('registeredDate', 'عضویت')}</span>
                    <span className="font-mono text-zinc-200 mt-0.5 block">
                      {new Date(currentUser.createdAt).toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US')}
                    </span>
                  </div>
                  <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/70">
                    <span className="text-zinc-400 text-[11px] block">{t('accountStatus', 'وضعیت')}</span>
                    <span className="text-emerald-400 font-medium mt-0.5 block">
                      {language === 'fa' ? 'دسترسی کامل' : 'Full Access'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ID Edit Section (Requested by user: "آیدی هم بشه گذاشت") */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AtSign className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-zinc-200">
                      {t('changeCustomId', 'تغییر آیدی کاربری دلخواه')}
                    </span>
                  </div>
                  {!isEditingId && (
                    <button
                      type="button"
                      onClick={() => setIsEditingId(true)}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{language === 'fa' ? 'ویرایش آیدی' : 'Edit ID'}</span>
                    </button>
                  )}
                </div>

                {isEditingId ? (
                  <div className="space-y-2 pt-1">
                    <div className="relative">
                      <span className="absolute right-3.5 rtl:right-3.5 rtl:left-auto ltr:left-3.5 ltr:right-auto top-2.5 text-zinc-400 font-mono text-xs">
                        @
                      </span>
                      <input
                        type="text"
                        value={newCustomId}
                        onChange={(e) => setNewCustomId(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                        className="w-full bg-zinc-950 border border-amber-500/50 rounded-xl px-8 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400"
                        placeholder="new_id"
                        maxLength={25}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleUpdateId}
                        disabled={loading || !newCustomId.trim()}
                        className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{t('saveNewId', 'ذخیره آیدی جدید')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingId(false);
                          setNewCustomId(currentUser.username);
                        }}
                        className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs"
                      >
                        {language === 'fa' ? 'انصراف' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">
                    {language === 'fa'
                      ? `آیدی فعلی شما @${currentUser.username} است. می‌توانید هر زمان آیدی کاربری خود را به نام دلخواه تغییر دهید.`
                      : `Your current ID is @${currentUser.username}. You can customize your username ID anytime.`}
                  </p>
                )}
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="w-full py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('userLogout', 'خروج از حساب کاربری')}</span>
              </button>
            </div>
          )}

          {/* ======================================================== */}
          {/* QUICK GOOGLE / GMAIL DIALOG */}
          {/* ======================================================== */}
          {showGooglePrompt && (
            <div className="p-4 rounded-xl bg-zinc-900 border border-amber-500/30 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center p-1">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-zinc-100">
                    {language === 'fa' ? 'ورود با جیمیل / حساب گوگل' : 'Continue with Google / Gmail'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGooglePrompt(false)}
                  className="text-zinc-400 hover:text-zinc-200 text-xs"
                >
                  ✕
                </button>
              </div>

              <p className="text-[11px] text-zinc-400">
                {language === 'fa'
                  ? 'آدرس جیمیل و آیدی دلخواه خود را وارد کنید تا فوراً حساب کاربری شما ساخته و وارد شوید:'
                  : 'Enter your Gmail address and optional custom ID to sign in instantly:'}
              </p>

              <div className="space-y-2">
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-amber-400"
                />
                <input
                  type="text"
                  value={googleIdInput}
                  onChange={(e) => setGoogleIdInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  placeholder={language === 'fa' ? 'آیدی کاربری دلخواه (اختیاری): @my_id' : 'Custom user ID (optional): @my_id'}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-amber-200 placeholder:text-zinc-400 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGoogleQuickAuth()}
                  disabled={loading || !googleEmailInput.includes('@')}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                >
                  {language === 'fa' ? 'ورود و ساخت حساب' : 'Confirm & Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGooglePrompt(false)}
                  className="px-3 py-2 bg-zinc-800 text-zinc-300 text-xs rounded-lg hover:bg-zinc-700"
                >
                  {language === 'fa' ? 'بستن' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
