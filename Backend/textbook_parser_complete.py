# textbook_parser_complete.py
# Complete production-ready textbook parsing system

import os
import json
import re
from typing import List, Dict, Optional
from datetime import datetime
from pathlib import Path
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI


from llama_parse import LlamaParse
from llama_index.core import (
    SimpleDirectoryReader,
    VectorStoreIndex,
    StorageContext,
    load_index_from_storage,
    Document,
    Settings
)
from llama_index.core.node_parser import (
    MarkdownNodeParser,
    SentenceSplitter
)
from llama_index.core.extractors import (
    TitleExtractor,
    QuestionsAnsweredExtractor,
    SummaryExtractor,
)
from llama_index.core.ingestion import IngestionPipeline
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI

from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class TextbookParser:
    """
    Complete textbook parsing system with LlamaParse and LlamaIndex
    Handles: Chapters, Sections, Activities, Exercises, Tables, Diagrams
    """
    
    def __init__(
        self,
        llama_parse_api_key: Optional[str] = None

    ):
        """Initialize parser with API keys"""
        self.llama_parse_api_key = llama_parse_api_key or os.getenv("LLAMA_PARSE_API_KEY")
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        
        # Configure LlamaIndex settings
       Settings.llm = Gemini(
    model="models/gemini-3-flash",
    api_key=os.getenv("GEMINI_API_KEY"),
    temperature=0.2
        )

        Settings.embed_model = GeminiEmbedding(
            model="models/embedding-001",
            api_key=os.getenv("GEMINI_API_KEY")
        )

        
        # Initialize LlamaParse with educational instructions
        self.parser = self._create_parser()
        
        # Initialize node parser for chunking
        self.node_parser = MarkdownNodeParser()
        
    def _create_parser(self) -> LlamaParse:
        """Create LlamaParse instance with textbook-specific instructions"""
        return LlamaParse(
            api_key=self.llama_parse_api_key,
            result_type="markdown",  # Clean markdown output
            parsing_instruction=self._get_parsing_instructions(),
            num_workers=4,  # Parallel processing
            verbose=True,
            language="en",
            invalidate_cache=False,  # Use cache for faster re-runs
            do_not_cache=False,
            check_interval=2,  # Check parsing status every 2 seconds
            max_timeout=2000,  # 2000 seconds timeout
        )
    
    def _get_parsing_instructions(self) -> str:
        """Textbook-specific parsing instructions"""
        return """
        This document is a SCHOOL TEXTBOOK for K-12 education.

        CRITICAL PARSING RULES:

        1. CHAPTER STRUCTURE:
           - Identify chapter numbers and titles: "Chapter 3: Photosynthesis"
           - Use markdown headers: # for chapters, ## for sections, ### for subsections
           - Preserve exact hierarchy: Chapter → Section → Subsection

        2. CONTENT CLASSIFICATION (use tags):
           - [EXPLANATION] - Main explanatory paragraphs
           - [ACTIVITY] - Hands-on activities or experiments
           - [EXERCISE] - Practice questions and problems
           - [QUESTION] - Individual questions
           - [DEFINITION] - Key term definitions
           - [EXAMPLE] - Worked examples
           - [NOTE] - Important notes or tips
           - [SUMMARY] - Chapter summaries

        3. SPECIAL ELEMENTS:
           - Tables: Preserve as proper markdown tables
           - Diagrams/Images: Mark as [DIAGRAM: brief description]
           - Formulas: Keep in LaTeX format ($inline$ or $$block$$)
           - Page numbers: Insert [PAGE: X] markers
           - References: Mark as [REFERENCE: citation]

        4. METADATA PRESERVATION:
           - Page numbers at the start of each page
           - Chapter and section numbers
           - Figure and table captions
           - Learning objectives if present

        5. DO NOT:
           - Merge exercises with explanations
           - Skip page numbers or lose page context
           - Lose table structure or convert to plain text
           - Combine different content types
           - Remove whitespace that affects readability

        6. OUTPUT FORMAT:
           - Clean, well-structured markdown
           - Clear section separators (---)
           - Preserve all metadata
           - Maintain logical flow

        EXAMPLE OUTPUT:
        
        [PAGE: 42]
        
        # Chapter 3: Synthetic Fibres and Plastics
        
        ## 3.1 Types of Synthetic Fibres
        
        [EXPLANATION]
        Synthetic fibres are man-made polymers created through chemical processes...
        
        [DEFINITION]
        **Polymer**: A large molecule made up of repeating units called monomers.
        
        ### Activity 3.1: Identifying Fibres
        
        [ACTIVITY]
        1. Collect samples of different fabrics
        2. Observe their properties
        3. Record your findings in the table below
        
        ### Table: Properties of Common Fibres
        
        | Fibre Type | Strength | Water Absorption | Uses |
        |------------|----------|------------------|------|
        | Nylon      | High     | Low              | Ropes |
        | Polyester  | Medium   | Very Low         | Clothing |
        
        ## 3.2 Exercises
        
        [EXERCISE]
        1. Explain why plastics are generally non-reactive.
        2. Give three examples of thermoplastics.
        3. Compare natural and synthetic fibres.
        
        [PAGE: 43]
        """
    
    def parse_textbook(self, pdf_path: str) -> List[Document]:
        """
        Parse a single textbook PDF
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            List of Document objects
        """
        print(f"\n📖 Parsing textbook: {pdf_path}")
        print(f"⏳ This may take a few minutes...\n")
        
        # Parse using LlamaParse
        documents = SimpleDirectoryReader(
            input_files=[pdf_path],
            file_extractor={".pdf": self.parser}
        ).load_data()
        
        print(f"✅ Successfully parsed {len(documents)} document chunks")
        
        # Add metadata
        for doc in documents:
            doc.metadata.update({
                "source": pdf_path,
                "parsed_at": datetime.now().isoformat(),
                "parser": "LlamaParse"
            })
        
        return documents
    
    def parse_directory(self, directory: str) -> List[Document]:
        """
        Parse all PDFs in a directory
        
        Args:
            directory: Path to directory containing PDFs
            
        Returns:
            List of Document objects from all PDFs
        """
        print(f"\n📚 Parsing all textbooks in: {directory}")
        
        documents = SimpleDirectoryReader(
            input_dir=directory,
            file_extractor={".pdf": self.parser},
            recursive=True,
            required_exts=[".pdf"]
        ).load_data()
        
        print(f"✅ Parsed {len(documents)} total chunks from directory")
        return documents
    
    def save_parsed_output(self, documents: List[Document], output_path: str):
        """Save parsed markdown to file"""
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, "w", encoding="utf-8") as f:
            for i, doc in enumerate(documents):
                f.write(f"{'='*80}\n")
                f.write(f"DOCUMENT CHUNK {i+1}\n")
                f.write(f"{'='*80}\n\n")
                f.write(doc.text)
                f.write("\n\n")
        
        print(f"💾 Saved parsed output to: {output_path}")
    
    def create_structured_index(
        self,
        documents: List[Document],
        persist_dir: str = "./storage"
    ) -> VectorStoreIndex:
        """
        Create a vector index with structured nodes
        
        Args:
            documents: Parsed documents
            persist_dir: Directory to save the index
            
        Returns:
            VectorStoreIndex for querying
        """
        print(f"\n🔨 Creating structured index...")
        
        # Create ingestion pipeline with extractors
        pipeline = IngestionPipeline(
            transformations=[
                # Split by markdown structure
                MarkdownNodeParser(),
                
                # Extract metadata
                TitleExtractor(llm=Settings.llm, nodes=5),
                SummaryExtractor(llm=Settings.llm, summaries=["self"]),
                
                # Generate embeddings
                Settings.embed_model,
            ]
        )
        
        # Run pipeline
        nodes = pipeline.run(documents=documents, show_progress=True)
        
        print(f"✅ Created {len(nodes)} structured nodes")
        
        # Create index
        index = VectorStoreIndex(nodes)
        
        # Persist to disk
        if persist_dir:
            Path(persist_dir).mkdir(parents=True, exist_ok=True)
            index.storage_context.persist(persist_dir=persist_dir)
            print(f"💾 Index saved to: {persist_dir}")
        
        return index
    
    def load_index(self, persist_dir: str = "./storage") -> VectorStoreIndex:
        """Load a previously saved index"""
        print(f"\n📂 Loading index from: {persist_dir}")
        storage_context = StorageContext.from_defaults(persist_dir=persist_dir)
        index = load_index_from_storage(storage_context)
        print("✅ Index loaded successfully")
        return index


class TextbookStructureExtractor:
    """Extract structured hierarchy from parsed textbooks"""
    
    def __init__(self):
        self.chapter_pattern = re.compile(r'^# Chapter (\d+):(.+?)$', re.MULTILINE)
        self.section_pattern = re.compile(r'^## (\d+\.(?:\d+)?)\s+(.+?)$', re.MULTILINE)
        self.subsection_pattern = re.compile(r'^### (.+?)$', re.MULTILINE)
        self.page_pattern = re.compile(r'\[PAGE:\s*(\d+)\]')
        self.tag_pattern = re.compile(r'\[(EXPLANATION|ACTIVITY|EXERCISE|QUESTION|DEFINITION|EXAMPLE|NOTE|SUMMARY)\]')
    
    def extract_structure(self, documents: List[Document]) -> Dict:
        """Extract complete textbook structure"""
        full_text = "\n\n".join([doc.text for doc in documents])
        
        structure = {
            "metadata": {
                "total_pages": self._count_pages(full_text),
                "total_chapters": 0,
                "extraction_date": datetime.now().isoformat()
            },
            "chapters": []
        }
        
        # Split by chapters
        chapters = self._split_chapters(full_text)
        structure["metadata"]["total_chapters"] = len(chapters)
        
        for chapter in chapters:
            chapter_data = self._parse_chapter(chapter)
            if chapter_data:
                structure["chapters"].append(chapter_data)
        
        return structure
    
    def _split_chapters(self, text: str) -> List[str]:
        """Split text into chapter segments"""
        chapter_starts = [m.start() for m in self.chapter_pattern.finditer(text)]
        
        if not chapter_starts:
            return [text]
        
        chapters = []
        for i, start in enumerate(chapter_starts):
            end = chapter_starts[i + 1] if i + 1 < len(chapter_starts) else len(text)
            chapters.append(text[start:end])
        
        return chapters
    
    def _parse_chapter(self, chapter_text: str) -> Optional[Dict]:
        """Parse individual chapter"""
        match = self.chapter_pattern.search(chapter_text)
        if not match:
            return None
        
        chapter_num = match.group(1).strip()
        chapter_title = match.group(2).strip()
        
        return {
            "chapter_number": chapter_num,
            "title": chapter_title,
            "sections": self._extract_sections(chapter_text),
            "activities": self._extract_tagged_content(chapter_text, "ACTIVITY"),
            "exercises": self._extract_tagged_content(chapter_text, "EXERCISE"),
            "questions": self._extract_tagged_content(chapter_text, "QUESTION"),
            "definitions": self._extract_tagged_content(chapter_text, "DEFINITION"),
            "examples": self._extract_tagged_content(chapter_text, "EXAMPLE"),
            "page_range": self._get_page_range(chapter_text),
            "summary": self._extract_tagged_content(chapter_text, "SUMMARY")
        }
    
    def _extract_sections(self, text: str) -> List[Dict]:
        """Extract sections and subsections"""
        sections = []
        
        for match in self.section_pattern.finditer(text):
            section_num = match.group(1).strip()
            section_title = match.group(2).strip()
            
            sections.append({
                "section_number": section_num,
                "title": section_title
            })
        
        return sections
    
    def _extract_tagged_content(self, text: str, tag: str) -> List[str]:
        """Extract content with specific tags"""
        pattern = f'\\[{tag}\\]\\s*(.+?)(?=\\[\\w+\\]|^#|$)'
        matches = re.findall(pattern, text, re.DOTALL | re.MULTILINE)
        return [m.strip() for m in matches if m.strip()]
    
    def _get_page_range(self, text: str) -> Dict:
        """Get page range for content"""
        pages = [int(m.group(1)) for m in self.page_pattern.finditer(text)]
        
        if pages:
            return {"start": min(pages), "end": max(pages)}
        return {"start": None, "end": None}
    
    def _count_pages(self, text: str) -> int:
        """Count total pages"""
        pages = [int(m.group(1)) for m in self.page_pattern.finditer(text)]
        return max(pages) if pages else 0
    
    def save_structure(self, structure: Dict, output_path: str):
        """Save structure as JSON"""
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(structure, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Structure saved to: {output_path}")


class TextbookQueryEngine:
    """Query engine for textbook content"""
    
    def __init__(self, index: VectorStoreIndex):
        self.index = index
        self.query_engine = index.as_query_engine(
            similarity_top_k=5,
            response_mode="tree_summarize"
        )
        self.chat_engine = index.as_chat_engine(
            chat_mode="context",
            verbose=True
        )
    
    def query(self, question: str) -> str:
        """Ask a question about the textbook"""
        print(f"\n❓ Question: {question}")
        response = self.query_engine.query(question)
        print(f"💡 Answer: {response}\n")
        return str(response)
    
    def chat(self, message: str) -> str:
        """Interactive chat about textbook"""
        response = self.chat_engine.chat(message)
        return str(response)
    
    def generate_questions(self, topic: str, num_questions: int = 5) -> List[str]:
        """Generate practice questions on a topic"""
        prompt = f"""
        Based on the textbook content about {topic}, generate {num_questions} 
        practice questions suitable for students. Include a mix of:
        - Recall questions
        - Application questions
        - Analysis questions
        
        Format as a numbered list.
        """
        response = self.query_engine.query(prompt)
        return str(response).split('\n')
    
    def create_lesson_plan(self, chapter: str) -> str:
        """Generate a lesson plan for a chapter"""
        prompt = f"""
        Create a detailed lesson plan for {chapter} including:
        1. Learning objectives
        2. Key concepts to cover
        3. Activities from the textbook
        4. Assessment questions
        5. Additional resources needed
        """
        response = self.query_engine.query(prompt)
        return str(response)


# =============================================================================
# MAIN EXECUTION
# =============================================================================

def main():
    """Main execution function"""
    
    print("="*80)
    print("📚 TEXTBOOK PARSER - Complete System")
    print("="*80)
    
    # Initialize parser
    parser = TextbookParser()
    
    # Step 1: Parse textbook
    pdf_path = "./textbooks/class8_science.pdf"
    
    if os.path.exists(pdf_path):
        documents = parser.parse_textbook(pdf_path)
        
        # Save parsed output
        parser.save_parsed_output(documents, "./output/parsed_textbook.md")
        
        # Step 2: Extract structure
        extractor = TextbookStructureExtractor()
        structure = extractor.extract_structure(documents)
        extractor.save_structure(structure, "./output/textbook_structure.json")
        
        # Print structure summary
        print("\n" + "="*80)
        print("📊 STRUCTURE SUMMARY")
        print("="*80)
        print(f"Total Chapters: {structure['metadata']['total_chapters']}")
        print(f"Total Pages: {structure['metadata']['total_pages']}")
        
        for chapter in structure['chapters']:
            print(f"\nChapter {chapter['chapter_number']}: {chapter['title']}")
            print(f"  - Sections: {len(chapter['sections'])}")
            print(f"  - Activities: {len(chapter['activities'])}")
            print(f"  - Exercises: {len(chapter['exercises'])}")
            print(f"  - Definitions: {len(chapter['definitions'])}")
        
        # Step 3: Create vector index
        index = parser.create_structured_index(
            documents,
            persist_dir="./storage/textbook_index"
        )
        
        # Step 4: Create query engine
        query_engine = TextbookQueryEngine(index)
        
        # Example queries
        print("\n" + "="*80)
        print("🔍 EXAMPLE QUERIES")
        print("="*80)
        
        # Query 1: Simple question
        query_engine.query("What are synthetic fibres?")
        
        # Query 2: Generate questions
        print("\n📝 Generated Practice Questions:")
        questions = query_engine.generate_questions("synthetic fibres", 3)
        for q in questions:
            if q.strip():
                print(f"  {q}")
        
        # Query 3: Lesson plan
        print("\n📋 Lesson Plan:")
        lesson_plan = query_engine.create_lesson_plan("Chapter 3")
        print(lesson_plan)
        
        print("\n" + "="*80)
        print("✅ PARSING COMPLETE!")
        print("="*80)
        print("\nOutput files created:")
        print("  - ./output/parsed_textbook.md")
        print("  - ./output/textbook_structure.json")
        print("  - ./storage/textbook_index/")
        
    else:
        print(f"\n❌ Error: File not found: {pdf_path}")
        print("\nPlease place your textbook PDF at:")
        print(f"  {os.path.abspath(pdf_path)}")


if __name__ == "__main__":
    main()