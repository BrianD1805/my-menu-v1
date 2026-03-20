"use client";

type Props = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
};

type StoredCartItem = {
  productId: string;
  quantity: number;
};

export default function ProductCard({ id, name, description, price }: Props) {
  function addToCart() {
    const existing = JSON.parse(localStorage.getItem("cart") || "[]") as StoredCartItem[];
    const found = existing.find((x) => x.productId === id);

    const updated = found
      ? existing.map((x) =>
          x.productId === id ? { ...x, quantity: x.quantity + 1 } : x
        )
      : [...existing, { productId: id, quantity: 1 }];

    localStorage.setItem("cart", JSON.stringify(updated));
    window.alert("Added to cart");
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold">{name}</h3>
      {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
      <p className="mt-3 font-medium">£{price.toFixed(2)}</p>

      <button
        className="mt-4 rounded-xl bg-black px-4 py-2 text-white"
        onClick={addToCart}
      >
        Add to cart
      </button>
    </div>
  );
}
