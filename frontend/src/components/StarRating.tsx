type Priority = "low" | "medium" | "high";

const config: Record<Priority, { count: number; color: string; glow?: string }> = {
  high: { count: 3, color: "#ff6be0", glow: "0 0 6px rgba(255,107,224,.5)" },
  medium: { count: 2, color: "#ffb800" },
  low: { count: 1, color: "#a78bfa" },
};

export default function StarRating({ priority, dim = false }: { priority: Priority; dim?: boolean }) {
  const { count, color, glow } = config[priority];

  return (
    <span style={{ display: "inline-flex", gap: 2, opacity: dim ? 0.3 : 1 }}>
      {[1, 2, 3].map(i => (
        <span
          key={i}
          style={{
            fontSize: 13,
            color: i <= count ? color : "rgba(255,255,255,0.1)",
            textShadow: i <= count && glow ? glow : "none",
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}