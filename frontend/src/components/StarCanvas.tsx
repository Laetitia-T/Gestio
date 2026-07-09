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

    const DOT = 3, GAP = 2, STEP = DOT + GAP;

    function starPoints(cx: number, cy: number, r: number, r2: number, n = 5) {
      const pts: [number, number][] = [];
      for (let i = 0; i < n * 2; i++) {
        const angle = (Math.PI / n) * i - Math.PI / 2;
        const rad = i % 2 === 0 ? r : r2;
        pts.push([cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad]);
      }
      return pts;
    }

    function pointInPolygon(px: number, py: number, poly: [number, number][]) {
      let inside = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1];
        const xj = poly[j][0], yj = poly[j][1];
        if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi))
          inside = !inside;
      }
      return inside;
    }

    const stars = Array.from({ length: 14 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: 25 + Math.random() * 70,
      alpha: 0.07 + Math.random() * 0.13,
      phase: Math.random() * Math.PI * 2,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.12,
    }));

    let t = 0;
    let rafId: number;

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.01;

      stars.forEach((s) => {
        s.x += s.vx; s.y += s.vy;
        if (s.x < -s.size * 2) s.x = canvas.width + s.size;
        if (s.x > canvas.width + s.size * 2) s.x = -s.size;
        if (s.y < -s.size * 2) s.y = canvas.height + s.size;
        if (s.y > canvas.height + s.size * 2) s.y = -s.size;

        const pulse = 0.5 + 0.5 * Math.sin(t * 1.5 + s.phase);
        const alpha = s.alpha * pulse;
        const poly = starPoints(s.x, s.y, s.size, s.size * 0.4);
        const minX = Math.min(...poly.map(p => p[0]));
        const maxX = Math.max(...poly.map(p => p[0]));
        const minY = Math.min(...poly.map(p => p[1]));
        const maxY = Math.max(...poly.map(p => p[1]));

        ctx.save();
        for (let px = minX; px < maxX; px += STEP) {
          for (let py = minY; py < maxY; py += STEP) {
            if (pointInPolygon(px, py, poly)) {
              ctx.globalAlpha = alpha;
              ctx.shadowColor = "#ff2ec4";
              ctx.shadowBlur = 8;
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(px, py, DOT, DOT);
              ctx.globalAlpha = alpha * 0.35;
              ctx.fillStyle = "#ff2ec4";
              ctx.fillRect(px - 1, py - 1, DOT + 2, DOT + 2);
            }
          }
        }
        ctx.restore();
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
    <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />
  );
}