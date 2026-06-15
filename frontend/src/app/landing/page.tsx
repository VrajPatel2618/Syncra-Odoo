"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Check } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Top bar — feels like a real project site */}
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded bg-[var(--primary)] text-white text-xs font-black flex items-center justify-center">SF</span>
            <div>
              <p className="text-sm font-bold leading-none">Syncra ERP</p>
              <p className="text-[10px] text-[var(--muted)]">Universal Systems Inc.</p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link href="/login">Login to Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero — honest hackathon pitch */}
        <section className="mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary)] mb-3">
            Hackathon Project · Smart Manufacturing Track · 2026
          </p>
          <h1 className="brand-serif text-4xl md:text-5xl text-[var(--foreground)] leading-tight mb-4">
            We replaced spreadsheets with one system for stock, factory & sales.
          </h1>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login">Open ERP Dashboard <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/onboarding">See how it works</Link>
            </Button>
          </div>
        </section>

        {/* Problem we solved — jury-friendly */}
        <section className="mb-14">
          <h2 className="text-sm font-bold uppercase tracking-wide mb-4">What we fixed</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              "Excel stock sheets with 15% error rate",
              "Sales & warehouse not talking to each other",
              "No idea which MO is stuck on paint floor",
              "Procurement always reactive, never predictive",
              "Zero audit trail when qty disputes happen",
              "Managers checking 6 different WhatsApp groups",
            ].map((item) => (
              <div key={item} className="flex gap-2 text-sm p-3 panel">
                <span className="text-[var(--primary)] font-bold">→</span>
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* Features — plain language */}
        <section className="mb-14">
          <h2 className="text-sm font-bold uppercase tracking-wide mb-4">What&apos;s inside</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { t: "Inventory that actually moves", d: "Sales reserves stock. POs add stock. MOs consume & produce. One formula: Free = On Hand − Reserved." },
              { t: "Factory floor tracking", d: "BoM, work orders, work centers — Assembly, Paint, Packaging. See what's running right now." },
              { t: "AI + Blockchain (where it matters)", d: "AI copilot for shortages & delays. Blockchain hashes only on stock moves & audits — not the whole ERP." },
            ].map((f) => (
              <Card key={f.t}>
                <CardContent className="p-0">
                  <h3 className="font-bold text-sm mb-2">{f.t}</h3>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">{f.d}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Stats — believable numbers */}
        <section className="mb-14 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { n: "99%", l: "stock accuracy target" },
            { n: "40%", l: "faster procurement" },
            { n: "1", l: "dashboard for everything" },
            { n: "0", l: "spreadsheets needed" },
          ].map((s) => (
            <div key={s.l} className="stat-card">
              <p className="text-2xl font-bold text-[var(--primary)]">{s.n}</p>
              <p className="text-xs text-[var(--muted)]">{s.l}</p>
            </div>
          ))}
        </section>

        {/* Team credit — human touch */}
        <section className="panel p-6 bg-[var(--surface)]">
          <h2 className="text-sm font-bold uppercase tracking-wide mb-3">Built by</h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            Team Universal Systems Inc. · Full-stack ERP for furniture manufacturing with PostgreSQL, Express, Next.js, Polygon audit layer & OpenAI copilot.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {["Next.js", "PostgreSQL", "Express", "Prisma", "Polygon", "OpenAI"].map((t) => (
              <span key={t} className="badge-pill bg-[var(--surface-2)] text-[var(--foreground)]">{t}</span>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] mt-8 py-6 text-center text-xs text-[var(--muted)]">
        <p>Syncra ERP · Universal Systems Inc. · Rajkot, Gujarat</p>
        <p className="mt-1 flex items-center justify-center gap-1"><Check className="h-3 w-3 text-[var(--accent)]" /> Hackathon demo — not production deployed yet</p>
      </footer>
    </div>
  );
}
