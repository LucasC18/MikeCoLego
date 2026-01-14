import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Product } from "@/types/product";
import { apiFetch } from "@/config/api";

/* =======================
   Backend DTO
   ======================= */
interface ProductApiDTO {
  id: string;
  name: string;
  image?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  categoryName?: string | null;
  description?: string | null;
  inStock: boolean;
  collection?: string; // ⬅️ NUEVO
}

/* =======================
   Context types
   ======================= */
interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

/* =======================
   Mapper backend -> frontend
   ======================= */
function mapProductFromApi(p: ProductApiDTO): Product {
  return {
    id: p.id,
    name: p.name,
    image: p.image ?? p.imageUrl ?? "",
    category: p.category ?? p.categoryName ?? "Sin categoría",
    description: p.description ?? "",
    inStock: p.inStock,
    collection: p.collection ?? "Figuras", // ⬅️ NUEVO - default
  };
}

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const allProducts: Product[] = [];
      let page = 1;
      const limit = 100;

      while (true) {
        const res = await apiFetch<{
          items: ProductApiDTO[];
          total: number;
        }>(`/api/v1/products?page=${page}&limit=${limit}`);

        const items = Array.isArray(res.items)
          ? res.items.map(mapProductFromApi)
          : [];

        allProducts.push(...items);

        if (items.length < limit) {
          break; // no hay más páginas
        }

        page++;
      }

      setProducts(allProducts);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Error cargando productos");
      }
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  return (
    <ProductContext.Provider
      value={{
        products,
        isLoading,
        error,
        reload,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const ctx = useContext(ProductContext);
  if (!ctx) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return ctx;
};