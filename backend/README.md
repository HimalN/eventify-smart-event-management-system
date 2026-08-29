# Smart Event Management System — Backend API

This is the production-quality, modular FastAPI backend for the **Smart Event Management System with Attendance Prediction and Weather Forecast Integration**.

## ── Technology Stack ──
- **Framework**: FastAPI (Python 3.11+)
- **Database**: MySQL (relational storage), SQLAlchemy (async ORM), Alembic (migrations)
- **Security**: JWT OAuth2 authentication with Password Hashing (bcrypt), Role-Based Access Control (RBAC)
- **Machine Learning**: Custom regression pipeline training and comparing 5 algorithms:
  - Linear Regression
  - Decision Tree Regression
  - Random Forest Regression
  - Gradient Boosting Regression (selected production model)
  - XGBoost Regression
- **External Integration**: OpenWeatherMap API One-Call endpoint (with automated mock fallback during local development)

## ── Project Structure ──
```text
backend/
├── app/
│   ├── main.py                 # Application factory and lifespans
│   ├── core/                   # Configurations, dependencies, logging, security
│   ├── database/               # Engine setup, base models, migrations, seed
│   ├── models/                 # SQLAlchemy ORM database models
│   ├── schemas/                # Pydantic validation schemas (camelCase)
│   ├── api/                    # Route endpoints under /api/v1
│   ├── services/               # Core business, weather, predictions and analytics logic
│   └── ml/                     # ML preprocessing, models, training, evaluation
├── datasets/                   # Synthetic event datasets
├── tests/                      # Unit, API, and ML integration tests
├── requirements.txt            # Python package dependencies
├── Dockerfile                  # Container instructions
├── docker-compose.yml          # Container networks (MySQL + FastAPI)
└── .env.example                # Configuration parameters template
```

## ── Setup & Running ──

### 1. Copy Environment File
Copy `.env.example` to `.env` and fill in parameters:
```bash
cp .env.example .env
```

### 2. Create Virtual Environment & Install Dependencies
```bash
python -m venv venv
venv\Scripts\activate   # Windows
# or
source venv/bin/activate # Unix

pip install -r requirements.txt
```

### 3. Generate Synthetic Dataset & Train ML Models
Run the training pipeline script to generate the 1,000-record synthetic events dataset and evaluate the 5 regression models:
```bash
python -m app.ml.train
```
This produces joblib model checkpoints and a `benchmark.json` file inside `app/ml/models/`.

### 4. Run Seed Script (optional)
To populate MySQL with fake admin, organizer, participant, events, registrations, weather, tasks, and notifications:
```bash
python -m app.seed
```

### 5. Run API Development Server
```bash
uvicorn app.main:app --reload
```
The server will start at `http://localhost:8000`. You can inspect endpoints using the built-in interactive docs:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## ── Running Tests ──
To execute the complete unit and integration tests:
```bash
pytest tests/ -v
```

---

## ── Running with Docker Compose ──
To run both MySQL database and FastAPI backend inside isolated containers:
```bash
docker-compose up --build
```
The database will automatically initialize, and the backend service will wait until MySQL is healthy before starting.
