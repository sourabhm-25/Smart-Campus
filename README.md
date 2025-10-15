# 🏫 Smart Campus


The primary aim of the **Smart Campus** project is to design and implement an AI-powered educational platform that enhances academic and administrative efficiency while providing personalized learning experiences. The system focuses on adaptive course recommendations, skill-aligned assessments, productivity enhancement, and real-time analytics to support students, faculty, and administrators in a data-driven and intelligent environment.

---

## 🚀 How to Run the Project (CMD Instructions)

### 1️⃣ Install Backend Dependencies Globally

Open **Command Prompt (CMD)** and run:

```bash
pip install langchain langchain-community
```

```bash
pip install fastapi uvicorn chromadb sentence-transformers google-generativeai pickle5
```
---

### 2️⃣ Start the Backend

Run this command from anywhere (as long as you reference the correct path to your `main_backend_hybrid_cloud.py`):

```bash
uvicorn Retrieval:app --reload
```

The backend will be live at: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

### 3️⃣ Start the Frontend

1. Open a **new Command Prompt window**.
2. Go to your React folder:

   ```bash
   cd path\to\your\react\folder
   ```
3. Install dependencies:

   ```bash
   npm install
   ```
4. Run the app:

   ```bash
   npm run dev
   ```

   The frontend will be available at: [http://localhost:5173](http://localhost:5173)

---

### 4️⃣ Fix CORS (if needed)

If you see a CORS error in your browser, add this to your backend file **after importing FastAPI**:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🖥️ Access

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🙌 Contributing

Pull requests welcome! If you have ideas for improvements, feel free to open an issue or PR.

---
