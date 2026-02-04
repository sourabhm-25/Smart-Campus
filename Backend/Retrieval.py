# -----------------------------
# main_backend_hybrid_cloud.py
# -----------------------------
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_community.retrievers import BM25Retriever
from langchain_classic.retrievers import EnsembleRetriever

from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

from langchain_google_genai import GoogleGenerativeAI


import chromadb
import os
import pickle
from dotenv import load_dotenv



# -----------------------------
# FastAPI app
# -----------------------------
# -----------------------------
# FastAPI Router
# -----------------------------
from fastapi import APIRouter

router = APIRouter(tags=["retrieval"])  # ✅ replaces FastAPI() app

# -----------------------------
# Request schema
# -----------------------------
class TaskRequest(BaseModel):
    topic: str  # e.g., "The Water Cycle"

# from fastapi.middleware.cors import CORSMiddleware

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# -----------------------------
# 1️⃣ Setup embeddings
# -----------------------------
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
embedding_function = HuggingFaceEmbeddings(
    model_name=MODEL_NAME
)
# -----------------------------
# 2️⃣ Connect to Chroma Cloud
# -----------------------------
client_chroma = chromadb.CloudClient(
    api_key='ck-3K4vgYRnPvD7fbEeGWAkUu3NUS3ehuVckxKMWafn36QZ',
    tenant='bea8a25d-2534-4bca-9c00-798f1e7b084f',
    database='smart campus'
)

collection = client_chroma.get_or_create_collection(name="grade5_science")

# -----------------------------
# 3️⃣ Chroma retriever
# -----------------------------
chroma_retriever = Chroma(
    client=client_chroma,
    collection_name="grade5_science",
    embedding_function=embedding_function
).as_retriever(search_kwargs={"k": 3})

# -----------------------------
# 4️⃣ Load BM25 retriever
# -----------------------------
# Assume BM25 retriever was saved as 'bm25_retriever.pkl' during ingestion
with open("bm25_retriever.pkl", "rb") as f:
    bm25_retriever: BM25Retriever = pickle.load(f)
bm25_retriever.k = 3

# -----------------------------
# 5️⃣ Hybrid retriever (BM25 + Chroma)
# -----------------------------
hybrid_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, chroma_retriever],
    weights=[0.5, 0.5]
)

# -----------------------------
# 6️⃣ Setup Gemini LLM
# -----------------------------
GEMINI_API_KEY = "AIzaSyBzB85xCD836_SSyQ0xRXLbl_MDgAMoC5s"
os.environ['GOOGLE_API_KEY'] = GEMINI_API_KEY
llm = GoogleGenerativeAI(model="models/gemini-2.5-flash", temperature=0.3)

# -----------------------------
# 7️⃣ Prompt Template
# -----------------------------
prompt_template = PromptTemplate(
    template="""
You are an experienced school teacher creating homework questions for 5th-grade students. 
Based ONLY on the context provided below, create:

- 2 short-answer questions
- 2 multiple-choice questions (MCQs) with 4 options each, clearly labeling a, b, c, d
- 2 fill-in-the-blank questions

The questions should:

1. Be **directly and fully based on the provided context**.
2. Be **connected to each other** and focused on the same topic/lesson.
3. Help students **understand, remember, and apply the lesson**.
4. Be appropriate for **homework or exam practice**.
5. Be **clear, simple, and age-appropriate**.
6. Include the **correct answer** for each question.

Return the result as a **JSON object** with three keys: `"short_answer"`, `"mcq"`, `"fill_in_the_blanks"`. 
Each key should contain an array of question objects. 
For MCQs, include `"options"` and `"answer"` fields. For others, include `"question"` and `"answer"` fields.

IMPORTANT: 
- Only use information in the context.
- Do NOT invent unrelated examples or experiments.
- Ensure all questions are coherent and relevant to the topic.

CONTEXT:
{context}

TOPIC:
{question}

JSON_OUTPUT:
""",
    input_variables=["context", "question"]
)

import re
import json

def extract_json(text: str) -> dict:
    """
    Extract the first JSON object from LLM output.
    """
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in LLM output")

    return json.loads(match.group())

import json

# -----------------------------
# 8️⃣ FastAPI endpoint
# -----------------------------
@router.post("/generate-task")
def generate_task(request: TaskRequest):
    topic = request.topic.strip()

    try:
        # 1️⃣ Retrieve relevant chunks (UPDATED HERE)
        # relevant_docs = hybrid_retriever.get_relevant_documents(topic)  <-- OLD/BROKEN
        relevant_docs = hybrid_retriever.invoke(topic)                  # <-- NEW/FIXED
        
        print(f"\n📄 {len(relevant_docs)} chunks retrieved for topic: {topic}\n")
        
        # ... rest of your code ...
        
        context_text = " ".join([doc.page_content for doc in relevant_docs])

        # 2️⃣ Build RAG chain
        rag_chain = (
            {"context": RunnablePassthrough(), "question": RunnablePassthrough()}
            | prompt_template
            | llm
            | StrOutputParser()
        )

        # 3️⃣ Invoke chain
        raw_output = rag_chain.invoke({"context": context_text, "question": topic})
        raw_output = rag_chain.invoke(
        {"context": context_text, "question": topic}
        )

        print("\n🧠 RAW LLM OUTPUT START ----------------")
        print(raw_output)
        print("🧠 RAW LLM OUTPUT END ------------------\n")

        # 4️⃣ Extract valid JSON from LLM output
        questions_data = extract_json(raw_output)

        # 6️⃣ Save JSON to file (auto-generated filename)
        safe_topic = topic.replace(" ", "_")
        filename = f"questions_{safe_topic}.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump({"topic": topic, **questions_data}, f, ensure_ascii=False, indent=4)

        print(f"✅ Saved JSON to {filename}")

        # 7️⃣ Return JSON to client
        return {"topic": topic, "questions_json": questions_data, "saved_file": filename}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"{type(e).__name__}: {str(e)}"
        )

# -----------------------------
# 9️⃣ Save Questions Endpoint
# -----------------------------
class SaveQuestionsRequest(BaseModel):
    topic: str
    questions_json: dict

@router.post("/save-questions")
def save_questions(request: SaveQuestionsRequest):
    """Save confirmed questions to MongoDB database."""
    from db import get_collection
    
    try:
        coll = get_collection("questions")
        docs = []
        
        # Transform JSON to individual question documents
        for qtype in ["short_answer", "mcq", "fill_in_the_blanks"]:
            for q in request.questions_json.get(qtype, []):
                docs.append({
                    "topic": request.topic,
                    "type": qtype,
                    "question": q["question"],
                    "answer": q.get("answer"),
                    "options": q.get("options")
                })
        
        if not docs:
            raise HTTPException(status_code=400, detail="No questions to save")
        
        result = coll.insert_many(docs)
        print(f"✅ Saved {len(result.inserted_ids)} questions for topic: {request.topic}")
        
        return {
            "success": True,
            "message": f"Successfully saved {len(docs)} questions to database",
            "inserted_count": len(result.inserted_ids)
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save questions: {str(e)}"
        )

