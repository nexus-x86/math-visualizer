// import { NextRequest, NextResponse } from "next/server";

// export async function POST(req: NextRequest) {
//     try {
//         const body = await req.json();

//         const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
//         const response = await fetch(`${backendUrl}/api/query`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify(body),
//         });

//         if (!response.ok) {
//             throw new Error(`Backend returned status ${response.status}`);
//         }

//         const data = await response.json();

//         // Backend returns { instructions: string[] } where each string is a script line.
//         // Join them back into a single script string for the frontend textarea.
//         const script = (data.instructions || []).join("\n");

//         return NextResponse.json({ script });
//     } catch (error) {
//         console.error("Error proxying to backend:", error);
//         return NextResponse.json(
//             { error: "Failed to fetch from backend" },
//             { status: 500 }
//         );
//     }
// }

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const _body = await req.json();

        const dummyScript = `resetViewport

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

say "That concludes the engine demonstration!"`;

        return NextResponse.json({ script: dummyScript });
    } catch (error) {
        console.error("Error generating dummy script:", error);
        return NextResponse.json(
            { error: "Failed to generate script" },
            { status: 500 }
        );
    }
}