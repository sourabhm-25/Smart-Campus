"""
Production-Ready Pinecone Retrieval System
Optimized for accurate chunk retrieval with short topic queries
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv

from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_google_genai import GoogleGenerativeAI

import json
import re

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
    grade: Optional[str] = None  # e.g., "5", "8"
    subject: Optional[str] = None  # e.g., "Mathematics", "Science"
    namespace: Optional[str] = "grade8_math"  # Pinecone namespace (must match storage namespace)

class SaveQuestionsRequest(BaseModel):
    topic: str
    questions_json: dict


# -----------------------------
# 1️⃣ Initialize Pinecone
# -----------------------------
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = os.getenv("INDEX_NAME", "textbook-vectors")

pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(INDEX_NAME)

print(f"✅ Connected to Pinecone index: {INDEX_NAME}")

# -----------------------------
# 2️⃣ Initialize Embedding Model
# -----------------------------
# Using BGE model for better retrieval (same as your chunking system)
EMBEDDING_MODEL = "BAAI/bge-base-en-v1.5"
embedding_model = SentenceTransformer(EMBEDDING_MODEL)
embedding_dimension = embedding_model.get_sentence_embedding_dimension()

print(f"✅ Loaded embedding model: {EMBEDDING_MODEL} (dim: {embedding_dimension})")

# -----------------------------
# 3️⃣ Initialize Gemini LLM
# -----------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyBzB85xCD836_SSyQ0xRXLbl_MDgAMoC5s")
os.environ['GOOGLE_API_KEY'] = GEMINI_API_KEY
llm = GoogleGenerativeAI(model="models/gemini-2.5-flash", temperature=0.3)

print("✅ Initialized Gemini LLM")


# -----------------------------
# 4️⃣ Advanced Retrieval Class
# -----------------------------
class SmartRetriever:
    """
    Smart retrieval system optimized for short topic queries
    Combines semantic search with metadata filtering
    """
    
    def __init__(self, index, embedding_model):
        self.index = index
        self.embedding_model = embedding_model
    
    def enhance_query(self, topic: str) -> str:
        """
        Enhance short topic queries for better retrieval.
        Uses the SAME instruction prefix as Store_pinecone.py for consistency.
        """
        # IMPORTANT: Must match the prefix used during embedding storage!
        # Store_pinecone.py uses: "Represent this educational content for retrieval: {text}"
        enhanced = f"Represent this educational content for retrieval: {topic}"
        
        return enhanced
    
    def retrieve(
        self,
        topic: str,
        top_k: int = 5,
        namespace: str = "",
        grade: Optional[str] = None,
        subject: Optional[str] = None,
        filters: Optional[Dict] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant chunks with advanced filtering
        
        Args:
            topic: Topic query (e.g., "Cube Roots")
            top_k: Number of chunks to retrieve
            namespace: Pinecone namespace
            grade: Grade level filter
            subject: Subject filter
            filters: Additional metadata filters
            
        Returns:
            List of retrieved chunks with metadata
        """
        
        # 1. Enhance query
        enhanced_query = self.enhance_query(topic)
        
        # 2. Generate embedding
        query_embedding = self.embedding_model.encode(enhanced_query).tolist()
        
        # 3. Build metadata filters
        metadata_filter = {}
        
        if filters:
            metadata_filter = filters
        else:
            # Build filter from parameters
            if grade:
                metadata_filter['grade_level'] = grade
            
            if subject:
                metadata_filter['subject'] = subject
        
        # 4. Query Pinecone
        results = self.index.query(
            vector=query_embedding,
            top_k=top_k * 2,  # Retrieve more for re-ranking
            namespace=namespace,
            filter=metadata_filter if metadata_filter else None,
            include_metadata=True
        )
        
        # 5. Re-rank results for accuracy
        ranked_chunks = self._rerank_results(results['matches'], topic, top_k)
        
        # 6. Format output
        formatted_chunks = []
        for match in ranked_chunks:
            formatted_chunks.append({
                'text': match['metadata'].get('text', ''),
                'score': match['score'],
                'metadata': {
                    'heading_path': match['metadata'].get('heading_path', ''),
                    'content_type': match['metadata'].get('content_type', ''),
                    'has_math_formulas': match['metadata'].get('has_math_formulas', False),
                    'has_questions': match['metadata'].get('has_questions', False),
                    'has_examples': match['metadata'].get('has_examples', False),
                    'has_definitions': match['metadata'].get('has_definitions', False),
                    'document_id': match['metadata'].get('document_id', ''),
                    'chunk_id': match['metadata'].get('chunk_id', ''),
                }
            })
        
        return formatted_chunks
    
    def _rerank_results(
        self,
        matches: List[Dict],
        topic: str,
        top_k: int
    ) -> List[Dict]:
        """
        Re-rank results for better accuracy
        Prioritizes chunks with:
        - Higher semantic similarity
        - Definitions (for concept topics)
        - Examples (for application topics)
        - Questions (for practice topics)
        """
        
        topic_lower = topic.lower()
        
        # Assign bonus scores
        for match in matches:
            bonus = 0.0
            metadata = match.get('metadata', {})
            
            # Boost for content type relevance
            content_type = metadata.get('content_type', '')
            
            if 'definition' in topic_lower or 'what is' in topic_lower:
                if metadata.get('has_definitions'):
                    bonus += 0.1
                if content_type == 'definition':
                    bonus += 0.15
            
            if 'example' in topic_lower or 'application' in topic_lower:
                if metadata.get('has_examples'):
                    bonus += 0.1
            
            if 'question' in topic_lower or 'practice' in topic_lower:
                if metadata.get('has_questions'):
                    bonus += 0.1
            
            # Boost for math content if topic seems mathematical
            math_keywords = ['calculate', 'solve', 'formula', 'equation', 'root', 'square']
            if any(kw in topic_lower for kw in math_keywords):
                if metadata.get('has_math_formulas'):
                    bonus += 0.1
            
            # Apply bonus
            match['score'] = match['score'] + bonus
        
        # Sort by adjusted score
        matches.sort(key=lambda x: x['score'], reverse=True)
        
        return matches[:top_k]
    
    def retrieve_with_context(
        self,
        topic: str,
        top_k: int = 5,
        namespace: str = "",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Retrieve chunks and also get surrounding context (prev/next chunks)
        for better coherence
        """
        
        # Get main chunks
        main_chunks = self.retrieve(topic, top_k, namespace, **kwargs)
        
        # For top 2 chunks, get their neighbors for context
        enhanced_chunks = []
        seen_ids = set()
        
        for i, chunk in enumerate(main_chunks):
            if i < 2:  # Only enhance top 2
                chunk_id = chunk['metadata'].get('chunk_id')
                prev_id = chunk['metadata'].get('prev_chunk_id')
                next_id = chunk['metadata'].get('next_chunk_id')
                
                # Try to fetch prev and next chunks
                context_ids = [cid for cid in [prev_id, next_id] if cid]
                
                if context_ids:
                    try:
                        context_results = self.index.fetch(
                            ids=context_ids,
                            namespace=namespace
                        )
                        
                        # Add context before main chunk
                        if prev_id and prev_id in context_results['vectors']:
                            prev_chunk = context_results['vectors'][prev_id]
                            if prev_id not in seen_ids:
                                enhanced_chunks.append({
                                    'text': prev_chunk['metadata'].get('text', ''),
                                    'score': chunk['score'] * 0.8,  # Lower score
                                    'metadata': prev_chunk['metadata'],
                                    'is_context': True
                                })
                                seen_ids.add(prev_id)
                        
                        # Add main chunk
                        if chunk_id not in seen_ids:
                            enhanced_chunks.append(chunk)
                            seen_ids.add(chunk_id)
                        
                        # Add context after main chunk
                        if next_id and next_id in context_results['vectors']:
                            next_chunk = context_results['vectors'][next_id]
                            if next_id not in seen_ids:
                                enhanced_chunks.append({
                                    'text': next_chunk['metadata'].get('text', ''),
                                    'score': chunk['score'] * 0.8,
                                    'metadata': next_chunk['metadata'],
                                    'is_context': True
                                })
                                seen_ids.add(next_id)
                    
                    except Exception as e:
                        print(f"⚠️ Could not fetch context chunks: {e}")
                        if chunk_id not in seen_ids:
                            enhanced_chunks.append(chunk)
                            seen_ids.add(chunk_id)
                else:
                    if chunk_id not in seen_ids:
                        enhanced_chunks.append(chunk)
                        seen_ids.add(chunk_id)
            else:
                chunk_id = chunk['metadata'].get('chunk_id')
                if chunk_id not in seen_ids:
                    enhanced_chunks.append(chunk)
                    seen_ids.add(chunk_id)
        
        return {
            'chunks': enhanced_chunks,
            'total_retrieved': len(enhanced_chunks),
            'query': topic
        }


# -----------------------------
# 5️⃣ Initialize Retriever
# -----------------------------
retriever = SmartRetriever(index, embedding_model)
print("✅ Smart retriever initialized")


# -----------------------------
# 6️⃣ Prompt Template
# -----------------------------
prompt_template = PromptTemplate(
    template="""
You are an experienced school teacher creating homework questions for students. 
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


# -----------------------------
# 7️⃣ Utility Functions
# -----------------------------
def extract_json(text: str) -> dict:
    """Extract the first JSON object from LLM output."""
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in LLM output")
    
    return json.loads(match.group())


# -----------------------------
# 8️⃣ API Endpoint - Generate Questions
# -----------------------------
@router.post("/generate-task")
def generate_task(request: TaskRequest):
    """
    Generate questions based on topic using smart retrieval
    """
    topic = request.topic.strip()
    
    if not topic:
        raise HTTPException(status_code=400, detail="Topic cannot be empty")
    
    try:
        print(f"\n{'='*80}")
        print(f"📚 GENERATING QUESTIONS FOR TOPIC: {topic}")
        print(f"{'='*80}\n")
        
        # 1️⃣ Retrieve relevant chunks with enhanced retrieval
        retrieval_result = retriever.retrieve_with_context(
            topic=topic,
            top_k=5,
            namespace=request.namespace or "",
            grade=request.grade,
            subject=request.subject
        )
        
        chunks = retrieval_result['chunks']
        
        print(f"📄 Retrieved {len(chunks)} chunks (including context)")
        
        if not chunks:
            raise HTTPException(
                status_code=404,
                detail=f"No relevant content found for topic: {topic}"
            )
        
        # Log retrieved chunks
        print("\n📋 Retrieved Chunks:")
        for i, chunk in enumerate(chunks, 1):
            is_context = chunk.get('is_context', False)
            context_marker = " [CONTEXT]" if is_context else " [MAIN]"
            print(f"\n  Chunk {i}{context_marker}:")
            print(f"    Score: {chunk['score']:.4f}")
            print(f"    Heading: {chunk['metadata'].get('heading_path', 'N/A')[:60]}")
            print(f"    Type: {chunk['metadata'].get('content_type', 'N/A')}")
            print(f"    Preview: {chunk['text'][:100]}...")
        
        # 2️⃣ Combine context
        context_text = "\n\n---\n\n".join([chunk['text'] for chunk in chunks])
        
        print(f"\n📝 Total context length: {len(context_text)} chars")
        
        # 3️⃣ Build RAG chain
        rag_chain = (
            prompt_template
            | llm
            | StrOutputParser()
        )
        
        # 4️⃣ Invoke chain
        print("\n🤖 Generating questions with LLM...")
        raw_output = rag_chain.invoke({"context": context_text, "question": topic})
        
        print("\n🧠 RAW LLM OUTPUT:")
        print("-" * 80)
        print(raw_output[:500] + "..." if len(raw_output) > 500 else raw_output)
        print("-" * 80)
        
        # 5️⃣ Extract JSON
        questions_data = extract_json(raw_output)
        
        # 6️⃣ Validate structure
        required_keys = ['short_answer', 'mcq', 'fill_in_the_blanks']
        for key in required_keys:
            if key not in questions_data:
                questions_data[key] = []
        
        # 7️⃣ Save to file
        safe_topic = topic.replace(" ", "_").replace("/", "_")
        filename = f"questions_{safe_topic}.json"
        
        output_data = {
            "topic": topic,
            "retrieval_info": {
                "chunks_used": len(chunks),
                "headings_covered": list(set([
                    c['metadata'].get('heading_path', 'N/A') 
                    for c in chunks
                ])),
            },
            "questions": questions_data
        }
        
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ Saved questions to: {filename}")
        print(f"{'='*80}\n")
        
        # 8️⃣ Return response
        return {
            "topic": topic,
            "questions_json": questions_data,
            "retrieval_info": {
                "chunks_retrieved": len(chunks),
                "headings_covered": output_data["retrieval_info"]["headings_covered"],
            },
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
# 9️⃣ API Endpoint - Save Questions to MongoDB
# -----------------------------
@router.post("/save-questions")
def save_questions(request: SaveQuestionsRequest):
    """Save confirmed questions to MongoDB database."""
    try:
        from db import get_collection
        
        coll = get_collection("questions")
        docs = []
        
        # Transform JSON to individual question documents
        for qtype in ["short_answer", "mcq", "fill_in_the_blanks"]:
            for q in request.questions_json.get(qtype, []):
                docs.append({
                    "topic": request.topic,
                    "type": qtype,
                    "question": q.get("question"),
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


# -----------------------------
# 🔟 Debug Endpoint - Test Retrieval
# -----------------------------
@router.get("/test-retrieval")
def test_retrieval(
    topic: str,
    namespace: str = "",
    top_k: int = 5,
    grade: Optional[str] = None,
    subject: Optional[str] = None
):
    """
    Test retrieval without generating questions
    Useful for debugging and validating chunk retrieval
    """
    try:
        result = retriever.retrieve_with_context(
            topic=topic,
            top_k=top_k,
            namespace=namespace,
            grade=grade,
            subject=subject
        )
        
        # Format for readability
        formatted_chunks = []
        for chunk in result['chunks']:
            formatted_chunks.append({
                'score': chunk['score'],
                'heading_path': chunk['metadata'].get('heading_path', 'N/A'),
                'content_type': chunk['metadata'].get('content_type', 'N/A'),
                'has_math': chunk['metadata'].get('has_math_formulas', False),
                'has_examples': chunk['metadata'].get('has_examples', False),
                'has_questions': chunk['metadata'].get('has_questions', False),
                'text_preview': chunk['text'][:200] + "...",
                'is_context': chunk.get('is_context', False)
            })
        
        return {
            "query": topic,
            "total_chunks": len(formatted_chunks),
            "chunks": formatted_chunks
        }
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Retrieval test failed: {str(e)}"
        )