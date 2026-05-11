# HalalBank

Subscription & Auto-Payment Reminder System built with .NET 8 Web API and React.

## Project Setup

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- SQL Server (LocalDB or full instance)

### Backend
```bash
cd src/API
dotnet restore
dotnet run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Solution Structure

```
src/
├── Domain          # Entities, Enums, Repository Interfaces
├── Application     # DTOs, Mappers, Business Logic Services
├── Infrastructure  # EF Core DbContext, Repositories, Mock External Services
└── API             # Controllers, Middleware, Program.cs
frontend/           # React + TypeScript + Vite
```

## AI Usage

This project was developed with AI assistance for:
- Code generation (scaffolding, boilerplate)
- API design recommendations
- Business rule implementation guidance
- Validation logic

All AI-generated output was reviewed and adapted to ensure correctness and alignment with project requirements.
