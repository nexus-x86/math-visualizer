export class DesmosController {
    private calculator: any = null;
    private animationRef: number | null = null;
    private customAnimRefs: Set<number> = new Set();
    private trackedIds: Set<string> = new Set();
    private globalVariables: Map<string, number> = new Map();
    private variableAnimations: Map<string, {
        startValue: number,
        endValue: number,
        startTime: number,
        duration: number,
        frameId: number
    }> = new Map();

    // State Tracking for camera animations
    private targetCenterX: number | null = null;
    private targetCenterY: number | null = null;
    private targetViewportWidth: number | null = null;

    constructor(containerElement: HTMLElement) {
        const win = window as any;
        if (win.Desmos) {
            this.calculator = win.Desmos.GraphingCalculator(containerElement, {
                expressions: false,
                keypad: false,
                settingsMenu: false,
                zoomButtons: false,
                lockViewport: true,
                invertedColors: true,
            });
            this.calculator.setExpression({ id: 'graph1' });
        } else {
            console.warn("Desmos API is not loaded.");
        }
    }

    /**
     * Completely destroys the Desmos calculator instance and cancels all running animations.
     * Use this when unmounting the component to prevent memory leaks and zombie loops.
     */
    public destroy() {
        this.cancelAllAnimations();
        if (this.calculator) {
            this.calculator.destroy();
            this.calculator = null;
        }
    }

    /**
     * Completely wipes the graph state back to default, including all tracked
     * items, running animations, and the physical camera viewport configuration.
     */
    public resetViewport() {
        if (!this.calculator) return;
        this.cancelAllAnimations();
        this.calculator.setBlank();
    }

    /**
     * Removes a specific item and its associated animation variable from the graph.
     * @param id The unique identifier of the expression to remove.
     */
    public freeItem(id: string) {
        if (!this.calculator) return;
        this.calculator.removeExpression({ id });
        this.calculator.removeExpression({ id: `${id}-var` });
        this.trackedIds.delete(id);
    }

    /**
     * Removes all items and variables that were explicitly created by this controller.
     * Also cancels all animations and clears the default graph instances.
     */
    public freeAll() {
        if (!this.calculator) return;
        this.cancelAllAnimations();
        this.trackedIds.forEach(id => {
            this.calculator.removeExpression({ id });
            this.calculator.removeExpression({ id: `${id}-var` });
        });
        this.trackedIds.clear();

        // Clear variables
        this.clearVariables();

        // Also remove default items just in case
        this.calculator.removeExpression({ id: 'user-equation' });
        this.calculator.removeExpression({ id: 'user-point' });
    }

    /**
     * Pauses all currently running animations on the graph.
     */
    public pauseAllAnimations() {
        this.cancelAllAnimations();
    }

    /**
     * Internal helper to forcefully stop all active `requestAnimationFrame` loops.
     * Clears the tracking ledger of active animation IDs.
     */
    public cancelAllAnimations() {
        if (this.animationRef !== null) {
            cancelAnimationFrame(this.animationRef);
            this.animationRef = null;
        }
        this.customAnimRefs.forEach(cancelAnimationFrame);
        this.customAnimRefs.clear();

        // Stop all variable animations
        this.stopAllVariableAnimations();

        // Reset target tracking variables when animations are cancelled
        this.targetCenterX = null;
        this.targetCenterY = null;
        this.targetViewportWidth = null;
    }

    /**
     * Plots a static equation on the graph.
     * @param id The unique identifier for this equation.
     * @param eq The LaTeX equation string (e.g. "y=\sin(x)")
     * @param color Optional hex color string for the equation line.
     */
    public plotEquation(id: string, eq: string, color?: string) {
        if (!this.calculator || !eq) return;
        this.calculator.setExpression({
            id: id,
            latex: eq,
            color: color || '#c47d09'
        });
        this.trackedIds.add(id);
    }

    /**
     * Plots a static coordinate point on the graph.
     * @param id The unique identifier for this coordinate.
     * @param x The X position.
     * @param y The Y position.
     * @param color Optional hex color string for the coordinate dot.
     */
    public plotCoordinate(id: string, x: number, y: number, color?: string) {
        if (!this.calculator || isNaN(x) || isNaN(y)) return;
        this.calculator.setExpression({
            id: id,
            latex: `(${x}, ${y})`,
            showLabel: true,
            color: color || '#10bbbb'
        });
        this.trackedIds.add(id);
    }

    /**
     * Animates a coordinate point moving across the graph.
     * @param id The unique identifier for this coordinate.
     * @param coordinateExpr The LaTeX expression for the coordinate (e.g. "(a, 0)").
     * @param sliderVar The variable inside the expression that drives the animation (e.g. "a").
     * @param min The starting value of the slider variable.
     * @param max The ending value of the slider variable.
     * @param color Optional hex color string for the coordinate.
     * @param durationMs Optional duration of the animation in milliseconds (default: 2000).
     */
    public animateCoordinate(id: string, coordinateExpr: string, sliderVar: string, min: number, max: number, color?: string, durationMs?: number) {
        if (!this.calculator) return;

        this.calculator.setExpression({
            id: id,
            latex: coordinateExpr,
            showLabel: true,
            color: color || '#10bbbb'
        });
        this.trackedIds.add(id);

        this.trackedIds.add(`var-${sliderVar}`);

        const duration = durationMs !== undefined && !isNaN(durationMs) ? durationMs : 2000;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const currentValue = min + (max - min) * progress;
            this.calculator.setExpression({
                id: `var-${sliderVar}`,
                latex: `${sliderVar}=${currentValue}`
            });

            if (progress < 1) {
                const frameId = requestAnimationFrame(animate);
                this.customAnimRefs.add(frameId);
            }
        };

        const frameId = requestAnimationFrame(animate);
        this.customAnimRefs.add(frameId);
    }

    /**
     * Animates a dotted line (often representing an equation or bound) moving across the graph.
     * @param id The unique identifier for this equation.
     * @param equationExpr The LaTeX expression for the equation (e.g. "x=b").
     * @param sliderVar The variable inside the expression that drives the animation (e.g. "b").
     * @param min The starting value of the slider variable.
     * @param max The ending value of the slider variable.
     * @param color Optional hex color string for the line.
     * @param durationMs Optional duration of the animation in milliseconds (default: 2000).
     */
    public animateDottedEquation(id: string, equationExpr: string, sliderVar: string, min: number, max: number, color?: string, durationMs?: number) {
        if (!this.calculator) return;
        const win = window as any;

        this.calculator.setExpression({
            id: id,
            latex: equationExpr,
            color: color || '#c47d09',
            lineStyle: win.Desmos.Styles.DOTTED
        });
        this.trackedIds.add(id);

        this.trackedIds.add(`var-${sliderVar}`);

        const duration = durationMs !== undefined && !isNaN(durationMs) ? durationMs : 2000;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const currentValue = min + (max - min) * progress;
            this.calculator.setExpression({
                id: `var-${sliderVar}`,
                latex: `${sliderVar}=${currentValue}`
            });

            if (progress < 1) {
                const frameId = requestAnimationFrame(animate);
                this.customAnimRefs.add(frameId);
            }
        };

        const frameId = requestAnimationFrame(animate);
        this.customAnimRefs.add(frameId);
    }

    /**
     * Morphs between two equations over a given duration.
     * @param id The unique identifier for this equation.
     * @param eq1 The starting LaTeX equation (e.g. "y=\sin(x)").
     * @param eq2 The ending LaTeX equation (e.g. "y=x^2").
     * @param sliderVar The variable used for interpolation, typically 'h'.
     * @param color Optional hex color string for the equation.
     * @param durationMs Optional duration of the animation in milliseconds (default: 2000).
     */
    public animateEquationMorph(id: string, eq1: string, eq2: string, sliderVar: string, color?: string, durationMs?: number) {
        if (!this.calculator) return;

        // Split both equations by '='
        const parts1 = eq1.split('=');
        const parts2 = eq2.split('=');

        // If either equation isn't an equality, we can't morph them easily this way.
        if (parts1.length !== 2 || parts2.length !== 2) {
            console.error(`animateEquationMorph requires two valid equations with an '=' sign. Got: '${eq1}' and '${eq2}'`);
            return;
        }

        const e1Left = parts1[0].trim();
        const e1Right = parts1[1].trim();
        const e2Left = parts2[0].trim();
        const e2Right = parts2[1].trim();

        // Construct the interpolated LaTeX: (1 - h)(L1) + (h)(L2) = (1 - h)(R1) + (h)(R2)
        const leftSide = `(1-${sliderVar})(${e1Left}) + (${sliderVar})(${e2Left})`;
        const rightSide = `(1-${sliderVar})(${e1Right}) + (${sliderVar})(${e2Right})`;
        const combinedLatex = `${leftSide} = ${rightSide}`;

        this.calculator.setExpression({
            id: id,
            latex: combinedLatex,
            color: color || '#10bbbb'
        });
        this.trackedIds.add(id);

        this.trackedIds.add(`var-${sliderVar}`);

        const duration = durationMs !== undefined && !isNaN(durationMs) ? durationMs : 2000;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            this.calculator.setExpression({
                id: `var-${sliderVar}`,
                latex: `${sliderVar}=${progress}`
            });

            if (progress < 1) {
                const frameId = requestAnimationFrame(animate);
                this.customAnimRefs.add(frameId);
            }
        };

        const frameId = requestAnimationFrame(animate);
        this.customAnimRefs.add(frameId);
    }

    private teleportToCoordinate(x: number, y: number, viewWidth: number, viewHeight: number) {
        if (!this.calculator) return;
        this.calculator.setMathBounds({
            left: x - viewWidth / 2,
            right: x + viewWidth / 2,
            bottom: y - viewHeight / 2,
            top: y + viewHeight / 2,
        });
    }

    /**
     * Smoothly pans and optionally zooms the camera to a target coordinate.
     * @param targetX The target X coordinate for the center of the camera.
     * @param targetY The target Y coordinate for the center of the camera.
     * @param targetSize Optional size of the viewport (zoom level). 
     */
    public zoomToPoint(targetX: number, targetY: number, targetSize?: number) {
        if (!this.calculator || isNaN(targetX) || isNaN(targetY)) return;

        if (this.animationRef !== null) {
            cancelAnimationFrame(this.animationRef);
        }

        const state = this.calculator.getState();
        const startBounds = state.graph.viewport;

        const physicalStartWidth = startBounds.xmax - startBounds.xmin;
        const physicalStartHeight = startBounds.ymax - startBounds.ymin;
        const ratio = physicalStartHeight / physicalStartWidth;

        const startViewportWidth = this.targetViewportWidth !== null ? this.targetViewportWidth : physicalStartWidth;
        const startViewportHeight = startViewportWidth * ratio;

        const startX = this.targetCenterX !== null ? this.targetCenterX : (startBounds.xmin + startBounds.xmax) / 2;
        const startY = this.targetCenterY !== null ? this.targetCenterY : (startBounds.ymin + startBounds.ymax) / 2;

        const endViewportWidth = targetSize !== undefined && !isNaN(targetSize) ? targetSize : startViewportWidth;
        const endViewportHeight = endViewportWidth * ratio;

        const duration = 500;
        const startTime = performance.now();

        const easeInOutCubic = (t: number) => {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easedProgress = easeInOutCubic(progress);

            const currentX = startX + (targetX - startX) * easedProgress;
            const currentY = startY + (targetY - startY) * easedProgress;
            const currentViewportWidth = startViewportWidth + (endViewportWidth - startViewportWidth) * easedProgress;
            const currentViewportHeight = startViewportHeight + (endViewportHeight - startViewportHeight) * easedProgress;

            this.teleportToCoordinate(currentX, currentY, currentViewportWidth, currentViewportHeight);

            if (progress < 1) {
                this.animationRef = requestAnimationFrame(animate);
            } else {
                this.animationRef = null;

                // Clear the target trackers when the animation successfully concludes. 
                // This ensures that if the user manually pans the camera afterward, the 
                // next script reads their new manual position instead of the old target.
                this.targetCenterX = null;
                this.targetCenterY = null;
                this.targetViewportWidth = null;
            }
        };

        // Immediately update target trackers for any consecutive commands fired in the same tick
        this.targetCenterX = targetX;
        this.targetCenterY = targetY;
        this.targetViewportWidth = endViewportWidth;

        this.animationRef = requestAnimationFrame(animate);
    }

    /**
     * Sets a global variable that can be used across expressions.
     * @param name The name of the global variable.
     * @param value The value to assign to the variable.
     */
    public setVariable(name: string, value: number) {
        if (!this.calculator || !name) return;

        this.calculator.setExpression({
            id: `var-${name}`,
            latex: `${name}=${value}`,
            secret: true
        });

        this.globalVariables.set(name, value);
        this.trackedIds.add(`var-${name}`);
    }

    /**
     * Gets the value of a variable.
     * @param name The name of the variable.
     * @returns The value of the variable, or undefined if not found.
     */
    public getVariable(name: string): number | undefined {
        return this.globalVariables.get(name);
    }

    /**
     * Gets all variables as an object.
     * @returns An object containing all variables and their values.
     */
    public getAllVariables(): Record<string, number> {
        return Object.fromEntries(this.globalVariables);
    }

    /**
     * Removes a variable.
     * @param name The name of the variable to remove.
     */
    public freeVariable(name: string) {
        if (!this.calculator) return;

        this.stopVariableAnimation(name);
        this.calculator.removeExpression({ id: `var-${name}` });
        this.globalVariables.delete(name);
        this.trackedIds.delete(`var-${name}`);
    }

    /**
     * Clears all variables.
     */
    public clearVariables() {
        if (!this.calculator) return;

        this.variableAnimations.forEach((_, name) => {
            this.stopVariableAnimation(name);
        });

        this.globalVariables.forEach((_, name) => {
            this.calculator.removeExpression({ id: `var-${name}` });
            this.trackedIds.delete(`var-${name}`);
        });

        this.globalVariables.clear();
    }

    /**
     * Updates multiple variables at once.
     * @param variables An object containing variable names and their values.
     */
    public setVariables(variables: Record<string, number>) {
        Object.entries(variables).forEach(([name, value]) => {
            this.setVariable(name, value);
        });
    }

    /**
     * Animates a variable from one value to another.
     * @param name The name of the variable to animate.
     * @param fromValue The starting value.
     * @param toValue The ending value.
     * @param duration Duration in milliseconds.
     */
    public animateVariable(name: string, fromValue: number, toValue: number, duration: number = 2000) {
        if (!this.calculator || !name) return;

        this.stopVariableAnimation(name);

        this.setVariable(name, fromValue);
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const currentValue = fromValue + (toValue - fromValue) * progress;
            this.setVariable(name, currentValue);

            if (progress < 1) {
                const frameId = requestAnimationFrame(animate);
                this.variableAnimations.set(name, {
                    startValue: fromValue,
                    endValue: toValue,
                    startTime,
                    duration,
                    frameId
                });
            } else {
                this.variableAnimations.delete(name);
            }
        };

        const frameId = requestAnimationFrame(animate);
        this.variableAnimations.set(name, {
            startValue: fromValue,
            endValue: toValue,
            startTime,
            duration,
            frameId
        });
    }

    /**
     * Stops animation of a specific variable.
     * @param name The name of the variable.
     */
    public stopVariableAnimation(name: string) {
        const animation = this.variableAnimations.get(name);
        if (animation) {
            cancelAnimationFrame(animation.frameId);
            this.variableAnimations.delete(name);
        }
    }

    /**
     * Pauses animation of a specific variable.
     * @param name The name of the variable.
     */
    public pauseVariableAnimation(name: string) {
        this.stopVariableAnimation(name);
    }

    /**
     * Stops all variable animations.
     */
    public stopAllVariableAnimations() {
        this.variableAnimations.forEach((animation, name) => {
            cancelAnimationFrame(animation.frameId);
        });
        this.variableAnimations.clear();
    }

    /**
     * Plots a coordinate using an expression that can reference variables.
     * @param id The unique identifier for this coordinate.
     * @param coordExpr The LaTeX expression for the coordinate (e.g. "(h, h^2)").
     * @param color Optional hex color string for the coordinate dot.
     */
    public plotCoordinateExpression(id: string, coordExpr: string, color?: string) {
        if (!this.calculator || !coordExpr) return;
        this.calculator.setExpression({
            id: id,
            latex: coordExpr,
            showLabel: true,
            color: color || '#10bbbb'
        });
        this.trackedIds.add(id);
    }
}
