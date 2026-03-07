"use client";

import React, { useState } from "react";

interface SidebarProps {
    settings: {
        narration: boolean;
        showComputations: boolean;
        maxDuration: number;
        minDuration: number;
        font: string;
        palette: string;
        conceptLevel: number;
        resolution: string;
        format: string;
    };
    onSettingsChange: (key: string, value: any) => void;
}

export default function Sidebar({ settings, onSettingsChange }: SidebarProps) {
    const [activeTab, setActiveTab] = useState<"settings" | "history">("settings");

    const conceptLabels = ["High School", "Undergraduate", "Graduate"];

    return (
        <div
            style={{
                width: "300px",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: "rgba(12, 12, 18, 0.95)",
                borderRight: "1px solid rgba(255,255,255,0.06)",
                fontFamily: "'Geist', 'Inter', system-ui, sans-serif",
                overflow: "hidden",
                flexShrink: 0,
            }}
        >
            {/* Logo */}
            <div
                style={{
                    padding: "20px 24px 0",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    letterSpacing: "3px",
                    color: "#e2e8f0",
                    textTransform: "uppercase",
                }}
            >
                MATHVIZ
            </div>

            {/* Tabs */}
            <div
                style={{
                    display: "flex",
                    padding: "16px 24px 0",
                    gap: "0",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                {(["settings", "history"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            flex: 1,
                            padding: "10px 0",
                            fontSize: "0.8rem",
                            fontWeight: activeTab === tab ? 600 : 400,
                            color: activeTab === tab ? "#14b8a6" : "rgba(255,255,255,0.4)",
                            background: "none",
                            border: "none",
                            borderBottom: activeTab === tab ? "2px solid #14b8a6" : "2px solid transparent",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            textTransform: "capitalize",
                            letterSpacing: "0.5px",
                            fontFamily: "inherit",
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div
                style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "20px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                }}
            >
                {activeTab === "settings" ? (
                    <>
                        {/* Toggle: Narration */}
                        <ToggleRow
                            label="Narration"
                            value={settings.narration}
                            onChange={(v) => onSettingsChange("narration", v)}
                        />

                        {/* Toggle: Show Computations */}
                        <ToggleRow
                            label="Show Computations"
                            value={settings.showComputations}
                            onChange={(v) => onSettingsChange("showComputations", v)}
                        />

                        {/* Duration fields */}
                        <FieldRow label="Max Duration">
                            <NumberInput
                                value={settings.maxDuration}
                                onChange={(v) => onSettingsChange("maxDuration", v)}
                                suffix="s"
                            />
                        </FieldRow>

                        <FieldRow label="Min Duration">
                            <NumberInput
                                value={settings.minDuration}
                                onChange={(v) => onSettingsChange("minDuration", v)}
                                suffix="s"
                            />
                        </FieldRow>

                        {/* Font */}
                        <FieldRow label="Font">
                            <SelectInput
                                value={settings.font}
                                options={["Times New Roman", "Inter", "Fira Code", "Georgia"]}
                                onChange={(v) => onSettingsChange("font", v)}
                            />
                        </FieldRow>

                        {/* Palette */}
                        <FieldRow label="Palette">
                            <SelectInput
                                value={settings.palette}
                                options={["Default", "Neon", "Pastel", "Monochrome"]}
                                onChange={(v) => onSettingsChange("palette", v)}
                            />
                        </FieldRow>

                        {/* Concept Level */}
                        <div>
                            <div
                                style={{
                                    fontSize: "0.75rem",
                                    color: "rgba(255,255,255,0.5)",
                                    marginBottom: "8px",
                                    letterSpacing: "0.3px",
                                }}
                            >
                                Concept Level
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={2}
                                step={1}
                                value={settings.conceptLevel}
                                onChange={(e) => onSettingsChange("conceptLevel", parseInt(e.target.value))}
                                style={{
                                    width: "100%",
                                    accentColor: "#14b8a6",
                                    cursor: "pointer",
                                }}
                            />
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "0.6rem",
                                    color: "rgba(255,255,255,0.35)",
                                    marginTop: "4px",
                                }}
                            >
                                {conceptLabels.map((label, i) => (
                                    <span
                                        key={label}
                                        style={{
                                            color: settings.conceptLevel === i ? "#14b8a6" : undefined,
                                            fontWeight: settings.conceptLevel === i ? 600 : 400,
                                        }}
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Resolution & Format */}
                        <FieldRow label="Resolution">
                            <TextInput
                                value={settings.resolution}
                                onChange={(v) => onSettingsChange("resolution", v)}
                            />
                        </FieldRow>

                        <FieldRow label="Format">
                            <SelectInput
                                value={settings.format}
                                options={["mp4", "webm", "gif"]}
                                onChange={(v) => onSettingsChange("format", v)}
                            />
                        </FieldRow>

                        {/* Action buttons */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
                            <ActionButton label="Export" variant="primary" />
                            <ActionButton label="Show" variant="secondary" />
                            <ActionButton label="Save" variant="secondary" />
                        </div>
                    </>
                ) : (
                    <div
                        style={{
                            color: "rgba(255,255,255,0.3)",
                            fontSize: "0.8rem",
                            textAlign: "center",
                            paddingTop: "40px",
                            fontStyle: "italic",
                        }}
                    >
                        No history yet
                    </div>
                )}
            </div>

            {/* Footer */}
            <button
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "16px 24px",
                    fontSize: "0.8rem",
                    color: "rgba(255,255,255,0.5)",
                    background: "none",
                    border: "none",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#14b8a6";
                    e.currentTarget.style.background = "rgba(20, 184, 166, 0.05)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                    e.currentTarget.style.background = "none";
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                Load Collections
            </button>
        </div>
    );
}

// -- Sub-components --

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>{label}</span>
            <button
                onClick={() => onChange(!value)}
                style={{
                    width: "40px",
                    height: "22px",
                    borderRadius: "11px",
                    border: "none",
                    background: value ? "#14b8a6" : "rgba(255,255,255,0.12)",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s ease",
                }}
            >
                <div
                    style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: "#fff",
                        position: "absolute",
                        top: "3px",
                        left: value ? "21px" : "3px",
                        transition: "left 0.2s ease",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    }}
                />
            </button>
        </div>
    );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>{label}</span>
            {children}
        </div>
    );
}

function NumberInput({ value, onChange, suffix }: { value: number; onChange: (v: number) => void; suffix?: string }) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "rgba(255,255,255,0.06)",
                borderRadius: "6px",
                padding: "4px 10px",
                border: "1px solid rgba(255,255,255,0.08)",
            }}
        >
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                style={{
                    width: "40px",
                    background: "none",
                    border: "none",
                    color: "#fff",
                    fontSize: "0.8rem",
                    outline: "none",
                    fontFamily: "monospace",
                    textAlign: "right",
                }}
            />
            {suffix && (
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}>{suffix}</span>
            )}
        </div>
    );
}

function TextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
                width: "110px",
                background: "rgba(255,255,255,0.06)",
                borderRadius: "6px",
                padding: "5px 10px",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
                fontSize: "0.8rem",
                outline: "none",
                fontFamily: "monospace",
            }}
        />
    );
}

function SelectInput({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
                background: "rgba(255,255,255,0.06)",
                borderRadius: "6px",
                padding: "5px 10px",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
                fontSize: "0.75rem",
                outline: "none",
                cursor: "pointer",
                fontFamily: "inherit",
            }}
        >
            {options.map((opt) => (
                <option key={opt} value={opt} style={{ background: "#1a1a1a" }}>
                    {opt}
                </option>
            ))}
        </select>
    );
}

function ActionButton({ label, variant }: { label: string; variant: "primary" | "secondary" }) {
    const isPrimary = variant === "primary";
    return (
        <button
            style={{
                padding: "10px",
                fontSize: "0.8rem",
                fontWeight: 600,
                borderRadius: "8px",
                border: isPrimary ? "none" : "1px solid rgba(255,255,255,0.1)",
                background: isPrimary ? "#14b8a6" : "rgba(255,255,255,0.04)",
                color: isPrimary ? "#000" : "rgba(255,255,255,0.6)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "inherit",
                letterSpacing: "0.3px",
            }}
            onMouseEnter={(e) => {
                if (isPrimary) {
                    e.currentTarget.style.background = "#0d9488";
                } else {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                }
            }}
            onMouseLeave={(e) => {
                if (isPrimary) {
                    e.currentTarget.style.background = "#14b8a6";
                } else {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }
            }}
        >
            {label}
        </button>
    );
}
