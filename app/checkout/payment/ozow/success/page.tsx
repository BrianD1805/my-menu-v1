import OzowSuccessStatusClient from "./OzowSuccessStatusClient";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}

export default async function OzowPaymentSuccessPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const checkoutId = first(params.checkout_id).trim();
  return <OzowSuccessStatusClient checkoutId={checkoutId} />;
}
