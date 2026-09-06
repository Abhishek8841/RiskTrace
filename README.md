# RiskTrace

RiskTrace is a supply chain risk analysis tool for open-source software dependencies. It scans a GitHub repository, extracts direct and transitive dependencies, matches them against known vulnerability databases, and produces a risk score with actionable recommendations.

## Team

| Name | Roll Number |
|------|-------------|
| Shaurya Sangwan | 1024030462 |
| Abhishek Batra | 1024030463 |
| Sushain Sharma | 1024030439 |

## Directory Structure

```
RiskTrace/
├── code/              # Application source code (backend + frontend)
├── docs/
│   ├── proposal/      # Project proposal documents
│   └── uml-diagrams/  # Architecture, use case, and data flow diagrams
├── journals/          # Individual contribution logs for each team member
└── idea-pitch-ppt.pdf # Project pitch presentation
```

## Datasets

- [OSS Vulnerabilities Dataset (Kaggle)](https://www.kaggle.com/datasets/japkeeratsingh/oss-vulnerabilities/data)
- [Malicious Software Packages Dataset (DataDog)](https://github.com/DataDog/malicious-software-packages-dataset)

## Code

For the full source code and setup instructions, refer to the [`code/`](./code/) directory. It contains the backend (Node.js + Prisma + PostgreSQL) and frontend (React + Vite) applications along with Docker configuration.
