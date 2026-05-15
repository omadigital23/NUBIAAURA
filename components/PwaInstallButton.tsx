'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

type PwaInstallButtonProps = {
  variant?: 'desktop' | 'mobile';
};

function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false;

  const navigatorWithStandalone = window.navigator as NavigatorWithStandalone;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    navigatorWithStandalone.standalone === true
  );
}

function isIosSafariInstallFallback() {
  if (typeof window === 'undefined') return false;

  const navigatorWithStandalone = window.navigator as NavigatorWithStandalone;
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIosDevice =
    /iphone|ipad|ipod/.test(userAgent) ||
    (userAgent.includes('macintosh') && window.navigator.maxTouchPoints > 1);
  const isStandalone =
    navigatorWithStandalone.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;

  return isIosDevice && !isStandalone;
}

export default function PwaInstallButton({ variant = 'desktop' }: PwaInstallButtonProps) {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canShowIosHint, setCanShowIosHint] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);

  useEffect(() => {
    setIsInstalled(isStandaloneDisplay());
    setCanShowIosHint(isIosSafariInstallFallback());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setCanShowIosHint(false);
      setIsInstalled(false);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowIosHint(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installLabel = t('pwa.install_short', 'Installer');
  const installTitle = t('pwa.install', "Installer l'application");
  const iosHint = t(
    'pwa.install_ios_hint',
    "Sur iPhone/iPad: utilisez Partager puis Ajouter a l'ecran d'accueil."
  );

  const handleInstall = useCallback(async () => {
    if (isInstalled || isPrompting) return;

    if (!deferredPrompt) {
      if (canShowIosHint) {
        setShowIosHint((current) => !current);
      }
      return;
    }

    setIsPrompting(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsInstalled(choice.outcome === 'accepted');
    } finally {
      setIsPrompting(false);
    }
  }, [canShowIosHint, deferredPrompt, isInstalled, isPrompting]);

  const shouldRender = useMemo(
    () => !isInstalled && (Boolean(deferredPrompt) || (variant === 'mobile' && canShowIosHint)),
    [canShowIosHint, deferredPrompt, isInstalled, variant]
  );

  if (!shouldRender) return null;

  if (variant === 'mobile') {
    return (
      <div className="space-y-2 px-4">
        <button
          type="button"
          onClick={handleInstall}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-nubia-gold/45 bg-nubia-gold px-4 py-3 text-sm font-bold text-nubia-black transition-colors hover:bg-nubia-white focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 focus:ring-offset-nubia-black disabled:cursor-wait disabled:opacity-75"
          disabled={isPrompting}
          aria-label={installTitle}
          title={installTitle}
        >
          <Smartphone size={18} aria-hidden="true" />
          <span>{installLabel}</span>
        </button>
        {showIosHint && (
          <p className="rounded-lg border border-nubia-gold/25 bg-nubia-gold/10 px-3 py-2 text-xs leading-5 text-nubia-white/82">
            {iosHint}
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      className="hidden items-center gap-2 rounded-lg border border-nubia-gold/35 bg-nubia-gold/10 px-3 py-2 text-sm font-semibold text-nubia-gold transition-colors hover:border-nubia-gold hover:bg-nubia-gold hover:text-nubia-black focus:outline-none focus:ring-2 focus:ring-nubia-gold focus:ring-offset-2 focus:ring-offset-nubia-black disabled:cursor-wait disabled:opacity-75 lg:inline-flex"
      disabled={isPrompting}
      aria-label={installTitle}
      title={installTitle}
    >
      <Download size={17} aria-hidden="true" />
      <span className="hidden lg:inline">{installLabel}</span>
    </button>
  );
}
