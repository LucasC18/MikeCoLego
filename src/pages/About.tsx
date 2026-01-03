import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar onCartClick={() => {}} />

      <main className="container mx-auto px-4 pt-28 pb-20 bg-grid">
        {/* HERO */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center space-y-6"
        >
          <h1 className="font-display text-4xl md:text-5xl font-bold">
            <span className="text-foreground">Sobre </span>
            <span className="text-gradient">JediCollector71</span>
          </h1>

          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Somos una tienda dedicada al universo de personajes de series y peliculas.
          </p>
        </motion.section>

        {/* CONTENIDO */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="max-w-4xl mx-auto mt-16 space-y-8"
        >
          {/* QUÉ HACEMOS */}
          <div className="glass-card rounded-2xl p-8 space-y-4">
            <h2 className="font-display text-xl font-semibold text-primary">
              ¿Qué hacemos?
            </h2>

            <p className="text-muted-foreground">
              En JediCollector71 presentamos un universo personajes organizados por
              temáticas como Star Wars, Harry Potter, Marvel, Technic y más.
              Nuestro objetivo es que puedas explorar, comparar y descubrir
              productos de forma clara y visual.
            </p>

            <p className="text-muted-foreground">
              No realizamos ventas directas desde la web. Todas las consultas se
              gestionan de manera personalizada a través de WhatsApp, para
              brindarte información detallada sobre disponibilidad, estado y
              características de cada producto.
            </p>
          </div>

          {/* CÓMO FUNCIONA */}
          <div className="glass-card rounded-2xl p-8 space-y-4">
            <h2 className="font-display text-xl font-semibold text-primary">
              ¿Cómo funciona la consulta?
            </h2>

            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>
                Explorás el catálogo y filtrás por categoría o disponibilidad.
              </li>
              <li>Agregás los productos que te interesan a la consulta.</li>
              <li>Enviás la consulta directamente por WhatsApp.</li>
              <li>Respondemos de forma personalizada.</li>
            </ul>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default About;
