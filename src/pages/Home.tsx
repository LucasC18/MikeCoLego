import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import ProductGrid from "@/components/ProductGrid";
import CartDrawer from "@/components/CartDrawer";
import { useProducts } from "@/context/ProductContext";
import { Sparkles, ChevronDown, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-starwars.jpg";
import { Product } from "@/types/product";

const Home = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  /* =======================
     Products
     ======================= */
  const { products, isLoading } = useProducts();

  /* =======================
     Featured products
     ======================= */
  const featuredProducts = useMemo<Product[]>(() => {
    return products
      .filter((p) => p.inStock)
      .slice(0, 4);
  }, [products]);

  const scrollToProducts = () => {
    document
      .getElementById("destacados")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCartClick={() => setIsCartOpen(true)} />

      {/* Hero */}
      <section className="relative h-screen overflow-hidden">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src={heroImage}
            alt="Mike&Co LEGO Collection"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
        </motion.div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-secondary animate-pulse-glow" />
              <span className="text-sm font-medium text-secondary">
                Colección Exclusiva
              </span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
              <span className="text-foreground">Jedi</span>
              <span className="text-gradient">Collector71</span>
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10">
              Explorá nuestra colección de PERSONAJES. Agregá los que te
              interesen y consultá directamente por WhatsApp.
            </p>

            <motion.button
              onClick={scrollToProducts}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-primary text-primary-foreground font-display font-bold text-lg rounded-lg neon-glow hover:bg-primary/90 transition-colors"
            >
              Ver Destacados
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center gap-2 cursor-pointer"
              onClick={scrollToProducts}
            >
              <span className="text-muted-foreground text-sm">Scroll</span>
              <ChevronDown className="w-6 h-6 text-primary" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured */}
      <main id="destacados" className="container mx-auto px-4 py-20 bg-grid">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-4xl font-bold mb-4"
          >
            <span className="text-foreground">Personajes </span>
            <span className="text-gradient">Destacados</span>
          </motion.h2>
          <p className="text-muted-foreground">
            Los PERSONAJES más populares de nuestra colección
          </p>
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground">
            Cargando productos...
          </p>
        ) : (
          <ProductGrid products={featuredProducts} />
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex justify-center mt-12"
        >
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 px-8 py-4 glass-card neon-border rounded-lg font-display font-semibold text-primary hover-glow transition-all group"
          >
            Ver Catálogo Completo
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default Home;
