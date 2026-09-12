'use client';

import { motion } from 'framer-motion';

export function HolaMundo() {
  return (
    <motion.section
      className="hola-mundo"
      initial={{ backgroundPosition: '0% 50%' }}
      animate={{ backgroundPosition: '100% 50%' }}
      transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse' }}
      aria-labelledby="welcome-title"
    >
      <div className="hola-content">
        <h1 id="welcome-title" className="hola-title" aria-label="Hola Mundo">
          <motion.span
            className="hola-word"
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          >
            Hola
          </motion.span>
          <motion.span
            className="hola-word"
            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
          >
            Mundo
          </motion.span>
        </h1>
        <motion.div
          className="hola-divider"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 1, ease: 'easeInOut' }}
        />
        <motion.p className="hola-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 1.3 }}>
          Tu sistema tributario, claro y cercano.
        </motion.p>
        <motion.span
          className="ts-badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 1.6, stiffness: 260, damping: 20 }}
        >
          TypeScript Fullstack
        </motion.span>
      </div>
    </motion.section>
  );
}
