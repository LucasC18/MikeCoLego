import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { apiFetch } from "@/config/api";
import {
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

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

/* ================================
   CONSTANTS
================================= */
const PRODUCTS_LIMIT = 1000;
const COUNTER_DURATION = 2;

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
    desc: "Empaque cuidadoso para máxima protección",
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
    title: "Selección Curada",
    desc: "Los mejores productos para coleccionistas",
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
   DEVICE DETECTION
================================= */
const useDeviceDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      const nav = navigator as NavigatorWithMemory;
      const cores = navigator.hardwareConcurrency || 4;
      const memory = nav.deviceMemory || 4;
      setIsLowEnd(cores <= 2 || memory <= 2);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return { isMobile, isLowEnd };
};

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
   OPTIMIZED BACKGROUND
================================= */
const OptimizedBackground = ({ 
  isMobile, 
  isLowEnd, 
  prefersReducedMotion 
}: { 
  isMobile: boolean; 
  isLowEnd: boolean;
  prefersReducedMotion: boolean;
}) => {
  if (prefersReducedMotion || isLowEnd) {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/8 rounded-full blur-3xl" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className={`absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/8 rounded-full ${isMobile ? 'blur-2xl' : 'blur-3xl'}`}
        style={{ willChange: "transform" }}
        animate={{ 
          scale: [1, 1.1, 1],
          x: [0, isMobile ? 15 : 40, 0],
          y: [0, isMobile ? 10 : 25, 0]
        }}
        transition={{ 
          duration: isMobile ? 12 : 10,
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
      
      {!isMobile && (
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/8 rounded-full blur-3xl"
          style={{ willChange: "transform" }}
          animate={{ 
            scale: [1, 1.15, 1],
            x: [0, -35, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
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
        initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={reduceMotion ? undefined : { duration: 0.4 }}
        className="relative"
      >
        <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 text-center transition-all duration-200 hover:bg-slate-800/40 hover:border-slate-600/60">
          <div className="flex justify-center gap-2.5 mb-4">
            <span className="text-3xl" role="img" aria-label={label}>
              {emoji}
            </span>
            <Icon className="w-7 h-7 text-violet-400" />
          </div>
          <div className="text-5xl font-bold text-white mb-2">
            {count}
            {suffix}
          </div>
          <p className="text-slate-400 text-base font-medium">{label}</p>
        </div>
      </motion.div>
    );
  }
);

StatCard.displayName = "StatCard";

const HeroSection = ({ reduceMotion }: { reduceMotion: boolean }) => {
  const heroRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({ target: heroRef });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <motion.section
      ref={heroRef}
      style={!reduceMotion ? { y, opacity } : undefined}
      className="text-center mb-32"
    >
      <motion.div
        initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={reduceMotion ? undefined : { duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500/15 to-orange-500/15 backdrop-blur-sm border border-amber-500/30 rounded-full mb-7">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-200">
            Sobre Nosotros
          </span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight">
          <span className="text-white">
            JediCollector71
          </span>
        </h1>

        <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
          Tu destino para figuras y productos exclusivos de colección
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
      <section className="flex flex-col items-center justify-center mb-28 py-16">
        <motion.div
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={reduceMotion ? undefined : { duration: 1, repeat: Infinity, ease: "linear" }}
          className="mb-4"
        >
          <Loader2 className="w-12 h-12 text-violet-400" />
        </motion.div>
        <p className="text-slate-300 text-lg font-medium">Cargando estadísticas...</p>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-28">
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
    initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
    whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={
      reduceMotion
        ? undefined
        : { duration: 0.4, delay: index * 0.08 }
    }
    className="relative"
  >
    <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 text-center transition-all duration-200 hover:bg-slate-800/40 hover:border-slate-600/60">
      <div className="flex justify-center mb-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 border border-violet-500/25">
          <feature.icon className="w-6 h-6 text-violet-400" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
    </div>
  </motion.div>
);

const FeaturesSection = ({ reduceMotion }: { reduceMotion: boolean }) => (
  <motion.section
    initial={reduceMotion ? undefined : { opacity: 0, y: 25 }}
    whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={reduceMotion ? undefined : { duration: 0.5 }}
    className="mb-28"
  >
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
        ¿Por qué elegirnos?
      </h2>
      <p className="text-slate-400 text-base max-w-2xl mx-auto">
        Nos comprometemos a brindarte la mejor experiencia en coleccionismo
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {FEATURES.map((feature, idx) => (
        <FeatureCard
          key={feature.title}
          feature={feature}
          index={idx}
          reduceMotion={reduceMotion}
        />
      ))}
    </div>
  </motion.section>
);

const CTASection = ({
  onNavigate,
}: {
  onNavigate: () => void;
  reduceMotion: boolean;
}) => (
  <div className="text-center">
    <button
      onClick={onNavigate}
      className="px-10 py-4 h-14 font-semibold text-lg rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 shadow-lg transition-all duration-200 touch-manipulation"
      aria-label="Ver catálogo completo"
    >
      Ver catálogo completo
    </button>
  </div>
);

/* ================================
   MAIN COMPONENT
================================= */
const About = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { isMobile, isLowEnd } = useDeviceDetection();

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
      className="min-h-[100dvh] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 relative overflow-hidden"
      style={getSafeAreaStyle()}
    >
      <OptimizedBackground 
        isMobile={isMobile} 
        isLowEnd={isLowEnd}
        prefersReducedMotion={!!reduceMotion}
      />

      <Navbar onCartClick={handleCartClick} />

      <main className="relative max-w-7xl mx-auto px-6 pt-28 pb-20">
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