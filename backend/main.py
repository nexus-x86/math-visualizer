from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio

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

