"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SplashScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(t);
          setTimeout(() => router.push("/landing"), 300);
          return 100;
        }
        return p + 4;
      });
    }, 50);
    return () => clearInterval(t);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#292524] text-stone-200 px-6">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded bg-[#9a3412] text-white font-black text-lg mb-6">
          SF
        </div>
        <h1 className="brand-serif text-2xl text-white mb-1">Universal Systems Inc.</h1>
        <p className="text-sm text-stone-400 mb-8">Syncra ERP — loading workspace…</p>
        <div className="h-2 w-full bg-stone-700 rounded overflow-hidden">
          <div
            className="h-full bg-[#9a3412] transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-stone-500 mt-2">{progress}%</p>
      </div>
    </div>
  );
}
