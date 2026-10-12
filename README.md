# CineMatch: Movie Recommendation System & Streaming Platform

A production-grade, full-stack movie recommendation system combining a Machine Learning backend with a modern Netflix-inspired web application.

---

## 📁 Repository Structure (Monorepo)

```text
RecommendationSystem/
├── backend/                  # FastAPI & Recommender Engine
│   ├── app/                  # Core algorithms, API endpoints, schemas, domain models
│   ├── data/                 # MovieLens dataset
│   ├── reports/              # Model evaluation metrics & validation plots
│   ├── scripts/              # Data downloading, hyperparameter tuning & evaluation
│   ├── tests/                # Automated pytest suite (17 tests)
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Container configuration
│
├── frontend/                 # Modern Netflix-Clone Web App
│   ├── src/                  # React 18, Tailwind CSS, Redux Toolkit, React Router DOM
│   ├── public/               # Static assets & favicon
│   ├── package.json          # Node dependencies & build scripts
│   └── vite.config.js        # Vite bundler configuration
│
└── README.md
```

---

## 🚀 Getting Started

### 1. Run the Backend (Python / FastAPI)

```powershell
# Navigate to the backend directory
cd backend

# Start the API server
..\.venv\Scripts\uvicorn app.main:app --reload --port 8000
```
* **API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Embedded Metrics & Reports:** [http://localhost:8000/reports](http://localhost:8000/reports)

---

### 2. Run the Frontend (React + Vite + Tailwind CSS)

```powershell
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install dependencies (first time only)
npm install

# Start the Vite development server
npm run dev
```
* **Web App URL:** [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testing Backend

```powershell
cd backend
..\.venv\Scripts\pytest -q
```
