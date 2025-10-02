from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime

class ChatRequest(BaseModel):
    messages: List[Message]
    document_id: Optional[int] = None

class ChatResponse(BaseModel):
    message: Message