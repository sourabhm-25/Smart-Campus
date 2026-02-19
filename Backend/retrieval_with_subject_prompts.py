"""
Production-Ready Pinecone Retrieval System
WITH SUBJECT-SPECIFIC PROMPTS
Optimized for accurate chunk retrieval with customized question generation per subject
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
    grade: Optional[str] = None  # e.g., "Grade 5", "Grade 8"
    subject: str = "General"  # e.g., "Mathematics", "Science", "History", "English"
    namespace: Optional[str] = None  # Pinecone namespace (auto-derived from grade+subject if not provided)

class SaveQuestionsRequest(BaseModel):
    topic: str
    questions_json: dict


# -----------------------------
# 1️⃣ Initialize Pinecone Client
# -----------------------------
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

pc = Pinecone(api_key=PINECONE_API_KEY)

# Cache for Pinecone index objects (to avoid re-creating on every request)
_index_cache: Dict[str, Any] = {}

def get_pinecone_index(index_name: str):
    """Get or create a Pinecone index connection (cached)."""
    if index_name not in _index_cache:
        _index_cache[index_name] = pc.Index(index_name)
        print(f"✅ Connected to Pinecone index: {index_name}")
    return _index_cache[index_name]

def derive_index_name(grade: Optional[str]) -> str:
    """Derive Pinecone index name from grade. E.g., 'Grade 5' -> 'grade-5'"""
    if not grade:
        return os.getenv("INDEX_NAME", "grade-5")  # fallback
    # Extract number from grade string like "Grade 5", "grade 8", "5", "8"
    import re as _re
    match = _re.search(r'(\d+)', grade)
    if match:
        return f"grade-{match.group(1)}"
    return os.getenv("INDEX_NAME", "grade-5")  # fallback

def derive_namespace(grade: Optional[str], subject: Optional[str]) -> str:
    """Derive Pinecone namespace from grade+subject. E.g., 'Grade 8' + 'Mathematics' -> 'grade8_math'"""
    if not grade or not subject:
        return ""
    import re as _re
    match = _re.search(r'(\d+)', grade)
    grade_num = match.group(1) if match else "5"
    # Map subject to short key
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

print(f"✅ Pinecone client initialized (dynamic index per grade)")

# -----------------------------
# 2️⃣ Initialize Embedding Model
# -----------------------------
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
# 4️⃣ SUBJECT-SPECIFIC PROMPTS
# -----------------------------
class SubjectPrompts:
    """
    Subject-specific prompt templates for different educational subjects.
    Each subject has customized instructions and question types.
    """
    
    @staticmethod
    def get_prompt_for_subject(subject: str) -> PromptTemplate:
        """
        Get the appropriate prompt template based on subject.
        
        Args:
            subject: Subject name (Mathematics, Science, History, English, etc.)
            
        Returns:
            PromptTemplate customized for that subject
        """
        subject_lower = subject.lower()
        
        # Mathematics Prompt
        if "mathematics" in subject_lower:
            return PromptTemplate(
                template="""
You are a Mathematics teacher creating homework questions for students.

Based ONLY on the context provided below, create:

- 2 short-answer questions (requiring calculation or proof)
- 2 multiple-choice questions (MCQs) with 4 options each, clearly labeling a, b, c, d
- 2 fill-in-the-blank questions (focusing on formulas, properties, or definitions)

The questions should:

1. Be directly based on the provided mathematical content.
2. Test conceptual understanding, calculation skills, and problem-solving.
3. Include step-by-step solutions where applicable.
4. Progress from basic to advanced difficulty.
5. Include real-world application problems when relevant.
6. For formulas, ensure students understand when and how to apply them.

IMPORTANT FOR MATH (STRICT RULES):

- DO NOT use LaTeX.
- DO NOT use backslashes (\).
- DO NOT use $ symbols.
- Use plain Unicode mathematical symbols only.
- Use:
  × for multiplication
  ÷ for division
  ^ for exponents (example: 5^2)
  sqrt() for square roots (example: sqrt(16))
- Write equations in plain readable format.
- Ensure the output is valid JSON with no markdown formatting.
- Do NOT wrap output in ```json code blocks.

Return the result as a JSON object with three keys:
"short_answer", "mcq", "fill_in_the_blanks".

For short-answer, include detailed "solution_steps" array.

CONTEXT:
{context}

TOPIC:
{question}

JSON_OUTPUT:
""",
                input_variables=["context", "question"]
            )
        
        # Science Prompt
        elif "science" in subject_lower or "biology" in subject_lower or "chemistry" in subject_lower or "physics" in subject_lower:
            return PromptTemplate(
                template="""
You are a Science teacher creating homework questions for students.
Based ONLY on the context provided below, create:

- 2 short-answer questions (requiring explanation of concepts or processes)
- 2 multiple-choice questions (MCQs) with 4 options each, clearly labeling a, b, c, d
- 2 fill-in-the-blank questions (focusing on key terms, processes, or definitions)

The questions should:

1. Be **directly based on the provided scientific content**.
2. Test **understanding of concepts, processes, and real-world applications**.
3. Include questions about **experiments, observations, and cause-effect relationships**.
4. Reference **diagrams, activities, and examples** mentioned in the context.
5. Encourage **scientific thinking and reasoning**.
6. Use **proper scientific terminology**.
7. Connect concepts to **everyday life and natural phenomena**.

IMPORTANT FOR SCIENCE:
- Include questions about experiments and observations
- Test understanding of scientific processes (e.g., water cycle, photosynthesis)
- Ask "why" and "how" questions to develop reasoning
- Reference real-world examples and applications
- If activities are mentioned, create questions about them

Return the result as a **JSON object** with three keys: `"short_answer"`, `"mcq"`, `"fill_in_the_blanks"`.
For activities/experiments, include questions about observations and conclusions.

CONTEXT:
{context}

TOPIC:
{question}

JSON_OUTPUT:
""",
                input_variables=["context", "question"]
            )
        
        # History/Social Studies Prompt
        elif "history" in subject_lower or "social" in subject_lower or "civics" in subject_lower:
            return PromptTemplate(
                template="""
You are a History/Social Studies teacher creating homework questions for students.
Based ONLY on the context provided below, create:

- 2 short-answer questions (requiring explanation of historical events, causes, or impacts)
- 2 multiple-choice questions (MCQs) with 4 options each, clearly labeling a, b, c, d
- 2 fill-in-the-blank questions (focusing on dates, names, places, or key terms)

The questions should:

1. Be **directly based on the provided historical content**.
2. Test **understanding of events, causes, effects, and significance**.
3. Include questions about **chronology, key figures, and important dates**.
4. Encourage **critical thinking about historical patterns and connections**.
5. Ask about **causes and consequences** of historical events.
6. Test understanding of **cultural, political, and social contexts**.
7. Be **age-appropriate and avoid controversial interpretations**.

IMPORTANT FOR HISTORY:
- Include questions about causes and effects
- Test chronological understanding
- Ask about significance and impact of events
- Include questions about key figures and their contributions
- Connect historical events to present day when relevant

Return the result as a **JSON object** with three keys: `"short_answer"`, `"mcq"`, `"fill_in_the_blanks"`.

CONTEXT:
{context}

TOPIC:
{question}

JSON_OUTPUT:
""",
                input_variables=["context", "question"]
            )
        
        # English/Language Arts Prompt
        elif "english" in subject_lower or "language" in subject_lower or "literature" in subject_lower:
            return PromptTemplate(
                template="""
You are an English/Language Arts teacher creating homework questions for students.
Based ONLY on the context provided below, create:

- 2 short-answer questions (requiring explanation, analysis, or interpretation)
- 2 multiple-choice questions (MCQs) with 4 options each, clearly labeling a, b, c, d
- 2 fill-in-the-blank questions (focusing on vocabulary, grammar, or key concepts)

The questions should:

1. Be **directly based on the provided text/content**.
2. Test **reading comprehension, vocabulary, and literary analysis**.
3. Include questions about **main ideas, themes, and author's purpose**.
4. Test **grammar, usage, and language conventions** when relevant.
5. Encourage **critical thinking and interpretation**.
6. For literature, ask about **characters, plot, setting, and literary devices**.
7. For informational texts, test **summarization and inference skills**.

IMPORTANT FOR ENGLISH:
- Include comprehension questions (literal and inferential)
- Test vocabulary in context
- Ask about author's purpose and tone
- Include questions about literary elements (if applicable)
- Test ability to make connections and draw conclusions

Return the result as a **JSON object** with three keys: `"short_answer"`, `"mcq"`, `"fill_in_the_blanks"`.

CONTEXT:
{context}

TOPIC:
{question}

JSON_OUTPUT:
""",
                input_variables=["context", "question"]
            )
        
        # Geography Prompt
        elif "geography" in subject_lower:
            return PromptTemplate(
                template="""
You are a Geography teacher creating homework questions for students.
Based ONLY on the context provided below, create:

- 2 short-answer questions (requiring explanation of geographical concepts or processes)
- 2 multiple-choice questions (MCQs) with 4 options each, clearly labeling a, b, c, d
- 2 fill-in-the-blank questions (focusing on locations, terms, or geographical features)

The questions should:

1. Be **directly based on the provided geographical content**.
2. Test **understanding of physical and human geography**.
3. Include questions about **maps, landforms, climate, and resources**.
4. Test knowledge of **locations, directions, and spatial relationships**.
5. Ask about **human-environment interactions**.
6. Include questions about **countries, capitals, rivers, mountains, etc.**
7. Connect geography to **real-world issues and current events** when relevant.

IMPORTANT FOR GEOGRAPHY:
- Include map-related questions
- Test understanding of physical features and processes
- Ask about climate, vegetation, and natural resources
- Include questions about population and settlements
- Test spatial thinking and location knowledge

Return the result as a **JSON object** with three keys: `"short_answer"`, `"mcq"`, `"fill_in_the_blanks"`.

CONTEXT:
{context}

TOPIC:
{question}

JSON_OUTPUT:
""",
                input_variables=["context", "question"]
            )
        
        # Computer Science/Technology Prompt
        elif "computer" in subject_lower or "technology" in subject_lower or "coding" in subject_lower:
            return PromptTemplate(
                template="""
You are a Computer Science/Technology teacher creating homework questions for students.
Based ONLY on the context provided below, create:

- 2 short-answer questions (requiring explanation of concepts or code)
- 2 multiple-choice questions (MCQs) with 4 options each, clearly labeling a, b, c, d
- 2 fill-in-the-blank questions (focusing on syntax, terminology, or concepts)

The questions should:

1. Be **directly based on the provided technical content**.
2. Test **understanding of concepts, algorithms, and problem-solving**.
3. Include questions about **code logic and program flow** when relevant.
4. Test knowledge of **terminology, syntax, and best practices**.
5. Include **practical application scenarios**.
6. Progress from **conceptual to practical questions**.
7. If code is present, test **code reading and debugging skills**.

IMPORTANT FOR COMPUTER SCIENCE:
- Include code-related questions if context has code
- Test logical thinking and problem-solving
- Ask about algorithms and data structures
- Include questions about real-world applications
- Test understanding of concepts, not just memorization

Return the result as a **JSON object** with three keys: `"short_answer"`, `"mcq"`, `"fill_in_the_blanks"`.

CONTEXT:
{context}

TOPIC:
{question}

JSON_OUTPUT:
""",
                input_variables=["context", "question"]
            )
        
        # Economics/Business Prompt
        elif "economics" in subject_lower or "business" in subject_lower or "commerce" in subject_lower:
            return PromptTemplate(
                template="""
You are an Economics/Business teacher creating homework questions for students.
Based ONLY on the context provided below, create:

- 2 short-answer questions (requiring explanation of economic concepts or business principles)
- 2 multiple-choice questions (MCQs) with 4 options each, clearly labeling a, b, c, d
- 2 fill-in-the-blank questions (focusing on terminology, formulas, or key concepts)

The questions should:

1. Be **directly based on the provided economic/business content**.
2. Test **understanding of concepts, principles, and their applications**.
3. Include questions about **supply-demand, markets, resources, and decision-making**.
4. Test ability to **analyze economic situations and business scenarios**.
5. Include **real-world examples and case scenarios** when relevant.
6. Test understanding of **graphs, charts, and economic models** if present.
7. Encourage **critical thinking about economic choices and trade-offs**.

IMPORTANT FOR ECONOMICS:
- Include scenario-based questions
- Test understanding of economic principles in real situations
- Ask about cause-and-effect in economic contexts
- Include questions about graphs/charts if present
- Test decision-making and analysis skills

Return the result as a **JSON object** with three keys: `"short_answer"`, `"mcq"`, `"fill_in_the_blanks"`.

CONTEXT:
{context}

TOPIC:
{question}

JSON_OUTPUT:
""",
                input_variables=["context", "question"]
            )
        
        # Default/General Prompt (fallback)
        else:
            return PromptTemplate(
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
    
    @staticmethod
    def get_subject_keywords(subject: str) -> List[str]:
        """
        Get subject-specific keywords for better retrieval filtering.
        
        Args:
            subject: Subject name
            
        Returns:
            List of keywords relevant to that subject
        """
        keywords_map = {
            "mathematics": ["formula", "calculate", "solve", "equation", "proof", "theorem"],
            "science": ["experiment", "observe", "hypothesis", "process", "cycle", "system"],
            "history": ["event", "date", "period", "era", "cause", "effect", "significance"],
            "english": ["author", "theme", "character", "plot", "literary", "vocabulary"],
            "geography": ["location", "map", "region", "climate", "landform", "population"],
            "computer": ["algorithm", "code", "program", "function", "syntax", "debug"],
            "economics": ["market", "supply", "demand", "price", "cost", "profit", "trade"]
        }
        
        subject_lower = subject.lower()
        for key, keywords in keywords_map.items():
            if key in subject_lower:
                return keywords
        
        return []


# -----------------------------
# 5️⃣ Advanced Retrieval Class
# -----------------------------
class SmartRetriever:
    """
    Smart retrieval system optimized for short topic queries
    Combines semantic search with metadata filtering
    """
    
    def __init__(self, embedding_model):
        self.embedding_model = embedding_model
    
    def enhance_query(self, topic: str) -> str:
        """
        Enhance short topic queries for better retrieval.
        Uses the SAME instruction prefix as Store_pinecone.py for consistency.
        """
        enhanced = f"Represent this educational content for retrieval: {topic}"
        return enhanced
    
    def retrieve(
        self,
        index,
        topic: str,
        top_k: int = 5,
        namespace: str = "",
        grade: Optional[str] = None,
        subject: Optional[str] = None,
        filters: Optional[Dict] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant chunks with advanced filtering
        """
        
        # 1. Enhance query
        enhanced_query = self.enhance_query(topic)
        
        # 2. Generate embedding
        query_embedding = self.embedding_model.encode(enhanced_query).tolist()
        
        # 3. Build metadata filters
        # NOTE: grade/subject are already handled by index name and namespace,
        # so we only apply explicit custom filters here
        metadata_filter = {}
        
        if filters:
            metadata_filter = filters
        
        # 4. Query Pinecone
        results = index.query(
            vector=query_embedding,
            top_k=top_k * 2,
            namespace=namespace,
            filter=metadata_filter if metadata_filter else None,
            include_metadata=True
        )
        
        # 5. Re-rank results for accuracy
        ranked_chunks = self._rerank_results(
            results['matches'], 
            topic, 
            top_k,
            subject=subject
        )
        
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
        top_k: int,
        subject: Optional[str] = None
    ) -> List[Dict]:
        """
        Re-rank results based on topic and subject-specific relevance
        """
        
        topic_lower = topic.lower()
        
        # Get subject-specific keywords
        subject_keywords = SubjectPrompts.get_subject_keywords(subject or "")
        
        for match in matches:
            bonus = 0.0
            metadata = match.get('metadata', {})
            content_type = metadata.get('content_type', '')
            
            # Subject-specific boosting
            if subject:
                subject_lower = subject.lower()
                
                # Math-specific boosting
                if "math" in subject_lower:
                    if metadata.get('has_math_formulas'):
                        bonus += 0.15
                    if content_type in ['formula', 'example', 'theorem']:
                        bonus += 0.1
                
                # Science-specific boosting
                elif "science" in subject_lower:
                    if content_type in ['experiment', 'observation', 'activity']:
                        bonus += 0.15
                    if metadata.get('has_examples'):
                        bonus += 0.1
            
            # General relevance boosting
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
            
            # Apply bonus
            match['score'] = match['score'] + bonus
        
        # Sort by adjusted score
        matches.sort(key=lambda x: x['score'], reverse=True)
        
        return matches[:top_k]
    
    def retrieve_with_context(
        self,
        index,
        topic: str,
        top_k: int = 5,
        namespace: str = "",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Retrieve chunks with surrounding context
        """
        
        # Get main chunks
        main_chunks = self.retrieve(index, topic, top_k, namespace, **kwargs)
        
        # For top 2 chunks, get their neighbors
        enhanced_chunks = []
        seen_ids = set()
        
        for i, chunk in enumerate(main_chunks):
            if i < 2:
                chunk_id = chunk['metadata'].get('chunk_id')
                prev_id = chunk['metadata'].get('prev_chunk_id')
                next_id = chunk['metadata'].get('next_chunk_id')
                
                context_ids = [cid for cid in [prev_id, next_id] if cid]
                
                if context_ids:
                    try:
                        context_results = index.fetch(
                            ids=context_ids,
                            namespace=namespace
                        )
                        
                        if prev_id and prev_id in context_results['vectors']:
                            prev_chunk = context_results['vectors'][prev_id]
                            if prev_id not in seen_ids:
                                enhanced_chunks.append({
                                    'text': prev_chunk['metadata'].get('text', ''),
                                    'score': chunk['score'] * 0.8,
                                    'metadata': prev_chunk['metadata'],
                                    'is_context': True
                                })
                                seen_ids.add(prev_id)
                        
                        if chunk_id not in seen_ids:
                            enhanced_chunks.append(chunk)
                            seen_ids.add(chunk_id)
                        
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
# 6️⃣ Initialize Retriever
# -----------------------------
retriever = SmartRetriever(embedding_model)
print("✅ Smart retriever initialized")


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
    Generate questions based on topic using subject-specific prompts
    """
    topic = request.topic.strip()
    subject = request.subject or "General"
    
    if not topic:
        raise HTTPException(status_code=400, detail="Topic cannot be empty")
    
    try:
        # Derive dynamic index name and namespace from grade
        index_name = derive_index_name(request.grade)
        namespace = request.namespace or derive_namespace(request.grade, subject)
        
        print(f"\n{'='*80}")
        print(f"📚 GENERATING QUESTIONS")
        print(f"   Topic: {topic}")
        print(f"   Subject: {subject}")
        print(f"   Grade: {request.grade or 'Not specified'}")
        print(f"   Index: {index_name}")
        print(f"   Namespace: {namespace}")
        print(f"{'='*80}\n")
        
        # 1️⃣ Get dynamic Pinecone index
        pinecone_index = get_pinecone_index(index_name)
        
        # 2️⃣ Get subject-specific prompt
        prompt_template = SubjectPrompts.get_prompt_for_subject(subject)
        print(f"✅ Using {subject}-specific prompt template")
        
        # 3️⃣ Retrieve relevant chunks
        retrieval_result = retriever.retrieve_with_context(
            index=pinecone_index,
            topic=topic,
            top_k=5,
            namespace=namespace,
            grade=request.grade,
            subject=subject
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
        
        # 3️⃣ Combine context
        context_text = "\n\n---\n\n".join([chunk['text'] for chunk in chunks])
        
        print(f"\n📝 Total context length: {len(context_text)} chars")
        
        # 4️⃣ Build RAG chain with subject-specific prompt
        rag_chain = (
            prompt_template
            | llm
            | StrOutputParser()
        )
        
        # 5️⃣ Invoke chain
        print(f"\n🤖 Generating {subject} questions with LLM...")
        raw_output = rag_chain.invoke({"context": context_text, "question": topic})
        
        print("\n🧠 RAW LLM OUTPUT:")
        print("-" * 80)
        print(raw_output[:500] + "..." if len(raw_output) > 500 else raw_output)
        print("-" * 80)
        
        # 6️⃣ Extract JSON
        questions_data = extract_json(raw_output)
        
        # 7️⃣ Validate structure
        required_keys = ['short_answer', 'mcq', 'fill_in_the_blanks']
        for key in required_keys:
            if key not in questions_data:
                questions_data[key] = []
        
        # 8️⃣ Save to file
        safe_topic = topic.replace(" ", "_").replace("/", "_")
        safe_subject = subject.replace(" ", "_").replace("/", "_")
        filename = f"questions_{safe_subject}_{safe_topic}.json"
        
        output_data = {
            "topic": topic,
            "subject": subject,
            "grade": request.grade,
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
        
        # 9️⃣ Return response
        return {
            "topic": topic,
            "subject": subject,
            "grade": request.grade,
            "questions_json": questions_data,
            "retrieval_info": {
                "chunks_retrieved": len(chunks),
                "headings_covered": output_data["retrieval_info"]["headings_covered"],
                "prompt_type": f"{subject}-specific",
                "chunks": [
                    {
                        "text": c["text"][:500],
                        "score": round(c["score"], 4),
                        "heading_path": c["metadata"].get("heading_path", ""),
                        "content_type": c["metadata"].get("content_type", ""),
                    }
                    for c in chunks
                ],
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
# 9️⃣ API Endpoint - Save Questions
# -----------------------------
@router.post("/save-questions")
def save_questions(request: SaveQuestionsRequest):
    """Save confirmed questions to MongoDB database."""
    try:
        from db import get_collection
        
        coll = get_collection("questions")
        docs = []
        
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
# 🔟 API Endpoint - List Available Subjects
# -----------------------------
@router.get("/subjects")
def list_subjects():
    """
    List all available subjects with customized prompts
    """
    return {
        "subjects": [
            {
                "name": "Mathematics",
                "keywords": ["math", "mathematics", "algebra", "geometry", "calculus"],
                "features": [
                    "Step-by-step solutions",
                    "Formula applications",
                    "Real-world problems",
                    "Calculation-based questions"
                ]
            },
            {
                "name": "Science",
                "keywords": ["science", "biology", "chemistry", "physics"],
                "features": [
                    "Experiment-based questions",
                    "Process explanations",
                    "Observation questions",
                    "Real-world applications"
                ]
            },
            {
                "name": "History",
                "keywords": ["history", "social studies", "civics"],
                "features": [
                    "Cause-and-effect questions",
                    "Chronology testing",
                    "Significance analysis",
                    "Key figures and events"
                ]
            },
            {
                "name": "English",
                "keywords": ["english", "language arts", "literature"],
                "features": [
                    "Comprehension questions",
                    "Vocabulary in context",
                    "Literary analysis",
                    "Author's purpose"
                ]
            },
            {
                "name": "Geography",
                "keywords": ["geography"],
                "features": [
                    "Map-based questions",
                    "Location knowledge",
                    "Physical features",
                    "Human-environment interaction"
                ]
            },
            {
                "name": "Computer Science",
                "keywords": ["computer", "technology", "coding", "programming"],
                "features": [
                    "Code analysis",
                    "Algorithm questions",
                    "Debugging scenarios",
                    "Practical applications"
                ]
            },
            {
                "name": "Economics",
                "keywords": ["economics", "business", "commerce"],
                "features": [
                    "Scenario-based questions",
                    "Economic principles",
                    "Market analysis",
                    "Decision-making"
                ]
            },
            {
                "name": "General",
                "keywords": ["general", "other"],
                "features": [
                    "Flexible question types",
                    "Context-based",
                    "Adaptable to any subject"
                ]
            }
        ]
    }


# -----------------------------
# 1️⃣1️⃣ Debug Endpoint - Test Retrieval
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
    """
    try:
        index_name = derive_index_name(grade)
        ns = namespace or derive_namespace(grade, subject)
        pinecone_index = get_pinecone_index(index_name)
        
        result = retriever.retrieve_with_context(
            index=pinecone_index,
            topic=topic,
            top_k=top_k,
            namespace=ns,
            grade=grade,
            subject=subject
        )
        
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
            "subject": subject,
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