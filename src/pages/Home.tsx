import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import Navbar from "@/components/Navbar"
import CartDrawer from "@/components/CartDrawer"
import { Sparkles, ChevronDown, ArrowRight } from "lucide-react"
import heroImage from "@/assets/hero-starwars.jpg"
import { apiFetch } from "@/config/api"

interface Collection {
  id: string
  name: string
  slug: string
}

const Home = () => {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoadingCollections, setIsLoadingCollections] = useState(true)

  /* =======================
     Load collections
  ======================= */
  useEffect(() => {
    async function loadCollections() {
      try {
        const res = await apiFetch<Collection[]>("/v1/collections")
        setCollections(res || [])
      } catch (err) {
        console.error("Error cargando colecciones", err)
        setCollections([])
      } finally {
        setIsLoadingCollections(false)
      }
    }

    loadCollections()
  }, [])

  const scrollToCollections = () => {
    document.getElementById("destacados")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCartClick={() => setIsCartOpen(true)} />

      {/* ================= HERO ================= */}
      <section className="relative h-screen overflow-hidden">
        <motion.div
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src={heroImage}
            alt="Hero"
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
                Colecciones Exclusivas
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
              <span className="text-foreground">Jedi</span>
              <span className="text-gradient">Collector71</span>
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Explorá nuestros personajes organizados por colección. Elegí una y
              encontrá tu próximo favorito.
            </p>

            {/* ===== HERO COLLECTION BUTTONS ===== */}
            {!isLoadingCollections && collections.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap justify-center gap-4 mb-10"
              >
                {collections.slice(0, 2).map((c) => (
                  <Link
                    key={c.id}
                    to={`/catalogo?collection=${c.slug}`}
                    className="px-10 py-5 rounded-xl font-display font-bold text-lg
                               glass-card neon-border hover-glow transition-all
                               text-primary"
                  >
                    {c.name}
                  </Link>
                ))}
              </motion.div>
            )}

            <motion.button
              onClick={scrollToCollections}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-primary text-primary-foreground font-display font-bold text-lg rounded-lg neon-glow hover:bg-primary/90 transition-colors"
            >
              Ver Colecciones
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
              onClick={scrollToCollections}
            >
              <span className="text-muted-foreground text-sm">Scroll</span>
              <ChevronDown className="w-6 h-6 text-primary" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================= CTA BOTTOM ================= */}
      <main id="destacados" className="container mx-auto px-4 py-20 bg-grid text-center">
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-2 px-10 py-5 glass-card neon-border rounded-lg font-display font-semibold text-primary hover-glow transition-all"
        >
          Ver Catálogo Completo
          <ArrowRight className="w-5 h-5" />
        </Link>
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}

export default Home
