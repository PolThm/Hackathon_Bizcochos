import allExercisesEn from '@/mocks/all-exercises-en.json';
import allExercisesEs from '@/mocks/all-exercises-es.json';
import allExercisesFr from '@/mocks/all-exercises-fr.json';

export interface LibraryExercise {
  id: string;
  name: string;
  image: string;
  instructions: string[];
  tips: string[];
  modifications: string[];
  benefits: string[];
}

const exercisesByLocale: Record<string, LibraryExercise[]> = {
  en: allExercisesEn as LibraryExercise[],
  es: allExercisesEs as LibraryExercise[],
  fr: allExercisesFr as LibraryExercise[],
};

/**
 * Returns the list of exercises for the given locale.
 * Falls back to English if the locale is not supported.
 */
export function getExercisesByLocale(locale: string): LibraryExercise[] {
  return exercisesByLocale[locale] ?? exercisesByLocale.en;
}
