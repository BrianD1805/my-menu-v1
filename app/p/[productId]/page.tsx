import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ productId: string }>;
};

export default async function ShortProductSharePage({ params }: PageProps) {
  const { productId } = await params;
  redirect(`/product/${encodeURIComponent(productId)}`);
}
