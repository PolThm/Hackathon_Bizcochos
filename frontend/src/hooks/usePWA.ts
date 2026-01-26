'use client';

import { useState, useEffect, useCallback } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return isOnline;
}

export function useServiceWorker() {
  const [swRegistration, setSwRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        setSwRegistration(registration);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                setIsUpdateAvailable(true);
              }
            });
          }
        });
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  const updateServiceWorker = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return {
    swRegistration,
    isUpdateAvailable,
    updateServiceWorker,
  };
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const SESSION_STORAGE_KEY = 'pwa-install-dismissed';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Check if already dismissed this session
  const isDismissed = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
  }, []);

  // Mark as dismissed
  const markDismissed = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    }
  }, []);

  // Check if app is installed
  useEffect(() => {
    setIsMounted(true);

    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
      }
      if ((window.navigator as any).standalone === true) {
        return true;
      }
      return false;
    };

    if (checkIfInstalled()) {
      setIsInstalled(true);
      return;
    }

    // Listen to beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen to appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show prompt after delay if not dismissed
    const showTimeout = setTimeout(() => {
      if (!isDismissed()) {
        setIsVisible(true);
      }
    }, 1500);

    return () => {
      clearTimeout(showTimeout);
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isDismissed]);

  // Auto-hide after 15 seconds (only if manual instructions not open)
  useEffect(() => {
    if (!isVisible || showManualInstructions) return;

    const autoHideTimeout = setTimeout(() => {
      setIsVisible(false);
      markDismissed();
    }, 15000);

    return () => clearTimeout(autoHideTimeout);
  }, [isVisible, showManualInstructions, markDismissed]);

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
        setIsVisible(false);
        markDismissed();
      } catch (error) {
        console.error('Error installing PWA:', error);
      }
    } else {
      // iOS or browser without native prompt - show manual instructions
      setShowManualInstructions(true);
    }
  }, [deferredPrompt, markDismissed]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    markDismissed();
  }, [markDismissed]);

  const handleCloseManualInstructions = useCallback(() => {
    setShowManualInstructions(false);
    setIsVisible(false);
    markDismissed();
  }, [markDismissed]);

  return {
    isVisible,
    isInstalled,
    isMounted,
    showManualInstructions,
    handleInstallClick,
    handleDismiss,
    handleCloseManualInstructions,
  };
}
