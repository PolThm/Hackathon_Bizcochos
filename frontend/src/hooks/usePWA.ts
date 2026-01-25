'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Function to update the status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Listen to network status changes
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initialize with current status
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

        // Listen to service worker updates
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

      // Listen to controller changes
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

interface PWAInstallState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  showInstallPrompt: boolean;
  isInstalled: boolean;
  showManualInstructions: boolean;
  setShowManualInstructions: (show: boolean) => void;
  handleCloseManualInstructions: () => void;
  handleInstallClick: () => Promise<void>;
  handleDismiss: () => void;
}

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [hasBeenDismissed, setHasBeenDismissed] = useState(() => {
    // Check sessionStorage on initialization
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('pwa-install-dismissed') === 'true';
    }
    return false;
  });
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showManualInstructionsRef = useRef(false);

  useEffect(() => {
    // Check if the app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return;
      }

      // Check on iOS
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    // Listen to the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Don't show immediately, wait for the timeout
    };

    // Listen to the appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    // Show install prompt after 1 second for both Android and iOS (only if not dismissed)
    const timeoutId = setTimeout(() => {
      // Double-check hasBeenDismissed before showing (it might have changed)
      const currentlyDismissed =
        typeof window !== 'undefined' &&
        sessionStorage.getItem('pwa-install-dismissed') === 'true';
      if (!isInstalled && !hasBeenDismissed && !currentlyDismissed) {
        setShowInstallPrompt(true);
      }
    }, 1000);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, deferredPrompt, hasBeenDismissed]);

  const handleDismiss = useCallback(() => {
    console.log('[PWA] handleDismiss called');
    // Clear auto-close timer
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }

    setShowInstallPrompt(false);
    setDeferredPrompt(null);
    setHasBeenDismissed(true);
    // Persist dismissal in sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa-install-dismissed', 'true');
    }
  }, []);

  // Handle closing the manual instructions modal - also dismisses the prompt
  const handleCloseManualInstructions = useCallback(() => {
    console.log('[PWA] handleCloseManualInstructions called');
    setShowManualInstructions(false);
    // When modal is closed, also dismiss the prompt permanently
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
    setHasBeenDismissed(true);
    // Persist dismissal in sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa-install-dismissed', 'true');
    }
  }, []);

  // Update ref when showManualInstructions changes
  useEffect(() => {
    showManualInstructionsRef.current = showManualInstructions;
  }, [showManualInstructions]);

  // Auto-close timer effect
  useEffect(() => {
    if (showInstallPrompt && !showManualInstructions) {
      // Clear any existing timer
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }

      // Set new timer for 10 seconds
      const timer = setTimeout(() => {
        // Only dismiss if the modal is not open (check ref for current state)
        if (!showManualInstructionsRef.current) {
          handleDismiss();
        }
      }, 10000);

      autoCloseTimerRef.current = timer;
    } else {
      // Clear timer if prompt is not showing or modal is open
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, [showInstallPrompt, showManualInstructions, handleDismiss]);

  const handleInstallClick = async (): Promise<void> => {
    console.log('[PWA] handleInstallClick called', {
      hasDeferredPrompt: !!deferredPrompt,
      showManualInstructions,
      showInstallPrompt,
    });

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;

        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      } catch (error) {
        console.error('Error installing PWA:', error);
      }
    } else {
      // For iOS, show manual instructions
      // Clear auto-close timer when opening modal
      console.log('[PWA] Opening manual instructions modal');
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
      setShowManualInstructions(true);
      // Keep the prompt visible while modal is open
    }
  };

  return {
    deferredPrompt,
    showInstallPrompt,
    isInstalled,
    showManualInstructions,
    setShowManualInstructions,
    handleCloseManualInstructions,
    handleInstallClick,
    handleDismiss,
  };
}
