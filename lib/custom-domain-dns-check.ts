import { promises as dns } from "node:dns";
import {
  CUSTOM_DOMAIN_DNS_TARGET,
  CUSTOM_DOMAIN_NETLIFY_APEX_FALLBACK_A,
  CUSTOM_DOMAIN_NETLIFY_APEX_TARGET,
  customDomainEffectiveDnsTarget,
  normaliseCustomDomain,
  type CustomDomainDnsStatus,
} from "@/lib/custom-domain-addon";

export type CustomDomainDnsRecordCheck = {
  host: string;
  expected: string;
  found: string[];
  status: CustomDomainDnsStatus;
  message: string;
};

export type CustomDomainDnsCheckResult = {
  checkedAt: string;
  domain: string;
  apex: CustomDomainDnsRecordCheck;
  www: CustomDomainDnsRecordCheck;
  txt?: CustomDomainDnsRecordCheck;
};

function cleanTarget(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^\/\//, "")
    .split("/")[0]
    .split("?")[0]
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean).map(cleanTarget))).sort();
}

async function resolve4Safe(host: string) {
  try {
    return await dns.resolve4(host);
  } catch {
    return [];
  }
}

async function resolveCnameSafe(host: string) {
  try {
    return await dns.resolveCname(host);
  } catch {
    return [];
  }
}

async function resolveTxtSafe(host: string) {
  try {
    const rows = await dns.resolveTxt(host);
    return rows.map((parts) => parts.join(""));
  } catch {
    return [];
  }
}

function statusFromRecords(found: string[], expectedValues: string[]) {
  const expected = unique(expectedValues);
  const records = unique(found);
  const verified = records.some((record) => expected.includes(record));
  if (verified) return "verified" as const;
  if (records.length > 0) return "failed" as const;
  return "pending" as const;
}

export async function checkCustomDomainDnsRecords(input: {
  domainName: string;
  dnsTarget?: string | null;
  verificationToken?: string | null;
}): Promise<CustomDomainDnsCheckResult> {
  const domain = normaliseCustomDomain(input.domainName);
  const effectiveDnsTarget = customDomainEffectiveDnsTarget(
    input.dnsTarget || CUSTOM_DOMAIN_DNS_TARGET,
  );
  const wwwHost = `www.${domain}`;
  const txtHost = `_orduva.${domain}`;

  const [apexA, apexCname, wwwA, wwwCname, txtRecords] = await Promise.all([
    resolve4Safe(domain),
    resolveCnameSafe(domain),
    resolve4Safe(wwwHost),
    resolveCnameSafe(wwwHost),
    input.verificationToken ? resolveTxtSafe(txtHost) : Promise.resolve([]),
  ]);

  const apexFound = unique([...apexA, ...apexCname]);
  const apexStatus = statusFromRecords(apexFound, [
    CUSTOM_DOMAIN_NETLIFY_APEX_TARGET,
    CUSTOM_DOMAIN_NETLIFY_APEX_FALLBACK_A,
  ]);

  const wwwFound = unique([...wwwCname, ...wwwA]);
  const wwwStatus = statusFromRecords(wwwFound, [
    effectiveDnsTarget,
    CUSTOM_DOMAIN_NETLIFY_APEX_FALLBACK_A,
  ]);

  const txtFound = unique(txtRecords);
  const txtExpected = String(input.verificationToken || "").trim();
  const txtStatus: CustomDomainDnsStatus = txtExpected
    ? txtFound.includes(cleanTarget(txtExpected)) || txtRecords.includes(txtExpected)
      ? "verified"
      : txtFound.length
        ? "failed"
        : "pending"
    : "not_required";

  return {
    checkedAt: new Date().toISOString(),
    domain,
    apex: {
      host: domain,
      expected: `${CUSTOM_DOMAIN_NETLIFY_APEX_TARGET} or ${CUSTOM_DOMAIN_NETLIFY_APEX_FALLBACK_A}`,
      found: apexFound,
      status: apexStatus,
      message:
        apexStatus === "verified"
          ? "Root/apex DNS resolves to Netlify."
          : apexStatus === "failed"
            ? "Root/apex DNS resolves, but not to the expected Netlify target."
            : "Root/apex DNS has not propagated yet or no public record was found.",
    },
    www: {
      host: wwwHost,
      expected: effectiveDnsTarget,
      found: wwwFound,
      status: wwwStatus,
      message:
        wwwStatus === "verified"
          ? "WWW DNS resolves to the expected Netlify/Orduva target."
          : wwwStatus === "failed"
            ? "WWW DNS resolves, but not to the expected CNAME target."
            : "WWW DNS has not propagated yet or no public record was found.",
    },
    txt: txtExpected
      ? {
          host: txtHost,
          expected: txtExpected,
          found: txtRecords,
          status: txtStatus,
          message:
            txtStatus === "verified"
              ? "Optional Orduva TXT verification record was found."
              : txtStatus === "failed"
                ? "TXT records were found, but the Orduva verification token was not present."
                : "Optional Orduva TXT verification record has not propagated yet or was not found.",
        }
      : undefined,
  };
}

export function preserveNotRequiredDnsStatus(
  current: string | null | undefined,
  checked: CustomDomainDnsStatus,
): CustomDomainDnsStatus {
  if (current === "not_required" && checked !== "verified") return "not_required";
  return checked;
}
