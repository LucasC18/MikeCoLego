import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import Filters from "@/components/Filters";
import ProductGrid from "@/components/ProductGrid";
import CartDrawer from "@/components/CartDrawer";
import { products } from "@/data/products";
import { Category } from "@/types/product";
import { Sparkles } from "lucide-react";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleCategoryToggle = (category: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(product.category as Category);

      const matchesStock = !showOnlyInStock || product.inStock;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [searchQuery, selectedCategories, showOnlyInStock]);

  return (
    <div className="min-h-screen bg-background bg-grid">
      <Navbar onCartClick={() => setIsCartOpen(true)} />

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">
                Colección Exclusiva
              </span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
              <span className="text-gradient">Explora el universo</span>
              <br />
              <span className="text-foreground">LEGO</span>
            </h1>

            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              Descubre nuestra colección de sets de LEGO. Agrega los que te
              interesen y consulta directamente por WhatsApp.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-20">
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
          />
        </div>

        {/* Results count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <p className="text-muted-foreground text-sm">
            Mostrando{" "}
            <span className="text-primary font-semibold">
              {filteredProducts.length}
            </span>{" "}
            de{" "}
            <span className="text-primary font-semibold">{products.length}</span>{" "}
            productos
          </p>
        </motion.div>

        {/* Product Grid */}
        <ProductGrid products={filteredProducts} />
      </main>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Index;
