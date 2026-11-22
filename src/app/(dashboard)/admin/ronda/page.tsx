import { getAllJadwalRonda, getListWargaForRonda } from '@/lib/data/storeKegiatan';
import { createJadwalRonda, prosesAutoDendaRonda } from './actions';
import { Plus, CheckCircle, AlertTriangle, Users } from 'lucide-react';

export default async function AdminRondaPage() {
  const daftarJadwal = getAllJadwalRonda();
  const listWarga = getListWargaForRonda();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Jadwal & Presensi Ronda Malam
          </h2>
          <p className="text-sm text-slate-500">
            Penugasan piket keamanan lingkungan RT.03 RW.14 Tritih Lor.
          </p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" />
          Buat Jadwal Piket Ronda Baru
        </h3>

        <form action={createJadwalRonda} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal</label>
              <input
                type="date"
                name="tanggal"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Jam Mulai</label>
              <input
                type="time"
                name="jam_mulai"
                defaultValue="22:00"
                required
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Jam Selesai</label>
              <input
                type="time"
                name="jam_selesai"
                defaultValue="04:00"
                required
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Pilih Warga Bertugas:
            </label>
            <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl p-2.5 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {listWarga && listWarga.length > 0 ? (
                listWarga.map((w) => (
                  <label
                    key={w.id}
                    className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-2 rounded-lg bg-slate-50/80 hover:bg-blue-50/60 border border-slate-100 transition"
                  >
                    <input type="checkbox" name="warga_ids" value={w.id} className="rounded text-blue-600 w-4 h-4 shrink-0" />
                    <span className="truncate">{w.nama_lengkap}</span>
                  </label>
                ))
              ) : (
                <p className="text-xs text-slate-400 col-span-full">Belum ada daftar warga</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition"
            >
              Terbitkan Jadwal Ronda
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {daftarJadwal && daftarJadwal.length > 0 ? (
          daftarJadwal.map((j) => (
            <div
              key={j.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-base">Malam {j.tanggal}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                      {j.jam_mulai} - {j.jam_selesai}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Petugas Terjadwal: {j.peserta_ronda?.length || 0} Orang
                  </p>
                </div>

                <div>
                  {j.is_processed_denda ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                      <CheckCircle className="w-3.5 h-3.5" /> Denda Alfa Selesai Diproses
                    </span>
                  ) : (
                    <form
                      action={async () => {
                        'use server';
                        await prosesAutoDendaRonda(j.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Proses Denda Bagi yang Tidak Hadir
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {j.peserta_ronda?.map((p: any) => {
                  const presensi = j.presensi_ronda?.find((pr: any) => pr.warga_id === p.warga_id);

                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border flex items-center gap-3 ${
                        presensi
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <Users className="w-5 h-5" />
                      </div>

                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {p.warga?.nama_lengkap}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {presensi ? (
                            <span className="text-emerald-700 font-semibold">
                              Hadir ({presensi.jarak_meter}m)
                            </span>
                          ) : (
                            <span className="text-red-500 font-medium">Belum Presensi</span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center bg-white rounded-2xl border border-slate-200/80">
            <p className="text-xs text-slate-400">Belum ada jadwal ronda</p>
          </div>
        )}
      </div>
    </div>
  );
}
