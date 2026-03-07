import { EquationParser, MathSymbol } from './EquationParser';

export class CanvasController {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private trackedIds = new Set<string>();
    private customAnimRefs = new Set<number>();

    // Simple state to render something
    private messages: string[] = [];
    private coordinates: Record<string, { x: number, y: number, color: string }> = {};

    // Native Manim Equations Store
    private equations: Record<string, {
        color: string,
        offsetX: number,
        offsetY: number,
        symbols: (MathSymbol & { path2d: Path2D, opacity: number })[]
    }> = {};

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) throw new Error("Could not get 2D context");
        this.ctx = context;
        this.draw();
    }

    public destroy() {
        this.cancelAllAnimations();
    }

    public resetViewport() {
        this.cancelAllAnimations();
        this.trackedIds.clear();
        this.messages = [];
        this.coordinates = {};
        this.equations = {};
        this.draw();
    }

    public freeEquation(id: string) {
        this.trackedIds.delete(id);
        delete this.equations[id];
        this.draw();
    }

    public freeAll() {
        this.cancelAllAnimations();
        this.trackedIds.clear();
        this.messages = [];
        this.coordinates = {};
        this.equations = {};
        this.draw();
    }

    public pauseAllAnimations() {
        this.cancelAllAnimations();
    }

    public cancelAllAnimations() {
        this.customAnimRefs.forEach(cancelAnimationFrame);
        this.customAnimRefs.clear();
    }

    public renderEquation(id: string, tex: string, color?: string, offsetX: number = 0, offsetY: number = 0) {
        this.trackedIds.add(id);
        this.messages.push(`Rendered Eq (${id}): ${tex}`);

        try {
            const rawSymbols = EquationParser.parseEquation(tex);
            this.equations[id] = {
                color: color || '#ffffff',
                offsetX,
                offsetY,
                symbols: rawSymbols.map(sym => ({
                    ...sym,
                    path2d: new Path2D(sym.pathData),
                    opacity: 1
                }))
            };
        } catch (e) {
            console.error("Manim Parser failed to render equation:", e);
        }

        this.draw();
    }

    public transformEquation(id: string, newTex: string, color?: string, durationMs: number = 1000, newOffsetX?: number, newOffsetY?: number): Promise<void> {
        return new Promise((resolve) => {
            this.trackedIds.add(id);
            const oldEq = this.equations[id];
            if (!oldEq) {
                // If it doesn't exist, just hard render it
                this.renderEquation(id, newTex, color, newOffsetX, newOffsetY);
                resolve();
                return;
            }

            try {
                const finalOffsetX = newOffsetX ?? oldEq.offsetX;
                const finalOffsetY = newOffsetY ?? oldEq.offsetY;

                const newRawSymbols = EquationParser.parseEquation(newTex);
                const newSymbols = newRawSymbols.map(sym => ({
                    ...sym,
                    path2d: new Path2D(sym.pathData),
                    opacity: 1
                }));

                // --- The Diffing Engine ---
                const oldSymbols = oldEq.symbols;

                // 1. Find matches (Intersect)
                // We use charString to pair them up (e.g. the first "x" in old matches the first "x" in new)
                interface Match {
                    oldSym: typeof oldSymbols[0],
                    newSym: typeof newSymbols[0]
                }
                const matches: Match[] = [];
                const unmatchedOld: typeof oldSymbols[0][] = [];
                const unmatchedNew: typeof newSymbols[0][] = [];

                // Create a pool of available new symbols to match against
                const newPool = [...newSymbols];

                for (const oldSym of oldSymbols) {
                    const matchIndex = newPool.findIndex(n => n.charString === oldSym.charString);
                    if (matchIndex !== -1) {
                        matches.push({ oldSym, newSym: newPool[matchIndex] });
                        newPool.splice(matchIndex, 1); // remove from pool
                    } else {
                        unmatchedOld.push(oldSym);
                    }
                }

                // Whatever is leftover in the pool is brand new
                unmatchedNew.push(...newPool);

                // Set up animation state
                const animDuration = durationMs;
                const startTime = performance.now();

                // Prepare snapshot of initial states for interpolation
                const matchStarts = matches.map(m => ({ x: m.oldSym.x, y: m.oldSym.y, scale: m.oldSym.scale }));
                const startOffsetX = oldEq.offsetX;
                const startOffsetY = oldEq.offsetY;

                // Pre-insert the new symbols so they exist in the draw loop, but hide them initially
                unmatchedNew.forEach(sym => sym.opacity = 0);

                // The active rendering state during the transition is a hybrid
                oldEq.symbols = [...matches.map(m => m.oldSym), ...unmatchedOld, ...unmatchedNew];

                const animate = (currentTime: number) => {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / animDuration, 1);

                    // Ease out Expo
                    const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

                    // Morph matched symbols
                    matches.forEach((m, i) => {
                        const start = matchStarts[i];
                        m.oldSym.x = start.x + (m.newSym.x - start.x) * ease;
                        m.oldSym.y = start.y + (m.newSym.y - start.y) * ease;
                        m.oldSym.scale = start.scale + (m.newSym.scale - start.scale) * ease;
                    });

                    // Morph global layout offset
                    oldEq.offsetX = startOffsetX + (finalOffsetX - startOffsetX) * ease;
                    oldEq.offsetY = startOffsetY + (finalOffsetY - startOffsetY) * ease;

                    // Fade out old
                    unmatchedOld.forEach(sym => {
                        sym.opacity = 1 - ease;
                    });

                    // Fade in new (at their final targets)
                    unmatchedNew.forEach(sym => {
                        sym.opacity = ease;
                    });

                    this.draw();

                    if (progress < 1) {
                        const frameId = requestAnimationFrame(animate);
                        this.customAnimRefs.add(frameId);
                    } else {
                        // Animation complete: snap exact final state
                        oldEq.symbols = newSymbols;
                        oldEq.offsetX = finalOffsetX;
                        oldEq.offsetY = finalOffsetY;
                        oldEq.color = color || oldEq.color;
                        this.draw();
                        resolve();
                    }
                };

                const frameId = requestAnimationFrame(animate);
                this.customAnimRefs.add(frameId);

            } catch (e) {
                console.error("Manim Transform failed:", e);
                resolve();
            }
        });
    }

    public stackEquations(ids: string[], padding: number = 60) {
        const validIds = ids.filter(id => this.equations[id]);
        if (validIds.length === 0) return;

        const totalHeight = (validIds.length - 1) * padding;
        let currentY = -totalHeight / 2;

        for (const id of validIds) {
            this.equations[id].offsetX = 0;
            this.equations[id].offsetY = currentY;
            currentY += padding;
        }

        this.draw();
    }

    // Method to handle "say" since the user requested dummy implementation
    public sayLog(msg: string) {
        this.messages.push(`Say: ${msg}`);
        this.draw();
    }

    public draw() {
        const rect = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : this.canvas.getBoundingClientRect();
        const cw = rect.width;
        const ch = rect.height;

        // Use logical CSS dimensions for filling since context is explicitly scaled by DPR
        this.ctx.clearRect(0, 0, cw, ch);
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, cw, ch);

        // Center on logical viewport
        const cx = cw / 2;
        const cy = ch / 2;

        // MathJax uses massive coordinates. Scale them down to screen space.
        const mathScale = 0.05;

        for (const eqId of Object.keys(this.equations)) {
            const eqGroup = this.equations[eqId];
            this.ctx.fillStyle = eqGroup.color;

            // 0. Calculate global origin offset for this equation group
            const groupX = cx + eqGroup.offsetX;
            const groupY = cy + eqGroup.offsetY;

            for (const sym of eqGroup.symbols) {
                this.ctx.save();

                // 1. Move to the physical grid origin
                this.ctx.translate(groupX, groupY);

                // 2. Apply MathJax's perfectly calculated X/Y matrix spacing
                this.ctx.translate(sym.x * mathScale, -sym.y * mathScale);

                // 3. Shrink down the massive path.
                this.ctx.scale(mathScale * sym.scale, -mathScale * sym.scale);

                // 4. Set opacity
                this.ctx.globalAlpha = sym.opacity;

                // 5. Fill the SVG shape vector geometry
                this.ctx.fill(sym.path2d);

                this.ctx.restore();
            }
        }
    }
}
