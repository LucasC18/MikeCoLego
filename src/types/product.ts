export interface Product {
  id: string;
  name: string;
  category: string | null;
  categorySlug?: string | null;
  description: string;
  inStock: boolean;
  image: string;

  // NUEVO
  collection: string;

  // Solo admin
  stockQty?: number | null;
}

export interface CartItem extends Product {
  quantity: number;
}
