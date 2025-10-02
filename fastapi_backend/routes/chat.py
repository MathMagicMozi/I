from fastapi import APIRouter, HTTPException
from models.chat import ChatRequest, ChatResponse, Message
from datetime import datetime
import os
import json
from openai import OpenAI
import httpx

router = APIRouter()

# 初始化阿里云百炼API客户端
client = OpenAI(
    api_key="sk-XXXXXXXXX",  # 替换为您的API Key
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

# 加载文档内容的辅助函数
def load_document_content(doc_id: int) -> str:
    DOCS_DIR = "documents"
    filepath = os.path.join(DOCS_DIR, f"{doc_id}.json")
    
    if not os.path.exists(filepath):
        return ""
    
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data.get("content", "")
    except:
        return ""

def generate_ai_response(messages: list, document_context: str = "") -> str:
    try:
        # 构建消息历史，包含系统提示和文档上下文
        full_messages = [
            {"role": "system", "content": "You are a helpful assistant."}
        ]
        
        # 如果有文档上下文，添加到系统提示中
        if document_context:
            full_messages[0]["content"] += f"\n\n用户正在编辑的文档内容如下：\n{document_context}"
        
        # 添加用户消息历史
        for msg in messages:
            # 过滤掉空消息
            if msg["content"].strip():
                full_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
        
        # 调用阿里云百炼API
        completion = client.chat.completions.create(
            model="qwen-plus",
            messages=full_messages,
            timeout=30  # 设置超时时间
        )
        
        return completion.choices[0].message.content
    except httpx.TimeoutException:
        return "抱歉，请求超时，请稍后再试。"
    except Exception as e:
        print(f"AI API调用错误: {str(e)}")
        return "抱歉，AI助手暂时无法回应，请稍后再试。"

@router.post("/message", response_model=ChatResponse)
async def chat_message(chat_request: ChatRequest):
    # 如果提供了文档ID，加载文档内容作为上下文
    document_context = ""
    if chat_request.document_id:
        document_context = load_document_content(chat_request.document_id)
    
    # 生成AI响应
    ai_response = generate_ai_response(
        [msg.model_dump() for msg in chat_request.messages],
        document_context
    )
    
    # 创建响应消息
    response_message = Message(
        role="assistant",
        content=ai_response,
        timestamp=datetime.now()
    )
    
    return ChatResponse(message=response_message)
