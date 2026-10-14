# Netflix × CineMatch — Personalized Movie Recommendation Platform

A production grade, full stack movie recommendation system wrapped in a stunning Netflix inspired web experience. Combines three state of the art ML algorithms with a beautifully designed React frontend.


## Overview

**CineMatch** is a personalized movie recommendation engine built on the [MovieLens](https://grouplens.org/datasets/movielens/) dataset. It blends **three distinct recommendation strategies** into a unified hybrid model and serves results through a Netflix quality streaming interface.

### Recommendation Algorithms

| Algorithm | How it works |
|---|---|
| **Collaborative Filtering (SVD)** | Matrix factorization (Singular Value Decomposition) over user movie rating interactions. Learns latent factors for both users and movies. Tuned with randomized grid search. |
| **Content Based Filtering** | TF IDF genre & tag embeddings + cosine similarity. Matches movies to a user's genre affinities without needing any ratings history. |
| **Popularity Weighted Bayes** | Bayesian average rating (shrinks towards global mean) weighted by recency of ratings. Ensures new users see broadly well regarded movies. |

All three signals are blended in a configurable weighted sum, then **re ranked with MMR (Maximal Marginal Relevance)** to balance accuracy with genre diversity.


## Architecture

```text
cinematch/
├── backend/                     # Python FastAPI ML Backend
│   ├── app/
│   │   ├── main.py              # FastAPI app factory, CORS, static file serving
│   │   ├── api.py               # REST API routes (/users, /home, /movies, /metrics, /meta)
│   │   ├── engine.py            # Hybrid recommendation engine orchestrator
│   │   ├── models/
│   │   │   ├── collaborative.py # SVD via scipy.sparse.linalg.svds
│   │   │   ├── content.py       # TF IDF genre embeddings, cosine similarity
│   │   │   ├── popularity.py    # Bayesian average with recency decay
│   │   │   └── hybrid.py        # Weighted blend + MMR re ranking
│   │   ├── evaluation/
│   │   │   ├── runner.py        # Offline evaluation: Precision@K, Recall@K, NDCG@K
│   │   │   └── tuning.py        # Randomized hyperparameter search
│   │   ├── schemas.py           # Pydantic request/response models
│   │   └── data_loader.py       # MovieLens CSV ingestion & preprocessing
│   ├── data/                    # MovieLens 100K dataset (movies.csv, ratings.csv, tags.csv)
│   ├── reports/                 # Auto generated evaluation plots (PNG)
│   ├── scripts/
│   │   ├── download_data.py     # Downloads MovieLens dataset
│   │   └── tune.py              # Runs hyperparameter tuning & saves best config
│   ├── tests/                   # 17 pytest tests covering API, engine, and model logic
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                    # React 18 + Vite + Tailwind CSS Web App
│   ├── src/
│   │   ├── App.jsx              # Root component with routing & modals
│   │   ├── Components/
│   │   │   ├── Pages/
│   │   │   │   ├── Intro.jsx        # Splash screen + "Who's Watching?" profile picker
│   │   │   │   ├── Home.jsx         # Main page: banner, recommendation rows
│   │   │   │   └── MetricsDashboard.jsx  # Analytics modal: offline eval metrics & charts
│   │   │   ├── Card/
│   │   │   │   ├── CineCard.jsx     # Hover expand card with match %, why badge, genres
│   │   │   │   └── MovieModal.jsx   # Full movie detail modal with "More Like This"
│   │   │   ├── Row/
│   │   │   │   └── CineRow.jsx      # Row: 5 cards in grid + 5 more in horizontal scroll
│   │   │   ├── Layouts/
│   │   │   │   ├── Header.jsx       # Sticky Netflix navbar: Home, Build Profile, Analytics
│   │   │   │   ├── CustomProfileBuilder.jsx  # Search movies, rate them, get custom recs
│   │   │   │   └── Footer.jsx
│   │   │   └── PlayCard/
│   │   │       └── PlayCard.jsx     # TMDB hero banner with trailer playback
│   │   ├── Requests/
│   │   │   ├── backendApi.js    # Axios client for CineMatch backend API
│   │   │   ├── imageHelper.js   # Movie image helpers + random.jpg fallback
│   │   │   └── request.js       # TMDB API endpoints
│   │   ├── Store/               # Redux Toolkit store (active user profile)
│   │   └── assets/              # SVG icons, GIF splash, user profile images
│   ├── index.html
│   └── vite.config.js
│
├── pyrightconfig.json           # Pyright type checker config
├── .vscode/settings.json        # VS Code Python analysis settings
└── README.md
```


## Getting Started

### Prerequisites

* **Python 3.10+** with pip
* **Node.js 18+** with npm
* A **TMDB API key** (free at [themoviedb.org](https://www.themoviedb.org/))

### 1. Set Up the Python Virtual Environment

```powershell
# From the repo root
python -m venv .venv
.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install -r backend\requirements.txt
```

### 2. Download the Dataset

```powershell
cd backend
python scripts\download_data.py
```

This downloads and extracts the MovieLens dataset into `backend/data/`.

### 3. (Optional) Run Hyperparameter Tuning

```powershell
# From the backend directory
python scripts\tune.py
```

Saves the best SVD component count and MMR lambda to `backend/config.json`.

### 4. Start the Backend API

```powershell
# From the repo root
cd backend
..\\.venv\\Scripts\\uvicorn app.main:app --reload --port 8000
```

* **API docs (Swagger):** http://localhost:8000/docs
* **Evaluation reports:** http://localhost:8000/reports/segments_ndcg.png

> **Note:** If port 8000 is in use, try `--port 8001` and update `VITE_BACKEND_URL` in `frontend/.env`.

### 5. Start the Frontend

```powershell
# Open a second terminal, from the repo root
cd frontend
npm install       # First time only
npm run dev
```

* **Web App:** http://localhost:5173


## Key Features

### 3 Algorithm Hybrid Recommendations
Each recommendation row on the home page is generated by the hybrid engine and labeled by strategy:
* **"Because you watched..."** — Collaborative SVD
* **"Taste Aligned"** — Content/genre matching
* **"Trending"** — Popularity weighted Bayesian ranking
* **Mixed rows** — MMR diversified blend of all three

### Build Your Own Taste Profile
Click **Build Profile** in the navbar to open the custom profile builder:
1. Search any of 9,700+ movies
2. Rate each movie (0.5 to 5 stars)
3. Click **Generate My Recommendations** to get real time personalized results

### Card Details
* **Match % badge** (red) in the top right of every card
* **Hover to expand** — see genres, rating, why this was recommended
* **Click to open detail modal** — full explanation, model confidence signals (Collaborative / Content / Popularity bars), and "More Like This" strip
* **1 in 8 cards** shows a red contextual badge (e.g. "Critically Acclaimed", "Trending Hit", "Taste Aligned")

### Analytics Dashboard
Click **Analytics** in the navbar to open the offline evaluation dashboard:
* Precision@K, Recall@K, NDCG@K metrics for all three models + hybrid
* User activity segment breakdown (Cold / Warm / Heavy users)
* MMR accuracy vs diversity tradeoff charts


## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users/{id}/home?k=10` | Personalized recommendation rows for a benchmark user |
| `POST` | `/api/home` | Custom profile recommendations from provided ratings |
| `GET` | `/api/movies/search?q=...` | Full text movie search |
| `GET` | `/api/movies/{id}/similar?k=8` | Content based similar movies |
| `GET` | `/api/metrics` | Offline evaluation benchmark results |
| `GET` | `/api/meta` | Dataset metadata (user IDs, movie count) |


## Running Tests

```powershell
cd backend
..\\.venv\\Scripts\\pytest -q
```

All 17 tests should pass. Tests cover:
* API endpoint correctness & response schemas
* Hybrid engine output (deduplication, row structure, score ranges)
* SVD collaborative model training & prediction
* Content based similarity correctness
* Popularity model Bayesian smoothing


## Environment Variables

Create `frontend/.env` to customize API endpoints:

```env
VITE_TMDB_KEY=your_tmdb_api_key_here
VITE_BACKEND_URL=http://127.0.0.1:8000/api
```


## Tech Stack

### Backend
* **FastAPI** — async Python REST framework
* **scipy** — SVD matrix factorization (`scipy.sparse.linalg.svds`)
* **scikit learn** — TF IDF vectorizer, cosine similarity
* **pandas / numpy** — data processing & numerical ops
* **pytest** — automated test suite

### Frontend
* **React 18** — component based UI
* **Vite** — lightning fast dev server & build tool
* **Tailwind CSS** — utility first styling
* **Redux Toolkit** — global state (active user profile)
* **React Router DOM** — client side routing
* **Axios** — HTTP client for backend & TMDB API
* **TMDB API** — movie posters, backdrop images, trailer URLs


## Dataset

**MovieLens Latest Small** — [GroupLens Research](https://grouplens.org/datasets/movielens/)
* 100,000 ratings
* 9,742 movies
* 610 users
* Ratings from 0.5 to 5.0 stars
