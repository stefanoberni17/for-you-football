'use client';

import { createContext, useContext } from 'react';

interface MeditationContextType {
  openMeditation: () => void;
  mantra: string;
  weekName: string;
}

export const MeditationContext = createContext<MeditationContextType>({
  openMeditation: () => {},
  mantra: '',
  weekName: '',
});

export const useMeditation = () => useContext(MeditationContext);
