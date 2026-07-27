'use client';

import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

type EventContextType = {
  publishEvent: (eventName: string, data?: unknown) => void;
  subscribeToEvent: (eventName: string, callback: (data?: unknown) => void) => () => void;
};

const EventContext = createContext<EventContextType | undefined>(undefined);

type EventCallback = (data?: unknown) => void;

export function EventContextProvider({ children }: { children: ReactNode }) {
  const [listeners, setListeners] = useState<Record<string, EventCallback[]>>({});

  const publishEvent = useCallback(
    (eventName: string, data?: unknown) => {
      if (listeners[eventName]) {
        listeners[eventName].forEach((callback) => callback(data));
      }
    },
    [listeners]
  );

  const subscribeToEvent = useCallback(
    (eventName: string, callback: (data?: unknown) => void) => {
      setListeners((prev) => ({
        ...prev,
        [eventName]: [...(prev[eventName] || []), callback],
      }));

      return () => {
        setListeners((prev) => ({
          ...prev,
          [eventName]: prev[eventName]?.filter((cb) => cb !== callback) || [],
        }));
      };
    },
    [setListeners]
  );

  return (
    <EventContext.Provider value={{ publishEvent, subscribeToEvent }}>
      {children}
    </EventContext.Provider>
  );
}

export const useEventBus = () => {
  const context = useContext(EventContext);
  if (!context) throw new Error('useEventBus must be used within EventProvider');
  return context;
};

export const EVENT_XXX = 'xxx';
