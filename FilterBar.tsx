import React from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedProtocol: string;
  onSelectProtocol: (protocol: string) => void;
  selectedOperator: string;
  onSelectOperator: (operator: string) => void;
  sortBy: 'newest' | 'copies' | 'ping';
  onSortChange: (sort: 'newest' | 'copies' | 'ping') => void;
  totalFiltered: number;
  rgbActive?: boolean;
  onToggleRgb?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedProtocol,
  onSelectProtocol,
  selectedOperator,
  onSelectOperator,
  sortBy,
  onSortChange,
  totalFiltered,
}) => {
  const { language, t } = useLanguage();

  const protocols = [
    { id: 'all', label: language === 'fa' ? 'همه پروتکل‌ها' : 'All Protocols' },
    { id: 'vless', label: 'VLESS' },
    { id: 'vmess', label: 'VMess' },
    { id: 'trojan', label: 'Trojan' },
    { id: 'ss', label: 'Shadowsocks' },
    { id: 'wireguard', label: 'WireGuard' },
    { id: 'hysteria2', label: 'Hysteria 2' },
  ];

  const operators = [
    { id: 'all', label: language === 'fa' ? 'همه اپراتورها' : 'All Carriers' },
    { id: 'mci', label: language === 'fa' ? 'همراه اول' : 'MCI' },
    { id: 'mtn', label: language === 'fa' ? 'ایرانسل' : 'Irancell' },
    { id: 'rightel', label: language === 'fa' ? 'رایتل' : 'Rightel' },
    { id: 'wifi', label: language === 'fa' ? 'مخابرات و وای‌فای' : 'Home Wi-Fi' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-xl flex flex-col gap-4 shadow-xl shadow-slate-950/40 relative overflow-hidden">
        {/* Subtle background ambient highlight */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Search and Sort Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-between relative z-10">
          <div className="relative w-full sm:max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-cyan-400/80 absolute rtl:right-3.5 rtl:left-auto ltr:left-3.5 ltr:right-auto top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('searchPlaceholder', 'جستجو در نام، پروتکل، اپراتور یا کشور...')}
                className="w-full rtl:pr-10 rtl:pl-9 ltr:pl-10 ltr:pr-9 py-2.5 rounded-xl bg-slate-950/95 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/20 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute rtl:left-3 rtl:right-auto ltr:right-3 ltr:left-auto top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 z-10 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{t('countLabel', 'تعداد:')}</span>
              <span className="text-cyan-300 font-bold font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                {totalFiltered}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 shadow-inner">
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as any)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="newest" className="bg-slate-900 text-slate-100">
                  {t('sortNewest', 'جدیدترین‌ها')}
                </option>
                <option value="copies" className="bg-slate-900 text-slate-100">
                  {t('sortCopies', 'بیشترین استفاده')}
                </option>
                <option value="ping" className="bg-slate-900 text-slate-100">
                  {t('sortPing', 'بهترین پینگ')}
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Protocols Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none relative z-10">
          {protocols.map((proto) => {
            const isSelected = selectedProtocol === proto.id;
            return (
              <button
                key={proto.id}
                onClick={() => onSelectProtocol(proto.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 ring-1 ring-cyan-400'
                    : 'bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                {proto.label}
              </button>
            );
          })}
        </div>

        {/* Operators Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none relative z-10 border-t border-slate-800/50 pt-2.5">
          {operators.map((op) => {
            const isSelected = selectedOperator === op.id;
            return (
              <button
                key={op.id}
                onClick={() => onSelectOperator(op.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/30 ring-1 ring-sky-400'
                    : 'bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                {op.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
