import MpesaSuccessStatusClient from "./MpesaSuccessStatusClient";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}

export default async function MpesaPaymentSuccessPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const checkoutId = first(params.checkout_id).trim();
  const orderTrackingId = first(params.OrderTrackingId || params.orderTrackingId || params.pesapal_transaction_tracking_id).trim();
  const merchantReference = first(params.OrderMerchantReference || params.merchantReference || params.pesapal_merchant_reference).trim();
  return <MpesaSuccessStatusClient checkoutId={checkoutId} orderTrackingId={orderTrackingId} merchantReference={merchantReference} />;
}
