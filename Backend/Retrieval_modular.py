"""
UPDATED RETRIEVAL SYSTEM WITH MODULAR PROMPTS + DETERMINISTIC SCORING
=======================================================================
Supports:
- Homework vs Test modes
- Grade-specific defaults
- Teacher customization
- Subject-specific instructions
- Deterministic server-side scoring (LLM marks are overwritten)
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

# Import deterministic scoring
from scoring_config import apply_scoring, compute_expected_total, get_marks_for_type, QuestionType

load_dotenv()

# -----------------------------
# FastAPI Router
# -----------------------------
router = APIRouter(tags=["retrieval"])

# -----------------------------
# Request Schemas
# -----------------------------
class TaskRequest(BaseModel):
    topic: str
    grade: str
    subject: str
    task_type: str = "homework"
    namespace: Optional[str] = None

    # Optional: Teacher can customize question counts
    custom_short_answer: Optional[int] = None
    custom_mcq: Optional[int] = None
    custom_fill_in_the_blanks: Optional[int] = None
    custom_true_false: Optional[int] = None
    custom_matching: Optional[int] = None


class SaveQuestionsRequest(BaseModel):
    topic: str
    questions_json: dict


class MarksPreviewRequest(BaseModel):
    """
    Request to compute expected total marks before generation.
    Lets the teacher see the mark distribution upfront.
    If counts are None, grade defaults are used.
    """
    grade: str
    subject: str
    custom_short_answer: Optional[int] = None
    custom_mcq: Optional[int] = None
    custom_fill_in_the_blanks: Optional[int] = None
    custom_true_false: Optional[int] = None
    custom_matching: Optional[int] = None


# -----------------------------
# 1️⃣ Initialize Pinecone
# -----------------------------
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
_DEFAULT_INDEX = os.getenv("INDEX_NAME", "grade-5")
pc = Pinecone(api_key=PINECONE_API_KEY)

_index_cache: Dict[str, Any] = {}

def get_pinecone_index(index_name: str):
    if index_name in _index_cache:
        return _index_cache[index_name]

    try:
        idx = pc.Index(index_name)
        _index_cache[index_name] = idx
        print(f"✅ Connected to Pinecone index: {index_name}")
        return idx
    except Exception as primary_err:
        if index_name == _DEFAULT_INDEX:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Pinecone index '{index_name}' not found. "
                    f"Please create it in your Pinecone project or update INDEX_NAME in .env."
                )
            )

        print(f"⚠️  Index '{index_name}' not found ({primary_err}). Falling back to '{_DEFAULT_INDEX}'.")
        try:
            idx = pc.Index(_DEFAULT_INDEX)
            _index_cache[index_name] = idx
            print(f"✅ Using fallback index: {_DEFAULT_INDEX}")
            return idx
        except Exception as fallback_err:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Index '{index_name}' not found and fallback '{_DEFAULT_INDEX}' also failed. "
                    f"Check your Pinecone project. Error: {fallback_err}"
                )
            )


def derive_index_name(grade: str) -> str:
    import re as _re
    match = _re.search(r'(\d+)', str(grade))
    if match:
        return f"grade-{match.group(1)}"
    return _DEFAULT_INDEX


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
llm = GoogleGenerativeAI(
    model="models/gemini-flash-latest",
)
print("✅ Initialized Gemini LLM")

# -----------------------------
# 4️⃣ Initialize Prompt Builder
# -----------------------------
prompt_builder = PromptBuilder()
print("✅ Modular prompt builder initialized")


# -----------------------------
# 5️⃣ Smart Retriever
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
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)

    match = re.search(r'\{.*\}', text, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in LLM output")

    return json.loads(match.group())


def _resolve_counts(request: TaskRequest, defaults) -> Dict[str, int]:
    """
    Merge teacher-supplied custom counts with grade defaults.
    Returns a clean dict of {type: count} with all types present.
    """
    return {
        "short_answer":       request.custom_short_answer       if request.custom_short_answer       is not None else defaults.short_answer,
        "mcq":                request.custom_mcq                if request.custom_mcq                is not None else defaults.mcq,
        "fill_in_the_blanks": request.custom_fill_in_the_blanks if request.custom_fill_in_the_blanks is not None else defaults.fill_in_the_blanks,
        "true_false":         request.custom_true_false         if request.custom_true_false         is not None else defaults.true_false,
        "matching":           request.custom_matching           if request.custom_matching           is not None else defaults.matching,
    }


# -----------------------------
# 7️⃣ API Endpoint - Generate Questions
# -----------------------------
@router.post("/generate-task")
def generate_task(request: TaskRequest):
    """
    Generate questions with modular prompts + deterministic server-side scoring.

    Scoring contract:
    - Marks are NEVER taken from the LLM output.
    - All marks are computed by apply_scoring() based on grade band + question type.
    - The response includes a full mark breakdown so the frontend can render a mark sheet.
    """
    topic = request.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic cannot be empty")

    # Validate task_type early — don't let bad values silently fall through
    if request.task_type.lower() not in ("homework", "test"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid task_type '{request.task_type}'. Must be 'homework' or 'test'."
        )

    try:
        index_name = derive_index_name(request.grade)
        namespace = request.namespace or derive_namespace(request.grade, request.subject)

        defaults = prompt_builder.get_grade_defaults(request.grade)
        resolved_counts = _resolve_counts(request, defaults)

        print(f"\n{'='*80}")
        print(f"📚 GENERATING {request.task_type.upper()} QUESTIONS")
        print(f"   Topic: {topic} | Subject: {request.subject} | Grade: {request.grade}")
        print(f"   Index: {index_name} | Namespace: {namespace}")
        print(f"   Resolved question counts: {resolved_counts}")
        print(f"{'='*80}\n")

        # ── Step 1: Expected marks preview (computed BEFORE LLM call) ──────────
        expected_scoring = compute_expected_total(
            grade=request.grade,
            short_answer=resolved_counts["short_answer"],
            mcq=resolved_counts["mcq"],
            fill_in_the_blanks=resolved_counts["fill_in_the_blanks"],
            true_false=resolved_counts["true_false"],
            matching=resolved_counts["matching"],
        )
        print(f"📊 Expected total marks (pre-generation): {expected_scoring['total_marks']}")

        # ── Step 2: Connect to Pinecone ────────────────────────────────────────
        pinecone_index = get_pinecone_index(index_name)

        # ── Step 3: Build prompt ───────────────────────────────────────────────
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

        # ── Step 4: Retrieve context chunks ───────────────────────────────────
        chunks = retriever.retrieve(
            index=pinecone_index,
            topic=topic,
            top_k=5,
            namespace=namespace
        )

        if not chunks:
            raise HTTPException(
                status_code=404,
                detail=f"No relevant content found for topic: '{topic}'. "
                       f"Verify the namespace '{namespace}' has ingested content."
            )

        print(f"   Retrieved {len(chunks)} chunks (top score: {chunks[0]['score']:.4f})")

        context_text = "\n\n---\n\n".join([c['text'] for c in chunks])

        # ── Step 5: LLM generation ─────────────────────────────────────────────
        rag_chain = prompt_template | llm | StrOutputParser()
        raw_output = rag_chain.invoke({
            "context": context_text,
            "question": topic
        })
        print(f"🧠 LLM output length: {len(raw_output)} chars")

        # ── Step 6: Parse JSON ─────────────────────────────────────────────────
        questions_data = extract_json(raw_output)

        # Clean up keys the teacher explicitly set to 0
        for key, count in resolved_counts.items():
            if count == 0:
                questions_data.pop(key, None)

        # Ensure all non-zero types have at least an empty list
        for key, count in resolved_counts.items():
            if count > 0 and key not in questions_data:
                print(f"⚠️  LLM did not return '{key}' — defaulting to empty list")
                questions_data[key] = []

        # ── Step 7: Apply deterministic scoring ───────────────────────────────
        scoring_result = apply_scoring(questions_data, request.grade)

        # Sanity check: warn if LLM returned fewer questions than expected
        for qtype, expected_count in resolved_counts.items():
            actual_count = scoring_result.count_per_type.get(qtype, 0)
            if expected_count > 0 and actual_count < expected_count:
                print(
                    f"⚠️  {qtype}: expected {expected_count}, got {actual_count} valid questions. "
                    f"LLM may have skipped or malformed some."
                )

        # ── Step 8: Save to file ──────────────────────────────────────────────
        safe_topic = topic.replace(" ", "_").replace("/", "_")
        safe_subject = request.subject.replace(" ", "_")
        filename = f"questions_{safe_subject}_grade{request.grade}_{request.task_type}_{safe_topic}.json"

        output_data = {
            "topic": topic,
            "subject": request.subject,
            "grade": request.grade,
            "task_type": request.task_type,
            "scoring": {
                "total_marks": scoring_result.total_marks,
                "grade_band": scoring_result.grade_band,
                "marks_per_type": scoring_result.marks_per_type,
                "count_per_type": scoring_result.count_per_type,
                "subtotal_per_type": scoring_result.subtotal_per_type,
            },
            "retrieval_info": {
                "chunks_used": len(chunks),
                "namespace": namespace,
                "index": index_name
            },
            "questions": scoring_result.questions,
        }

        with open(filename, "w", encoding="utf-8") as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)

        print(f"✅ Saved to: {filename}")
        print(f"📊 Final scoring — total: {scoring_result.total_marks} marks")
        for qtype, subtotal in scoring_result.subtotal_per_type.items():
            if subtotal > 0:
                print(
                    f"   {qtype}: {scoring_result.count_per_type[qtype]} × "
                    f"{scoring_result.marks_per_type[qtype]}m = {subtotal}m"
                )
        print(f"{'='*80}\n")

        # ── Step 9: Response ──────────────────────────────────────────────────
        return {
            "topic": topic,
            "subject": request.subject,
            "grade": request.grade,
            "task_type": request.task_type,
            "questions_json": scoring_result.questions,
            "scoring": {
                "total_marks": scoring_result.total_marks,
                "grade_band": scoring_result.grade_band,
                "marks_per_type": scoring_result.marks_per_type,
                "count_per_type": scoring_result.count_per_type,
                "subtotal_per_type": scoring_result.subtotal_per_type,
            },
            "retrieval_info": {
                "chunks_retrieved": len(chunks),
                "namespace": namespace,
                "index": index_name,
                "prompt_type": f"{request.subject} | Grade {request.grade} | {request.task_type}"
            },
            "question_config": resolved_counts,
            "saved_file": filename
        }

    except json.JSONDecodeError as e:
        print(f"❌ JSON parsing error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse LLM output as JSON: {str(e)}"
        )

    except HTTPException:
        raise  # re-raise our own HTTP errors cleanly

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"{type(e).__name__}: {str(e)}"
        )


# -----------------------------
# 8️⃣ Marks Preview (NEW)
# -----------------------------
@router.post("/marks-preview")
def marks_preview(request: MarksPreviewRequest):
    """
    Compute expected total marks BEFORE generation.

    Call this as the teacher configures the assignment so the UI can show:
    "This test will be out of 32 marks" before hitting Generate.

    If custom counts are None, grade defaults are used.
    """
    try:
        defaults = prompt_builder.get_grade_defaults(request.grade)

        short_answer       = request.custom_short_answer       if request.custom_short_answer       is not None else defaults.short_answer
        mcq                = request.custom_mcq                if request.custom_mcq                is not None else defaults.mcq
        fill_in_the_blanks = request.custom_fill_in_the_blanks if request.custom_fill_in_the_blanks is not None else defaults.fill_in_the_blanks
        true_false         = request.custom_true_false         if request.custom_true_false         is not None else defaults.true_false
        matching           = request.custom_matching           if request.custom_matching           is not None else defaults.matching

        result = compute_expected_total(
            grade=request.grade,
            short_answer=short_answer,
            mcq=mcq,
            fill_in_the_blanks=fill_in_the_blanks,
            true_false=true_false,
            matching=matching,
        )

        return {
            "grade": request.grade,
            "subject": request.subject,
            "grade_band": result["grade_band"],
            "expected_total_marks": result["total_marks"],
            "breakdown": result["breakdown"],
            "note": (
                "Marks are assigned server-side based on grade band and question type. "
                "short_answer > mcq/matching > fill_in_the_blanks > true_false."
            )
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute marks preview: {str(e)}")


# -----------------------------
# 9️⃣ Question Defaults
# -----------------------------
@router.get("/question-defaults/{grade}")
def get_question_defaults(grade: str):
    """
    Get default question config + expected marks for a grade level.
    Now also returns the per-type mark weights so the frontend can show
    "each short answer = 4 marks" etc.
    """
    try:
        from scoring_config import get_marks_for_type, QuestionType, get_grade_band

        defaults = prompt_builder.get_grade_defaults(grade)
        band = get_grade_band(grade)

        mark_weights = {
            qt.value: get_marks_for_type(grade, qt)
            for qt in QuestionType
        }

        # Compute expected total with grade defaults
        expected = compute_expected_total(
            grade=grade,
            short_answer=defaults.short_answer,
            mcq=defaults.mcq,
            fill_in_the_blanks=defaults.fill_in_the_blanks,
            true_false=defaults.true_false,
            matching=defaults.matching,
        )

        return {
            "grade": grade,
            "grade_band": band.value,
            "defaults": {
                "short_answer":       defaults.short_answer,
                "mcq":                defaults.mcq,
                "fill_in_the_blanks": defaults.fill_in_the_blanks,
                "true_false":         defaults.true_false,
                "matching":           defaults.matching,
            },
            "mark_weights": mark_weights,
            "expected_total_marks_with_defaults": expected["total_marks"],
            "message": f"Default configuration for Grade {grade}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get defaults: {str(e)}")


# -----------------------------
# 🔟 Preview Prompt
# -----------------------------
@router.post("/preview-prompt")
def preview_prompt(request: TaskRequest):
    """Preview the prompt that will be used (for debugging/transparency)."""
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

        rendered_prompt = prompt_template.format(
            context="[Sample textbook content would appear here]",
            question=request.topic or "Sample Topic"
        )

        return {
            "subject": request.subject,
            "grade": request.grade,
            "task_type": request.task_type,
            "prompt_preview": rendered_prompt[:1000] + "..." if len(rendered_prompt) > 1000 else rendered_prompt,
            "full_length": len(rendered_prompt)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to preview prompt: {str(e)}")


# -----------------------------
# 1️⃣1️⃣ Task Types
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
# 1️⃣2️⃣ Save Questions
# -----------------------------
@router.post("/save-questions")
def save_questions(request: SaveQuestionsRequest):
    """
    Save scored questions to MongoDB.
    Expects questions that have already been through apply_scoring()
    (i.e., each question object has a valid `marks` field).
    """
    try:
        from core.database import questions_collection as coll
        docs = []

        for qtype in ["short_answer", "mcq", "fill_in_the_blanks", "true_false", "matching"]:
            for q in request.questions_json.get(qtype, []):
                if not isinstance(q, dict):
                    continue
                docs.append({
                    "topic":    request.topic,
                    "type":     qtype,
                    "question": q.get("question"),
                    "answer":   q.get("answer"),
                    "options":  q.get("options"),
                    "marks":    q.get("marks", 1),   # already set by apply_scoring()
                })

        if not docs:
            raise HTTPException(status_code=400, detail="No valid questions to save")

        result = coll.insert_many(docs)

        return {
            "success": True,
            "message": f"Saved {len(docs)} questions",
            "inserted_count": len(result.inserted_ids)
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to save: {str(e)}")