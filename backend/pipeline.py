import os
import time
from google import genai
from dotenv import load_dotenv

load_dotenv()

# Initialize the Gemini client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

model_name = "gemini-3.1-pro-preview"  # Requested model

PLANNER_PROMPT = """
You are an expert mathematical planner and instructional designer. 
Your goal is to take the user's message/question about calculus and design a comprehensive plan for a dynamic visualization.

Instructions:
1. Analyze what concepts needed to be shown in calculus.
2. Analyze the visual transitions needed between the graphing view ("desmos") and the step-by-step math view ("equations").
3. Analyze what it needs to explain to the user.
4. List the graphs and equations that are needed.
5. Provide 5-8 points on what is needed to show the overall concept, explicitly indicating when to transition between graph and equation views.
6. For each point, state what it should be demonstrating to the user.

Think deeply: "What are we teaching, and what must happen overall?"
"""

INTERPRETER_PROMPT = """
You are the Interpreter. Your job is to generate a 'Desp' script based on the Planner's instructions.
A 'Desp' script is a specialized plaintext scripting language to animate math inside the Desmos Graphing Calculator and an Equation Canvas.

Here are the rules for Desp:
{robot_md}

CRITICAL RULES:
- ONLY output valid Desp script text. Do not wrap your response in markdown code blocks. Every valid command must be on its own line.
- The `say` command MUST ONLY output human readable and TTS-friendly language. ABSOLUTELY NO LaTeX output in the `say` command. Speak naturally to the student.
- Make sure to choose colors for your lines, curves, and points that have high contrast and are clearly visible against a white background (e.g., use vibrant or dark colors, avoid white or very light yellow).
- Use `switchView "desmos"` and `switchView "equations"` to seamlessly transition between the graph and the equations view when specified by the plan.
- Simply execute whatever the plan specified to create the instructions.
"""

VALIDATOR_PROMPT = """
You are the Validator. Your job is to review the generated 'Desp' script and find any errors, but you do NOT output the fixed script.
You must focus on the script formatting and syntax.

Check specifically for:
- broken Desmos syntax (e.g. invalid LaTeX, not escaping correctly as per docs)
- bad variable naming
- missing definitions (using variables that haven't been animated or defined)
- poor ordering (e.g., trying to animate something before it's plotted)
- confusing narration (the TTS prompt in `say` is too complex or not conversational)
- too much clutter (too many animations at the exact same time causing visual noise)

If there are issues, provide a bulleted list of issues found. 
If the script is completely flawless and needs no changes, just output exactly: "VALID_SCRIPT_NO_CHANGES_NEEDED"
"""

CRITIC_PROMPT = """
You are the Critic. You will oversee if the generated script (and its validation feedback) matches what the Planner originally wanted. You will critique whether the execution is good.

Your goal is to provide specific instructions to correct the script for the next pipeline stage to see. Give actionable items to repair the script or improve the teaching experience.
Focus on pedagogical quality and accuracy as well.
"""

INTERPRETER_REPAIR_PROMPT = """
You are the Interpreter (Repair phase). Your job is to take the previous script, apply the Critic's instructions to correct it, and ensure valid syntax.

Here are the rules for Desp:
{robot_md}

CRITICAL RULES:
- ONLY output valid Desp script text. Do not wrap your response in markdown code blocks. Every valid command must be on its own line.
- The `say` command MUST ONLY output human readable and TTS-friendly language. No LaTeX.
- Execute the repair instructions exactly to fix the script.
"""

def read_robot_md():
    with open(os.path.join(os.path.dirname(__file__), "robot.md"), "r") as f:
        return f.read()

def generate_gemini_response(payload: str) -> str:
    response = client.models.generate_content(
        model=model_name,
        contents=payload
    )
    return response.text

def run_pipeline(user_message: str):
    print("==================================================")
    print(f"User Message: {user_message}\n")
    start_time = time.time()
    robot_md = read_robot_md()

    # Step 1: Planner
    print("--- [1] Planner Phase Started ---")
    planner_payload = f"SYSTEM SETUP: {PLANNER_PROMPT}\n\nUSER MESSAGE: {user_message}"
    plan = generate_gemini_response(planner_payload)
    print("--- [1] Planner Phase Done ---\n")

    # Step 2: Interpreter
    print("--- [2] Interpreter Phase Started ---")
    interpreter_prompt = INTERPRETER_PROMPT.format(robot_md=robot_md)
    interpreter_payload = f"SYSTEM SETUP: {interpreter_prompt}\n\nPLANNER OUTPUT:\n{plan}"
    script_v1 = generate_gemini_response(interpreter_payload)
    print("--- [2] Interpreter Phase Done ---\n")

    # # Step 3: Validator
    # print("--- [3] Validator Phase Started ---")
    # validator_payload = f"SYSTEM SETUP: {VALIDATOR_PROMPT}\n\nCURRENT SCRIPT TO EVALUATE:\n{script_v1}"
    # validation_feedback = generate_gemini_response(validator_payload)
    # print("--- [3] Validator Phase Done ---\n")

    # # Step 4: Critic
    # print("--- [4] Critic Phase Started ---")
    # critic_payload = f"SYSTEM SETUP: {CRITIC_PROMPT}\n\nORIGINAL PLAN:\n{plan}\n\nCURRENT SCRIPT:\n{script_v1}\n\nVALIDATION FEEDBACK:\n{validation_feedback}"
    # critic_feedback = generate_gemini_response(critic_payload)
    # print("--- [4] Critic Phase Done ---\n")

    # # Step 5: Interpreter (Repair 1)
    # print("--- [5] Interpreter (Repair 1) Phase Started ---")
    # interpreter_repair_prompt = INTERPRETER_REPAIR_PROMPT.format(robot_md=robot_md)
    # interp_repair_payload = f"SYSTEM SETUP: {interpreter_repair_prompt}\n\nPREVIOUS SCRIPT:\n{script_v1}\n\nCRITIC INSTRUCTIONS:\n{critic_feedback}"
    # script_v2 = generate_gemini_response(interp_repair_payload)
   # print("--- [5] Interpreter (Repair 1) Phase Done ---\n")

    # # Step 6: Validator (Sanity Check for v2)
    # print("--- [6] Validator (Sanity Check) Phase Started ---")
    # validator_sanity_payload = f"SYSTEM SETUP: {VALIDATOR_PROMPT}\n\nCURRENT SCRIPT TO EVALUATE:\n{script_v2}"
    # validation_sanity_feedback = generate_gemini_response(validator_sanity_payload)
    # print("--- [6] Validator (Sanity Check) Phase Done ---\n")

    # # Step 7: Critic (Sanity Check for v2)
    # print("--- [7] Critic (Sanity Check) Phase Started ---")
    # critic_sanity_payload = f"SYSTEM SETUP: {CRITIC_PROMPT}\n\nORIGINAL PLAN:\n{plan}\n\nCURRENT SCRIPT:\n{script_v2}\n\nVALIDATION FEEDBACK:\n{validation_sanity_feedback}"
    # critic_sanity_feedback = generate_gemini_response(critic_sanity_payload)
    # print("--- [7] Critic (Sanity Check) Phase Done ---\n")

    # # Step 8: Interpreter (Repair 2)
    # print("--- [8] Interpreter (Repair 2) Phase Started ---")
    # interp_repair2_payload = f"SYSTEM SETUP: {interpreter_repair_prompt}\n\nPREVIOUS SCRIPT:\n{script_v2}\n\nCRITIC INSTRUCTIONS:\n{critic_sanity_feedback}"
    # script_v3 = generate_gemini_response(interp_repair2_payload)
    # print("--- [8] Interpreter (Repair 2) Phase Done ---\n")

    # # Step 9: Validator (Final Check)
    # print("--- [9] Validator (Final Check) Phase Started ---")
    # validator_final_payload = f"SYSTEM SETUP: {VALIDATOR_PROMPT}\n\nCURRENT SCRIPT TO EVALUATE:\n{script_v3}"
    # validation_final_feedback = generate_gemini_response(validator_final_payload)
    # print("--- [9] Validator (Final Check) Phase Done ---\n")
    print(plan)
    print("\n\n==================================================")
    print("FINAL DESP SCRIPT (script_v2):")
    print("==================================================")
    print(script_v1)
    print("==================================================\n")

    end_time = time.time()
    print(f"Total time elapsed: {end_time - start_time:.2f} seconds\n")

    #return plan, script_v1, validation_feedback, critic_feedback, script_v2
    return plan

if __name__ == "__main__":
    test_msg = "I don't understand an epsilon delta proof."
    run_pipeline(test_msg)
