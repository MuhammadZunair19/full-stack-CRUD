# Cloud CRUD App

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=111827)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-DynamoDB%20%2B%20S3-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)

A polished full-stack CRUD application built to demonstrate cloud-native development with a modern React interface, an Express REST API, file uploads, Amazon DynamoDB item storage, and Amazon S3 attachment storage with secure signed URLs.

This project was designed as a cloud computing course project, but it is structured like a real deployable app: clean frontend/backend separation, environment-based configuration, local development storage, AWS-ready services, Docker support, and a production build served by Express.

## Why This Project Stands Out

- Full CRUD workflow: create, read, update, and delete item records.
- File attachment support with image previews and file replacement.
- Secure attachment access through signed URLs when using S3.
- Local storage mode for fast demos without AWS credentials.
- AWS storage mode for DynamoDB and S3 integration.
- Responsive dashboard UI with item stats, search, cards, and detail modal.
- Docker-ready production deployment.
- Health check endpoint for monitoring.

## Preview

The frontend is a deploy-ready dashboard experience with:

- A hero section for the project identity.
- Live stats for records and attachments.
- A create/edit panel.
- Searchable item grid.
- Attachment previews and download/open actions.
- Mobile-friendly layout.

Add a screenshot to your repo at `docs/screenshot.png`, then uncomment this line:

```md
<!-- ![Cloud CRUD App Screenshot](docs/screenshot.png) -->
```

## Architecture

```text
React + Vite Frontend
        |
        | HTTP / multipart form-data
        v
Express.js REST API
        |
        |-- Local development mode
        |     |-- JSON item records
        |     `-- Local uploaded files
        |
        `-- AWS production mode
              |-- DynamoDB item records
              `-- S3 private file objects + signed URLs
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, CSS, lucide-react |
| Backend | Node.js 20, Express.js, Multer |
| Cloud Database | Amazon DynamoDB |
| Cloud Storage | Amazon S3 |
| AWS SDK | AWS SDK for JavaScript v3 |
| Deployment | Docker, Docker Compose |

## Project Structure

```text
.
|-- backend/
|   |-- .env.example
|   |-- package.json
|   `-- src/
|       |-- config.js
|       |-- server.js
|       `-- services/
|           |-- itemService.js
|           `-- stores/
|               |-- awsItemStore.js
|               `-- localItemStore.js
|-- frontend/
|   |-- .env.example
|   |-- index.html
|   |-- package.json
|   |-- vite.config.js
|   `-- src/
|       |-- App.jsx
|       |-- api.js
|       |-- main.jsx
|       `-- styles.css
|-- Dockerfile
|-- docker-compose.yml
|-- package.json
`-- README.md
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- Docker, optional
- AWS account and credentials, only required for AWS mode

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment Files

Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

macOS/Linux:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Run in Local Mode

Local mode works without AWS credentials.

In `backend/.env`, keep:

```env
STORAGE_DRIVER=local
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
```

Start the app:

```bash
npm run dev
```

Open:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:3001
Health:   http://localhost:3001/health
```

If PowerShell blocks `npm`, use:

```powershell
npm.cmd run dev
```

## Running Services Separately

Backend only:

```bash
npm run dev --workspace backend
```

Frontend only:

```bash
npm run dev --workspace frontend
```

## Production Build

Build the frontend:

```bash
npm run build
```

Start the production backend:

```bash
npm start
```

In production mode, Express serves the compiled frontend from `frontend/dist`.

## AWS Mode

To use DynamoDB and S3, update `backend/.env`:

```env
STORAGE_DRIVER=aws
AWS_REGION=us-east-1
DYNAMODB_TABLE=crud-items
S3_BUCKET=crud-item-attachments
SIGNED_URL_EXPIRES_SECONDS=3600
```

Create these AWS resources:

- DynamoDB table with partition key `id` of type `String`.
- S3 bucket for attachment storage.

The backend uses the standard AWS SDK credential provider chain, so credentials can come from environment variables, an AWS profile, an EC2 role, Elastic Beanstalk, or another supported AWS identity source.

Required IAM capabilities:

- DynamoDB: read, write, scan, and delete table items.
- S3: put, get, and delete bucket objects.

## Docker

Create `backend/.env`, then run:

```bash
docker compose up --build
```

Open:

```text
http://localhost:3001
```

The Docker image builds the frontend and serves it through the backend.

## API Reference

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | API health check |
| GET | `/api/items` | List all items |
| GET | `/api/items/:id` | Get one item |
| POST | `/api/items` | Create an item |
| PUT | `/api/items/:id` | Update an item |
| DELETE | `/api/items/:id` | Delete an item |
| GET | `/api/files/:storageKey` | Open local-mode attachment |

Create and update requests use `multipart/form-data`.

| Field | Required | Description |
| --- | --- | --- |
| `name` | Yes | Item name |
| `description` | No | Item description |
| `file` | No | Attachment file |
| `removeFile` | No | Use `true` during update to remove the current attachment |

## Useful Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run frontend and backend together |
| `npm run build` | Build the frontend for production |
| `npm start` | Start the production backend |
| `npm run lint --workspace frontend` | Lint the frontend |

## Local Storage Notes

When `STORAGE_DRIVER=local`:

- Item records are stored in `backend/data/items.json`.
- Uploaded files are stored in `backend/uploads`.
- Attachment links are served through the backend at `/api/files/:storageKey`.

These folders are ignored by Git so local demo data does not pollute the repository.

## Cloud Concepts Demonstrated

- Server-side REST API design.
- Multipart file upload handling.
- NoSQL item persistence with DynamoDB.
- Object storage with S3.
- Private file access through signed URLs.
- Environment-based configuration.
- Containerized deployment.
- Frontend production bundling with Vite.

## Future Improvements

- Add authentication with Amazon Cognito.
- Add pagination for large DynamoDB tables.
- Add upload progress indicators.
- Add automated tests for API routes.
- Add CI/CD deployment workflow.

## License

This project is licensed under the [MIT License](LICENSE).
