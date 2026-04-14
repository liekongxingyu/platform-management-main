import os
from chat import LLM_chain, check_ollama_connection, get_available_models
from pydantic import BaseModel, Field
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

app = FastAPI(
    title="智能对话助手系统",
    version="1.0",
    description="支持多知识库的智能问答系统"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


class ChatTurn(BaseModel):
    user: str
    assistant: Optional[str] = None


class ChatHistory(BaseModel):
    prompt: str
    history: List[ChatTurn] = Field(default_factory=list)


class KBConfig(BaseModel):
    kb_name: str
    enable_rag: bool = True


class ChatRequest(BaseModel):
    chat_data: ChatHistory
    kb_config: KBConfig


@app.post("/chat")
async def chat_handler(request: ChatRequest):
    try:
        persist_directory = os.path.join(
            "./vector_db",
            request.kb_config.kb_name
        )

        history_dicts = [{"user": turn.user, "assistant": turn.assistant} for turn in request.chat_data.history]

        chain = LLM_chain(
            history_dicts,
            persist_directory,
            RAG=request.kb_config.enable_rag
        )

        response = chain.invoke(request.chat_data.prompt)

        return {
            "status": "success",
            "response": response,
            "history": request.chat_data.history
        }
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc()
        }


@app.post("/clear_history")
async def clear_history():
    return {"status": "success", "message": "对话历史已清空"}


@app.get("/health")
async def health_check():
    ollama_ok = check_ollama_connection()
    models = get_available_models() if ollama_ok else []
    
    return {
        "status": "ok",
        "service": "LLM Chat Service",
        "ollama": {
            "connected": ollama_ok,
            "models": models,
        },
        "backend": "running",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8888)
