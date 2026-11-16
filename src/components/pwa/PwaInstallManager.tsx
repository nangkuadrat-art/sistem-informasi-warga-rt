'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';
import SiwaLogoBadge from '@/components/ui/SiwaLogoBadge';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_STORAGE_KEY = 'siwa_pwa_banner_dismissed_at';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export default function PwaInstallManager() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [hasInstallPrompt, setHasInstallPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  const triggerInstallPrompt = async (iosSafariFlag: boolean) => {
    const promptEvent = deferredPromptRef.current;
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setShowBanner(false);
      }
      deferredPromptRef.current = null;
      setHasInstallPrompt(false);
      return;
    }

    if (iosSafariFlag) {
      setShowIosGuide(true);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // Abaikan jika browser memblokir service worker di mode privat
      });
    }

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    const ua = window.navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(ua);
    const safari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
    const iosSafari = ios && safari;
    setIsIosSafari(iosSafari);

    const dismissedRaw = localStorage.getItem(DISMISS_STORAGE_KEY);
    const isDismissedRecently =
      dismissedRaw && Date.now() - Number(dismissedRaw) < DISMISS_TTL_MS;

    if (iosSafari && !isDismissedRecently) {
      setShowBanner(true);
    }

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      deferredPromptRef.current = promptEvent;
      setHasInstallPrompt(true);
      (window as unknown as { __siwaPwaReady?: boolean }).__siwaPwaReady = true;
      window.dispatchEvent(new CustomEvent('siwa-pwa-ready', { detail: { ready: true } }));
      if (!isDismissedRecently) {
        setShowBanner(true);
      }
    };

    const onAppInstalled = () => {
      deferredPromptRef.current = null;
      setHasInstallPrompt(false);
      setShowBanner(false);
      setShowIosGuide(false);
      setIsStandalone(true);
      (window as unknown as { __siwaPwaReady?: boolean }).__siwaPwaReady = false;
      window.dispatchEvent(new CustomEvent('siwa-pwa-ready', { detail: { ready: false } }));
    };

    const onManualTrigger = () => {
      if (deferredPromptRef.current) {
        void triggerInstallPrompt(iosSafari);
      } else if (iosSafari) {
        setShowIosGuide(true);
      } else {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    window.addEventListener('siwa-install-request', onManualTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
      window.removeEventListener('siwa-install-request', onManualTrigger);
    };
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    } catch {
      // Abaikan kegagalan storage
    }
  };

  const handleInstallClick = () => {
    void triggerInstallPrompt(isIosSafari);
  };

  if (isStandalone) return null;
  if (!showBanner && !showIosGuide) return null;
  if (!hasInstallPrompt && !isIosSafari) return null;

  return (
    <>
      {showBanner && (
        <div
          role="region"
          aria-label="Pasang Aplikasi SIWA"
          className="fixed bottom-20 md:bottom-5 right-3 left-3 md:left-auto md:w-[390px] z-40 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl shadow-slate-950/40 flex items-center gap-3">
            <SiwaLogoBadge size="md" className="rounded-xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-extrabold tracking-tight text-white">
                  Pasang Aplikasi SIWA
                </p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                Tambahkan ke layar utama HP untuk akses cepat layaknya aplikasi.
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-gradient-to-r from-sky-400 to-emerald-400 hover:opacity-95 active:scale-95 text-slate-950 text-xs font-extrabold shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Pasang</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Tutup ajakan pasang aplikasi"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <SiwaLogoBadge size="md" />
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Install SIWA di iPhone / iPad
                  </h3>
                  <p className="text-xs text-slate-500">
                    Melalui browser Safari iOS
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                <Share className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  1. Ketuk ikon <strong>Bagikan (Share)</strong> di bilah bawah atau atas Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                <PlusSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  2. Gulir ke bawah lalu pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                <Smartphone className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  3. Ketuk <strong>Tambah</strong>, ikon aplikasi <strong>SIWA</strong> akan muncul di layar utama.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => {
                setShowIosGuide(false);
                handleDismiss();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
