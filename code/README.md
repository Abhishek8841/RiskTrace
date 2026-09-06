# RiskTrace - Repository Risk Analyzer (POC)

A proof-of-concept platform for analyzing dependencies and vulnerabilities in public GitHub repositories. Enter a GitHub repository URL, and the system detects dependency manifests, extracts dependencies, queries OSV.dev for known vulnerabilities, and computes a rule-based risk score.

> **Note**: This is an initial POC. The rule-based risk scorer is a temporary heuristic that will be replaced by an ML-based scorer in a future iteration.

## Architecture

```mermaid
graph TD
    A["React Dashboard"] -->|HTTP| B["Fastify REST API"]
    B --> C["ScanService"]
    C --> D["RepositoryCollector"]
    D --> E["RepositoryExplorer"]
    E --> F["ManifestDetector"]
    F --> G["DependencyExtractor"]
    G --> H["VulnerabilityMatcher"]
    H --> I["RuleBasedRiskScorer"]
    I --> J[("PostgreSQL")]
    B --> J
    H -->|HTTP| K["OSV.dev API"]
    D -->|HTTP / Git| L["GitHub API"]
```

### Scan Pipeline

1. **RepositoryCollector** -- Validates the GitHub URL, fetches repository metadata via the GitHub REST API, and shallow-clones the repository to a temporary directory.
2. **RepositoryExplorer** -- Walks the cloned repository tree (skipping `.git`, `node_modules`, `vendor`, etc.) to detect manifest files and ecosystems.
3. **ManifestDetector** -- Uses a parser registry (strategy pattern) to identify supported manifest files.
4. **DependencyExtractor** -- Reads manifest files and delegates to ecosystem-specific parsers to extract normalized dependencies.
5. **VulnerabilityMatcher** -- Queries the OSV.dev API for each dependency to find known vulnerabilities.
6. **RuleBasedRiskScorer** -- Computes a risk score by summing severity weights across all vulnerabilities.

## Tech Stack

| Layer         | Technology                        |
|---------------|-----------------------------------|
| Frontend      | React, TypeScript, Vite, Tailwind CSS |
| Backend       | Node.js, TypeScript, Fastify      |
| Database      | PostgreSQL 16                     |
| ORM           | Prisma                            |
| Infrastructure| Docker, Docker Compose            |

## Quick Start

### Prerequisites

- Docker and Docker Compose
- (Optional) A GitHub personal access token for higher API rate limits

### Run with Docker Compose

```bash
cd code

# (Optional) Create .env with a GitHub token for higher rate limits
cp .env.example .env
# Edit .env and set GITHUB_TOKEN if desired

# Start all services
docker compose up --build
```

Services will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432

### Run Locally (Development)

```bash
# 1. Start PostgreSQL (Docker or local)
docker compose up postgres -d

# 2. Backend
cd code/backend
npm install
cp ../.env.example .env  # Edit DATABASE_URL if needed
npx prisma migrate dev
npm run dev

# 3. Frontend (separate terminal)
cd code/frontend
npm install
npm run dev
```

## Environment Variables

| Variable       | Required | Default                                          | Description                          |
|----------------|----------|--------------------------------------------------|--------------------------------------|
| `DATABASE_URL` | Yes      | `postgresql://risktrace:risktrace@localhost:5432/risktrace` | PostgreSQL connection string         |
| `PORT`         | No       | `3001`                                           | Backend server port                  |
| `GITHUB_TOKEN` | No       | (empty)                                          | GitHub PAT for higher rate limits    |
| `VITE_API_URL` | No       | (empty)                                          | Backend URL for frontend dev proxy   |

## API Endpoints

| Method | Endpoint                        | Description                        |
|--------|----------------------------------|------------------------------------|
| GET    | `/health`                        | Health check                       |
| POST   | `/api/scans`                     | Create and execute a new scan      |
| GET    | `/api/scans`                     | List all scans                     |
| GET    | `/api/scans/:id`                 | Get scan details                   |
| GET    | `/api/scans/:id/dependencies`    | Get dependencies for a scan        |
| GET    | `/api/scans/:id/vulnerabilities` | Get vulnerabilities for a scan     |
| GET    | `/api/repositories`              | List all scanned repositories      |

### POST /api/scans

**Request:**
```json
{
  "repositoryUrl": "https://github.com/expressjs/express"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "status": "COMPLETED",
  "repository": {
    "id": "uuid",
    "owner": "expressjs",
    "name": "express",
    "url": "https://github.com/expressjs/express",
    "defaultBranch": "master",
    "latestCommitSha": "abc1234..."
  },
  "riskScore": 24,
  "riskLevel": "MEDIUM",
  "dependencyCount": 30,
  "vulnerableDependencyCount": 3,
  "ecosystems": ["npm"],
  "manifestFiles": ["package.json"],
  "fileCount": 180
}
```

## Supported Ecosystems

| Ecosystem | Manifest Files                      |
|-----------|-------------------------------------|
| npm       | `package.json`, `package-lock.json` |
| PyPI      | `requirements.txt`, `pyproject.toml`|
| Go        | `go.mod`                            |

## Rule-Based Risk Scoring

This is a **temporary** heuristic used for the POC. It will be replaced by an ML-based scorer.

### Severity Weights

| Severity | Weight |
|----------|--------|
| CRITICAL | 10     |
| HIGH     | 7      |
| MEDIUM   | 4      |
| LOW      | 1      |
| UNKNOWN  | 2      |

### Risk Level Thresholds

| Score Range | Risk Level |
|-------------|------------|
| 0 - 10      | LOW        |
| 11 - 25     | MEDIUM     |
| 26 - 50     | HIGH       |
| 51+         | CRITICAL   |

**Risk Score** = Sum of severity weights for all detected vulnerabilities.

## Current Limitations

- Public GitHub repositories only (no private repos, no auth)
- Direct dependencies only (no transitive dependency resolution)
- Synchronous scanning (no background job queue)
- Version constraints are simplified for vulnerability lookup
- Rate limited by GitHub API (60 req/hr without token, 5000 with token)
- No caching of vulnerability data
- No historical trend analysis

## Future ML Architecture

The `RiskScorer` is defined as an interface:

```typescript
interface RiskScorer {
  calculateScore(vulnerabilities: NormalizedVulnerability[]): RiskResult;
}
```

Currently implemented by `RuleBasedRiskScorer`. In a future iteration, this will be replaced by `MLRiskScorer` which will:

1. Use XGBoost for risk prioritization
2. Incorporate features beyond severity (dependency depth, staleness, maintenance health)
3. Use SHAP for explainability
4. Compare with Random Forest and Logistic Regression baselines

The swap requires **no changes** to the scan pipeline, API routes, or frontend -- only the `RiskScorer` implementation injected into `ScanService` changes.

## Project Structure

```
code/
├── frontend/                 # React + Vite + Tailwind
│   ├── src/
│   │   ├── api/              # API client
│   │   ├── components/       # UI components
│   │   ├── hooks/            # React hooks
│   │   └── types/            # TypeScript types
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                  # Fastify + Prisma
│   ├── prisma/               # Database schema & migrations
│   ├── src/
│   │   ├── api/routes/       # REST endpoints
│   │   ├── database/         # Prisma client
│   │   ├── schemas/          # Request validation (Zod)
│   │   ├── services/
│   │   │   ├── dependencies/ # Dependency extraction
│   │   │   ├── manifests/    # Manifest parsers (Node, Python, Go)
│   │   │   ├── repository/   # GitHub collection & exploration
│   │   │   ├── risk/         # Risk scoring (rule-based)
│   │   │   ├── scan/         # Scan orchestration
│   │   │   └── vulnerabilities/ # OSV.dev integration
│   │   ├── types/            # Shared types
│   │   └── __tests__/        # Unit tests
│   └── Dockerfile
│
├── docker-compose.yml
├── .env.example
└── README.md
```

## Testing

```bash
cd code/backend
npm test
```

Tests cover:
- GitHub URL validation
- package.json parsing
- requirements.txt parsing
- pyproject.toml parsing
- go.mod parsing
- Rule-based risk scoring
