"""
UPDATED RETRIEVAL SYSTEM WITH MODULAR PROMPTS
==============================================
Supports:
- Homework vs Test modes
- Grade-specific defaults
- Teacher customization
- Subject-specific instructions
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv

from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import GoogleGenerativeAI

import json
import re

# Import modular prompt system
from prompt_components import create_prompt, PromptBuilder, QuestionConfig

load_dotenv()

# -----------------------------
# FastAPI Router
# -----------------------------
router = APIRouter(tags=["retrieval"])

# -----------------------------
# Request Schemas
# -----------------------------
class TaskRequest(BaseModel):
    topic: str  # e.g., "Cube Roots", "Water Cycle"
    grade: str  # e.g., "5", "8", "10"
    subject: str  # e.g., "Mathematics", "Science"
    task_type: str = "homework"  # "homework" or "test"
    namespace: Optional[str] = None
    
    # Optional: Teacher can customize question counts
    # If None, uses grade defaults
    custom_short_answer: Optional[int] = None
    custom_mcq: Optional[int] = None
    custom_fill_in_the_blanks: Optional[int] = None
    custom_true_false: Optional[int] = None
    custom_matching: Optional[int] = None


class SaveQuestionsRequest(BaseModel):
    topic: str
    questions_json: dict


# -----------------------------
# 1️⃣ Initialize Pinecone
# -----------------------------
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
pc = Pinecone(api_key=PINECONE_API_KEY)

_index_cache: Dict[str, Any] = {}

def get_pinecone_index(index_name: str):
    if index_name not in _index_cache:
        _index_cache[index_name] = pc.Index(index_name)
        print(f"✅ Connected to Pinecone index: {index_name}")
    return _index_cache[index_name]

def derive_index_name(grade: str) -> str:
    import re as _re
    match = _re.search(r'(\d+)', str(grade))
    if match:
        return f"grade-{match.group(1)}"
    return os.getenv("INDEX_NAME", "grade-5")

def derive_namespace(grade: str, subject: str) -> str:
    if not grade or not subject:
        return ""
    import re as _re
    match = _re.search(r'(\d+)', str(grade))
    grade_num = match.group(1) if match else "5"
    
    subject_map = {
        "mathematics": "math",
        "science": "science",
        "english": "english",
        "social science": "social_science",
        "history": "history",
        "geography": "geography",
        "computer science": "computer",
        "economics": "economics",
    }
    subject_key = subject_map.get(subject.lower(), subject.lower().replace(" ", "_"))
    return f"grade{grade_num}_{subject_key}"

print("✅ Pinecone client initialized")

# -----------------------------
# 2️⃣ Initialize Embedding Model
# -----------------------------
EMBEDDING_MODEL = "BAAI/bge-base-en-v1.5"
embedding_model = SentenceTransformer(EMBEDDING_MODEL)

print(f"✅ Loaded embedding model: {EMBEDDING_MODEL}")

# -----------------------------
# 3️⃣ Initialize Gemini LLM
# -----------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
os.environ['GOOGLE_API_KEY'] = GEMINI_API_KEY
llm = GoogleGenerativeAI(model="models/gemini-2.5-flash", temperature=0.3)

print("✅ Initialized Gemini LLM")

# -----------------------------
# 4️⃣ Initialize Prompt Builder
# -----------------------------
prompt_builder = PromptBuilder()

print("✅ Modular prompt builder initialized")


# -----------------------------
# 5️⃣ Smart Retriever (Simplified)
# -----------------------------
class SmartRetriever:
    def __init__(self, embedding_model):
        self.embedding_model = embedding_model
    
    def enhance_query(self, topic: str) -> str:
        return f"Represent this educational content for retrieval: {topic}"
    
    def retrieve(
        self,
        index,
        topic: str,
        top_k: int = 5,
        namespace: str = "",
        **kwargs
    ) -> List[Dict[str, Any]]:
        
        enhanced_query = self.enhance_query(topic)
        query_embedding = self.embedding_model.encode(enhanced_query).tolist()
        
        results = index.query(
            vector=query_embedding,
            top_k=top_k,
            namespace=namespace,
            include_metadata=True
        )
        
        formatted_chunks = []
        for match in results['matches']:
            formatted_chunks.append({
                'text': match['metadata'].get('text', ''),
                'score': match['score'],
                'metadata': match['metadata']
            })
        
        return formatted_chunks


retriever = SmartRetriever(embedding_model)
print("✅ Smart retriever initialized")


# -----------------------------
# 6️⃣ Utility Functions
# -----------------------------
def extract_json(text: str) -> dict:
    """Extract JSON from LLM output."""
    # Remove markdown code blocks if present
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in LLM output")
    
    return json.loads(match.group())


# -----------------------------
# 7️⃣ API Endpoint - Generate Questions
# -----------------------------
@router.post("/generate-task")
def generate_task(request: TaskRequest):
    """
    Generate questions with modular prompts.
    Supports homework/test and custom question counts.
    """
    topic = request.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic cannot be empty")
    
    try:
        # Derive index and namespace
        index_name = derive_index_name(request.grade)
        namespace = request.namespace or derive_namespace(request.grade, request.subject)
        
        print(f"\n{'='*80}")
        print(f"📚 GENERATING {request.task_type.upper()} QUESTIONS")
        print(f"   Topic: {topic}")
        print(f"   Subject: {request.subject}")
        print(f"   Grade: {request.grade}")
        print(f"   Task Type: {request.task_type}")
        print(f"   Index: {index_name}")
        print(f"   Namespace: {namespace}")
        
        # Check for custom question counts
        has_custom = any([
            request.custom_short_answer is not None,
            request.custom_mcq is not None,
            request.custom_fill_in_the_blanks is not None,
            request.custom_true_false is not None,
            request.custom_matching is not None
        ])
        
        if has_custom:
            print(f"\n   ⚙️  Using CUSTOM question counts:")
            if request.custom_short_answer is not None:
                print(f"      - Short Answer: {request.custom_short_answer}")
            if request.custom_mcq is not None:
                print(f"      - MCQ: {request.custom_mcq}")
            if request.custom_fill_in_the_blanks is not None:
                print(f"      - Fill in Blanks: {request.custom_fill_in_the_blanks}")
            if request.custom_true_false is not None:
                print(f"      - True/False: {request.custom_true_false}")
        else:
            # Show defaults
            defaults = prompt_builder.get_grade_defaults(request.grade)
            print(f"\n   ✅ Using GRADE {request.grade} defaults:")
            print(f"      - Short Answer: {defaults.short_answer}")
            print(f"      - MCQ: {defaults.mcq}")
            print(f"      - Fill in Blanks: {defaults.fill_in_the_blanks}")
        
        print(f"{'='*80}\n")
        
        # 1️⃣ Get Pinecone index
        pinecone_index = get_pinecone_index(index_name)
        
        # 2️⃣ Build prompt using modular system
        print("🔨 Building modular prompt...")
        prompt_template = create_prompt(
            subject=request.subject,
            grade=request.grade,
            task_type=request.task_type,
            short_answer=request.custom_short_answer,
            mcq=request.custom_mcq,
            fill_in_the_blanks=request.custom_fill_in_the_blanks,
            true_false=request.custom_true_false,
            matching=request.custom_matching
        )
        print(f"✅ Prompt built: {request.subject} | Grade {request.grade} | {request.task_type}")
        
        # 3️⃣ Retrieve relevant chunks
        print("\n📄 Retrieving chunks...")
        chunks = retriever.retrieve(
            index=pinecone_index,
            topic=topic,
            top_k=5,
            namespace=namespace
        )
        
        if not chunks:
            raise HTTPException(
                status_code=404,
                detail=f"No relevant content found for topic: {topic}"
            )
        
        print(f"   Retrieved {len(chunks)} chunks")
        for i, chunk in enumerate(chunks[:3], 1):
            print(f"   Chunk {i}: Score={chunk['score']:.4f}, "
                  f"Preview={chunk['text'][:80]}...")
        
        # 4️⃣ Combine context
        context_text = "\n\n---\n\n".join([c['text'] for c in chunks])
        print(f"\n📝 Context length: {len(context_text)} characters")
        
        # 5️⃣ Build RAG chain
        rag_chain = (
            prompt_template
            | llm
            | StrOutputParser()
        )
        
        # 6️⃣ Generate questions
        print(f"\n🤖 Generating {request.task_type} questions with LLM...")
        raw_output = rag_chain.invoke({
            "context": context_text,
            "question": topic
        })
        
        print("\n🧠 LLM Output received")
        print("-" * 80)
        print(raw_output[:300] + "..." if len(raw_output) > 300 else raw_output)
        print("-" * 80)
        
        # 7️⃣ Extract and validate JSON
        questions_data = extract_json(raw_output)
        
        # Ensure all expected keys exist
        expected_keys = []
        if request.custom_short_answer is None or request.custom_short_answer > 0:
            expected_keys.append('short_answer')
        elif request.custom_short_answer == 0:
            questions_data.pop('short_answer', None)
        
        if request.custom_mcq is None or request.custom_mcq > 0:
            expected_keys.append('mcq')
        elif request.custom_mcq == 0:
            questions_data.pop('mcq', None)
        
        if request.custom_fill_in_the_blanks is None or request.custom_fill_in_the_blanks > 0:
            expected_keys.append('fill_in_the_blanks')
        elif request.custom_fill_in_the_blanks == 0:
            questions_data.pop('fill_in_the_blanks', None)
        
        if request.custom_true_false and request.custom_true_false > 0:
            expected_keys.append('true_false')
        
        if request.custom_matching and request.custom_matching > 0:
            expected_keys.append('matching')
        
        for key in expected_keys:
            if key not in questions_data:
                questions_data[key] = []
        
        # 8️⃣ Save to file
        safe_topic = topic.replace(" ", "_").replace("/", "_")
        safe_subject = request.subject.replace(" ", "_")
        filename = f"questions_{safe_subject}_grade{request.grade}_{request.task_type}_{safe_topic}.json"
        
        output_data = {
            "topic": topic,
            "subject": request.subject,
            "grade": request.grade,
            "task_type": request.task_type,
            "question_config": {
                "short_answer": request.custom_short_answer,
                "mcq": request.custom_mcq,
                "fill_in_the_blanks": request.custom_fill_in_the_blanks,
                "true_false": request.custom_true_false,
                "matching": request.custom_matching
            },
            "retrieval_info": {
                "chunks_used": len(chunks),
                "namespace": namespace,
                "index": index_name
            },
            "questions": questions_data
        }
        
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ Saved to: {filename}")
        print(f"{'='*80}\n")
        
        # 9️⃣ Return response
        return {
            "topic": topic,
            "subject": request.subject,
            "grade": request.grade,
            "task_type": request.task_type,
            "questions_json": questions_data,
            "retrieval_info": {
                "chunks_retrieved": len(chunks),
                "namespace": namespace,
                "index": index_name,
                "prompt_type": f"{request.subject} | Grade {request.grade} | {request.task_type}"
            },
            "question_config": output_data["question_config"],
            "saved_file": filename
        }
    
    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse LLM output as JSON: {str(e)}"
        )
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"{type(e).__name__}: {str(e)}"
        )


# -----------------------------
# 8️⃣ API Endpoint - Get Default Config
# -----------------------------
@router.get("/question-defaults/{grade}")
def get_question_defaults(grade: str):
    """
    Get default question configuration for a grade level.
    Helps frontend show defaults before teacher customizes.
    """
    try:
        defaults = prompt_builder.get_grade_defaults(grade)
        
        return {
            "grade": grade,
            "defaults": {
                "short_answer": defaults.short_answer,
                "mcq": defaults.mcq,
                "fill_in_the_blanks": defaults.fill_in_the_blanks,
                "true_false": defaults.true_false,
                "matching": defaults.matching
            },
            "message": f"Default configuration for Grade {grade}"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get defaults: {str(e)}"
        )


# -----------------------------
# 9️⃣ API Endpoint - Preview Prompt
# -----------------------------
@router.post("/preview-prompt")
def preview_prompt(request: TaskRequest):
    """
    Preview the prompt that will be used (for debugging/transparency).
    """
    try:
        prompt_template = create_prompt(
            subject=request.subject,
            grade=request.grade,
            task_type=request.task_type,
            short_answer=request.custom_short_answer,
            mcq=request.custom_mcq,
            fill_in_the_blanks=request.custom_fill_in_the_blanks,
            true_false=request.custom_true_false,
            matching=request.custom_matching
        )
        
        # Show prompt with sample context
        sample_context = "[Sample textbook content would appear here]"
        sample_question = request.topic or "Sample Topic"
        
        rendered_prompt = prompt_template.format(
            context=sample_context,
            question=sample_question
        )
        
        return {
            "subject": request.subject,
            "grade": request.grade,
            "task_type": request.task_type,
            "prompt_preview": rendered_prompt[:1000] + "..." if len(rendered_prompt) > 1000 else rendered_prompt,
            "full_length": len(rendered_prompt)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to preview prompt: {str(e)}"
        )


# -----------------------------
# 🔟 API Endpoint - List Task Types
# -----------------------------
@router.get("/task-types")
def list_task_types():
    """List available task types and their characteristics."""
    return {
        "task_types": [
            {
                "name": "homework",
                "display_name": "Homework Assignment",
                "description": "Practice and reinforcement, includes hints and scaffolding",
                "characteristics": [
                    "Mix of difficulty levels (60% medium, 30% easy, 10% hard)",
                    "Detailed explanations in answers",
                    "Step-by-step solutions",
                    "Learning-focused feedback",
                    "30-45 minutes completion time"
                ]
            },
            {
                "name": "test",
                "display_name": "Assessment/Test",
                "description": "Evaluation and measurement, clear and unambiguous",
                "characteristics": [
                    "Balanced difficulty (50% medium, 25% easy, 25% hard)",
                    "Clear, definitive answers",
                    "No hints or scaffolding",
                    "Assessment-focused",
                    "40-60 minutes completion time"
                ]
            }
        ]
    }


# -----------------------------
# 1️⃣1️⃣ API Endpoint - Save Questions
# -----------------------------
@router.post("/save-questions")
def save_questions(request: SaveQuestionsRequest):
    """Save questions to MongoDB."""
    try:
        from db import get_collection
        
        coll = get_collection("questions")
        docs = []
        
        for qtype in ["short_answer", "mcq", "fill_in_the_blanks", "true_false", "matching"]:
            for q in request.questions_json.get(qtype, []):
                docs.append({
                    "topic": request.topic,
                    "type": qtype,
                    "question": q.get("question"),
                    "answer": q.get("answer"),
                    "options": q.get("options"),
                    "marks": q.get("marks", 1)
                })
        
        if not docs:
            raise HTTPException(status_code=400, detail="No questions to save")
        
        result = coll.insert_many(docs)
        
        return {
            "success": True,
            "message": f"Saved {len(docs)} questions",
            "inserted_count": len(result.inserted_ids)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save: {str(e)}"
        )