import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { apiFetch } from "@/config/api";
import {
  ChevronDown,
  Sparkles,
  Package,
  Users,
  Calendar,
  MessageCircle,
  Truck,
  Shield,
  Heart,
  Zap,
  Star,
  Loader2,
} from "lucide-react";

/* ================================
   TYPES & INTERFACES
================================= */
interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

interface ProductLite {
  id: string;
  category?: CategoryRef | null;
}

interface ProductsApiResponse {
  items: ProductLite[];
  total: number;
  page?: number;
  limit?: number;
}

interface ApiError extends Error {
  status?: number;
  code?: string;
}

interface FeatureItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  emoji: string;
}

interface StatCardProps {
  value: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  emoji: string;
  reduceMotion: boolean;
  suffix?: string;
}

/* ================================
   CONSTANTS
================================= */
const PRODUCTS_LIMIT = 1000;
const COUNTER_DURATION = 2;
const NAVBAR_HEIGHT = 64;

const FEATURES: FeatureItem[] = [
  {
    icon: Shield,
    title: "Productos Auténticos",
    desc: "Garantía de autenticidad en cada producto",
    emoji: "🛡️",
  },
  {
    icon: Truck,
    title: "Envío Seguro",
    desc: "Empaque premium para máxima protección",
    emoji: "🚚",
  },
  {
    icon: Heart,
    title: "Pasión por Coleccionar",
    desc: "Entendemos tu amor por las colecciones",
    emoji: "❤️",
  },
  {
    icon: Star,
    title: "Calidad Premium",
    desc: "Solo los mejores productos seleccionados",
    emoji: "⭐",
  },
  {
    icon: Zap,
    title: "Actualización Constante",
    desc: "Nuevos productos cada semana",
    emoji: "⚡",
  },
  {
    icon: MessageCircle,
    title: "Atención Personalizada",
    desc: "Siempre listos para ayudarte",
    emoji: "💬",
  },
];

/* ================================
   HELPERS & UTILITIES
================================= */
const isApiError = (error: unknown): error is ApiError => {
  return error instanceof Error;
};

const getSafeAreaStyle = (): React.CSSProperties => {
  return {
    paddingTop: "env(safe-area-inset-top)",
    paddingBottom: "env(safe-area-inset-bottom)",
    paddingLeft: "env(safe-area-inset-left)",
    paddingRight: "env(safe-area-inset-right)",
  };
};

/* ================================
   CUSTOM HOOKS
================================= */
const useCounter = (end: number, duration = COUNTER_DURATION, reduceMotion = false) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { margin: "-60px", once: true });

  useEffect(() => {
    if (!isInView) return;

    if (reduceMotion) {
      setCount(end);
      return;
    }

    let start: number | null = null;
    let raf: number;

    const animate = (t: number) => {
      if (!start) start = t;
      const progress = Math.min((t - start) / (duration * 1000), 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, isInView, reduceMotion]);

  return { count, ref };
};

const useProducts = () => {
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchProducts = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch<ProductsApiResponse>(
        `/v1/products?limit=${PRODUCTS_LIMIT}`,
        {
          signal: abortControllerRef.current.signal,
        }
      );

      setProducts(response.items || []);
      setTotalProducts(response.total || 0);
    } catch (err: unknown) {
      if (isApiError(err) && err.name === "AbortError") {
        return;
      }
      setError("Error al cargar productos");
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchProducts]);

  return { products, totalProducts, isLoading, error };
};

const useViewportHeight = () => {
  useEffect(() => {
    const updateVh = () => {
      const vh = window.innerHeight;
      document.documentElement.style.setProperty("--vh", `${vh * 0.01}px`);
    };

    updateVh();
    window.addEventListener("resize", updateVh);
    window.addEventListener("orientationchange", updateVh);

    return () => {
      window.removeEventListener("resize", updateVh);
      window.removeEventListener("orientationchange", updateVh);
    };
  }, []);
};

/* ================================
   SUB-COMPONENTS
================================= */
const StatCard = React.memo<StatCardProps>(
  ({ value, label, icon: Icon, emoji, reduceMotion, suffix = "+" }) => {
    const { count, ref } = useCounter(value, COUNTER_DURATION, reduceMotion);

    return (
      <motion.div
        ref={ref}
        initial={reduceMotion ? undefined : { opacity: 0, y: 30 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={reduceMotion ? undefined : { duration: 0.6 }}
        className="glass-card rounded-2xl p-10 text-center hover:scale-105 transition-transform duration-300 shadow-xl border border-slate-700/50"
      >
        <div className="flex justify-center gap-3 mb-6">
          <span className="text-4xl" role="img" aria-label={label}>
            {emoji}
          </span>
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <div className="text-6xl font-bold text-gradient mb-3">
          {count}
          {suffix}
        </div>
        <p className="text-slate-300 text-lg font-medium">{label}</p>
      </motion.div>
    );
  }
);

StatCard.displayName = "StatCard";

const HeroSection = ({ reduceMotion }: { reduceMotion: boolean }) => {
  const heroRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({ target: heroRef });
  const y = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <motion.section
      ref={heroRef}
      style={!reduceMotion ? { y, opacity } : undefined}
      className="text-center mb-40"
    >
      <motion.div
        initial={reduceMotion ? undefined : { opacity: 0, y: 30 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={reduceMotion ? undefined : { duration: 0.8 }}
      >
        <div className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full mb-8 shadow-lg border border-slate-700/50">
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse-glow" />
          <span className="text-base font-semibold text-amber-300">
            Sobre Nosotros
          </span>
        </div>

        <h1 className="font-display text-6xl sm:text-7xl md:text-8xl font-bold mb-6 leading-tight">
          <span className="text-gradient">JediCollector71</span>
        </h1>

        <p className="text-slate-300 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
          Coleccionismo premium, organizado y real. Tu destino para las mejores
          figuras y productos exclusivos.
        </p>
      </motion.div>
    </motion.section>
  );
};

const StatsSection = ({
  totalProducts,
  isLoading,
  reduceMotion,
}: {
  totalProducts: number;
  isLoading: boolean;
  reduceMotion: boolean;
}) => {
  if (isLoading) {
    return (
      <section className="flex justify-center items-center mb-32 py-20">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
      <StatCard
        value={totalProducts}
        label="Productos"
        icon={Package}
        emoji="📦"
        reduceMotion={reduceMotion}
        suffix=""
      />
      <StatCard
        value={500}
        label="Clientes"
        icon={Users}
        emoji="👥"
        reduceMotion={reduceMotion}
        suffix="+"
      />
      <StatCard
        value={10}
        label="Años de experiencia"
        icon={Calendar}
        emoji="📅"
        reduceMotion={reduceMotion}
        suffix="+"
      />
    </section>
  );
};

const FeatureCard = ({
  feature,
  index,
  reduceMotion,
}: {
  feature: FeatureItem;
  index: number;
  reduceMotion: boolean;
}) => (
  <motion.div
    initial={reduceMotion ? undefined : { opacity: 0, y: 30 }}
    whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={
      reduceMotion
        ? undefined
        : { duration: 0.6, delay: index * 0.1 }
    }
    className="glass-card rounded-xl p-8 text-center hover:scale-105 transition-transform duration-300 shadow-lg border border-slate-700/50"
  >
    <div className="flex justify-center mb-4">
      <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
        <feature.icon className="w-8 h-8 text-primary" />
      </div>
    </div>
    <h3 className="text-xl font-bold text-slate-100 mb-3">{feature.title}</h3>
    <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
  </motion.div>
);

const FeaturesSection = ({ reduceMotion }: { reduceMotion: boolean }) => (
  <motion.section
    initial={reduceMotion ? undefined : { opacity: 0, y: 40 }}
    whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={reduceMotion ? undefined : { duration: 0.8 }}
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32"
  >
    {FEATURES.map((feature, idx) => (
      <FeatureCard
        key={feature.title}
        feature={feature}
        index={idx}
        reduceMotion={reduceMotion}
      />
    ))}
  </motion.section>
);

const CTASection = ({
  onNavigate,
  reduceMotion,
}: {
  onNavigate: () => void;
  reduceMotion: boolean;
}) => (
  <div className="text-center">
    <motion.button
      onClick={onNavigate}
      whileHover={reduceMotion ? undefined : { scale: 1.05 }}
      whileTap={reduceMotion ? undefined : { scale: 0.95 }}
      className="px-14 py-6 min-h-[56px] bg-primary text-primary-foreground font-bold text-xl rounded-xl neon-glow transition-all duration-300 shadow-2xl hover:shadow-primary/50 touch-manipulation"
      aria-label="Ver catálogo completo"
    >
      🚀 Ver catálogo completo
    </motion.button>
  </div>
);

/* ================================
   MAIN COMPONENT
================================= */
const About = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const { totalProducts, isLoading } = useProducts();

  useViewportHeight();

  const handleNavigateToCatalog = useCallback(() => {
    navigate("/catalogo");
  }, [navigate]);

  const handleCartClick = useCallback(() => {
    navigate("/catalogo");
  }, [navigate]);

  return (
    <div
      className="min-h-[100dvh] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
      style={getSafeAreaStyle()}
    >
      <Navbar onCartClick={handleCartClick} />

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">
        <HeroSection reduceMotion={!!reduceMotion} />

        <StatsSection
          totalProducts={totalProducts}
          isLoading={isLoading}
          reduceMotion={!!reduceMotion}
        />

        <FeaturesSection reduceMotion={!!reduceMotion} />

        <CTASection
          onNavigate={handleNavigateToCatalog}
          reduceMotion={!!reduceMotion}
        />
      </main>
    </div>
  );
};

export default About;