import { DesmosController } from "./DesmosController";
import { playTTS, stopCurrentAudio } from "./AudioPlayer";

// A function type that takes an array of string arguments
export type CommandCallback = (args: string[]) => void;

export class ScriptParser {
    // The dictionary mapping command names to functions
    private commands: Map<string, CommandCallback> = new Map();
    public isStopped = false;

    /**
     * Registers a new command in the parser's dictionary.
     * @param commandName The string that triggers this command (e.g. "plotEquation")
     * @param callback The function to execute, receiving all subsequent arguments as an array of strings.
     */
    public registerCommand(commandName: string, callback: CommandCallback) {
        this.commands.set(commandName, callback);
    }

    /**
     * Removes a command from the dictionary.
     */
    public unregisterCommand(commandName: string) {
        this.commands.delete(commandName);
    }

    /**
     * Stops currently running scripts and stops active TTS engine playbacks.
     */
    public stop() {
        this.isStopped = true;
        stopCurrentAudio();
    }

    /**
     * Helper to retrieve all registered command names.
     */
    public getRegisteredCommands(): string[] {
        return Array.from(this.commands.keys());
    }

    /**
     * Parses and executes a block of text line-by-line.
     */
    public async parseAndExecute(scriptText: string) {
        this.isStopped = false;
        const lines = scriptText.split('\n');

        for (const line of lines) {
            if (this.isStopped) break;
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('//')) continue; // Skip empty lines and comments

            // Simple tokenizer: match quoted strings or bare words
            const matches = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g);
            if (!matches) continue;

            const args = matches.map(arg => {
                // Remove surrounding quotes if they exist
                if (arg.startsWith('"') && arg.endsWith('"')) {
                    return arg.slice(1, -1);
                }
                return arg;
            });

            // The first token is the command name
            const commandName = args[0];

            // The rest are arguments to pass to the callback
            const commandArgs = args.slice(1);

            const callback = this.commands.get(commandName);

            if (callback) {
                try {
                    await callback(commandArgs);
                } catch (e) {
                    console.error(`Error executing command '${commandName}':`, e);
                }
            } else {
                console.warn(`Unknown command: ${commandName}`);
            }
        }
    }

    /**
     * Factory method to create a parser automatically bound to a DesmosController instance.
     */
    public static createBoundParser(controller: DesmosController): ScriptParser {
        const parser = new ScriptParser();

        parser.registerCommand('wait', async (args) => {
            let ms = parseFloat(args[0] as string);

            if (ms > 3000) {
                ms = 3000;
            }

            if (!isNaN(ms)) {
                await new Promise(resolve => setTimeout(resolve, ms));
            }
        });

        parser.registerCommand('plotEquation', (args) => {
            if (args.length >= 2) { // ID, Equation, Optional Color
                const id = args[0];
                const eq = args[1];
                const color = args.length >= 3 ? args[2] : undefined;
                controller.plotEquation(id, eq, color);
            }
        });

        parser.registerCommand('plotCoordinate', (args) => {
            if (args.length >= 3) { // ID, X, Y, Optional Color
                const id = args[0];
                const x = parseFloat(args[1]);
                const y = parseFloat(args[2]);
                const color = args.length >= 4 ? args[3] : undefined;
                controller.plotCoordinate(id, x, y, color);
            }
        });

        parser.registerCommand('freeEquation', (args) => {
            if (args.length >= 1) { // ID
                if ((controller as any).freeEquation) {
                    (controller as any).freeEquation(args[0]);
                }
            }
        });

        parser.registerCommand('free', (args) => {
            if (args.length >= 1) {
                controller.freeItem(args[0]);
            }
        });

        parser.registerCommand('freeAll', () => {
            controller.freeAll();
        });

        parser.registerCommand('pauseAnimations', () => {
            controller.pauseAllAnimations();
        });

        parser.registerCommand('say', async (args) => {
            if (args.length > 0) {
                const text = args[0] as string;
                console.log("Narrator says:", text);
                try {
                    const audioUrl = `/api/tts?text=${encodeURIComponent(text)}`;
                    await playTTS(audioUrl);
                } catch (e) {
                    console.error("Say command error:", e);
                }
            }
        });

        parser.registerCommand('resetViewport', () => {
            controller.resetViewport();
        });

        parser.registerCommand('setVariable', (args) => {
            if (args.length >= 2) {
                const name = args[0];
                const value = parseFloat(args[1]);
                if (!isNaN(value)) {
                    controller.setVariable(name, value);
                }
            }
        });

        parser.registerCommand('getVariable', (args) => {
            if (args.length >= 1) {
                const name = args[0];
                const value = controller.getVariable(name);
                console.log(`Variable ${name}:`, value);
            }
        });

        parser.registerCommand('freeVariable', (args) => {
            if (args.length >= 1) {
                controller.freeVariable(args[0]);
            }
        });

        parser.registerCommand('animateVariable', (args) => {
            if (args.length >= 3) {
                const name = args[0];
                const fromValue = parseFloat(args[1]);
                const toValue = parseFloat(args[2]);
                const duration = args.length >= 4 ? parseFloat(args[3]) : 2000;
                if (!isNaN(fromValue) && !isNaN(toValue) && !isNaN(duration)) {
                    controller.animateVariable(name, fromValue, toValue, duration);
                }
            }
        });

        parser.registerCommand('stopVariableAnimation', (args) => {
            if (args.length >= 1) {
                controller.stopVariableAnimation(args[0]);
            }
        });

        parser.registerCommand('plotCoordinateExpression', (args) => {
            if (args.length >= 2) {
                const id = args[0];
                const coordExpr = args[1];
                const color = args.length >= 3 ? args[2] : undefined;
                controller.plotCoordinateExpression(id, coordExpr, color);
            }
        });

        parser.registerCommand('createObjectGroup', (args) => {
            if (args.length >= 4) {
                const groupId = args[0];
                const template = args[1];
                const countVar = args[2];
                const prefix = args[3];
                const maxCount = args.length >= 5 ? parseInt(args[4]) : 50;
                const color = args.length >= 6 ? args[5] : undefined;
                controller.createObjectGroup(groupId, template, countVar, prefix, maxCount, color);
            }
        });

        parser.registerCommand('freeObjectGroup', (args) => {
            if (args.length >= 1) {
                controller.freeObjectGroup(args[0]);
            }
        });

        parser.registerCommand('renderEquation', (args) => {
            const id = args[0] as string;
            const tex = args[1] as string;
            const color = (args[2] as string) || '#ffffff';
            const offsetX = args[3] !== undefined ? parseFloat(args[3] as string) : 0;
            const offsetY = args[4] !== undefined ? parseFloat(args[4] as string) : 0;

            if ((controller as any).renderEquation) {
                (controller as any).renderEquation(id, tex, color, offsetX, offsetY);
            }
        });

        parser.registerCommand('renderText', (args) => {
            const id = args[0] as string;
            const text = args[1] as string;
            const tex = `\\text{${text}}`;
            const color = (args[2] as string) || '#ffffff';
            const offsetX = args[3] !== undefined ? parseFloat(args[3] as string) : 0;
            const offsetY = args[4] !== undefined ? parseFloat(args[4] as string) : 0;

            if ((controller as any).renderEquation) {
                (controller as any).renderEquation(id, tex, color, offsetX, offsetY);
            }
        });

        parser.registerCommand('transformEquation', async (args) => {
            const id = args[0] as string;
            const tex = args[1] as string;

            let durationMs = 1000;
            let colorIndex = 2;

            if (args[2] && !isNaN(parseFloat(args[2] as string))) {
                durationMs = parseFloat(args[2] as string);
                colorIndex = 3;
            }

            const color = (args[colorIndex] as string) || '#ffffff';
            const offsetX = args[colorIndex + 1] !== undefined ? parseFloat(args[colorIndex + 1] as string) : undefined;
            const offsetY = args[colorIndex + 2] !== undefined ? parseFloat(args[colorIndex + 2] as string) : undefined;

            if ((controller as any).transformEquation) {
                (controller as any).transformEquation(id, tex, color, durationMs, offsetX, offsetY);
            }
        });

        parser.registerCommand('stackEquations', (args) => {
            if (args.length < 2) return;
            const padding = parseFloat(args[0] as string);
            const ids = args.slice(1) as string[];

            if ((controller as any).stackEquations) {
                (controller as any).stackEquations(ids, padding);
            }
        });

        return parser;
    }

    /**
     * Factory method to create a unified parser mapping to BOTH Desmos and Canvas controllers.
     */
    public static createUnifiedParser(
        desmos: DesmosController,
        canvas: any,
        setView: (view: string) => void,
        options?: {
            onSubtitle?: (text: string) => void;
        }
    ): ScriptParser {
        const parser = new ScriptParser();
        const onSubtitle = options?.onSubtitle ?? (() => { });

        parser.registerCommand('wait', async (args) => {
            const ms = parseFloat(args[0] as string);
            if (!isNaN(ms)) {
                await new Promise(resolve => setTimeout(resolve, ms));
            }
        });

        parser.registerCommand('switchView', (args) => {
            if (args.length > 0) {
                // Clear all contents from both views before switching
                desmos.freeAll();
                if (canvas.freeAll) canvas.freeAll();
                setView(args[0]);
            }
        });

        parser.registerCommand('resetViewport', () => {
            desmos.resetViewport();
            if (canvas.resetViewport) canvas.resetViewport();
        });

        // DESMOS Specific Commands
        parser.registerCommand('plotEquation', (args) => {
            if (args.length >= 2) {
                const id = args[0];
                const eq = args[1];
                const color = args.length >= 3 ? args[2] : undefined;
                desmos.plotEquation(id, eq, color);
            }
        });

        parser.registerCommand('plotCoordinate', (args) => {
            if (args.length >= 3) {
                const id = args[0];
                const x = parseFloat(args[1]);
                const y = parseFloat(args[2]);
                const color = args.length >= 4 ? args[3] : undefined;
                desmos.plotCoordinate(id, x, y, color);
            }
        });

        parser.registerCommand('animateCoordinate', (args) => {
            if (args.length >= 6) {
                const id = args[0];
                const expr = args[1];
                const sliderName = args[2];
                const endVal = parseFloat(args[3]);
                const step = parseFloat(args[4]);
                const color = args[5];
                const dur = args.length >= 7 ? parseFloat(args[6]) : undefined;
                desmos.animateCoordinate(id, expr, sliderName, endVal, step, color, dur);
            }
        });

        parser.registerCommand('animateEquationMorph', (args) => {
            if (args.length >= 4) {
                const id = args[0];
                const eq1 = args[1];
                const eq2 = args[2];
                const sliderVar = args[3];
                const color = args.length >= 5 ? args[4] : undefined;
                const dur = args.length >= 6 ? parseFloat(args[5]) : undefined;
                desmos.animateEquationMorph(id, eq1, eq2, sliderVar, color, dur);
            }
        });

        parser.registerCommand('zoomToPoint', (args) => {
            if (args.length >= 2) {
                const x = parseFloat(args[0]);
                const y = parseFloat(args[1]);
                const w = args.length >= 3 ? parseFloat(args[2]) : undefined;
                desmos.zoomToPoint(x, y, w);
            }
        });

        parser.registerCommand('animateDottedEquation', (args) => {
            if (args.length >= 6) {
                const id = args[0];
                const expr = args[1];
                const sliderName = args[2];
                const endVal = parseFloat(args[3]);
                const step = parseFloat(args[4]);
                const color = args[5];
                const dur = args.length >= 7 ? parseFloat(args[6]) : undefined;
                desmos.animateDottedEquation(id, expr, sliderName, endVal, step, color, dur);
            }
        });

        // CANVAS Specific Commands
        parser.registerCommand('renderEquation', (args) => {
            const id = args[0] as string;
            const tex = args[1] as string;
            const color = (args[2] as string) || '#ffffff';
            const offsetX = args[3] !== undefined ? parseFloat(args[3] as string) : 0;
            const offsetY = args[4] !== undefined ? parseFloat(args[4] as string) : 0;
            if (canvas.renderEquation) canvas.renderEquation(id, tex, color, offsetX, offsetY);
        });

        parser.registerCommand('renderText', (args) => {
            const id = args[0] as string;
            const text = args[1] as string;
            const tex = `\\text{${text}}`;
            const color = (args[2] as string) || '#ffffff';
            const offsetX = args[3] !== undefined ? parseFloat(args[3] as string) : 0;
            const offsetY = args[4] !== undefined ? parseFloat(args[4] as string) : 0;
            if (canvas.renderEquation) canvas.renderEquation(id, tex, color, offsetX, offsetY);
        });

        parser.registerCommand('transformEquation', async (args) => {
            const id = args[0] as string;
            const tex = args[1] as string;
            let durationMs = 1000;
            let colorIndex = 2;
            if (args[2] && !isNaN(parseFloat(args[2] as string))) {
                durationMs = parseFloat(args[2] as string);
                colorIndex = 3;
            }
            const color = (args[colorIndex] as string) || '#ffffff';
            const offsetX = args[colorIndex + 1] !== undefined ? parseFloat(args[colorIndex + 1] as string) : undefined;
            const offsetY = args[colorIndex + 2] !== undefined ? parseFloat(args[colorIndex + 2] as string) : undefined;

            if (canvas.transformEquation) {
                canvas.transformEquation(id, tex, color, durationMs, offsetX, offsetY);
            }
        });

        parser.registerCommand('stackEquations', (args) => {
            if (args.length < 2) return;
            const padding = parseFloat(args[0] as string);
            const ids = args.slice(1) as string[];
            if (canvas.stackEquations) canvas.stackEquations(ids, padding);
        });

        // SHARED/GLOBAL Commands
        parser.registerCommand('say', async (args) => {
            if (args.length > 0) {
                const text = args[0] as string;
                console.log("Narrator says:", text);
                onSubtitle(text);
                try {
                    const audioUrl = `/api/tts?text=${encodeURIComponent(text)}`;
                    await playTTS(audioUrl);
                } catch (e) {
                    console.error("Say command error:", e);
                } finally {
                    onSubtitle("");
                }
            }
        });

        parser.registerCommand('resetViewport', () => {
            desmos.resetViewport();
            if (canvas.resetViewport) canvas.resetViewport();
        });

        parser.registerCommand('free', (args) => {
            if (args.length >= 1) {
                const id = args[0];
                desmos.freeItem(id);
                if (canvas.freeEquation) canvas.freeEquation(id);
            }
        });

        parser.registerCommand('freeAll', () => {
            desmos.freeAll();
            if (canvas.freeAll) canvas.freeAll();
        });

        // VARIABLE Commands
        parser.registerCommand('setVariable', (args) => {
            if (args.length >= 2) {
                const name = args[0];
                const value = parseFloat(args[1]);
                if (!isNaN(value)) {
                    desmos.setVariable(name, value);
                }
            }
        });

        parser.registerCommand('getVariable', (args) => {
            if (args.length >= 1) {
                const name = args[0];
                const value = desmos.getVariable(name);
                console.log(`Variable ${name}:`, value);
            }
        });

        parser.registerCommand('freeVariable', (args) => {
            if (args.length >= 1) {
                desmos.freeVariable(args[0]);
            }
        });

        parser.registerCommand('animateVariable', (args) => {
            if (args.length >= 3) {
                const name = args[0];
                const fromValue = parseFloat(args[1]);
                const toValue = parseFloat(args[2]);
                const duration = args.length >= 4 ? parseFloat(args[3]) : 2000;
                if (!isNaN(fromValue) && !isNaN(toValue) && !isNaN(duration)) {
                    desmos.animateVariable(name, fromValue, toValue, duration);
                }
            }
        });

        parser.registerCommand('stopVariableAnimation', (args) => {
            if (args.length >= 1) {
                desmos.stopVariableAnimation(args[0]);
            }
        });

        parser.registerCommand('plotCoordinateExpression', (args) => {
            if (args.length >= 2) {
                const id = args[0];
                const coordExpr = args[1];
                const color = args.length >= 3 ? args[2] : undefined;
                desmos.plotCoordinateExpression(id, coordExpr, color);
            }
        });

        parser.registerCommand('createObjectGroup', (args) => {
            if (args.length >= 4) {
                const groupId = args[0];
                const template = args[1];
                const countVar = args[2];
                const prefix = args[3];
                const maxCount = args.length >= 5 ? parseInt(args[4]) : 50;
                const color = args.length >= 6 ? args[5] : undefined;
                desmos.createObjectGroup(groupId, template, countVar, prefix, maxCount, color);
            }
        });

        parser.registerCommand('freeObjectGroup', (args) => {
            if (args.length >= 1) {
                desmos.freeObjectGroup(args[0]);
            }
        });

        return parser;
    }
}
