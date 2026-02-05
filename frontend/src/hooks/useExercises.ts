'use client';

import { useState, useEffect } from 'react';
import { getItem } from '@/utils/indexedDB';
import { getExercisesByLocale, LibraryExercise } from '@/utils/exercises';

/**
 * Hook that returns exercises for the given locale.
 * When the user has entered the "demo" reference in parameters,
 * returns demo-exercises instead of all-exercises (for all 3 languages).
 */
export function useExercises(locale: string): LibraryExercise[] {
  const [useDemo, setUseDemo] = useState(false);

  useEffect(() => {
    const loadDemoPreference = async () => {
      try {
        const saved = await getItem('isDemoActivated');
        const value = typeof saved === 'string' ? JSON.parse(saved) : saved;
        setUseDemo(value === true);
      } catch {
        setUseDemo(false);
      }
    };

    loadDemoPreference();
  }, []);

  useEffect(() => {
    const handleStorageChange = (
      e: CustomEvent<{ key: string; value: unknown }>,
    ) => {
      if (e.detail?.key === 'isDemoActivated') {
        const v = e.detail.value;
        setUseDemo(
          v === true || (typeof v === 'string' && JSON.parse(v) === true),
        );
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(
        'indexeddb-change',
        handleStorageChange as EventListener,
      );
      return () => {
        window.removeEventListener(
          'indexeddb-change',
          handleStorageChange as EventListener,
        );
      };
    }
  }, []);

  return getExercisesByLocale(locale, useDemo);
}
