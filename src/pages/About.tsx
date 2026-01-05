import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Truck,
  Search,
  Shield,
  Heart,
  Zap,
  Star,
} from "lucide-react";

/* =========================================================
   Hook contador animado – FIX DEFINITIVO
   ✔ Re-anima cuando cambia `end`
   ✔ Funciona cuando products llegan async
   ✔ Respeta reduceMotion
   ✔ Sin efectos duplicados
========================================================= */
const useCounter = (end: number, duration = 2, reduceMotion = false) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  const isInView = useInView(ref, { margin: "-60px" });

  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const lastEndRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isInView) return;

    const safeEnd = Number.isFinite(end)
      ? Math.max(0, Math.floor(end))
      : 0;

    // si no cambió el valor objetivo, no re-animar
    if (lastEndRef.current === safeEnd) {
      if (reduceMotion) setCount(safeEnd);
      return;
    }

    lastEndRef.current = safeEnd;

    // reduce motion → set directo
    if (reduceMotion) {
      setCount(safeEnd);
      return;
    }

    // cancelar animación previa
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    startRef.current = null;
    const from = count;
    const to = safeEnd;

    if (from === to) {
      setCount(to);
      return;
    }

    const animate = (time: number) => {
      if (startRef.current === null) startRef.current = time;

      const elapsed = time - startRef.current;
      const progress = Math.min(elapsed / (duration * 1000), 1);

      const next = Math.floor(from + (to - from) * progress);
      setCount(next);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, duration, isInView, reduceMotion]);

  return { count, ref };
};


/* =========================================================
   Background decor
========================================================= */
const BackgroundDecor = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-primary/10 blur-3xl" />
    <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full bg-primary/10 blur-3xl" />
    <div className="absolute top-1/3 left-1/2 w-[620px] h-[620px] -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
  </div>
);

/* =========================================================
   Section Title
========================================================= */
const SectionTitle = ({
  kicker,
  title,
  subtitle,
  icon: Icon,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) => (
  <div className="text-center space-y-3">
    {kicker && (
      <div className="inline-flex items-center gap-2 px-4 py-2 glass-card text-primary font-semibold text-sm rounded-full">
        {Icon && <Icon className="w-4 h-4" />}
        {kicker}
      </div>
    )}

    <h2 className="font-display text-3xl md:text-4xl font-bold">
      <span className="text-gradient">{title}</span>
    </h2>

    {subtitle && (
      <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
        {subtitle}
      </p>
    )}
  </div>
);

/* =========================================================
   Stat Card
========================================================= */
const StatCard = ({
  value,
  label,
  suffix = "",
  icon: Icon,
  emoji,
  reduceMotion,
}: {
  value: number;
  label: string;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  emoji: string;
  reduceMotion: boolean;
}) => {
  const { count, ref } = useCounter(value, 2, reduceMotion);

  return (
    <motion.div
      ref={ref}
      whileHover={{ y: -8, scale: 1.05 }}
      className="glass-card rounded-2xl p-8 text-center space-y-4 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="flex justify-center items-center gap-3 mb-4">
          <span className="text-3xl">{emoji}</span>
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <Icon className="w-6 h-6" />
          </div>
        </div>

        <div className="text-5xl md:text-6xl font-bold text-gradient font-display">
          {count}
          {suffix}
        </div>

        <p className="text-sm text-muted-foreground mt-2">{label}</p>
      </div>
    </motion.div>
  );
};

/* =========================================================
   Category Card
========================================================= */
const CategoryCard = ({
  name,
  count,
  emoji,
  onClick,
}: {
  name: string;
  count: number;
  emoji: string;
  onClick: () => void;
}) => (
  <motion.div
    role="button"
    tabIndex={0}
    aria-label={`Ver categoría ${name}`}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    }}
    whileHover={{ y: -10, scale: 1.08 }}
    whileTap={{ scale: 0.95 }}
    className="glass-card rounded-2xl p-8 cursor-pointer text-center space-y-4 relative overflow-hidden group"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      <motion.div
        className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full"
        animate={{ y: [0, -20, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-primary/40 rounded-full"
        animate={{ y: [0, -15, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
      <motion.div
        className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-primary/30 rounded-full"
        animate={{ y: [0, -12, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, delay: 0.2 }}
      />
    </div>

    <div className="relative z-10 space-y-4">
      <motion.div
        className="text-5xl"
        whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.2 }}
        transition={{ duration: 0.5 }}
      >
        {emoji}
      </motion.div>

      <h3 className="font-display font-bold text-xl group-hover:text-primary transition-colors">
        {name}
      </h3>

      <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
        <Package className="w-4 h-4" />
        {count} productos
      </p>

      <span className="text-primary font-semibold text-sm">Ver categoría →</span>
    </div>
  </motion.div>
);

/* =========================================================
   FAQ Item
========================================================= */
const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="glass-card rounded-xl overflow-hidden border border-transparent hover:border-primary/20 transition-all"
    >
      <button
        aria-expanded={open}
        aria-label={open ? `Cerrar: ${q}` : `Abrir: ${q}`}
        onClick={() => setOpen((v) => !v)}
        className="w-full p-6 flex justify-between items-center text-left hover:bg-primary/5 transition-colors group"
      >
        <span className="font-semibold group-hover:text-primary transition-colors pr-4">
          {q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
          {a}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* =========================================================
   Feature Card
========================================================= */
const FeatureCard = ({
  icon: Icon,
  title,
  description,
  emoji,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  emoji: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -5 }}
    className="glass-card rounded-2xl p-6 space-y-3 text-center relative overflow-hidden group"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

    <div className="relative z-10">
      <div className="flex justify-center items-center gap-3 mb-4">
        <span className="text-2xl">{emoji}</span>
        <div className="p-3 bg-primary/10 rounded-xl w-fit group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6 text-primary" />
        </div>
      </div>
      <h3 className="font-display font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  </motion.div>
);

/* =========================================================
   Step Card
========================================================= */
const StepCard = ({
  number,
  icon: Icon,
  text,
  emoji,
}: {
  number: number;
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  emoji: string;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay: (number - 1) * 0.1 }}
    whileHover={{ y: -6 }}
    className="glass-card rounded-2xl p-6 space-y-4 relative overflow-hidden group"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

    <div className="relative z-10 flex flex-col items-center text-center space-y-4">
      <span className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 text-white flex items-center justify-center text-lg font-bold shadow-lg group-hover:scale-110 transition-transform">
        {number}
      </span>

      <div className="flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <Icon className="w-8 h-8 text-primary" />
      </div>

      <p className="text-muted-foreground leading-relaxed">{text}</p>
    </div>
  </motion.div>
);

/* =========================================================
   ABOUT PAGE
========================================================= */
const About = () => {
  const { products } = useProducts();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement | null>(null);

  /* Parallax Hero */
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const yTransform = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const y = reduceMotion ? 0 : yTransform;
  const opacity = reduceMotion ? 1 : opacityTransform;

  /* Categorías dinámicas */
  const getCategoryEmoji = (name: string) => {
    const map: Record<string, string> = {
      "Star Wars": "⚔️",
      Marvel: "🦸",
      "Harry Potter": "🪄",
      "DC Comics": "🦇",
      DC: "🦇",
      Anime: "🎌",
      Gaming: "🎮",
      City: "🏙️",
      Ideas: "💡",
      Creator: "🎨",
      Technic: "⚙️",
    };
    return map[name] || "🎁";
  };

  const categories = useMemo(() => {
    const map = new Map<string, number>();

    products.forEach((p) => {
      const key = p.category || "Otros";
      map.set(key, (map.get(key) ?? 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({
        name,
        count,
        emoji: getCategoryEmoji(name),
      }))
      .sort((a, b) => b.count - a.count);
  }, [products]);

  /* FAQs */
  const faqs = [
    {
      q: "¿Cómo puedo realizar una compra?",
      a: "La web es solo de consulta. Agregás los productos al carrito y nos enviás el detalle por WhatsApp. Respondemos con disponibilidad, precio y opciones.",
    },
    {
      q: "¿Envían a todo el país?",
      a: "Sí. Hacemos envíos a toda Argentina. Coordinamos la logística directamente por WhatsApp.",
    },
    {
      q: "¿Los productos son originales?",
      a: "Todos los productos son originales y verificados antes de ser publicados.",
    },
    {
      q: "¿Puedo reservar un producto?",
      a: "Sí. Podés reservar productos con una seña, sujeto a disponibilidad.",
    },
    {
      q: "¿Hacen descuentos por cantidad?",
      a: "En compras múltiples analizamos descuentos personalizados. Consultanos.",
    },
    {
      q: "¿En qué estado están los productos?",
      a: "Indicamos claramente si el producto es nuevo, usado o armado.",
    },
  ];

  /* Features */
  const features = [
    {
      icon: Shield,
      emoji: "🛡️",
      title: "Productos auténticos",
      description:
        "Cada figura es revisada y validada antes de ser publicada en el catálogo.",
    },
    {
      icon: MessageCircle,
      emoji: "💬",
      title: "Atención personalizada",
      description:
        "Respondemos todas tus consultas por WhatsApp de forma clara y directa.",
    },
    {
      icon: Truck,
      emoji: "🚚",
      title: "Envíos seguros",
      description: "Empaque cuidado, seguimiento y envío a todo el país.",
    },
  ];

  /* Testimonials */
  const testimonials = [
    {
      name: "Tomas M.",
      role: "Coleccionista",
      emoji: "🧑‍🚀",
      text: "La atención es excelente y los productos llegan impecables. Totalmente recomendado.",
    },
    {
      name: "María G.",
      role: "Fanática Marvel",
      emoji: "🦸‍♀️",
      text: "Me ayudaron a conseguir una figura que buscaba hace años.",
    },
    {
      name: "Federico R.",
      role: "Coleccionista",
      emoji: "👤",
      text: "Muy prolijos, transparentes y rápidos. Volvería a comprar sin dudar.",
    },
  ];

  const goToCatalogWithCategory = (category: string) => {
    const search = `?category=${encodeURIComponent(category)}`;
    navigate(
      { pathname: "/catalogo", search },
      { state: { category } }
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <BackgroundDecor />

      <Navbar onCartClick={() => navigate("/catalogo")} />

      <main className="container mx-auto px-4 pt-28 pb-20 relative z-10">
        {/* HERO */}
        <motion.section
          ref={heroRef}
          style={{ y, opacity }}
          className="text-center space-y-8 max-w-5xl mx-auto mb-32"
        >
          <SectionTitle
            kicker="Colecciones épicas"
            icon={Sparkles}
            title="JediCollector71"
            subtitle="Un catálogo visual pensado para coleccionistas exigentes."
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-muted-foreground text-xl max-w-3xl mx-auto"
          >
            Explorá figuras icónicas de Star Wars, Marvel, Harry Potter, DC y más.
            Cada pieza tiene su historia.
          </motion.p>
        </motion.section>

        {/* STATS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-32">
          <StatCard
            value={products.length}
            label="Productos publicados"
            suffix="+"
            icon={Package}
            emoji="📦"
            reduceMotion={!!reduceMotion}
          />
          <StatCard
            value={500}
            label="Clientes satisfechos"
            suffix="+"
            icon={Users}
            emoji="👥"
            reduceMotion={!!reduceMotion}
          />
          <StatCard
            value={5}
            label="Años de experiencia"
            icon={Calendar}
            emoji="📅"
            reduceMotion={!!reduceMotion}
          />
        </section>

        {/* QUIÉNES SOMOS */}
        <section className="max-w-5xl mx-auto mb-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-10 space-y-6 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />

            <div className="relative z-10">
              <div className="flex justify-center items-center gap-3 mb-6">
                <Heart className="w-6 h-6 text-primary" />
                <h2 className="font-display text-3xl md:text-4xl font-bold text-primary">
                  ¿Quiénes somos?
                </h2>
              </div>

              <p className="text-muted-foreground text-lg leading-relaxed">
                Somos una tienda de exhibición y consulta dedicada al mundo del
                coleccionismo. Organizamos figuras por categorías para que puedas
                explorar con comodidad y claridad.
              </p>

              <p className="text-muted-foreground text-lg leading-relaxed">
                No vendemos directamente desde la web: cada consulta es personal,
                directa y transparente vía WhatsApp.
              </p>
            </div>
          </motion.div>
        </section>

        {/* FEATURES */}
        <section className="max-w-6xl mx-auto mb-32">
          <SectionTitle
            title="¿Por qué elegirnos?"
            subtitle="Nos enfocamos en calidad, confianza y experiencia."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {features.map((f, index) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <FeatureCard {...f} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section className="max-w-5xl mx-auto mb-32">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-10 space-y-10 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />

            <div className="relative z-10">
              <div className="flex justify-center items-center gap-3 mb-8">
                <Zap className="w-6 h-6 text-primary" />
                <h2 className="font-display text-3xl md:text-4xl font-bold text-primary">
                  ¿Cómo funciona la web?
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StepCard
                  number={1}
                  icon={Search}
                  emoji="🔍"
                  text="Explorás el catálogo y filtrás por categoría o disponibilidad."
                />
                <StepCard
                  number={2}
                  icon={Package}
                  emoji="📦"
                  text="Agregás los productos que te interesan al carrito de consulta."
                />
                <StepCard
                  number={3}
                  icon={MessageCircle}
                  emoji="💬"
                  text="Enviás la consulta por WhatsApp y respondemos personalmente."
                />
              </div>
            </div>
          </motion.div>
        </section>

        {/* CATEGORÍAS */}
        <section className="max-w-6xl mx-auto mb-32">
          <SectionTitle
            title="Explorá por categoría"
            subtitle="Accedé directamente al catálogo filtrado"
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-12">
            {categories.map((c, index) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <CategoryCard
                  name={c.name}
                  count={c.count}
                  emoji={c.emoji}
                  onClick={() => goToCatalogWithCategory(c.name)}
                />
              </motion.div>
            ))}
          </div>
        </section>

        {/* TESTIMONIOS */}
        <section className="max-w-6xl mx-auto mb-32">
          <SectionTitle
            title="Lo que dicen nuestros clientes"
            subtitle="Experiencias reales de coleccionistas"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {testimonials.map((t, index) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="glass-card rounded-2xl p-6 space-y-4 text-center border border-primary/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                      {t.emoji}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  "{t.text}"
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-5xl mx-auto mb-32">
          <SectionTitle
            title="Preguntas frecuentes"
            subtitle="Todo lo que necesitás saber antes de consultar"
          />

          <div className="space-y-4 mt-12">
            {faqs.map((f, index) => (
              <motion.div
                key={f.q}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
              >
                <FAQItem q={f.q} a={f.a} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-12 space-y-6 relative overflow-hidden border border-primary/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />

            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                ¿Listo para empezar tu colección?
              </h2>

              <p className="text-muted-foreground text-lg mb-8">
                Explorá el catálogo completo y consultá por tus figuras favoritas.
              </p>

              <motion.button
                onClick={() => navigate("/catalogo")}
                whileHover={!reduceMotion ? { scale: 1.05 } : undefined}
                whileTap={!reduceMotion ? { scale: 0.95 } : undefined}
                className="px-10 py-5 bg-gradient-to-r from-primary to-primary/80 text-white font-semibold rounded-xl shadow-lg hover:shadow-primary/50 transition-shadow cursor-pointer"
              >
                🚀 Ver catálogo completo
              </motion.button>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
};

export default About;
