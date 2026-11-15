'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SessionPayload } from '@/lib/auth/session';
import { PermissionKey } from '@/lib/data/userPermissions';
import { logoutAction } from '@/app/login/actions';
import {
  Users,
  Wallet,
  CalendarCheck,
  ShieldCheck,
  Hammer,
  Building2,
  Mail,
  UserCog,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutGrid,
  ChevronRight,
  Smartphone,
  LogOut,
  Receipt,
  BellRing,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  group: 'utama' | 'sistem' | 'warga';
  requiredAnyPermissions: PermissionKey[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/admin/warga',
    label: 'Data Warga',
    shortLabel: 'Warga',
    icon: Users,
    accentClass: 'text-blue-400',
    group: 'utama',
    requiredAnyPermissions: ['warga_view', 'warga_manage'],
  },
  {
    href: '/admin/kas',
    label: 'Kas & Keuangan',
    shortLabel: 'Kas',
    icon: Wallet,
    accentClass: 'text-emerald-400',
    group: 'utama',
    requiredAnyPermissions: ['kas_view', 'kas_manage'],
  },
  {
    href: '/admin/closing',
    label: 'Closing Bulanan',
    shortLabel: 'Closing',
    icon: CalendarCheck,
    accentClass: 'text-amber-400',
    group: 'utama',
    requiredAnyPermissions: ['closing_manage'],
  },
  {
    href: '/admin/ronda',
    label: 'Jadwal Ronda',
    shortLabel: 'Ronda',
    icon: ShieldCheck,
    accentClass: 'text-indigo-400',
    group: 'utama',
    requiredAnyPermissions: ['ronda_manage'],
  },
  {
    href: '/admin/kerja-bakti',
    label: 'Kerja Bakti',
    shortLabel: 'Kerja Bakti',
    icon: Hammer,
    accentClass: 'text-orange-400',
    group: 'utama',
    requiredAnyPermissions: ['kerja_bakti_manage'],
  },
  {
    href: '/admin/surat',
    label: 'Surat Menyurat',
    shortLabel: 'Surat',
    icon: Mail,
    accentClass: 'text-teal-400',
    group: 'sistem',
    requiredAnyPermissions: ['surat_manage'],
  },
  {
    href: '/admin/users',
    label: 'Kelola User',
    shortLabel: 'User',
    icon: UserCog,
    accentClass: 'text-violet-400',
    group: 'sistem',
    requiredAnyPermissions: ['users_manage'],
  },
  {
    href: '/warga/dashboard',
    label: 'Portal Warga (HP)',
    shortLabel: 'Portal',
    icon: Smartphone,
    accentClass: 'text-sky-400',
    group: 'warga',
    requiredAnyPermissions: ['portal_warga'],
  },
];

const WARGA_MOBILE_TABS = [
  { href: '/warga/dashboard', label: 'Beranda', icon: Receipt },
  { href: '/warga/presensi-ronda', label: 'Ronda', icon: ShieldCheck },
  { href: '/warga/presensi-kb', label: 'Kerja Bakti', icon: Hammer },
];

export default function ResponsiveShell({
  children,
  currentUser,
  pendingDepositCount = 0,
}: {
  children: React.ReactNode;
  currentUser: SessionPayload | null;
  pendingDepositCount?: number;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rt_sidebar_collapsed');
      if (saved === 'true') setSidebarCollapsed(true);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('rt_sidebar_collapsed', String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const hasPermissionForItem = (item: NavItem) => {
    if (!currentUser?.permissions) return true;
    return item.requiredAnyPermissions.some((k) => currentUser.permissions[k]);
  };

  const visibleItems = NAV_ITEMS.filter(hasPermissionForItem);
  const mainNav = visibleItems.filter((i) => i.group !== 'warga');
  const wargaNav = visibleItems.filter((i) => i.group === 'warga');
  const isPengurus = mainNav.length > 0;

  const isRouteActive = (href: string) => {
    if (href === '/warga/dashboard') return pathname === '/warga/dashboard';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const currentNav =
    visibleItems.find((item) => isRouteActive(item.href)) ||
    (pathname.startsWith('/warga/presensi-ronda')
      ? { label: 'Presensi Ronda' }
      : pathname.startsWith('/warga/presensi-kb')
      ? { label: 'Scan QR Kerja Bakti' }
      : undefined);

  // Mobile Bottom Nav Primary Items (adapt based on Pengurus vs Warga)
  const adminMobilePrimary = mainNav.slice(0, 4);
  const isOverflowRouteActive =
    isPengurus && !adminMobilePrimary.some((item) => isRouteActive(item.href));

  const displayName = currentUser?.nama || 'Pengurus RT';
  const displayRole = currentUser?.role_label || 'Administrator';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');

  const handleLogout = async () => {
    await logoutAction();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* DESKTOP STICKY COLLAPSIBLE SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col bg-slate-900 text-slate-200 sticky top-0 h-screen shrink-0 transition-all duration-200 border-r border-slate-800/80 z-20 ${
          sidebarCollapsed ? 'w-20 p-3' : 'w-64 p-4'
        } justify-between`}
      >
        <div className="flex flex-col min-h-0 overflow-y-auto no-scrollbar">
          {/* Logo Brand + Collapse Button */}
          <div
            className={`flex items-center pb-4 mb-4 border-b border-slate-800 ${
              sidebarCollapsed ? 'justify-center flex-col gap-3' : 'justify-between px-2 pt-1'
            }`}
          >
            <Link
              href={isPengurus ? mainNav[0].href : '/warga/dashboard'}
              className="flex items-center gap-3 min-w-0"
            >
              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/30 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <h1 className="font-bold text-white text-sm leading-tight truncate">
                    Sistem Warga RT
                  </h1>
                  <p className="text-[11px] text-slate-400 truncate">RT.03 RW.14 Tritih Lor</p>
                </div>
              )}
            </Link>

            <button
              type="button"
              onClick={toggleSidebar}
              title={sidebarCollapsed ? 'Perlebar Sidebar' : 'Kecilkan Sidebar'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Menu Items */}
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const active = isRouteActive(item.href);
              const showBadge = item.href === '/admin/kas' && pendingDepositCount > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`relative flex items-center gap-3 rounded-xl text-sm font-medium transition ${
                    sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
                  } ${
                    active
                      ? 'bg-blue-600/20 text-white border border-blue-500/30 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${active ? 'text-blue-300' : item.accentClass}`}
                  />
                  {!sidebarCollapsed && <span className="truncate flex-1">{item.label}</span>}
                  {showBadge && (
                    <span
                      className={
                        sidebarCollapsed
                          ? 'absolute top-1 right-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse'
                          : 'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse'
                      }
                    >
                      {pendingDepositCount}
                    </span>
                  )}
                </Link>
              );
            })}

            {wargaNav.length > 0 && (
              <div className={mainNav.length > 0 ? 'pt-4 mt-4 border-t border-slate-800' : ''}>
                {!sidebarCollapsed && (
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    {isPengurus ? 'Menu Khusus Warga' : 'Portal Mandiri Warga'}
                  </span>
                )}
                {wargaNav.map((item) => {
                  const Icon = item.icon;
                  const active = pathname.startsWith('/warga');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`flex items-center gap-3 rounded-xl text-sm font-medium transition ${
                        sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
                      } ${
                        active
                          ? 'bg-sky-600/25 text-sky-200 border border-sky-500/30'
                          : 'text-sky-300 hover:bg-slate-800 border border-transparent'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0 text-sky-400" />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>
        </div>

        {/* User Card + Logout */}
        <div className="border-t border-slate-800 pt-3 mt-3 space-y-2">
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                title={`${displayName} — ${displayRole}`}
                className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-200"
              >
                {initials || 'RT'}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Keluar dari Akun"
                className="p-2 rounded-xl text-rose-400 hover:text-white hover:bg-rose-600/20 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 px-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                <p className="text-xs text-blue-400 truncate">
                  {displayRole}
                  {currentUser?.alamat && currentUser.alamat !== '-'
                    ? ` • ${currentUser.alamat}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Keluar dari Akun"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-slate-800 transition shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MOBILE STICKY HEADER (SMARTPHONE) */}
      <header className="md:hidden sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md text-white shadow-sm border-b border-slate-800">
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Buka menu navigasi"
              className="p-2 -ml-1 rounded-xl bg-slate-800/80 text-slate-200 hover:text-white active:scale-95 transition shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider leading-none truncate">
                {displayName} • {displayRole}
              </p>
              <h1 className="font-bold text-sm text-white truncate mt-0.5">
                {currentNav?.label || 'Sistem Warga RT'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {pendingDepositCount > 0 && (
              <Link
                href="/admin/kas#persetujuan-deposit"
                title={`${pendingDepositCount} pengajuan tarik tunai deposit menunggu persetujuan`}
                className="relative inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-extrabold shadow-sm animate-pulse"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>{pendingDepositCount} Deposit</span>
              </Link>
            )}
            {isPengurus ? (
              <Link
                href={pathname.startsWith('/warga') ? mainNav[0].href : '/warga/dashboard'}
                className="text-[11px] bg-blue-600 hover:bg-blue-700 active:scale-95 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shrink-0 transition"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{pathname.startsWith('/warga') ? 'Admin' : 'Portal'}</span>
              </Link>
            ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="text-[11px] bg-rose-600/20 text-rose-200 border border-rose-500/30 hover:bg-rose-600/30 px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 shrink-0 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* DESKTOP TOP CONTEXT BAR */}
        <header className="hidden md:flex sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-6 lg:px-8 py-3 items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-400">Sistem Informasi RT.03</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-slate-800">
              {currentNav?.label || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {pendingDepositCount > 0 && (
              <Link
                href="/admin/kas#persetujuan-deposit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition shadow-sm"
              >
                <BellRing className="w-3.5 h-3.5 text-amber-700 animate-bounce" />
                <span>{pendingDepositCount} Tarik Deposit</span>
              </Link>
            )}
            {isPengurus && (
              <Link
                href={pathname.startsWith('/warga') ? mainNav[0].href : '/warga/dashboard'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                {pathname.startsWith('/warga') ? 'Kembali ke Panel Admin' : 'Buka Portal Warga'}
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 px-3.5 py-4 sm:p-6 lg:p-8 pb-24 md:pb-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (NATIVE SMARTPHONE FEEL) */}
      <nav
        aria-label="Navigasi Cepat Mobile"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] pb-safe"
      >
        {isPengurus ? (
          <div className="grid grid-cols-5 h-16 px-1">
            {adminMobilePrimary.map((item) => {
              const Icon = item.icon;
              const active = isRouteActive(item.href);
              const showBadge = item.href === '/admin/kas' && pendingDepositCount > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex flex-col items-center justify-center gap-1 rounded-xl mx-0.5 my-1 transition ${
                    active
                      ? 'text-blue-600 bg-blue-50/80 font-bold'
                      : 'text-slate-500 hover:text-slate-800 font-medium'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                  {showBadge && (
                    <span className="absolute top-1 right-2 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-extrabold">
                      {pendingDepositCount}
                    </span>
                  )}
                  <span className="text-[10px] leading-none truncate max-w-full px-1">
                    {item.shortLabel}
                  </span>
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl mx-0.5 my-1 transition ${
                isOverflowRouteActive || mobileMenuOpen
                  ? 'text-blue-600 bg-blue-50/80 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <LayoutGrid
                className={`w-5 h-5 ${
                  isOverflowRouteActive || mobileMenuOpen ? 'text-blue-600' : 'text-slate-400'
                }`}
              />
              <span className="text-[10px] leading-none">Lainnya</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 h-16 px-1">
            {WARGA_MOBILE_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl mx-0.5 my-1 transition ${
                    active
                      ? 'text-blue-600 bg-blue-50/80 font-bold'
                      : 'text-slate-500 hover:text-slate-800 font-medium'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="text-[10px] leading-none truncate max-w-full px-1">
                    {tab.label}
                  </span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center gap-1 rounded-xl mx-0.5 my-1 text-slate-500 hover:text-slate-800 font-medium transition"
            >
              <LayoutGrid className="w-5 h-5 text-slate-400" />
              <span className="text-[10px] leading-none">Akun</span>
            </button>
          </div>
        )}
      </nav>

      {/* MOBILE SLIDE-OVER DRAWER MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative w-72 max-w-[82vw] bg-slate-900 text-slate-100 h-full flex flex-col justify-between p-4 shadow-2xl overflow-y-auto z-10">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/30">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-white leading-tight">Sistem Warga RT</h2>
                    <p className="text-[11px] text-slate-400">RT.03 RW.14 Tritih Lor</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Tutup menu"
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {mainNav.length > 0 && (
                <div className="space-y-1">
                  <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Menu Pengurus RT
                  </p>
                  {mainNav.map((item) => {
                    const Icon = item.icon;
                    const active = isRouteActive(item.href);
                    const showBadge = item.href === '/admin/kas' && pendingDepositCount > 0;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${
                          active
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${active ? 'text-white' : item.accentClass}`} />
                        <span className="flex-1">{item.label}</span>
                        {showBadge && (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse">
                            {pendingDepositCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

              {wargaNav.length > 0 && (
                <div className={mainNav.length > 0 ? 'pt-4 mt-4 border-t border-slate-800 space-y-1' : 'space-y-1'}>
                  <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Layanan Warga
                  </p>
                  {wargaNav.map((item) => {
                    const Icon = item.icon;
                    const active = pathname.startsWith('/warga');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${
                          active
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-sky-300 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-5 h-5 text-sky-400" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-4 mt-4 space-y-3">
              <div className="px-2">
                <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                <p className="text-xs text-blue-400 truncate">
                  {displayRole}
                  {currentUser?.alamat && currentUser.alamat !== '-'
                    ? ` • ${currentUser.alamat}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-200 border border-rose-500/30 text-xs font-bold transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
