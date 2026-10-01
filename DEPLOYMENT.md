# KEETY Deployment Guide

## Overview

KEETY is a two-service application:

- `backend`: Express API on Node.js 20+
- `frontend`: Vite-built React app served through Nginx
- `mongo`: MongoDB instance used by the API for application data and transactional operations

This repository is designed for a platform-neutral deployment using Docker Compose for local staging and a similar container-based deployment for production environments.

## Prerequisites

- Docker Engine 24+
- Docker Compose v2+
- Node.js 20+ for local development and tests
- A MongoDB URI for production or a Docker-hosted MongoDB service
- A valid Gemini API key if AI features are enabled

## Environment variables

Generate local values before running Compose:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Required backend variables:

- `MONGODB_URI`: MongoDB connection string for the application database
- `JWT_SECRET`: minimum 32 characters; must be unique per environment
- `CLIENT_ORIGIN`: allowed frontend origin, for example `http://localhost`

Optional backend variables:

- `NODE_ENV`: `development` or `production`
- `PORT`: HTTP port for the API (default `5000`)
- `JWT_EXPIRES_IN`: default `7d`
- `GEMINI_API_KEY`: blank disables AI gracefully with a controlled 503 response
- `GEMINI_MODEL`: default `gemini-2.5-flash`

Frontend variables:

- `VITE_API_URL`: backend base URL, e.g. `http://localhost:5000/api`

Do not commit real secrets or .env files. Use runtime secret injection in production.

## Local containerized deployment

From the repository root:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

docker compose up --build -d
```

> The compose file uses environment variables from the shell or a local `.env` file. Do not store real credentials in the repository. The Docker daemon must be running before container runtime checks can succeed.

Check service status:

```bash
docker compose ps
```

Health checks:

```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/health/ready
curl http://localhost:5000/api/health/live
curl http://localhost
```

View logs:

```bash
docker compose logs -f backend

docker compose logs -f frontend
docker compose logs -f mongo
```

Stop services:

```bash
docker compose down
```

To remove persisted database data:

```bash
docker compose down -v
```

## Production deployment notes

- Run the API as a non-root container user.
- Inject secrets at runtime instead of baking them into the image.
- Keep the database service private and not exposed publicly unless required.
- Use HTTPS termination at the edge or reverse proxy.
- Ensure `CLIENT_ORIGIN` matches the exact trusted front-end origin.
- Keep `NODE_ENV=production` for runtime containers.
- Do not run migrations automatically in every replica; execute migration-ready schema changes as a controlled deployment step when the database schema changes.

## Database and persistence

KEETY uses MongoDB with transactional operations. For local staging, Compose provisions a MongoDB container configured with a replica set (`rs0`) to support the project's transaction requirements.

Production deployments should use managed MongoDB or a hardened self-hosted MongoDB replica set. Persist the database volume and never reset it in normal deployments.

## Health and readiness

The backend exposes:

- `/api/health` - service heartbeat
- `/api/health/live` - liveness
- `/api/health/ready` - readiness checks the MongoDB connection status

The application should not be considered ready until the database is connected.

## Rollback and recovery

1. Stop the target version.
2. Restore the previous image tag or compose stack.
3. Reattach the persistent database volume if it was removed or recreated.
4. Re-run any required application smoke tests.
5. Confirm the front-end and API are healthy before allowing traffic.

## Known limitations

- The current repository does not include a CI/CD pipeline or guarding deployment automation.
- AI and RAG remain dependent on provider configuration and external service behavior.
- External vector database or embedding infrastructure remains a future enhancement, not a required deployment dependency.

## Verified commands

The following commands were executed successfully in this repository during validation:

```bash
cd backend && npm test
cd frontend && npm run build
```

Docker Compose validation and runtime checks could not be performed because the Docker CLI is not available in this environment. Run these checks after installing Docker Desktop and starting its engine:

```bash
docker version
docker compose build backend frontend
docker compose up --build -d
docker compose ps
curl http://localhost:5000/api/health
curl http://localhost:5000/api/health/ready
curl http://localhost:5000/api/health/live
curl http://localhost
```

The observed blocker was:

```text
The term 'docker' is not recognized as the name of a cmdlet, function, script file, or executable program.
```
