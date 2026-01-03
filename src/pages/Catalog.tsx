import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import Filters from "@/components/Filters";
import ProductGrid from "@/components/ProductGrid";
import CartDrawer from "@/components/CartDrawer";
import { useProducts } from "@/context/ProductContext";
import { Product } from "@/types/product";

const Catalog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  /* =======================
     Products from context
     ======================= */
  const { products, isLoading } = useProducts();

  /* =======================
     Categories (dynamic)
     ======================= */
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  /* =======================
     Category toggle
     ======================= */
  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  /* =======================
     Filtered products
     ======================= */
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product: Product) => {
      const name = product.name.toLowerCase();
      const category = product.category;
      const inStock = product.inStock;

      const matchesSearch = query === "" || name.includes(query);
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(category);
      const matchesStock = !showOnlyInStock || inStock;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, selectedCategories, showOnlyInStock]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCartClick={() => setIsCartOpen(true)} />

      <main className="container mx-auto px-4 pt-28 pb-20 bg-grid min-h-screen">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">Catálogo </span>
            <span className="text-gradient">Completo</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Explorá toda nuestra colección de personajes. Usá los filtros para
            encontrar exactamente lo que buscás.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <div className="space-y-6 mb-10">
          <div className="flex justify-center">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          <Filters
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            showOnlyInStock={showOnlyInStock}
            onStockFilterChange={setShowOnlyInStock}
            categories={categories}
          />
        </div>

        {/* Results count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <p className="text-muted-foreground text-sm">
            {isLoading ? (
              "Cargando productos..."
            ) : (
              <>
                Mostrando{" "}
                <span className="text-primary font-semibold">
                  {filteredProducts.length}
                </span>{" "}
                de{" "}
                <span className="text-primary font-semibold">
                  {products.length}
                </span>{" "}
                productos
              </>
            )}
          </p>
        </motion.div>

        {/* Product Grid */}
        <ProductGrid
          products={filteredProducts}
          onClearFilters={() => {
            setSearchQuery("");
            setSelectedCategories([]);
            setShowOnlyInStock(false);
          }}
        />
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Catalog;
