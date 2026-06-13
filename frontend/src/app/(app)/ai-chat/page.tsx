"use client";

import { Suspense } from "react";
import AIChatContent from "./chat-content";

export default function AIChatPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted">Loading AI Copilot...</div>}>
      <AIChatContent />
    </Suspense>
  );
}
