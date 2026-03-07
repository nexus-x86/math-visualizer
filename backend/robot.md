# Desp

A lightweight, modular scripting engine for the [Desmos Graphing Calculator API](https://www.desmos.com/api). This project allows you to drive complex Desmos mathematical animations and plots using simple, line-by-line text commands, rather than relying on the default Desmos UI or hardcoded javascript. Meant to make it easy for LLMs to create demsos visualization. 

Preview

<img width="1909" height="938" alt="image" src="https://github.com/user-attachments/assets/ba58f30b-ab54-49ef-ae42-c971bd5b06ed" />


## Prerequisites
- Node.js (v18+)
- npm or yarn

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run the Development Server**
   ```bash
   npm run dev
   ```

3. **Open the App**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

The application features a split-pane layout:
- **Left Pane:** A `<textarea>` where you write your scripting commands.
- **Right Pane:** The live Desmos graphing calculator instance.

Write your commands in the text area (one command per line) and click **"Run Script"** to execute them.

The scripting engine uses a simple `command arg1 arg2 ...` format. Arguments containing spaces or special characters should be wrapped in double quotes `" "`.

### Graphing Commands (Desmos)

- **`plotEquation <id> <equation_latex> [color_hex]`**
  Plots a static math equation.
  *Example:* `plotEquation "eq2" "y=\sin(x)" "#ff0000"`

- **`plotCoordinate <id> <x> <y> [color_hex]`**
  Plots a static point on the graph.
  *Example:* `plotCoordinate "pt1" 0 0 "#00ff00"`

- **`animateCoordinate <id> <coordinate_latex> <slider_variable> <min_val> <max_val> [color_hex] [duration_ms]`**
  Animates a coordinate's movement over time.
  *Example:* `animateCoordinate "pt1" "(c, 0)" "c" -5 5 "#0000ff" 2000`

- **`animateDottedEquation <id> <equation_latex> <slider_variable> <min_val> <max_val> [color_hex] [duration_ms]`**
  Animates a dotted line (like an asymptote or sweep).
  *Example:* `animateDottedEquation "line1" "x=a" "a" -5 0 "#ffff00" 5000`

- **`zoomToPoint <x> <y> [viewport_size]`**
  Smoothly pans the camera to a specific coordinate.
  *Example:* `zoomToPoint 0 0 10`

### Equation Rendering (Canvas / Manim-Style)

- **`renderEquation <id> <latex> [color_hex] [offsetX] [offsetY]`**
  Draws a LaTeX equation natively on the canvas using MathJax shape extraction.
  *Example:* `renderEquation "title" "\int_{0}^{2} x^3 \, dx" "#ffffff"`

- **`transformEquation <id> <new_latex> [duration_ms] [color_hex]`**
  Seamlessly morphs an existing equation into a new one, running a visual difference engine to lerp matched characters. Returns a Promise, inherently blocking the script until the animation finishes. Default duration is 1000ms.
  *Example:* `transformEquation "title" "\left[ \frac{x^4}{4} \right]_{0}^{2}"`

- **`stackEquations <padding_y> <id1> <id2> ...`**
  Takes an array of existing equation IDs and vertically centers them with the designated padding.
  *Example:* `stackEquations 100 "eq1" "eq2" "eq3"`

### Timing & Transition Controls (Unified View)

- **`switchView <"desmos" | "equations">`**
  Crossfades between the graphing calculator and the equation canvas without unmounting or losing state in either engine.
  *Example:* `switchView "equations"`

- **`wait <duration_ms>`**
  Pauses the script execution for a specified amount of time.
  *Example:* `wait 2000`

- **`say <message>`**
  Logs a message to the console (useful for debugging or narration).
  *Example:* `say "Step 1: Graphing the line"`

### Global Commands
These commands require zero arguments.
- **`resetViewport`** : Wipes the entire Desmos graph/canvas to a blank slate.
- **`freeAll`** : Removes all items and variables created by the script engine.
- **`pauseAnimations`** : Forcefully stops all active animations.

## Architecture

This project has been heavily refactored to be portable to any framework (React, Vue, Vanilla JS):

1. **`lib/DesmosController.ts` & `lib/CanvasController.ts`**
   The core TypeScript classes. One manages the `Desmos.GraphingCalculator` instance, the other strictly manages MathJax SVG parsing and Canvas rendering. They have zero coupling to React.

2. **`lib/ScriptParser.ts`**
   A dynamic dictionary-based command parser. Using `ScriptParser.createUnifiedParser()`, it maps string commands asynchronously, routing graphing tasks to Desmos and math morphing to the Canvas.

3. **`app/unified/page.tsx`**
   The unified Next.js/React wrapper bridging both engines. It handles mounting the views absolutely on top of each other, gracefully turning pointers and opacity on/off via `switchView` to create a beautiful unified animation platform.