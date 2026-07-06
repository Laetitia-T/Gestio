import { useEffect, useRef } from "react";

export default function StarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const stars = Array.from({ length: 55 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 4 + Math.random() * 18,
      alpha: 0.04 + Math.random() * 0.12,
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.00008,
    }));

    const colors = ["#ff2ec4", "#ff6be0", "#8b0040", "#ff1ab3"];

    function drawStar(cx: number, cy: number, r: number, color: string, alpha: number) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = r * 3;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r * 0.4;
        i === 0
          ? ctx.moveTo(cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad)
          : ctx.lineTo(cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    let t = 0;
    let rafId: number;

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.01;
      stars.forEach((s) => {
        s.x += s.drift;
        if (s.x < -0.05) s.x = 1.05;
        if (s.x > 1.05) s.x = -0.05;
        const pulse = s.alpha * (0.7 + 0.3 * Math.sin(t * 2 + s.phase));
        const col = colors[Math.floor((s.phase / (Math.PI * 2)) * colors.length)];
        drawStar(s.x * canvas.width, s.y * canvas.height, s.size, col, pulse);
      });
      rafId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
      }}
    />
  );
}