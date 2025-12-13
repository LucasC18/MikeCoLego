import { motion, AnimatePresence } from "framer-motion";
import { Product } from "@/types/product";
import ProductCard from "./ProductCard";
import { PackageSearch } from "lucide-react";

interface ProductGridProps {
  products: Product[];
}

const ProductGrid = ({ products }: ProductGridProps) => {
  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <PackageSearch className="w-20 h-20 text-muted-foreground mb-6" />
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          No se encontraron productos
        </h3>
        <p className="text-muted-foreground max-w-md">
          Intenta ajustar los filtros o la búsqueda para encontrar lo que buscas.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      <AnimatePresence mode="popLayout">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductGrid;
