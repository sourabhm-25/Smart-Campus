# insert_json.py
import json
from pathlib import Path
from db import get_collection

def insert_json_to_mongo(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    coll = get_collection("questions")
    topic = data.get("topic", "Unknown Topic")

    # Split JSON into multiple question docs
    docs = []
    for qtype in ["short_answer", "mcq", "fill_in_the_blanks"]:
        for q in data.get(qtype, []):
            docs.append({
                "topic": topic,
                "type": qtype,
                "question": q["question"],
                "answer": q.get("answer"),
                "options": q.get("options")
            })

    coll.insert_many(docs)
    print(f"✅ Inserted {len(docs)} question documents for {topic}")

if __name__ == "__main__":
    insert_json_to_mongo("questions_Grade_5_-_Science_-_Journey_of_a_River.json")
