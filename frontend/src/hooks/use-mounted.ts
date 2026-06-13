"use client";

import { useEffect, useState } from "react";

/** Returns false during SSR/first paint, true after client mount — prevents hydration mismatches */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
