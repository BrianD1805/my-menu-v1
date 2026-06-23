import PayFastSuccessStatusClient from "./PayFastSuccessStatusClient";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}

export default async function PayFastPaymentSuccessPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const checkoutId = first(params.checkout_id).trim();
  return <PayFastSuccessStatusClient checkoutId={checkoutId} />;
}
