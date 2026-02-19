"""Quick test to verify Pinecone retrieval works"""
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import os

load_dotenv()

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("grade-5")
model = SentenceTransformer("BAAI/bge-base-en-v1.5")

query = "Represent this educational content for retrieval: fractions"
embedding = model.encode(query).tolist()

# Test 1: Query WITH namespace
print("=" * 60)
print("TEST 1: Query with namespace='grade5_math'")
results = index.query(
    vector=embedding,
    top_k=5,
    namespace="grade5_math",
    include_metadata=True
)
print(f"  Matches found: {len(results['matches'])}")
for m in results["matches"][:2]:
    score = m["score"]
    text = m["metadata"].get("text", "")[:100]
    print(f"  Score: {score:.4f} | Text: {text}...")

# Test 2: Query WITHOUT namespace  
print("\n" + "=" * 60)
print("TEST 2: Query with namespace='' (empty)")
results2 = index.query(
    vector=embedding,
    top_k=5,
    namespace="",
    include_metadata=True
)
print(f"  Matches found: {len(results2['matches'])}")

# Test 3: Query with filter
print("\n" + "=" * 60)
print("TEST 3: Query with namespace='grade5_math' and NO filter")
results3 = index.query(
    vector=embedding,
    top_k=5,
    namespace="grade5_math",
    filter=None,
    include_metadata=True
)
print(f"  Matches found: {len(results3['matches'])}")

# Test 4: Check what metadata filters look like
if results["matches"]:
    print("\n" + "=" * 60)
    print("METADATA of first match:")
    for k, v in results["matches"][0]["metadata"].items():
        if k != "text":
            print(f"  {k}: {v}")
