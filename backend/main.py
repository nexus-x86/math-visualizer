import os
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import httpx

from backend.pipeline import run_pipeline

app = FastAPI()

@app.get("/")
async def root():
    return {"status": "ok", "message": "Math Visualizer API is running"}

# Allow CORS for Next.js frontend (default port 3000)
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    query: str

@app.post("/")
@app.post("/api/query")
async def process_query(req: QueryRequest):
    print(f"Received query: {req.query}")
    
    # Run the blocking Gemini pipeline in a thread pool so it doesn't block
    # the event loop and starve other incoming requests.
    script = await asyncio.to_thread(run_pipeline, req.query)
    
    instructions = [line.strip() for line in script.splitlines() if line.strip()]
    
    return {
        "script": script,
        "instructions": instructions
    }

@app.get("/api/tts")
async def text_to_speech(text: str):
    # Support both naming conventions used in the project
    api_key = os.environ.get("ELEVENLABS_API_KEY") or os.environ.get("ELEVENLAB_KEY")
    
    if not api_key:
        print("ERROR: ElevenLabs API key not found in environment (check ELEVENLABS_API_KEY or ELEVENLAB_KEY)")
        return Response(content="ElevenLabs API key not configured", status_code=500)
        
    voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "uh5qBlKfjqFl7XXhFnJi")
    
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": api_key
    }
    
    data = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5
        }
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=data, headers=headers)
            
            if response.status_code != 200:
                print(f"ElevenLabs API Error: {response.status_code} - {response.text}")
                return Response(content=response.text, status_code=response.status_code)
                
            return Response(content=response.content, media_type="audio/mpeg")
    except Exception as e:
        print(f"Internal error in TTS: {str(e)}")
        return Response(content=str(e), status_code=500)

