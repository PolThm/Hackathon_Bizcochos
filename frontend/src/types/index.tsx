export interface Exercise {
  id: number;
  name: string;
  duration: number;
  isPaused?: boolean;
  exerciseId?: string; // ID from the exercise library
}

export interface Routine {
  id: string | number;
  name: string;
  breakDuration: number;
  preparationDuration: number;
  exercises: Exercise[];
}

export enum RoutineMocks {
  Polux = 'polux',
}

export enum Navigation {
  Prev,
  Next,
}

export enum Language {
  English = 'en',
  French = 'fr',
  Spanish = 'es',
}

export enum ValidReferences {
  Polux = 'polux',
  Rapido = 'rapido',
}
