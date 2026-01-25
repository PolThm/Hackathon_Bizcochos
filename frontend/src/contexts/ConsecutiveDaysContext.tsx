'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  FC,
  PropsWithChildren,
} from 'react';
import { differenceInCalendarDays } from 'date-fns';
import { setItem, getItem } from '@/utils/indexedDB';

interface ConsecutiveDaysContextProps {
  consecutiveDays: number;
  isDayValidated: boolean;
  incrementConsecutiveDays: () => void;
  isLoading: boolean;
}

const ONE_HOUR = 1000 * 3600;
const DAY_RESET_HOUR = 6; // The day resets at 6am

const ConsecutiveDaysContext = createContext<
  ConsecutiveDaysContextProps | undefined
>(undefined);

export const useConsecutiveDays = (): ConsecutiveDaysContextProps => {
  const context = useContext(ConsecutiveDaysContext);
  if (!context) {
    throw new Error(
      'useConsecutiveDays must be used within a ConsecutiveDaysProvider',
    );
  }
  return context;
};

export const ConsecutiveDaysProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [consecutiveDays, setConsecutiveDays] = useState<number>(0);
  const [isDayValidated, setIsDayValidated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const updateConsecutiveDays = useCallback(async () => {
    setIsLoading(true);

    try {
      const storedConsecutiveDays = await getItem('consecutiveDays');
      const storedIsDayValidated = await getItem('isDayValidated');
      const storedLastRoutineDate = await getItem('lastRoutineDate');

      const lastRoutineDate = storedLastRoutineDate
        ? new Date(storedLastRoutineDate)
        : null;

      if (storedConsecutiveDays !== null)
        setConsecutiveDays(parseInt(storedConsecutiveDays, 10));
      if (storedIsDayValidated !== null)
        setIsDayValidated(storedIsDayValidated === 'true');

      if (lastRoutineDate) {
        const now = new Date();

        // Function to normalize a date according to our app day logic (6am = start)
        const normalizeToAppDay = (date: Date): Date => {
          const normalized = new Date(date);
          if (normalized.getHours() < DAY_RESET_HOUR) {
            // If before 6am, consider it as part of the previous day
            normalized.setDate(normalized.getDate() - 1);
          }
          // Normalize to 6am of the appropriate day
          normalized.setHours(DAY_RESET_HOUR, 0, 0, 0);
          return normalized;
        };

        const normalizedNow = normalizeToAppDay(now);
        const normalizedLastRoutine = normalizeToAppDay(lastRoutineDate);

        const daysSinceLastRoutine = differenceInCalendarDays(
          normalizedNow,
          normalizedLastRoutine,
        );

        // Always reset validation if we're in a new app day
        if (daysSinceLastRoutine >= 1) {
          setIsDayValidated(false);
          await setItem('isDayValidated', 'false');

          // Reset counter ONLY if more than one day has passed (streak broken)
          if (daysSinceLastRoutine >= 2) {
            setConsecutiveDays(0);
            await setItem('consecutiveDays', '0');
            await setItem('lastRoutineDate', null);
          }
        }
      } else {
        // No previous routine, ensure validation is false
        setIsDayValidated(false);
        await setItem('isDayValidated', 'false');
      }
    } catch (error) {
      console.error('Error updating consecutive days:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const incrementConsecutiveDays = useCallback(async () => {
    if (isDayValidated) return;
    const today = new Date();
    setConsecutiveDays((prevDays) => {
      const newDays = prevDays + 1;
      // Use async operations but don't await to avoid blocking UI
      setItem('consecutiveDays', newDays.toString()).catch(console.error);
      setItem('lastRoutineDate', today.toISOString()).catch(console.error);
      setItem('isDayValidated', 'true').catch(console.error);
      setIsDayValidated(true);
      return newDays;
    });
  }, [isDayValidated]);

  useEffect(() => {
    updateConsecutiveDays();

    const intervalId = setInterval(() => updateConsecutiveDays(), ONE_HOUR); // call update every hour

    return () => clearInterval(intervalId);
  }, [updateConsecutiveDays]);

  return (
    <ConsecutiveDaysContext.Provider
      value={{
        consecutiveDays,
        isDayValidated,
        incrementConsecutiveDays,
        isLoading,
      }}
    >
      {children}
    </ConsecutiveDaysContext.Provider>
  );
};
