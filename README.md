# 🏫 Smart Campus: AI-Powered Educational Platform


**Smart Campus** is a next-generation, AI-driven educational platform designed to modernize the learning experience. Built as a comprehensive final-year engineering project, it leverages cutting-edge **Retrieval-Augmented Generation (RAG)**, **Vector Databases**, and **Multimodal Large Language Models (LLMs)** to provide dynamic, personalized learning and automated evaluation.

The system serves three primary users—**Students**, **Teachers**, and **Parents**—each with dedicated portals to track progress, assign work, and evaluate performance efficiently.

---

## 🌟 Key Features & AI Capabilities

### 🧠 Subject-Aware Modular RAG System
At the heart of the platform is a sophisticated Retrieval-Augmented Generation pipeline. Teachers can generate dynamic homework assignments, tests, and flashcards directly from parsed textbook data.
- **Vector Search:** Uses **Pinecone** to store and query dense vector embeddings of textbook chapters.
- **Embeddings:** Employs the `BAAI/bge-base-en-v1.5` model (via SentenceTransformers) to generate high-quality semantic embeddings.
- **Contextual Generation:** Uses **Google Gemini (Flash)** via **LangChain** to generate curriculum-aligned questions (MCQs, Short Answer, Fill-in-the-blanks) based on the retrieved context.

### 📝 Automated Handwritten Answer Evaluation (Multimodal AI)
Students can snap a photo of their handwritten homework and receive instant, rubric-driven feedback.
- **Vision-Language Processing:** Uses Gemini's multimodal vision capabilities to transcribe and evaluate handwritten text from images.
- **Deterministic Rubrics:** The system auto-generates a specific marking rubric for every question.
- **Subject-Specific Routing:** Evaluates math step-by-step (checking intermediate working), science conceptually (checking for keywords), and english holistically (band-based scoring).

### 🎤 Speaking & Pronunciation Evaluation
Integrates audio processing and AI to evaluate student speaking assignments, providing instant feedback on fluency and accuracy.

### 👨‍👩‍👧‍👦 Multi-Portal Architecture
- **Student Portal:** Access assignments, submit handwritten homework, take auto-generated quizzes, and view AI feedback.
- **Teacher Portal:** Manage classrooms, generate RAG-based quizzes, oversee AI grading, and review student performance analytics.
- **Parent Portal:** Monitor child's attendance, grades, and overall academic growth.

---

## 💻 Tech Stack

**Frontend:**
- React.js (Vite)
- Tailwind CSS
- Framer Motion (for smooth micro-interactions & animations)
- React Router

**Backend:**
- Python 3 & FastAPI (High-performance async API)
- MongoDB (via PyMongo) for flexible data storage
- JWT & Google OAuth for secure authentication

**AI / ML Pipeline:**
- **LLM:** Google Gemini (`gemini-flash-latest`)
- **Orchestration:** LangChain
- **Vector Database:** Pinecone
- **Embeddings:** SentenceTransformers (`BAAI/bge-base-en-v1.5`)
- **Parsing:** Llama Parse (for extracting structured data from textbook PDFs)

---

## ⚙️ Local Setup & Installation

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- MongoDB (Local or Atlas)
- API Keys: Pinecone, Google Gemini, Llama Parse (optional)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/smart-campus.git
cd smart-campus
```

### 2. Backend Setup
```bash
cd Backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`

# Install dependencies
pip install -r requirements.txt

# Environment Variables
# Create a .env file in the Backend directory and add your keys:
# MONGO_URI=...
# GEMINI_API_KEY=...
# PINECONE_API_KEY=...
# SECRET_KEY=...

# Start the FastAPI server
uvicorn main:app --reload
```
The backend API will be running at `http://127.0.0.1:8000`. You can view the interactive Swagger docs at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
```bash
cd Frontend

# Install dependencies
npm install

# Environment Variables
# Create a .env file in the Frontend directory:
# VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id

# Start the Vite development server
npm run dev
```
The frontend application will be running at `http://localhost:5173`.

---

## 🏗️ System Architecture

1. **Data Ingestion:** Textbook PDFs are processed via Llama Parse, chunked, embedded using `bge-base-en-v1.5`, and stored in Pinecone namespaces categorized by grade and subject.
2. **Querying:** When a teacher requests a quiz on a specific topic, the FastAPI server embeds the query and retrieves the top-K relevant chunks from Pinecone.
3. **Prompt Engineering:** A modular prompt builder constructs a strict JSON-output prompt containing the retrieved context, subject rules, and desired question types.
4. **Grading Pipeline:** Student image submissions are sent to the Gemini Vision API alongside a dynamically generated rubric, returning a deterministic JSON score breakdown.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/smart-campus/issues).

---

*This project was developed as a Final Year Engineering Project, showcasing modern AI integration, Vector Search (RAG), and full-stack development best practices.*
