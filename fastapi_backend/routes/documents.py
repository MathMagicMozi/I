from fastapi import APIRouter, HTTPException
from typing import List
import os
import json
from datetime import datetime
from models.document import Document, DocumentCreate, DocumentUpdate

router = APIRouter()

# 确保文档存储目录存在
DOCS_DIR = "documents"
if not os.path.exists(DOCS_DIR):
    os.makedirs(DOCS_DIR)

def get_document_filepath(doc_id: int) -> str:
    return os.path.join(DOCS_DIR, f"{doc_id}.json")

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def load_document(doc_id: int) -> Document:
    filepath = get_document_filepath(doc_id)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # 将ISO格式的字符串转换回datetime对象
        if 'created_at' in data and isinstance(data['created_at'], str):
            data['created_at'] = datetime.fromisoformat(data['created_at'])
        if 'updated_at' in data and isinstance(data['updated_at'], str):
            data['updated_at'] = datetime.fromisoformat(data['updated_at'])
        
        return Document(**data)
    except (json.JSONDecodeError, ValueError, KeyError) as e:
        # 如果文档损坏，创建一个新的默认文档
        print(f"Error loading document {doc_id}: {e}")
        default_document = Document(
            id=doc_id,
            title=f"文档{doc_id}.md",
            content=f"# 文档{doc_id}\n\n文档内容...",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        save_document(doc_id, default_document)
        return default_document

def save_document(doc_id: int, document: Document):
    filepath = get_document_filepath(doc_id)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(document.model_dump(), f, ensure_ascii=False, indent=2, default=json_serial)

# 获取所有文档ID（用于列表显示）
def get_all_document_ids() -> List[int]:
    if not os.path.exists(DOCS_DIR):
        return []
    
    ids = []
    for filename in os.listdir(DOCS_DIR):
        if filename.endswith(".json"):
            try:
                doc_id = int(filename[:-5])  # 移除 .json 后缀
                ids.append(doc_id)
            except ValueError:
                pass
    return sorted(ids)

@router.post("/", response_model=Document)
async def create_document(document: DocumentCreate):
    # 获取新的文档ID
    existing_ids = get_all_document_ids()
    new_id = max(existing_ids) + 1 if existing_ids else 1
    
    # 创建文档对象
    new_document = Document(
        id=new_id,
        title=document.title,
        content=document.content,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    # 保存文档
    save_document(new_id, new_document)
    
    return new_document

@router.get("/", response_model=List[Document])
async def list_documents():
    doc_ids = get_all_document_ids()
    documents = []
    
    for doc_id in doc_ids:
        try:
            doc = load_document(doc_id)
            documents.append(doc)
        except:
            # 如果加载文档时出错，跳过该文档
            pass
    
    return documents

@router.get("/{doc_id}", response_model=Document)
async def get_document(doc_id: int):
    return load_document(doc_id)

@router.put("/{doc_id}", response_model=Document)
async def update_document(doc_id: int, document_update: DocumentUpdate):
    # 加载现有文档
    existing_doc = load_document(doc_id)
    
    # 更新文档
    updated_doc = Document(
        id=doc_id,
        title=document_update.title if document_update.title is not None else existing_doc.title,
        content=document_update.content if document_update.content is not None else existing_doc.content,
        created_at=existing_doc.created_at,
        updated_at=datetime.now()
    )
    
    # 保存更新后的文档
    save_document(doc_id, updated_doc)
    
    return updated_doc

@router.delete("/{doc_id}")
async def delete_document(doc_id: int):
    filepath = get_document_filepath(doc_id)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Document not found")
    
    os.remove(filepath)
    return {"message": f"Document {doc_id} deleted successfully"}