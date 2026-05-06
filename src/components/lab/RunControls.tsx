"use client";

import { Button } from "@/components/ui/Button";
import { Play, RotateCcw, StopCircle } from "lucide-react";

interface RunControlsProps {
  status: "idle" | "running" | "completed" | "error";
  onRun: () => void;
  onReset: () => void;
  canRun: boolean;
}

export function RunControls({ status, onRun, onReset, canRun }: RunControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {status === "running" ? (
        <Button variant="danger" size="sm" onClick={onReset} className="gap-1.5">
          <StopCircle size={14} />
          Stop
        </Button>
      ) : (
        <Button
          variant="primary"
          size="sm"
          onClick={onRun}
          disabled={!canRun}
          className="gap-1.5"
        >
          <Play size={14} />
          Run Trace
        </Button>
      )}
      {status !== "idle" && (
        <Button variant="ghost" size="sm" onClick={onReset} className="gap-1.5">
          <RotateCcw size={14} />
          Reset
        </Button>
      )}
    </div>
  );
}
