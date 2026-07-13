import { Suspense } from "react";
import CustomDomainBillingSuccessClient from "./CustomDomainBillingSuccessClient";

export default function CustomDomainBillingSuccessPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#F3F7FA] px-4 py-10 text-[#0E0E10]">Checking custom domain payment…</main>}>
      <CustomDomainBillingSuccessClient />
    </Suspense>
  );
}
