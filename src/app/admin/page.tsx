"use client";

import { useState } from "react";
import { MenuPanel } from "./MenuPanel";
import { ReportsPanel } from "./ReportsPanel";
import { StaffPanel } from "./StaffPanel";

const TABS = [
  { id: "menu", label: "Menu" },
  { id: "reports", label: "Sales reports" },
  { id: "staff", label: "Staff" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminPage() {
  const [tab, setTab] = useState<TabId>("menu");

  return (
    <main className="mx-auto max-w-5xl px-5 py-6">
      <div className="flex items-center gap-2 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              "px-1 pb-3 text-sm font-semibold transition-standard border-b-2 -mb-px",
              tab === t.id
                ? "border-terracotta text-charcoal"
                : "border-transparent text-charcoal-soft hover:text-charcoal",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "menu" && <MenuPanel />}
        {tab === "reports" && <ReportsPanel />}
        {tab === "staff" && <StaffPanel />}
      </div>
    </main>
  );
}
