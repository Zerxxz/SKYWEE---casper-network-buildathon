"use client"

import * as React from "react"
import { motion } from "framer-motion"

const easeOut = [0.22, 1, 0.36, 1] as const

/**
 * Stagger container — wraps page sections so children animate in sequence.
 * Place <StaggerChild> elements inside.
 */
export function StaggerContainer({
  children,
  className,
  delay = 0.15,
  stagger = 0.06,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  stagger?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { transition: { staggerChildren: stagger, delayChildren: delay } },
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Stagger child — fades in + slides up with delay.
 * Must be placed inside <StaggerContainer>.
 */
export function StaggerChild({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: easeOut },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Standalone fade-in-up — for elements outside a StaggerContainer.
 */
export function FadeInUp({
  children,
  className,
  delay = 0,
  duration = 0.5,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, ease: easeOut, delay }}
    >
      {children}
    </motion.div>
  )
}
