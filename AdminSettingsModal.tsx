import React, { useState, useEffect } from 'react';
import {
  Announcement,
  SupportConfig,
  SupportMessage,
  OtpCodeItem,
  TestConfigSettings,
  TestClaimRecord,
  TestConfigPoolItem,
  GiftCodeItem,
  AdminUserItem,
  ConfigItem,
  ConfigLockSettings,
  UniversalLockSettings,
  UniversalSnapshotDetails,
} from '../types';
import {
  X,
  Lock,
  Megaphone,
  Check,
  AlertTriangle,
  KeyRound,
  Headphones,
  MessageSquare,
  Trash2,
  Send,
  Radio,
  CheckCheck,
  RefreshCw,
  Clock,
  ShieldCheck,
  Shield,
  Copy,
  Sparkles,
  Plus,
  Key,
  Zap,
  Server,
  UserCheck,
  Layers,
  Database,
  Smartphone,
  Wifi,
  Gift,
  Tag,
  Users,
  Mail,
  UserX,
  Search,
  AtSign,
  Sliders,
  Wrench,
  CheckCircle2,
  Power,
  Pin,
  FileText,
  Edit3,
  RotateCcw,
  Save,
  ShieldAlert,
  HardDrive,
  Download,
} from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import {
  adminChangePassword,
  adminUpdateAnnouncement,
  adminUpdateSupportConfig,
  adminGetSupportMessages,
  adminToggleMessageRead,
  adminDeleteSupportMessage,
  adminGetAccessData,
  adminUpdateAccessConfig,
  adminGenerateOtps,
  adminDeleteOtp,
  adminClearUsedOtps,
  adminGetTestConfig,
  adminUpdateTestConfig,
  adminAddTestConfigPool,
  adminDeleteTestConfigPoolItem,
  adminClearTestConfigPool,
  adminResetTestClaims,
  adminDeleteTestClaim,
  adminGetGiftCodes,
  adminCreateGiftCode,
  adminToggleBurnGiftCode,
  adminDeleteGiftCode,
  adminClearUsedGiftCodes,
  adminGetUsers,
  adminDeleteUser,
  adminDeleteUserByIdentifier,
  adminClearAllUsers,
  adminGetConfigs,
  adminReplaceAllConfigs,
  adminAutoRepairConfigs,
  adminRestoreWorkingConfigs,
  adminUpdateConfig,
  adminDeleteConfig,
  adminGetConfigLock,
  adminUpdateConfigLock,
  adminGetUniversalLock,
  adminUpdateUniversalLock,
  adminSaveMasterSnapshot,
  adminRestoreMasterSnapshot,
} from '../lib/api';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement;
  supportConfig?: SupportConfig;
  defaultPasswordChanged?: boolean;
  unreadMessagesCount?: number;
  initialTab?: 'configs' | 'masterLock' | 'password' | 'otp' | 'testConfig' | 'giftCodes' | 'users' | 'announcement' | 'support' | 'messages';
  configs?: ConfigItem[];
  onSuccess: (message: string) => void;
  onAnnouncementUpdated: (newAnn: Announcement) => void;
  onSupportConfigUpdated?: (newSupport: SupportConfig) => void;
  onRefreshData?: () => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  announcement,
  supportConfig,
  defaultPasswordChanged,
  unreadMessagesCount = 0,
  initialTab,
  configs: initialConfigsProp,
  onSuccess,
  onAnnouncementUpdated,
  onSupportConfigUpdated,
  onRefreshData,
}) => {
  const { language } = useLanguage();
  const [tab, setTab] = useState<'configs' | 'masterLock' | 'password' | 'otp' | 'testConfig' | 'giftCodes' | 'users' | 'announcement' | 'support' | 'messages'>(
    initialTab || 'configs'
  );

  useEffect(() => {
    if (initialTab && isOpen) {
      setTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Universal Lock State (قفل جامع تمام تنظیمات برای عدم تغییر)
  const [universalLock, setUniversalLock] = useState<UniversalLockSettings>({
    isLocked: true,
    lockedUntil: null,
    lockDurationHours: 0,
    lockedAt: new Date().toISOString(),
    freezeAllSettings: true,
    preventAutoReset: true,
  });
  const [selectedUniversalHours, setSelectedUniversalHours] = useState<number>(0);
  const [isUniversalLockEnabled, setIsUniversalLockEnabled] = useState<boolean>(true);
  const [remainingUniversalSeconds, setRemainingUniversalSeconds] = useState<number | null>(null);
  const [snapshotDetails, setSnapshotDetails] = useState<UniversalSnapshotDetails | null>(null);
  const [universalUpdating, setUniversalUpdating] = useState(false);
  const [snapshotSaving, setSnapshotSaving] = useState(false);
  const [snapshotRestoring, setSnapshotRestoring] = useState(false);
  const [universalMsg, setUniversalMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (remainingUniversalSeconds === null || remainingUniversalSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingUniversalSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingUniversalSeconds]);

  const fetchUniversalLock = async () => {
    try {
      const res = await adminGetUniversalLock();
      if (res.success && res.lockSettings) {
        setUniversalLock(res.lockSettings);
        setIsUniversalLockEnabled(res.lockSettings.isLocked);
        setSelectedUniversalHours(res.lockSettings.lockDurationHours || 0);
        setRemainingUniversalSeconds(res.remainingSeconds);
        if (res.snapshotDetails) {
          setSnapshotDetails(res.snapshotDetails);
        }
      }
    } catch (e) {
      console.error('Error fetching universal lock:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUniversalLock();
    }
  }, [isOpen]);

  const handleSaveUniversalLock = async () => {
    setUniversalUpdating(true);
    setUniversalMsg(null);
    try {
      const res = await adminUpdateUniversalLock({
        isLocked: isUniversalLockEnabled,
        lockDurationHours: selectedUniversalHours,
        note: 'تنظیم دستی توسط مدیر در پنل قفل جامع',
      });
      setUniversalLock(res.lockSettings);
      setRemainingUniversalSeconds(res.remainingSeconds);
      if (res.snapshotDetails) setSnapshotDetails(res.snapshotDetails);
      setUniversalMsg({ type: 'success', text: res.message || 'تنظیمات قفل جامع با موفقیت ذخیره شد.' });
      onSuccess(res.message || 'قفل جامع بروزرسانی شد.');
    } catch (err: any) {
      setUniversalMsg({ type: 'error', text: err.message || 'خطا در ثبت قفل جامع سایت' });
    } finally {
      setUniversalUpdating(false);
    }
  };

  const handleCreateSnapshot = async () => {
    setSnapshotSaving(true);
    setUniversalMsg(null);
    try {
      const res = await adminSaveMasterSnapshot();
      setUniversalLock(res.lockSettings);
      setIsUniversalLockEnabled(res.lockSettings.isLocked);
      if (res.snapshotDetails) setSnapshotDetails(res.snapshotDetails);
      setUniversalMsg({ type: 'success', text: res.message || 'تمام تنظیمات با موفقیت فریز و ثبت دائمی شدند.' });
      onSuccess('اسنپ‌شات و قفل جامع تمام تنظیمات با موفقیت در سرور ثبت شد.');
    } catch (err: any) {
      setUniversalMsg({ type: 'error', text: err.message || 'خطا در فریز و ثبت اسنپ‌شات' });
    } finally {
      setSnapshotSaving(false);
    }
  };

  const handleRestoreSnapshot = async () => {
    if (!window.confirm(language === 'fa' ? 'آیا از بازگردانی تمام تنظیمات، کانفیگ‌ها و اطلاعات سایت از آخرین نسخه فریز شده مطمئن هستید؟' : 'Are you sure you want to restore all settings and configs from the last frozen snapshot?')) {
      return;
    }
    setSnapshotRestoring(true);
    setUniversalMsg(null);
    try {
      const res = await adminRestoreMasterSnapshot();
      setUniversalLock(res.lockSettings);
      setIsUniversalLockEnabled(res.lockSettings.isLocked);
      if (res.snapshotDetails) setSnapshotDetails(res.snapshotDetails);
      setUniversalMsg({ type: 'success', text: res.message || 'تنظیمات با موفقیت از نسخه فریز شده بازیابی شدند.' });
      onSuccess('کلیه اطلاعات و تنظیمات سایت با موفقیت از نسخه فریز شده بازیابی شدند.');
      if (onRefreshData) onRefreshData();
      fetchAdminConfigs();
    } catch (err: any) {
      setUniversalMsg({ type: 'error', text: err.message || 'خطا در بازگردانی نسخه فریز شده' });
    } finally {
      setSnapshotRestoring(false);
    }
  };

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Access Control / OTP state
  const [accessEnabled, setAccessEnabled] = useState(true);
  const [masterCode, setMasterCode] = useState('B4G2026');
  const [allowSelfRequest, setAllowSelfRequest] = useState(true);
  const [sessionDurationHours, setSessionDurationHours] = useState(24);
  const [otps, setOtps] = useState<OtpCodeItem[]>([]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSaving, setOtpSaving] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);

  // OTP Generation state
  const [genCount, setGenCount] = useState<number>(3);
  const [genType, setGenType] = useState<'numeric' | 'prefix'>('numeric');
  const [genMaxUses, setGenMaxUses] = useState<number>(1);
  const [genValidityHours, setGenValidityHours] = useState<number>(24);
  const [genLabel, setGenLabel] = useState<string>('کد کانال تلگرام');
  const [newlyGenerated, setNewlyGenerated] = useState<OtpCodeItem[]>([]);
  const [copiedAllGen, setCopiedAllGen] = useState(false);
  const [copiedOtpId, setCopiedOtpId] = useState<string | null>(null);

  // Announcement state
  const [annEnabled, setAnnEnabled] = useState(announcement.enabled);
  const [annText, setAnnText] = useState(announcement.text);
  const [annType, setAnnType] = useState(announcement.type || 'info');
  const [annLoading, setAnnLoading] = useState(false);
  const [annError, setAnnError] = useState<string | null>(null);

  // Support Config state
  const [telegramId, setTelegramId] = useState(supportConfig?.telegramId || '@B4G_SUPPORT');
  const [telegramChannel, setTelegramChannel] = useState(supportConfig?.telegramChannel || '');
  const [contactEmail, setContactEmail] = useState(supportConfig?.contactEmail || '');
  const [phone, setPhone] = useState(supportConfig?.phone || '');
  const [customNote, setCustomNote] = useState(supportConfig?.customNote || '');
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);

  // Support Messages state
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [currentUnreadCount, setCurrentUnreadCount] = useState(unreadMessagesCount);

  // Test Config state (Admin exclusive)
  const [testEnabled, setTestEnabled] = useState(true);
  const [testTitle, setTestTitle] = useState('کانفیگ تست اختصاصی B4G');
  const [testProtocol, setTestProtocol] = useState('VLESS');
  const [testConfigString, setTestConfigString] = useState('');
  const [testDurationText, setTestDurationText] = useState('تست ۲ ساعته - حجم ۱ گیگابایت');
  const [testDescription, setTestDescription] = useState('مناسب برای تست سرعت و اتصال به یوتیوب و اینستاگرام');
  const [testNetworkTag, setTestNetworkTag] = useState('همراه اول، ایرانسل، رایتل و مخابرات');
  const [testPool, setTestPool] = useState<TestConfigPoolItem[]>([]);
  const [testPoolBulkText, setTestPoolBulkText] = useState('');
  const [testClaims, setTestClaims] = useState<TestClaimRecord[]>([]);
  const [testTotalClaims, setTestTotalClaims] = useState(0);
  const [testPoolStats, setTestPoolStats] = useState<{ total: number; unused: number; used: number }>({
    total: 0,
    unused: 0,
    used: 0,
  });
  const [testLoading, setTestLoading] = useState(false);
  const [testSaving, setTestSaving] = useState(false);
  const [testAddingPool, setTestAddingPool] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);

  // Gift Codes state (Admin Support Vouchers)
  const [giftCodes, setGiftCodes] = useState<GiftCodeItem[]>([]);
  const [giftStats, setGiftStats] = useState<{
    total: number;
    active: number;
    burnedOrUsed: number;
    totalRedemptions: number;
  }>({
    total: 0,
    active: 0,
    burnedOrUsed: 0,
    totalRedemptions: 0,
  });
  const [giftCodeInput, setGiftCodeInput] = useState('');
  const [giftConfigInput, setGiftConfigInput] = useState('');
  const [giftTitleInput, setGiftTitleInput] = useState('کانفیگ هدیه اختصاصی B4G');
  const [giftProtocolInput, setGiftProtocolInput] = useState('vless');
  const [giftDurationInput, setGiftDurationInput] = useState('اشتراک هدیه پشتیبانی');
  const [giftDescInput, setGiftDescInput] = useState('ارائه‌شده توسط تیم پشتیبانی تلگرام');
  const [giftMaxUsesInput, setGiftMaxUsesInput] = useState(1);
  const [giftBatchCount, setGiftBatchCount] = useState(1);
  const [giftLabelInput, setGiftLabelInput] = useState('کد هدیه پشتیبانی');
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftSaving, setGiftSaving] = useState(false);
  const [giftError, setGiftError] = useState<string | null>(null);
  const [giftSuccess, setGiftSuccess] = useState<string | null>(null);
  const [giftSearch, setGiftSearch] = useState('');
  const [giftFilter, setGiftFilter] = useState<'all' | 'active' | 'used'>('all');
  const [copiedGiftCodeId, setCopiedGiftCodeId] = useState<string | null>(null);
  const [copiedGiftConfigId, setCopiedGiftConfigId] = useState<string | null>(null);

  // Configs Management & Auto-Repair State (گزینه تغییر و درست‌سازی کانفیگ‌ها در پنل مدیر)
  const [adminConfigsList, setAdminConfigsList] = useState<ConfigItem[]>(initialConfigsProp || []);
  const [configsBulkText, setConfigsBulkText] = useState('');
  const [configsLoading, setConfigsLoading] = useState(false);
  const [configsSaving, setConfigsSaving] = useState(false);
  const [configsRepairing, setConfigsRepairing] = useState(false);
  const [configsRestoring, setConfigsRestoring] = useState(false);
  const [configsError, setConfigsError] = useState<string | null>(null);
  const [configsSuccess, setConfigsSuccess] = useState<string | null>(null);
  const [configViewMode, setConfigViewMode] = useState<'bulk' | 'list'>('bulk');

  // Config Lock State (قفل ثبات برای عدم تغییر چند ساعت دیگر یا دائمی)
  const [configLock, setConfigLock] = useState<ConfigLockSettings>({
    isLocked: true,
    lockedUntil: null,
    lockDurationHours: 0,
    lockedAt: new Date().toISOString(),
    freezePing: true,
    preventAutoReset: true,
  });
  const [selectedLockHours, setSelectedLockHours] = useState<number>(0); // 0 = permanent, 6, 12, 24, 48, 72, 168
  const [isLockEnabled, setIsLockEnabled] = useState<boolean>(true);
  const [remainingLockSeconds, setRemainingLockSeconds] = useState<number | null>(null);
  const [lockUpdating, setLockUpdating] = useState(false);
  const [lockSuccess, setLockSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (remainingLockSeconds === null || remainingLockSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingLockSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingLockSeconds]);

  const formatRemainingTime = (seconds: number | null) => {
    if (seconds === null) return language === 'fa' ? 'دائمی (بدون انقضا)' : 'Permanent (No Expiry)';
    if (seconds <= 0) return language === 'fa' ? 'منقضی شده' : 'Expired';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return language === 'fa' ? `${h} ساعت و ${m} دقیقه` : `${h}h ${m}m`;
    }
    return language === 'fa' ? `${m} دقیقه و ${s} ثانیه` : `${m}m ${s}s`;
  };

  const fetchAdminConfigs = async () => {
    setConfigsLoading(true);
    setConfigsError(null);
    try {
      const [res, lockRes] = await Promise.all([
        adminGetConfigs(),
        adminGetConfigLock().catch(() => null),
      ]);
      setAdminConfigsList(res.configs || []);
      setConfigsBulkText((res.configs || []).map((c: ConfigItem) => c.config).join('\n'));
      if (lockRes && lockRes.lockSettings) {
        setConfigLock(lockRes.lockSettings);
        setIsLockEnabled(lockRes.lockSettings.isLocked);
        setSelectedLockHours(lockRes.lockSettings.lockDurationHours || 0);
        setRemainingLockSeconds(lockRes.remainingSeconds);
      }
    } catch (err: any) {
      setConfigsError(err.message || 'خطا در دریافت لیست کانفیگ‌ها');
    } finally {
      setConfigsLoading(false);
    }
  };

  const handleUpdateLockOnly = async (newLockedState?: boolean, hours?: number) => {
    setLockUpdating(true);
    setConfigsError(null);
    setLockSuccess(null);
    try {
      const targetState = newLockedState !== undefined ? newLockedState : isLockEnabled;
      const targetHours = hours !== undefined ? hours : selectedLockHours;
      const res = await adminUpdateConfigLock({
        isLocked: targetState,
        lockDurationHours: targetHours,
        freezePing: true,
        preventAutoReset: true,
      });
      setConfigLock(res.lockSettings);
      setIsLockEnabled(res.lockSettings.isLocked);
      setSelectedLockHours(res.lockSettings.lockDurationHours);
      setRemainingLockSeconds(res.remainingSeconds);
      setLockSuccess(res.message);
      onSuccess(res.message);
      setTimeout(() => setLockSuccess(null), 4500);
    } catch (err: any) {
      setConfigsError(err.message || 'خطا در تنظیم قفل ثبات کانفیگ‌ها');
    } finally {
      setLockUpdating(false);
    }
  };

  const handleSaveConfigsBulk = async () => {
    if (!configsBulkText.trim()) {
      setConfigsError('لطفاً حداقل یک خط کانفیگ معتبر وارد نمایید.');
      return;
    }
    setConfigsSaving(true);
    setConfigsError(null);
    setConfigsSuccess(null);
    try {
      const res = await adminReplaceAllConfigs({
        bulkText: configsBulkText,
        lockConfigs: isLockEnabled,
        lockDurationHours: selectedLockHours,
      });
      setAdminConfigsList(res.configs || []);
      if (res.lockSettings) {
        setConfigLock(res.lockSettings);
        setIsLockEnabled(res.lockSettings.isLocked);
        setSelectedLockHours(res.lockSettings.lockDurationHours);
      }
      setConfigsSuccess(res.message);
      onSuccess(res.message);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setConfigsError(err.message || 'خطا در اعمال تغییرات کانفیگ‌ها');
    } finally {
      setConfigsSaving(false);
    }
  };

  const handleAutoRepairConfigs = async () => {
    setConfigsRepairing(true);
    setConfigsError(null);
    setConfigsSuccess(null);
    try {
      const res = await adminAutoRepairConfigs();
      setAdminConfigsList(res.configs || []);
      setConfigsBulkText((res.configs || []).map((c: ConfigItem) => c.config).join('\n'));
      setConfigsSuccess(res.message);
      onSuccess(res.message);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setConfigsError(err.message || 'خطا در درست‌سازی کانفیگ‌ها');
    } finally {
      setConfigsRepairing(false);
    }
  };

  const handleRestoreWorkingConfigs = async () => {
    if (!window.confirm('آیا مطمئن هستید که می‌خواهید کانفیگ‌های سالم و تست‌شده B4G را جایگزین و بازگردانی کنید؟')) {
      return;
    }
    setConfigsRestoring(true);
    setConfigsError(null);
    setConfigsSuccess(null);
    try {
      const res = await adminRestoreWorkingConfigs();
      setAdminConfigsList(res.configs || []);
      setConfigsBulkText((res.configs || []).map((c: ConfigItem) => c.config).join('\n'));
      setConfigsSuccess(res.message);
      onSuccess(res.message);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setConfigsError(err.message || 'خطا در بازنشانی کانفیگ‌ها');
    } finally {
      setConfigsRestoring(false);
    }
  };

  const handleToggleActiveConfig = async (config: ConfigItem) => {
    try {
      const updated = !config.isActive;
      await adminUpdateConfig(config.id, { isActive: updated });
      setAdminConfigsList((prev) =>
        prev.map((c) => (c.id === config.id ? { ...c, isActive: updated } : c))
      );
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setConfigsError(err.message || 'خطا در تغییر وضعیت');
    }
  };

  const handleTogglePinConfig = async (config: ConfigItem) => {
    try {
      const updated = !config.isPinned;
      await adminUpdateConfig(config.id, { isPinned: updated });
      setAdminConfigsList((prev) =>
        prev.map((c) => (c.id === config.id ? { ...c, isPinned: updated } : c))
      );
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setConfigsError(err.message || 'خطا در پین');
    }
  };

  const handleDeleteConfigFromList = async (id: string, title: string) => {
    if (!window.confirm(`آیا مطمئن هستید که می‌خواهید کانفیگ «${title}» را حذف کنید؟`)) return;
    try {
      await adminDeleteConfig(id);
      const updated = adminConfigsList.filter((c) => c.id !== id);
      setAdminConfigsList(updated);
      setConfigsBulkText(updated.map((c) => c.config).join('\n'));
      onSuccess(`کانفیگ «${title}» حذف شد.`);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setConfigsError(err.message || 'خطا در حذف کانفیگ');
    }
  };

  // Users Management State (Requested by user: delete by ID, view exact Gmail & time)
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersSuccess, setUsersSuccess] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [deleteTargetInput, setDeleteTargetInput] = useState('');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await adminGetUsers();
      setUsersList(res.users || []);
    } catch (err: any) {
      setUsersError(err.message || 'خطا در دریافت لیست کاربران');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string, email: string) => {
    if (!window.confirm(`آیا مطمئن هستید که می‌خواهید کاربر @${username} (${email}) را از سیستم حذف کنید؟ دسترسی این کاربر فوراً باطل خواهد شد.`)) {
      return;
    }
    setDeletingUserId(userId);
    setUsersError(null);
    setUsersSuccess(null);
    try {
      const res = await adminDeleteUser(userId);
      setUsersSuccess(res.message);
      setUsersList((prev) => prev.filter((u) => u.id !== userId));
      onSuccess(res.message);
    } catch (err: any) {
      setUsersError(err.message || 'خطا در حذف کاربر');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleDeleteByIdentifier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTargetInput.trim()) return;
    const target = deleteTargetInput.trim();
    if (!window.confirm(`آیا از حذف کامل کاربر "${target}" از سامانه اطمینان دارید؟`)) {
      return;
    }
    setUsersLoading(true);
    setUsersError(null);
    setUsersSuccess(null);
    try {
      const res = await adminDeleteUserByIdentifier(target);
      setUsersSuccess(res.message);
      setDeleteTargetInput('');
      await fetchUsers();
      onSuccess(res.message);
    } catch (err: any) {
      setUsersError(err.message || 'کاربری با این آیدی یا ایمیل یافت نشد.');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleClearAllUsers = async () => {
    if (!window.confirm('هشدار: آیا مطمئن هستید که می‌خواهید تمام حساب‌های کاربری ثبت‌شده را حذف کنید؟ این عمل غیرقابل بازگشت است.')) {
      return;
    }
    setUsersLoading(true);
    setUsersError(null);
    setUsersSuccess(null);
    try {
      const res = await adminClearAllUsers();
      setUsersSuccess(res.message);
      setUsersList([]);
      onSuccess(res.message);
    } catch (err: any) {
      setUsersError(err.message || 'خطا در پاکسازی کاربران');
    } finally {
      setUsersLoading(false);
    }
  };

  const formatPersianDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const locale = language === 'fa' ? 'fa-IR' : 'en-US';
      const timeStr = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = d.toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' });
      return { timeStr, dateStr, fullStr: `${timeStr} - ${dateStr}` };
    } catch {
      return { timeStr: isoString, dateStr: '', fullStr: isoString };
    }
  };

  // Sync state when props change
  useEffect(() => {
    if (supportConfig) {
      setTelegramId(supportConfig.telegramId || '@B4G_SUPPORT');
      setTelegramChannel(supportConfig.telegramChannel || '');
      setContactEmail(supportConfig.contactEmail || '');
      setPhone(supportConfig.phone || '');
      setCustomNote(supportConfig.customNote || '');
    }
  }, [supportConfig]);

  useEffect(() => {
    setAnnEnabled(announcement.enabled);
    setAnnText(announcement.text);
    setAnnType(announcement.type || 'info');
  }, [announcement]);

  // Load messages when tab is switched to 'messages'
  useEffect(() => {
    if (isOpen && tab === 'messages') {
      loadMessages();
    }
  }, [isOpen, tab]);

  // Load configs when tab is switched to 'configs' or modal opens
  useEffect(() => {
    if (isOpen && tab === 'configs') {
      fetchAdminConfigs();
    }
  }, [isOpen, tab]);

  // Load users data when tab is switched to 'users'
  useEffect(() => {
    if (isOpen && tab === 'users') {
      fetchUsers();
    }
  }, [isOpen, tab]);

  // Load OTP data when tab is switched to 'otp'
  useEffect(() => {
    if (isOpen && tab === 'otp') {
      loadAccessData();
    }
  }, [isOpen, tab]);

  const loadAccessData = async () => {
    setOtpLoading(true);
    setOtpError(null);
    try {
      const data = await adminGetAccessData();
      setAccessEnabled(data.config.enabled);
      setMasterCode(data.config.masterCode || 'B4G2026');
      setAllowSelfRequest(data.config.allowSelfRequest);
      setSessionDurationHours(data.config.sessionDurationHours || 24);
      setOtps(data.otps || []);
    } catch (err: any) {
      setOtpError(err.message || 'خطا در بارگذاری اطلاعات رمز یکبار مصرف');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSaveAccessConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpSaving(true);
    setOtpError(null);
    setOtpSuccess(null);
    try {
      await adminUpdateAccessConfig({
        enabled: accessEnabled,
        masterCode: masterCode.trim(),
        allowSelfRequest,
        sessionDurationHours,
      });
      setOtpSuccess('تنظیمات قفل دسترسی با موفقیت ذخیره شد.');
      setTimeout(() => setOtpSuccess(null), 3000);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setOtpError(err.message || 'خطا در ذخیره تنظیمات');
    } finally {
      setOtpSaving(false);
    }
  };

  const handleGenerateOtps = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpSaving(true);
    setOtpError(null);
    try {
      const res = await adminGenerateOtps({
        count: genCount,
        type: genType,
        maxUses: genMaxUses,
        validityHours: genValidityHours,
        label: genLabel.trim(),
      });
      setNewlyGenerated(res.newOtps || []);
      setOtps(res.otps || []);
      setOtpSuccess(`${res.newOtps?.length || genCount} رمز جدید با موفقیت تولید شد.`);
      setTimeout(() => setOtpSuccess(null), 3500);
    } catch (err: any) {
      setOtpError(err.message || 'خطا در تولید رمزها');
    } finally {
      setOtpSaving(false);
    }
  };

  const handleDeleteOtp = async (id: string) => {
    try {
      const res = await adminDeleteOtp(id);
      setOtps(res.otps || []);
      setNewlyGenerated((prev) => prev.filter((o) => o.id !== id));
    } catch (err: any) {
      setOtpError(err.message || 'خطا در حذف کد');
    }
  };

  const handleClearUsedOtps = async () => {
    try {
      const res = await adminClearUsedOtps();
      setOtps(res.otps || []);
      setNewlyGenerated([]);
      setOtpSuccess(res.message || 'کدهای مصرف‌شده با موفقیت پاکسازی شدند.');
      setTimeout(() => setOtpSuccess(null), 3000);
    } catch (err: any) {
      setOtpError(err.message || 'خطا در پاکسازی');
    }
  };

  const handleCopySingleOtp = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedOtpId(id);
    setTimeout(() => setCopiedOtpId(null), 2000);
  };

  const handleCopyAllNewlyGenerated = () => {
    if (newlyGenerated.length === 0) return;
    const text = newlyGenerated.map((o) => o.code).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAllGen(true);
    setTimeout(() => setCopiedAllGen(false), 2500);
  };

  const loadMessages = async () => {
    setMessagesLoading(true);
    try {
      const msgs = await adminGetSupportMessages();
      setMessages(msgs);
      setCurrentUnreadCount(msgs.filter((m) => !m.isRead).length);
    } catch (e) {
      console.error(e);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Load Test Config data when tab is switched to 'testConfig'
  useEffect(() => {
    if (isOpen && tab === 'testConfig') {
      loadTestData();
    }
  }, [isOpen, tab]);

  const loadTestData = async () => {
    setTestLoading(true);
    setTestError(null);
    try {
      const data = await adminGetTestConfig();
      if (data.settings) {
        setTestEnabled(data.settings.enabled ?? true);
        setTestTitle(data.settings.title || 'کانفیگ تست اختصاصی B4G');
        setTestProtocol(data.settings.protocol || 'VLESS');
        setTestConfigString(data.settings.config || '');
        setTestDurationText(data.settings.durationText || 'تست ۲ ساعته - حجم ۱ گیگابایت');
        setTestDescription(data.settings.description || '');
        setTestNetworkTag(data.settings.networkTag || 'همراه اول، ایرانسل، رایتل و مخابرات');
        setTestPool(data.settings.pool || []);
      }
      setTestClaims(data.claims || []);
      setTestTotalClaims(data.totalClaims || 0);
      if (data.poolStats) {
        setTestPoolStats(data.poolStats);
      } else if (data.settings?.pool) {
        setTestPoolStats({
          total: data.settings.pool.length,
          unused: data.settings.pool.filter((p) => !p.isUsed).length,
          used: data.settings.pool.filter((p) => p.isUsed).length,
        });
      }
    } catch (err: any) {
      setTestError(err.message || 'خطا در بارگذاری اطلاعات کانفیگ تست');
    } finally {
      setTestLoading(false);
    }
  };

  // Load Gift Codes when tab is 'giftCodes'
  useEffect(() => {
    if (isOpen && tab === 'giftCodes') {
      loadGiftCodes();
    }
  }, [isOpen, tab]);

  const loadGiftCodes = async () => {
    setGiftLoading(true);
    setGiftError(null);
    try {
      const data = await adminGetGiftCodes();
      setGiftCodes(data.giftCodes || []);
      if (data.stats) {
        setGiftStats(data.stats);
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Unexpected token') || msg.includes('JSON') || msg.includes('DOCTYPE')) {
        setGiftError('خطا در دریافت اطلاعات از سرور. اطلاعات از حافظه محلی بازیابی شد.');
      } else {
        setGiftError(msg || 'خطا در بارگذاری کدهای هدیه');
      }
    } finally {
      setGiftLoading(false);
    }
  };

  const handleSaveTestSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestSaving(true);
    setTestError(null);
    setTestSuccess(null);
    try {
      await adminUpdateTestConfig({
        enabled: testEnabled,
        title: testTitle,
        protocol: testProtocol,
        config: testConfigString,
        durationText: testDurationText,
        description: testDescription,
        networkTag: testNetworkTag,
      });
      setTestSuccess('تنظیمات و کانفیگ تست با موفقیت ذخیره شد.');
      setTimeout(() => setTestSuccess(null), 3500);
      onSuccess('تنظیمات کانفیگ تست بروزرسانی شد.');
    } catch (err: any) {
      setTestError(err.message || 'خطا در ذخیره تنظیمات');
    } finally {
      setTestSaving(false);
    }
  };

  const handleAddPoolConfigs = async () => {
    if (!testPoolBulkText.trim()) {
      setTestError('لطفاً حداقل یک کانفیگ تست در کادر وارد کنید.');
      return;
    }
    setTestAddingPool(true);
    setTestError(null);
    setTestSuccess(null);
    try {
      const res = await adminAddTestConfigPool({ bulkText: testPoolBulkText });
      setTestPool(res.pool || []);
      setTestPoolBulkText('');
      setTestSuccess(`${res.addedCount || 'چند'} کانفیگ با موفقیت به مخزن تست اضافه شد.`);
      setTimeout(() => setTestSuccess(null), 3500);
      loadTestData();
    } catch (err: any) {
      setTestError(err.message || 'خطا در افزودن به مخزن تست');
    } finally {
      setTestAddingPool(false);
    }
  };

  const handleDeletePoolItem = async (id: string) => {
    try {
      const res = await adminDeleteTestConfigPoolItem(id);
      setTestPool(res.pool || []);
      loadTestData();
    } catch (err: any) {
      setTestError(err.message || 'خطا در حذف کانفیگ از مخزن');
    }
  };

  const handleClearPool = async (clearAll = false) => {
    try {
      const res = await adminClearTestConfigPool(clearAll);
      setTestPool(res.pool || []);
      setTestSuccess(res.message || 'مخزن تست بروزرسانی شد.');
      setTimeout(() => setTestSuccess(null), 3000);
      loadTestData();
    } catch (err: any) {
      setTestError(err.message || 'خطا در پاکسازی مخزن');
    }
  };

  const handleResetClaims = async () => {
    if (
      !confirm(
        'آیا از بازنشانی کامل تاریخچه تست مطمئن هستید؟ با این کار تمام کاربرانی که قبلاً تست گرفته‌اند مجدداً می‌توانند یک بار تست دریافت کنند.'
      )
    ) {
      return;
    }
    try {
      const res = await adminResetTestClaims();
      setTestClaims([]);
      setTestTotalClaims(0);
      setTestSuccess(res.message || 'تاریخچه تست با موفقیت بازنشانی شد.');
      setTimeout(() => setTestSuccess(null), 3500);
    } catch (err: any) {
      setTestError(err.message || 'خطا در بازنشانی تاریخچه');
    }
  };

  const handleDeleteClaim = async (id: string) => {
    try {
      await adminDeleteTestClaim(id);
      setTestClaims((prev) => prev.filter((c) => c.id !== id));
      setTestTotalClaims((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      setTestError(err.message || 'خطا در حذف کاربر از لیست تست');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setPasswordError('لطفاً رمز عبور جدید را وارد کنید.');
      return;
    }
    if (newPassword.length < 4) {
      setPasswordError('رمز عبور باید حداقل ۴ کاراکتر باشد.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('تکرار رمز عبور جدید مطابقت ندارد.');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);

    try {
      await adminChangePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onSuccess('رمز عبور با موفقیت تغییر یافت.');
      onClose();
    } catch (err: any) {
      setPasswordError(err.message || 'خطا در تغییر رمز عبور');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnLoading(true);
    setAnnError(null);

    try {
      const updated: Announcement = {
        enabled: annEnabled,
        text: annText.trim(),
        type: annType as any,
      };
      await adminUpdateAnnouncement(updated);
      onAnnouncementUpdated(updated);
      onSuccess('پیام اطلاعیه با موفقیت ذخیره شد.');
      onClose();
    } catch (err: any) {
      setAnnError(err.message || 'خطا در ذخیره اطلاعیه');
    } finally {
      setAnnLoading(false);
    }
  };

  const handleSupportConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportLoading(true);
    setSupportError(null);

    try {
      const updated: SupportConfig = {
        telegramId: telegramId.trim(),
        telegramChannel: telegramChannel.trim(),
        contactEmail: contactEmail.trim(),
        phone: phone.trim(),
        customNote: customNote.trim(),
        enableDirectMessage: true,
      };
      await adminUpdateSupportConfig(updated);
      if (onSupportConfigUpdated) {
        onSupportConfigUpdated(updated);
      }
      onSuccess('تنظیمات پشتیبانی با موفقیت ذخیره شد.');
      onClose();
    } catch (err: any) {
      setSupportError(err.message || 'خطا در ذخیره تنظیمات پشتیبانی');
    } finally {
      setSupportLoading(false);
    }
  };

  const handleToggleRead = async (id: string) => {
    try {
      const res = await adminToggleMessageRead(id);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isRead: res.message.isRead } : m))
      );
      if (typeof res.unreadCount === 'number') {
        setCurrentUnreadCount(res.unreadCount);
      }
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      const res = await adminDeleteSupportMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (typeof res.unreadCount === 'number') {
        setCurrentUnreadCount(res.unreadCount);
      }
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'broken_config':
        return <span className="px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[10px]">🔴 قطعی سرور</span>;
      case 'connection_issue':
        return <span className="px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[10px]">🟡 اختلال سرعت</span>;
      case 'question':
        return <span className="px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-[10px]">❓ سوال</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-[10px]">💡 پیشنهاد/سایر</span>;
    }
  };

  const handleGenerateRandomGiftCode = () => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGiftCodeInput(`B4G-${randomHex}`);
  };

  const handleSelectConfigForGift = (cfgId: string) => {
    if (!cfgId) return;
    const found = adminConfigsList.find((c) => c.id === cfgId);
    if (found) {
      setGiftConfigInput(found.config.trim());
      setGiftTitleInput(found.title || 'کانفیگ هدیه اختصاصی B4G');
      setGiftProtocolInput(found.protocol || 'vless');
      setGiftSuccess(`کانفیگ «${found.title || found.countryName}» در فرم هدیه قرار گرفت.`);
      setTimeout(() => setGiftSuccess(null), 3000);
    }
  };

  const handlePasteConfigFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setGiftConfigInput(text.trim());
        setGiftSuccess('کانفیگ با موفقیت از کلیپ‌بورد در کادر چسبانده شد.');
        setTimeout(() => setGiftSuccess(null), 3000);
      } else {
        setGiftError('کلیپ‌بورد خالی است یا متن معتبری ندارد.');
        setTimeout(() => setGiftError(null), 3000);
      }
    } catch {
      setGiftError('دسترسی به کلیپ‌بورد امکان‌پذیر نشد. می‌توانید با کلیک‌راست یا Ctrl+V کانفیگ را بچسبانید.');
      setTimeout(() => setGiftError(null), 4000);
    }
  };

  const handleCreateGiftCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftConfigInput.trim()) {
      setGiftError('لطفاً متن کانفیگ را وارد کنید.');
      return;
    }
    setGiftSaving(true);
    setGiftError(null);
    setGiftSuccess(null);
    try {
      const res = await adminCreateGiftCode({
        code: giftCodeInput.trim() ? giftCodeInput.trim().toUpperCase() : undefined,
        config: giftConfigInput.trim(),
        title: giftTitleInput.trim(),
        protocol: giftProtocolInput,
        durationText: giftDurationInput.trim(),
        description: giftDescInput.trim(),
        maxUses: giftMaxUsesInput,
        batchCount: giftBatchCount,
        label: giftLabelInput.trim(),
      });
      setGiftSuccess(res.message || 'کد هدیه با موفقیت ایجاد شد.');
      setGiftConfigInput('');
      setGiftCodeInput('');
      setGiftBatchCount(1);
      setTimeout(() => setGiftSuccess(null), 3000);
      loadGiftCodes();
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Unexpected token') || msg.includes('JSON') || msg.includes('DOCTYPE')) {
        setGiftError('خطا در ارتباط با سرور. کد هدیه در حافظه محلی ذخیره گردید.');
      } else {
        setGiftError(msg || 'خطا در ایجاد کد هدیه');
      }
    } finally {
      setGiftSaving(false);
    }
  };

  const handleToggleBurnGift = async (id: string) => {
    try {
      await adminToggleBurnGiftCode(id);
      loadGiftCodes();
    } catch (err: any) {
      setGiftError(err.message || 'خطا در تغییر وضعیت کد هدیه');
    }
  };

  const handleDeleteGift = async (id: string) => {
    if (!confirm('آیا از حذف این کد هدیه اطمینان دارید؟')) return;
    try {
      await adminDeleteGiftCode(id);
      loadGiftCodes();
    } catch (err: any) {
      setGiftError(err.message || 'خطا در حذف کد هدیه');
    }
  };

  const handleClearUsedGifts = async () => {
    if (!confirm('آیا مایل به پاکسازی تمام کدهای هدیه مصرف‌شده یا منقضی شده هستید؟')) return;
    try {
      const res = await adminClearUsedGiftCodes();
      setGiftSuccess(res.message || 'کدهای مصرف‌شده پاکسازی شدند.');
      setTimeout(() => setGiftSuccess(null), 3000);
      loadGiftCodes();
    } catch (err: any) {
      setGiftError(err.message || 'خطا در پاکسازی کدهای مصرف‌شده');
    }
  };

  const handleCopyGiftCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedGiftCodeId(id);
    setTimeout(() => setCopiedGiftCodeId(null), 2500);
  };

  const handleCopyGiftConfig = (id: string, config: string) => {
    navigator.clipboard.writeText(config);
    setCopiedGiftConfigId(id);
    setTimeout(() => setCopiedGiftConfigId(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`relative w-full max-w-2xl sm:max-w-3xl rounded-3xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto ${language === 'fa' ? 'text-right' : 'text-left'}`}>
        <button
          onClick={onClose}
          className="absolute top-4 rtl:left-4 ltr:right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold text-white mb-1">
          {language === 'fa' ? 'تنظیمات پنل مدیریت' : 'Admin Panel Settings'}
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          {language === 'fa'
            ? 'مدیریت امنیت، پایداری و قفل جامع سایت، کانفیگ‌ها، کدهای هدیه، اعلانات و پیام‌ها'
            : 'Manage security, universal site freeze, configs, gift vouchers, announcements, and user messages'}
        </p>

        {/* Universal Lock Quick Status Banner */}
        <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-950 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${universalLock.isLocked ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white">
                  {language === 'fa' ? 'قفل ثبات و ضدتغییر کل سایت:' : 'Universal Site Freeze Lock:'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${universalLock.isLocked ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                  {universalLock.isLocked ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>{language === 'fa' ? 'فعال (تمام تغییرات فریز و ثابت شده‌اند)' : 'Active (All Settings Frozen)'}</span>
                    </>
                  ) : (
                    language === 'fa' ? 'غیرفعال' : 'Disabled'
                  )}
                </span>
                {universalLock.isLocked && (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {formatRemainingTime(remainingUniversalSeconds)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300/80 mt-0.5">
                {language === 'fa'
                  ? 'تمامی تنظیمات (کانفیگ‌ها، اطلاعیه، تلگرام، رمزها و کدهای هدیه) فریز شده و هرگز عوض نمی‌شوند.'
                  : 'All configs, announcements, support links, credentials, and vouchers are frozen.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setTab('masterLock');
              fetchUniversalLock();
            }}
            className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap self-stretch sm:self-auto ${
              tab === 'masterLock'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-extrabold'
                : 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{language === 'fa' ? 'تنظیمات قفل کل سایت' : 'Master Freeze'}</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-1 mb-5 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-[10px] sm:text-xs">
          <button
            onClick={() => {
              setTab('configs');
              fetchAdminConfigs();
            }}
            className={`py-2 px-1 rounded-lg font-bold flex items-center justify-center gap-1 transition-all relative ${
              tab === 'configs'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md ring-1 ring-cyan-400/40'
                : 'text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/40'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{language === 'fa' ? 'کانفیگ‌ها و تعمیر' : 'Configs & Fix'}</span>
            {adminConfigsList.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-cyan-400/30 text-cyan-200 text-[9px] font-bold flex items-center justify-center">
                {adminConfigsList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('users')}
            className={`py-2 px-1 rounded-lg font-medium flex items-center justify-center gap-1 transition-all relative ${
              tab === 'users'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'fa' ? 'کاربران / جیمیل' : 'Users & Gmail'}</span>
            {usersList.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 text-[9px] font-bold flex items-center justify-center">
                {usersList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setTab('masterLock');
              fetchUniversalLock();
            }}
            className={`py-2 px-1 rounded-lg font-bold flex items-center justify-center gap-1 transition-all relative ${
              tab === 'masterLock'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md ring-1 ring-emerald-400/40'
                : 'text-emerald-400 hover:text-emerald-200 hover:bg-emerald-950/40'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'fa' ? 'قفل کل سایت' : 'Master Lock'}</span>
            {universalLock.isLocked && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setTab('password')}
            className={`py-2 px-1 rounded-lg font-medium flex items-center justify-center gap-1 transition-all ${
              tab === 'password'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{language === 'fa' ? 'رمز عبور' : 'Password'}</span>
          </button>
          <button
            onClick={() => setTab('otp')}
            className={`py-2 px-1 rounded-lg font-medium flex items-center justify-center gap-1 transition-all ${
              tab === 'otp'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{language === 'fa' ? 'رمز OTP' : 'OTP Gate'}</span>
          </button>
          <button
            onClick={() => setTab('giftCodes')}
            className={`py-2 px-1 rounded-lg font-medium flex items-center justify-center gap-1 transition-all ${
              tab === 'giftCodes'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-purple-400'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>{language === 'fa' ? 'کدهای هدیه' : 'Gift Codes'}</span>
          </button>
          <button
            onClick={() => setTab('announcement')}
            className={`py-2 px-1 rounded-lg font-medium flex items-center justify-center gap-1 transition-all ${
              tab === 'announcement'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>{language === 'fa' ? 'اطلاعیه' : 'Notice'}</span>
          </button>
          <button
            onClick={() => setTab('support')}
            className={`py-2 px-1 rounded-lg font-medium flex items-center justify-center gap-1 transition-all ${
              tab === 'support'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>{language === 'fa' ? 'پشتیبانی' : 'Support'}</span>
          </button>
          <button
            onClick={() => setTab('messages')}
            className={`py-2 px-1 rounded-lg font-medium flex items-center justify-center gap-1 transition-all relative ${
              tab === 'messages'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{language === 'fa' ? 'پیام‌ها' : 'Messages'}</span>
            {currentUnreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {currentUnreadCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB 0: CONFIGS MANAGEMENT & AUTO-REPAIR */}
        {tab === 'configs' && (
          <div className="space-y-4 text-xs">
            {/* Header info */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/50 via-slate-900 to-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span>{language === 'fa' ? 'مدیریت، تغییر متنی و تعمیر کانفیگ‌ها' : 'Configs Management & Auto-Repair'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                      {adminConfigsList.length} {language === 'fa' ? 'سرور فعال' : 'Active'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {language === 'fa'
                      ? 'وقتی متن یا سرورها را تغییر دهید و ذخیره کنید، کانفیگ‌های سایت فوراً عوض می‌شوند. با گزینه‌های تعمیر نیز می‌توانید مشکلات قطعی را برطرف نمایید.'
                      : 'When you edit configs and save, site configs update instantly. Use the repair options to fix connection and syntax issues.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={fetchAdminConfigs}
                  disabled={configsLoading}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                  title="بارگذاری مجدد لیست از دیتابیس"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${configsLoading ? 'animate-spin' : ''}`} />
                  <span>{language === 'fa' ? 'بروزرسانی' : 'Reload'}</span>
                </button>
              </div>
            </div>

            {/* Direct GitHub Bundle Download Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/40 shadow-lg shadow-emerald-950/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-white text-xs flex items-center gap-2">
                    <span>{language === 'fa' ? 'دریافت فایل خروجی کامل index.html برای گیت‌هاب' : 'Download Complete index.html for GitHub'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                      {language === 'fa' ? 'حاوی تمام کانفیگ‌ها و کدهای هدیه' : 'All Configs Included'}
                    </span>
                  </h5>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {language === 'fa'
                      ? 'این فایل تمام کانفیگ‌های فعال، کدهای هدیه و تنظیمات فعلی را درون خود دارد. کافیست آن را دانلود کرده و در ریپازیتوری گیت‌هاب با نام index.html آپلود کنید.'
                      : 'Self-contained bundle with all active configs and vouchers. Upload directly to GitHub repository as index.html.'}
                  </p>
                </div>
              </div>
              <a
                href="/download-github-index"
                download="index.html"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/50 flex items-center justify-center gap-1.5 shrink-0 active:scale-95 border border-emerald-400/30"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'fa' ? 'دانلود فایل جدید index.html' : 'Download index.html'}</span>
              </a>
            </div>

            {/* Error and Success alerts */}
            {configsError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{configsError}</span>
              </div>
            )}
            {configsSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{configsSuccess}</span>
              </div>
            )}

            {/* CONFIG LOCK & STABILITY MECHANISM ("همون گزینه که داخل مدیر درست کردی یک کارش کن که چند ساعت دیگه تغییر نکنه") */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-emerald-950/40 border border-indigo-500/40 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-indigo-200 text-xs">
                        {language === 'fa' ? 'قفل ثبات و ضد تغییر کانفیگ‌ها (فریز زمان‌دار یا دائم)' : 'Config Lock & Anti-Change Stability'}
                      </h5>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        isLockEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}>
                        {isLockEnabled
                          ? (language === 'fa' ? '🔒 قفل فعال است' : '🔒 Locked')
                          : (language === 'fa' ? '🔓 قفل غیرفعال' : '🔓 Unlocked')}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {language === 'fa'
                        ? 'جلوگیری قطعی از تغییر، انقضا یا بازنشانی کانفیگ‌ها تا چند ساعت آینده یا به صورت دائمی'
                        : 'Prevent accidental changes, expiration or resets for a specified number of hours or permanently'}
                    </span>
                  </div>
                </div>

                {/* Quick Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isLockEnabled}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setIsLockEnabled(next);
                      handleUpdateLockOnly(next);
                    }}
                    disabled={lockUpdating}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 border border-slate-700"></div>
                  <span className="ms-2 text-xs font-medium text-slate-300">
                    {isLockEnabled
                      ? (language === 'fa' ? 'قفل فعال' : 'Active')
                      : (language === 'fa' ? 'قفل خاموش' : 'Inactive')}
                  </span>
                </label>
              </div>

              {/* Status Badge */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-slate-300 font-medium">
                    {language === 'fa' ? 'مدت اعتبار قفل عدم تغییر:' : 'Lock Duration:'}
                  </span>
                  <span className="font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-800/60">
                    {selectedLockHours === 0
                      ? (language === 'fa' ? 'دائمی (همیشگی - بدون تغییر)' : 'Permanent (Never changes)')
                      : `${selectedLockHours} ${language === 'fa' ? 'ساعت' : 'Hours'}`}
                  </span>
                </div>

                {isLockEnabled && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                    <span>{language === 'fa' ? 'زمان باقی‌مانده:' : 'Time remaining:'}</span>
                    <span className="font-bold font-mono">{formatRemainingTime(remainingLockSeconds)}</span>
                  </div>
                )}
              </div>

              {/* Duration selector chips */}
              <div className="space-y-2">
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{language === 'fa' ? 'تنظیم مدت زمان قفل (چند ساعت تغییر نکند؟):' : 'Select lock duration (how many hours to freeze?):'}</span>
                  {lockSuccess && <span className="text-emerald-400 font-medium">{lockSuccess}</span>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                  {[
                    { hours: 0, labelFa: 'دائمی (همیشگی)', labelEn: 'Permanent' },
                    { hours: 6, labelFa: '۶ ساعت', labelEn: '6 Hours' },
                    { hours: 12, labelFa: '۱۲ ساعت', labelEn: '12 Hours' },
                    { hours: 24, labelFa: '۲۴ ساعت (۱ روز)', labelEn: '24 Hours' },
                    { hours: 48, labelFa: '۴۸ ساعت (۲ روز)', labelEn: '48 Hours' },
                    { hours: 72, labelFa: '۷۲ ساعت (۳ روز)', labelEn: '72 Hours' },
                    { hours: 168, labelFa: '۱ هفته (۷ روز)', labelEn: '1 Week' },
                  ].map((item) => {
                    const isSelected = selectedLockHours === item.hours;
                    return (
                      <button
                        key={item.hours}
                        type="button"
                        onClick={() => {
                          setSelectedLockHours(item.hours);
                          if (isLockEnabled) {
                            handleUpdateLockOnly(true, item.hours);
                          }
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all text-center border ${
                          isSelected
                            ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white border-cyan-400/60 shadow-sm shadow-indigo-600/30 font-bold'
                            : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {language === 'fa' ? item.labelFa : item.labelEn}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Informative notice */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✔</span>
                  <span>
                    {language === 'fa'
                      ? 'کانفیگ‌های شما در فایل پشتیبان دیسک ایزوله شده‌اند و حتی با ریست سرور یا گذر چند ساعت هرگز تغییر نخواهند کرد.'
                      : 'Your configs are backed up and frozen; they will not change even after server restarts or hours pass.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateLockOnly(isLockEnabled, selectedLockHours)}
                  disabled={lockUpdating}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition-colors flex items-center justify-center gap-1 shrink-0 disabled:opacity-50"
                >
                  <Lock className={`w-3 h-3 ${lockUpdating ? 'animate-spin' : ''}`} />
                  <span>{lockUpdating ? (language === 'fa' ? 'در حال ثبت...' : 'Updating...') : (language === 'fa' ? 'ثبت و تمدید قفل' : 'Apply Lock')}</span>
                </button>
              </div>
            </div>

            {/* QUICK FIX & REPAIR TOOLBOX ("گزینه ای بزار درست بشه") */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-900/90 to-cyan-950/30 border border-amber-500/40 shadow-xl">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-amber-300 text-xs">
                      {language === 'fa' ? 'ابزارهای درست‌سازی و تعمیر کانفیگ‌ها' : 'Server Fix & Repair Tools'}
                    </h5>
                    <span className="text-[10px] text-slate-400">
                      {language === 'fa' ? 'جهت رفع خطای اتصال، کاراکترهای مخفی و احیای سرورها' : 'Fix syntax errors, invisible zero-width chars, and restore servers'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Button 1: Auto Repair & Clean */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 flex flex-col justify-between gap-2.5 hover:border-amber-400/50 transition-all">
                  <div>
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>{language === 'fa' ? '۱. تعمیر و درست‌سازی خودکار' : '1. Auto-Repair & Clean'}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {language === 'fa'
                        ? 'حذف کاراکترهای مخفی و نامرئی (Zero-width/RTL)، تصحیح هش عناوین، بهینه‌سازی پینگ‌ها و فعال‌سازی مجدد تمام کانفیگ‌ها.'
                        : 'Cleans invisible control characters, fixes remark hashing, optimizes pings, and activates all configs.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoRepairConfigs}
                    disabled={configsRepairing}
                    className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Wrench className={`w-3.5 h-3.5 ${configsRepairing ? 'animate-spin' : ''}`} />
                    <span>{configsRepairing ? (language === 'fa' ? 'در حال درست‌سازی...' : 'Repairing...') : (language === 'fa' ? 'تعمیر و درست‌سازی خودکار کانفیگ‌ها' : 'Auto-Repair All Configs')}</span>
                  </button>
                </div>

                {/* Button 2: Restore Working Verified Configs */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex flex-col justify-between gap-2.5 hover:border-cyan-400/50 transition-all">
                  <div>
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs mb-1">
                      <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{language === 'fa' ? '۲. بازنشانی کانفیگ‌های سالم و پرسرعت' : '2. Restore Verified Working Configs'}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {language === 'fa'
                        ? 'اگر کانفیگ‌ها قطع شده‌اند، فوراً مجموعه کانفیگ‌های سالم، بدون قطعی و تست‌شده B4G (آلمان، هلند، فنلاند و...) جایگزین می‌شوند.'
                        : 'Replaces all configs with guaranteed fresh, working, high-speed verified servers.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRestoreWorkingConfigs}
                    disabled={configsRestoring}
                    className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${configsRestoring ? 'animate-spin' : ''}`} />
                    <span>{configsRestoring ? (language === 'fa' ? 'در حال بازنشانی...' : 'Restoring...') : (language === 'fa' ? 'جایگزینی با کانفیگ‌های سالم و تست‌شده' : 'Restore Working Configs')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* EDIT & CHANGE CONFIGS ("وقتی تغییر می دم کانفیگ هاش تغییر کنه") */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                    <h5 className="font-bold text-white text-xs">
                      {language === 'fa' ? 'ویرایش و تعویض کانفیگ‌های سایت' : 'Edit & Change Site Configs'}
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {language === 'fa'
                      ? 'هر تغییری در متن کانفیگ‌ها ایجاد کنید، با زدن دکمه زیر مستقیماً روی سایت اعمال و تغییر می‌کند.'
                      : 'Any changes made to configs below will apply to the live site immediately after saving.'}
                  </p>
                </div>

                <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setConfigViewMode('bulk')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      configViewMode === 'bulk'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {language === 'fa' ? 'ویرایشگر متنی یکجا' : 'Bulk Editor'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfigViewMode('list')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      configViewMode === 'list'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {language === 'fa' ? 'مدیریت تکی' : 'Single List'} ({adminConfigsList.length})
                  </button>
                </div>
              </div>

              {configViewMode === 'bulk' ? (
                <div className="space-y-3">
                  <div className="relative">
                    <textarea
                      value={configsBulkText}
                      onChange={(e) => setConfigsBulkText(e.target.value)}
                      dir="ltr"
                      rows={10}
                      placeholder="vless://...&#10;vmess://...&#10;trojan://...&#10;ss://..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-emerald-300 font-mono text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 leading-relaxed shadow-inner"
                    />
                    <div className="absolute bottom-3 rtl:left-3 ltr:right-3 flex items-center gap-2 bg-slate-950/90 px-2 py-1 rounded-md border border-slate-800 text-[10px] text-slate-400 font-mono">
                      <span>
                        {configsBulkText.split('\n').filter((l) => l.trim().length > 6).length} {language === 'fa' ? 'کانفیگ شناسایی شد' : 'configs detected'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-indigo-500/40 transition-all select-none">
                        <input
                          type="checkbox"
                          checked={isLockEnabled}
                          onChange={(e) => setIsLockEnabled(e.target.checked)}
                          className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-0 focus:ring-offset-0"
                        />
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>
                          {language === 'fa' ? 'فعال‌سازی قفل عدم تغییر برای' : 'Enable freeze lock for'}
                        </span>
                        <select
                          value={selectedLockHours}
                          onChange={(e) => setSelectedLockHours(Number(e.target.value))}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-slate-950 text-indigo-300 text-[11px] font-bold px-2 py-0.5 rounded border border-slate-700 focus:outline-none focus:border-indigo-500"
                        >
                          <option value={0}>{language === 'fa' ? 'دائمی (همیشگی)' : 'Permanent'}</option>
                          <option value={6}>{language === 'fa' ? '۶ ساعت' : '6 Hours'}</option>
                          <option value={12}>{language === 'fa' ? '۱۲ ساعت' : '12 Hours'}</option>
                          <option value={24}>{language === 'fa' ? '۲۴ ساعت (۱ روز)' : '24 Hours'}</option>
                          <option value={48}>{language === 'fa' ? '۴۸ ساعت (۲ روز)' : '48 Hours'}</option>
                          <option value={72}>{language === 'fa' ? '۷۲ ساعت (۳ روز)' : '72 Hours'}</option>
                          <option value={168}>{language === 'fa' ? '۱ هفته' : '1 Week'}</option>
                        </select>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveConfigsBulk}
                      disabled={configsSaving}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                    >
                      <Check className={`w-4 h-4 ${configsSaving ? 'animate-spin' : ''}`} />
                      <span>{configsSaving ? (language === 'fa' ? 'در حال اعمال در سایت...' : 'Applying...') : (language === 'fa' ? 'ذخیره، قفل و اعمال تغییرات در سایت' : 'Save, Lock & Apply to Site')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {adminConfigsList.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      {language === 'fa' ? 'هیچ کانفیگی یافت نشد.' : 'No configs found.'}
                    </div>
                  ) : (
                    adminConfigsList.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs hover:border-slate-700 transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white truncate max-w-xs">{c.title}</span>
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono uppercase">
                              {c.protocol}
                            </span>
                            <span className="text-[10px] text-slate-400">{c.countryName || c.countryCode}</span>
                            <span className="text-[10px] text-emerald-400 font-mono">{c.pingMs || 65}ms</span>
                            {c.isPinned && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                                {language === 'fa' ? 'پین‌شده' : 'Pinned'}
                              </span>
                            )}
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                c.isActive
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {c.isActive ? (language === 'fa' ? 'فعال' : 'Active') : (language === 'fa' ? 'مخفی' : 'Hidden')}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 truncate max-w-md" dir="ltr">
                            {c.config}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleTogglePinConfig(c)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              c.isPinned
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                            }`}
                            title={c.isPinned ? 'برداشتن پین' : 'پین کردن در بالا'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleActiveConfig(c)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              c.isActive
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            }`}
                            title={c.isActive ? 'مخفی کردن از دید کاربران' : 'فعال و نمایان کردن'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteConfigFromList(c.id, c.title)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-colors"
                            title="حذف کانفیگ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 1: PASSWORD */}
        {tab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
            {!defaultPasswordChanged && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">هشدار امنیتی:</span>
                  <span>
                    شما در حال استفاده از رمز عبور پیش‌فرض (<code>admin123</code>) هستید. لطفاً برای جلوگیری از دسترسی دیگران، همین حالا یک رمز قوی تنظیم کنید.
                  </span>
                </div>
              </div>
            )}

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {passwordError}
              </div>
            )}

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                رمز عبور فعلی:
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                dir="ltr"
                placeholder="رمز عبور فعلی خود را وارد کنید"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                رمز عبور جدید:
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                dir="ltr"
                placeholder="رمز جدید (حداقل ۴ نویسه)"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                تکرار رمز عبور جدید:
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                dir="ltr"
                placeholder="تکرار رمز عبور جدید"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-medium transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2"
            >
              {passwordLoading ? (
                <span>در حال ثبت رمز جدید...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>ذخیره رمز عبور جدید</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: OTP & ACCESS CONTROL */}
        {tab === 'otp' && (
          <div className="space-y-5 text-xs">
            {otpError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {otpError}
              </div>
            )}

            {otpSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{otpSuccess}</span>
              </div>
            )}

            {/* Sub-section 1: General Gate Settings */}
            <form onSubmit={handleSaveAccessConfig} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="font-bold text-slate-200 flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  تنظیمات قفل ورود به سایت (OTP Gate)
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${accessEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                  {accessEnabled ? 'قفل فعال است' : 'قفل غیرفعال است'}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="access-enabled"
                  checked={accessEnabled}
                  onChange={(e) => setAccessEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="access-enabled" className="text-slate-300 cursor-pointer font-medium">
                  فعال بودن قفل رمز یکبار مصرف (هرکس بخواهد وارد شود باید رمز بزند)
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">
                    رمز مستر اضطراری (Bypass Master Code):
                  </label>
                  <input
                    type="text"
                    value={masterCode}
                    onChange={(e) => setMasterCode(e.target.value)}
                    dir="ltr"
                    placeholder="B4G2026"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">همیشه معتبر و برای دسترسی سریع</span>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">
                    مدت ماندگاری ورود کاربر (ساعت):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="720"
                    value={sessionDurationHours}
                    onChange={(e) => setSessionDurationHours(Number(e.target.value))}
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">مدت زمانی که کاربر پس از ورود نیاز به وارد کردن مجدد رمز ندارد</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="allow-self-request"
                  checked={allowSelfRequest}
                  onChange={(e) => setAllowSelfRequest(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="allow-self-request" className="text-slate-300 cursor-pointer text-[11px]">
                  اجازه صدور مستقیم رمز آزمایشی برای بازدیدکنندگان در صفحه قفل
                </label>
              </div>

              <button
                type="submit"
                disabled={otpSaving}
                className="w-full py-2 px-3 rounded-xl bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white font-medium transition-all flex items-center justify-center gap-1.5"
              >
                {otpSaving ? 'در حال ذخیره...' : 'ذخیره وضعیت و تنظیمات قفل'}
              </button>
            </form>

            {/* Sub-section 2: Generate New OTPs */}
            <form onSubmit={handleGenerateOtps} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="font-bold text-slate-200 flex items-center gap-1.5 text-sm pb-1 border-b border-slate-800/80">
                <Plus className="w-4 h-4 text-cyan-400" />
                تولید رمزهای یکبار مصرف جدید
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">تعداد کد:</label>
                  <select
                    value={genCount}
                    onChange={(e) => setGenCount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                  >
                    <option value={1}>۱ کد</option>
                    <option value={3}>۳ کد</option>
                    <option value={5}>۵ کد</option>
                    <option value={10}>۱۰ کد</option>
                    <option value={20}>۲۰ کد</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">نوع قالب کد:</label>
                  <select
                    value={genType}
                    onChange={(e) => setGenType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                  >
                    <option value="numeric">۶ رقمی عددی</option>
                    <option value="prefix">پیشوند دار (B4G-XXXX)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">حداکثر دفعات استفاده:</label>
                  <select
                    value={genMaxUses}
                    onChange={(e) => setGenMaxUses(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                  >
                    <option value={1}>۱ بار (تک‌کاربره)</option>
                    <option value={3}>۳ بار</option>
                    <option value={5}>۵ بار</option>
                    <option value={100}>عمومی (۱۰۰ بار)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">مدت اعتبار:</label>
                  <select
                    value={genValidityHours}
                    onChange={(e) => setGenValidityHours(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                  >
                    <option value={24}>۲۴ ساعت</option>
                    <option value={48}>۴۸ ساعت</option>
                    <option value={168}>۱ هفته</option>
                    <option value={0}>بدون انقضا</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-[11px]">برچسب یا یادداشت:</label>
                <input
                  type="text"
                  value={genLabel}
                  onChange={(e) => setGenLabel(e.target.value)}
                  placeholder="مثلا: ارسال به کانال تلگرام @B4GHUB"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={otpSaving}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40"
              >
                <Sparkles className="w-4 h-4" />
                <span>تولید و دریافت رمزهای یکبار مصرف</span>
              </button>

              {/* Banner for newly generated codes */}
              {newlyGenerated.length > 0 && (
                <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-300 font-bold text-xs flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      کدهای تولید شده جدید ({newlyGenerated.length} عدد):
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAllNewlyGenerated}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium flex items-center gap-1 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedAllGen ? 'همه کپی شدند!' : 'کپی همه برای تلگرام'}</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                    {newlyGenerated.map((item) => (
                      <span key={item.id} className="px-2 py-1 bg-slate-900/90 border border-emerald-500/30 text-cyan-300 rounded font-bold">
                        {item.code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </form>

            {/* Sub-section 3: Existing OTPs List */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                <span className="font-bold text-slate-200 flex items-center gap-1.5 text-sm">
                  <Key className="w-4 h-4 text-cyan-400" />
                  لیست کدهای رمز فعال و مصرف‌شده ({otps.length})
                </span>
                <button
                  type="button"
                  onClick={handleClearUsedOtps}
                  className="text-[11px] text-slate-400 hover:text-rose-300 bg-slate-900 hover:bg-rose-950/50 border border-slate-700/60 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                  title="حذف کدهایی که استفاده یا منقضی شده‌اند"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>پاکسازی مصرف‌شده‌ها</span>
                </button>
              </div>

              {otpLoading ? (
                <div className="text-center py-6 text-slate-400 text-xs">در حال بارگذاری لیست کدهای OTP...</div>
              ) : otps.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  هیچ کد رمزی در سیستم ثبت نشده است. با فرم بالا رمز جدید بسازید.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {otps.map((otp) => {
                    const isBurned = otp.isBurned || otp.usedCount >= otp.maxUses;
                    const isExpired = otp.expiresAt && new Date(otp.expiresAt).getTime() < Date.now();
                    const isValid = !isBurned && !isExpired;

                    return (
                      <div
                        key={otp.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                          isValid
                            ? 'bg-slate-900/80 border-slate-700/80 hover:border-cyan-500/40'
                            : 'bg-slate-950/50 border-slate-800/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleCopySingleOtp(otp.id, otp.code)}
                            className="font-mono text-sm font-bold text-cyan-300 hover:text-cyan-200 bg-slate-950 px-2 py-1 rounded border border-cyan-500/30 flex items-center gap-1"
                            title="کپی این کد"
                          >
                            <span>{otp.code}</span>
                            <Copy className="w-3 h-3 opacity-60" />
                          </button>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                  isValid
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                    : isBurned
                                    ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                                    : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                }`}
                              >
                                {isValid ? 'آماده استفاده' : isBurned ? 'مصرف شده' : 'منقضی شده'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({otp.usedCount}/{otp.maxUses} بار استفاده)
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 block truncate max-w-[180px]">
                              {otp.label || 'کد ورود'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {copiedOtpId === otp.id && (
                            <span className="text-[10px] text-emerald-400">کپی شد!</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteOtp(otp.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="حذف این کد"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}


        {/* TAB 2: ANNOUNCEMENT */}
        {tab === 'announcement' && (
          <form onSubmit={handleAnnouncementSubmit} className="space-y-4 text-xs">
            {annError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {annError}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ann-enabled"
                checked={annEnabled}
                onChange={(e) => setAnnEnabled(e.target.checked)}
                className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500 bg-slate-950"
              />
              <label htmlFor="ann-enabled" className="text-slate-200 cursor-pointer font-medium">
                نمایش بنر پیام در بالای پنل برای تمام کاربران
              </label>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                متن پیام اطلاعیه:
              </label>
              <textarea
                rows={3}
                value={annText}
                onChange={(e) => setAnnText(e.target.value)}
                placeholder="متن پیام خود به کاربران را بنویسید..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                نوع و رنگ اعلان:
              </label>
              <select
                value={annType}
                onChange={(e) => setAnnType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="info">اطلاع‌رسانی آبی (Info)</option>
                <option value="success">سبز موفقیت‌آمیز (Success)</option>
                <option value="warning">هشدار زرد/نارنجی (Warning)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={annLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-medium transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2"
            >
              {annLoading ? (
                <span>در حال ذخیره...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>ذخیره اطلاعیه</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 3: SUPPORT CONFIG */}
        {tab === 'support' && (
          <form onSubmit={handleSupportConfigSubmit} className="space-y-4 text-xs">
            {supportError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                {supportError}
              </div>
            )}

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                آیدی تلگرام پشتیبان (جهت چت مستقیم):
              </label>
              <input
                type="text"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                dir="ltr"
                placeholder="@my_support_id"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                کاربران با کلیک روی دکمه پشتیبانی مستقیماً به این آیدی هدایت می‌شوند.
              </span>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                لینک کانال تلگرام:
              </label>
              <input
                type="text"
                value={telegramChannel}
                onChange={(e) => setTelegramChannel(e.target.value)}
                dir="ltr"
                placeholder="https://t.me/B4GHUB"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  ایمیل پشتیبان (اختیاری):
                </label>
                <input
                  type="text"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  dir="ltr"
                  placeholder="support@example.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  تلفن / واتساپ (اختیاری):
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                  placeholder="+98 912..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                پیام سفارشی به کاربران در پنجره پشتیبانی:
              </label>
              <textarea
                rows={2}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="توضیحات کوتاه یا ساعات پاسخگویی پشتیبان..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={supportLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-medium transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2"
            >
              {supportLoading ? (
                <span>در حال ذخیره...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>ذخیره تنظیمات پشتیبانی</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 4: USER MESSAGES / REPORTS */}
        {tab === 'messages' && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <button
                type="button"
                onClick={loadMessages}
                disabled={messagesLoading}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 text-[11px] px-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${messagesLoading ? 'animate-spin' : ''}`} />
                <span>بروزرسانی</span>
              </button>
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <span>{messages.length} پیام دریافتی</span>
                {currentUnreadCount > 0 && (
                  <span className="text-rose-400 font-semibold">({currentUnreadCount} خوانده نشده)</span>
                )}
              </div>
            </div>

            {messagesLoading && messages.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-500" />
                <span>در حال دریافت پیام‌های کاربران...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-1">
                <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-300">هیچ پیام یا گزارشی ارسال نشده است</p>
                <p className="text-[11px] text-slate-500">پیام‌ها و گزارش‌های کاربران در اینجا نمایش داده خواهند شد.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pl-1">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      msg.isRead
                        ? 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                        : 'bg-slate-800/80 border-cyan-500/30 text-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleRead(msg.id)}
                          className={`p-1 rounded-lg transition-colors ${
                            msg.isRead
                              ? 'text-slate-500 hover:text-cyan-400'
                              : 'text-cyan-400 hover:text-slate-400'
                          }`}
                          title={msg.isRead ? 'علامت به عنوان خوانده‌نشده' : 'علامت به عنوان خوانده‌شده'}
                        >
                          <CheckCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                          title="حذف پیام"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(msg.createdAt).toLocaleDateString('fa-IR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {getCategoryBadge(msg.category)}
                      </div>
                    </div>

                    {msg.configTitle && (
                      <div className="text-[11px] text-cyan-300/90 mb-1">
                        کانفیگ مرتبط: <span className="font-semibold text-white">{msg.configTitle}</span>
                      </div>
                    )}

                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line mb-2">
                      {msg.message}
                    </p>

                    {msg.userContact && msg.userContact !== 'ناشناس' && (
                      <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-mono" dir="ltr">
                          {msg.userContact}
                        </span>
                        <span className="text-slate-500">اطلاعات تماس فرستنده:</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: UNIVERSAL MASTER LOCK (ثبات دائمی و ضدتغییر تمام بخش‌ها) */}
        {tab === 'masterLock' && (
          <div className="space-y-5 text-xs animate-fade-in">
            {/* Header Hero Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/40 text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-950/40">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-white text-sm sm:text-base">
                      {language === 'fa' ? 'قفل جامع ثبات و ضدتغییر کل سایت' : 'Universal Site Freeze & Master Lock'}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${universalLock.isLocked ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                      {universalLock.isLocked ? (language === 'fa' ? '🛡️ منجمد و محافظت‌شده' : 'Protected & Frozen') : (language === 'fa' ? 'قفل غیرفعال' : 'Disabled')}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 leading-relaxed max-w-2xl">
                    {language === 'fa'
                      ? 'با این قابلیت، تمام تنظیماتی که در پنل مدیریت عوض می‌کنید (کانفیگ‌های فعال، متن اطلاعیه، تلگرام پشتیبانی، رمز ورود مدیریت، کدهای OTP و کدهای هدیه) در سرور فریز شده و تا زمانی که خودتان مجدداً ویرایش نکنید، تحت هیچ شرایطی تغییر نخواهند کرد.'
                      : 'Freezes and protects all site settings (configs, announcement banner, telegram support, admin password, OTPs, and gift codes) on the server so they never reset or change automatically.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Notifications */}
            {universalMsg && (
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2 text-xs transition-all ${
                  universalMsg.type === 'success'
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {universalMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="font-medium">{universalMsg.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUniversalMsg(null)}
                  className="p-1 hover:opacity-75"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* SECTION 1: Master Lock Settings */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  {language === 'fa' ? 'تنظیم وضعیت قفل و زمان انقضا' : 'Lock Status & Duration'}
                </span>
                {universalLock.isLocked && (
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    {language === 'fa' ? 'زمان باقیمانده: ' : 'Remaining: '}
                    {formatRemainingTime(remainingUniversalSeconds)}
                  </span>
                )}
              </div>

              {/* Lock Toggle */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <input
                  type="checkbox"
                  id="universal-lock-toggle"
                  checked={isUniversalLockEnabled}
                  onChange={(e) => setIsUniversalLockEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="universal-lock-toggle" className="text-slate-200 cursor-pointer font-bold text-xs flex-1">
                  {language === 'fa'
                    ? 'فعال بودن قفل جامع ثبات (هیچ تنظیمی در سایت بدون تایید و تغییر دستی شما عوض نشود)'
                    : 'Enable Universal Site Freeze Lock (Prevent all automated resets and keep custom settings)'}
                </label>
              </div>

              {/* Duration Selector */}
              {isUniversalLockEnabled && (
                <div className="space-y-2 pt-1">
                  <label className="block text-slate-300 font-medium text-[11px]">
                    {language === 'fa' ? 'مدت زمان پایداری قفل (انتخاب کنید):' : 'Lock Duration:'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { hours: 0, label: 'دائمی (بدون انقضا) ⭐️' },
                      { hours: 24, label: '۲۴ ساعت (۱ روز)' },
                      { hours: 72, label: '۷۲ ساعت (۳ روز)' },
                      { hours: 168, label: '۱ هفته (۷ روز)' },
                      { hours: 720, label: '۳۰ روز (۱ ماه)' },
                    ].map((opt) => (
                      <button
                        key={opt.hours}
                        type="button"
                        onClick={() => setSelectedUniversalHours(opt.hours)}
                        className={`p-2.5 rounded-xl text-center text-xs font-bold transition-all border ${
                          selectedUniversalHours === opt.hours
                            ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950/40'
                            : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 pt-1">
                    {language === 'fa'
                      ? 'توصیه: گزینه «دائمی» تمام تنظیمات را تا زمان تغییر بعدی توسط خودتان ثابت نگه می‌دارد.'
                      : 'Recommendation: "Permanent" keeps everything locked until you manually update it.'}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSaveUniversalLock}
                disabled={universalUpdating}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40"
              >
                {universalUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{language === 'fa' ? 'در حال ثبت تنظیمات قفل...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{language === 'fa' ? 'ذخیره و اعمال تنظیمات قفل جامع' : 'Apply Universal Lock'}</span>
                  </>
                )}
              </button>
            </div>

            {/* SECTION 2: Master Snapshot Actions */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  {language === 'fa' ? 'اسنپ‌شات و فریز فیزیکی سرور' : 'Master Snapshot & Backup'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {language === 'fa' ? 'ذخیره مستقل و دائمی در سرور' : 'Independent persistent copy'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Save Master Snapshot */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex flex-col justify-between gap-3">
                  <div>
                    <span className="font-bold text-white text-xs block mb-1 flex items-center gap-1.5">
                      <Save className="w-3.5 h-3.5 text-emerald-400" />
                      {language === 'fa' ? 'فریز فوری تمام تنظیمات فعلی' : 'Create Master Snapshot'}
                    </span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {language === 'fa'
                        ? 'کلیه کانفیگ‌ها، متن اطلاعیه، تلگرام پشتیبانی، رمز مدیریت، کدهای هدیه و OTP در یک فایل نسخه فریز شده مستقل سرور ثبت دائمی می‌شوند.'
                        : 'Stores a master snapshot file of all current configs, announcement, support config, credentials and vouchers on disk.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateSnapshot}
                    disabled={snapshotSaving}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow"
                  >
                    {snapshotSaving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{language === 'fa' ? 'فریز و ثبت دائمی در سرور' : 'Freeze & Snapshot Now'}</span>
                  </button>
                </div>

                {/* Restore Snapshot */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex flex-col justify-between gap-3">
                  <div>
                    <span className="font-bold text-white text-xs block mb-1 flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                      {language === 'fa' ? 'بازیابی از آخرین نسخه فریز شده' : 'Restore from Snapshot'}
                    </span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {language === 'fa'
                        ? 'در صورت هرگونه اشتباه یا تغییر ناخواسته، با این دکمه تمام اطلاعات سایت دقیقاً به نسخه ذخیره شده قبلی برمی‌گردند.'
                        : 'Instantly rolls back all site configurations, announcements, support info and vouchers to the master frozen state.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRestoreSnapshot}
                    disabled={snapshotRestoring}
                    className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow"
                  >
                    {snapshotRestoring ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    <span>{language === 'fa' ? 'بازیابی کامل اطلاعات' : 'Restore from Snapshot'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 3: Live Protected Settings Inspector */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  {language === 'fa' ? 'گزارش زنده بخش‌های محافظت‌شده در سایت' : 'Protected Site Settings Inventory'}
                </span>
                <button
                  type="button"
                  onClick={fetchUniversalLock}
                  className="p-1 rounded text-slate-400 hover:text-white"
                  title="تازه‌سازی وضعیت"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Item 1: Configs */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-cyan-400" />
                      کانفیگ‌های فعال:
                    </span>
                    <span className="text-white font-bold font-mono text-xs">
                      {snapshotDetails?.totalConfigs ?? adminConfigsList.length} سرور
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-400">محافظت شده و ضدریست</p>
                </div>

                {/* Item 2: Announcement */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Megaphone className="w-3 h-3 text-amber-400" />
                      اطلاعیه سایت:
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${announcement.enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                      {announcement.enabled ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 truncate" title={announcement.text || 'بدون متن'}>
                    {announcement.text ? announcement.text : 'بدون متن اطلاعیه'}
                  </p>
                </div>

                {/* Item 3: Support */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Headphones className="w-3 h-3 text-blue-400" />
                      پشتیبانی تلگرام:
                    </span>
                    <span className="text-white font-mono text-xs">
                      {supportConfig?.telegramId ? `@${supportConfig.telegramId.replace('@', '')}` : 'تنظیم نشده'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    کانال: {supportConfig?.telegramChannel ? supportConfig.telegramChannel : 'ندارد'}
                  </p>
                </div>

                {/* Item 4: OTP */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-purple-400" />
                      کدهای ورود (OTP):
                    </span>
                    <span className="text-white font-bold font-mono text-xs">
                      {snapshotDetails?.totalOtps ?? otps.length} کد
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-400">محافظت شده در برابر پاک شدن</p>
                </div>

                {/* Item 5: Gift codes */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Gift className="w-3 h-3 text-rose-400" />
                      کدهای هدیه:
                    </span>
                    <span className="text-white font-bold font-mono text-xs">
                      {snapshotDetails?.totalGiftCodes ?? giftCodes.length} کد
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">کدهای ووچر پشتیبانی</p>
                </div>

                {/* Item 6: Password */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-400" />
                      رمز عبور مدیریت:
                    </span>
                    <span className="text-emerald-400 font-bold text-[10px]">
                      {defaultPasswordChanged ? 'اختصاصی شما' : 'پیش‌فرض'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">فریز شده در اسنپ‌شات</p>
                </div>
              </div>

              {snapshotDetails?.lastSnapshotAt && (
                <div className="pt-2 text-[10px] text-slate-500 text-center">
                  تاریخ و ساعت آخرین فریز سرور:{' '}
                  <span className="font-mono text-slate-400" dir="ltr">
                    {new Date(snapshotDetails.lastSnapshotAt).toLocaleString('fa-IR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: TEST CONFIG (ADMIN EXCLUSIVE) */}
        {tab === 'testConfig' && (
          <div className="space-y-5 text-xs">
            {/* Exclusive Security Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-950 border border-amber-500/40 text-amber-200 flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">
                    مخزن و تنظیمات کانفیگ تست (اختصاصی فقط مدیریت)
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                    فقط من
                  </span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  فقط شما به عنوان مدیر سیستم حق ثبت یا تغییر کانفیگ تست را دارید. کاربران عادی تنها می‌توانند برای تست سرعت و اتصال،{' '}
                  <strong className="text-white font-bold">دقیقاً یک بار</strong> کانفیگ تست دریافت نمایند.
                </p>
              </div>
            </div>

            {testLoading && (
              <div className="py-6 flex items-center justify-center gap-2 text-slate-400 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>در حال دریافت اطلاعات مخزن تست...</span>
              </div>
            )}

            {testError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                <span>{testError}</span>
                <button onClick={() => setTestError(null)} className="text-rose-400 hover:text-rose-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {testSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  {testSuccess}
                </span>
                <button onClick={() => setTestSuccess(null)} className="text-emerald-400 hover:text-emerald-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* General Test Settings Form */}
            <form onSubmit={handleSaveTestSettings} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white text-xs">تنظیمات کلی کانفیگ تست</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testEnabled}
                    onChange={(e) => setTestEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                  <span className="mr-2 text-[11px] font-medium text-slate-300">
                    {testEnabled ? 'ارائه تست فعال است' : 'ارائه تست غیرفعال'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-[11px] mb-1 font-medium">
                    عنوان تست:
                  </label>
                  <input
                    type="text"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    placeholder="مثال: کانفیگ تست اختصاصی B4G"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-[11px] mb-1 font-medium">
                    پروتکل:
                  </label>
                  <input
                    type="text"
                    value={testProtocol}
                    onChange={(e) => setTestProtocol(e.target.value)}
                    placeholder="VLESS, VMESS, Trojan..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs uppercase font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-[11px] mb-1 font-medium">
                    اعتبار زمان و حجم:
                  </label>
                  <input
                    type="text"
                    value={testDurationText}
                    onChange={(e) => setTestDurationText(e.target.value)}
                    placeholder="مثال: تست ۲ ساعته - حجم ۱ گیگابایت"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-[11px] mb-1 font-medium">
                    اپراتورهای سازگار:
                  </label>
                  <input
                    type="text"
                    value={testNetworkTag}
                    onChange={(e) => setTestNetworkTag(e.target.value)}
                    placeholder="همراه اول، ایرانسل، رایتل و مخابرات"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-[11px] mb-1 font-medium">
                  کانفیگ تست اصلی و پیش‌فرض (توسط خودم):
                </label>
                <textarea
                  value={testConfigString}
                  onChange={(e) => setTestConfigString(e.target.value)}
                  dir="ltr"
                  rows={2}
                  placeholder="vless://... یا vmess://... یا trojan://..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-[11px] focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  در صورتی که مخزن کانفیگ‌های یکبار مصرف خالی باشد، این کانفیگ به عنوان کانفیگ تست پیش‌فرض به کاربر تحویل داده می‌شود.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 text-[11px] mb-1 font-medium">
                  توضیحات راهنمای کاربر:
                </label>
                <input
                  type="text"
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                  placeholder="مناسب برای تست سرعت و اتصال به اینستاگرام و تلگرام"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={testSaving}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                >
                  {testSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>ذخیره تنظیمات کانفیگ تست</span>
                </button>
              </div>
            </form>

            {/* POOL SECTION: Multiple Single-Use Configs Added By Admin */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="font-bold text-white text-xs block">
                      مخزن کانفیگ‌های تست مجزا (یکبار مصرف)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      هر کاربر که تست بگیرد، یک کانفیگ مجزا دریافت می‌کند و آن کانفیگ می‌سوزد
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleClearPool(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
                    title="حذف کانفیگ‌هایی که توسط کاربران مصرف شده‌اند"
                  >
                    پاکسازی مصرف‌شده‌ها
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClearPool(true)}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 text-[10px] transition-colors"
                    title="حذف کامل تمام کانفیگ‌های مخزن"
                  >
                    خالی کردن مخزن
                  </button>
                </div>
              </div>

              {/* Pool Stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">کل کانفیگ‌ها:</span>
                  <span className="text-sm font-bold text-white font-mono">{testPoolStats.total}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                  <span className="text-emerald-400 block text-[10px]">آماده تحویل (خام):</span>
                  <span className="text-sm font-bold text-emerald-300 font-mono">{testPoolStats.unused}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-amber-400 block text-[10px]">تحویل داده شده:</span>
                  <span className="text-sm font-bold text-amber-300 font-mono">{testPoolStats.used}</span>
                </div>
              </div>

              {/* Add bulk configs */}
              <div className="space-y-2">
                <label className="block text-slate-300 text-[11px] font-medium">
                  افزودن کانفیگ تست به مخزن توسط من (هر خط یک کانفیگ):
                </label>
                <textarea
                  value={testPoolBulkText}
                  onChange={(e) => setTestPoolBulkText(e.target.value)}
                  dir="ltr"
                  rows={3}
                  placeholder={`vless://uuid1@host:port?...\nvless://uuid2@host:port?...\ntrojan://pass@host:port?...`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-[11px] focus:outline-none focus:border-amber-500 leading-relaxed"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    می‌توانید چندین کانفیگ را همزمان کپی و در کادر بالا جای‌گذاری کنید.
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPoolConfigs}
                    disabled={testAddingPool || !testPoolBulkText.trim()}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {testAddingPool ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>افزودن به مخزن تست</span>
                  </button>
                </div>
              </div>

              {/* Pool items list preview */}
              {testPool.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-300 block">
                    لیست کانفیگ‌های موجود در مخزن ({testPool.length} عدد):
                  </span>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {testPool.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-[10px] font-mono ${
                          item.isUsed
                            ? 'bg-slate-900/60 border-slate-800 text-slate-500'
                            : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="text-slate-500 font-bold shrink-0">{idx + 1}.</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] uppercase shrink-0 font-sans font-bold ${
                              item.isUsed
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-emerald-900/60 text-emerald-300'
                            }`}
                          >
                            {item.isUsed ? 'مصرف شده' : 'آماده'}
                          </span>
                          <span className="truncate max-w-[280px]" dir="ltr">
                            {item.config}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.usedByIp && (
                            <span className="text-[9px] text-slate-500 hidden sm:inline" dir="ltr">
                              IP: {item.usedByIp}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeletePoolItem(item.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                            title="حذف کانفیگ از مخزن"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ONE-TIME ENFORCEMENT & CLAIMS HISTORY */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="font-bold text-white text-xs block">
                      سوابق دریافت تست (محدودیت ۱ بار برای هر کاربر)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      مجموع تست‌های صادر شده تاکنون:{' '}
                      <strong className="text-cyan-400 font-mono font-bold">{testTotalClaims}</strong> مورد
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetClaims}
                  className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 text-[10px] flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>بازنشانی کامل تمام سهمیه‌ها</span>
                </button>
              </div>

              {testClaims.length === 0 ? (
                <div className="py-4 text-center text-slate-500 text-[11px]">
                  هنوز هیچ کاربری کانفیگ تست دریافت نکرده است.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {testClaims.map((claim) => (
                    <div
                      key={claim.id}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[10px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono" dir="ltr">
                          IP: {claim.ip || 'نامشخص'}
                        </span>
                        <span className="text-slate-500 text-[9px]">
                          {new Date(claim.claimedAt).toLocaleDateString('fa-IR', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          دریافت شد (۱ بار)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteClaim(claim.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="حذف سهمیه کاربر (امکان تست مجدد)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: GIFT CODES (SUPPORT VOUCHERS) */}
        {tab === 'giftCodes' && (
          <div className="space-y-5 text-xs animate-fade-in">
            {/* Header / Info Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 border border-purple-500/40 text-purple-200 flex items-start gap-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                <Gift className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs sm:text-sm">
                    مدیریت کدهای هدیه و ووچرهای پشتیبانی (کانفیگ رایگان)
                  </span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                    اهدا از طریق پشتیبانی
                  </span>
                </div>
                <p className="text-[11px] text-purple-200/80 leading-relaxed">
                  اینجا می‌توانید برای کاربران یا مشتریان خود کدهای هدیه اختصاصی صادر کنید. کاربر می‌تواند با دریافت کد از پشتیبانی تلگرام، در بخش "دریافت کانفیگ با کد هدیه" سایت، کانفیگ رایگان خود را تحویل بگیرد.
                </p>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block mb-1">کل کدهای ثبت‌شده</span>
                <span className="text-base font-black text-white font-mono">{giftStats.total}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-purple-500/30 text-center">
                <span className="text-[11px] text-purple-300 block mb-1">کدهای فعال و آماده</span>
                <span className="text-base font-black text-purple-400 font-mono">{giftStats.active}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block mb-1">مصرف‌شده یا باطل</span>
                <span className="text-base font-black text-slate-400 font-mono">{giftStats.burnedOrUsed}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-emerald-500/30 text-center">
                <span className="text-[11px] text-emerald-300 block mb-1">مجموع دفعات تحویل</span>
                <span className="text-base font-black text-emerald-400 font-mono">{giftStats.totalRedemptions}</span>
              </div>
            </div>

            {giftSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                <span>{giftSuccess}</span>
                <button onClick={() => setGiftSuccess(null)} className="text-emerald-400 hover:text-emerald-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {giftError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                <span>{giftError}</span>
                <button onClick={() => setGiftError(null)} className="text-rose-400 hover:text-rose-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* FORM: CREATE GIFT CODE */}
            <form onSubmit={handleCreateGiftCode} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Plus className="w-4 h-4 text-purple-400" />
                  <span>صدور و تعریف کد هدیه جدید</span>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateRandomGiftCode}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[11px] flex items-center gap-1 font-medium transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>تولید کد تصادفی</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 text-[11px] font-medium mb-1">
                    کد ووچر (خالی بگذارید تا خودکار ساخته شود):
                  </label>
                  <input
                    type="text"
                    value={giftCodeInput}
                    onChange={(e) => setGiftCodeInput(e.target.value.toUpperCase())}
                    placeholder="مثال: B4G-VIP یا FREE-GIFT"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs font-mono uppercase focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-[11px] font-medium mb-1">
                    یادداشت یا نام گیرنده (جهت شناسایی):
                  </label>
                  <input
                    type="text"
                    value={giftLabelInput}
                    onChange={(e) => setGiftLabelInput(e.target.value)}
                    placeholder="مثال: تحویل به @Ali در پشتیبانی"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-slate-200 text-[11px] font-bold flex items-center gap-1.5">
                    <span>متن کانفیگ اهدایی (vless:// یا vmess:// یا trojan://):</span>
                    <span className="text-purple-400">*</span>
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {adminConfigsList.length > 0 && (
                      <select
                        onChange={(e) => {
                          handleSelectConfigForGift(e.target.value);
                          e.target.value = '';
                        }}
                        defaultValue=""
                        className="px-2 py-1 bg-slate-950 border border-purple-500/40 rounded-lg text-purple-300 text-[11px] hover:border-purple-400 focus:outline-none cursor-pointer"
                      >
                        <option value="" disabled>⚡ انتخاب سریع از کانفیگ‌های سایت...</option>
                        {adminConfigsList.map((cfg) => (
                          <option key={cfg.id} value={cfg.id}>
                            [{cfg.protocol.toUpperCase()}] {cfg.title || cfg.remark || 'کانفیگ'} ({cfg.countryName || cfg.countryCode || 'جهانی'})
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={handlePasteConfigFromClipboard}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 border border-slate-700 hover:border-slate-500 transition-colors"
                      title="چسباندن متن کانفیگ از کلیپ‌بورد سیستم"
                    >
                      <Copy className="w-3 h-3 text-cyan-400" />
                      <span>چسباندن از حافظه</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={giftConfigInput}
                  onChange={(e) => setGiftConfigInput(e.target.value)}
                  placeholder="vless://xxxx-xxxx-xxxx@example.com:443?type=tcp&security=reality...&#10;(می‌توانید چند کانفیگ را خط‌به‌خط وارد کنید)"
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs font-mono focus:border-purple-500 focus:outline-none leading-relaxed"
                  dir="ltr"
                  required
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>💡 نکته: می‌توانید یک کانفیگ قرار دهید، یا چند کانفیگ را خط‌به‌خط پیست کنید تا به ازای هر خط یک کد هدیه ساخته شود.</span>
                  {giftConfigInput.trim().split(/[\r\n]+/).filter((s) => s.trim().length > 5).length > 1 && (
                    <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      {giftConfigInput.trim().split(/[\r\n]+/).filter((s) => s.trim().length > 5).length} کانفیگ شناسایی شد (ساخت همزمان چند کد)
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 text-[11px] font-medium mb-1">
                    عنوان کانفیگ برای کاربر:
                  </label>
                  <input
                    type="text"
                    value={giftTitleInput}
                    onChange={(e) => setGiftTitleInput(e.target.value)}
                    placeholder="کانفیگ هدیه اختصاصی B4G"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-[11px] font-medium mb-1">
                    سقف استفاده (تعداد کاربر مجاز):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={giftMaxUsesInput}
                    onChange={(e) => setGiftMaxUsesInput(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-purple-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">۱ یعنی تک‌کاربره (یکبار مصرف)</span>
                </div>

                <div>
                  <label className="block text-slate-300 text-[11px] font-medium mb-1">
                    تعداد کدهای تولیدی همزمان:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={giftBatchCount}
                    onChange={(e) => setGiftBatchCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-purple-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">برای تولید کدهای دسته‌ای</span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={giftSaving || !giftConfigInput.trim()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all active:scale-98"
                >
                  {giftSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>در حال ثبت...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>ایجاد و فعال‌سازی کد هدیه</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* LIST OF GIFT CODES */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={loadGiftCodes}
                    disabled={giftLoading}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${giftLoading ? 'animate-spin' : ''}`} />
                    <span>بروزرسانی</span>
                  </button>

                  <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setGiftFilter('all')}
                      className={`px-2 py-1 rounded-md transition-colors ${
                        giftFilter === 'all' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      همه ({giftCodes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setGiftFilter('active')}
                      className={`px-2 py-1 rounded-md transition-colors ${
                        giftFilter === 'active' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      آماده استفاده ({giftStats.active})
                    </button>
                    <button
                      type="button"
                      onClick={() => setGiftFilter('used')}
                      className={`px-2 py-1 rounded-md transition-colors ${
                        giftFilter === 'used' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      مصرف‌شده ({giftStats.burnedOrUsed})
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={giftSearch}
                    onChange={(e) => setGiftSearch(e.target.value)}
                    placeholder="جستجوی کد یا یادداشت..."
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-[11px] placeholder-slate-500 focus:border-purple-500 focus:outline-none w-full sm:w-44"
                  />

                  {giftStats.burnedOrUsed > 0 && (
                    <button
                      type="button"
                      onClick={handleClearUsedGifts}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-[11px] whitespace-nowrap transition-colors"
                      title="پاکسازی کدهای مصرف‌شده"
                    >
                      پاکسازی مصرف‌شده‌ها
                    </button>
                  )}
                </div>
              </div>

              {/* Codes display list */}
              {giftLoading && giftCodes.length === 0 ? (
                <div className="py-10 text-center text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
                  <span>در حال دریافت کدهای هدیه...</span>
                </div>
              ) : giftCodes.length === 0 ? (
                <div className="py-10 text-center text-slate-400 space-y-1">
                  <Gift className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-300">هیچ کد هدیه‌ای ثبت نشده است</p>
                  <p className="text-[11px] text-slate-500">از فرم بالا می‌توانید اولین کد هدیه را برای کاربران صادر کنید.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pl-1">
                  {giftCodes
                    .filter((g) => {
                      if (giftFilter === 'active') return !g.isBurned && g.usedCount < g.maxUses;
                      if (giftFilter === 'used') return g.isBurned || g.usedCount >= g.maxUses;
                      return true;
                    })
                    .filter((g) => {
                      if (!giftSearch.trim()) return true;
                      const q = giftSearch.toLowerCase().trim();
                      return (
                        g.code.toLowerCase().includes(q) ||
                        (g.label && g.label.toLowerCase().includes(q)) ||
                        (g.title && g.title.toLowerCase().includes(q))
                      );
                    })
                    .map((item) => {
                      const isUsable = !item.isBurned && item.usedCount < item.maxUses;
                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isUsable
                              ? 'bg-slate-950/70 border-slate-800 hover:border-purple-500/40 shadow-sm'
                              : 'bg-slate-950/40 border-slate-900 opacity-70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              {/* Voucher Code badge with copy */}
                              <button
                                type="button"
                                onClick={() => handleCopyGiftCode(item.id, item.code)}
                                className="px-2.5 py-1 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300 hover:text-white hover:bg-purple-900 font-mono text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all"
                                title="کپی کد جهت ارسال به مشتری"
                              >
                                <span>{item.code}</span>
                                <Copy className="w-3 h-3 text-purple-400" />
                              </button>

                              {copiedGiftCodeId === item.id && (
                                <span className="text-[10px] text-emerald-400 font-bold animate-fade-in">
                                  کد کپی شد!
                                </span>
                              )}

                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  isUsable
                                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {isUsable ? 'فعال و آماده تحویل' : item.isBurned ? 'باطل / غیرفعال' : 'تکمیل ظرفیت'}
                              </span>

                              <span className="text-[11px] text-slate-400">
                                ({item.usedCount} از {item.maxUses} بار استفاده)
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleCopyGiftConfig(item.id, item.config)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 transition-colors"
                                title="کپی کانفیگ خام"
                              >
                                <Copy className="w-3 h-3 text-cyan-400" />
                                <span>{copiedGiftConfigId === item.id ? 'کپی شد!' : 'کانفیگ'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleBurnGift(item.id)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                                  item.isBurned
                                    ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/60'
                                    : 'bg-amber-950/50 text-amber-300 border-amber-500/30 hover:bg-amber-900/60'
                                }`}
                                title={item.isBurned ? 'فعال‌سازی مجدد' : 'باطل کردن'}
                              >
                                {item.isBurned ? 'فعال‌سازی' : 'باطل کردن'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteGift(item.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                                title="حذف این کد هدیه"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Extra details */}
                          <div className="mt-2 pt-2 border-t border-slate-900 text-[11px] text-slate-400 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{item.title || 'کانفیگ هدیه'}</span>
                              {item.label && (
                                <span className="text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-500/20 text-[10px]">
                                  {item.label}
                                </span>
                              )}
                            </div>

                            <span className="text-slate-500 text-[10px]">
                              ایجاد: {new Date(item.createdAt).toLocaleDateString('fa-IR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Redemptions log preview */}
                          {item.redemptions && item.redemptions.length > 0 && (
                            <div className="mt-2 pt-1.5 border-t border-slate-900/80 text-[10px] text-slate-500">
                              <span className="text-slate-400 font-medium ml-1">آخرین تحویل:</span>
                              <span>
                                {new Date(item.redemptions[0].claimedAt).toLocaleDateString('fa-IR', {
                                  month: 'numeric',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {item.redemptions[0].ip && (
                                <span className="mr-2 font-mono" dir="ltr">
                                  (IP: {item.redemptions[0].ip})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: USERS & GMAIL REGISTRATIONS */}
        {tab === 'users' && (
          <div className="space-y-4 text-xs">
            {/* Header & Quick Stats */}
            <div className="flex items-center justify-between flex-wrap gap-2 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-100">
                      {language === 'fa' ? 'کاربران ثبت‌نام‌شده با جیمیل و آیدی' : 'Registered Users (Gmail & ID)'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30">
                      {usersList.length} {language === 'fa' ? 'کاربر' : 'Users'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {language === 'fa'
                      ? 'مشاهده دقیق ساعت ثبت‌نام جیمیل، آخرین ورود و حذف کاربران با آیدی'
                      : 'View exact registration timestamp, last login, and delete users by ID/Gmail'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchUsers}
                  disabled={usersLoading}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                  title={language === 'fa' ? 'بروزرسانی لیست کاربران' : 'Refresh users list'}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
                  <span>{language === 'fa' ? 'بروزرسانی' : 'Refresh'}</span>
                </button>
                {usersList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllUsers}
                    disabled={usersLoading}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
                    title={language === 'fa' ? 'پاکسازی تمام کاربران ثبت‌شده' : 'Clear all registered users'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'fa' ? 'حذف همه کاربران' : 'Clear All Users'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Notification messages */}
            {usersError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{usersError}</span>
              </div>
            )}
            {usersSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                <Check className="w-4 h-4 shrink-0" />
                <span>{usersSuccess}</span>
              </div>
            )}

            {/* Quick Delete by ID or Gmail Input Box */}
            <form onSubmit={handleDeleteByIdentifier} className="p-3.5 rounded-2xl bg-slate-950/80 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
                <UserX className="w-4 h-4" />
                <span>
                  {language === 'fa'
                    ? 'حذف فوری کاربر با آیدی (@username) یا ایمیل/جیمیل:'
                    : 'Quick delete user by username (@id) or Gmail:'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative flex-1">
                  <AtSign className="w-4 h-4 text-slate-500 absolute rtl:right-3 ltr:left-3 top-2.5" />
                  <input
                    type="text"
                    value={deleteTargetInput}
                    onChange={(e) => setDeleteTargetInput(e.target.value)}
                    placeholder={language === 'fa' ? 'مثال: @hamid_vpn یا user@gmail.com' : 'e.g. @hamid_vpn or user@gmail.com'}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                    dir="ltr"
                  />
                </div>
                <button
                  type="submit"
                  disabled={usersLoading || !deleteTargetInput.trim()}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === 'fa' ? 'حذف از سامانه' : 'Delete User'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                {language === 'fa'
                  ? 'با وارد کردن آیدی یا جیمیل و زدن دکمه حذف، کاربر مورد نظر از پنل و دیتابیس ثبت‌نام به طور کامل پاک می‌شود.'
                  : 'Enter the username (@id) or Gmail and click delete to completely remove this user from the system.'}
              </p>
            </form>

            {/* Search Filter Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute rtl:right-3.5 ltr:left-3.5 top-2.5" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder={language === 'fa' ? 'جستجو در بین کاربران (آیدی، جیمیل، شناسه)...' : 'Search users (ID, Gmail, username)...'}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl rtl:pr-10 rtl:pl-4 ltr:pl-10 ltr:pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            {/* Users List Table / Cards */}
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {usersLoading && usersList.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span>{language === 'fa' ? 'در حال دریافت لیست کاربران ثبت‌نامی...' : 'Loading registered users...'}</span>
                </div>
              ) : usersList.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800/80 text-slate-400 space-y-2">
                  <Users className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
                  <p className="font-medium text-slate-300">
                    {language === 'fa' ? 'هنوز کاربری ثبت‌نام نکرده است' : 'No users registered yet'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {language === 'fa'
                      ? 'هر کاربری که با جیمیل یا آیدی دلخواه ثبت‌نام کند در این لیست با ساعت دقیق نمایش داده می‌شود.'
                      : 'Any user registering with Gmail or username will appear here with exact timestamp.'}
                  </p>
                </div>
              ) : (
                usersList
                  .filter((u) => {
                    if (!userSearchQuery.trim()) return true;
                    const q = userSearchQuery.toLowerCase().trim();
                    return (
                      u.username.toLowerCase().includes(q) ||
                      u.email.toLowerCase().includes(q) ||
                      u.id.toLowerCase().includes(q)
                    );
                  })
                  .map((user) => {
                    const isDeleting = deletingUserId === user.id;
                    const createdInfo = formatPersianDateTime(user.createdAt);
                    const lastLoginInfo = formatPersianDateTime(user.lastLoginAt);
                    const isGmail = user.email.toLowerCase().includes('gmail.com');

                    return (
                      <div
                        key={user.id}
                        className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 transition-all space-y-2.5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                          {/* User Identifiers */}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-zinc-950 font-black flex items-center justify-center text-sm shadow-md shadow-amber-500/20 shrink-0">
                              {user.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-100 font-mono text-sm" dir="ltr">
                                  @{user.username}
                                </span>
                                {isGmail && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-medium flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-blue-400" />
                                    <span>{language === 'fa' ? 'جیمیل' : 'Gmail'}</span>
                                  </span>
                                )}
                                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px]">
                                  {language === 'fa' ? 'ثبت‌نام فعال' : 'Active Account'}
                                </span>
                              </div>
                              <div className="text-xs text-slate-300 font-mono mt-0.5 flex items-center gap-1.5" dir="ltr">
                                <span className="text-slate-500">{language === 'fa' ? 'ایمیل:' : 'Email:'}</span>
                                <span>{user.email}</span>
                              </div>
                            </div>
                          </div>

                          {/* Delete Action Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id, user.username, user.email)}
                            disabled={isDeleting}
                            className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white border border-rose-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all self-start shrink-0"
                            title={language === 'fa' ? 'حذف این کاربر از پنل و سامانه' : 'Delete user from system'}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>{isDeleting ? (language === 'fa' ? 'در حال حذف...' : 'Deleting...') : (language === 'fa' ? 'حذف کاربر' : 'Delete User')}</span>
                          </button>
                        </div>

                        {/* Registration Timestamps & Details (ساعت چند جمیل زده) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-900 text-[11px]">
                          {/* Exact Registration Time */}
                          <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80">
                            <span className="text-amber-300/90 font-medium block flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>{language === 'fa' ? 'ساعت و زمان ثبت‌نام:' : 'Registered At:'}</span>
                            </span>
                            <span className="font-mono text-slate-200 mt-1 block font-semibold text-xs" dir="ltr">
                              {createdInfo.fullStr}
                            </span>
                          </div>

                          {/* Last Login Time */}
                          <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80">
                            <span className="text-slate-400 block flex items-center gap-1">
                              <CheckCheck className="w-3 h-3 text-emerald-400" />
                              <span>{language === 'fa' ? 'آخرین ورود به سایت:' : 'Last Login:'}</span>
                            </span>
                            <span className="font-mono text-slate-300 mt-1 block" dir="ltr">
                              {lastLoginInfo.fullStr}
                            </span>
                          </div>

                          {/* Unique User ID */}
                          <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800/80">
                            <span className="text-slate-400 block flex items-center gap-1">
                              <AtSign className="w-3 h-3 text-slate-400" />
                              <span>{language === 'fa' ? 'شناسه اختصاصی:' : 'User ID:'}</span>
                            </span>
                            <span className="font-mono text-slate-400 mt-1 block truncate" title={user.id} dir="ltr">
                              {user.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
