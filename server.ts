import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data Directory and File
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

interface ConfigItem {
  id: string;
  title: string;
  protocol: string;
  config: string;
  countryCode: string;
  countryName: string;
  networkTag: string;
  isPinned?: boolean;
  isActive: boolean;
  copyCount: number;
  pingMs?: number;
  createdAt: string;
  updatedAt: string;
}

interface SupportConfig {
  telegramId: string;
  telegramChannel: string;
  contactEmail: string;
  phone: string;
  customNote: string;
  enableDirectMessage: boolean;
}

interface SupportMessage {
  id: string;
  category: 'broken_config' | 'connection_issue' | 'question' | 'other' | 'user_registration';
  configTitle?: string;
  userContact: string;
  senderName?: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  metadata?: {
    userId?: string;
    username?: string;
    email?: string;
    provider?: string;
    ip?: string;
    userAgent?: string;
    registeredAt?: string;
  };
}

const defaultSupportConfig: SupportConfig = {
  telegramId: '@B4G_SUPPORT',
  telegramChannel: 'https://t.me/B4GHUB',
  contactEmail: '',
  phone: '',
  customNote: 'در صورت قطعی، کندی سرعت یا نیاز به راهنمایی اتصال، از طریق تلگرام با پشتیبانی B4G در ارتباط باشید.',
  enableDirectMessage: true,
};

interface OtpCodeItem {
  id: string;
  code: string;
  createdAt: string;
  expiresAt?: string | null;
  maxUses: number;
  usedCount: number;
  isBurned: boolean;
  label?: string;
}

interface AccessControlConfig {
  enabled: boolean;
  masterCode: string;
  allowSelfRequest: boolean;
  sessionDurationHours: number;
}

const defaultAccessControl: AccessControlConfig & { activeOtps: OtpCodeItem[] } = {
  enabled: true,
  masterCode: 'B4G2026',
  allowSelfRequest: true,
  sessionDurationHours: 24,
  activeOtps: [
    {
      id: 'otp-1',
      code: 'B4G-9842',
      createdAt: new Date().toISOString(),
      expiresAt: null,
      maxUses: 1,
      usedCount: 0,
      isBurned: false,
      label: 'کد یکبار مصرف نمونه ۱',
    },
    {
      id: 'otp-2',
      code: '749201',
      createdAt: new Date().toISOString(),
      expiresAt: null,
      maxUses: 1,
      usedCount: 0,
      isBurned: false,
      label: 'کد ۶ رقمی یکبار مصرف',
    },
    {
      id: 'otp-3',
      code: '518392',
      createdAt: new Date().toISOString(),
      expiresAt: null,
      maxUses: 1,
      usedCount: 0,
      isBurned: false,
      label: 'کد یکبار مصرف تلگرام',
    },
  ],
};

interface TestConfigPoolItem {
  id: string;
  config: string;
  isUsed: boolean;
  usedAt?: string;
  usedByIp?: string;
  usedByFingerprint?: string;
  createdAt: string;
}

interface TestConfigSettings {
  enabled: boolean;
  title: string;
  protocol: string;
  config: string;
  durationText: string;
  description: string;
  networkTag: string;
  countryCode: string;
  countryName: string;
  totalClaimsCount?: number;
  pool?: TestConfigPoolItem[];
}

interface TestClaimRecord {
  id: string;
  fingerprint: string;
  ip: string;
  claimedAt: string;
  userAgent?: string;
  configClaimed?: string;
}

interface GiftCodeRedemptionRecord {
  claimedAt: string;
  ip?: string;
  fingerprint?: string;
}

interface GiftCodeItem {
  id: string;
  code: string;
  config: string;
  title?: string;
  protocol?: string;
  durationText?: string;
  description?: string;
  maxUses: number;
  usedCount: number;
  isBurned: boolean;
  expiresAt?: string | null;
  label?: string;
  createdAt: string;
  redemptions?: GiftCodeRedemptionRecord[];
}

const defaultGiftCodes: GiftCodeItem[] = [
  {
    id: 'gift-1',
    code: 'B4G-FREE',
    config: 'vless://b4g-support-gift-user@fra1.b4g-cloud.net:443?type=tcp&security=reality&pbk=8M4kL9wPqZ5eYx2vU1tS7rQ6oP3n&fp=chrome&sni=speedtest.net&sid=b4ggift01#🎁%20B4G%20FREE%20GIFT%20CONFIG',
    title: 'کانفیگ هدیه اختصاصی پشتیبانی B4G',
    protocol: 'vless',
    durationText: 'اشتراک هدیه - ۳۰ روزه / نامحدود',
    description: 'این کانفیگ از طرف پشتیبانی به عنوان هدیه اهدا گردیده و دارای پینگ پایین و سرعت تضمینی است.',
    maxUses: 10,
    usedCount: 0,
    isBurned: false,
    label: 'کد هدیه عمومی پشتیبانی تلگرام',
    createdAt: new Date().toISOString(),
    redemptions: [],
  },
  {
    id: 'gift-2',
    code: 'GIFT-2026',
    config: 'vmess://eyJhZGQiOiJmcmExLmI0Zy1jbG91ZC5uZXQiLCJhaWQiOjAsImhvc3QiOiJ3d3cuY2xvdWRmbGFyZS5jb20iLCJpZCI6IjhmNTk5MzlkLTIxNDUtNDk0My1iYjczLWNkZjA3OGFmYzcyYiIsIm5ldCI6IndzIiwicGF0aCI6Ii9naWZ0IiwicG9ydCI6NDQzLCJwcyI6IvCfj4EgR2lmdCBDb25maWcgQjRHIiwic2N5IjoiYXV0byIsInNuaSI6Ind3dy5jbG91ZGZsYXJlLmNvbSIsInRscyI6InRscyIsInR5cGUiOiJub25lIn0=',
    title: 'کانفیگ پرسرعت وب‌سوکت هدیه',
    protocol: 'vmess',
    durationText: 'اعتبار هدیه - پایداری بالا',
    description: 'مناسب برای همراه اول، ایرانسل و اینترنت مخابرات.',
    maxUses: 5,
    usedCount: 0,
    isBurned: false,
    label: 'کد تست مشتریان VIP',
    createdAt: new Date().toISOString(),
    redemptions: [],
  },
];

const defaultTestConfigSettings: TestConfigSettings = {
  enabled: true,
  title: 'کانفیگ تست اختصاصی B4G (تک‌کاربره)',
  protocol: 'vless',
  config: 'vless://b4g-trial-test-account@fra1.b4g-cloud.net:443?type=tcp&security=reality&pbk=8M4kL9wPqZ5eYx2vU1tS7rQ6oP3n&fp=chrome&sni=speedtest.net&sid=b4gtest01#⚡%20B4G%20TEST%20ACCOUNT%20(One-Time)',
  durationText: 'تست ۲ ساعته - حجم ۱ گیگابایت',
  description: 'این کانفیگ جهت بررسی سرعت و پایداری در اختیار شما قرار گرفته است. هر کاربر تنها ۱ بار امکان دریافت تست را دارد.',
  networkTag: 'همراه اول، ایرانسل، رایتل و وای‌فای',
  countryCode: 'DE',
  countryName: 'آلمان 🇩🇪',
  totalClaimsCount: 0,
  pool: [],
};

interface DatabaseSchema {
  adminPassword: string;
  defaultPasswordChanged: boolean;
  announcement: {
    enabled: boolean;
    text: string;
    type: 'info' | 'success' | 'warning' | 'alert';
  };
  supportConfig: SupportConfig;
  supportMessages: SupportMessage[];
  configs: ConfigItem[];
  stats: {
    totalCopies: number;
  };
  accessControl?: AccessControlConfig & { activeOtps: OtpCodeItem[] };
  testConfigSettings?: TestConfigSettings;
  testClaims?: TestClaimRecord[];
  giftCodes?: GiftCodeItem[];
  users?: UserAccount[];
  adminNotificationSettings?: {
    notifyOnNewUser: boolean;
  };
}

export interface UserAccount {
  id: string;
  email: string;
  username: string;
  passwordHash?: string;
  displayName: string;
  avatar?: string;
  provider: 'email' | 'google';
  createdAt: string;
  lastLoginAt: string;
  role: 'user' | 'vip' | 'admin';
  registeredIp?: string;
  registeredUserAgent?: string;
  sentToAdmin?: boolean;
}

// In-memory active session tokens (token -> expiry timestamp)
const activeTokens = new Map<string, number>();
// In-memory active visitor tokens (token -> expiry timestamp)
const activeVisitorTokens = new Map<string, number>();
// In-memory active user tokens (token -> { userId, expiresAt })
const activeUserTokens = new Map<string, { userId: string; expiresAt: number }>();
// In-memory active captcha challenges (challengeId -> { expectedAnswer, expiresAt })
const activeCaptchaChallenges = new Map<string, { expectedAnswer: string; expiresAt: number }>();

// Seed sample configs for initial setup
const sampleConfigs: ConfigItem[] = [
  {
    id: 'sample-1',
    title: 'سرور پرسرعت آلمان (Reality)',
    protocol: 'vless',
    config: 'vless://b73b22e1-7e8c-4a39-9d58-45d259c6ef41@fra.example-cloud.net:443?type=tcp&security=reality&pbk=7K3bF4q...&fp=chrome&sni=yahoo.com&sid=a1b2c3d4#🇩🇪%20Germany%20Reality%20-%20MCI',
    countryCode: 'DE',
    countryName: 'آلمان 🇩🇪',
    networkTag: 'همراه اول و ایرانسل',
    isPinned: true,
    isActive: true,
    copyCount: 142,
    pingMs: 85,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'sample-2',
    title: 'سرور پایدار هلند (WebSocket)',
    protocol: 'vmess',
    config: 'vmess://eyJhZGQiOiJhbXMxLmV4YW1wbGUubmV0IiwiYWlkIjowLCJob3N0Ijoid3d3LmNsb3VkZmxhcmUuY29tIiwiaWQiOiI3NzI5ZTIyYy02YWY0LTQxMDQtOTNiYi04ZTQ0NWM2YmQ2YmEiLCJuZXQiOiJ3cyIsInBhdGgiOiIvdjJ3cyIsInBvcnQiOjQ0MywicHMiOiLwn4ez8fCfh7EgTmV0aGVybGFuZHMgV1MiLCJzY3kiOiJhdXRvIiwic25pIjoid3d3LmNsb3VkZmxhcmUuY29tIiwidGxzIjoidGxzIiwidHlwZSI6Im5vbmUifQ==',
    countryCode: 'NL',
    countryName: 'هلند 🇳🇱',
    networkTag: 'مخابرات و وای‌فای',
    isPinned: false,
    isActive: true,
    copyCount: 89,
    pingMs: 110,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'sample-3',
    title: 'سرور گیمینگ فنلاند (Trojan)',
    protocol: 'trojan',
    config: 'trojan://secure-trojan-pass-2026@hel.example-server.org:443?security=tls&headerType=none&type=tcp&sni=hel.example-server.org#🇫🇮%20Finland%20Trojan%20Fast',
    countryCode: 'FI',
    countryName: 'فنلاند 🇫🇮',
    networkTag: 'تمام اپراتورها',
    isPinned: false,
    isActive: true,
    copyCount: 65,
    pingMs: 72,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Helper: load database
function getDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initialDb: DatabaseSchema = {
        adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
        defaultPasswordChanged: Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD !== 'admin123'),
        announcement: {
          enabled: true,
          text: 'کانفیگ‌های جدید به سرور اضافه شدند. برای استفاده دکمه کپی را بزنید یا بارکد QR را اسکن کنید.',
          type: 'info',
        },
        supportConfig: defaultSupportConfig,
        supportMessages: [],
        configs: sampleConfigs,
        stats: {
          totalCopies: 296,
        },
        accessControl: defaultAccessControl,
        testConfigSettings: defaultTestConfigSettings,
        testClaims: [],
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
      return initialDb;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed.supportConfig) {
      parsed.supportConfig = defaultSupportConfig;
    } else {
      if (parsed.supportConfig.telegramId === '@vpn_admin_support') {
        parsed.supportConfig.telegramId = '@B4G_SUPPORT';
      }
      if (parsed.supportConfig.telegramChannel === 'https://t.me/vpn_proxy_channel' || parsed.supportConfig.telegramChannel === 'https://t.me/B4G_SUPPORT') {
        parsed.supportConfig.telegramChannel = 'https://t.me/B4GHUB';
      }
    }
    if (!Array.isArray(parsed.supportMessages)) {
      parsed.supportMessages = [];
    }
    if (!parsed.accessControl) {
      parsed.accessControl = defaultAccessControl;
    } else {
      if (!Array.isArray(parsed.accessControl.activeOtps)) {
        parsed.accessControl.activeOtps = defaultAccessControl.activeOtps;
      }
      if (typeof parsed.accessControl.enabled !== 'boolean') {
        parsed.accessControl.enabled = true;
      }
      if (!parsed.accessControl.masterCode) {
        parsed.accessControl.masterCode = 'B4G2026';
      }
    }
    if (!parsed.testConfigSettings) {
      parsed.testConfigSettings = defaultTestConfigSettings;
    } else {
      if (!parsed.testConfigSettings.protocol) {
        parsed.testConfigSettings.protocol = 'vless';
      }
      if (typeof parsed.testConfigSettings.enabled !== 'boolean') {
        parsed.testConfigSettings.enabled = true;
      }
    }
    if (!Array.isArray(parsed.testClaims)) {
      parsed.testClaims = [];
    }
    if (!Array.isArray(parsed.giftCodes)) {
      parsed.giftCodes = defaultGiftCodes;
    }
    if (!Array.isArray(parsed.users)) {
      parsed.users = [];
    }
    return parsed;
  } catch (err) {
    console.error('Error reading db:', err);
    return {
      adminPassword: 'admin123',
      defaultPasswordChanged: false,
      announcement: {
        enabled: true,
        text: 'به پنل اشتراک کانفیگ خوش آمدید.',
        type: 'info',
      },
      supportConfig: defaultSupportConfig,
      supportMessages: [],
      configs: sampleConfigs,
      stats: { totalCopies: 296 },
      accessControl: defaultAccessControl,
      testConfigSettings: defaultTestConfigSettings,
      testClaims: [],
      giftCodes: defaultGiftCodes,
      users: [],
    };
  }
}

// Client IP helper
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || req.ip || 'unknown';
}

// Helper: Sanitize user object for client
function sanitizeUser(user: UserAccount) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName || user.username,
    avatar: user.avatar || '',
    provider: user.provider,
    createdAt: user.createdAt,
    role: user.role || 'user',
  };
}

// Helper: Send full registration info to Admin Messages inbox
function notifyAdminOnUserRegistration(
  user: UserAccount,
  ip?: string,
  userAgent?: string,
  db?: DatabaseSchema,
  forceNotify = false
) {
  const currentDb = db || getDb();
  if (!forceNotify && currentDb.adminNotificationSettings?.notifyOnNewUser === false) {
    return;
  }
  if (!Array.isArray(currentDb.supportMessages)) {
    currentDb.supportMessages = [];
  }

  const clientIp = ip || user.registeredIp || 'نامشخص / Local';
  const clientUa = userAgent || user.registeredUserAgent || 'مرورگر کاربر';

  let formattedDateFa = user.createdAt;
  let formattedDateEn = user.createdAt;
  try {
    const d = new Date(user.createdAt);
    formattedDateFa = `${d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} - ${d.toLocaleDateString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' })}`;
    formattedDateEn = `${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} - ${d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}`;
  } catch {}

  const isGoogle = user.provider === 'google' || user.email.includes('gmail.com');
  const providerLabel = isGoogle ? 'جیمیل گوگل (Gmail / Google)' : 'ثبت‌نام مستقیم با ایمیل (Email Direct)';

  const fullDetailsText = `📋 مشخصات و اطلاعات کامل کاربر ثبت‌نامی در سامانه B4G:
━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 نام کاربری (آیدی): @${user.username}
📧 آدرس جیمیل / ایمیل: ${user.email}
🏷️ نام نمایشی: ${user.displayName || user.username}
🔑 شناسه کاربری (User ID): ${user.id}
🌐 متد ثبت‌نام: ${providerLabel}
⏰ زمان و ساعت دقیق ثبت‌نام:
   • شمسی: ${formattedDateFa}
   • میلادی: ${formattedDateEn}
   • ایزو: ${user.createdAt}
🌍 آدرس آی‌پی (IP Address): ${clientIp}
📱 مشخصات دستگاه و مرورگر:
   ${clientUa}
━━━━━━━━━━━━━━━━━━━━━━━━━━
این گزارش برای اطلاع مدیر و دسترسی سریع به مشخصات کاربر ثبت‌نامی ارسال گردید.`;

  const newAdminMessage: SupportMessage = {
    id: 'reg_msg_' + crypto.randomBytes(6).toString('hex'),
    category: 'user_registration',
    configTitle: `ثبت‌نام کاربر: @${user.username}`,
    userContact: user.email,
    senderName: `سامانه ثبت‌نام B4G (@${user.username})`,
    message: fullDetailsText,
    createdAt: new Date().toISOString(),
    isRead: false,
    metadata: {
      userId: user.id,
      username: user.username,
      email: user.email,
      provider: user.provider,
      ip: clientIp,
      userAgent: clientUa,
      registeredAt: user.createdAt,
    },
  };

  currentDb.supportMessages.unshift(newAdminMessage);
  user.sentToAdmin = true;
  user.registeredIp = clientIp;
  user.registeredUserAgent = clientUa;
}

// Visitor Authorization Check (Checks if site is locked with OTP)
function isVisitorAuthorized(req: Request, db: DatabaseSchema): boolean {
  if (!db.accessControl || !db.accessControl.enabled) {
    return true;
  }

  // Check admin authorization (admin is always authorized)
  const authHeader = req.headers.authorization;
  let adminToken = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    adminToken = authHeader.substring(7);
  } else if (req.headers['x-admin-token']) {
    adminToken = String(req.headers['x-admin-token']);
  }
  if (adminToken && activeTokens.has(adminToken)) {
    const exp = activeTokens.get(adminToken);
    if (exp && Date.now() <= exp) return true;
  }

  // Check logged-in user authorization (logged-in users bypass OTP gate)
  let userToken = '';
  if (authHeader && authHeader.startsWith('Bearer b4g_u_')) {
    userToken = authHeader.substring(7);
  } else if (req.headers['x-user-token']) {
    userToken = String(req.headers['x-user-token']);
  }
  if (userToken && activeUserTokens.has(userToken)) {
    const uExp = activeUserTokens.get(userToken);
    if (uExp && Date.now() <= uExp.expiresAt) return true;
  }

  // Check visitor token from header or query
  const visitorToken =
    (req.headers['x-visitor-token'] as string) ||
    (req.query.visitorToken as string) ||
    (req.query.token as string) ||
    '';

  if (visitorToken && activeVisitorTokens.has(visitorToken)) {
    const exp = activeVisitorTokens.get(visitorToken);
    if (exp && Date.now() <= exp) {
      return true;
    }
    // Expired
    activeVisitorTokens.delete(visitorToken);
  }

  return false;
}

// Helper: save database
function saveDb(db: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db:', err);
  }
}

// Admin Authentication Middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers['x-admin-token']) {
    token = String(req.headers['x-admin-token']);
  }

  if (!token) {
    return res.status(401).json({ error: 'دسترسی غیرمجاز: لطفاً ابتدا وارد پنل مدیریت شوید.' });
  }

  const expiry = activeTokens.get(token);
  if (!expiry || Date.now() > expiry) {
    activeTokens.delete(token);
    return res.status(401).json({ error: 'نشست کاربری شما منقضی شده است. مجدداً وارد شوید.' });
  }

  // Extend token lifetime (24 hours from activity)
  activeTokens.set(token, Date.now() + 24 * 60 * 60 * 1000);
  next();
}

// Helper: Auto-detect protocol and remark from config line
function parseConfigLine(raw: string): { protocol: string; title: string; countryCode: string; countryName: string } {
  const trimmed = raw.trim();
  let protocol = 'custom';
  let title = 'کانفیگ اختصاصی';
  let countryCode = 'DE';
  let countryName = 'آلمان 🇩🇪';

  if (trimmed.startsWith('vless://')) protocol = 'vless';
  else if (trimmed.startsWith('vmess://')) protocol = 'vmess';
  else if (trimmed.startsWith('trojan://')) protocol = 'trojan';
  else if (trimmed.startsWith('ss://')) protocol = 'ss';
  else if (trimmed.startsWith('hysteria2://') || trimmed.startsWith('hy2://')) protocol = 'hysteria2';
  else if (trimmed.startsWith('tuic://')) protocol = 'tuic';
  else if (trimmed.startsWith('wireguard://') || trimmed.includes('[Interface]')) protocol = 'wireguard';
  else if (trimmed.startsWith('warp://')) protocol = 'warp';
  else if (trimmed.startsWith('ssh://')) protocol = 'ssh';

  // Try extracting remark from hash
  if (trimmed.includes('#')) {
    const hashPart = trimmed.split('#')[1];
    if (hashPart) {
      try {
        title = decodeURIComponent(hashPart);
      } catch {
        title = hashPart;
      }
    }
  } else if (protocol === 'vmess') {
    // Try base64 decode of vmess
    try {
      const b64 = trimmed.substring(8);
      const jsonStr = Buffer.from(b64, 'base64').toString('utf-8');
      const parsed = JSON.parse(jsonStr);
      if (parsed.ps) {
        title = parsed.ps;
      }
    } catch {
      // ignore
    }
  }

  // Detect Country from title or content
  const lower = (title + ' ' + trimmed).toLowerCase();
  if (lower.includes('germany') || lower.includes('آلمان') || lower.includes('🇩🇪') || lower.includes('fra')) {
    countryCode = 'DE';
    countryName = 'آلمان 🇩🇪';
  } else if (lower.includes('finland') || lower.includes('فنلاند') || lower.includes('🇫🇮') || lower.includes('hel')) {
    countryCode = 'FI';
    countryName = 'فنلاند 🇫🇮';
  } else if (lower.includes('netherland') || lower.includes('هلند') || lower.includes('🇳🇱') || lower.includes('ams')) {
    countryCode = 'NL';
    countryName = 'هلند 🇳🇱';
  } else if (lower.includes('united states') || lower.includes('usa') || lower.includes('آمریکا') || lower.includes('🇺🇸')) {
    countryCode = 'US';
    countryName = 'آمریکا 🇺🇸';
  } else if (lower.includes('france') || lower.includes('فرانسه') || lower.includes('🇫🇷') || lower.includes('par')) {
    countryCode = 'FR';
    countryName = 'فرانسه 🇫🇷';
  } else if (lower.includes('turkey') || lower.includes('ترکیه') || lower.includes('🇹🇷') || lower.includes('ist')) {
    countryCode = 'TR';
    countryName = 'ترکیه 🇹🇷';
  } else if (lower.includes('uk') || lower.includes('انگلیس') || lower.includes('لندن') || lower.includes('🇬🇧') || lower.includes('lon')) {
    countryCode = 'GB';
    countryName = 'انگلستان 🇬🇧';
  } else if (lower.includes('sweden') || lower.includes('سوئد') || lower.includes('🇸🇪')) {
    countryCode = 'SE';
    countryName = 'سوئد 🇸🇪';
  } else if (lower.includes('canada') || lower.includes('کانادا') || lower.includes('🇨🇦')) {
    countryCode = 'CA';
    countryName = 'کانادا 🇨🇦';
  } else if (lower.includes('iran') || lower.includes('ایران') || lower.includes('🇮🇷')) {
    countryCode = 'IR';
    countryName = 'ایران 🇮🇷';
  }

  return { protocol, title, countryCode, countryName };
}

// ----------------------------------------------------
// ACCESS CONTROL & OTP PUBLIC ENDPOINTS
// ----------------------------------------------------

// Check access status (whether visitor is verified or site requires OTP)
app.get('/api/access/status', (req: Request, res: Response) => {
  const db = getDb();
  const enabled = Boolean(db.accessControl?.enabled);
  const isVerified = isVisitorAuthorized(req, db);

  res.json({
    enabled,
    isVerified,
    allowSelfRequest: Boolean(db.accessControl?.allowSelfRequest),
    telegramChannel: db.supportConfig?.telegramChannel || 'https://t.me/B4GHUB',
    telegramId: db.supportConfig?.telegramId || '@B4G_SUPPORT',
  });
});

// Verify OTP or Master Passcode
app.post('/api/access/verify-otp', (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'لطفاً رمز یکبار مصرف را وارد کنید.' });
  }

  const cleanCode = code.trim();
  const db = getDb();
  const accessCtrl = db.accessControl || defaultAccessControl;

  let authorized = false;
  let note = '';

  // 1. Master code or admin password bypass
  if (cleanCode === accessCtrl.masterCode || cleanCode === db.adminPassword) {
    authorized = true;
    note = 'ورود با رمز مستر / ادمین';
  } else {
    // 2. Check active OTP list
    const now = Date.now();
    const otpIndex = (accessCtrl.activeOtps || []).findIndex((item) => {
      if (item.isBurned) return false;
      if (item.usedCount >= item.maxUses) return false;
      if (item.expiresAt && new Date(item.expiresAt).getTime() < now) return false;
      return item.code.trim().toUpperCase() === cleanCode.toUpperCase() || item.code.trim() === cleanCode;
    });

    if (otpIndex !== -1) {
      const matchedOtp = accessCtrl.activeOtps[otpIndex];
      matchedOtp.usedCount += 1;
      if (matchedOtp.usedCount >= matchedOtp.maxUses) {
        matchedOtp.isBurned = true;
      }
      authorized = true;
      note = matchedOtp.label || 'کد یکبار مصرف تایید شد';
      saveDb(db);
    }
  }

  if (!authorized) {
    return res.status(401).json({
      error: 'رمز یکبار مصرف نامعتبر است، منقضی شده یا قبلاً استفاده شده است! لطفاً کد جدید تهیه کنید.',
    });
  }

  // Issue visitor session token
  const visitorToken = 'b4g_vis_' + crypto.randomBytes(24).toString('hex');
  const hours = accessCtrl.sessionDurationHours || 24;
  const expiry = Date.now() + hours * 60 * 60 * 1000;
  activeVisitorTokens.set(visitorToken, expiry);

  res.json({
    success: true,
    token: visitorToken,
    message: 'رمز یکبار مصرف با موفقیت تایید شد. دسترسی شما فعال گردید!',
    expiresAt: new Date(expiry).toISOString(),
    note,
  });
});

// Self-request a 1-time OTP (if enabled by admin)
app.post('/api/access/request-otp', (req: Request, res: Response) => {
  const db = getDb();
  const accessCtrl = db.accessControl || defaultAccessControl;

  if (!accessCtrl.allowSelfRequest) {
    return res.status(403).json({
      error: 'دریافت مستقیم کد غیرفعال است. لطفاً به کانال تلگرام @B4GHUB یا پشتیبانی @B4G_SUPPORT مراجعه کنید.',
    });
  }

  const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
  const newOtp: OtpCodeItem = {
    id: crypto.randomUUID(),
    code: randomDigits,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // valid for 1 hour
    maxUses: 1,
    usedCount: 0,
    isBurned: false,
    label: 'کد یکبار مصرف کاربر جدید',
  };

  if (!Array.isArray(accessCtrl.activeOtps)) {
    accessCtrl.activeOtps = [];
  }
  accessCtrl.activeOtps.unshift(newOtp);
  saveDb(db);

  res.json({
    success: true,
    code: randomDigits,
    expiresInMinutes: 60,
    message: 'کد یکبار مصرف با موفقیت صادر شد. می‌توانید با این کد فوراً وارد شوید.',
  });
});

// ----------------------------------------------------
// USER AUTHENTICATION & CAPTCHA ENDPOINTS
// ----------------------------------------------------

// 1. Generate "I am not a robot" Captcha Challenge
app.get('/api/captcha/generate', (req: Request, res: Response) => {
  const challengeId = 'cap_' + crypto.randomBytes(8).toString('hex');
  const num1 = Math.floor(Math.random() * 8) + 2;
  const num2 = Math.floor(Math.random() * 8) + 1;
  const sum = num1 + num2;

  // Options including correct answer and 3 distinct random distractor options
  const optSet = new Set<number>([sum]);
  while (optSet.size < 4) {
    const diff = Math.floor(Math.random() * 7) - 3;
    const candidate = sum + (diff === 0 ? 2 : diff);
    if (candidate > 0 && candidate !== sum) {
      optSet.add(candidate);
    }
  }
  const options = Array.from(optSet).sort(() => Math.random() - 0.5).map(String);

  activeCaptchaChallenges.set(challengeId, {
    expectedAnswer: String(sum),
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  res.json({
    challengeId,
    question: `${num1} + ${num2} = ؟`,
    questionEn: `What is ${num1} + ${num2}?`,
    options,
  });
});

// 2. Verify Captcha (I am not a robot)
app.post('/api/captcha/verify', (req: Request, res: Response) => {
  const { challengeId, answer } = req.body;
  if (!challengeId || answer === undefined || answer === null) {
    return res.status(400).json({ valid: false, error: 'اطلاعات تایید من ربات نیستم کامل نیست.' });
  }

  const challenge = activeCaptchaChallenges.get(challengeId);
  if (!challenge) {
    return res.status(400).json({ valid: false, error: 'کد امنیتی منقضی شده است. لطفاً مجدداً تلاش کنید.' });
  }
  if (Date.now() > challenge.expiresAt) {
    activeCaptchaChallenges.delete(challengeId);
    return res.status(400).json({ valid: false, error: 'کد امنیتی منقضی شده است.' });
  }

  const isCorrect = String(answer).trim() === challenge.expectedAnswer.trim();
  if (!isCorrect) {
    return res.status(400).json({ valid: false, error: 'پاسخ تست امنیتی نادرست است. لطفاً دوباره تلاش کنید.' });
  }

  activeCaptchaChallenges.delete(challengeId);

  const verificationToken = 'cap_verified_' + crypto.randomBytes(16).toString('hex');
  activeCaptchaChallenges.set(verificationToken, {
    expectedAnswer: 'VERIFIED',
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  res.json({ valid: true, verificationToken });
});

// Helper: check if request passed captcha
function verifyRobotPassed(verificationToken?: string, challengeId?: string, captchaAnswer?: string): boolean {
  if (verificationToken && activeCaptchaChallenges.has(verificationToken)) {
    const v = activeCaptchaChallenges.get(verificationToken);
    if (v && v.expectedAnswer === 'VERIFIED' && Date.now() <= v.expiresAt) {
      return true;
    }
  }
  if (challengeId && captchaAnswer && activeCaptchaChallenges.has(challengeId)) {
    const c = activeCaptchaChallenges.get(challengeId);
    if (c && Date.now() <= c.expiresAt && String(captchaAnswer).trim() === c.expectedAnswer.trim()) {
      activeCaptchaChallenges.delete(challengeId);
      return true;
    }
  }
  return false;
}

// 3. User Registration (Email/Gmail + Custom ID + Password + Captcha)
app.post('/api/user/register', (req: Request, res: Response) => {
  const { email, username, password, challengeId, captchaAnswer, verificationToken } = req.body;

  // Verify captcha if supplied
  if (verificationToken || challengeId) {
    if (!verifyRobotPassed(verificationToken, challengeId, captchaAnswer)) {
      return res.status(400).json({ error: 'لطفاً ابتدا تایید کنید که ربات نیستید (چک‌باکس من ربات نیستم).' });
    }
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'لطفاً یک ایمیل یا حساب جیمیل معتبر وارد کنید.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  let rawUsername = (username || '').trim().replace(/^@/, '');

  if (!rawUsername) {
    rawUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
  }
  if (rawUsername.length < 3) {
    rawUsername = rawUsername + '_user';
  }
  if (rawUsername.length > 25) {
    rawUsername = rawUsername.substring(0, 25);
  }

  const db = getDb();
  if (!Array.isArray(db.users)) {
    db.users = [];
  }

  // Check if account with this email already exists
  const existingUser = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existingUser) {
    // If account exists, update password if provided and log in immediately
    if (password && typeof password === 'string' && password.length >= 4) {
      existingUser.passwordHash = crypto.createHash('sha256').update(password + '_B4G_SALT_2026').digest('hex');
    }
    existingUser.lastLoginAt = new Date().toISOString();
    saveDb(db);

    const token = 'b4g_u_' + crypto.randomBytes(24).toString('hex');
    activeUserTokens.set(token, { userId: existingUser.id, expiresAt: Date.now() + 30 * 24 * 3600 * 1000 });

    return res.json({
      success: true,
      token,
      user: sanitizeUser(existingUser),
      message: `خوش آمدید @${existingUser.username}! ورود با حساب شما با موفقیت انجام شد.`,
    });
  }

  // Generate unique username if taken
  let finalUsername = rawUsername;
  let counter = 1;
  while (db.users.some((u) => u.username.toLowerCase() === finalUsername.toLowerCase())) {
    finalUsername = `${rawUsername}_${counter}`;
    counter++;
  }

  const safePassword = password && typeof password === 'string' && password.length >= 4 ? password : 'b4g_user_pass';
  const passHash = crypto.createHash('sha256').update(safePassword + '_B4G_SALT_2026').digest('hex');

  const clientIp = getClientIp(req);
  const clientUa = (req.headers['user-agent'] as string) || 'مرورگر کاربر';

  const newUser: UserAccount = {
    id: 'usr_' + crypto.randomBytes(8).toString('hex'),
    email: cleanEmail,
    username: finalUsername,
    displayName: finalUsername,
    passwordHash: passHash,
    provider: cleanEmail.endsWith('@gmail.com') ? 'google' : 'email',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    role: 'user',
    registeredIp: clientIp,
    registeredUserAgent: clientUa,
  };

  notifyAdminOnUserRegistration(newUser, clientIp, clientUa, db);

  db.users.push(newUser);
  saveDb(db);

  const token = 'b4g_u_' + crypto.randomBytes(24).toString('hex');
  activeUserTokens.set(token, { userId: newUser.id, expiresAt: Date.now() + 30 * 24 * 3600 * 1000 });

  res.json({
    success: true,
    token,
    user: sanitizeUser(newUser),
    message: `ثبت‌نام شما با موفقیت انجام شد و به سایت وارد شدید! خوش آمدید @${newUser.username}`,
  });
});

// 4. User Login (Email or Custom ID + Password + Captcha)
app.post('/api/user/login', (req: Request, res: Response) => {
  const { identifier, password, challengeId, captchaAnswer, verificationToken } = req.body;

  if (!identifier) {
    return res.status(400).json({ error: 'لطفاً ایمیل / آیدی کاربری را وارد کنید.' });
  }

  const cleanId = String(identifier).trim().toLowerCase().replace(/^@/, '');
  const db = getDb();
  if (!Array.isArray(db.users)) {
    db.users = [];
  }
  const users = db.users;

  let user = users.find(
    (u) => u.email.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId
  );

  // If user entered a Gmail / Email address but was not registered yet, auto-register and log them in!
  if (!user && cleanId.includes('@')) {
    let baseUsername = cleanId.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    if (baseUsername.length < 3) baseUsername = baseUsername + '_user';
    if (baseUsername.length > 20) baseUsername = baseUsername.substring(0, 20);
    let finalUsername = baseUsername;
    let counter = 1;
    while (users.some((u) => u.username.toLowerCase() === finalUsername.toLowerCase())) {
      finalUsername = `${baseUsername}${counter}`;
      counter++;
    }

    const safePassword = password && typeof password === 'string' && password.length >= 4 ? password : 'b4g_user_pass';
    const passHash = crypto.createHash('sha256').update(safePassword + '_B4G_SALT_2026').digest('hex');

    const clientIp = getClientIp(req);
    const clientUa = (req.headers['user-agent'] as string) || 'مرورگر کاربر';

    const newUser: UserAccount = {
      id: 'usr_' + crypto.randomBytes(8).toString('hex'),
      email: cleanId,
      username: finalUsername,
      displayName: finalUsername,
      passwordHash: passHash,
      provider: cleanId.includes('gmail.com') ? 'google' : 'email',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      role: 'user',
      registeredIp: clientIp,
      registeredUserAgent: clientUa,
    };

    notifyAdminOnUserRegistration(newUser, clientIp, clientUa, db);

    users.push(newUser);
    saveDb(db);
    user = newUser;
  }

  if (!user) {
    return res.status(400).json({ error: 'کاربری با این مشخصات یافت نشد. لطفاً ایمیل یا جیمیل خود را برای ورود وارد کنید.' });
  }

  // Password verification:
  // If the user logs in with email or gmail, allow password update or passwordless direct entry
  if (user.passwordHash && password) {
    const passHash = crypto.createHash('sha256').update(password + '_B4G_SALT_2026').digest('hex');
    if (passHash !== user.passwordHash) {
      if (user.email.includes('gmail.com') || user.provider === 'google' || cleanId.includes('@')) {
        // Sync password for convenience
        user.passwordHash = passHash;
      } else {
        return res.status(400).json({ error: 'رمز عبور وارد شده نادرست است.' });
      }
    }
  } else if (!user.passwordHash && password) {
    user.passwordHash = crypto.createHash('sha256').update(password + '_B4G_SALT_2026').digest('hex');
  }

  user.lastLoginAt = new Date().toISOString();
  saveDb(db);

  const token = 'b4g_u_' + crypto.randomBytes(24).toString('hex');
  activeUserTokens.set(token, { userId: user.id, expiresAt: Date.now() + 30 * 24 * 3600 * 1000 });

  res.json({
    success: true,
    token,
    user: sanitizeUser(user),
    message: `خوش آمدید @${user.username}! ورود با موفقیت انجام شد و به سایت وارد شدید.`,
  });
});

// 5. Google / Gmail Quick Authentication (Login / Register with Gmail)
app.post('/api/user/google-auth', (req: Request, res: Response) => {
  const { email, name, avatar, customUsername, verificationToken, challengeId, captchaAnswer } = req.body;

  // Verify captcha if supplied
  if (verificationToken || challengeId) {
    if (!verifyRobotPassed(verificationToken, challengeId, captchaAnswer)) {
      return res.status(400).json({ error: 'لطفاً ابتدا تایید کنید که ربات نیستید.' });
    }
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'آدرس ایمیل جیمیل معتبر نیست.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const db = getDb();
  if (!Array.isArray(db.users)) {
    db.users = [];
  }

  let user = db.users.find((u) => u.email === cleanEmail);
  if (!user) {
    let baseUsername = (customUsername || cleanEmail.split('@')[0] || 'user')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .toLowerCase();
    if (baseUsername.length < 3) baseUsername = baseUsername + '_b4g';
    if (baseUsername.length > 20) baseUsername = baseUsername.substring(0, 20);

    let finalUsername = baseUsername;
    let counter = 1;
    while (db.users.some((u) => u.username.toLowerCase() === finalUsername.toLowerCase())) {
      finalUsername = `${baseUsername}${counter}`;
      counter++;
    }

    const clientIp = getClientIp(req);
    const clientUa = (req.headers['user-agent'] as string) || 'مرورگر کاربر';

    user = {
      id: 'usr_' + crypto.randomBytes(8).toString('hex'),
      email: cleanEmail,
      username: finalUsername,
      displayName: name || finalUsername,
      avatar: avatar || '',
      provider: 'google',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      role: 'user',
      registeredIp: clientIp,
      registeredUserAgent: clientUa,
    };

    notifyAdminOnUserRegistration(user, clientIp, clientUa, db);

    db.users.push(user);
  } else {
    user.lastLoginAt = new Date().toISOString();
    if (avatar && !user.avatar) user.avatar = avatar;
    if (name && !user.displayName) user.displayName = name;
  }

  saveDb(db);

  const token = 'b4g_u_' + crypto.randomBytes(24).toString('hex');
  activeUserTokens.set(token, { userId: user.id, expiresAt: Date.now() + 30 * 24 * 3600 * 1000 });

  res.json({
    success: true,
    token,
    user: sanitizeUser(user),
    message: `ورود با حساب جیمیل با موفقیت انجام شد.`,
  });
});

// 6. Get Current Logged-in User Profile
app.get('/api/user/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers['x-user-token']) {
    token = String(req.headers['x-user-token']);
  }

  if (!token || !activeUserTokens.has(token)) {
    return res.status(401).json({ error: 'کاربر وارد نشده است' });
  }

  const session = activeUserTokens.get(token);
  if (!session || Date.now() > session.expiresAt) {
    activeUserTokens.delete(token);
    return res.status(401).json({ error: 'نشست کاربری منقضی شده است' });
  }

  const db = getDb();
  const user = (db.users || []).find((u) => u.id === session.userId);
  if (!user) {
    return res.status(404).json({ error: 'کاربر یافت نشد' });
  }

  res.json({ user: sanitizeUser(user) });
});

// 7. Update Custom User ID / Username
app.post('/api/user/update-id', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers['x-user-token']) {
    token = String(req.headers['x-user-token']);
  }

  if (!token || !activeUserTokens.has(token)) {
    return res.status(401).json({ error: 'ابتدا وارد حساب کاربری خود شوید.' });
  }

  const session = activeUserTokens.get(token);
  if (!session || Date.now() > session.expiresAt) {
    return res.status(401).json({ error: 'نشست کاربری منقضی شده است.' });
  }

  const { newUsername } = req.body;
  const cleanUsername = (newUsername || '').trim().replace(/^@/, '');

  if (!/^[a-zA-Z0-9_]{3,25}$/.test(cleanUsername)) {
    return res.status(400).json({ error: 'آیدی جدید باید حداقل ۳ کاراکتر و فقط شامل حروف انگلیسی، عدد و _ باشد.' });
  }

  const db = getDb();
  const user = (db.users || []).find((u) => u.id === session.userId);
  if (!user) {
    return res.status(404).json({ error: 'کاربر یافت نشد' });
  }

  if ((db.users || []).some((u) => u.id !== user.id && u.username.toLowerCase() === cleanUsername.toLowerCase())) {
    return res.status(400).json({ error: 'این آیدی کاربری قبلاً توسط فرد دیگری ثبت شده است.' });
  }

  user.username = cleanUsername;
  user.displayName = cleanUsername;
  saveDb(db);

  res.json({ success: true, user: sanitizeUser(user), message: 'آیدی کاربری شما با موفقیت به @' + cleanUsername + ' تغییر یافت.' });
});

// 8. User Logout
app.post('/api/user/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.headers['x-user-token']) {
    token = String(req.headers['x-user-token']);
  }
  if (token) {
    activeUserTokens.delete(token);
  }
  res.json({ success: true, message: 'با موفقیت خارج شدید.' });
});


// ----------------------------------------------------
// PUBLIC API ENDPOINTS (Available to all visitors)
// ----------------------------------------------------

// 1. Get public configs (Only active configs, read-only)
app.get('/api/public/configs', (req: Request, res: Response) => {
  const db = getDb();

  // Check visitor authorization
  const isAuthorized = isVisitorAuthorized(req, db);
  if (!isAuthorized) {
    return res.status(403).json({
      error: 'ACCESS_LOCKED',
      message: 'سایت با رمز یکبار مصرف محافظت می‌شود. لطفاً ابتدا رمز ورود را وارد کنید.',
      locked: true,
      announcement: db.announcement,
      supportConfig: db.supportConfig || defaultSupportConfig,
      accessStatus: {
        enabled: true,
        allowSelfRequest: Boolean(db.accessControl?.allowSelfRequest),
        telegramChannel: db.supportConfig?.telegramChannel || 'https://t.me/B4GHUB',
        telegramId: db.supportConfig?.telegramId || '@B4G_SUPPORT',
      },
    });
  }

  const activeConfigs = db.configs
    .filter((c) => c.isActive)
    .sort((a, b) => {
      // Pinned first, then newest
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });

  let lastUpdated = new Date().toISOString();
  if (db.configs.length > 0) {
    lastUpdated = db.configs.reduce((max, c) => (c.updatedAt > max ? c.updatedAt : max), db.configs[0].updatedAt || db.configs[0].createdAt);
  }

  res.json({
    configs: activeConfigs,
    announcement: db.announcement,
    supportConfig: db.supportConfig || defaultSupportConfig,
    totalActive: activeConfigs.length,
    totalCopies: db.stats?.totalCopies || 0,
    lastUpdated,
  });
});

// ----------------------------------------------------
// PUBLIC TEST CONFIG ENDPOINTS
// ----------------------------------------------------

// 1. Get status of test config (enabled, details, and whether current visitor has already claimed)
app.get('/api/public/test-config/status', (req: Request, res: Response) => {
  const db = getDb();
  const testSettings = db.testConfigSettings || defaultTestConfigSettings;
  const claims = db.testClaims || [];
  const pool = testSettings.pool || [];
  const availablePoolCount = pool.filter((p) => !p.isUsed).length;

  const claimToken =
    (req.headers['x-claim-token'] as string) ||
    (req.query.claimToken as string) ||
    '';
  const ip = getClientIp(req);

  // Check if this visitor has already claimed
  const existingClaim = claims.find((c) => {
    if (claimToken && c.fingerprint === claimToken) return true;
    if (ip && ip !== '127.0.0.1' && ip !== '::1' && ip !== 'unknown' && c.ip === ip) return true;
    return false;
  });

  if (existingClaim) {
    return res.json({
      enabled: testSettings.enabled,
      alreadyClaimed: true,
      claimedAt: existingClaim.claimedAt,
      config: existingClaim.configClaimed || testSettings.config,
      title: testSettings.title,
      protocol: testSettings.protocol,
      durationText: testSettings.durationText,
      description: testSettings.description,
      networkTag: testSettings.networkTag,
      countryCode: testSettings.countryCode,
      countryName: testSettings.countryName,
      totalClaimsCount: testSettings.totalClaimsCount || claims.length,
      availablePoolCount,
    });
  }

  return res.json({
    enabled: testSettings.enabled,
    alreadyClaimed: false,
    title: testSettings.title,
    protocol: testSettings.protocol,
    durationText: testSettings.durationText,
    description: testSettings.description,
    networkTag: testSettings.networkTag,
    countryCode: testSettings.countryCode,
    countryName: testSettings.countryName,
    totalClaimsCount: testSettings.totalClaimsCount || claims.length,
    availablePoolCount,
  });
});

// 2. Claim test config (strictly one-time per user/fingerprint/IP)
app.post('/api/public/test-config/claim', (req: Request, res: Response) => {
  const db = getDb();
  const testSettings = db.testConfigSettings || defaultTestConfigSettings;

  if (!testSettings.enabled) {
    return res.status(400).json({
      error: 'در حال حاضر دریافت کانفیگ تست توسط مدیریت غیرفعال شده است.',
    });
  }

  if (!Array.isArray(db.testClaims)) {
    db.testClaims = [];
  }
  if (!Array.isArray(testSettings.pool)) {
    testSettings.pool = [];
  }

  const claimToken =
    (req.body.claimToken as string) ||
    (req.headers['x-claim-token'] as string) ||
    '';
  const ip = getClientIp(req);

  // Check if visitor already claimed
  const existingClaim = db.testClaims.find((c) => {
    if (claimToken && c.fingerprint === claimToken) return true;
    if (ip && ip !== '127.0.0.1' && ip !== '::1' && ip !== 'unknown' && c.ip === ip) return true;
    return false;
  });

  if (existingClaim) {
    return res.status(403).json({
      error: 'ALREADY_CLAIMED',
      message: 'شما قبلاً سهمیه کانفیگ تست خود را دریافت کرده‌اید! هر کاربر و دستگاه فقط یک بار مجاز به دریافت تست است. جهت تهیه اشتراک با پشتیبانی تماس بگیرید.',
      alreadyClaimed: true,
      claimedAt: existingClaim.claimedAt,
      config: existingClaim.configClaimed || testSettings.config,
      title: testSettings.title,
      protocol: testSettings.protocol,
      durationText: testSettings.durationText,
    });
  }

  const newFingerprint = claimToken || crypto.randomUUID();

  // Determine which config to assign:
  // 1. If there is an unused item in the pool, pick the first unused pool item
  let assignedConfig = '';
  const unusedPoolItem = testSettings.pool.find((p) => !p.isUsed);
  if (unusedPoolItem) {
    unusedPoolItem.isUsed = true;
    unusedPoolItem.usedAt = new Date().toISOString();
    unusedPoolItem.usedByIp = ip;
    unusedPoolItem.usedByFingerprint = newFingerprint;
    assignedConfig = unusedPoolItem.config;
  } else if (testSettings.config && testSettings.config.trim()) {
    assignedConfig = testSettings.config.trim();
  } else {
    return res.status(400).json({
      error: 'در حال حاضر هیچ کانفیگ تستی در سیستم موجود نیست. لطفاً به پشتیبانی پیام دهید یا ساعاتی دیگر تلاش فرمایید.',
    });
  }

  const newRecord: TestClaimRecord = {
    id: crypto.randomUUID(),
    fingerprint: newFingerprint,
    ip,
    claimedAt: new Date().toISOString(),
    userAgent: req.headers['user-agent'] ? String(req.headers['user-agent']).slice(0, 150) : undefined,
    configClaimed: assignedConfig,
  };

  db.testClaims.unshift(newRecord);
  testSettings.totalClaimsCount = (testSettings.totalClaimsCount || 0) + 1;
  saveDb(db);

  res.json({
    success: true,
    claimToken: newFingerprint,
    claimedAt: newRecord.claimedAt,
    config: assignedConfig,
    title: testSettings.title,
    protocol: testSettings.protocol,
    durationText: testSettings.durationText,
    description: testSettings.description,
    networkTag: testSettings.networkTag,
    countryCode: testSettings.countryCode,
    countryName: testSettings.countryName,
    message: 'کانفیگ تست اختصاصی با موفقیت برای شما صادر شد.',
  });
});

// ----------------------------------------------------
// PUBLIC GIFT CODES REDEEM ENDPOINT
// ----------------------------------------------------
const handleRedeemGiftCode = (req: Request, res: Response) => {
  const { code, fingerprint } = req.body;
  if (!code || typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'لطفاً کد هدیه یا ووچر دریافت شده از پشتیبانی را وارد کنید.' });
  }

  const cleanCode = code.trim().toUpperCase();
  const db = getDb();

  if (!Array.isArray(db.giftCodes) || db.giftCodes.length === 0) {
    return res.status(404).json({ error: 'کد هدیه معتبری یافت نشد. لطفاً با پشتیبانی در ارتباط باشید.' });
  }

  const match = db.giftCodes.find((g) => g.code.trim().toUpperCase() === cleanCode);
  if (!match) {
    return res.status(404).json({
      error: 'کد هدیه وارد شده نامعتبر یا نادرست است. لطفاً کد را با دقت بررسی نموده یا به پشتیبانی تلگرام پیام دهید.',
    });
  }

  if (match.isBurned) {
    return res.status(400).json({
      error: 'این کد هدیه قبلاً استفاده شده یا توسط پشتیبانی غیرفعال شده است.',
    });
  }

  if (match.expiresAt && new Date(match.expiresAt).getTime() < Date.now()) {
    return res.status(400).json({
      error: 'مهلت استفاده از این کد هدیه به پایان رسیده است.',
    });
  }

  if (match.usedCount >= match.maxUses) {
    match.isBurned = true;
    saveDb(db);
    return res.status(400).json({
      error: 'سقف استفاده از این کد هدیه تکمیل شده است. لطفاً جهت دریافت کد جدید با پشتیبانی تماس بگیرید.',
    });
  }

  // Increment usage
  match.usedCount = (match.usedCount || 0) + 1;
  if (match.usedCount >= match.maxUses) {
    match.isBurned = true;
  }

  if (!Array.isArray(match.redemptions)) {
    match.redemptions = [];
  }

  const ip = getClientIp(req);
  const claimedAt = new Date().toISOString();
  match.redemptions.unshift({
    claimedAt,
    ip,
    fingerprint: fingerprint ? String(fingerprint).trim() : undefined,
  });

  saveDb(db);

  let protocol = match.protocol;
  if (!protocol) {
    const lower = match.config.toLowerCase();
    if (lower.startsWith('vmess://')) protocol = 'vmess';
    else if (lower.startsWith('trojan://')) protocol = 'trojan';
    else if (lower.startsWith('ss://')) protocol = 'shadowsocks';
    else protocol = 'vless';
  }

  return res.json({
    success: true,
    code: match.code,
    config: match.config,
    title: match.title || 'کانفیگ هدیه اختصاصی B4G',
    protocol,
    durationText: match.durationText || 'سرویس هدیه پشتیبانی',
    description: match.description || 'کانفیگ هدیه شما با موفقیت فعال شد. می‌توانید با کپی کردن یا اسکن بارکد به آن متصل شوید.',
    claimedAt,
    message: 'کد هدیه با موفقیت تایید شد! کانفیگ اختصاصی شما با موفقیت صادر گردید.',
  });
};

app.post('/api/public/gift-codes/redeem', handleRedeemGiftCode);
app.post('/api/gift-codes/redeem', handleRedeemGiftCode);

// 2. Submit user support message or report
app.post('/api/public/support/message', (req: Request, res: Response) => {
  const { category, configTitle, userContact, message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'لطفاً متن پیام یا گزارش خود را بنویسید.' });
  }

  const db = getDb();
  if (!Array.isArray(db.supportMessages)) {
    db.supportMessages = [];
  }

  const newMessage: SupportMessage = {
    id: crypto.randomUUID(),
    category: category || 'other',
    configTitle: configTitle ? String(configTitle).trim() : undefined,
    userContact: userContact ? String(userContact).trim() : 'ناشناس',
    message: String(message).trim(),
    createdAt: new Date().toISOString(),
    isRead: false,
  };

  db.supportMessages.unshift(newMessage);
  if (db.supportMessages.length > 200) {
    db.supportMessages = db.supportMessages.slice(0, 200);
  }

  saveDb(db);
  res.json({ success: true, message: 'پیام شما با موفقیت برای پشتیبانی ارسال شد.' });
});

// 3. Track config copy count
app.post('/api/public/configs/:id/copy', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const config = db.configs.find((c) => c.id === id);
  if (config) {
    config.copyCount = (config.copyCount || 0) + 1;
    db.stats.totalCopies = (db.stats.totalCopies || 0) + 1;
    saveDb(db);
    return res.json({ success: true, copyCount: config.copyCount, totalCopies: db.stats.totalCopies });
  }
  res.status(404).json({ error: 'کانفیگ یافت نشد' });
});

// 3. Track bulk copy count
app.post('/api/public/configs/copy-all', (req: Request, res: Response) => {
  const db = getDb();
  const activeConfigs = db.configs.filter((c) => c.isActive);
  for (const c of activeConfigs) {
    c.copyCount = (c.copyCount || 0) + 1;
  }
  db.stats.totalCopies = (db.stats.totalCopies || 0) + activeConfigs.length;
  saveDb(db);
  res.json({ success: true, count: activeConfigs.length, totalCopies: db.stats.totalCopies });
});

// 4. Subscription Link Endpoint (Real V2Ray / Clash / Nekoray / Shadowrocket subscription)
app.get('/api/sub', (req: Request, res: Response) => {
  const db = getDb();
  if (!isVisitorAuthorized(req, db)) {
    return res.status(403).send('Access Denied: Please enter one-time passcode (OTP) on website first.');
  }

  const activeConfigs = db.configs.filter((c) => c.isActive);
  const rawLinks = activeConfigs.map((c) => c.config.trim()).join('\n');

  // Format parameter (raw vs base64)
  const format = req.query.format;
  res.setHeader('Subscription-Userinfo', 'upload=0; download=0; total=107374182400; expire=0');
  res.setHeader('Profile-Title', 'B4G-Configs');
  res.setHeader('Profile-Update-Interval', '1');

  if (format === 'raw') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(rawLinks);
  }

  // Standard Base64 subscription
  const base64Content = Buffer.from(rawLinks, 'utf-8').toString('base64');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(base64Content);
});

// ----------------------------------------------------
// ADMIN AUTHENTICATION ENDPOINTS
// ----------------------------------------------------

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'رمز عبور را وارد کنید.' });
  }

  const db = getDb();
  if (password !== db.adminPassword) {
    return res.status(401).json({ error: 'رمز عبور وارد شده نادرست است!' });
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  // Valid for 24 hours
  activeTokens.set(token, Date.now() + 24 * 60 * 60 * 1000);

  res.json({
    success: true,
    token,
    message: 'با موفقیت وارد پنل مدیریت شدید.',
    defaultPasswordChanged: db.defaultPasswordChanged,
  });
});

// Verify token
app.get('/api/admin/verify', requireAdmin, (req: Request, res: Response) => {
  const db = getDb();
  res.json({
    valid: true,
    defaultPasswordChanged: db.defaultPasswordChanged,
  });
});

// Admin Logout
app.post('/api/admin/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    activeTokens.delete(token);
  }
  res.json({ success: true, message: 'خروج موفقیت‌آمیز بود.' });
});

// Admin Change Password
app.post('/api/admin/change-password', requireAdmin, (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ error: 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد.' });
  }

  const db = getDb();
  if (currentPassword && currentPassword !== db.adminPassword) {
    return res.status(400).json({ error: 'رمز عبور فعلی نادرست است.' });
  }

  db.adminPassword = newPassword.trim();
  db.defaultPasswordChanged = true;
  saveDb(db);

  res.json({ success: true, message: 'رمز عبور مدیریت با موفقیت تغییر یافت.' });
});

// ----------------------------------------------------
// ADMIN CONFIG MANAGEMENT (RESTRICTED TO ADMIN ONLY)
// ----------------------------------------------------

// Get all configs (admin view including stats and disabled configs)
app.get('/api/admin/configs', requireAdmin, (req: Request, res: Response) => {
  const db = getDb();
  const protocolCounts: Record<string, number> = {};

  db.configs.forEach((c) => {
    protocolCounts[c.protocol] = (protocolCounts[c.protocol] || 0) + 1;
  });

  const stats = {
    totalConfigs: db.configs.length,
    activeConfigs: db.configs.filter((c) => c.isActive).length,
    inactiveConfigs: db.configs.filter((c) => !c.isActive).length,
    totalCopies: db.stats?.totalCopies || 0,
    protocolCounts,
    lastUpdated: new Date().toISOString(),
  };

  const unreadMessagesCount = (db.supportMessages || []).filter((m) => !m.isRead).length;

  res.json({
    configs: db.configs,
    announcement: db.announcement,
    supportConfig: db.supportConfig || defaultSupportConfig,
    stats,
    defaultPasswordChanged: db.defaultPasswordChanged,
    unreadMessagesCount,
  });
});

// Add Single or Bulk Configs
app.post('/api/admin/configs', requireAdmin, (req: Request, res: Response) => {
  const { bulkText, singleConfig } = req.body;
  const db = getDb();

  if (bulkText && typeof bulkText === 'string') {
    // Bulk import mode: each line is a config
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 5);

    if (lines.length === 0) {
      return res.status(400).json({ error: 'هیچ کانفیگ معتبری در متن وارد شده یافت نشد.' });
    }

    const addedConfigs: ConfigItem[] = [];
    for (const line of lines) {
      const parsed = parseConfigLine(line);
      const newConfig: ConfigItem = {
        id: crypto.randomUUID(),
        title: parsed.title,
        protocol: parsed.protocol,
        config: line,
        countryCode: parsed.countryCode,
        countryName: parsed.countryName,
        networkTag: 'تمام اپراتورها',
        isPinned: false,
        isActive: true,
        copyCount: 0,
        pingMs: Math.floor(Math.random() * 50) + 60, // 60-110 ms
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.configs.unshift(newConfig);
      addedConfigs.push(newConfig);
    }

    saveDb(db);
    return res.json({
      success: true,
      message: `${addedConfigs.length} کانفیگ با موفقیت اضافه شد.`,
      addedCount: addedConfigs.length,
      configs: db.configs,
    });
  }

  if (singleConfig) {
    if (!singleConfig.config || !singleConfig.config.trim()) {
      return res.status(400).json({ error: 'متن یا لینک کانفیگ الزامی است.' });
    }

    const parsed = parseConfigLine(singleConfig.config);
    const newConfig: ConfigItem = {
      id: crypto.randomUUID(),
      title: (singleConfig.title && singleConfig.title.trim()) || parsed.title,
      protocol: singleConfig.protocol || parsed.protocol,
      config: singleConfig.config.trim(),
      countryCode: singleConfig.countryCode || parsed.countryCode,
      countryName: singleConfig.countryName || parsed.countryName,
      networkTag: singleConfig.networkTag || 'تمام اپراتورها',
      isPinned: Boolean(singleConfig.isPinned),
      isActive: singleConfig.isActive !== false,
      copyCount: 0,
      pingMs: singleConfig.pingMs || Math.floor(Math.random() * 40) + 65,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.configs.unshift(newConfig);
    saveDb(db);

    return res.json({
      success: true,
      message: 'کانفیگ با موفقیت اضافه شد.',
      config: newConfig,
      configs: db.configs,
    });
  }

  res.status(400).json({ error: 'اطلاعات کانفیگ ارسال نشده است.' });
});

// Update single config
app.put('/api/admin/configs/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const db = getDb();
  const index = db.configs.findIndex((c) => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'کانفیگ یافت نشد.' });
  }

  const existing = db.configs[index];
  db.configs[index] = {
    ...existing,
    ...updates,
    id: existing.id, // prevent id change
    updatedAt: new Date().toISOString(),
  };

  saveDb(db);
  res.json({ success: true, message: 'کانفیگ بروزرسانی شد.', config: db.configs[index], configs: db.configs });
});

// Delete single config
app.delete('/api/admin/configs/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const initialLen = db.configs.length;
  db.configs = db.configs.filter((c) => c.id !== id);

  if (db.configs.length === initialLen) {
    return res.status(404).json({ error: 'کانفیگ یافت نشد.' });
  }

  saveDb(db);
  res.json({ success: true, message: 'کانفیگ با موفقیت حذف شد.', configs: db.configs });
});

// Bulk Delete Configs
app.post('/api/admin/configs/bulk-delete', requireAdmin, (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'لیست شناسه‌ها نامعتبر است.' });
  }

  const db = getDb();
  const idSet = new Set(ids);
  db.configs = db.configs.filter((c) => !idSet.has(c.id));

  saveDb(db);
  res.json({ success: true, message: `${ids.length} کانفیگ حذف شدند.`, configs: db.configs });
});

// Update Announcement Banner
app.post('/api/admin/announcement', requireAdmin, (req: Request, res: Response) => {
  const { enabled, text, type } = req.body;
  const db = getDb();

  db.announcement = {
    enabled: Boolean(enabled),
    text: text ? String(text).trim() : '',
    type: type || 'info',
  };

  saveDb(db);
  res.json({ success: true, message: 'پیام اطلاع‌رسانی با موفقیت بروزرسانی شد.', announcement: db.announcement });
});

// Update Support Configuration
app.post('/api/admin/support/config', requireAdmin, (req: Request, res: Response) => {
  const { telegramId, telegramChannel, contactEmail, phone, customNote, enableDirectMessage } = req.body;
  const db = getDb();

  db.supportConfig = {
    telegramId: telegramId ? String(telegramId).trim() : '',
    telegramChannel: telegramChannel ? String(telegramChannel).trim() : '',
    contactEmail: contactEmail ? String(contactEmail).trim() : '',
    phone: phone ? String(phone).trim() : '',
    customNote: customNote ? String(customNote).trim() : '',
    enableDirectMessage: enableDirectMessage !== false,
  };

  saveDb(db);
  res.json({ success: true, message: 'تنظیمات پشتیبانی با موفقیت ذخیره شد.', supportConfig: db.supportConfig });
});

// Get all support messages
app.get('/api/admin/support/messages', requireAdmin, (req: Request, res: Response) => {
  const db = getDb();
  res.json({ messages: db.supportMessages || [] });
});

// Toggle support message read status
app.put('/api/admin/support/messages/:id/read', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  const msg = (db.supportMessages || []).find((m) => m.id === id);
  if (msg) {
    msg.isRead = !msg.isRead;
    saveDb(db);
    return res.json({ success: true, message: msg, unreadCount: db.supportMessages.filter((m) => !m.isRead).length });
  }
  res.status(404).json({ error: 'پیام یافت نشد.' });
});

// Delete support message
app.delete('/api/admin/support/messages/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  db.supportMessages = (db.supportMessages || []).filter((m) => m.id !== id);
  saveDb(db);
  res.json({ success: true, message: 'پیام حذف شد.', unreadCount: db.supportMessages.filter((m) => !m.isRead).length });
});

// ----------------------------------------------------
// ADMIN ACCESS CONTROL & OTP MANAGEMENT
// ----------------------------------------------------

// Get access control settings and all OTP codes
app.get('/api/admin/access', requireAdmin, (req: Request, res: Response) => {
  const db = getDb();
  const accessCtrl = db.accessControl || defaultAccessControl;
  const otps = accessCtrl.activeOtps || [];
  const now = Date.now();
  const activeCount = otps.filter((o) => !o.isBurned && o.usedCount < o.maxUses && (!o.expiresAt || new Date(o.expiresAt).getTime() > now)).length;
  const burnedCount = otps.filter((o) => o.isBurned || o.usedCount >= o.maxUses).length;

  res.json({
    config: {
      enabled: accessCtrl.enabled,
      masterCode: accessCtrl.masterCode,
      allowSelfRequest: accessCtrl.allowSelfRequest,
      sessionDurationHours: accessCtrl.sessionDurationHours || 24,
    },
    otps,
    totalOtps: otps.length,
    activeOtpsCount: activeCount,
    burnedOtpsCount: burnedCount,
  });
});

// Update access control settings (toggle lock, master code, self request)
app.post('/api/admin/access/config', requireAdmin, (req: Request, res: Response) => {
  const { enabled, masterCode, allowSelfRequest, sessionDurationHours } = req.body;
  const db = getDb();
  if (!db.accessControl) {
    db.accessControl = { ...defaultAccessControl };
  }

  if (typeof enabled === 'boolean') {
    db.accessControl.enabled = enabled;
  }
  if (masterCode && typeof masterCode === 'string') {
    db.accessControl.masterCode = masterCode.trim();
  }
  if (typeof allowSelfRequest === 'boolean') {
    db.accessControl.allowSelfRequest = allowSelfRequest;
  }
  if (sessionDurationHours && Number(sessionDurationHours) > 0) {
    db.accessControl.sessionDurationHours = Number(sessionDurationHours);
  }

  saveDb(db);
  res.json({
    success: true,
    message: 'تنظیمات قفل دسترسی و رمز یکبار مصرف با موفقیت ذخیره شد.',
    config: {
      enabled: db.accessControl.enabled,
      masterCode: db.accessControl.masterCode,
      allowSelfRequest: db.accessControl.allowSelfRequest,
      sessionDurationHours: db.accessControl.sessionDurationHours,
    },
  });
});

// Generate new OTP codes
app.post('/api/admin/access/otps/generate', requireAdmin, (req: Request, res: Response) => {
  const { count = 1, type = 'numeric', maxUses = 1, validityHours = 24, label } = req.body;
  const db = getDb();
  if (!db.accessControl) {
    db.accessControl = { ...defaultAccessControl };
  }
  if (!Array.isArray(db.accessControl.activeOtps)) {
    db.accessControl.activeOtps = [];
  }

  const generateCount = Math.min(Math.max(Number(count) || 1, 1), 50);
  const newOtps: OtpCodeItem[] = [];

  for (let i = 0; i < generateCount; i++) {
    let code = '';
    if (type === 'prefix') {
      const randPart = Math.floor(1000 + Math.random() * 9000).toString();
      code = `B4G-${randPart}`;
    } else {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const expiresAt =
      Number(validityHours) > 0
        ? new Date(Date.now() + Number(validityHours) * 3600 * 1000).toISOString()
        : null;

    const otpItem: OtpCodeItem = {
      id: crypto.randomUUID(),
      code,
      createdAt: new Date().toISOString(),
      expiresAt,
      maxUses: Number(maxUses) || 1,
      usedCount: 0,
      isBurned: false,
      label: label ? String(label).trim() : 'کد تولید شده توسط مدیر',
    };

    db.accessControl.activeOtps.unshift(otpItem);
    newOtps.push(otpItem);
  }

  saveDb(db);
  res.json({
    success: true,
    message: `${newOtps.length} رمز یکبار مصرف جدید با موفقیت تولید شد.`,
    newOtps,
    otps: db.accessControl.activeOtps,
  });
});

// Delete an OTP
app.delete('/api/admin/access/otps/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  if (!db.accessControl || !Array.isArray(db.accessControl.activeOtps)) {
    return res.status(404).json({ error: 'کد یافت نشد.' });
  }

  const initialLen = db.accessControl.activeOtps.length;
  db.accessControl.activeOtps = db.accessControl.activeOtps.filter((o) => o.id !== id);

  if (db.accessControl.activeOtps.length === initialLen) {
    return res.status(404).json({ error: 'کد یافت نشد.' });
  }

  saveDb(db);
  res.json({ success: true, message: 'کد با موفقیت حذف شد.', otps: db.accessControl.activeOtps });
});

// Clear burned or expired OTPs
app.post('/api/admin/access/otps/clear-used', requireAdmin, (req: Request, res: Response) => {
  const db = getDb();
  if (!db.accessControl || !Array.isArray(db.accessControl.activeOtps)) {
    return res.json({ success: true, removedCount: 0, otps: [] });
  }

  const now = Date.now();
  const initialLen = db.accessControl.activeOtps.length;
  db.accessControl.activeOtps = db.accessControl.activeOtps.filter((o) => {
    if (o.isBurned) return false;
    if (o.usedCount >= o.maxUses) return false;
    if (o.expiresAt && new Date(o.expiresAt).getTime() < now) return false;
    return true;
  });

  const removedCount = initialLen - db.accessControl.activeOtps.length;
  saveDb(db);
  res.json({
    success: true,
    message: `${removedCount} کد مصرف‌شده یا منقضی شده با موفقیت پاکسازی شدند.`,
    removedCount,
    otps: db.accessControl.activeOtps,
  });
});

// ----------------------------------------------------
// ADMIN TEST CONFIG MANAGEMENT
// ----------------------------------------------------

// Get test config settings and claim history
app.get('/api/admin/test-config', requireAdmin, (req: Request, res: Response) => {
  const db = getDb();
  const settings = db.testConfigSettings || defaultTestConfigSettings;
  const claims = db.testClaims || [];
  const pool = settings.pool || [];

  const poolStats = {
    total: pool.length,
    unused: pool.filter((p) => !p.isUsed).length,
    used: pool.filter((p) => p.isUsed).length,
  };

  res.json({
    settings,
    totalClaims: claims.length,
    claims: claims.slice(0, 100),
    poolStats,
  });
});

// Update test config settings
app.post('/api/admin/test-config', requireAdmin, (req: Request, res: Response) => {
  const {
    enabled,
    title,
    protocol,
    config,
    durationText,
    description,
    networkTag,
    countryCode,
    countryName,
  } = req.body;

  const db = getDb();
  if (!db.testConfigSettings) {
    db.testConfigSettings = { ...defaultTestConfigSettings };
  }

  if (typeof enabled === 'boolean') {
    db.testConfigSettings.enabled = enabled;
  }
  if (title !== undefined) {
    db.testConfigSettings.title = String(title).trim();
  }
  if (protocol !== undefined) {
    db.testConfigSettings.protocol = String(protocol).trim();
  }
  if (config !== undefined) {
    db.testConfigSettings.config = String(config).trim();
  }
  if (durationText !== undefined) {
    db.testConfigSettings.durationText = String(durationText).trim();
  }
  if (description !== undefined) {
    db.testConfigSettings.description = String(description).trim();
  }
  if (networkTag !== undefined) {
    db.testConfigSettings.networkTag = String(networkTag).trim();
  }
  if (countryCode !== undefined) {
    db.testConfigSettings.countryCode = String(countryCode).trim().toUpperCase();
  }
  if (countryName !== undefined) {
    db.testConfigSettings.countryName = String(countryName).trim();
  }

  saveDb(db);
  res.json({
    success: true,
    message: 'تنظیمات کانفیگ تست با موفقیت ذخیره شد.',
    settings: db.testConfigSettings,
  });
});

// Reset all claims (allows everyone to claim a test again)
app.post('/api/admin/test-config/reset-claims', requireAdmin, (req: Request, res: Response) => {
  const db = getDb();
  const count = (db.testClaims || []).length;
  db.testClaims = [];
  if (db.testConfigSettings) {
    db.testConfigSettings.totalClaimsCount = 0;
  }
  saveDb(db);
  res.json({
    success: true,
    message: `تاریخچه (${count} مورد) دریافت کانفیگ تست با موفقیت پاکسازی شد. اکنون همه کاربران می‌توانند مجدداً تست بگیرند.`,
  });
});

// Delete single claim by id
app.delete('/api/admin/test-config/claims/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  if (!Array.isArray(db.testClaims)) {
    return res.status(404).json({ error: 'موردی یافت نشد.' });
  }
  const initialLen = db.testClaims.length;
  db.testClaims = db.testClaims.filter((c) => c.id !== id);
  if (db.testClaims.length === initialLen) {
    return res.status(404).json({ error: 'مورد یافت نشد.' });
  }
  saveDb(db);
  res.json({
    success: true,
    message: 'رکورد تست کاربر با موفقیت حذف شد و این کاربر مجدداً می‌تواند تست بگیرد.',
  });
});

// Add configs to test pool (bulk text or single)
app.post('/api/admin/test-config/pool', requireAdmin, (req: Request, res: Response) => {
  const { bulkText, singleConfig } = req.body;
  const db = getDb();
  if (!db.testConfigSettings) {
    db.testConfigSettings = { ...defaultTestConfigSettings };
  }
  if (!Array.isArray(db.testConfigSettings.pool)) {
    db.testConfigSettings.pool = [];
  }

  const addedItems: TestConfigPoolItem[] = [];

  if (bulkText && typeof bulkText === 'string') {
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 5);

    if (lines.length === 0) {
      return res.status(400).json({ error: 'هیچ کانفیگ معتبری در متن وارد شده یافت نشد.' });
    }

    for (const line of lines) {
      const newItem: TestConfigPoolItem = {
        id: crypto.randomUUID(),
        config: line,
        isUsed: false,
        createdAt: new Date().toISOString(),
      };
      db.testConfigSettings.pool.unshift(newItem);
      addedItems.push(newItem);
    }
  } else if (singleConfig && typeof singleConfig === 'string' && singleConfig.trim().length > 5) {
    const newItem: TestConfigPoolItem = {
      id: crypto.randomUUID(),
      config: singleConfig.trim(),
      isUsed: false,
      createdAt: new Date().toISOString(),
    };
    db.testConfigSettings.pool.unshift(newItem);
    addedItems.push(newItem);
  } else {
    return res.status(400).json({ error: 'لطفاً حداقل یک کانفیگ تست وارد کنید.' });
  }

  saveDb(db);
  res.json({
    success: true,
    message: `${addedItems.length} کانفیگ تست جدید به مخزن اضافه شد.`,
    addedCount: addedItems.length,
    pool: db.testConfigSettings.pool,
  });
});

// Delete single item from test pool
app.delete('/api/admin/test-config/pool/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  if (!db.testConfigSettings || !Array.isArray(db.testConfigSettings.pool)) {
    return res.status(404).json({ error: 'موردی یافت نشد.' });
  }

  const initialLen = db.testConfigSettings.pool.length;
  db.testConfigSettings.pool = db.testConfigSettings.pool.filter((p) => p.id !== id);
  if (db.testConfigSettings.pool.length === initialLen) {
    return res.status(404).json({ error: 'کانفیگ تست یافت نشد.' });
  }

  saveDb(db);
  res.json({
    success: true,
    message: 'کانفیگ تست از مخزن حذف شد.',
    pool: db.testConfigSettings.pool,
  });
});

// Clear used or all items from test pool
app.post('/api/admin/test-config/pool/clear', requireAdmin, (req: Request, res: Response) => {
  const { clearAll = false } = req.body;
  const db = getDb();
  if (!db.testConfigSettings || !Array.isArray(db.testConfigSettings.pool)) {
    return res.json({ success: true, removedCount: 0, pool: [] });
  }

  const initialLen = db.testConfigSettings.pool.length;
  if (clearAll) {
    db.testConfigSettings.pool = [];
  } else {
    db.testConfigSettings.pool = db.testConfigSettings.pool.filter((p) => !p.isUsed);
  }

  const removedCount = initialLen - db.testConfigSettings.pool.length;
  saveDb(db);
  res.json({
    success: true,
    message: clearAll ? 'تمام کانفیگ‌های مخزن تست پاکسازی شدند.' : `${removedCount} کانفیگ تست مصرف‌شده با موفقیت پاکسازی شدند.`,
    removedCount,
    pool: db.testConfigSettings.pool,
  });
});

// ----------------------------------------------------
// ADMIN GIFT CODES MANAGEMENT
// ----------------------------------------------------

// Get all gift codes and stats
app.get('/api/admin/gift-codes', requireAdmin, (req: Request, res: Response) => {
  const db = getDb();
  const giftCodes = Array.isArray(db.giftCodes) ? db.giftCodes : [];

  const now = Date.now();
  const activeCount = giftCodes.filter((g) => {
    if (g.isBurned) return false;
    if (g.usedCount >= g.maxUses) return false;
    if (g.expiresAt && new Date(g.expiresAt).getTime() < now) return false;
    return true;
  }).length;

  const burnedOrUsed = giftCodes.length - activeCount;
  const totalRedemptions = giftCodes.reduce((sum, g) => sum + (g.usedCount || 0), 0);

  res.json({
    giftCodes,
    stats: {
      total: giftCodes.length,
      active: activeCount,
      burnedOrUsed,
      totalRedemptions,
    },
  });
});

// Create single or batch gift codes
app.post('/api/admin/gift-codes', requireAdmin, (req: Request, res: Response) => {
  const {
    code,
    config,
    title,
    protocol,
    durationText,
    description,
    maxUses = 1,
    label,
    expiresAt,
    batchCount = 1,
  } = req.body;

  if (!config || typeof config !== 'string' || !config.trim()) {
    return res.status(400).json({ error: 'لطفاً متن کانفیگ متصل به کد هدیه را وارد کنید.' });
  }

  const db = getDb();
  if (!Array.isArray(db.giftCodes)) {
    db.giftCodes = [];
  }

  const cleanConfig = config.trim();
  const cleanTitle = title ? String(title).trim() : 'کانفیگ هدیه اختصاصی B4G';
  const cleanDuration = durationText ? String(durationText).trim() : 'اشتراک هدیه پشتیبانی';
  const cleanDesc = description ? String(description).trim() : 'ارائه‌شده توسط تیم پشتیبانی تلگرام';
  const parsedMaxUses = Math.max(1, parseInt(maxUses, 10) || 1);

  let determinedProtocol = protocol ? String(protocol).trim() : '';
  if (!determinedProtocol) {
    const lower = cleanConfig.toLowerCase();
    if (lower.startsWith('vmess://')) determinedProtocol = 'vmess';
    else if (lower.startsWith('trojan://')) determinedProtocol = 'trojan';
    else if (lower.startsWith('ss://')) determinedProtocol = 'shadowsocks';
    else determinedProtocol = 'vless';
  }

  const addedItems: GiftCodeItem[] = [];
  const count = Math.min(50, Math.max(1, parseInt(batchCount, 10) || 1));

  for (let i = 0; i < count; i++) {
    let finalCode = '';
    if (count === 1 && code && typeof code === 'string' && code.trim()) {
      finalCode = code.trim().toUpperCase();
      // Check duplicate
      const exists = db.giftCodes.some((g) => g.code.toUpperCase() === finalCode);
      if (exists) {
        return res.status(400).json({ error: `کد هدیه "${finalCode}" قبلاً تعریف شده است. لطفاً کد دیگری انتخاب کنید.` });
      }
    } else {
      // Auto-generate random code e.g. B4G-7F9A2B or GIFT-8392
      const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      finalCode = `B4G-${randomSuffix}`;
      // Ensure unique
      while (db.giftCodes.some((g) => g.code.toUpperCase() === finalCode)) {
        finalCode = `B4G-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      }
    }

    const newItem: GiftCodeItem = {
      id: crypto.randomUUID(),
      code: finalCode,
      config: cleanConfig,
      title: cleanTitle,
      protocol: determinedProtocol,
      durationText: cleanDuration,
      description: cleanDesc,
      maxUses: parsedMaxUses,
      usedCount: 0,
      isBurned: false,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      label: label ? String(label).trim() : undefined,
      createdAt: new Date().toISOString(),
      redemptions: [],
    };

    db.giftCodes.unshift(newItem);
    addedItems.push(newItem);
  }

  saveDb(db);
  res.json({
    success: true,
    message: count === 1 ? `کد هدیه "${addedItems[0].code}" با موفقیت ایجاد شد.` : `${count} کد هدیه جدید با موفقیت ایجاد شدند.`,
    giftCodes: db.giftCodes,
    addedItems,
  });
});

// Toggle burn/active state of a gift code
app.post('/api/admin/gift-codes/:id/toggle', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  if (!Array.isArray(db.giftCodes)) {
    return res.status(404).json({ error: 'موردی یافت نشد.' });
  }

  const item = db.giftCodes.find((g) => g.id === id);
  if (!item) {
    return res.status(404).json({ error: 'کد هدیه یافت نشد.' });
  }

  item.isBurned = !item.isBurned;
  saveDb(db);

  res.json({
    success: true,
    message: item.isBurned ? `کد ${item.code} باطل/غیرفعال شد.` : `کد ${item.code} مجدداً فعال گردید.`,
    item,
    giftCodes: db.giftCodes,
  });
});

// Delete a gift code
app.delete('/api/admin/gift-codes/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  if (!Array.isArray(db.giftCodes)) {
    return res.status(404).json({ error: 'موردی یافت نشد.' });
  }

  const initialLen = db.giftCodes.length;
  db.giftCodes = db.giftCodes.filter((g) => g.id !== id);
  if (db.giftCodes.length === initialLen) {
    return res.status(404).json({ error: 'کد هدیه یافت نشد.' });
  }

  saveDb(db);
  res.json({
    success: true,
    message: 'کد هدیه با موفقیت حذف شد.',
    giftCodes: db.giftCodes,
  });
});

// Clear burned or completed gift codes
app.post('/api/admin/gift-codes/clear-used', requireAdmin, (req: Request, res: Response) => {
  const db = getDb();
  if (!Array.isArray(db.giftCodes)) {
    return res.json({ success: true, removedCount: 0, giftCodes: [] });
  }

  const now = Date.now();
  const initialLen = db.giftCodes.length;
  db.giftCodes = db.giftCodes.filter((g) => {
    if (g.isBurned) return false;
    if (g.usedCount >= g.maxUses) return false;
    if (g.expiresAt && new Date(g.expiresAt).getTime() < now) return false;
    return true;
  });

  const removedCount = initialLen - db.giftCodes.length;
  saveDb(db);

  res.json({
    success: true,
    message: `${removedCount} کد هدیه مصرف‌شده یا منقضی شده با موفقیت پاکسازی شدند.`,
    removedCount,
    giftCodes: db.giftCodes,
  });
});

// ----------------------------------------------------
// ADMIN USERS MANAGEMENT (View registered users, exact times, delete user)
// ----------------------------------------------------

// 1. Get all registered users for Admin
app.get('/api/admin/users', requireAdmin, (req: Request, res: Response) => {
  const db = getDb();
  const users = Array.isArray(db.users) ? db.users : [];

  const userList = users.map((u) => ({
    id: u.id,
    email: u.email,
    username: u.username,
    displayName: u.displayName || u.username,
    avatar: u.avatar || '',
    provider: u.provider || 'email',
    createdAt: u.createdAt, // Exact registration timestamp (ساعت چند جمیل زده)
    lastLoginAt: u.lastLoginAt || u.createdAt,
    role: u.role || 'user',
    registeredIp: u.registeredIp || 'نامشخص',
    registeredUserAgent: u.registeredUserAgent || 'مرورگر کاربر',
    sentToAdmin: Boolean(u.sentToAdmin),
  }));

  // Sort by newest registration first
  userList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    totalCount: userList.length,
    users: userList,
  });
});

// 2. Delete user by internal user ID
app.delete('/api/admin/users/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  if (!Array.isArray(db.users)) {
    db.users = [];
  }

  const targetIndex = db.users.findIndex((u) => u.id === id);
  if (targetIndex === -1) {
    return res.status(404).json({ error: 'کاربر مورد نظر در سیستم یافت نشد.' });
  }

  const deletedUser = db.users[targetIndex];
  db.users.splice(targetIndex, 1);

  // Invalidate any active session tokens for this user
  for (const [token, session] of activeUserTokens.entries()) {
    if (session.userId === id) {
      activeUserTokens.delete(token);
    }
  }

  saveDb(db);

  res.json({
    success: true,
    message: `کاربر @${deletedUser.username} (${deletedUser.email}) با موفقیت از پنل و سامانه ثبت‌نام حذف گردید.`,
    deletedId: id,
    remainingCount: db.users.length,
  });
});

// 3. Delete user by identifier (Username @id or Gmail/Email)
app.post('/api/admin/users/delete-by-identifier', requireAdmin, (req: Request, res: Response) => {
  const { identifier } = req.body;
  if (!identifier || typeof identifier !== 'string') {
    return res.status(400).json({ error: 'لطفاً آیدی کاربری یا ایمیل/جیمیل را وارد کنید.' });
  }

  const cleanTarget = identifier.trim().toLowerCase().replace(/^@/, '');
  const db = getDb();
  if (!Array.isArray(db.users)) {
    db.users = [];
  }

  const targetIndex = db.users.findIndex(
    (u) => u.email.toLowerCase() === cleanTarget || u.username.toLowerCase() === cleanTarget || u.id === cleanTarget
  );

  if (targetIndex === -1) {
    return res.status(404).json({ error: `کاربری با آیدی یا ایمیل "${identifier}" یافت نشد.` });
  }

  const deletedUser = db.users[targetIndex];
  const deletedId = deletedUser.id;
  db.users.splice(targetIndex, 1);

  // Invalidate active session tokens
  for (const [token, session] of activeUserTokens.entries()) {
    if (session.userId === deletedId) {
      activeUserTokens.delete(token);
    }
  }

  saveDb(db);

  res.json({
    success: true,
    message: `کاربر @${deletedUser.username} (${deletedUser.email}) با موفقیت از پنل و سامانه ثبت‌نام حذف گردید.`,
    deletedUser: sanitizeUser(deletedUser),
    remainingCount: db.users.length,
  });
});

// 4. Clear all registered users (Admin batch reset)
app.post('/api/admin/users/clear-all', requireAdmin, (req: Request, res: Response) => {
  const db = getDb();
  const count = (db.users || []).length;
  db.users = [];
  activeUserTokens.clear();
  saveDb(db);

  res.json({
    success: true,
    message: `تمام ${count} حساب کاربری ثبت‌شده با موفقیت پاکسازی شدند.`,
    removedCount: count,
  });
});

// 5. Send single user's full information card directly to Admin Messages Inbox
app.post('/api/admin/users/:id/send-to-messages', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDb();
  if (!Array.isArray(db.users)) {
    db.users = [];
  }
  const user = db.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'کاربر مورد نظر یافت نشد.' });
  }

  notifyAdminOnUserRegistration(user, user.registeredIp, user.registeredUserAgent, db, true);
  saveDb(db);

  res.json({
    success: true,
    message: `مشخصات و اطلاعات کامل کاربر @${user.username} (${user.email}) با موفقیت به بخش پیام‌های مدیر ارسال گردید.`,
    unreadMessagesCount: (db.supportMessages || []).filter((m) => !m.isRead).length,
  });
});

// 6. Send summary report of all registered users to Admin Messages Inbox
app.post('/api/admin/users/send-all-to-messages', requireAdmin, (req: Request, res: Response) => {
  const db = getDb();
  const users = Array.isArray(db.users) ? db.users : [];
  if (users.length === 0) {
    return res.status(400).json({ error: 'هیچ کاربری در سیستم ثبت نشده است.' });
  }

  if (!Array.isArray(db.supportMessages)) {
    db.supportMessages = [];
  }

  const userLines = users
    .map((u, idx) => {
      let regTime = u.createdAt;
      try {
        const d = new Date(u.createdAt);
        regTime = `${d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })} - ${d.toLocaleDateString('fa-IR')}`;
      } catch {}
      return `${idx + 1}. آیدی: @${u.username} | ایمیل: ${u.email} | تاریخ ثبت: ${regTime} | آی‌پی: ${u.registeredIp || 'نامشخص'}`;
    })
    .join('\n');

  const consolidatedMsg: SupportMessage = {
    id: 'reg_msg_all_' + crypto.randomBytes(6).toString('hex'),
    category: 'user_registration',
    configTitle: `گزارش کلی تمام ${users.length} کاربر ثبت‌نامی`,
    userContact: `مدیریت (${users.length} کاربر)`,
    senderName: `سامانه گزارش‌گیری خودکار B4G`,
    message: `📊 گزارش جامع تمام کاربران ثبت‌نامی در سامانه B4G:
━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 مجموع کاربران ثبت‌شده: ${users.length} کاربر
📅 تاریخ تولید گزارش: ${new Date().toLocaleString('fa-IR')}

فهرست کامل کاربران و زمان ثبت‌نام:
${userLines}
━━━━━━━━━━━━━━━━━━━━━━━━━━
این گزارش برای مشاهده و آرشیو مدیریت در بخش پیام‌های مدیر ذخیره شد.`,
    createdAt: new Date().toISOString(),
    isRead: false,
  };

  db.supportMessages.unshift(consolidatedMsg);
  saveDb(db);

  res.json({
    success: true,
    message: `گزارش کامل تمام ${users.length} کاربر با موفقیت به بخش پیام‌های مدیر ارسال شد.`,
    unreadMessagesCount: (db.supportMessages || []).filter((m) => !m.isRead).length,
  });
});

// 7. Get user registration forwarding settings
app.get('/api/admin/user-registration-settings', requireAdmin, (req: Request, res: Response) => {
  const db = getDb();
  res.json({
    notifyOnNewUser: db.adminNotificationSettings?.notifyOnNewUser !== false,
  });
});

// 8. Update user registration forwarding settings
app.post('/api/admin/user-registration-settings', requireAdmin, (req: Request, res: Response) => {
  const { notifyOnNewUser } = req.body;
  const db = getDb();
  if (!db.adminNotificationSettings) {
    db.adminNotificationSettings = { notifyOnNewUser: true };
  }
  db.adminNotificationSettings.notifyOnNewUser = Boolean(notifyOnNewUser);
  saveDb(db);

  res.json({
    success: true,
    message: `تنظیمات ارسال خودکار اطلاعات ثبت‌نام ذخیره شد (${db.adminNotificationSettings.notifyOnNewUser ? 'فعال' : 'غیرفعال'}).`,
    notifyOnNewUser: db.adminNotificationSettings.notifyOnNewUser,
  });
});

// ----------------------------------------------------
// VITE OR STATIC SERVING
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
