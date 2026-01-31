'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  FC,
  PropsWithChildren,
} from 'react';

type RefreshHandler = (() => Promise<void> | void) | null;

interface PullToRefreshContextType {
  setRefreshHandler: (handler: RefreshHandler) => void;
  refreshHandler: RefreshHandler;
}

const PullToRefreshContext = createContext<
  PullToRefreshContextType | undefined
>(undefined);

export function usePullToRefreshContext(): PullToRefreshContextType {
  const context = useContext(PullToRefreshContext);
  if (context === undefined) {
    throw new Error(
      'usePullToRefreshContext must be used within a PullToRefreshProvider',
    );
  }
  return context;
}

export const PullToRefreshProvider: FC<PropsWithChildren> = ({ children }) => {
  const [refreshHandler, setRefreshHandlerState] =
    useState<RefreshHandler>(null);

  const setRefreshHandler = useCallback((handler: RefreshHandler) => {
    setRefreshHandlerState(() => handler);
  }, []);

  return (
    <PullToRefreshContext.Provider
      value={{
        refreshHandler,
        setRefreshHandler,
      }}
    >
      {children}
    </PullToRefreshContext.Provider>
  );
};
