"use client";

import { useEffect, useRef, useState } from "react";
import { DesmosController } from "../../lib/DesmosController";
import { CanvasController } from "../../lib/CanvasController";
import { ScriptParser } from "../../lib/ScriptParser";
import Sidebar from "../../components/Sidebar";
import PromptBar from "../../components/PromptBar";
import PlaybackControls from "../../components/PlaybackControls";

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

    const [settings, setSettings] = useState({
        narration: true,
        showComputations: true,
        maxDuration: 15,
        minDuration: 5,
        font: "Times New Roman",
        palette: "Default",
        conceptLevel: 1,
        resolution: "1280 × 720",
        format: "mp4",
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
            (viewName) => setActiveView(viewName as "desmos" | "equations")
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
            <Sidebar settings={settings} onSettingsChange={handleSettingsChange} />

            {/* Main visualization area */}
            <div style={{ flex: 1, height: "100vh", position: "relative" }}>
                {/* Layer 1: Desmos Calculator */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: "48px",
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
                        bottom: "48px",
                        width: "100%",
                        height: "calc(100% - 48px)",
                        opacity: activeView === "equations" ? 1 : 0,
                        pointerEvents: activeView === "equations" ? "auto" : "none",
                        transition: "opacity 0.6s ease-in-out",
                        zIndex: 2,
                        backgroundColor: "transparent",
                    }}
                />

                {/* Prompt Bar */}
                <PromptBar onSubmit={handleCommandSubmit} isGenerating={isGenerating} />

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
                        }}
                    >
                        <div
                            style={{
                                background: "rgba(10, 10, 16, 0.9)",
                                backdropFilter: "blur(16px)",
                                WebkitBackdropFilter: "blur(16px)",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                borderRadius: "16px",
                                padding: "32px 48px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "16px",
                                boxShadow: "0 8px 40px rgba(0, 0, 0, 0.5)",
                                animation: "fadeIn 0.3s ease",
                            }}
                        >
                            <div
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    border: "3px solid rgba(255, 255, 255, 0.1)",
                                    borderTop: "3px solid #14b8a6",
                                    borderRadius: "50%",
                                    animation: "spin 0.8s linear infinite",
                                }}
                            />
                            <span
                                style={{
                                    color: "#94a3b8",
                                    fontSize: "0.85rem",
                                    fontFamily: "monospace",
                                    letterSpacing: "0.5px",
                                }}
                            >
                                Generating instructions...
                            </span>
                        </div>
                    </div>
                )}

                {/* Playback Controls */}
                <PlaybackControls
                    isRunning={isRunning}
                    onPlay={() => parseAndExecuteScript()}
                    onStop={handleStopScript}
                    totalTime={settings.maxDuration}
                />
            </div>

            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
        </div>
    );
}
