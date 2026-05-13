import YocoSuccessStatusClient from "./YocoSuccessStatusClient";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function YocoSuccessPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const checkoutId = first(params.checkout_id).trim();
  const yocoCheckoutId = first(params.yoco_checkout_id).trim();
  return <YocoSuccessStatusClient checkoutId={checkoutId} yocoCheckoutId={yocoCheckoutId} />;
}
