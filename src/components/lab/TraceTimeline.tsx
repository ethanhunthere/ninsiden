"use client";

import { motion, AnimatePresence } from "framer-motion";
import { EventCard } from "./EventCard";
import type { TraceEvent } from "@/lib/trace/types";

interface TraceTimelineProps {
  events: TraceEvent[];
}

export function TraceTimeline({ events }: TraceTimelineProps) {
  const visible = events.filter((e) => e.type !== "model_token");

  return (
    <div className="overflow-y-auto max-h-full p-2">
      {visible.length === 0 && (
        <div className="flex items-center justify-center h-24 text-xs text-muted">
          Timeline events will appear here during a trace run.
        </div>
      )}
      <AnimatePresence initial={false}>
        {visible.map((event, i) => (
          <EventCard key={`${event.type}-${i}`} event={event} index={i} />
        ))}
      </AnimatePresence>
    </div>
  );
}
