"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  // Animated math background
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

      // Grid lines — subtle diagonal crosses
      ctx.lineWidth = 0.5;
      const spacing = 60;
      const offset = (time * 30) % spacing;

      // Diagonal lines (top-left to bottom-right)
      ctx.strokeStyle = "rgba(100, 180, 220, 0.08)";
      for (let i = -h; i < w + h; i += spacing) {
        ctx.beginPath();
        ctx.moveTo(i + offset, 0);
        ctx.lineTo(i + offset - h * 0.7, h);
        ctx.stroke();
      }

      // Diagonal lines (top-right to bottom-left)
      ctx.strokeStyle = "rgba(160, 160, 160, 0.06)";
      for (let i = -h; i < w + h; i += spacing) {
        ctx.beginPath();
        ctx.moveTo(i - offset, 0);
        ctx.lineTo(i - offset + h * 0.7, h);
        ctx.stroke();
      }

      // Flowing curves
      ctx.lineWidth = 1.5;

      // Curve 1 — reddish/warm
      ctx.strokeStyle = "rgba(180, 80, 70, 0.25)";
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = h * 0.3 + Math.sin((x / w) * 4 + time * 2) * 180 +
          Math.cos((x / w) * 2.5 + time) * 100;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Curve 2 — teal
      ctx.strokeStyle = "rgba(20, 184, 166, 0.2)";
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = h * 0.7 + Math.sin((x / w) * 3 - time * 1.5) * 150 +
          Math.cos((x / w) * 5 + time * 0.5) * 80;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Curve 3 — orange/yellow
      ctx.strokeStyle = "rgba(220, 160, 50, 0.15)";
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = h * 0.5 + Math.sin((x / w) * 6 + time * 3) * 120 +
          Math.sin((x / w) * 1.5 - time * 2) * 200;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Floating dot clusters (top-right)
      const dotColors = ["rgba(20, 184, 166, 0.4)", "rgba(100, 180, 220, 0.3)", "rgba(255, 255, 255, 0.2)"];
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

  // Mini graph loading animation state
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let t = 0;
    let animId: number;

    const drawMini = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      t += 0.02;

      // Axes
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, h - 20);
      ctx.lineTo(w - 10, h - 20);
      ctx.moveTo(20, h - 20);
      ctx.lineTo(20, 10);
      ctx.stroke();

      // Animated sine-ish curve
      const progress = Math.min(t % 3, 1);
      ctx.strokeStyle = "#14b8a6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      const curveW = (w - 40) * progress;
      for (let x = 0; x <= curveW; x += 1) {
        const normX = x / (w - 40);
        const y = (h - 30) - (Math.sin(normX * Math.PI * 2.5) * 0.3 + 0.5) * (h - 40);
        x === 0 ? ctx.moveTo(20 + x, y) : ctx.lineTo(20 + x, y);
      }
      ctx.stroke();

      animId = requestAnimationFrame(drawMini);
    };
    drawMini();

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#0a0a0f",
        fontFamily: "'Inter', 'Geist', system-ui, sans-serif",
      }}
    >
      {/* Animated background canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

      {/* Vignette overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Content layer */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top bar */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "28px 40px",
          }}
        >
          {/* Logo */}
          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              letterSpacing: "3px",
              color: "#e2e8f0",
              textTransform: "uppercase",
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(-10px)",
              transition: "all 0.6s ease 0.2s",
            }}
          >
            MATHVIZ
          </div>

          {/* Mini graph loading animation */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(-10px)",
              transition: "all 0.6s ease 0.4s",
            }}
          >
            <canvas
              ref={miniCanvasRef}
              width={120}
              height={70}
              style={{
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.3)",
              }}
            />
            <span
              style={{
                fontSize: "0.65rem",
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "2px",
                textTransform: "uppercase",
                fontFamily: "monospace",
              }}
            >
              loading...
            </span>
          </div>
        </header>

        {/* Center hero */}
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            paddingBottom: "80px",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(3rem, 8vw, 6rem)",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-2px",
              marginBottom: "16px",
              textAlign: "center",
              lineHeight: 1,
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
              transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
            }}
          >
            Math Visualizer
          </h1>

          <p
            style={{
              fontSize: "clamp(0.9rem, 2vw, 1.15rem)",
              color: "rgba(255, 255, 255, 0.5)",
              letterSpacing: "1px",
              marginBottom: "40px",
              textAlign: "center",
              fontFamily: "'Geist Mono', monospace",
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(15px)",
              transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s",
            }}
          >
            Vectors · Calculus · Probability · Linear Algebra
          </p>

          <div
            style={{
              display: "flex",
              gap: "16px",
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(15px)",
              transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.7s",
            }}
          >
            <button
              style={{
                padding: "14px 32px",
                fontSize: "0.95rem",
                fontWeight: 600,
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(8px)",
                color: "#e2e8f0",
                cursor: "pointer",
                transition: "all 0.3s ease",
                letterSpacing: "0.5px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }}
            >
              Learn More
            </button>

            <Link href="/app" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "14px 32px",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #14b8a6, #0ea5e9)",
                  color: "#000",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  letterSpacing: "0.5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 0 30px rgba(20, 184, 166, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 40px rgba(20, 184, 166, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(20, 184, 166, 0.3)";
                }}
              >
                Explore
                <span style={{ fontSize: "1.1rem" }}>→</span>
              </button>
            </Link>
          </div>
        </main>

        {/* Swipe Down indicator */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            opacity: loaded ? 0.5 : 0,
            transition: "opacity 1s ease 1.2s",
            animation: "float 2.5s ease-in-out infinite",
          }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "2px",
              textTransform: "uppercase",
              fontFamily: "monospace",
            }}
          >
            Swipe Down
          </span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(20, 184, 166, 0.6)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }
      `}</style>
    </div>
  );
}
