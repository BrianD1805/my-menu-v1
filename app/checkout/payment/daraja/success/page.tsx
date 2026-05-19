import DarajaSuccessStatusClient from "./DarajaSuccessStatusClient";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}

export default async function DarajaPaymentSuccessPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const checkoutId = first(params.checkout_id).trim();
  const checkoutRequestId = first(params.CheckoutRequestID || params.checkoutRequestId || params.checkout_request_id).trim();
  const merchantRequestId = first(params.MerchantRequestID || params.merchantRequestId || params.merchant_request_id).trim();
  return <DarajaSuccessStatusClient checkoutId={checkoutId} checkoutRequestId={checkoutRequestId} merchantRequestId={merchantRequestId} />;
}
