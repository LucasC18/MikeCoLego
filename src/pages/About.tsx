import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useReducedMotion,
  AnimatePresence,
} from "framer-motion";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useProducts } from "@/context/ProductContext";
import {
  ChevronDown,
  Sparkles,
  Package,
  Users,
  Calendar,
  MessageCircle,
  Share2,
  Star,
  Award,
  Heart,
  Facebook,
  Twitter,
  Instagram,
  Mail,
} from "lucide-react";

// Constantes para datos estáticos
const STATS_DATA = [
  { value: 0, label: "Productos en catálogo", suffix: "+", icon: Package },
  { value: 500, label: "Clientes satisfechos", suffix: "+", icon: Users },
  { value: 5, label: "Años de experiencia", icon: Calendar },
];

const FAQS_DATA = [
  {
    q: "¿Cómo compro?",
    a: "La web es solo de consulta. Armás tu carrito y nos escribís por WhatsApp.",
  },
  {
    q: "¿Hacen envíos?",
    a: "Sí, enviamos a todo el país. Coordinamos por WhatsApp.",
  },
  {
    q: "¿Son originales?",
    a: "Sí, todas las figuras son verificadas antes de publicarse.",
  },
  {
    q: "¿Ofrecen garantías?",
    a: "Sí, todas las figuras vienen con garantía de autenticidad por 30 días.",
  },
  {
    q: "¿Cómo contacto soporte?",
    a: "Escribinos por WhatsApp o email. Respondemos en menos de 24 horas.",
  },
];

const TESTIMONIALS_DATA = [
  {
    name: "Ana García",
    text: "¡Increíble colección! Encontré figuras raras que no creía posibles.",
    rating: 5,
    image: "https://via.placeholder.com/100",
  },
  {
    name: "Carlos López",
    text: "Servicio excelente y envíos rápidos. Recomiendo 100%.",
    rating: 5,
    image: "https://via.placeholder.com/100",
  },
  {
    name: "María Rodríguez",
    text: "La calidad es top. Mi colección creció gracias a ustedes.",
    rating: 4,
    image: "https://via.placeholder.com/100",
  },
];

const TEAM_DATA = [
  {
    name: "JediCollector71",
    role: "Fundador y Coleccionista",
    bio: "Apasionado por las figuras desde hace 10 años. Experto en autenticación.",
    image: "https://via.placeholder.com/150",
  },
  {
    name: "Equipo de Soporte",
    role: "Atención al Cliente",
    bio: "Siempre listos para ayudarte con tu pedido.",
    image: "https://via.placeholder.com/150",
  },
];

// Variantes de animación
const fadeInUp = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Hook contador animado
const useCounter = (end: number, duration = 2) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    let start: number | null = null;
    let raf: number;
    const animate = (t: number) => {
      if (!start) start = t;
      const progress = Math.min((t - start) / (duration * 1000), 1);
      const next = Math.floor(progress * end);
      setCount((prev) => (prev === next ? prev : next));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, isInView]);

  return { count, ref };
};

// Stat Card
const StatCard = ({
  value,
  label,
  suffix = "",
  icon: Icon,
}: {
  value: number;
  label: string;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
}) => {
  const { count, ref } = useCounter(value);
  return (
    <motion.div
      ref={ref}
      variants={fadeInUp}
      whileHover={{ y: -6, scale: 1.05 }}
      className="glass-card rounded-2xl p-8 text-center space-y-4"
      role="region"
      aria-labelledby={`stat-${label}`}
    >
      <div className="flex justify-center">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <Icon className="w-6 h-6" aria-hidden="true" />
        </div>
      </div>
      <div
        id={`stat-${label}`}
        className="text-5xl font-bold text-gradient font-display"
        aria-live="polite"
      >
        {count}
        {suffix}
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
};

// Category Card
const CategoryCard = ({
  name,
  count,
  onClick,
}: {
  name: string;
  count: number;
  onClick: () => void;
}) => (
  <motion.div
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => e.key === "Enter" && onClick()}
    variants={fadeInUp}
    whileHover={{ y: -8, scale: 1.06 }}
    whileTap={{ scale: 0.95 }}
    className="glass-card rounded-2xl p-8 cursor-pointer text-center space-y-4"
    aria-label={`Ver categoría ${name} con ${count} productos`}
  >
    <img
      src={`https://via.placeholder.com/100?text=${encodeURIComponent(name)}`}
      alt={`Imagen representativa de ${name}`}
      className="w-16 h-16 mx-auto rounded-lg"
      loading="lazy"
    />
    <h3 className="font-display font-bold text-xl">{name}</h3>
    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
      <Package className="w-4 h-4" aria-hidden="true" />
      {count} productos
    </p>
  </motion.div>
);

// FAQ Item
const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      variants={fadeInUp}
      className="glass-card rounded-xl overflow-hidden"
    >
      <button
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="w-full p-6 flex justify-between items-center text-left"
      >
        <span className="font-semibold">{q}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5" aria-hidden="true" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-6 pb-6 text-muted-foreground leading-relaxed"
          >
            {a}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Testimonial Card
const TestimonialCard = ({
  name,
  text,
  rating,
  image,
}: {
  name: string;
  text: string;
  rating: number;
  image: string;
}) => (
  <motion.div
    variants={fadeInUp}
    className="glass-card rounded-2xl p-6 space-y-4"
  >
    <div className="flex items-center gap-4">
      <img
        src={image}
        alt={`Foto de ${name}`}
        className="w-12 h-12 rounded-full"
        loading="lazy"
      />
      <div>
        <h4 className="font-semibold">{name}</h4>
        <div className="flex">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < rating ? "text-yellow-500" : "text-gray-300"
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </div>
    <p className="text-muted-foreground italic">"{text}"</p>
  </motion.div>
);

// Team Member Card
const TeamMemberCard = ({
  name,
  role,
  bio,
  image,
}: {
  name: string;
  role: string;
  bio: string;
  image: string;
}) => (
  <motion.div
    variants={fadeInUp}
    className="glass-card rounded-2xl p-6 text-center space-y-4"
  >
    <img
      src={image}
      alt={`Foto de ${name}`}
      className="w-24 h-24 mx-auto rounded-full"
      loading="lazy"
    />
    <h3 className="font-display font-bold text-xl">{name}</h3>
    <p className="text-primary font-semibold">{role}</p>
    <p className="text-muted-foreground">{bio}</p>
  </motion.div>
);

// ABOUT PAGE
const About = () => {
  const { products } = useProducts();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) =>
      map.set(p.category, (map.get(p.category) ?? 0) + 1)
    );
    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [products]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: "JediCollector71 - Figuras Coleccionables",
        text: "Descubre nuestro catálogo de figuras únicas.",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Enlace copiado al portapapeles!");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCartClick={() => navigate("/catalogo")} />

      <main className="container mx-auto px-4 pt-28 pb-20 space-y-32">
        {/* HERO */}
        <motion.section
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="text-center space-y-8 max-w-4xl mx-auto"
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-4 py-2 glass-card text-primary font-semibold text-sm rounded-full"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            Colecciones únicas
          </motion.div>
          <motion.h1
            variants={fadeInUp}
            className="font-display text-5xl md:text-7xl font-bold"
          >
            Sobre <span className="text-gradient">JediCollector71</span>
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="text-muted-foreground text-xl"
          >
            Catálogo visual de figuras coleccionables organizado por categorías.
          </motion.p>
        </motion.section>

        {/* STATS */}
        <motion.section
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {STATS_DATA.map((stat, index) => (
            <StatCard key={index} {...stat} value={index === 0 ? products.length : stat.value} />
          ))}
        </motion.section>

        {/* CATEGORIES */}
        <motion.section
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="max-w-6xl mx-auto space-y-12"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-center font-display text-4xl font-bold"
          >
            Explorá por categoría
          </motion.h2>
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-3 gap-6"
          >
            {categories.map((c) => (
              <CategoryCard
                key={c.name}
                {...c}
                onClick={() =>
                  navigate(`/catalogo?category=${encodeURIComponent(c.name)}`)
                }
              />
            ))}
          </motion.div>
        </motion.section>

        {/* TESTIMONIALS */}
        <motion.section
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="max-w-6xl mx-auto space-y-12"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-center font-display text-4xl font-bold"
          >
            Lo que dicen nuestros clientes
          </motion.h2>
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {TESTIMONIALS_DATA.map((t, index) => (
              <TestimonialCard key={index} {...t} />
            ))}
          </motion.div>
        </motion.section>

        {/* TEAM */}
        <motion.section
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="max-w-6xl mx-auto space-y-12"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-center font-display text-4xl font-bold"
          >
            Nuestro equipo
          </motion.h2>
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {TEAM_DATA.map((member, index) => (
              <TeamMemberCard key={index} {...member} />
            ))}
          </motion.div>
        </motion.section>

        {/* HISTORY */}
        <motion.section
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="max-w-4xl mx-auto space-y-8"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-center font-display text-4xl font-bold"
          >
            Nuestra historia
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-muted-foreground text-xl leading-relaxed"
          >
            Todo comenzó en 2018 cuando un grupo de apasionados por las figuras coleccionables decidió crear un espacio dedicado exclusivamente a la autenticidad y la calidad. Con años de experiencia en el mercado, hemos construido una comunidad de coleccionistas que confían en nosotros para encontrar piezas únicas y raras. Nuestra misión es hacer que la colección sea accesible, divertida y segura para todos.
          </motion.p>
          <motion.div
            variants={fadeInUp}
            className="flex justify-center"
          >
            <Award className="w-16 h-16 text-primary" aria-hidden="true" />
          </motion.div>
        </motion.section>

        {/* FAQ */}
        <motion.section
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="max-w-4xl mx-auto space-y-6"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-center font-display text-4xl font-bold"
          >
            Preguntas frecuentes
          </motion.h2>
          {FAQS_DATA.map((f) => (
            <FAQItem key={f.q} {...f} />
          ))}
        </motion.section>

        {/* CTA */}
        <motion.section
          initial="initial"
          animate="animate"
          variants={staggerContainer}
          className="text-center space-y-8"
        >
          <motion.button
            variants={fadeInUp}
            whileHover={!reduceMotion ? { scale: 1.05 } : undefined}
            whileTap={!reduceMotion ? { scale: 0.95 } : undefined}
            onClick={() => navigate("/catalogo")}
            className="px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-white font-semibold rounded-xl shadow-lg"
          >
            Ver catálogo completo
          </motion.button>
          <motion.button
            variants={fadeInUp}
            whileHover={!reduceMotion ? { scale: 1.05 } : undefined}
            whileTap={!reduceMotion ? { scale: 0.95 } : undefined}
            onClick={handleShare}
            className="px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-xl shadow-lg flex items-center gap-2 mx-auto"
          >
            <Share2 className="w-5 h-5" aria-hidden="true" />
            Compartir
          </motion.button>
        </motion.section>
      </main>
    </div>
  );
};

export default About;