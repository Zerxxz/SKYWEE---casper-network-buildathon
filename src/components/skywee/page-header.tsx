"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { type LucideIcon } from "lucide-react"

export interface PageHeaderProps {
  eyebrow: string
  title: string
  titleAccent?: string
  description: string
  icon?: LucideIcon
  actions?: React.ReactNode
}

const easeOut = [0.22, 1, 0.36, 1] as const

export function PageHeader({
  eyebrow,
  title,
  titleAccent,
  description,
  icon: Icon,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut, delay: 0.05 }}
            className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground"
          >
            {Icon && <Icon size={11} />}
            <span>{eyebrow}</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut, delay: 0.1 }}
            className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-[-0.03em]"
          >
            {title}{" "}
            {titleAccent && (
              <span className="text-muted-foreground">{titleAccent}</span>
            )}
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut, delay: 0.18 }}
            className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed"
          >
            {description}
          </motion.p>
        </div>

        {/* Actions */}
        {actions && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut, delay: 0.25 }}
            className="flex-shrink-0"
          >
            {actions}
          </motion.div>
        )}
      </div>
    </div>
  )
}
