# -----------------------------
# Imports
# -----------------------------
import time
import pickle
import os
import chromadb
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.retrievers import BM25Retriever
from langchain_community.vectorstores import Chroma, FAISS
from langchain.retrievers import EnsembleRetriever
from langchain.chains import RetrievalQA
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import GoogleGenerativeAI  # LLM only

# -----------------------------
# 1️⃣ Load PDF & Chunk
# -----------------------------
pdf_path = r"C:\Users\SOURABH\Desktop\eeev102.pdf"
loader = PyPDFLoader(pdf_path)
documents = loader.load()

# Clean and normalize text
for doc in documents:
    doc.page_content = doc.page_content.replace("\n", " ").strip()

# Split into chunks
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=700,
    chunk_overlap=120,
    separators=["\n\n", "\n", " ", ""]
)
chunks = text_splitter.split_documents(documents)
print(f"✅ Split into {len(chunks)} chunks")

# Extract text for embedding
documents_text = [chunk.page_content for chunk in chunks]

# -----------------------------
# 2️⃣ Setup Hugging Face Embeddings (BEFORE storing)
# -----------------------------
embedding_function = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)
print("✅ Using HuggingFace all-MiniLM-L6-v2 embeddings")

# Compute embeddings once for all chunks
print("🧠 Generating embeddings for chunks (please wait)...")
embeddings_list = embedding_function.embed_documents(documents_text)
print(f"✅ Generated {len(embeddings_list)} embeddings")

# -----------------------------
# 3️⃣ Setup ChromaDB Cloud
# -----------------------------
try:
    client_chroma = chromadb.CloudClient(
        api_key='ck-3K4vgYRnPvD7fbEeGWAkUu3NUS3ehuVckxKMWafn36QZ',
        tenant='bea8a25d-2534-4bca-9c00-798f1e7b084f',
        database='smart campus'
    )

    collection = client_chroma.get_or_create_collection(name="grade5_science")

    ids = [f"chunk_{i}" for i in range(len(chunks))]
    metadatas = [
        {
            "source": chunk.metadata.get("source", "unknown"),
            "page": chunk.metadata.get("page", 0),
            "chunk_index": i
        }
        for i, chunk in enumerate(chunks)
    ]

    # ✅ Add chunks *with precomputed embeddings*
    collection.upsert(
        embeddings=embeddings_list,
        documents=documents_text,
        metadatas=metadatas,
        ids=ids
    )
    print("✅ All chunks added with embeddings to ChromaDB Cloud successfully!")
except Exception as e:
    print(f"⚠️ Could not connect to ChromaDB Cloud: {e}")
    client_chroma = None

# -----------------------------
# 4️⃣ Create ChromaDB Retriever (Cloud or Local)
# -----------------------------
if client_chroma:
    chroma_vectorstore = Chroma(
        client=client_chroma,
        collection_name="grade5_science",
        embedding_function=embedding_function
    )
    chroma_retriever = chroma_vectorstore.as_retriever(search_kwargs={"k": 3})
    print("✅ ChromaDB Cloud retriever is ready")
else:
    # Fallback: Local FAISS retriever
    faiss_vectorstore = FAISS.from_texts(documents_text, embedding=embedding_function)
    chroma_retriever = faiss_vectorstore.as_retriever(search_kwargs={"k": 3})
    print("⚠️ Using FAISS local retriever (offline fallback)")

# -----------------------------
# 5️⃣ Create BM25 Keyword Retriever
# -----------------------------
bm25_retriever = BM25Retriever.from_documents(chunks)
bm25_retriever.k = 3
print("✅ BM25 keyword retriever is ready")

with open("bm25_retriever.pkl", "wb") as f:
    pickle.dump(bm25_retriever, f)
print("✅ BM25 retriever saved as bm25_retriever.pkl")

# -----------------------------
# 6️⃣ Combine Hybrid Retriever (BM25 + Chroma)
# -----------------------------
hybrid_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, chroma_retriever],
    weights=[0.5, 0.5]
)
print("✅ Hybrid retriever is ready")

# -----------------------------
# 7️⃣ Setup Gemini LLM
# -----------------------------
GEMINI_API_KEY = "AIzaSyDiKW_9EKdrufqeVfpoMjqGiuK58hMAKN0"
os.environ['GOOGLE_API_KEY'] = GEMINI_API_KEY

llm = GoogleGenerativeAI(model="models/gemini-2.5-pro", temperature=0.3)
print("✅ Gemini LLM is ready (for answer generation only)")

# -----------------------------
# 8️⃣ Create RAG QA Chain
# -----------------------------
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=hybrid_retriever,
    chain_type="stuff",
    return_source_documents=True
)
print("✅ QA Chain is ready")

# -----------------------------
# 9️⃣ Ask a Question
# -----------------------------
query = "give objective type question and their answers on this topic - When a River Floods"
print(f"\n🤔 Query: {query}")

try:
    result = qa_chain.invoke({"query": query})

    print("\n🤖 Answer:\n", result["result"])
    print("\n📄 Sources:")
    unique_sources = {doc.page_content for doc in result["source_documents"]}
    for i, source_content in enumerate(unique_sources):
        print(f"--- Source {i+1} ---\n", source_content[:200], "...\n")

except Exception as e:
    print(f"\n❌ An error occurred while running the QA chain: {e}")
