import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/serverSession';
import { getDefaultHomeForSession } from '@/lib/auth/session';
import LoginFormClient from '@/components/auth/LoginFormClient';
import SiwaLogoBadge from '@/components/ui/SiwaLogoBadge';
import { ShieldCheck, Wallet, Users, Smartphone } from 'lucide-react';

interface Props {
  searchParams: Promise<{ next?: string; denied?: string; switch?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { next, denied, switch: switchAccount } = await searchParams;
  const session = await getCurrentSession();

  if (session && switchAccount !== '1') {
    redirect(getDefaultHomeForSession(session));
  }

  return (
    <div className="min-h-screen bg-slate-100 lg:bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md lg:max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200/80 lg:border-slate-800">
        {/* LEFT BRANDING PANEL (PC DESKTOP & COMPACT HEADER ON MOBILE) */}
        <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <SiwaLogoBadge size="xl" className="w-14 h-14 shadow-xl shadow-blue-950/50" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
                    SIWA • RT.03 / RW.14
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-black text-white leading-tight mt-1">
                  Sistem Informasi Warga
                </h1>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed hidden sm:block">
              Portal terpadu pengelolaan kependudukan, transparansi kas RT, penutupan buku bulanan, jadwal ronda, kerja bakti, dan administrasi surat warga Tritih Lor, Jeruklegi, Cilacap.
            </p>
          </div>

          {/* Feature Highlights (Visible on Tablet/Desktop) */}
          <div className="hidden lg:grid grid-cols-2 gap-3">
            <div className="bg-white/10 border border-white/10 p-3.5 rounded-2xl space-y-1">
              <Users className="w-4 h-4 text-blue-300" />
              <p className="text-xs font-bold text-white">56 Unit Warga</p>
              <p className="text-[11px] text-slate-300">Data warga aman & bebas NIK/KK</p>
            </div>
            <div className="bg-white/10 border border-white/10 p-3.5 rounded-2xl space-y-1">
              <Wallet className="w-4 h-4 text-emerald-300" />
              <p className="text-xs font-bold text-white">Kas Transparan</p>
              <p className="text-[11px] text-slate-300">Buku kas & closing bulanan klop</p>
            </div>
            <div className="bg-white/10 border border-white/10 p-3.5 rounded-2xl space-y-1">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <p className="text-xs font-bold text-white">Hak Akses Role</p>
              <p className="text-[11px] text-slate-300">Menu otomatis sesuai jabatan</p>
            </div>
            <div className="bg-white/10 border border-white/10 p-3.5 rounded-2xl space-y-1">
              <Smartphone className="w-4 h-4 text-sky-300" />
              <p className="text-xs font-bold text-white">Siap PC & HP</p>
              <p className="text-[11px] text-slate-300">Portal mandiri & presensi QR/GPS</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-between text-[11px] text-slate-400 pt-4 border-t border-white/10">
            <span>Desa Tritih Lor, Kec. Jeruklegi</span>
            <span>Kab. Cilacap 53252</span>
          </div>
        </div>

        {/* RIGHT LOGIN FORM PANEL */}
        <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-white">
          <div className="space-y-1.5 mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Masuk ke Akun Anda
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Gunakan akun Pengurus RT atau akun Warga yang terdaftar.
            </p>
          </div>

          {denied === '1' && (
            <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              Anda tidak memiliki izin untuk mengakses halaman tersebut. Silakan masuk dengan akun yang sesuai.
            </div>
          )}

          <LoginFormClient nextPath={next} />
        </div>
      </div>

      <p className="text-[11px] text-slate-500 lg:text-slate-400 mt-5 text-center">
        © 2026 Pengurus RT.03 / RW.14 Perumahan BPTW Tritih Lor
      </p>
    </div>
  );
}
