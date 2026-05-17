"use client";

import { useEffect } from "react";

export function ClearTerms() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("test_terms_accepted");
      localStorage.removeItem("test_terms_accepted");
    }
  }, []);

  return null;
}
