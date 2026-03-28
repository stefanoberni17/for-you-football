'use client';

import { createContext, useContext } from 'react';

interface CheckinContextType {
  checkinDone: boolean;
}

export const CheckinContext = createContext<CheckinContextType>({
  checkinDone: true,
});

export const useCheckin = () => useContext(CheckinContext);
