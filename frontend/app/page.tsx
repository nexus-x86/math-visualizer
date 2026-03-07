"use client";

import { useEffect, useRef, useState } from "react";
import { DesmosController } from "../lib/DesmosController";
import { CanvasController } from "../lib/CanvasController";
import { ScriptParser } from "../lib/ScriptParser";

export default function UnifiedHome() {
  const calculatorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const desmosRef = useRef<DesmosController | null>(null);
  const canvasControllerRef = useRef<CanvasController | null>(null);

  const [activeView, setActiveView] = useState<'desmos' | 'equations'>('desmos');
  const parserRef = useRef<ScriptParser | null>(null);

  // Initialize Desmos
  useEffect(() => {
    let initialized = false;
    const initDesmos = () => {
      if (calculatorRef.current && !desmosRef.current && typeof window !== "undefined" && (window as any).Desmos) {
        desmosRef.current = new DesmosController(calculatorRef.current);
        initialized = true;
      } else if (!desmosRef.current) {
        setTimeout(initDesmos, 100);
      }
    };
    initDesmos();

    return () => {
      if (desmosRef.current) {
        desmosRef.current.destroy();
        desmosRef.current = null;
      }
    };
  }, []);

  // Initialize Canvas
  useEffect(() => {
    if (canvasRef.current && !canvasControllerRef.current) {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvasRef.current.parentElement!.getBoundingClientRect();
      canvasRef.current.width = rect.width * dpr;
      canvasRef.current.height = rect.height * dpr;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        canvasControllerRef.current = new CanvasController(canvasRef.current);
      }
    }

    const handleResize = () => {
      if (canvasRef.current && canvasControllerRef.current) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvasRef.current.parentElement!.getBoundingClientRect();
        canvasRef.current.width = rect.width * dpr;
        canvasRef.current.height = rect.height * dpr;
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
          canvasControllerRef.current.draw();
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (canvasControllerRef.current) {
        canvasControllerRef.current.destroy();
        canvasControllerRef.current = null;
      }
    };
  }, []);

  // Re-size canvas when switching to equations view
  useEffect(() => {
    if (activeView === 'equations' && canvasRef.current && canvasControllerRef.current) {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvasRef.current.parentElement!.getBoundingClientRect();
      canvasRef.current.width = rect.width * dpr;
      canvasRef.current.height = rect.height * dpr;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        canvasControllerRef.current.draw();
      }
    }
  }, [activeView]);

  const [scriptText, setScriptText] = useState(
    `resetViewport

say "Welcome to the Desp Engine. Let's start with a simple coordinate in Desmos."
switchView "desmos"
zoomToPoint 0 0 10
plotCoordinate "dot" -4 -2 "#58C4DD"
wait 1000

say "Now, we can animate it across the screen using a parametric slider."
animateCoordinate "dot" "(c, c/2)" "c" -4 4 "#58C4DD" 3000
wait 3500

say "We can also draw sweeping boundaries using dotted lines."
animateDottedEquation "bound" "x=a" "a" -5 5 "#FFFF00" 4000
wait 4500

say "And, of course, morphing equations physically on the graph."
animateEquationMorph "sq" "y=1" "y=0.2x^2" "h" "#83C167" 3000
wait 3500

say "But the real magic happens when we switch over to the Equation Canvas."
switchView "equations"
wait 500

say "Here, we render pure MathJax SVG shapes..."
renderEquation "eq1" "f(x) = \\int_{0}^{2} x^3 \\, dx" "#FC6255"
wait 2000

say "And use a visual difference engine to seamlessly transform them."
transformEquation "eq1" "f(x) = \\left[ \\frac{x^4}{4} \\right]_{0}^{2}" 2000 "#9A72AC"
wait 2500

say "It detects matching characters, interpolates their positions, fades out old ones, and fades in new ones."
transformEquation "eq1" "f(x) = \\frac{2^4}{4} - \\frac{0^4}{4}" 2500 "#29ABCA"
wait 3000

say "Allowing for beautiful, Manim-style continuous derivations."
transformEquation "eq1" "f(x) = \\frac{16}{4}" 1500 "#FF862F"
wait 2000

transformEquation "eq1" "f(x) = 4" 1000 "#83C167"
wait 2000

say "That concludes the engine demonstration!"`
  );

  const parseAndExecuteScript = () => {
    if (!desmosRef.current || !canvasControllerRef.current) return;

    // 1. Immediately kill any currently running script engines or audio
    if (parserRef.current) {
      parserRef.current.stop();
    }

    // 2. Hardware reset both visuals instantly
    setActiveView('desmos');
    desmosRef.current.resetViewport();
    if (canvasControllerRef.current.resetViewport) canvasControllerRef.current.resetViewport();

    // 3. Create a fresh unified parser for the new run
    const parser = ScriptParser.createUnifiedParser(
      desmosRef.current,
      canvasControllerRef.current,
      (viewName) => setActiveView(viewName as 'desmos' | 'equations')
    );

    parserRef.current = parser;
    parser.parseAndExecute(scriptText);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', margin: 0, padding: 0, fontFamily: 'monospace', overflow: 'hidden', backgroundColor: '#000' }}>

      {/* Sidebar */}
      <div style={{ width: '400px', zIndex: 10, display: 'flex', flexDirection: 'column', borderRight: '1px solid #333', padding: '10px', boxSizing: 'border-box', backgroundColor: '#1e1e1e' }}>
        <h1 style={{ fontSize: '1.2rem', margin: '0 0 10px 0', color: '#fff' }}>Unified Engine</h1>
        <textarea
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
          wrap="off"
          style={{ flex: 1, width: '100%', resize: 'none', fontFamily: 'monospace', padding: '8px', boxSizing: 'border-box', marginBottom: '10px', border: '1px solid #444', backgroundColor: '#2d2d2d', color: '#fff', fontSize: '14px' }}
          spellCheck={false}
        />
        <button onClick={parseAndExecuteScript} style={{ padding: '12px', cursor: 'pointer', fontSize: '1rem', backgroundColor: '#14b8a6', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
          Run Script
        </button>
      </div>

      {/* Unified Graph Fill Content */}
      <div style={{ flex: 1, height: '100vh', position: 'relative' }}>

        {/* Layer 1: Desmos Calculator */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            opacity: activeView === 'desmos' ? 1 : 0,
            pointerEvents: activeView === 'desmos' ? 'auto' : 'none',
            transition: 'opacity 0.6s ease-in-out',
            zIndex: 1
          }}
        >
          <div ref={calculatorRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Layer 2: Equation Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100%', height: '100%',
            opacity: activeView === 'equations' ? 1 : 0,
            pointerEvents: activeView === 'equations' ? 'auto' : 'none',
            transition: 'opacity 0.6s ease-in-out',
            zIndex: 2,
            backgroundColor: 'transparent' // Let the black background peek through
          }}
        />

      </div>

    </div>
  );
}
