"use client";

import { useRef } from "react";
import { useCurrency } from "@/context/currency-context";

interface RateSynchronizerProps {
  rates: Record<string, number> | null;
}

export function RateSynchronizer({ rates }: RateSynchronizerProps) {
  const { setRates } = useCurrency();
  const prevRatesRef = useRef(rates);

  if (rates && Object.keys(rates).length > 0) {
    const isDifferent = JSON.stringify(rates) !== JSON.stringify(prevRatesRef.current);
    if (isDifferent) {
      prevRatesRef.current = rates;
      setRates(prev => ({ ...prev, TRY: 1, ...rates }));
    }
  }

  return null;
}
