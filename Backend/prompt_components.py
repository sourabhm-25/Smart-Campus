"""
MODULAR PROMPT SYSTEM
=====================
Combines prompts from different components:
- Grade-specific rules (Grade 5, Grade 8, Grade 10, etc.)
- Subject-specific instructions (Math, Science, etc.)
- Task type (Homework vs Test)
- Question type counts (customizable)
"""

from typing import Dict, Optional, List
from dataclasses import dataclass
from langchain_core.prompts import PromptTemplate


@dataclass
class QuestionConfig:
    """Configuration for number of questions to generate."""
    short_answer: int = 2
    mcq: int = 2
    fill_in_the_blanks: int = 2
    true_false: int = 0  # Optional
    matching: int = 0    # Optional


class GradePrompts:
    """
    Grade-specific prompt components.
    Define difficulty and question count based on grade level.
    """
    
    @staticmethod
    def get_grade_config(grade: str) -> Dict:
        """
        Get default question configuration for each grade.
        
        Returns:
            Dict with default question counts and difficulty level
        """
        grade_configs = {
            "1": {
                "difficulty": "kindergarten",
                "default_config": QuestionConfig(
                    short_answer=1,
                    mcq=2,
                    fill_in_the_blanks=1,
                    true_false=2
                ),
                "description": "Very simple language, picture-based concepts, yes/no understanding"
            },
            "2": {
                "difficulty": "kindergarten",
                "default_config": QuestionConfig(
                    short_answer=1,
                    mcq=2,
                    fill_in_the_blanks=2,
                    true_false=2
                ),
                "description": "Simple sentences, basic word recognition, foundational literacy"
            },
            "3": {
                "difficulty": "primary",
                "default_config": QuestionConfig(
                    short_answer=2,
                    mcq=2,
                    fill_in_the_blanks=2,
                    true_false=1
                ),
                "description": "Short sentences, concrete concepts, basic comprehension"
            },
            "4": {
                "difficulty": "primary",
                "default_config": QuestionConfig(
                    short_answer=2,
                    mcq=2,
                    fill_in_the_blanks=2,
                    true_false=1
                ),
                "description": "Developing vocabulary, simple reasoning, real-world connections"
            },
            "5": {
                "difficulty": "elementary",
                "default_config": QuestionConfig(
                    short_answer=2,
                    mcq=2,
                    fill_in_the_blanks=2,
                    true_false=0
                ),
                "description": "Simple language, basic concepts, visual examples"
            },
            "6": {
                "difficulty": "elementary",
                "default_config": QuestionConfig(
                    short_answer=2,
                    mcq=3,
                    fill_in_the_blanks=2,
                    true_false=0
                ),
                "description": "Slightly more complex, foundational concepts"
            },
            "7": {
                "difficulty": "middle_school",
                "default_config": QuestionConfig(
                    short_answer=2,
                    mcq=3,
                    fill_in_the_blanks=2,
                    true_false=0
                ),
                "description": "Moderate complexity, application-based"
            },
            "8": {
                "difficulty": "middle_school",
                "default_config": QuestionConfig(
                    short_answer=3,
                    mcq=4,
                    fill_in_the_blanks=2,
                    true_false=0
                ),
                "description": "Increased complexity, analytical thinking"
            },
            "9": {
                "difficulty": "high_school",
                "default_config": QuestionConfig(
                    short_answer=3,
                    mcq=4,
                    fill_in_the_blanks=2,
                    true_false=0
                ),
                "description": "Advanced concepts, critical thinking"
            },
            "10": {
                "difficulty": "high_school",
                "default_config": QuestionConfig(
                    short_answer=3,
                    mcq=5,
                    fill_in_the_blanks=3,
                    true_false=0
                ),
                "description": "Complex analysis, deep understanding"
            },
        }
        
        # Extract numeric grade
        import re
        match = re.search(r'(\d+)', str(grade))
        grade_num = match.group(1) if match else "5"
        
        return grade_configs.get(grade_num, grade_configs["5"])
    
    @staticmethod
    def get_grade_instructions(grade: str) -> str:
        """Get grade-specific instructions for question generation."""
        
        config = GradePrompts.get_grade_config(grade)
        difficulty = config["difficulty"]
        description = config["description"]
        
        grade_instructions = {
            "kindergarten": f"""
GRADE LEVEL: Early Primary (Grades 1-2)

Student Profile:
- Age group: 6-7 years old
- Reading level: Beginner — short, phonics-based words
- Attention span: Very short; needs immediate engagement
- {description}

Language Rules (Non-Negotiable):
- Maximum 8 words per question sentence
- Use ONLY high-frequency sight words (e.g., the, is, are, can, has, do)
- Zero jargon — if a concept word must appear, immediately follow it with "(that means...)"
- Write exactly as a teacher would SPEAK to a 6-year-old
- Prefer active voice: "The dog runs" NOT "Running is done by the dog"

Question Design:
- True/False: State a single, unambiguous fact. Begin with "Is it true that..." or a simple declarative
- MCQ: Maximum 3 options (A, B, C). Options must be single words or 3-word max phrases
- Fill-in-the-blank: Blank always at END of sentence. Only one blank per sentence
- Short Answer: Expect 1-sentence answers. Frame as "Tell me one thing about..."
- Every question must connect to something a child sees, touches, or does daily (home, school, playground, food, animals)

Tone & Framing:
- Warm, encouraging, playful
- Use "you" to make it personal: "What do YOU think...?"
- Never use negative framing ("which is NOT...") — too cognitively complex
- Avoid multi-part questions entirely

Quality Benchmark:
A 6-year-old should be able to READ the question aloud and UNDERSTAND it without adult help.
""",

    "primary": f"""
GRADE LEVEL: Primary (Grades 3-4)

Student Profile:
- Age group: 8-9 years old
- Reading level: Developing fluency; comfortable with paragraphs
- Thinking level: Concrete operational — learns best through examples and patterns
- {description}

Language Rules (Non-Negotiable):
- Maximum 15 words per question sentence
- Introduce subject words naturally within context, not in isolation
- Use relatable analogies: "Just like how water flows downhill, electricity flows through wires"
- Prefer familiar settings: classroom, home, neighborhood, sports, nature
- One idea per question — never combine two concepts in one question

Question Design:
- True/False: Include a mild distractors — partially true statements to encourage careful reading
- MCQ: 4 options (A, B, C, D). One clearly correct, one common misconception, two plausible distractors
- Fill-in-the-blank: Blank can appear mid-sentence. Provide a word bank if 3+ blanks exist
- Short Answer: Expect 2-3 sentence answers. Frame as "Explain in your own words..." or "Give one example of..."
- Begin introducing "why" and "how" questions to scaffold reasoning

Tone & Framing:
- Friendly and encouraging, but academically purposeful
- Acceptable to use mild negative framing: "Which of these is NOT an animal?" — but use sparingly
- Scenarios should feel like a story: "Priya noticed that her ice cream melted faster outside than inside. Why did this happen?"

Quality Benchmark:
A student should be able to answer using knowledge from class without needing to re-read the textbook.
""",

    "elementary": f"""
GRADE LEVEL: Elementary (Grades 5-6)

Student Profile:
- Age group: 10-11 years old
- Reading level: Grade-level fluency; handles multi-sentence questions
- Thinking level: Transitioning from concrete to early abstract reasoning
- {description}

Language Rules (Non-Negotiable):
- Sentences up to 20 words; complex sentences allowed if logically structured
- Introduce and USE subject-specific vocabulary — students at this level should be building a technical lexicon
- Define new terms inline only if they are peripheral to the core concept being tested
- Avoid colloquialisms; maintain a lightly academic but approachable tone

Question Design:
- True/False: Eliminated in favor of richer formats that test reasoning depth
- MCQ: 4 options. Distractors must represent genuine misconceptions, not obviously wrong answers
- Fill-in-the-blank: Test vocabulary precision and conceptual recall; blanks should be key terms or values
- Short Answer: Expect 3-5 sentences. Require students to name a concept AND give an example
- Begin introducing data, simple charts, or scenario-based contexts as question stems

Tone & Framing:
- Neutral academic tone; encouraging but not patronizing
- Scenarios should reflect the real world: science experiments, social studies events, math word problems grounded in real life
- Acceptable: "Explain why...", "What would happen if...", "Compare X and Y"

Quality Benchmark:
Questions should match the style of standard state/board assessments for Grades 5-6.
""",

    "middle_school": f"""
GRADE LEVEL: Middle School (Grades 7-8)

Student Profile:
- Age group: 12-13 years old
- Reading level: Proficient; comfortable with academic text
- Thinking level: Abstract reasoning emerging; capable of inference and multi-step logic
- {description}

Language Rules (Non-Negotiable):
- Use full academic register — complete, grammatically precise sentences
- Subject-specific vocabulary is expected without in-line definitions
- Questions may contain subordinate clauses, conditional framing ("If X, then what..."), and comparison structures
- Maintain neutral, objective tone consistent with formal assessments

Question Design:
- MCQ: 4 options with sophisticated distractors — target common conceptual errors and partial understandings
- Fill-in-the-blank: Use to test precise terminology, formulas, or sequencing
- Short Answer: Expect a structured paragraph (4-6 sentences). Require: claim → reasoning → evidence or example
- Introduce multi-part questions sparingly: "State the rule AND give one exception"
- Use data tables, graphs, or short passage excerpts as question stems where subject-appropriate

Cognitive Demand:
- Bloom's Taxonomy Levels targeted: Understanding (L2), Application (L3), Analysis (L4)
- At least 40% of questions should require application or analysis, not pure recall
- Include at least one "compare and contrast" or "cause and effect" question per set

Tone & Framing:
- Formal, precise, and subject-appropriate
- Acceptable stems: "Analyze...", "Explain the relationship between...", "Predict what would happen if...", "Justify your answer"

Quality Benchmark:
Questions should be indistinguishable in style and rigor from a standard Grade 7-8 school examination paper.
""",

    "high_school": f"""
GRADE LEVEL: High School (Grades 9-10)

Student Profile:
- Age group: 14-15 years old
- Reading level: Advanced; handles dense academic and technical text
- Thinking level: Formal operational — capable of hypothesis, deduction, and abstract reasoning
- {description}

Language Rules (Non-Negotiable):
- Full formal academic language; technical vocabulary used precisely and without simplification
- Questions may be multi-clause and assume prior domain knowledge
- Expect students to interpret and critically engage with information, not just recall it
- Ambiguity in question framing is unacceptable — every question must have a defensible correct answer

Question Design:
- MCQ: 4 options. All distractors must be conceptually plausible — a student who partially understands should be genuinely challenged
- Fill-in-the-blank: Reserved for testing exact definitions, laws, formulas, or critical terminology
- Short Answer: Expect a well-structured response (5-8 sentences or equivalent). Require: thesis/claim → multi-point reasoning → real-world or textual evidence
- Questions should regularly present novel scenarios that require transfer of knowledge, not just reproduction of learned content
- Use primary data, case studies, graphs, or excerpts as stems where subject-appropriate

Cognitive Demand:
- Bloom's Taxonomy Levels targeted: Application (L3), Analysis (L4), Evaluation (L5)
- Minimum 50% of questions must operate at L4-L5
- Include questions that require students to identify flaws, limitations, or alternative interpretations

Tone & Framing:
- Strictly formal and academic
- Acceptable stems: "Critically evaluate...", "To what extent...", "Using evidence, explain...", "Distinguish between...", "Assess the impact of..."
- Avoid leading questions or questions that telegraph the answer

Quality Benchmark:
Questions must meet the standard of a rigorous Grade 9-10 board or standardized exam (e.g., CBSE, ICSE, Common Core aligned assessments).
""",

    "advanced": f"""
GRADE LEVEL: Advanced High School (Grades 11-12)

Student Profile:
- Age group: 16-18 years old
- Reading level: Near-collegiate; handles research papers, technical documents, and primary sources
- Thinking level: Metacognitive — capable of evaluating their own reasoning, constructing arguments, and synthesizing across domains
- {description}

Language Rules (Non-Negotiable):
- Collegiate academic register required — precise, economical, and technically rigorous
- Discipline-specific terminology used without qualification; students are expected to know it
- Questions must be intellectually demanding without being artificially obscure
- Every word in a question must earn its place — eliminate all redundancy

Question Design:
- MCQ: 4 options. Design so that the correct answer requires genuine mastery; a well-read but shallow student should be fooled by at least one distractor
- Fill-in-the-blank: Use only for high-leverage terms — theorems, principles, exact definitions that anchor the concept
- Short Answer: Expect a mini-essay structure (8-12 sentences or equivalent). Require: precise claim → layered reasoning → evidence → acknowledgment of counterargument or limitation
- Questions must regularly involve: synthesis across subtopics, evaluation of competing theories, application to unseen real-world or hypothetical scenarios
- Use authentic source material as stems: data sets, journal abstracts, policy excerpts, historical documents

Cognitive Demand:
- Bloom's Taxonomy Levels targeted: Analysis (L4), Evaluation (L5), Synthesis/Creation (L6)
- Minimum 60% of questions must operate at L5-L6
- Include questions that require students to construct, defend, or challenge a position — not just identify the correct one

Tone & Framing:
- Rigorous, precise, and intellectually respectful — treat students as emerging subject-matter experts
- Acceptable stems: "Critically synthesize...", "Construct an argument for...", "Evaluate the validity of...", "What are the theoretical implications of...", "Propose and justify..."
- Questions may present deliberate complexity or ambiguity that students must navigate and address explicitly

Quality Benchmark:
Questions must be indistinguishable from those on AP, IB, A-Level, or entrance examination papers. A university freshman should find these questions familiar in style and rigor.
"""
        }
    
        
        return grade_instructions.get(difficulty, grade_instructions["elementary"])


class TaskTypePrompts:
    """
    Task-type-specific prompt components.
    Defines different instructions for homework vs test.
    """
    
    @staticmethod
    def get_task_instructions(task_type: str) -> str:
        """Get task-type-specific instructions."""
        
        task_instructions = {
            "homework": """
TASK TYPE: Homework Assignment

Purpose: Practice, reinforcement, and self-assessment

Design Guidelines:
- Questions should encourage independent thinking and exploration
- Include a mix of difficulty levels (easy to moderate)
- Focus on reinforcing concepts taught in class
- Allow for creative or open-ended responses where appropriate
- Questions should be completable within a reasonable time
- Include questions that encourage students to review their notes/textbook
""",
            "test": """
TASK TYPE: Test / Examination

Purpose: Formal assessment and evaluation of understanding

Design Guidelines:
- Questions should rigorously test comprehension and application
- Include a balanced mix of difficulty (easy, moderate, challenging)
- Ensure questions are unambiguous with clear, defensible correct answers
- Cover a broad range of topics from the provided context
- Avoid trick questions — focus on genuine understanding
- Time management: questions should be answerable within exam constraints
- Include higher-order thinking questions (analysis, evaluation)
"""
        }
        
        return task_instructions.get(task_type.lower(), task_instructions["homework"])


class SubjectPrompts:
    """
    Subject-specific prompt components.
    Core instructions for each subject area.
    """
    
    @staticmethod
    def get_subject_instructions(subject: str) -> str:
        """Get subject-specific instructions."""
        
        subject_lower = subject.lower()
        
        if "math" in subject_lower:
            return """
SUBJECT: Mathematics

Focus Areas:
- Conceptual understanding of mathematical principles
- Procedural fluency and calculation skills
- Problem-solving and reasoning
- Real-world applications of mathematics

Question Requirements:
- Use proper mathematical notation (NO LaTeX, NO backslashes, NO $ symbols)
- Use Unicode symbols: × ÷ ≠ ≤ ≥ ± √ ²  ³
- Use ^ for exponents (e.g., 5^2)
- Use sqrt() for square roots (e.g., sqrt(16))
- Include step-by-step solutions for calculations
- Test formula application, not just memorization
- Include word problems and real-world scenarios
- Progress from procedural to conceptual questions

Mathematical Symbols to Use:
× (multiplication), ÷ (division), = (equals), ≠ (not equals)
< > ≤ ≥ (comparison), ± (plus-minus), √ (square root)
² ³ (superscripts), ° (degree)
"""
        
        elif "science" in subject_lower:
            return """
SUBJECT: Science

Focus Areas:
- Scientific concepts and processes
- Experimental design and observation
- Cause-and-effect relationships
- Real-world applications and phenomena

Question Requirements:
- Reference experiments, activities, or observations from context
- Ask "why" and "how" questions to develop reasoning
- Test understanding of scientific processes (cycles, systems, etc.)
- Include questions about real-world applications
- Use proper scientific terminology
- Encourage scientific thinking and hypothesis testing
- Connect concepts to everyday life and nature
"""
        
        elif "history" in subject_lower or "social" in subject_lower:
            return """
SUBJECT: History/Social Studies

Focus Areas:
- Historical events, people, and periods
- Causes, effects, and significance
- Chronology and timelines
- Cultural, political, and social contexts

Question Requirements:
- Test understanding of causes and consequences
- Include chronological thinking questions
- Ask about significance and impact of events
- Include questions about key figures and their contributions
- Test ability to make connections between events
- Encourage critical thinking about historical patterns
- Relate past events to present understanding
"""
        
        elif "english" in subject_lower or "language" in subject_lower:
            return """
SUBJECT: English/Language Arts

Focus Areas:
- Reading comprehension (literal and inferential)
- Vocabulary and word usage
- Literary analysis and interpretation
- Grammar, usage, and conventions

Question Requirements:
- Test both literal and inferential comprehension
- Include vocabulary in context questions
- Ask about main ideas, themes, and author's purpose
- Test understanding of literary elements (when applicable)
- Include questions about tone, mood, and style
- Test ability to make inferences and draw conclusions
- Focus on critical thinking and interpretation
"""
        
        elif "geography" in subject_lower:
            return """
SUBJECT: Geography

Focus Areas:
- Physical and human geography
- Maps, locations, and spatial thinking
- Climate, landforms, and natural resources
- Human-environment interactions

Question Requirements:
- Include map-based questions when possible
- Test knowledge of locations and spatial relationships
- Ask about physical features and processes
- Include questions about climate and vegetation
- Test understanding of human geography (population, culture)
- Connect geography to real-world issues
- Encourage spatial thinking and reasoning
"""
        
        elif "computer" in subject_lower:
            return """
SUBJECT: Computer Science

Focus Areas:
- Programming concepts and logic
- Algorithms and problem-solving
- Computational thinking
- Technology applications

Question Requirements:
- Include code-reading and analysis questions
- Test understanding of algorithms and logic
- Ask about debugging and problem-solving
- Test knowledge of syntax and terminology
- Include practical application scenarios
- Focus on concepts, not just syntax memorization
- Encourage logical and systematic thinking
"""
        
        elif "economics" in subject_lower:
            return """
SUBJECT: Economics/Business

Focus Areas:
- Economic concepts and principles
- Supply, demand, and markets
- Decision-making and trade-offs
- Real-world economic scenarios

Question Requirements:
- Include scenario-based questions
- Test understanding of economic principles
- Ask about cause-and-effect in economic contexts
- Include questions about graphs and data interpretation
- Test decision-making and analysis skills
- Connect concepts to real-world situations
- Encourage critical thinking about choices
"""
        
        else:
            return """
SUBJECT: General

Focus Areas:
- Core concepts and principles
- Understanding and application
- Critical thinking and reasoning
- Connections to real-world contexts

Question Requirements:
- Base questions directly on provided content
- Test understanding at multiple levels
- Include both recall and application questions
- Use clear, age-appropriate language
- Encourage thinking and reasoning
- Connect to students' experiences when possible
"""


class PromptBuilder:
    """
    Main class to build complete prompts by combining components.
    """
    
    def __init__(self):
        self.grade_prompts = GradePrompts()
        self.task_prompts = TaskTypePrompts()
        self.subject_prompts = SubjectPrompts()
    
    def build_prompt(
        self,
        subject: str,
        grade: str,
        task_type: str = "homework",
        config: Optional[QuestionConfig] = None
    ) -> PromptTemplate:
        """
        Build complete prompt from components.
        
        Args:
            subject: Subject name (e.g., "Mathematics")
            grade: Grade level (e.g., "5", "8", "10")
            task_type: "homework" or "test"
            config: Custom QuestionConfig (optional, uses grade default if None)
        
        Returns:
            Complete PromptTemplate ready to use
        """
        
        # Get default config for grade if not provided
        if config is None:
            grade_cfg = self.grade_prompts.get_grade_config(grade)
            config = grade_cfg["default_config"]
        
        # Build component strings
        grade_instructions = self.grade_prompts.get_grade_instructions(grade)
        task_instructions = self.task_prompts.get_task_instructions(task_type)
        subject_instructions = self.subject_prompts.get_subject_instructions(subject)
        
        # Build question requirements string
        question_requirements = self._build_question_requirements(config)
        
        # Combine all components into final template
        template = f"""
You are an experienced {subject} teacher creating a {task_type} assignment for students.

{grade_instructions}

{task_instructions}

{subject_instructions}

{question_requirements}

IMPORTANT RULES:
1. Base ALL questions ONLY on the context provided below
2. Do NOT invent examples or information not in the context
3. Ensure questions are clear, unambiguous, and appropriate for the grade level
4. For Mathematics: NO LaTeX, NO backslashes, NO $ symbols - use Unicode only
5. Return ONLY a valid JSON object - no markdown formatting, no code blocks

OUTPUT FORMAT:
Return a JSON object with these keys: {self._get_output_keys(config)}

Each question object should include:
- For short_answer: {{{{"question": "...", "answer": "...", "marks": X}}}}
- For mcq: {{{{"question": "...", "options": ["a) ...", "b) ...", "c) ...", "d) ..."], "answer": "a", "marks": X}}}}
- For fill_in_the_blanks: {{{{"question": "...", "answer": "...", "marks": X}}}}
- For true_false: {{{{"question": "...", "answer": "true/false", "marks": X}}}}

CONTEXT:
{{context}}

TOPIC:
{{question}}

JSON_OUTPUT:
"""
        
        return PromptTemplate(
            template=template,
            input_variables=["context", "question"]
        )
    
    def _build_question_requirements(self, config: QuestionConfig) -> str:
        """Build the question requirements section."""
        
        requirements = ["QUESTION REQUIREMENTS:"]
        
        if config.short_answer > 0:
            requirements.append(
                f"- Create {config.short_answer} short-answer questions "
                f"(requiring written explanations or calculations)"
            )
        
        if config.mcq > 0:
            requirements.append(
                f"- Create {config.mcq} multiple-choice questions (MCQs) "
                f"with 4 options each (a, b, c, d)"
            )
        
        if config.fill_in_the_blanks > 0:
            requirements.append(
                f"- Create {config.fill_in_the_blanks} fill-in-the-blank questions "
                f"(testing key terms, formulas, or concepts)"
            )
        
        if config.true_false > 0:
            requirements.append(
                f"- Create {config.true_false} true/false questions "
                f"(testing factual understanding)"
            )
        
        if config.matching > 0:
            requirements.append(
                f"- Create {config.matching} matching questions "
                f"(connecting related concepts)"
            )
        
        return "\n".join(requirements)
    
    def _get_output_keys(self, config: QuestionConfig) -> str:
        """Get the list of expected JSON keys based on config."""
        
        keys = []
        if config.short_answer > 0:
            keys.append('"short_answer"')
        if config.mcq > 0:
            keys.append('"mcq"')
        if config.fill_in_the_blanks > 0:
            keys.append('"fill_in_the_blanks"')
        if config.true_false > 0:
            keys.append('"true_false"')
        if config.matching > 0:
            keys.append('"matching"')
        
        return ", ".join(keys) if keys else '"short_answer", "mcq", "fill_in_the_blanks"'
    
    def get_grade_defaults(self, grade: str) -> QuestionConfig:
        """Get default question configuration for a grade."""
        grade_cfg = self.grade_prompts.get_grade_config(grade)
        return grade_cfg["default_config"]


# Convenience function for quick access
def create_prompt(
    subject: str,
    grade: str,
    task_type: str = "homework",
    short_answer: Optional[int] = None,
    mcq: Optional[int] = None,
    fill_in_the_blanks: Optional[int] = None,
    true_false: Optional[int] = None,
    matching: Optional[int] = None
) -> PromptTemplate:
    """
    Quick function to create a prompt.
    
    Args:
        subject: Subject name
        grade: Grade level
        task_type: "homework" or "test"
        short_answer: Number of short answer questions (None = use default)
        mcq: Number of MCQs (None = use default)
        fill_in_the_blanks: Number of fill-in-blank (None = use default)
        true_false: Number of true/false (None = use default)
        matching: Number of matching (None = use default)
    
    Returns:
        PromptTemplate ready to use
    """
    builder = PromptBuilder()
    
    # If any custom counts provided, create custom config
    if any(x is not None for x in [short_answer, mcq, fill_in_the_blanks, true_false, matching]):
        # Get defaults first
        defaults = builder.get_grade_defaults(grade)
        
        config = QuestionConfig(
            short_answer=short_answer if short_answer is not None else defaults.short_answer,
            mcq=mcq if mcq is not None else defaults.mcq,
            fill_in_the_blanks=fill_in_the_blanks if fill_in_the_blanks is not None else defaults.fill_in_the_blanks,
            true_false=true_false if true_false is not None else defaults.true_false,
            matching=matching if matching is not None else defaults.matching
        )
    else:
        config = None  # Use grade defaults
    
    return builder.build_prompt(subject, grade, task_type, config)


# Example usage
if __name__ == "__main__":
    # Example 1: Default configuration
    prompt1 = create_prompt(
        subject="Mathematics",
        grade="8",
        task_type="homework"
    )
    print("Example 1: Grade 8 Math Homework (defaults)")
    print("=" * 80)
    print(prompt1.template[:500])
    print("\n")
    
    # Example 2: Custom configuration
    prompt2 = create_prompt(
        subject="Science",
        grade="10",
        task_type="test",
        short_answer=3,
        mcq=5,
        fill_in_the_blanks=2,
        true_false=2
    )
    print("Example 2: Grade 10 Science Test (custom counts)")
    print("=" * 80)
    print(prompt2.template[:500])
    print("\n")
    
    # Example 3: Teacher wants specific counts
    prompt3 = create_prompt(
        subject="History",
        grade="5",
        task_type="homework",
        short_answer=0,  # No short answer
        mcq=7,  # 7 MCQs
        fill_in_the_blanks=3
    )
    print("Example 3: Grade 5 History (teacher custom: 7 MCQs, 0 short answer)")
    print("=" * 80)
    print(prompt3.template[:500])