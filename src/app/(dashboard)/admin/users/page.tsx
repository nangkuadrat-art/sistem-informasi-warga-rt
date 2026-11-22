import { getAllUsers } from '@/lib/data/storeUsers';
import { getDbUnits } from '@/lib/data/store';
import TabelUsersClient from '@/components/users/TabelUsersClient';
import { UserCog, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminUsersPage() {
  const users = getAllUsers();
  const rawUnits = getDbUnits();

  const unitOptions = rawUnits.map((u) => ({
    id: u.id,
    no_unit: u.no_unit,
    alamat: u.alamat,
    nama_kepala_keluarga: u.nama_kepala_keluarga,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Kelola User & Hak Akses
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <ShieldCheck className="w-3.5 h-3.5" /> Role-Based Access Control
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manajemen akun Pengurus RT dan Akun Warga (CRUD kredensial, jabatan role, serta izin
            akses per modul aplikasi).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm text-xs">
          <UserCog className="w-4 h-4 text-blue-600" />
          <span className="text-slate-600 font-medium">
            Sinkron dengan <strong>56 Unit Rumah</strong> & Portal Warga
          </span>
        </div>
      </div>

      {/* Main Client Interactive Table */}
      <TabelUsersClient users={users} units={unitOptions} />
    </div>
  );
}
