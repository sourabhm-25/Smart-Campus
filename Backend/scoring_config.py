"""
SCORING CONFIGURATION
=====================
Deterministic marks-per-question by type and grade band.
This is the single source of truth — LLM is NOT trusted to assign marks.
All scoring is computed server-side after LLM generation.

Design principles:
- Marks are deterministic: same inputs → same marks, always
- LLM output `marks` field is IGNORED and overwritten
- Total marks are computable before generation (teacher can see it upfront)
- Higher-order question types (short_answer) are worth more than recall (true_false)
- Grade band scales marks: high school gets higher per-question marks
"""

from dataclasses import dataclass
from typing import Dict, Optional
from enum import Enum


class QuestionType(str, Enum):
    SHORT_ANSWER = "short_answer"
    MCQ = "mcq"
    FILL_IN_THE_BLANKS = "fill_in_the_blanks"
    TRUE_FALSE = "true_false"
    MATCHING = "matching"


class GradeBand(str, Enum):
    KINDERGARTEN = "kindergarten"      # Grades 1-2
    PRIMARY = "primary"                # Grades 3-4
    ELEMENTARY = "elementary"          # Grades 5-6
    MIDDLE_SCHOOL = "middle_school"    # Grades 7-8
    HIGH_SCHOOL = "high_school"        # Grades 9-10
    ADVANCED = "advanced"              # Grades 11-12


# ---------------------------------------------------------------------------
# Mark weights per question type per grade band
# Rationale:
#   short_answer  → highest: requires recall + construction + reasoning
#   mcq           → medium: requires discrimination but is selected response
#   fill_blanks   → medium-low: recall of exact term, no construction
#   true_false    → lowest: 50% guessing probability, binary
#   matching      → medium: multiple recall items in one question
# ---------------------------------------------------------------------------
MARKS_TABLE: Dict[GradeBand, Dict[QuestionType, int]] = {
    GradeBand.KINDERGARTEN: {
        QuestionType.SHORT_ANSWER:       1,
        QuestionType.MCQ:                1,
        QuestionType.FILL_IN_THE_BLANKS: 1,
        QuestionType.TRUE_FALSE:         1,
        QuestionType.MATCHING:           1,
    },
    GradeBand.PRIMARY: {
        QuestionType.SHORT_ANSWER:       2,
        QuestionType.MCQ:                1,
        QuestionType.FILL_IN_THE_BLANKS: 1,
        QuestionType.TRUE_FALSE:         1,
        QuestionType.MATCHING:           1,
    },
    GradeBand.ELEMENTARY: {
        QuestionType.SHORT_ANSWER:       3,
        QuestionType.MCQ:                1,
        QuestionType.FILL_IN_THE_BLANKS: 1,
        QuestionType.TRUE_FALSE:         1,
        QuestionType.MATCHING:           2,
    },
    GradeBand.MIDDLE_SCHOOL: {
        QuestionType.SHORT_ANSWER:       4,
        QuestionType.MCQ:                2,
        QuestionType.FILL_IN_THE_BLANKS: 1,
        QuestionType.TRUE_FALSE:         1,
        QuestionType.MATCHING:           2,
    },
    GradeBand.HIGH_SCHOOL: {
        QuestionType.SHORT_ANSWER:       5,
        QuestionType.MCQ:                2,
        QuestionType.FILL_IN_THE_BLANKS: 2,
        QuestionType.TRUE_FALSE:         1,
        QuestionType.MATCHING:           3,
    },
    GradeBand.ADVANCED: {
        QuestionType.SHORT_ANSWER:       6,
        QuestionType.MCQ:                2,
        QuestionType.FILL_IN_THE_BLANKS: 2,
        QuestionType.TRUE_FALSE:         1,
        QuestionType.MATCHING:           3,
    },
}

# Grade number → band mapping
GRADE_TO_BAND: Dict[str, GradeBand] = {
    "1":  GradeBand.KINDERGARTEN,
    "2":  GradeBand.KINDERGARTEN,
    "3":  GradeBand.PRIMARY,
    "4":  GradeBand.PRIMARY,
    "5":  GradeBand.ELEMENTARY,
    "6":  GradeBand.ELEMENTARY,
    "7":  GradeBand.MIDDLE_SCHOOL,
    "8":  GradeBand.MIDDLE_SCHOOL,
    "9":  GradeBand.HIGH_SCHOOL,
    "10": GradeBand.HIGH_SCHOOL,
    "11": GradeBand.ADVANCED,
    "12": GradeBand.ADVANCED,
}


@dataclass
class ScoringResult:
    """Result of applying scoring to a question set."""
    questions: dict                          # questions with marks injected
    marks_per_type: Dict[str, int]          # marks per single question of each type
    count_per_type: Dict[str, int]          # how many questions of each type
    subtotal_per_type: Dict[str, int]       # marks_per_type * count_per_type
    total_marks: int                        # grand total
    grade_band: str                         # which band was applied


import re as _re

def _extract_grade_num(grade: str) -> str:
    match = _re.search(r'(\d+)', str(grade))
    return match.group(1) if match else "5"


def get_grade_band(grade: str) -> GradeBand:
    grade_num = _extract_grade_num(grade)
    return GRADE_TO_BAND.get(grade_num, GradeBand.ELEMENTARY)


def get_marks_for_type(grade: str, question_type: QuestionType) -> int:
    """
    Return the canonical marks for one question of the given type at this grade.
    This is the ONLY place marks are assigned — not the LLM.
    """
    band = get_grade_band(grade)
    return MARKS_TABLE[band][question_type]


def apply_scoring(questions_data: dict, grade: str) -> ScoringResult:
    """
    Inject deterministic `marks` into every question object.
    
    - Overwrites any `marks` value the LLM may have hallucinated.
    - Validates question structure; skips malformed entries with a log warning.
    - Returns a ScoringResult with full breakdown.

    Args:
        questions_data: Raw dict from LLM (keys: short_answer, mcq, etc.)
        grade: Grade string e.g. "8"

    Returns:
        ScoringResult with scored questions + mark breakdown
    """
    band = get_grade_band(grade)
    marks_table = MARKS_TABLE[band]

    scored_questions: dict = {}
    marks_per_type: Dict[str, int] = {}
    count_per_type: Dict[str, int] = {}
    subtotal_per_type: Dict[str, int] = {}
    total_marks: int = 0

    for qtype in QuestionType:
        raw_list = questions_data.get(qtype.value, [])

        # Edge case: LLM returned a dict instead of a list
        if isinstance(raw_list, dict):
            raw_list = list(raw_list.values())

        # Edge case: LLM returned None
        if raw_list is None:
            raw_list = []

        marks_each = marks_table[qtype]
        valid_questions = []

        for idx, q in enumerate(raw_list):
            # Edge case: question is not a dict
            if not isinstance(q, dict):
                print(f"⚠️  Skipping malformed {qtype.value}[{idx}]: not a dict → {type(q)}")
                continue

            # Edge case: question text is missing or empty
            if not q.get("question", "").strip():
                print(f"⚠️  Skipping {qtype.value}[{idx}]: empty question text")
                continue

            # Edge case: MCQ missing options or options not a list
            if qtype == QuestionType.MCQ:
                opts = q.get("options")
                if not isinstance(opts, list) or len(opts) < 2:
                    print(f"⚠️  Skipping MCQ[{idx}]: invalid options → {opts}")
                    continue
                # Normalize options to exactly 4 if LLM returned 3 or 5
                if len(opts) < 4:
                    opts += ["—"] * (4 - len(opts))
                    q["options"] = opts[:4]
                elif len(opts) > 4:
                    q["options"] = opts[:4]

            # Edge case: true_false answer not boolean-like
            if qtype == QuestionType.TRUE_FALSE:
                ans = str(q.get("answer", "")).lower().strip()
                if ans not in ("true", "false", "yes", "no"):
                    print(f"⚠️  Normalizing true_false[{idx}] answer: '{ans}' → 'true'")
                    q["answer"] = "true"
                else:
                    # Normalize yes/no → true/false
                    q["answer"] = "true" if ans in ("true", "yes") else "false"

            # Edge case: answer field missing entirely
            if "answer" not in q:
                q["answer"] = ""
                print(f"⚠️  {qtype.value}[{idx}] has no answer field — defaulting to empty string")

            # ✅ Overwrite marks deterministically — never trust LLM
            q["marks"] = marks_each
            valid_questions.append(q)

        scored_questions[qtype.value] = valid_questions

        count = len(valid_questions)
        subtotal = count * marks_each
        total_marks += subtotal

        marks_per_type[qtype.value] = marks_each
        count_per_type[qtype.value] = count
        subtotal_per_type[qtype.value] = subtotal

    return ScoringResult(
        questions=scored_questions,
        marks_per_type=marks_per_type,
        count_per_type=count_per_type,
        subtotal_per_type=subtotal_per_type,
        total_marks=total_marks,
        grade_band=band.value,
    )


def compute_expected_total(
    grade: str,
    short_answer: int = 0,
    mcq: int = 0,
    fill_in_the_blanks: int = 0,
    true_false: int = 0,
    matching: int = 0,
) -> dict:
    """
    Compute the expected total marks BEFORE generation.
    Call this when the teacher configures the assignment — lets them see
    the mark distribution upfront without waiting for LLM output.

    Args:
        grade: Grade string
        *counts: Number of questions per type

    Returns:
        Dict with per-type breakdown and grand total
    """
    band = get_grade_band(grade)
    marks_table = MARKS_TABLE[band]

    counts = {
        QuestionType.SHORT_ANSWER:       short_answer,
        QuestionType.MCQ:                mcq,
        QuestionType.FILL_IN_THE_BLANKS: fill_in_the_blanks,
        QuestionType.TRUE_FALSE:         true_false,
        QuestionType.MATCHING:           matching,
    }

    breakdown = {}
    total = 0

    for qtype, count in counts.items():
        if count > 0:
            marks_each = marks_table[qtype]
            subtotal = marks_each * count
            total += subtotal
            breakdown[qtype.value] = {
                "count": count,
                "marks_each": marks_each,
                "subtotal": subtotal,
            }

    return {
        "grade": grade,
        "grade_band": band.value,
        "breakdown": breakdown,
        "total_marks": total,
    }