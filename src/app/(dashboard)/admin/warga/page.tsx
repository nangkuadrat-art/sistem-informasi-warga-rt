import { getDbUnits } from '@/lib/data/store';
import { hitungUsia, formatTanggalIndo } from '@/lib/utils/age';
import ModalTambahKeluarga from '@/components/warga/ModalTambahKeluarga';
import ModalEditKeluarga from '@/components/warga/ModalEditKeluarga';
import ModalHapusKeluarga from '@/components/warga/ModalHapusKeluarga';
import ModalDetailKeluarga from '@/components/warga/ModalDetailKeluarga';
import ModalResetMaster from '@/components/warga/ModalResetMaster';
import {
  Home,
  Search,
  Users,
  Database,
  Award,
  LayoutGrid,
  Table as TableIcon,
  HeartHandshake,
} from 'lucide-react';

interface Props {
  searchParams: Promise<{ q?: string; status?: string; view?: string }>;
}

export default async function WargaAdminPage({ searchParams }: Props) {
  const { q, status, view } = await searchParams;
  const currentView = view === 'grid' ? 'grid' : 'table';

  // Ambil data langsung dari store yang persisten
  const allUnits = getDbUnits();
  let filteredUnits = [...allUnits];

  // Filter Status
  if (status && status !== 'semua') {
    if (status === 'aktif') {
      filteredUnits = filteredUnits.filter((k) => k.status_keluarga === 'aktif');
    } else if (status === 'kosong' || status === 'nonaktif') {
      filteredUnits = filteredUnits.filter(
        (k) => k.status_keluarga === 'nonaktif' || k.status_rumah === 'kosong'
      );
    } else if (status === 'lansia') {
      // Filter keluarga yang memiliki anggota lansia (>60 th)
      filteredUnits = filteredUnits.filter((k) =>
        k.warga?.some((w: any) => {
          const u = hitungUsia(w.tanggal_lahir);
          return u.usia >= 60;
        })
      );
    }
  }

  // Filter Pencarian
  if (q) {
    const queryLower = q.toLowerCase();
    filteredUnits = filteredUnits.filter(
      (k) =>
        k.nama_kepala_keluarga?.toLowerCase().includes(queryLower) ||
        k.blok_rumah?.toLowerCase().includes(queryLower) ||
        k.nomor_rumah?.toLowerCase().includes(queryLower) ||
        k.alamat?.toLowerCase().includes(queryLower) ||
        k.warga?.some((w: any) => w.nama_lengkap?.toLowerCase().includes(queryLower))
    );
  }

  const totalUnit = allUnits.length;
  const totalAktif = allUnits.filter((u) => u.status_keluarga === 'aktif').length;
  const totalKosong = allUnits.filter((u) => u.status_rumah === 'kosong').length;
  const totalJiwa = allUnits.reduce((acc, curr) => acc + (curr.warga?.length || 0), 0);
  const totalLansia = allUnits.reduce(
    (acc, curr) =>
      acc + (curr.warga?.filter((w: any) => hitungUsia(w.tanggal_lahir).usia >= 60).length || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Pengolahan Data Warga & RT
            </h2>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Database className="w-3 h-3" />
              Sistem CRUD RT Aktif ({totalUnit} Unit / {totalJiwa} Jiwa)
            </span>
          </div>
          <p className="text-sm text-slate-500">
            RT.03 RW.14 Perumahan BPTW Tritih Lor, Kec. Jeruklegi, Kab. Cilacap 53252.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <ModalResetMaster />
          <ModalTambahKeluarga />
        </div>
      </div>

      {/* STATS SUMMARY BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Unit Bangunan</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{totalUnit} Unit</p>
          <span className="text-[10px] text-slate-400">Blok UT, E, G, I, K, L</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase">KK Aktif</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{totalAktif} KK</p>
          <span className="text-[10px] text-emerald-600/70">Warga berpenghuni</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-semibold text-amber-600 uppercase">Unit Kosong</p>
          <p className="text-xl font-bold text-amber-700 mt-1">{totalKosong} Unit</p>
          <span className="text-[10px] text-amber-600/70">Belum dihuni</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-[11px] font-semibold text-indigo-600 uppercase">Total Warga & Lansia</p>
          <p className="text-xl font-bold text-indigo-700 mt-1">
            {totalJiwa} <span className="text-xs font-normal text-indigo-500">({totalLansia} Lansia)</span>
          </p>
          <span className="text-[10px] text-indigo-600/70">Data riil sensus RT</span>
        </div>
      </div>

      {/* FILTER & PENCARIAN & VIEW TOGGLE */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form method="GET" className="relative w-full md:w-80">
          <input type="hidden" name="view" value={currentView} />
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            name="q"
            defaultValue={q || ''}
            placeholder="Cari kepala keluarga, anggota, atau blok..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap hidden sm:inline">
              Filter:
            </span>
            <a
              href={`/admin/warga?${new URLSearchParams({
                ...(q ? { q } : {}),
                view: currentView,
              }).toString()}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
                !status || status === 'semua'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({totalUnit})
            </a>
            <a
              href={`/admin/warga?${new URLSearchParams({
                ...(q ? { q } : {}),
                status: 'aktif',
                view: currentView,
              }).toString()}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
                status === 'aktif'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Aktif ({totalAktif})
            </a>
            <a
              href={`/admin/warga?${new URLSearchParams({
                ...(q ? { q } : {}),
                status: 'kosong',
                view: currentView,
              }).toString()}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
                status === 'kosong'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Kosong ({totalKosong})
            </a>
            <a
              href={`/admin/warga?${new URLSearchParams({
                ...(q ? { q } : {}),
                status: 'lansia',
                view: currentView,
              }).toString()}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                status === 'lansia'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              Lansia
            </a>
          </div>

          {/* VIEW SWITCHER */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex-shrink-0">
            <a
              href={`/admin/warga?${new URLSearchParams({
                ...(q ? { q } : {}),
                ...(status ? { status } : {}),
                view: 'grid',
              }).toString()}`}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                currentView === 'grid'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[11px]">Kartu</span>
            </a>
            <a
              href={`/admin/warga?${new URLSearchParams({
                ...(q ? { q } : {}),
                ...(status ? { status } : {}),
                view: 'table',
              }).toString()}`}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                currentView === 'table'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="text-[11px]">Tabel</span>
            </a>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: GRID VIEW (KARTU WARGA) */}
      {currentView === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits && filteredUnits.length > 0 ? (
            filteredUnits.map((keluarga) => {
              const kepala =
                keluarga.warga?.find(
                  (w: any) =>
                    w.hubungan_keluarga === 'Kepala Keluarga' ||
                    w.hubungan_keluarga === 'Penghuni'
                ) || keluarga.warga?.[0];

              const infoUsia = kepala?.tanggal_lahir ? hitungUsia(kepala.tanggal_lahir) : null;
              const isKosong =
                keluarga.status_rumah === 'kosong' || keluarga.status_keluarga === 'nonaktif';
              const pengurusBadge =
                keluarga.role_label &&
                keluarga.role_label !== 'Warga' &&
                keluarga.role_label !== 'Non-Aktif'
                  ? keluarga.role_label
                  : null;

              return (
                <div
                  key={keluarga.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between ${
                    isKosong
                      ? 'border-slate-200/60 opacity-80 bg-slate-50/50'
                      : 'border-slate-200/80'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-900 text-white">
                        Blok {keluarga.blok_rumah} No. {keluarga.nomor_rumah}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {pengurusBadge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                            <Award className="w-3 h-3 text-blue-600" />
                            {pengurusBadge}
                          </span>
                        )}
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                            keluarga.status_rumah === 'pemilik'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isKosong
                              ? 'bg-slate-100 text-slate-500 border border-slate-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {keluarga.status_rumah}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-800 mt-3 truncate">
                      {keluarga.nama_kepala_keluarga === '-'
                        ? 'Unit Kosong (Belum Dihuni)'
                        : keluarga.nama_kepala_keluarga}
                    </h3>

                    {infoUsia && !isKosong && (
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          Usia: {infoUsia.usia} Thn ({infoUsia.kategori})
                        </span>
                        {kepala?.tanggal_lahir && (
                          <span className="text-[11px] text-slate-400">
                            Lahir: {formatTanggalIndo(kepala.tanggal_lahir)}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-3 text-xs text-slate-600 flex items-start gap-1.5">
                      <Home className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{keluarga.alamat_lengkap}</span>
                    </div>
                  </div>

                  {/* ACTION BUTTONS (CRUD) */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <ModalDetailKeluarga keluarga={keluarga} />
                    </div>

                    <div className="flex items-center gap-1">
                      <ModalEditKeluarga keluarga={keluarga} />
                      <ModalHapusKeluarga keluarga={keluarga} />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200/80">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-medium text-sm">
                Tidak ada data unit/keluarga yang cocok dengan pencarian
              </p>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: TABLE VIEW (TABEL MASTER WARGA) */}
      {currentView === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-xs font-semibold border-b">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Blok / Rumah</th>
                  <th className="py-3 px-4">Kepala Keluarga</th>
                  <th className="py-3 px-4">Status Rumah</th>
                  <th className="py-3 px-4">Jabatan Pengurus</th>
                  <th className="py-3 px-4">Usia Kepala</th>
                  <th className="py-3 px-4 text-center">Jiwa</th>
                  <th className="py-3 px-4 text-center">Aksi CRUD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUnits && filteredUnits.length > 0 ? (
                  filteredUnits.map((keluarga, idx) => {
                    const kepala =
                      keluarga.warga?.find(
                        (w: any) =>
                          w.hubungan_keluarga === 'Kepala Keluarga' ||
                          w.hubungan_keluarga === 'Penghuni'
                      ) || keluarga.warga?.[0];

                    const infoUsia = kepala?.tanggal_lahir ? hitungUsia(kepala.tanggal_lahir) : null;
                    const isKosong =
                      keluarga.status_rumah === 'kosong' || keluarga.status_keluarga === 'nonaktif';

                    return (
                      <tr
                        key={keluarga.id}
                        className={`hover:bg-slate-50/50 transition ${
                          isKosong ? 'opacity-60 bg-slate-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-xs text-slate-400 font-mono text-center">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 text-xs px-2 py-0.5 bg-slate-100 rounded">
                            {keluarga.blok_rumah}/{keluarga.nomor_rumah}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800 text-sm">
                            {keluarga.nama_kepala_keluarga === '-'
                              ? 'Unit Kosong'
                              : keluarga.nama_kepala_keluarga}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs">
                            {keluarga.alamat_lengkap}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              keluarga.status_rumah === 'pemilik'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isKosong
                                ? 'bg-slate-100 text-slate-500 border border-slate-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {keluarga.status_rumah}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {keluarga.role_label &&
                          keluarga.role_label !== 'Warga' &&
                          keluarga.role_label !== 'Non-Aktif' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                              <Award className="w-3 h-3 text-blue-600" />
                              {keluarga.role_label}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {infoUsia && !isKosong ? (
                            <span>
                              {infoUsia.usia} Thn{' '}
                              <strong className="text-[10px] text-indigo-600 font-semibold">
                                ({infoUsia.kategori})
                              </strong>
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            {keluarga.warga?.length || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <ModalDetailKeluarga keluarga={keluarga} />
                            <ModalEditKeluarga keluarga={keluarga} />
                            <ModalHapusKeluarga keluarga={keluarga} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      Tidak ada data unit yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
