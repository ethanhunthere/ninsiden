export function NeuralBackground({
  variant: _variant = "default",
  className,
}: {
  variant?: "hero" | "default";
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className ?? ""}`}
    >
      <div className="absolute inset-0" style={{ background: "#04050a" }} />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 38% at 8% 18%, rgba(0,229,255,0.045) 0%, transparent 65%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 42% at 92% 82%, rgba(157,122,255,0.055) 0%, transparent 60%)",
        }}
      />
    </div>
  );
}
