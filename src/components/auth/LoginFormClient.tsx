'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/app/login/actions';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Users,
} from 'lucide-react';

interface Props {
  nextPath?: string;
}

const QUICK_ACCOUNTS = [
  { label: 'Ketua RT (Yuli)', username: 'yuli', role: 'Ketua RT' },
  { label: 'Bendahara (Nanang)', username: 'nanang', role: 'Bendahara' },
  { label: 'Keamanan (BE Santoso)', username: 'be', role: 'Keamanan' },
  { label: 'Superadmin (Hadi)', username: 'hadi', role: 'Superadmin' },
  { label: 'Warga (Tito UT/1)', username: 'tito', role: 'Warga' },
  { label: 'Warga (Hardi UT/5)', username: 'hardi', role: 'Warga' },
];

export default function LoginFormClient({ nextPath }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('remember', remember ? 'true' : 'false');
      if (nextPath) formData.append('next', nextPath);

      const res = await loginAction(formData);
      if (res.success && res.redirectTo) {
        router.push(res.redirectTo);
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Gagal login. Silakan coba lagi.');
        setIsLoading(false);
      }
    } catch {
      setErrorMsg('Terjadi gangguan koneksi. Silakan coba kembali.');
      setIsLoading(false);
    }
  };

  const handleQuickFill = (uname: string) => {
    setUsername(uname);
    setPassword('12345');
    setErrorMsg(null);
  };

  return (
    <div className="space-y-5">
      {errorMsg && (
        <div
          role="alert"
          className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div className="space-y-1.5">
          <label
            htmlFor="username"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
          >
            Username Akun
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: yuli, nanang, tito..."
              className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password akun..."
              className="w-full pl-10 pr-11 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="inline-flex items-center gap-2 text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Tetap masuk selama 30 hari</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60 text-white font-bold py-3.5 px-4 rounded-xl text-sm shadow-lg shadow-blue-600/25 transition flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memverifikasi Akun...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Masuk ke Aplikasi</span>
            </>
          )}
        </button>
      </form>

      {/* Collapsible Quick Access Guide */}
      <div className="pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowGuide((prev) => !prev)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-800 py-1.5 transition"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Panduan & Akses Cepat Akun Default
          </span>
          {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showGuide && (
          <div className="mt-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Ketuk salah satu akun di bawah untuk mengisi otomatis (password default:{' '}
              <code className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-bold text-slate-800">
                12345
              </code>
              ). Akun warga lainnya memakai username nama panggilan (huruf kecil).
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => handleQuickFill(acc.username)}
                  className="text-left p-2 rounded-xl bg-white hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 transition group"
                >
                  <p className="text-[11px] font-bold text-slate-800 group-hover:text-blue-700 truncate">
                    {acc.label}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">@{acc.username}</p>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3 text-slate-400 shrink-0" />
              Pengurus masuk ke Panel Admin sesuai hak akses; Warga diarahkan ke Portal Warga.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
