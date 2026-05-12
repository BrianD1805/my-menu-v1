"use client";

import { useEffect } from "react";

function cleanSlug(value: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function cleanCode(value: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function cleanSource(value: string | null) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .slice(0, 80);
}

export default function ReferralLandingTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const refTenant = cleanSlug(params.get("ref_tenant") || params.get("refTenant"));
    const affiliateCode = cleanCode(params.get("aff") || params.get("affiliate") || params.get("affiliate_code"));
    const refCode = cleanCode(params.get("ref") || params.get("referralCode") || params.get("referral_code") || affiliateCode);
    const refSource = cleanSource(params.get("ref_source") || params.get("refSource"));

    if (!refTenant && !refCode && !affiliateCode) return;

    if (refTenant) window.sessionStorage.setItem("orduva_ref_tenant", refTenant);
    if (affiliateCode) window.sessionStorage.setItem("orduva_affiliate_code", affiliateCode);
    if (refCode) window.sessionStorage.setItem("orduva_ref_code", refCode);
    if (refSource) window.sessionStorage.setItem("orduva_ref_source", refSource);
    window.sessionStorage.setItem("orduva_ref_landing_url", window.location.href);
  }, []);

  return null;
}
