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

interface ConsecutiveDaysContextProps {
  consecutiveDays: number;
  isDayValidated: boolean;
  incrementConsecutiveDays: () => void;
}

const ONE_HOUR = 1000 * 3600;
const ONE_DAY = ONE_HOUR * 24;

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

  const updateConsecutiveDays = useCallback(() => {
    const storedConsecutiveDays = localStorage.getItem('consecutiveDays');
    const storedIsDayValidated = localStorage.getItem('isDayValidated');
    const storedLastRoutineDate = localStorage.getItem('lastRoutineDate');
    const lastRoutineDate = storedLastRoutineDate
      ? new Date(storedLastRoutineDate)
      : null;

    if (storedConsecutiveDays !== null)
      setConsecutiveDays(parseInt(storedConsecutiveDays, 10));
    if (storedIsDayValidated !== null)
      setIsDayValidated(storedIsDayValidated === 'true');

    if (lastRoutineDate) {
      const todayDate = new Date();
      const daysSinceLastRoutine =
        (todayDate.getTime() - lastRoutineDate.getTime()) / ONE_DAY;

      if (daysSinceLastRoutine >= 1) {
        setIsDayValidated(false);
        localStorage.setItem('isDayValidated', 'false');
      }

      if (daysSinceLastRoutine >= 2) {
        setConsecutiveDays(0);
        localStorage.setItem('consecutiveDays', '0');
        localStorage.removeItem('lastRoutineDate');
      }
    }
  }, []);

  const incrementConsecutiveDays = useCallback(() => {
    if (isDayValidated) return;
    const today = new Date();
    setConsecutiveDays((prevDays) => {
      const newDays = prevDays + 1;
      localStorage.setItem('consecutiveDays', newDays.toString());
      localStorage.setItem('lastRoutineDate', today.toISOString());
      localStorage.setItem('isDayValidated', 'true');
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
      value={{ consecutiveDays, isDayValidated, incrementConsecutiveDays }}
    >
      {children}
    </ConsecutiveDaysContext.Provider>
  );
};
