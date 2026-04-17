"use client";

import { useState } from "react";

export default function LogoutButton({ className = "" }: { className?: string }) {
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      window.location.href = "/admin/login";
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={handleLogout} disabled={busy} className={`admin-pressable ${className}`.trim()}>
      {busy ? "Logging out..." : "Logout"}
    </button>
  );
}
