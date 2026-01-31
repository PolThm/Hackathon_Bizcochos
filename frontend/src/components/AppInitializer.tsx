'use client';

import { useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';
import { getItem, setItem } from '@/utils/indexedDB';
import { routing } from '@/i18n/routing';
import routineExampleEn from '@/mocks/routine-example-en.json';
import routineExampleFr from '@/mocks/routine-example-fr.json';
import routineExampleEs from '@/mocks/routine-example-es.json';

const PREFERRED_LOCALE_COOKIE = 'preferred-locale';

export default function AppInitializer() {
  const [isInitialized, setIsInitialized] = useState(false);
  const soundRefs = useRef({
    beepLong: null as Howl | null,
    beepShort: null as Howl | null,
    beepStart: null as Howl | null,
    victory: null as Howl | null,
    timerLoop: null as Howl | null,
  });

  // Sync saved locale from IndexedDB to cookie so middleware can use it on next open (no flicker)
  useEffect(() => {
    getItem('language').then((saved) => {
      if (saved && routing.locales.includes(saved)) {
        document.cookie = `${PREFERRED_LOCALE_COOKIE}=${saved}; path=/; max-age=31536000`;
      }
    });
  }, []);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) =>
          console.log(
            'Service Worker registered with scope:',
            registration.scope,
          ),
        )
        .catch((error) =>
          console.error('Service Worker registration failed:', error),
        );
    }

    // Preload sounds
    const sounds = {
      beepLong: new Howl({
        src: ['/sounds/beep-long.mp3'],
        html5: true,
        preload: true,
      }),
      beepShort: new Howl({
        src: ['/sounds/beep-short.mp3'],
        html5: true,
        preload: true,
        volume: 0.7,
      }),
      beepStart: new Howl({
        src: ['/sounds/beep-start.mp3'],
        html5: true,
        preload: true,
        volume: 0.3,
      }),
      victory: new Howl({
        src: ['/sounds/victory.mp3'],
        html5: true,
        preload: true,
      }),
      timerLoop: new Howl({
        src: ['/sounds/timer-loop.mp3'],
        loop: true,
        volume: 0.2,
        preload: true,
      }),
    };

    soundRefs.current = sounds;

    // Function to check if a sound is loaded
    const isSoundLoaded = (sound: Howl) => {
      return new Promise<boolean>((resolve) => {
        if (sound.state() === 'loaded') {
          resolve(true);
        } else {
          sound.once('load', () => resolve(true));
          sound.once('loaderror', () => resolve(false));
        }
      });
    };

    // Check if all sounds are loaded
    const checkAllSoundsLoaded = async () => {
      const soundPromises = Object.values(sounds).map(isSoundLoaded);
      const results = await Promise.all(soundPromises);
      const allLoaded = results.every((loaded) => loaded);

      if (allLoaded) {
        setIsInitialized(true);
      } else {
        console.warn('Some sounds failed to load');
        setIsInitialized(true); // Still initialize even if some sounds failed
      }
    };

    checkAllSoundsLoaded();

    // TODO: See if it's better to remove it or no
    // Initialize default routines if none exist
    const initializeDefaultRoutines = async () => {
      try {
        const existingRoutines = await getItem('allRoutines');
        let routines = existingRoutines ? JSON.parse(existingRoutines) : [];

        // Check if default routines were voluntarily deleted
        const deletedDefaultRoutinesStr = await getItem(
          'deletedDefaultRoutines',
        );
        const deletedDefaultRoutines = deletedDefaultRoutinesStr
          ? JSON.parse(deletedDefaultRoutinesStr)
          : { example: false };

        // Check if Example routine exists (in any language)
        const hasExample = routines.some((r: any) => r.id === 'example');

        // Only add default routines if they don't exist AND weren't voluntarily deleted
        if (!hasExample && !deletedDefaultRoutines.example) {
          // Get user locale or default to English
          const locale =
            typeof window !== 'undefined' && navigator.language.startsWith('fr')
              ? 'fr'
              : typeof window !== 'undefined' &&
                  navigator.language.startsWith('es')
                ? 'es'
                : 'en';

          let exampleRoutine;
          switch (locale) {
            case 'fr':
              exampleRoutine = routineExampleFr;
              break;
            case 'es':
              exampleRoutine = routineExampleEs;
              break;
            default:
              exampleRoutine = routineExampleEn;
          }

          if (!hasExample && !deletedDefaultRoutines.example) {
            routines.push(exampleRoutine);
          }

          await setItem('allRoutines', JSON.stringify(routines));
        }
      } catch (error) {
        console.error('Failed to initialize default routines:', error);
      }
    };

    initializeDefaultRoutines();
  }, []);

  // Make sounds available globally on window for other components to use
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      (window as any).appSounds = soundRefs.current;
    }
  }, [isInitialized]);

  // This component doesn't render anything visible
  return null;
}
