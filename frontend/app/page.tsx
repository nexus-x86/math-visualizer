"use client";

import { useEffect, useRef, useState } from "react";
import { DesmosController } from "../lib/DesmosController";
import { CanvasController } from "../lib/CanvasController";
import { ScriptParser } from "../lib/ScriptParser";
import CommandPrompt from "../components/CommandPrompt";

export default function UnifiedHome() {
  const calculatorRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const desmosRef = useRef<DesmosController | null>(null);
  const canvasControllerRef = useRef<CanvasController | null>(null);

  const [activeView, setActiveView] = useState<'desmos' | 'equations'>('desmos');
  const [isRunning, setIsRunning] = useState(false);
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

  const [scriptText, setScriptText] = useState("");

  const handleCommandSubmit = async (prompt: string) => {
    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: prompt })
      });
      const data = await response.json();
      if (data.script) {
        setScriptText(data.script);
      }
    } catch (e) {
      console.error("Failed to fetch script:", e);
      setScriptText(`// Error generating script\n// ${e}`);
    }
  };

  const handleStopScript = () => {
    if (parserRef.current) parserRef.current.stop();
    if (desmosRef.current) desmosRef.current.cancelAllAnimations();
    if (canvasControllerRef.current) canvasControllerRef.current.cancelAllAnimations();
    setIsRunning(false);
  };

  const parseAndExecuteScript = async () => {
    if (!desmosRef.current || !canvasControllerRef.current) return;

    // 1. Immediately kill any currently running script engines or audio
    if (parserRef.current) {
      parserRef.current.stop();
    }

    setIsRunning(true);

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
    await parser.parseAndExecute(scriptText);

    if (parserRef.current === parser && !parser.isStopped) {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', margin: 0, padding: 0, fontFamily: 'monospace', overflow: 'hidden', backgroundColor: '#000' }}>

      {/* Sidebar */}
      <div style={{
        width: '400px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '16px',
        boxSizing: 'border-box',
        background: 'rgba(30, 30, 30, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}>
        <h1 style={{ fontSize: '1.2rem', margin: '0 0 16px 0', color: '#14b8a6', fontWeight: 'bold' }}>Unified Engine</h1>
        <textarea
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
          wrap="off"
          placeholder="Insert something to generate the script..."
          style={{
            flex: 1,
            width: '100%',
            resize: 'none',
            fontFamily: 'monospace',
            padding: '12px',
            boxSizing: 'border-box',
            marginBottom: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.3s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = 'rgba(20, 184, 166, 0.5)'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
          spellCheck={false}
        />
        <button
          onClick={isRunning ? handleStopScript : parseAndExecuteScript}
          style={{
            padding: '12px',
            cursor: 'pointer',
            fontSize: '1rem',
            backgroundColor: isRunning ? '#ef4444' : '#14b8a6', // Red when running
            color: isRunning ? 'white' : 'black',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            transition: 'background-color 0.3s ease, opacity 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          {isRunning ? "Stop Script" : "Run Script"}
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

        <CommandPrompt onSubmit={handleCommandSubmit} />

      </div>

    </div>
  );
}
