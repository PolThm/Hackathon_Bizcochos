import allExercisesEn from '@/mocks/all-exercises-en.json';
import allExercisesEs from '@/mocks/all-exercises-es.json';
import allExercisesFr from '@/mocks/all-exercises-fr.json';
import demoExercisesEn from '@/mocks/demo-exercises-en.json';
import demoExercisesEs from '@/mocks/demo-exercises-es.json';
import demoExercisesFr from '@/mocks/demo-exercises-fr.json';

export interface LibraryExercise {
  id: string;
  name: string;
  image: string;
  instructions: string[];
  tips: string[];
  modifications: string[];
  benefits: string[];
}

const allExercisesByLocale: Record<string, LibraryExercise[]> = {
  en: allExercisesEn as LibraryExercise[],
  es: allExercisesEs as LibraryExercise[],
  fr: allExercisesFr as LibraryExercise[],
};

const demoExercisesByLocale: Record<string, LibraryExercise[]> = {
  en: demoExercisesEn as LibraryExercise[],
  es: demoExercisesEs as LibraryExercise[],
  fr: demoExercisesFr as LibraryExercise[],
};

/**
 * Returns the list of exercises for the given locale.
 * When useDemo is true, returns demo exercises; otherwise returns full library.
 * Falls back to English if the locale is not supported.
 */
export function getExercisesByLocale(
  locale: string,
  useDemo = false,
): LibraryExercise[] {
  const exercisesByLocale = useDemo
    ? demoExercisesByLocale
    : allExercisesByLocale;
  return exercisesByLocale[locale] ?? exercisesByLocale.en;
}

/**
 * Parses exercise benefits (comma-separated strings in the benefits array)
 * into a flat list of individual benefit names.
 */
export function getExerciseBenefitList(exercise: LibraryExercise): string[] {
  return exercise.benefits.flatMap((s) =>
    s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
  );
}

/**
 * Returns true if the exercise has the given benefit.
 */
export function exerciseHasBenefit(
  exercise: LibraryExercise,
  benefit: string,
): boolean {
  return getExerciseBenefitList(exercise).includes(benefit);
}
