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
  ArrowRight,
  TrendingUp,
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
  gradient: string;
}

interface StatCardProps {
  value: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  emoji: string;
  reduceMotion: boolean;
  suffix?: string;
  gradient: string;
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
    title: "Productos Cuidados",
    desc: "Atención en cada detalle de nuestros productos",
    emoji: "🛡️",
    gradient: "from-cyan-500/20 to-blue-500/20",
  },
  {
    icon: Truck,
    title: "Envío Seguro",
    desc: "Empaque cuidadoso para máxima protección",
    emoji: "🚚",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    icon: Heart,
    title: "Pasión por Coleccionar",
    desc: "Entendemos tu amor por las colecciones",
    emoji: "❤️",
    gradient: "from-pink-500/20 to-rose-500/20",
  },
  {
    icon: Star,
    title: "Selección Curada",
    desc: "Variedad de productos para coleccionistas",
    emoji: "⭐",
    gradient: "from-amber-500/20 to-yellow-500/20",
  },
  {
    icon: Zap,
    title: "Actualización Constante",
    desc: "Nuevos productos cada semana",
    emoji: "⚡",
    gradient: "from-cyan-500/20 to-purple-500/20",
  },
  {
    icon: MessageCircle,
    title: "Atención Personalizada",
    desc: "Siempre listos para ayudarte",
    emoji: "💬",
    gradient: "from-emerald-500/20 to-green-500/20",
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
      
      // Easing function para animación más suave
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));
      
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
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-pink-500/6 rounded-full blur-3xl" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Cyan orb */}
      <motion.div
        className={`absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/8 rounded-full ${isMobile ? 'blur-2xl' : 'blur-3xl'}`}
        style={{ willChange: "transform" }}
        animate={{ 
          scale: [1, 1.15, 1],
          x: [0, isMobile ? 20 : 50, 0],
          y: [0, isMobile ? 15 : 35, 0]
        }}
        transition={{ 
          duration: isMobile ? 14 : 12,
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
      
      {/* Purple orb */}
      <motion.div
        className={`absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/8 rounded-full ${isMobile ? 'blur-2xl' : 'blur-3xl'}`}
        style={{ willChange: "transform" }}
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, isMobile ? -15 : -40, 0],
          y: [0, isMobile ? -10 : -25, 0]
        }}
        transition={{ 
          duration: isMobile ? 15 : 13, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 0.5
        }}
      />

      {/* Pink orb */}
      {!isMobile && (
        <motion.div
          className="absolute top-1/2 right-1/4 w-72 h-72 bg-pink-500/6 rounded-full blur-3xl"
          style={{ willChange: "transform" }}
          animate={{ 
            scale: [1, 1.1, 1],
            x: [0, -30, 0],
            y: [0, 20, 0]
          }}
          transition={{ 
            duration: 16, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
        />
      )}

      {/* Additional ambient layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/3 via-transparent to-purple-500/3" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-slate-900/50" />
    </div>
  );
};

/* ================================
   SUB-COMPONENTS
================================= */
const StatCard = React.memo<StatCardProps>(
  ({ value, label, icon: Icon, emoji, reduceMotion, suffix = "+", gradient }) => {
    const { count, ref } = useCounter(value, COUNTER_DURATION, reduceMotion);

    return (
      <motion.div
        ref={ref}
        initial={reduceMotion ? undefined : { opacity: 0, y: 30, scale: 0.95 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={reduceMotion ? undefined : { duration: 0.5, type: "spring", stiffness: 100 }}
        whileHover={reduceMotion ? undefined : { y: -8, scale: 1.03 }}
        className="relative group"
      >
        {/* Neon glow backdrop */}
        <div className={`absolute -inset-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500 rounded-2xl`} />
        
        <div className="relative bg-slate-800/40 backdrop-blur-md border border-slate-700/40 rounded-2xl p-8 text-center transition-all duration-300 hover:bg-slate-800/60 hover:border-cyan-500/30 overflow-hidden">
          {/* Ambient gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
          
          {/* Top shine effect */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10">
            <motion.div 
              className="flex justify-center gap-3 mb-5"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <span className="text-4xl" role="img" aria-label={label}>
                {emoji}
              </span>
              <div className="p-2 rounded-xl bg-slate-800/60 border border-cyan-500/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-cyan-400/10 blur-lg" />
                <Icon className="w-7 h-7 text-cyan-400 relative z-10" />
              </div>
            </motion.div>
            
            <motion.div 
              className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {count}
              {suffix}
            </motion.div>
            
            <p className="text-slate-300 text-base font-bold">{label}</p>
            
            {/* Indicator */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="font-semibold">En crecimiento</span>
            </div>
          </div>
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
      className="text-center mb-32 relative"
    >
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-gradient-to-b from-cyan-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />
      
      <motion.div
        initial={reduceMotion ? undefined : { opacity: 0, y: 30 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={reduceMotion ? undefined : { duration: 0.6, type: "spring", stiffness: 80 }}
        className="relative z-10"
      >
        {/* Badge */}
        <motion.div
          initial={reduceMotion ? undefined : { scale: 0.9, opacity: 0 }}
          animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
          transition={reduceMotion ? undefined : { delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center gap-2.5 px-6 py-3 bg-slate-800/60 backdrop-blur-xl border border-amber-500/40 rounded-full mb-8 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-5 h-5 text-amber-400 relative z-10" />
          </motion.div>
          <span className="text-sm font-bold text-amber-200 relative z-10">
            Sobre Nosotros
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1 
          className="text-6xl sm:text-7xl md:text-8xl font-bold mb-7 leading-tight"
          initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={reduceMotion ? undefined : { delay: 0.3, duration: 0.7 }}
        >
          <span className="inline-block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent relative">
            JediCollector71
            {/* Subtle underline glow */}
            <motion.div
              className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/50 via-purple-500/50 to-pink-500/50 blur-sm"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            />
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          className="text-slate-300 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed font-medium"
          initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={reduceMotion ? undefined : { delay: 0.5, duration: 0.7 }}
        >
          Tu destino para{" "}
          <span className="text-cyan-400 font-bold">figuras</span> y{" "}
          <span className="text-purple-400 font-bold">productos exclusivos</span>{" "}
          de colección
        </motion.p>

        {/* Decorative elements */}
        <motion.div
          className="mt-8 flex justify-center gap-2"
          initial={reduceMotion ? undefined : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          transition={reduceMotion ? undefined : { delay: 0.7 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
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
      <section className="flex flex-col items-center justify-center mb-32 py-20">
        <motion.div
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={reduceMotion ? undefined : { duration: 1, repeat: Infinity, ease: "linear" }}
          className="mb-5 relative"
        >
          <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full" />
          <Loader2 className="w-14 h-14 text-cyan-400 relative z-10" />
        </motion.div>
        <p className="text-slate-300 text-xl font-bold">Cargando estadísticas...</p>
        <motion.div
          className="mt-4 flex gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-cyan-400"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      </section>
    );
  }

  return (
    <section className="mb-32 relative">
      {/* Section title */}
      <motion.div
        initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-3">
          Nuestra Trayectoria
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 mx-auto rounded-full" />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard
          value={totalProducts}
          label="Productos"
          icon={Package}
          emoji="📦"
          reduceMotion={reduceMotion}
          suffix=""
          gradient="from-cyan-500/20 to-blue-500/20"
        />
        <StatCard
          value={500}
          label="Clientes Felices"
          icon={Users}
          emoji="👥"
          reduceMotion={reduceMotion}
          suffix="+"
          gradient="from-purple-500/20 to-pink-500/20"
        />
        <StatCard
          value={10}
          label="Años de Pasión"
          icon={Calendar}
          emoji="📅"
          reduceMotion={reduceMotion}
          suffix="+"
          gradient="from-pink-500/20 to-rose-500/20"
        />
      </div>
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
    viewport={{ once: true, margin: "-50px" }}
    transition={
      reduceMotion
        ? undefined
        : { duration: 0.5, delay: index * 0.1, type: "spring", stiffness: 100 }
    }
    whileHover={reduceMotion ? undefined : { y: -8, scale: 1.03 }}
    className="relative group"
  >
    {/* Neon glow backdrop */}
    <div className={`absolute -inset-1 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500 rounded-2xl`} />
    
    <div className="relative bg-slate-800/40 backdrop-blur-md border border-slate-700/40 rounded-2xl p-7 text-center transition-all duration-300 hover:bg-slate-800/60 hover:border-purple-500/30 overflow-hidden h-full flex flex-col">
      {/* Ambient gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Top shine effect */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 flex flex-col h-full">
        <motion.div 
          className="flex justify-center mb-5"
          whileHover={{ scale: 1.15, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} border border-purple-500/30 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-purple-400/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <feature.icon className="w-7 h-7 text-purple-400 relative z-10" />
          </div>
        </motion.div>
        
        <h3 className="text-xl font-bold text-slate-100 mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
          {feature.title}
        </h3>
        
        <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors duration-300 flex-1">
          {feature.desc}
        </p>

        {/* Bottom indicator */}
        <div className="mt-5 pt-4 border-t border-slate-700/0 group-hover:border-purple-500/30 transition-all duration-300">
          <motion.div
            className="w-12 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 mx-auto rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ delay: 0.2 }}
          />
        </div>
      </div>
    </div>
  </motion.div>
);

const FeaturesSection = ({ reduceMotion }: { reduceMotion: boolean }) => (
  <motion.section
    initial={reduceMotion ? undefined : { opacity: 0, y: 30 }}
    whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={reduceMotion ? undefined : { duration: 0.6 }}
    className="mb-32 relative"
  >
    {/* Ambient glow */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-64 bg-gradient-to-b from-purple-500/10 via-pink-500/5 to-transparent blur-3xl pointer-events-none" />
    
    <div className="text-center mb-14 relative z-10">
      <motion.h2 
        className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent mb-4"
        initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        ¿Por qué elegirnos?
      </motion.h2>
      
      <motion.div
        className="w-32 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 mx-auto rounded-full mb-5"
        initial={reduceMotion ? undefined : { scaleX: 0 }}
        whileInView={reduceMotion ? undefined : { scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.8 }}
      />
      
      <motion.p 
        className="text-slate-400 text-lg max-w-2xl mx-auto font-medium"
        initial={reduceMotion ? undefined : { opacity: 0 }}
        whileInView={reduceMotion ? undefined : { opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
      >
        Nos comprometemos a brindarte la mejor experiencia en coleccionismo
      </motion.p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
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
  reduceMotion,
}: {
  onNavigate: () => void;
  reduceMotion: boolean;
}) => (
  <motion.section
    initial={reduceMotion ? undefined : { opacity: 0, y: 30 }}
    whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={reduceMotion ? undefined : { duration: 0.6 }}
    className="text-center relative py-16"
  >
    {/* Ambient glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-80 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 blur-3xl pointer-events-none" />
    
    <div className="relative z-10">
      <motion.h3
        className="text-3xl md:text-4xl font-bold text-white mb-5"
        initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        ¿Listo para comenzar?
      </motion.h3>
      
      <motion.p
        className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto"
        initial={reduceMotion ? undefined : { opacity: 0 }}
        whileInView={reduceMotion ? undefined : { opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
      >
        Descubrí nuestra colección completa y encontrá tu próxima pieza favorita
      </motion.p>

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        <button
          onClick={onNavigate}
          className="group relative px-12 py-5 h-16 font-bold text-lg rounded-2xl bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:from-cyan-500 hover:to-pink-500 text-white border-0 shadow-2xl transition-all duration-300 touch-manipulation overflow-hidden"
          aria-label="Ver catálogo completo"
        >
          {/* Neon glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/40 via-purple-400/40 to-pink-400/40 blur-2xl" />
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          
          <span className="relative z-10 flex items-center justify-center gap-3">
            Ver catálogo completo
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </span>
        </button>
      </motion.div>

      {/* Decorative dots */}
      <motion.div
        className="mt-8 flex justify-center gap-3"
        initial={reduceMotion ? undefined : { opacity: 0 }}
        whileInView={reduceMotion ? undefined : { opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </div>
  </motion.section>
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
      className="min-h-[100dvh] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 relative overflow-hidden"
      style={getSafeAreaStyle()}
    >
      <OptimizedBackground 
        isMobile={isMobile} 
        isLowEnd={isLowEnd}
        prefersReducedMotion={!!reduceMotion}
      />

      {/* Additional ambient layer */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent pointer-events-none" />

      <Navbar onCartClick={handleCartClick} />

      <main className="relative max-w-7xl mx-auto px-6 pt-32 pb-24">
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

      {/* Bottom gradient fade */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
    </div>
  );
};

export default About;