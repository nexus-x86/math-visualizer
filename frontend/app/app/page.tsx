"use client";

import { useEffect, useRef, useState } from "react";
import { DesmosController } from "../../lib/DesmosController";
import { CanvasController } from "../../lib/CanvasController";
import { ScriptParser } from "../../lib/ScriptParser";
import Sidebar from "../../components/Sidebar";
import PromptBar from "../../components/PromptBar";

function LoadingCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        let progress = 0;

        const draw = () => {
            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            const pad = { left: 40, right: 16, top: 16, bottom: 28 };
            const graphW = w - pad.left - pad.right;
            const graphH = h - pad.top - pad.bottom;

            // Axes
            ctx.strokeStyle = "rgba(255,255,255,0.18)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pad.left, pad.top);
            ctx.lineTo(pad.left, pad.top + graphH);
            ctx.lineTo(pad.left + graphW, pad.top + graphH);
            ctx.stroke();

            // Horizontal asymptote y = 1
            ctx.strokeStyle = "rgba(255,221,0,0.55)";
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(pad.left, pad.top + 4);
            ctx.lineTo(pad.left + graphW, pad.top + 4);
            ctx.stroke();
            ctx.setLineDash([]);

            // Asymptote label
            ctx.fillStyle = "rgba(255,221,0,0.65)";
            ctx.font = "10px monospace";
            ctx.textAlign = "right";
            ctx.fillText("y=1", pad.left - 6, pad.top + 8);
            ctx.textAlign = "left";

            // Origin label
            ctx.fillStyle = "rgba(255,255,255,0.25)";
            ctx.font = "9px monospace";
            ctx.fillText("0", pad.left - 8, pad.top + graphH + 2);

            // Animate curve: y = 1 - e^(-5x) + damped wiggles
            progress = (progress + 0.007) % 1.25;
            const curveProgress = Math.min(progress, 1);
            const steps = Math.floor(curveProgress * graphW);

            ctx.strokeStyle = "#33a5c4";
            ctx.lineWidth = 2;
            ctx.lineJoin = "round";
            ctx.beginPath();
            for (let px = 0; px <= steps; px++) {
                const xNorm = px / graphW;
                const asymptote = 1 - Math.exp(-5 * xNorm);
                const wiggle = Math.exp(-10 * xNorm) * (
                    0.18 * Math.sin(xNorm * Math.PI * 9) +
                    0.08 * Math.sin(xNorm * Math.PI * 19) +
                    0.04 * Math.sin(xNorm * Math.PI * 35)
                );
                const yVal = Math.max(0, Math.min(1, asymptote + wiggle));
                const sx = pad.left + px;
                const sy = pad.top + 4 + (1 - yVal) * (graphH - 4);
                px === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
            }
            ctx.stroke();

            // Glow dot at curve tip
            if (steps > 0) {
                const tipXNorm = steps / graphW;
                const tipAsymptote = 1 - Math.exp(-5 * tipXNorm);
                const tipWiggle = Math.exp(-4 * tipXNorm) * (
                    0.18 * Math.sin(tipXNorm * Math.PI * 9) +
                    0.08 * Math.sin(tipXNorm * Math.PI * 19) +
                    0.04 * Math.sin(tipXNorm * Math.PI * 35)
                );
                const tipYVal = Math.max(0, Math.min(1, tipAsymptote + tipWiggle));
                const tipX = pad.left + steps;
                const tipY = pad.top + 4 + (1 - tipYVal) * (graphH - 4);
                ctx.beginPath();
                ctx.arc(tipX, tipY, 3, 0, Math.PI * 2);
                ctx.fillStyle = "#33a5c4";
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
            width={190}
            height={100}
            style={{ display: "block" }}
        />
    );
}

export default function AppPage() {
    const calculatorRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const desmosRef = useRef<DesmosController | null>(null);
    const canvasControllerRef = useRef<CanvasController | null>(null);

    const [activeView, setActiveView] = useState<"desmos" | "equations">("desmos");
    const [isRunning, setIsRunning] = useState(false);
    const parserRef = useRef<ScriptParser | null>(null);

    const [scriptText, setScriptText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [subtitle, setSubtitle] = useState("");

    useEffect(() => {
        setLoaded(true);
    }, []);

    const [settings, setSettings] = useState({
        conceptLevel: 1,
    });

    // Initialize Desmos
    useEffect(() => {
        const initDesmos = () => {
            if (
                calculatorRef.current &&
                !desmosRef.current &&
                typeof window !== "undefined" &&
                (window as any).Desmos
            ) {
                desmosRef.current = new DesmosController(calculatorRef.current);
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
            const ctx = canvasRef.current.getContext("2d");
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
                const ctx = canvasRef.current.getContext("2d");
                if (ctx) {
                    ctx.scale(dpr, dpr);
                    canvasControllerRef.current.draw();
                }
            }
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
            if (canvasControllerRef.current) {
                canvasControllerRef.current.destroy();
                canvasControllerRef.current = null;
            }
        };
    }, []);

    // Re-size canvas when switching to equations view
    useEffect(() => {
        if (activeView === "equations" && canvasRef.current && canvasControllerRef.current) {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvasRef.current.parentElement!.getBoundingClientRect();
            canvasRef.current.width = rect.width * dpr;
            canvasRef.current.height = rect.height * dpr;
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
                ctx.scale(dpr, dpr);
                canvasControllerRef.current.draw();
            }
        }
    }, [activeView]);

    const handleCommandSubmit = async (prompt: string, _mode: string) => {
        setIsGenerating(true);
        try {
            const response = await fetch("/api/query", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: prompt }),
            });
            const data = await response.json();
            if (data.script) {
                setScriptText(data.script);
                // Auto-run the generated script
                setTimeout(() => parseAndExecuteScript(data.script), 200);
            }
        } catch (e) {
            console.error("Failed to fetch script:", e);
            setScriptText(`// Error generating script\n// ${e}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleStopScript = () => {
        if (parserRef.current) parserRef.current.stop();
        if (desmosRef.current) desmosRef.current.cancelAllAnimations();
        if (canvasControllerRef.current) canvasControllerRef.current.cancelAllAnimations();
        setSubtitle("");
        setIsRunning(false);
    };

    const parseAndExecuteScript = async (overrideScript?: string) => {
        if (!desmosRef.current || !canvasControllerRef.current) return;

        if (parserRef.current) {
            parserRef.current.stop();
        }

        setIsRunning(true);
        setActiveView("desmos");
        desmosRef.current.resetViewport();
        if (canvasControllerRef.current.resetViewport) canvasControllerRef.current.resetViewport();

        const parser = ScriptParser.createUnifiedParser(
            desmosRef.current,
            canvasControllerRef.current,
            (viewName) => setActiveView(viewName as "desmos" | "equations"),
            {
                onSubtitle: (text) => setSubtitle(text),
            }
        );

        parserRef.current = parser;
        await parser.parseAndExecute(overrideScript || scriptText);

        if (parserRef.current === parser && !parser.isStopped) {
            setIsRunning(false);
        }
    };

    const handleSettingsChange = (key: string, value: any) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSaveScript = () => {
        if (!scriptText) return;
        const blob = new Blob([scriptText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "script.desp";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleLoadScript = (script: string) => {
        setScriptText(script);
    };

    return (
        <div
            style={{
                display: "flex",
                height: "100vh",
                width: "100vw",
                margin: 0,
                padding: 0,
                overflow: "hidden",
                backgroundColor: "#08080e",
                fontFamily: "'Geist', 'Inter', system-ui, sans-serif",
            }}
        >
            {/* Sidebar */}
            <div style={{
                opacity: loaded ? 1 : 0,
                transform: loaded ? "translateX(0)" : "translateX(-24px)",
                transition: "all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s",
                display: "flex",
                flexShrink: 0,
            }}>
                <Sidebar
                    settings={settings}
                    onSettingsChange={handleSettingsChange}
                    scriptText={scriptText}
                    isRunning={isRunning}
                    onPlay={() => parseAndExecuteScript()}
                    onStop={handleStopScript}
                    onSave={handleSaveScript}
                    onLoad={handleLoadScript}
                />
            </div>

            {/* Main visualization area */}
            <div style={{
                flex: 1, height: "100vh", position: "relative",
                opacity: loaded ? 1 : 0,
                transform: loaded ? "translateY(0)" : "translateY(16px)",
                transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.25s",
            }}>
                {/* Layer 1: Desmos Calculator */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: activeView === "desmos" ? 1 : 0,
                        pointerEvents: activeView === "desmos" ? "auto" : "none",
                        transition: "opacity 0.6s ease-in-out",
                        zIndex: 1,
                    }}
                >
                    <div ref={calculatorRef} style={{ width: "100%", height: "100%" }} />
                </div>

                {/* Layer 2: Equation Canvas */}
                <canvas
                    ref={canvasRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: "100%",
                        height: "100%",
                        opacity: activeView === "equations" ? 1 : 0,
                        pointerEvents: activeView === "equations" ? "auto" : "none",
                        transition: "opacity 0.6s ease-in-out",
                        zIndex: 2,
                        backgroundColor: "transparent",
                    }}
                />

                {/* Prompt Bar */}
                <PromptBar onSubmit={handleCommandSubmit} isGenerating={isGenerating} isRunning={isRunning} loaded={loaded} />

                {/* Subtitle overlay */}
                {subtitle && (
                    <div
                        style={{
                            position: "absolute",
                            bottom: "48px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            maxWidth: "75%",
                            zIndex: 30,
                            textAlign: "center",
                            animation: "subtitleIn 0.3s ease",
                        }}
                    >
                        <span
                            style={{
                                display: "inline-block",
                                background: "rgba(6, 6, 10, 0.82)",
                                backdropFilter: "blur(12px)",
                                WebkitBackdropFilter: "blur(12px)",
                                color: "#f1f5f9",
                                fontSize: "1rem",
                                fontWeight: 500,
                                lineHeight: 1.5,
                                padding: "10px 20px",
                                borderRadius: "10px",
                                border: "1px solid rgba(255,255,255,0.08)",
                                boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
                                letterSpacing: "0.2px",
                            }}
                        >
                            {subtitle}
                        </span>
                    </div>
                )}

                {/* Loading overlay */}
                {isGenerating && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 100,
                            pointerEvents: "all",
                            background: "rgba(8, 8, 14, 0.35)",
                            backdropFilter: "blur(3px)",
                            WebkitBackdropFilter: "blur(3px)",
                            animation: "fadeIn 0.3s ease",
                        }}
                    >

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "20px",
                            }}
                        >
                            <div
                                style={{
                                    background: "rgba(10, 10, 16, 0.9)",
                                    border: "1px solid rgba(255, 255, 255, 0.08)",
                                    borderRadius: "12px",
                                    padding: "20px 24px",
                                    boxShadow: "0 8px 40px rgba(0, 0, 0, 0.5)",
                                }}
                            >
                                <LoadingCanvas />
                            </div>
                            <span
                                style={{
                                    color: "rgba(255,255,255,0.45)",
                                    fontSize: "0.8rem",
                                    fontFamily: "monospace",
                                    letterSpacing: "2px",
                                    textTransform: "uppercase",
                                    animation: "pulse 1.8s ease-in-out infinite",
                                }}
                            >
                                Generating...
                            </span>
                        </div>
                    </div>
                )}

            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.9; }
        }
        @keyframes subtitleIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
        </div>
    );
}
