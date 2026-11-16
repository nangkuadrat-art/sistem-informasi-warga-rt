import type { Metadata, Viewport } from 'next';
import './globals.css';
import PwaInstallManager from '@/components/pwa/PwaInstallManager';

export const metadata: Metadata = {
  title: 'SIWA RT.03 — Sistem Informasi Warga RT.03 / RW.14',
  description: 'Pengelolaan Data Warga, Keuangan Kas, Closing, Ronda, Kerja Bakti & Surat RT',
  applicationName: 'SIWA',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SIWA',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/siwa-logo.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className="antialiased bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        {children}
        <PwaInstallManager />
      </body>
    </html>
  );
}
