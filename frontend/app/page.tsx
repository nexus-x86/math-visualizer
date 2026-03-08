"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ── Interactive graphic: Delta-Epsilon Proof ──
function DeltaEpsilonCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ y: 0.75 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resize();

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      // top of canvas = large epsilon, bottom = small epsilon
      mouseRef.current.y = (e.clientY - rect.top) / rect.height;
    };
    canvas.addEventListener("mousemove", onMouseMove);

    const a = 1.4;
    const f = (x: number) => x * x;
    const L = f(a);

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#08080e";
      ctx.fillRect(0, 0, w, h);

      const xMin = -0.2, xMax = 3.0;
      const yMin = -0.2, yMax = 4.5;
      const pad = { left: 44, right: 20, top: 80, bottom: 80 };
      const gw = w - pad.left - pad.right;
      const gh = h - pad.top - pad.bottom;

      const toSx = (x: number) => pad.left + ((x - xMin) / (xMax - xMin)) * gw;
      const toSy = (y: number) => pad.top + gh - ((y - yMin) / (yMax - yMin)) * gh;

      // Axes
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(toSx(0), toSy(yMin));
      ctx.lineTo(toSx(0), toSy(yMax));
      ctx.moveTo(toSx(xMin), toSy(0));
      ctx.lineTo(toSx(xMax), toSy(0));
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "10px monospace";
      ctx.fillText("x", toSx(xMax) - 10, toSy(0) + 14);
      ctx.fillText("y", toSx(0) + 5, toSy(yMax) + 12);

      // Epsilon driven by cursor Y: top = large, bottom = small
      const eps = 0.07 + (1 - Math.max(0, Math.min(1, mouseRef.current.y))) * 0.63;
      const delta = eps / (2 * a + 0.5);

      // Epsilon band (horizontal strips)
      ctx.fillStyle = "rgba(255, 100, 100, 0.12)";
      ctx.fillRect(toSx(xMin), toSy(L + eps), gw, toSy(L - eps) - toSy(L + eps));
      ctx.strokeStyle = "rgba(255, 100, 100, 0.6)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(toSx(xMin), toSy(L + eps));
      ctx.lineTo(toSx(xMax), toSy(L + eps));
      ctx.moveTo(toSx(xMin), toSy(L - eps));
      ctx.lineTo(toSx(xMax), toSy(L - eps));
      ctx.stroke();
      ctx.setLineDash([]);

      // Delta band (vertical strips)
      ctx.fillStyle = "rgba(51, 165, 196, 0.12)";
      ctx.fillRect(toSx(a - delta), toSy(yMax), toSx(a + delta) - toSx(a - delta), gh);
      ctx.strokeStyle = "rgba(51, 165, 196, 0.6)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(toSx(a - delta), toSy(yMin));
      ctx.lineTo(toSx(a - delta), toSy(yMax));
      ctx.moveTo(toSx(a + delta), toSy(yMin));
      ctx.lineTo(toSx(a + delta), toSy(yMax));
      ctx.stroke();
      ctx.setLineDash([]);

      // f(x) = x^2 curve
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let px = 0; px <= gw; px++) {
        const x = xMin + (px / gw) * (xMax - xMin);
        const sx = toSx(x);
        const sy = toSy(f(x));
        px === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      // Dashed lines from (a, 0) up to (a, L) and over to (0, L)
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(toSx(a), toSy(0));
      ctx.lineTo(toSx(a), toSy(L));
      ctx.lineTo(toSx(0), toSy(L));
      ctx.stroke();
      ctx.setLineDash([]);

      // Point on curve (a, L)
      ctx.beginPath();
      ctx.arc(toSx(a), toSy(L), 4, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Labels
      ctx.font = "bold 11px monospace";
      ctx.fillStyle = "rgba(255,100,100,0.9)";
      ctx.fillText("ε", toSx(xMin) + 3, toSy(L + eps) - 3);
      ctx.fillText("ε", toSx(xMin) + 3, toSy(L - eps) + 12);

      ctx.fillStyle = "rgba(51,165,196,0.9)";
      ctx.fillText("δ", toSx(a - delta) - 12, toSy(yMin + 0.1));
      ctx.fillText("δ", toSx(a + delta) + 3, toSy(yMin + 0.1));

      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "10px monospace";
      ctx.fillText("L", toSx(0) - 16, toSy(L) + 4);
      ctx.fillText("a", toSx(a) - 3, toSy(0) + 14);

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }}
    />
  );
}

// ── Interactive graphic: 3D Perspective Grid ──
function GridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resize();

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };
    canvas.addEventListener("mousemove", onMouseMove);

    const project = (x: number, y: number, z: number, w: number, h: number, rotX: number, rotY: number) => {
      // Rotate around Y
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;

      // Rotate around X
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y1 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      const fov = 4;
      const scale = fov / (fov + z2);
      return {
        x: w / 2 + x1 * scale * Math.min(w, h) * 0.35,
        y: h / 2 + y1 * scale * Math.min(w, h) * 0.35,
        scale,
      };
    };

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#08080e";
      ctx.fillRect(0, 0, w, h);

      t += 0.005;
      const rotY = t + (mouseRef.current.x - 0.5) * 1.5;
      const rotX = 0.5 + (mouseRef.current.y - 0.5) * 0.8;

      const gridSize = 5;
      const step = 2 / gridSize;

      // Grid lines
      for (let i = 0; i <= gridSize; i++) {
        const a = -1 + i * step;
        ctx.beginPath();
        ctx.strokeStyle = "rgba(51, 165, 196, 0.25)";
        ctx.lineWidth = 0.8;
        for (let j = 0; j <= gridSize; j++) {
          const b = -1 + j * step;
          const p = project(a, -0.5, b, w, h, rotX, rotY);
          j === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = "rgba(51, 165, 196, 0.25)";
        for (let j = 0; j <= gridSize; j++) {
          const b = -1 + j * step;
          const p = project(b, -0.5, a, w, h, rotX, rotY);
          j === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      // Animated vectors
      const vectors = [
        { from: [0, -0.5, 0], to: [0.7, 0.3, 0], color: "#ffdd00" },
        { from: [0, -0.5, 0], to: [-0.4, 0.5, 0.5], color: "#ff4d4d" },
      ];
      for (const vec of vectors) {
        const p0 = project(vec.from[0], vec.from[1], vec.from[2], w, h, rotX, rotY);
        const p1 = project(
          vec.to[0] * Math.cos(t * 0.5),
          vec.to[1],
          vec.to[2] * Math.sin(t * 0.5 + 1),
          w, h, rotX, rotY
        );
        ctx.beginPath();
        ctx.strokeStyle = vec.color;
        ctx.lineWidth = 2;
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        const hs = 10;
        ctx.beginPath();
        ctx.fillStyle = vec.color;
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p1.x - hs * Math.cos(angle - 0.4), p1.y - hs * Math.sin(angle - 0.4));
        ctx.lineTo(p1.x - hs * Math.cos(angle + 0.4), p1.y - hs * Math.sin(angle + 0.4));
        ctx.closePath();
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }}
    />
  );
}

// ── Interactive graphic: Bell Curve ──
function BellCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resize();

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) / rect.width;
    };
    canvas.addEventListener("mousemove", onMouseMove);

    const normal = (x: number, mu: number, sigma: number) =>
      Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#08080e";
      ctx.fillRect(0, 0, w, h);

      t += 0.01;
      const mu = mouseRef.current.x; // 0–1 range
      const sigma = 0.1 + 0.04 * Math.sin(t * 0.5);
      const pad = 40;
      const graphW = w - pad * 2;
      const graphH = h - pad * 2;
      const maxY = normal(mu, mu, sigma);

      // Axis
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, h - pad);
      ctx.lineTo(w - pad, h - pad);
      ctx.stroke();

      // Filled area
      ctx.beginPath();
      for (let px = 0; px <= graphW; px++) {
        const xVal = px / graphW;
        const yVal = normal(xVal, mu, sigma) / maxY;
        const sx = pad + px;
        const sy = h - pad - yVal * graphH * 0.8;
        px === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
      }
      ctx.lineTo(w - pad, h - pad);
      ctx.lineTo(pad, h - pad);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, pad, 0, h - pad);
      grad.addColorStop(0, "rgba(51, 165, 196, 0.5)");
      grad.addColorStop(1, "rgba(51, 165, 196, 0.0)");
      ctx.fillStyle = grad;
      ctx.fill();

      // Curve stroke
      ctx.beginPath();
      ctx.strokeStyle = "#33a5c4";
      ctx.lineWidth = 2.5;
      for (let px = 0; px <= graphW; px++) {
        const xVal = px / graphW;
        const yVal = normal(xVal, mu, sigma) / maxY;
        const sx = pad + px;
        const sy = h - pad - yVal * graphH * 0.8;
        px === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      // Mean line
      const muX = pad + mu * graphW;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 221, 0, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(muX, h - pad);
      ctx.lineTo(muX, pad + graphH * 0.15);
      ctx.stroke();
      ctx.setLineDash([]);

      // μ label
      ctx.fillStyle = "rgba(255,221,0,0.8)";
      ctx.font = "11px monospace";
      ctx.fillText("μ", muX + 4, pad + graphH * 0.18);

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }}
    />
  );
}

// ── Interactive graphic: Sequential Math Visualizations ──
function SequenceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };
    resize();

    // --- Scene definitions ---
    const scenes = [
      {
        label: "∫  Definite Integral",
        color: "#33a5c4",
        duration: 5,
        draw: (ctx: CanvasRenderingContext2D, w: number, h: number, progress: number) => {
          const pad = { left: 50, right: 24, top: 30, bottom: 44 };
          const gw = w - pad.left - pad.right;
          const gh = h - pad.top - pad.bottom;
          const toSx = (x: number) => pad.left + x * gw;
          const toSy = (y: number) => pad.top + gh - y * gh;
          const f = (x: number) => 0.15 + 0.55 * Math.sin(x * Math.PI * 1.2) + 0.2 * x;

          // Axes
          ctx.strokeStyle = "rgba(255,255,255,0.18)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(toSx(0), toSy(0));
          ctx.lineTo(toSx(1), toSy(0));
          ctx.moveTo(toSx(0), toSy(0));
          ctx.lineTo(toSx(0), toSy(1));
          ctx.stroke();

          // Axis labels
          ctx.fillStyle = "rgba(255,255,255,0.25)";
          ctx.font = "10px monospace";
          ctx.fillText("x", toSx(1) - 8, toSy(0) + 16);
          ctx.fillText("y", toSx(0) - 16, toSy(1) + 12);

          // Animated fill — Riemann rectangles that get thinner over time
          const a = 0.1, b = 0.85;
          const fillEnd = a + (b - a) * Math.min(progress * 1.4, 1);
          const numBars = Math.floor(8 + progress * 30);
          const barW = (fillEnd - a) / numBars;
          for (let i = 0; i < numBars; i++) {
            const x0 = a + i * barW;
            const fv = f(x0 + barW * 0.5);
            const grad = ctx.createLinearGradient(0, toSy(fv), 0, toSy(0));
            grad.addColorStop(0, "rgba(51,165,196,0.45)");
            grad.addColorStop(1, "rgba(51,165,196,0.08)");
            ctx.fillStyle = grad;
            ctx.fillRect(toSx(x0), toSy(fv), toSx(x0 + barW) - toSx(x0) - 1, toSy(0) - toSy(fv));
          }

          // Curve
          ctx.beginPath();
          ctx.strokeStyle = "#e2e8f0";
          ctx.lineWidth = 2;
          for (let px = 0; px <= gw; px++) {
            const x = px / gw;
            const sx = toSx(x), sy = toSy(f(x));
            px === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
          }
          ctx.stroke();

          // Bounds labels
          if (progress > 0.2) {
            ctx.fillStyle = "rgba(51,165,196,0.8)";
            ctx.font = "bold 11px monospace";
            ctx.fillText("a", toSx(a) - 3, toSy(0) + 16);
            ctx.fillText("b", toSx(b) - 3, toSy(0) + 16);
            // Dashed bounds
            ctx.setLineDash([3, 4]);
            ctx.strokeStyle = "rgba(51,165,196,0.4)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(toSx(a), toSy(0));
            ctx.lineTo(toSx(a), toSy(f(a)));
            ctx.moveTo(toSx(b), toSy(0));
            ctx.lineTo(toSx(b), toSy(f(b)));
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Formula fade-in
          if (progress > 0.5) {
            const alpha = Math.min((progress - 0.5) * 3, 0.7);
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.font = "13px monospace";
            ctx.fillText("∫ f(x) dx", w - 120, 28);
          }
        },
      },
      {
        label: "→  Vector Space",
        color: "#ffdd00",
        duration: 5,
        draw: (ctx: CanvasRenderingContext2D, w: number, h: number, progress: number) => {
          const cx = w * 0.45, cy = h * 0.55;
          const unit = Math.min(w, h) * 0.22;

          // Grid
          ctx.strokeStyle = "rgba(255,255,255,0.06)";
          ctx.lineWidth = 0.6;
          for (let i = -4; i <= 4; i++) {
            ctx.beginPath();
            ctx.moveTo(cx + i * unit * 0.5, cy - 4 * unit * 0.5);
            ctx.lineTo(cx + i * unit * 0.5, cy + 4 * unit * 0.5);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx - 4 * unit * 0.5, cy + i * unit * 0.5);
            ctx.lineTo(cx + 4 * unit * 0.5, cy + i * unit * 0.5);
            ctx.stroke();
          }

          // Axes
          ctx.strokeStyle = "rgba(255,255,255,0.2)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(cx - unit * 2, cy);
          ctx.lineTo(cx + unit * 2, cy);
          ctx.moveTo(cx, cy - unit * 2);
          ctx.lineTo(cx, cy + unit * 2);
          ctx.stroke();

          // Vectors that appear one by one
          const vectors = [
            { dx: 1.5, dy: -0.8, color: "#ffdd00", label: "v₁" },
            { dx: -0.6, dy: -1.4, color: "#ff4d4d", label: "v₂" },
            { dx: 0.9, dy: 0.6, color: "#33c47a", label: "v₃" },
            { dx: -1.2, dy: 0.3, color: "#33a5c4", label: "v₄" },
            { dx: 1.0, dy: -1.6, color: "#c084fc", label: "v₅" },
          ];

          const numVisible = Math.min(Math.floor(progress * (vectors.length + 1)), vectors.length);
          const partial = (progress * (vectors.length + 1)) - Math.floor(progress * (vectors.length + 1));

          for (let i = 0; i < numVisible; i++) {
            const v = vectors[i];
            const extend = i === numVisible - 1 && numVisible <= vectors.length ? Math.min(partial * 2, 1) : 1;
            const ex = cx + v.dx * unit * extend;
            const ey = cy + v.dy * unit * extend;

            // Shaft
            ctx.beginPath();
            ctx.strokeStyle = v.color;
            ctx.lineWidth = 2.2;
            ctx.moveTo(cx, cy);
            ctx.lineTo(ex, ey);
            ctx.stroke();

            // Arrowhead
            if (extend > 0.5) {
              const ang = Math.atan2(ey - cy, ex - cx);
              ctx.beginPath();
              ctx.fillStyle = v.color;
              ctx.moveTo(ex, ey);
              ctx.lineTo(ex - 10 * Math.cos(ang - 0.35), ey - 10 * Math.sin(ang - 0.35));
              ctx.lineTo(ex - 10 * Math.cos(ang + 0.35), ey - 10 * Math.sin(ang + 0.35));
              ctx.closePath();
              ctx.fill();
            }

            // Label
            if (extend > 0.8) {
              ctx.fillStyle = v.color;
              ctx.font = "bold 11px monospace";
              ctx.fillText(v.label, ex + 6, ey - 6);
            }
          }

          // Span label
          if (progress > 0.7) {
            const alpha = Math.min((progress - 0.7) * 4, 0.6);
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.font = "12px monospace";
            ctx.fillText("span{v₁, v₂, ...} = R²", w - 200, 28);
          }
        },
      },
      {
        label: "∿  Fourier Transform",
        color: "#c084fc",
        duration: 5,
        draw: (ctx: CanvasRenderingContext2D, w: number, h: number, progress: number) => {
          const pad = 40;
          const gw = w - pad * 2;
          const midY = h * 0.32;
          const freqY = h * 0.75;

          // --- Time domain (top) ---
          ctx.fillStyle = "rgba(255,255,255,0.15)";
          ctx.font = "9px monospace";
          ctx.fillText("time domain", pad, midY - h * 0.18);

          // Axis
          ctx.strokeStyle = "rgba(255,255,255,0.12)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(pad, midY);
          ctx.lineTo(pad + gw, midY);
          ctx.stroke();

          // Composite wave — sum of 3 sinusoids, drawn progressively
          const drawEnd = progress;
          ctx.beginPath();
          ctx.strokeStyle = "#e2e8f0";
          ctx.lineWidth = 1.8;
          for (let px = 0; px <= gw * drawEnd; px += 1) {
            const x = px / gw;
            const y = midY
              + Math.sin(x * Math.PI * 4) * 22
              + Math.sin(x * Math.PI * 10) * 12
              + Math.sin(x * Math.PI * 18) * 7;
            px === 0 ? ctx.moveTo(pad + px, y) : ctx.lineTo(pad + px, y);
          }
          ctx.stroke();

          // --- Frequency domain (bottom) ---
          if (progress > 0.25) {
            ctx.fillStyle = "rgba(255,255,255,0.15)";
            ctx.font = "9px monospace";
            ctx.fillText("frequency domain", pad, freqY - h * 0.15);

            // Axis
            ctx.strokeStyle = "rgba(255,255,255,0.12)";
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(pad, freqY);
            ctx.lineTo(pad + gw, freqY);
            ctx.stroke();

            // Frequency spikes
            const freqAlpha = Math.min((progress - 0.25) * 2.5, 1);
            const spikes = [
              { freq: 0.15, amp: 0.65, color: "#c084fc" },
              { freq: 0.38, amp: 0.38, color: "#a855f7" },
              { freq: 0.65, amp: 0.2, color: "#7c3aed" },
            ];
            for (const spike of spikes) {
              const sx = pad + spike.freq * gw;
              const spikeH = spike.amp * h * 0.3 * freqAlpha;
              // Glow
              const grad = ctx.createLinearGradient(sx, freqY - spikeH, sx, freqY);
              grad.addColorStop(0, spike.color);
              grad.addColorStop(1, "transparent");
              ctx.strokeStyle = spike.color;
              ctx.lineWidth = 3;
              ctx.globalAlpha = freqAlpha * 0.9;
              ctx.beginPath();
              ctx.moveTo(sx, freqY);
              ctx.lineTo(sx, freqY - spikeH);
              ctx.stroke();
              // Dot at top
              ctx.beginPath();
              ctx.arc(sx, freqY - spikeH, 3, 0, Math.PI * 2);
              ctx.fillStyle = spike.color;
              ctx.fill();
              ctx.globalAlpha = 1;
            }

            // Freq labels
            ctx.fillStyle = "rgba(255,255,255,0.2)";
            ctx.font = "9px monospace";
            ctx.fillText("ω₁", pad + 0.15 * gw - 6, freqY + 14);
            ctx.fillText("ω₂", pad + 0.38 * gw - 6, freqY + 14);
            ctx.fillText("ω₃", pad + 0.65 * gw - 6, freqY + 14);
          }

          // Arrow between domains
          if (progress > 0.35) {
            const arrowAlpha = Math.min((progress - 0.35) * 3, 0.5);
            ctx.strokeStyle = `rgba(192,132,252,${arrowAlpha})`;
            ctx.lineWidth = 1.2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(w * 0.5, midY + 20);
            ctx.lineTo(w * 0.5, freqY - h * 0.18);
            ctx.stroke();
            ctx.setLineDash([]);
            // Arrow tip
            ctx.fillStyle = `rgba(192,132,252,${arrowAlpha})`;
            ctx.beginPath();
            ctx.moveTo(w * 0.5, freqY - h * 0.18 + 2);
            ctx.lineTo(w * 0.5 - 5, freqY - h * 0.18 - 6);
            ctx.lineTo(w * 0.5 + 5, freqY - h * 0.18 - 6);
            ctx.closePath();
            ctx.fill();
            // Label
            ctx.fillStyle = `rgba(192,132,252,${arrowAlpha})`;
            ctx.font = "10px monospace";
            ctx.fillText("FFT", w * 0.5 + 8, (midY + freqY) * 0.5);
          }
        },
      },
      {
        label: "⊕  Eigenvalues",
        color: "#f97316",
        duration: 5,
        draw: (ctx: CanvasRenderingContext2D, w: number, h: number, progress: number) => {
          const cx = w * 0.5, cy = h * 0.5;
          const unit = Math.min(w, h) * 0.18;

          // Grid that transforms
          const shear = progress * 0.6;
          ctx.strokeStyle = "rgba(255,255,255,0.05)";
          ctx.lineWidth = 0.6;
          for (let i = -5; i <= 5; i++) {
            ctx.beginPath();
            ctx.moveTo(cx + (i + (-5) * shear) * unit * 0.4, cy - 5 * unit * 0.4);
            ctx.lineTo(cx + (i + 5 * shear) * unit * 0.4, cy + 5 * unit * 0.4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx - 5 * unit * 0.4, cy + i * unit * 0.4);
            ctx.lineTo(cx + 5 * unit * 0.4, cy + i * unit * 0.4);
            ctx.stroke();
          }

          // Eigenvector 1 — doesn't change direction, only scales
          const scale1 = 1 + progress * 0.6;
          const ev1x = 1.0 * scale1, ev1y = 0.3 * scale1;
          ctx.beginPath();
          ctx.strokeStyle = "#f97316";
          ctx.lineWidth = 2.5;
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + ev1x * unit, cy - ev1y * unit);
          ctx.stroke();
          // Arrowhead
          const a1 = Math.atan2(-ev1y, ev1x);
          ctx.beginPath();
          ctx.fillStyle = "#f97316";
          ctx.moveTo(cx + ev1x * unit, cy - ev1y * unit);
          ctx.lineTo(cx + ev1x * unit - 10 * Math.cos(a1 - 0.35), cy - ev1y * unit - 10 * Math.sin(a1 - 0.35));
          ctx.lineTo(cx + ev1x * unit - 10 * Math.cos(a1 + 0.35), cy - ev1y * unit - 10 * Math.sin(a1 + 0.35));
          ctx.closePath();
          ctx.fill();

          // Eigenvector 2
          const scale2 = 1 + progress * 0.3;
          const ev2x = -0.4 * scale2, ev2y = 1.0 * scale2;
          ctx.beginPath();
          ctx.strokeStyle = "#fb923c";
          ctx.lineWidth = 2.5;
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + ev2x * unit, cy - ev2y * unit);
          ctx.stroke();
          const a2 = Math.atan2(-ev2y, ev2x);
          ctx.beginPath();
          ctx.fillStyle = "#fb923c";
          ctx.moveTo(cx + ev2x * unit, cy - ev2y * unit);
          ctx.lineTo(cx + ev2x * unit - 10 * Math.cos(a2 - 0.35), cy - ev2y * unit - 10 * Math.sin(a2 - 0.35));
          ctx.lineTo(cx + ev2x * unit - 10 * Math.cos(a2 + 0.35), cy - ev2y * unit - 10 * Math.sin(a2 + 0.35));
          ctx.closePath();
          ctx.fill();

          // Labels
          if (progress > 0.3) {
            const alpha = Math.min((progress - 0.3) * 3, 0.8);
            ctx.fillStyle = `rgba(249,115,22,${alpha})`;
            ctx.font = "bold 11px monospace";
            ctx.fillText("λ₁", cx + ev1x * unit + 8, cy - ev1y * unit - 4);
            ctx.fillStyle = `rgba(251,146,60,${alpha})`;
            ctx.fillText("λ₂", cx + ev2x * unit + 8, cy - ev2y * unit - 4);
          }

          // Matrix notation
          if (progress > 0.5) {
            const alpha = Math.min((progress - 0.5) * 3, 0.55);
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.font = "12px monospace";
            ctx.fillText("Av = λv", w - 110, 28);
          }

          // Origin dot
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.fill();
        },
      },
    ];

    // Transition config
    const sceneDuration = 4.5; // seconds per scene (at ~60fps)
    const fadeTime = 0.8; // seconds for crossfade
    const totalCycle = scenes.length * sceneDuration;

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#08080e";
      ctx.fillRect(0, 0, w, h);

      t += 1 / 60;
      const cycleT = t % totalCycle;
      const sceneIdx = Math.floor(cycleT / sceneDuration) % scenes.length;
      const sceneT = (cycleT % sceneDuration) / sceneDuration; // 0→1 progress within scene
      const scene = scenes[sceneIdx];

      // Fade in/out
      let alpha = 1;
      const fadeFrac = fadeTime / (sceneDuration);
      if (sceneT < fadeFrac) alpha = sceneT / fadeFrac;
      if (sceneT > 1 - fadeFrac) alpha = (1 - sceneT) / fadeFrac;
      alpha = Math.max(0, Math.min(1, alpha));

      // Ease the scene progress (excluding fade time)
      const contentStart = fadeFrac;
      const contentEnd = 1 - fadeFrac;
      const contentProgress = Math.max(0, Math.min(1, (sceneT - contentStart) / (contentEnd - contentStart)));

      ctx.save();
      ctx.globalAlpha = alpha;
      scene.draw(ctx, w, h, contentProgress);
      ctx.restore();

      // Scene label (top-left)
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = scene.color;
      ctx.font = "bold 11px monospace";
      ctx.fillText(scene.label, 16, 22);
      ctx.globalAlpha = 1;

      // Progress dots (bottom-center)
      const dotY = h - 16;
      const dotSpacing = 14;
      const dotsX = w * 0.5 - ((scenes.length - 1) * dotSpacing) / 2;
      for (let i = 0; i < scenes.length; i++) {
        ctx.beginPath();
        ctx.arc(dotsX + i * dotSpacing, dotY, i === sceneIdx ? 3.5 : 2, 0, Math.PI * 2);
        ctx.fillStyle = i === sceneIdx ? scene.color : "rgba(255,255,255,0.15)";
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

// ── Interactive graphic: Linear Transformation ──

// ── Scroll-triggered fade-up animation ──
function FadeUp({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(28px)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Scroll-driven diagonal grid background ──
function DiagonalGrid() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const offset = window.scrollY * 0.25;
      el.style.backgroundPosition = `${offset}px ${offset}px`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(51,165,196,0.045) 0px, rgba(51,165,196,0.045) 1px, transparent 1px, transparent 52px)",
        backgroundSize: "52px 52px",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

// ── Step Card with mouse-tracked tilt ──
function StepCard({ step, title, description }: { step: string; title: string; description: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: -dy * 10, y: dx * 10 });
  };

  const onMouseLeave = () => {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        padding: "18px",
        background: hovered ? "rgba(51,165,196,0.04)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${hovered ? "rgba(51,165,196,0.2)" : "rgba(255,255,255,0.06)"}`,
        borderRadius: "12px",
        position: "relative",
        transform: hovered
          ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(40px)`
          : "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)",
        boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.35), 0 0 16px rgba(51,165,196,0.06)" : "none",
        transition: hovered
          ? "border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease"
          : "transform 0.45s cubic-bezier(0.16,1,0.3,1), border-color 0.2s ease, background 0.2s ease, box-shadow 0.3s ease",
        cursor: "default",
        willChange: "transform",
      }}
    >
      <div style={{
        fontSize: "2.5rem", fontWeight: 900,
        color: hovered ? "rgba(51,165,196,0.75)" : "rgba(51,165,196,0.18)",
        fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "-2px", lineHeight: 1,
        marginBottom: "15px",
        textShadow: hovered ? "0 0 10px rgba(51,165,196,0.25)" : "none",
        transition: "color 0.3s ease, text-shadow 0.3s ease",
      }}>
        {step}
      </div>
      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ffffff", marginBottom: "12px", letterSpacing: "-0.3px" }}>{title}</h3>
      <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.7 }}>{description}</p>
    </div>
  );
}

// ── Main Page ──
export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [hoveredCap, setHoveredCap] = useState<string | null>(null);

  useEffect(() => {
    setLoaded(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      time += 0.003;

      ctx.lineWidth = 0.5;
      const spacing = 60;
      const offset = (time * 30) % spacing;

      ctx.strokeStyle = "rgba(100, 180, 220, 0.08)";
      for (let i = -h; i < w + h; i += spacing) {
        ctx.beginPath();
        ctx.moveTo(i + offset, 0);
        ctx.lineTo(i + offset - h * 0.7, h);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(160, 160, 160, 0.06)";
      for (let i = -h; i < w + h; i += spacing) {
        ctx.beginPath();
        ctx.moveTo(i - offset, 0);
        ctx.lineTo(i - offset + h * 0.7, h);
        ctx.stroke();
      }

      ctx.lineWidth = 1.5;

      ctx.strokeStyle = "rgba(180, 80, 70, 0.25)";
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = h * 0.3 + Math.sin((x / w) * 4 + time * 2) * 180 +
          Math.cos((x / w) * 2.5 + time) * 100;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = "rgba(51, 165, 196, 0.2)";
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = h * 0.7 + Math.sin((x / w) * 3 - time * 1.5) * 150 +
          Math.cos((x / w) * 5 + time * 0.5) * 80;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = "rgba(220, 160, 50, 0.15)";
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = h * 0.5 + Math.sin((x / w) * 6 + time * 3) * 120 +
          Math.sin((x / w) * 1.5 - time * 2) * 200;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      const dotColors = ["rgba(51, 165, 196, 0.4)", "rgba(100, 180, 220, 0.3)", "rgba(255, 255, 255, 0.2)"];
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 4; col++) {
          const dx = w - 80 + col * 14;
          const dy = 30 + row * 14;
          const pulse = Math.sin(time * 3 + row * 0.5 + col * 0.7) * 0.5 + 0.5;
          ctx.fillStyle = dotColors[(row + col) % dotColors.length];
          ctx.globalAlpha = 0.3 + pulse * 0.4;
          ctx.beginPath();
          ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);


  const capabilities = [
    {
      icon: "⊹",
      title: "AI-Generated Animations",
      description: "Describe any math concept in plain language and get a fully animated visual explanation generated instantly.",
    },
    {
      icon: "◈",
      title: "Interactive Graphing",
      description: "Powered by Desmos — plot equations, curves, parametric forms, and geometric constructions with live interaction.",
    },
    {
      icon: "⋯",
      title: "Dynamic Proofs",
      description: "Watch mathematical proofs unfold step-by-step with narrated walkthroughs and annotated derivations.",
    },
    {
      icon: "⊞",
      title: "Multi-Domain Coverage",
      description: "Spans vectors, calculus, linear algebra, probability, geometry, and more — all in one unified tool.",
    },
    {
      icon: "⇅",
      title: "Adjustable Complexity",
      description: "Dial in the explanation depth from high school fundamentals to advanced late-undergrad formalism.",
    },
    {
      icon: "↗",
      title: "Export Ready",
      description: "Export your visualizations as MP4, WebM, or GIF to share, embed, or include in presentations.",
    },
  ];

  const howToSteps = [
    {
      step: "01",
      title: "Type a Prompt",
      description: "Describe any math concept in plain English — e.g. \"Show me the epsilon-delta definition of a limit\" or \"Visualize eigenvalue decomposition.\"",
    },
    {
      step: "02",
      title: "Pick a Style",
      description: "Choose between an animated proof walkthrough, an interactive graph, or a step-by-step derivation. Set the complexity level to match your background.",
    },
    {
      step: "03",
      title: "Interact & Explore",
      description: "Drag sliders, rotate 3D views, and scrub through animations. Every visual is live — adjust parameters and watch the math update in real time.",
    },
  ];

  const galleryItems = [
    {
      label: "Delta-Epsilon Proof",
      tag: "Real Analysis",
      description: "Watch ε and δ shrink together",
      graphic: <DeltaEpsilonCanvas />,
    },
    {
      label: "Vector Fields",
      tag: "Linear Algebra",
      description: "Drag to rotate the 3D view",
      graphic: <GridCanvas />,
    },
    {
      label: "Probability Distributions",
      tag: "Statistics",
      description: "Hover to shift the mean",
      graphic: <BellCanvas />,
    },
  ];

  return (
    <div
      style={{
        backgroundColor: "#0a0a0f",
        fontFamily: "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif",
        overflowX: "hidden",
      }}
    >
      {/* ── Hero Section ── */}
      <div
        style={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}
        />
        <div
          style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)",
            zIndex: 1, pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative", zIndex: 2, width: "100%", height: "100%",
            display: "flex", flexDirection: "column",
          }}
        >
          <header
            style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "flex-start", padding: "28px 40px",
            }}
          >
            <Link
              href="/"
              style={{
                display: "flex", alignItems: "center", gap: "10px", textDecoration: "none",
                opacity: loaded ? 1 : 0,
                transform: loaded ? "translateY(0)" : "translateY(-10px)",
                transition: "all 0.6s ease 0.2s",
              }}
            >
              <img src="/logo.webp" alt="Mathphic" style={{ height: "28px", width: "auto" }} />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "3px", color: "#e2e8f0", textTransform: "uppercase" }}>MATHPHIC</span>
            </Link>
          </header>

          <main
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              justifyContent: "center", alignItems: "center", paddingBottom: "80px",
            }}
          >
<h1
              style={{
                fontSize: "clamp(3rem, 8vw, 6rem)", fontWeight: 900, color: "#ffffff",
                letterSpacing: "-2px", marginBottom: "16px", textAlign: "center", lineHeight: 1,
                opacity: loaded ? 1 : 0,
                transform: loaded ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
                transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
              }}
            >
              Mathphic
            </h1>
            <p
              style={{
                fontSize: "clamp(0.9rem, 2vw, 1.15rem)", color: "rgba(255,255,255,0.5)",
                letterSpacing: "1px", marginBottom: "40px", textAlign: "center",
                fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
                opacity: loaded ? 1 : 0,
                transform: loaded ? "translateY(0)" : "translateY(15px)",
                transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s",
              }}
            >
              Vectors · Calculus · Probability · Linear Algebra
            </p>
            <div
              style={{
                display: "flex", gap: "16px",
                opacity: loaded ? 1 : 0,
                transform: loaded ? "translateY(0)" : "translateY(15px)",
                transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.7s",
              }}
            >
              <a href="#capabilities" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    padding: "14px 32px", fontSize: "0.95rem", fontWeight: 600,
                    border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px",
                    background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)",
                    color: "#e2e8f0", cursor: "pointer", transition: "all 0.3s ease", letterSpacing: "0.5px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  }}
                >
                  Learn More
                </button>
              </a>
              <Link href="/app" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    padding: "14px 32px", fontSize: "0.95rem", fontWeight: 700,
                    border: "none", borderRadius: "8px",
                    background: "linear-gradient(135deg, #33a5c4, #0ea5e9)",
                    color: "#000", cursor: "pointer", transition: "all 0.3s ease",
                    letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px",
                    boxShadow: "0 0 30px rgba(51, 165, 196, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 40px rgba(51, 165, 196, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 0 30px rgba(51, 165, 196, 0.3)";
                  }}
                >
                  Explore <span style={{ fontSize: "1.1rem" }}>→</span>
                </button>
              </Link>
            </div>
          </main>

          <div
            style={{
              position: "absolute", bottom: "32px", left: "50%",
              transform: "translateX(-50%)", display: "flex", flexDirection: "column",
              alignItems: "center", gap: "6px",
              opacity: loaded ? 0.5 : 0, transition: "opacity 1s ease 1.2s",
              animation: "float 2.5s ease-in-out infinite",
            }}
          >
            <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "var(--font-geist-mono), monospace" }}>
              Scroll Down
            </span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(51,165,196,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Capabilities Section ── */}
      <section
        id="capabilities"
        style={{
          padding: "72px 80px",
          background: "linear-gradient(180deg, #0a0a0f 0%, #0d0d14 100%)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <DiagonalGrid />
        <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <FadeUp>
            <p style={{ fontSize: "0.7rem", letterSpacing: "4px", color: "#33a5c4", textTransform: "uppercase", marginBottom: "16px", fontFamily: "var(--font-geist-mono), monospace" }}>
              System Capabilities
            </p>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: "#ffffff", letterSpacing: "-1px", marginBottom: "16px", lineHeight: 1.1 }}>
              Everything you need to understand math
            </h2>
            <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.45)", marginBottom: "40px", maxWidth: "520px", lineHeight: 1.7 }}>
              Mathphic combines an AI script engine with a powerful graphing layer to generate explanations that are visual, accurate, and level-appropriate.
            </p>
          </FadeUp>

          <FadeUp delay={150}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", overflow: "hidden" }}>
            {capabilities.map((cap) => {
              const isHovered = hoveredCap === cap.title;
              return (
                <div
                  key={cap.title}
                  onMouseEnter={() => setHoveredCap(cap.title)}
                  onMouseLeave={() => setHoveredCap(null)}
                  style={{
                    padding: "28px 24px",
                    background: "#0d0d14",
                  }}
                >
                  <div style={{
                    width: "28px", height: "28px", marginBottom: "16px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "6px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.9rem",
                    color: isHovered ? "#33a5c4" : "rgba(255,255,255,0.5)",
                    boxShadow: isHovered ? "0 0 28px rgba(51,165,196,0.7), inset 0 0 16px rgba(51,165,196,0.2)" : "none",
                    transition: "color 0.25s ease, box-shadow 0.25s ease",
                  }}>
                    {cap.icon}
                  </div>
                  <h3 style={{
                    fontSize: "0.9rem", fontWeight: 700,
                    color: isHovered ? "#ffffff" : "#e2e8f0",
                    marginBottom: "8px", letterSpacing: "-0.2px",
                    textShadow: isHovered ? "0 0 24px rgba(255,255,255,0.6)" : "none",
                    transition: "text-shadow 0.25s ease, color 0.25s ease",
                  }}>{cap.title}</h3>
                  <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.65 }}>{cap.description}</p>
                </div>
              );
            })}
          </div>
          </FadeUp>
        </div>
      </section>

      {/* ── How to Use ── */}
      <section
        style={{
          padding: "72px 80px",
          background: "#0d0d14",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <FadeUp>
            <p style={{ fontSize: "0.7rem", letterSpacing: "4px", color: "#33a5c4", textTransform: "uppercase", marginBottom: "12px", fontFamily: "var(--font-geist-mono), monospace" }}>
              How to Use
            </p>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: "#ffffff", letterSpacing: "-1px", marginBottom: "12px", lineHeight: 1.1 }}>
              Up and running in seconds
            </h2>
            <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.45)", marginBottom: "15px", maxWidth: "520px", lineHeight: 1.7 }}>
              No setup. No configuration. Just describe what you want to understand and Mathphic handles the rest.
            </p>
          </FadeUp>

          {/* Sequence graphic strip */}
          <FadeUp delay={100}>
            <div style={{
              width: "100%", height: "210px", marginBottom: "20px",
              background: "#08080e",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "12px", overflow: "hidden",
              position: "relative",
            }}>
              <SequenceCanvas />
            </div>
          </FadeUp>

          <FadeUp delay={200}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
              {howToSteps.map((s) => (
                <StepCard key={s.step} step={s.step} title={s.title} description={s.description} />
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── See What's Possible ── */}
      <section
        style={{
          padding: "72px 80px",
          background: "linear-gradient(180deg, #0d0d14 0%, #0a0a0f 100%)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <FadeUp>
            <p style={{ fontSize: "0.7rem", letterSpacing: "4px", color: "#33a5c4", textTransform: "uppercase", marginBottom: "16px", fontFamily: "var(--font-geist-mono), monospace" }}>
              Gallery
            </p>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: "#ffffff", letterSpacing: "-1px", marginBottom: "36px", lineHeight: 1.1 }}>
              See what&apos;s possible.
            </h2>
          </FadeUp>

          {/* 2-up top row + full-width bottom */}
          <FadeUp delay={100}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "380px 260px", gap: "16px" }}>
            {galleryItems.map((item, i) => (
              <div
                key={item.label}
                style={{
                  gridColumn: i === 2 ? "1 / -1" : undefined,
                  position: "relative",
                  background: "#08080e",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  transition: "border-color 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(51,165,196,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                }}
              >
                {/* Canvas fills box */}
                <div style={{ position: "absolute", inset: 0 }}>
                  {item.graphic}
                </div>

                {/* Overlay label */}
                <div
                  style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    padding: "20px 24px",
                    background: "linear-gradient(0deg, rgba(8,8,14,0.9) 0%, transparent 100%)",
                    display: "flex", justifyContent: "space-between", alignItems: "flex-end",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.65rem", letterSpacing: "2px", color: "#33a5c4", textTransform: "uppercase", fontFamily: "var(--font-geist-mono), monospace", marginBottom: "4px" }}>
                      {item.tag}
                    </div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#e2e8f0" }}>
                      {item.label}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-geist-mono), monospace", fontStyle: "italic" }}>
                    {item.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
          </FadeUp>

          {/* CTA */}
          <FadeUp delay={150}>
          <div
            style={{
              marginTop: "36px", display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: "32px", padding: "32px 40px",
              background: "rgba(51,165,196,0.04)", border: "1px solid rgba(51,165,196,0.12)",
              borderRadius: "16px",
            }}
          >
            <div>
              <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px", marginBottom: "6px" }}>
                Ready to visualize?
              </h3>
              <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>
                Type a prompt. Get <span style={{ color: "#33a5c4", fontWeight: 600 }}>AI-generated math animations</span> in seconds.
              </p>
            </div>
            <Link href="/app" style={{ textDecoration: "none", flexShrink: 0 }}>
              <button
                style={{
                  padding: "14px 32px", fontSize: "1rem", fontWeight: 700, border: "none",
                  borderRadius: "8px", background: "linear-gradient(135deg, #33a5c4, #0ea5e9)",
                  color: "#000", cursor: "pointer", transition: "all 0.3s ease",
                  letterSpacing: "0.5px", boxShadow: "0 0 30px rgba(51,165,196,0.3)", whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 40px rgba(51,165,196,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(51,165,196,0.3)";
                }}
              >
                Open Mathphic →
              </button>
            </Link>
          </div>
          </FadeUp>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "24px 80px", borderTop: "1px solid rgba(255,255,255,0.04)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "3px", color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }}>MATHPHIC</span>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <Link href="/app" style={{
            fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", textDecoration: "none",
            fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.5px",
            transition: "color 0.2s ease",
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#33a5c4"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.35)"; }}
          >
            Open App →
          </Link>
          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.12)", fontFamily: "var(--font-geist-mono), monospace" }}>Math made visible.</span>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
      `}</style>
    </div>
  );
}
