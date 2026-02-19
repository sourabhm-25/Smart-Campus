"""
Production-Ready Markdown Structure-Aware Chunking System
Uses open-source embedding models for maximum accuracy
Adaptive to ANY textbook structure
"""

import re
import hashlib
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
import logging
from pathlib import Path

from sentence_transformers import SentenceTransformer
from pinecone import Pinecone, ServerlessSpec
import tiktoken

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class ChunkMetadata:
    """Comprehensive metadata for each chunk"""
    chunk_id: str
    document_id: str
    chunk_index: int
    total_chunks: int
    
    # Dynamic hierarchical structure (adapts to any heading structure)
    heading_level_1: Optional[str]  # h1 (#)
    heading_level_2: Optional[str]  # h2 (##)
    heading_level_3: Optional[str]  # h3 (###)
    heading_level_4: Optional[str]  # h4 (####)
    heading_path: str  # Full path: "h1 > h2 > h3"
    
    # Content characteristics
    content_type: str
    has_math_formulas: bool
    has_tables: bool
    has_lists: bool
    has_code_blocks: bool
    has_blockquotes: bool
    has_images: bool
    
    # Educational indicators
    has_questions: bool
    has_examples: bool
    has_definitions: bool
    has_exercises: bool
    
    # Metadata for LLM understanding
    char_count: int
    word_count: int
    sentence_count: int
    
    # Chunk relationships for context reconstruction
    prev_chunk_id: Optional[str]
    next_chunk_id: Optional[str]
    parent_heading: Optional[str]
    
    # Processing info
    timestamp: str


class MarkdownStructureParser:
    """
    Intelligently parses markdown structure to understand document hierarchy
    Works with ANY heading structure - doesn't assume specific patterns
    """
    
    def __init__(self):
        self.heading_pattern = re.compile(r'^(#{1,6})\s+(.+)$', re.MULTILINE)
        self.math_pattern = re.compile(r'\$\$[^$]+\$\$|\$[^$]+\$')
        self.table_pattern = re.compile(r'^\|.+\|$', re.MULTILINE)
        self.list_pattern = re.compile(r'^\s*[\*\-\+\d\.]\s+', re.MULTILINE)
        self.code_pattern = re.compile(r'```[\s\S]+?```')
        self.blockquote_pattern = re.compile(r'^>\s+', re.MULTILINE)
        self.image_pattern = re.compile(r'!\[.*?\]\(.*?\)|illustration|image|figure|diagram|shows|depicts', re.IGNORECASE)
        self.question_pattern = re.compile(r'\?|question|find|calculate|solve|explain|what|why|how', re.IGNORECASE)
        self.example_pattern = re.compile(r'example|for instance|such as|e\.g\.|observe', re.IGNORECASE)
        self.definition_pattern = re.compile(r'is called|is defined as|means|refers to|denoted by', re.IGNORECASE)
        self.exercise_pattern = re.compile(r'exercise|activity|practice|figure it out|try|solve', re.IGNORECASE)
    
    def extract_heading_hierarchy(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract complete heading hierarchy from markdown
        Returns list of headings with their levels and positions
        """
        headings = []
        for match in self.heading_pattern.finditer(text):
            level = len(match.group(1))  # Number of # symbols
            title = match.group(2).strip()
            position = match.start()
            
            headings.append({
                'level': level,
                'title': title,
                'position': position
            })
        
        return headings
    
    def build_hierarchical_sections(self, text: str) -> List[Dict[str, Any]]:
        """
        Split document into hierarchical sections based on headings
        Each section contains its heading context and content
        """
        headings = self.extract_heading_hierarchy(text)
        
        if not headings:
            # No headings - treat entire document as one section
            return [{
                'heading_path': [],
                'content': text,
                'start_pos': 0,
                'end_pos': len(text)
            }]
        
        sections = []
        heading_stack = []  # Stack to track current hierarchy
        
        for i, heading in enumerate(headings):
            # Update heading stack based on current level
            while heading_stack and heading_stack[-1]['level'] >= heading['level']:
                heading_stack.pop()
            
            heading_stack.append(heading)
            
            # Determine section boundaries
            start_pos = heading['position']
            end_pos = headings[i + 1]['position'] if i + 1 < len(headings) else len(text)
            
            # Extract content for this section
            section_content = text[start_pos:end_pos].strip()
            
            # Build heading path (breadcrumb)
            heading_path = [h['title'] for h in heading_stack]
            
            sections.append({
                'heading_path': heading_path,
                'heading_level': heading['level'],
                'content': section_content,
                'start_pos': start_pos,
                'end_pos': end_pos
            })
        
        return sections
    
    def analyze_content_features(self, text: str) -> Dict[str, bool]:
        """
        Analyze what type of content this text contains
        """
        return {
            'has_math_formulas': bool(self.math_pattern.search(text)),
            'has_tables': bool(self.table_pattern.search(text)),
            'has_lists': bool(self.list_pattern.search(text)),
            'has_code_blocks': bool(self.code_pattern.search(text)),
            'has_blockquotes': bool(self.blockquote_pattern.search(text)),
            'has_images': bool(self.image_pattern.search(text)),
            'has_questions': bool(self.question_pattern.search(text)),
            'has_examples': bool(self.example_pattern.search(text)),
            'has_definitions': bool(self.definition_pattern.search(text)),
            'has_exercises': bool(self.exercise_pattern.search(text)),
        }


class StructureAwareChunker:
    """
    Chunks content while preserving markdown structure and semantic coherence
    Adapts to any document structure - no hardcoded assumptions
    """
    
    def __init__(
        self,
        target_chunk_size: int = 512,
        min_chunk_size: int = 100,
        max_chunk_size: int = 800,
        chunk_overlap: int = 50
    ):
        """
        Args:
            target_chunk_size: Target size in tokens (optimized for sentence-transformers)
            min_chunk_size: Minimum chunk size to avoid tiny fragments
            max_chunk_size: Maximum chunk size for context window
            chunk_overlap: Overlap in tokens between chunks
        """
        self.target_chunk_size = target_chunk_size
        self.min_chunk_size = min_chunk_size
        self.max_chunk_size = max_chunk_size
        self.chunk_overlap = chunk_overlap
        
        self.encoding = tiktoken.get_encoding("cl100k_base")
        self.parser = MarkdownStructureParser()
    
    def count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        return len(self.encoding.encode(text))
    
    def count_sentences(self, text: str) -> int:
        """Count sentences in text"""
        return len(re.split(r'[.!?]+', text))
    
    def split_into_semantic_units(self, text: str) -> List[str]:
        """
        Split text into semantic units (paragraphs/blocks) while preserving structure
        """
        # Split by double newlines (paragraph breaks)
        units = re.split(r'\n\n+', text)
        
        # Clean and filter
        units = [u.strip() for u in units if u.strip()]
        
        return units
    
    def merge_small_units(self, units: List[str], heading_context: str) -> List[str]:
        """
        Merge small units to reach target chunk size while maintaining coherence
        """
        merged = []
        current_chunk = []
        current_tokens = 0
        
        for unit in units:
            unit_tokens = self.count_tokens(unit)
            
            # If unit alone exceeds max size, split it further
            if unit_tokens > self.max_chunk_size:
                # Save current chunk if exists
                if current_chunk:
                    merged.append('\n\n'.join(current_chunk))
                    current_chunk = []
                    current_tokens = 0
                
                # Split large unit by sentences
                sentences = re.split(r'(?<=[.!?])\s+', unit)
                temp_chunk = []
                temp_tokens = 0
                
                for sentence in sentences:
                    sent_tokens = self.count_tokens(sentence)
                    
                    if temp_tokens + sent_tokens > self.target_chunk_size and temp_chunk:
                        merged.append(' '.join(temp_chunk))
                        temp_chunk = [sentence]
                        temp_tokens = sent_tokens
                    else:
                        temp_chunk.append(sentence)
                        temp_tokens += sent_tokens
                
                if temp_chunk:
                    merged.append(' '.join(temp_chunk))
                
                continue
            
            # Try to add to current chunk
            if current_tokens + unit_tokens <= self.target_chunk_size:
                current_chunk.append(unit)
                current_tokens += unit_tokens
            else:
                # Current chunk is full, save it
                if current_chunk:
                    merged.append('\n\n'.join(current_chunk))
                
                # Start new chunk
                current_chunk = [unit]
                current_tokens = unit_tokens
        
        # Add remaining chunk
        if current_chunk:
            merged.append('\n\n'.join(current_chunk))
        
        return merged
    
    def add_overlap(self, chunks: List[str]) -> List[str]:
        """
        Add overlap between consecutive chunks for context continuity
        """
        if len(chunks) <= 1 or self.chunk_overlap == 0:
            return chunks
        
        overlapped = []
        
        for i, chunk in enumerate(chunks):
            if i == 0:
                overlapped.append(chunk)
                continue
            
            # Get overlap from previous chunk
            prev_chunk = chunks[i - 1]
            prev_sentences = re.split(r'(?<=[.!?])\s+', prev_chunk)
            
            # Take last few sentences from previous chunk
            overlap_text = []
            overlap_tokens = 0
            
            for sentence in reversed(prev_sentences):
                sent_tokens = self.count_tokens(sentence)
                if overlap_tokens + sent_tokens <= self.chunk_overlap:
                    overlap_text.insert(0, sentence)
                    overlap_tokens += sent_tokens
                else:
                    break
            
            if overlap_text:
                overlapped.append(' '.join(overlap_text) + '\n\n' + chunk)
            else:
                overlapped.append(chunk)
        
        return overlapped
    
    def chunk_document(
        self,
        markdown_text: str,
        document_id: str
    ) -> List[Dict[str, Any]]:
        """
        Main chunking method - structure-aware and adaptive
        
        Args:
            markdown_text: Raw markdown content
            document_id: Unique document identifier
            
        Returns:
            List of chunks with rich metadata
        """
        # Parse document structure
        sections = self.parser.build_hierarchical_sections(markdown_text)
        
        all_chunks = []
        global_chunk_index = 0
        
        # Process each section
        for section in sections:
            heading_path = section['heading_path']
            content = section['content']
            
            # Skip empty sections
            if not content.strip():
                continue
            
            # Build heading context string
            heading_context = ' > '.join(heading_path) if heading_path else 'Root'
            
            # Split into semantic units
            units = self.split_into_semantic_units(content)
            
            # Merge units to target size
            section_chunks = self.merge_small_units(units, heading_context)
            
            # Add overlap between chunks within section
            section_chunks = self.add_overlap(section_chunks)
            
            # Create chunk objects with metadata
            for chunk_text in section_chunks:
                # Analyze content features
                features = self.parser.analyze_content_features(chunk_text)
                
                # Build hierarchical heading metadata
                heading_levels = {f'heading_level_{i+1}': None for i in range(4)}
                for i, heading in enumerate(heading_path[:4]):
                    heading_levels[f'heading_level_{i+1}'] = heading
                
                chunk_id = self._generate_chunk_id(document_id, global_chunk_index)
                
                metadata = ChunkMetadata(
                    chunk_id=chunk_id,
                    document_id=document_id,
                    chunk_index=global_chunk_index,
                    total_chunks=0,  # Will update after processing all chunks
                    **heading_levels,
                    heading_path=heading_context,
                    content_type=self._determine_content_type(features),
                    **features,
                    char_count=len(chunk_text),
                    word_count=len(chunk_text.split()),
                    sentence_count=self.count_sentences(chunk_text),
                    prev_chunk_id=self._generate_chunk_id(document_id, global_chunk_index - 1) if global_chunk_index > 0 else None,
                    next_chunk_id=None,  # Will update later
                    parent_heading=heading_path[-1] if heading_path else None,
                    timestamp=datetime.utcnow().isoformat()
                )
                
                all_chunks.append({
                    'id': chunk_id,
                    'text': chunk_text,
                    'metadata': asdict(metadata)
                })
                
                global_chunk_index += 1
        
        # Update total_chunks and next_chunk_id
        total = len(all_chunks)
        for i, chunk in enumerate(all_chunks):
            chunk['metadata']['total_chunks'] = total
            if i < total - 1:
                chunk['metadata']['next_chunk_id'] = all_chunks[i + 1]['id']
        
        logger.info(f"Created {total} chunks from {len(sections)} sections")
        return all_chunks
    
    def _determine_content_type(self, features: Dict[str, bool]) -> str:
        """Determine primary content type from features"""
        if features['has_exercises']:
            return 'exercise'
        elif features['has_questions']:
            return 'question'
        elif features['has_examples']:
            return 'example'
        elif features['has_definitions']:
            return 'definition'
        elif features['has_math_formulas']:
            return 'mathematical'
        elif features['has_tables']:
            return 'tabular'
        else:
            return 'text'
    
    def _generate_chunk_id(self, document_id: str, chunk_index: int) -> str:
        """Generate unique chunk ID"""
        base = f"{document_id}_chunk_{chunk_index}"
        return hashlib.md5(base.encode()).hexdigest()[:16]


class OpenSourceEmbeddingGenerator:
    """
    Uses open-source sentence-transformers for embeddings
    Best models for educational content
    """
    
    # Best open-source models for semantic search
    RECOMMENDED_MODELS = {
        'best_quality': 'BAAI/bge-large-en-v1.5',  # 1024 dim, best accuracy
        'balanced': 'BAAI/bge-base-en-v1.5',       # 768 dim, good speed/quality
        'fast': 'all-MiniLM-L6-v2',                # 384 dim, fastest
        'multilingual': 'paraphrase-multilingual-mpnet-base-v2',  # 768 dim
    }
    
    def __init__(self, model_name: str = 'BAAI/bge-base-en-v1.5', device: str = 'cuda'):
        """
        Initialize embedding model
        
        Args:
            model_name: Name of sentence-transformers model
            device: 'cpu' or 'cuda'
        """
        self.model_name = model_name
        self.device = device
        
        logger.info(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name, device=device)
        self.dimension = self.model.get_sentence_embedding_dimension()
        
        logger.info(f"Model loaded. Embedding dimension: {self.dimension}")
    
    def generate_embeddings(
        self,
        texts: List[str],
        batch_size: int = 32,
        show_progress: bool = True
    ) -> List[List[float]]:
        """
        Generate embeddings for list of texts
        
        Args:
            texts: List of text strings
            batch_size: Batch size for processing
            show_progress: Show progress bar
            
        Returns:
            List of embedding vectors
        """
        logger.info(f"Generating embeddings for {len(texts)} texts...")
        
        # Add instruction for better retrieval (for BGE models)
        if 'bge' in self.model_name.lower():
            texts = [f"Represent this educational content for retrieval: {text}" for text in texts]
        
        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=show_progress,
            convert_to_numpy=True
        )
        
        # Convert to list of lists
        embeddings = embeddings.tolist()
        
        logger.info(f"Generated {len(embeddings)} embeddings")
        return embeddings


class PineconeVectorStore:
    """
    Production-ready Pinecone vector store
    """
    
    def __init__(
        self,
        api_key: str,
        index_name: str,
        dimension: int,
        metric: str = 'cosine',
        cloud: str = 'aws',
        region: str = 'us-east-1'
    ):
        self.pc = Pinecone(api_key=api_key)
        self.index_name = index_name
        self.dimension = dimension
        self.metric = metric
        
        self._initialize_index(cloud, region)
        self.index = self.pc.Index(index_name)
        
        logger.info(f"Connected to Pinecone index: {index_name}")
    
    def _clean_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Pinecone only allows:
        string, number, boolean, list[str]
        Remove None and convert unsupported types.
        """
        cleaned = {}

        for k, v in metadata.items():
            if v is None:
                continue  # remove nulls

            if isinstance(v, (str, int, float, bool)):
                cleaned[k] = v

            elif isinstance(v, list):
                cleaned[k] = [str(item) for item in v if item is not None]

            else:
                cleaned[k] = str(v)

        return cleaned

    
    def _initialize_index(self, cloud: str, region: str):
        """Create index if it doesn't exist"""
        existing_indexes = [idx.name for idx in self.pc.list_indexes()]
        
        if self.index_name not in existing_indexes:
            logger.info(f"Creating index: {self.index_name}")
            self.pc.create_index(
                name=self.index_name,
                dimension=self.dimension,
                metric=self.metric,
                spec=ServerlessSpec(cloud=cloud, region=region)
            )
            logger.info("Index created successfully")
    
    def upsert_chunks(
        self,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]],
        namespace: str = "",
        batch_size: int = 100
    ):
        """Upsert chunks with embeddings"""
        if len(chunks) != len(embeddings):
            raise ValueError("Chunks and embeddings count mismatch")
        
        vectors = []
        for chunk, embedding in zip(chunks, embeddings):
            raw_metadata = {
                **chunk['metadata'],
                'text': chunk['text'][:40000]
            }

            cleaned_metadata = self._clean_metadata(raw_metadata)

            vectors.append({
                'id': chunk['id'],
                'values': embedding,
                'metadata': cleaned_metadata
            })

        
        # Upsert in batches
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            self.index.upsert(vectors=batch, namespace=namespace)
            logger.info(f"Upserted {i + len(batch)}/{len(vectors)} vectors")
        
        logger.info(f"Successfully upserted {len(vectors)} vectors")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get index statistics"""
        return self.index.describe_index_stats()


class TextbookProcessingPipeline:
    """
    Complete pipeline for processing textbooks
    """
    
    def __init__(
        self,
        pinecone_api_key: str,
        index_name: str,
        embedding_model: str = 'BAAI/bge-base-en-v1.5',
        target_chunk_size: int = 512,
        chunk_overlap: int = 50,
        device: str = 'cuda'
    ):
        # Initialize components
        self.chunker = StructureAwareChunker(
            target_chunk_size=target_chunk_size,
            chunk_overlap=chunk_overlap
        )
        
        self.embedding_generator = OpenSourceEmbeddingGenerator(
            model_name=embedding_model,
            device=device
        )
        
        self.vector_store = PineconeVectorStore(
            api_key=pinecone_api_key,
            index_name=index_name,
            dimension=self.embedding_generator.dimension
        )
        
        logger.info("Pipeline initialized successfully")
    
    def process_and_store(
        self,
        markdown_file: str,
        document_id: str,
        namespace: str = ""
    ) -> Dict[str, Any]:
        """
        Complete processing: read -> chunk -> embed -> store
        """
        logger.info(f"Processing: {document_id}")
        
        # Read file
        with open(markdown_file, 'r', encoding='utf-8') as f:
            markdown_text = f.read()
        
        # Chunk
        chunks = self.chunker.chunk_document(markdown_text, document_id)
        
        # Generate embeddings
        texts = [chunk['text'] for chunk in chunks]
        embeddings = self.embedding_generator.generate_embeddings(texts)
        
        # Store in Pinecone
        self.vector_store.upsert_chunks(chunks, embeddings, namespace)
        
        logger.info(f"✓ Processed {len(chunks)} chunks for {document_id}")
        
        return {
            'document_id': document_id,
            'total_chunks': len(chunks),
            'namespace': namespace,
            'status': 'success'
        }


# Usage example
if __name__ == "__main__":
    import os
    from dotenv import load_dotenv
    load_dotenv()
    
    pipeline = TextbookProcessingPipeline(
        pinecone_api_key=os.getenv("PINECONE_API_KEY"),
        index_name="grade-5",
        embedding_model='BAAI/bge-base-en-v1.5',  # Open-source, high quality
        target_chunk_size=512,
        chunk_overlap=50
    )
    
    result = pipeline.process_and_store(
        markdown_file="./markdown/grade_5_parsed_chapters/chapter_15_Data_Through_Picture.md",
        document_id="math_grade5_chapter1",
        namespace="grade5_math")
    
    print(f"Result: {result}")