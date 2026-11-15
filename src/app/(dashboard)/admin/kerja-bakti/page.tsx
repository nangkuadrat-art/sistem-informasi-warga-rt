import { createClient } from '@/lib/supabase/server';
import { createJadwalKerjaBakti } from './actions';
import ModalQrViewer from '@/components/scanner/ModalQrViewer';
import { Hammer, Plus, Calendar, MapPin } from 'lucide-react';

export default async function AdminKerjaBaktiPage() {
  let daftarKegiatan: any[] = [];

  try {
    const supabase = await createClient();
    const { data: kb } = await supabase
      .from('jadwal_kerja_bakti')
      .select('*, presensi_kerja_bakti(*, keluarga(nama_kepala_keluarga, blok_rumah, nomor_rumah))')
      .order('tanggal', { ascending: false });
    daftarKegiatan = kb || [];
  } catch (e) {
    // Graceful
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Agenda Kerja Bakti Warga
          </h2>
          <p className="text-sm text-slate-500">
            Pencatatan kegiatan gotong royong dan presensi scan QR Code warga per KK.
          </p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-orange-600" />
          Jadwalkan Kerja Bakti Baru
        </h3>

        <form action={createJadwalKerjaBakti} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Kegiatan</label>
              <input
                type="text"
                name="judul"
                required
                placeholder="Pembersihan Saluran Air & Fogging"
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Lokasi Kumpul</label>
              <input
                type="text"
                name="lokasi"
                required
                placeholder="Depan Balai Warga / Pos Ronda"
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal</label>
              <input
                type="date"
                name="tanggal"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Jam Mulai</label>
              <input
                type="time"
                name="jam_mulai"
                defaultValue="07:00"
                required
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Jam Selesai</label>
              <input
                type="time"
                name="jam_selesai"
                defaultValue="10:00"
                required
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition"
            >
              Terbitkan Jadwal Kerja Bakti
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {daftarKegiatan && daftarKegiatan.length > 0 ? (
          daftarKegiatan.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <h4 className="font-bold text-slate-800 text-base">{item.judul}</h4>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-orange-500" />
                      {item.tanggal} ({item.jam_mulai} - {item.jam_selesai})
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      {item.lokasi}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ModalQrViewer qrToken={item.qr_token} judul={item.judul} />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-600 mb-2">
                  Kehadiran Keluarga Terdata: {item.presensi_kerja_bakti?.length || 0} KK Hadir
                </p>
                <div className="flex flex-wrap gap-2">
                  {item.presensi_kerja_bakti?.map((p: any) => (
                    <span
                      key={p.id}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-medium rounded-lg border border-emerald-200"
                    >
                      {p.keluarga?.nama_kepala_keluarga} (Blok {p.keluarga?.blok_rumah}/{p.keluarga?.nomor_rumah})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center bg-white rounded-2xl border border-slate-200/80">
            <Hammer className="w-8 h-8 text-slate-300 mx-auto mb-1" />
            <p className="text-xs text-slate-400">Belum ada agenda kerja bakti terjadwal</p>
          </div>
        )}
      </div>
    </div>
  );
}
