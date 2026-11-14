import Link from 'next/link';
import {
  Users,
  Wallet,
  CalendarCheck,
  ShieldCheck,
  Hammer,
  Building2,
  Mail,
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex md:w-64 flex-col bg-slate-900 text-slate-200 p-4 justify-between shrink-0 min-h-screen">
        <div>
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-slate-800">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm leading-tight">Sistem Warga RT</h1>
              <p className="text-[11px] text-slate-400">RT.03 RW.14 Tritih Lor</p>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="space-y-1">
            <Link
              href="/admin/warga"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 hover:text-white transition"
            >
              <Users className="w-5 h-5 text-blue-400" />
              Data Warga
            </Link>
            <Link
              href="/admin/kas"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 hover:text-white transition"
            >
              <Wallet className="w-5 h-5 text-emerald-400" />
              Kas & Keuangan
            </Link>
            <Link
              href="/admin/closing"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 hover:text-white transition"
            >
              <CalendarCheck className="w-5 h-5 text-amber-400" />
              Closing Bulanan
            </Link>
            <Link
              href="/admin/ronda"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 hover:text-white transition"
            >
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Jadwal Ronda
            </Link>
            <Link
              href="/admin/kerja-bakti"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 hover:text-white transition"
            >
              <Hammer className="w-5 h-5 text-orange-400" />
              Kerja Bakti
            </Link>
            <Link
              href="/admin/surat"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 hover:text-white transition"
            >
              <Mail className="w-5 h-5 text-teal-400" />
              Surat Menyurat
            </Link>
            <div className="pt-4 mt-4 border-t border-slate-800">
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Menu Khusus Warga
              </span>
              <Link
                href="/warga/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl text-sm font-medium hover:bg-slate-800 text-blue-300 transition"
              >
                <Building2 className="w-5 h-5 text-blue-400" />
                Portal Warga (HP)
              </Link>
            </div>
          </nav>
        </div>

        {/* User Card */}
        <div className="border-t border-slate-800 pt-4 px-3">
          <p className="text-sm font-semibold text-white">Yuli Ardinurman</p>
          <p className="text-xs text-blue-400">Ketua RT.03 / RW.14</p>
        </div>
      </aside>

      {/* MOBILE TOPBAR */}
      <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-400" />
          <span className="font-bold text-sm">Sistem Informasi Warga RT</span>
        </div>
        <Link href="/admin/warga" className="text-xs bg-blue-600 px-3 py-1.5 rounded-lg font-medium">
          Menu
        </Link>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
