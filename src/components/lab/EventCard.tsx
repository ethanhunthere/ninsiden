"use client";

import { motion, AnimatePresence } from "framer-motion";
import { EVENT_LABELS } from "@/lib/trace/eventLabels";
import type { TraceEvent } from "@/lib/trace/types";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: TraceEvent;
  index: number;
}

export function EventCard({ event, index }: EventCardProps) {
  const meta = EVENT_LABELS[event.type] ?? { icon: "·", color: "text-muted" };
  const time = new Date(event.timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 2,
  });

  if (event.type === "model_token") return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-white/3 transition-colors group"
    >
      <span className="mt-0.5 text-sm w-5 text-center shrink-0">{meta.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn("text-xs font-semibold", meta.color)}>{event.title}</span>
          <span className="text-[10px] text-muted font-mono ml-auto shrink-0">{time}</span>
        </div>
        {event.description && (
          <p className="text-[11px] text-foreground/50 leading-relaxed">{event.description}</p>
        )}
      </div>
    </motion.div>
  );
}
