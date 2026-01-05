import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { ChevronDown, Sparkles, Package, Users, Calendar, MessageCircle } from "lucide-react";

// Hook para animar contadores
const useCounter = (end: number, duration: number = 2) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
      let startTime: number;
      let animationFrame: number;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
        
        setCount(Math.floor(progress * end));

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };

      animationFrame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [isInView, end, duration, hasAnimated]);

  return { count, ref };
};

// Componente de Estadística mejorado
const StatCard = ({ 
  value, 
  label, 
  suffix = "", 
  icon: Icon 
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
      whileHover={{ scale: 1.05, y: -5 }}
      className="glass-card rounded-2xl p-8 text-center space-y-4 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <Icon className="w-6 h-6" />
          </div>
        </div>
        
        <div className="text-5xl md:text-6xl font-bold text-gradient font-display">
          {count}{suffix}
        </div>
        <div className="text-muted-foreground text-sm mt-2">{label}</div>
      </div>
    </motion.div>
  );
};

// Componente de Acordeón FAQ mejorado
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={false}
      whileHover={{ scale: 1.01 }}
      className="glass-card rounded-xl overflow-hidden border border-transparent hover:border-primary/20 transition-all"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 flex items-center justify-between text-left hover:bg-primary/5 transition-colors group"
      >
        <span className="font-semibold text-foreground pr-4 group-hover:text-primary transition-colors">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-primary" />
        </motion.div>
      </button>
      
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
          {answer}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Componente de Categoría mejorado con enlace
const CategoryCard = ({ 
  name, 
  icon, 
  count,
  category
}: { 
  name: string; 
  icon: string; 
  count: number;
  category: string;
}) => {
  return (
    <a href={`/?category=${category}`}>
      <motion.div
        whileHover={{ scale: 1.08, y: -10 }}
        whileTap={{ scale: 0.95 }}
        className="glass-card rounded-2xl p-8 cursor-pointer group relative overflow-hidden"
      >
        {/* Efecto de brillo animado */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        
        {/* Partículas flotantes */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.div
            className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full"
            animate={{
              y: [0, -20, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0
            }}
          />
          <motion.div
            className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-primary/40 rounded-full"
            animate={{
              y: [0, -15, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 0.5
            }}
          />
        </div>
        
        <div className="relative z-10 space-y-4">
          <motion.div 
            className="text-5xl"
            whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.2 }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>
          <h3 className="font-display font-bold text-xl text-foreground group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Package className="w-4 h-4" />
            {count} productos
          </p>
        </div>
        
        {/* Indicador de click */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-primary text-sm font-semibold"
          >
            Ver →
          </motion.div>
        </div>
      </motion.div>
    </a>
  );
};

// Componente de Feature/Beneficio
const FeatureCard = ({
  icon: Icon,
  title,
  description
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className="glass-card rounded-2xl p-6 space-y-3"
    >
      <div className="p-3 bg-primary/10 rounded-xl w-fit">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="font-display font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
};

const About = () => {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // FAQs
  const faqs = [
    {
      question: "¿Cómo puedo realizar una compra?",
      answer: "No vendemos directamente por la web. Agregá los productos que te interesan al carrito de consulta y envianos el detalle por WhatsApp. Te responderemos con información sobre disponibilidad, precio y formas de pago."
    },
    {
      question: "¿Envían a todo el país?",
      answer: "Sí, realizamos envíos a toda Argentina. Coordinamos el método de envío más conveniente según tu ubicación a través de WhatsApp."
    },
    {
      question: "¿Los productos son originales?",
      answer: "Todos nuestros productos son figuras coleccionables de marcas reconocidas. Verificamos la autenticidad de cada pieza antes de ofrecerla."
    },
    {
      question: "¿Puedo reservar un producto?",
      answer: "Sí, podés consultar por WhatsApp para reservar productos con una seña. Te indicaremos el proceso según disponibilidad."
    },
    {
      question: "¿Hacen descuentos por cantidad?",
      answer: "Consultanos por WhatsApp si estás interesado en varios productos. Evaluamos cada caso de forma personalizada."
    },
    {
      question: "¿Cuál es el estado de los productos?",
      answer: "Especificamos claramente el estado de cada producto: Nuevo, Usado o Armado. Todos los detalles se proporcionan antes de la compra."
    }
  ];

  // Categorías con navegación
  const categories = [
    { name: "Star Wars", icon: "⚔️", count: 45, category: "Star Wars" },
    { name: "Marvel", icon: "🦸", count: 38, category: "Marvel" },
    { name: "Harry Potter", icon: "🪄", count: 27, category: "Harry Potter" },
    { name: "DC Comics", icon: "🦇", count: 31, category: "DC" },
    { name: "Anime", icon: "🎌", count: 22, category: "Anime" },
    { name: "Gaming", icon: "🎮", count: 19, category: "Gaming" }
  ];

  // Features/Beneficios
  const features = [
    {
      icon: Sparkles,
      title: "Productos Auténticos",
      description: "Verificamos la autenticidad de cada figura coleccionable antes de ofrecerla."
    },
    {
      icon: MessageCircle,
      title: "Atención Personalizada",
      description: "Respondemos todas tus consultas por WhatsApp de forma rápida y detallada."
    },
    {
      icon: Package,
      title: "Envíos Seguros",
      description: "Empaque cuidadoso y seguimiento de cada envío hasta tu puerta."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCartClick={() => {}} />

      <main className="container mx-auto px-4 pt-28 pb-20">
        {/* HERO con Parallax mejorado */}
        <motion.section
          ref={heroRef}
          style={{ y, opacity }}
          className="max-w-5xl mx-auto text-center space-y-8 mb-24"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-primary font-semibold">
              <Sparkles className="w-4 h-4" />
              Colecciones Épicas
            </div>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl font-bold leading-tight"
          >
            <span className="text-foreground">Sobre </span>
            <span className="text-gradient">JediCollector71</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed"
          >
            Tu destino definitivo para coleccionar personajes épicos de tus series y películas favoritas. 
            Cada figura cuenta una historia.
          </motion.p>
        </motion.section>

        {/* ESTADÍSTICAS ANIMADAS - Más arriba y destacadas */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto mb-24"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard value={250} label="Productos en catálogo" suffix="+" icon={Package} />
            <StatCard value={500} label="Clientes satisfechos" suffix="+" icon={Users} />
            <StatCard value={5} label="Años de experiencia" icon={Calendar} />
          </div>
        </motion.section>

        {/* FEATURES/BENEFICIOS */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto mb-24"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12">
            <span className="text-gradient">¿Por qué elegirnos?</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* MAPA DE CATEGORÍAS - Más prominente */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto mb-24"
        >
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              <span className="text-gradient">Explorá por Categoría</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Hacé clic en cualquier categoría para ver el catálogo completo
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {categories.map((cat, index) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <CategoryCard {...cat} />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CONTENIDO ORIGINAL mejorado */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto mb-24 space-y-8"
        >
          {/* QUÉ HACEMOS */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-card rounded-3xl p-10 space-y-6 border border-primary/10"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-display text-3xl font-semibold text-primary">
                ¿Qué hacemos?
              </h2>
            </div>

            <p className="text-muted-foreground text-lg leading-relaxed">
              En JediCollector71 presentamos un universo de personajes organizados por
              temáticas como Star Wars, Harry Potter, Marvel, DC Comics y más.
              Nuestro objetivo es que puedas explorar, comparar y descubrir
              productos de forma clara y visual.
            </p>

            <p className="text-muted-foreground text-lg leading-relaxed">
              No realizamos ventas directas desde la web. Todas las consultas se
              gestionan de manera personalizada a través de WhatsApp, para
              brindarte información detallada sobre disponibilidad, estado y
              características de cada producto.
            </p>
          </motion.div>

          {/* CÓMO FUNCIONA */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-card rounded-3xl p-10 space-y-6 border border-primary/10"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-display text-3xl font-semibold text-primary">
                ¿Cómo funciona la consulta?
              </h2>
            </div>

            <div className="space-y-4">
              {[
                "Explorás el catálogo y filtrás por categoría o disponibilidad.",
                "Agregás los productos que te interesan a la consulta.",
                "Enviás la consulta directamente por WhatsApp.",
                "Respondemos de forma personalizada con toda la info."
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 group"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 text-white flex items-center justify-center text-sm font-bold shadow-lg group-hover:scale-110 transition-transform">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground text-lg pt-0.5">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.section>

        {/* FAQ INTERACTIVO */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto mb-24"
        >
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              <span className="text-gradient">Preguntas Frecuentes</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Todo lo que necesitás saber sobre cómo trabajamos
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
              >
                <FAQItem {...faq} />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA FINAL */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="glass-card rounded-3xl p-12 space-y-6 border border-primary/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
            
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                ¿Listo para comenzar tu colección?
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Explorá nuestro catálogo y encontrá tus personajes favoritos
              </p>
              
              <motion.a
                href="/"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-white font-semibold rounded-xl shadow-lg hover:shadow-primary/50 transition-shadow"
              >
                Ver Catálogo Completo
              </motion.a>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default About;