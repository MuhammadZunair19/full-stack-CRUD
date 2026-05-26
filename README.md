# Cloud CRUD App

A full-stack CRUD application for managing items with optional file attachments. The project is built for a cloud computing course and demonstrates a React frontend, an Express API, file uploads, DynamoDB item storage, and private S3 object storage with signed URLs.

The app can also run locally without AWS credentials. In local mode, item records are saved to JSON and uploaded files are saved under the backend folder, which makes development and demos easier.

## Features

- Create items with a name, description, and optional attachment.
- View all items in a responsive grid.
- Open item details in a modal.
- Edit item text and replace or remove attachments.
- Delete items and clean up attached files.
- Preview image files.
- Use AWS DynamoDB and S3 when configured.
- Use local storage for offline development.
- Serve the production frontend from the Express backend.

## Tech Stack

- Frontend: React 18, Vite, lucide-react, CSS.
- Backend: Node.js 20, Express, Multer, AWS SDK v3.
- Cloud services: Amazon DynamoDB and Amazon S3.
- Deployment: Docker and Docker Compose.

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
|-- frontend/
|   |-- .env.example
|   |-- index.html
|   |-- package.json
|   `-- src/
|-- Dockerfile
|-- docker-compose.yml
|-- package.json
`-- README.md
```

## Prerequisites

- Node.js 20 or newer.
- npm.
- AWS credentials only if you want to run with DynamoDB and S3.

## Run Locally

1. Install dependencies from the project root.

```bash
npm install
```

2. Create environment files.

On Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

On macOS/Linux:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Keep local storage enabled in `backend/.env`.

```env
STORAGE_DRIVER=local
PORT=3001
FRONTEND_ORIGIN=http://localhost:3000
```

4. Start the frontend and backend together.

```bash
npm run dev
```

5. Open the app.

```text
Frontend: http://localhost:3000
Backend:  http://localhost:3001
Health:   http://localhost:3001/health
```

If PowerShell blocks `npm`, use `npm.cmd` instead:

```powershell
npm.cmd run dev
```

## Run Backend Only

```bash
npm run dev --workspace backend
```

The API starts on `http://localhost:3001`.

## Run Frontend Only

```bash
npm run dev --workspace frontend
```

The frontend starts on `http://localhost:3000`.

## Build for Production

```bash
npm run build
```

This creates the frontend production build in `frontend/dist`. The Express backend is configured to serve that build.

Start the production backend:

```bash
npm start
```

Then open:

```text
http://localhost:3001
```

## AWS Configuration

To use AWS services, update `backend/.env`:

```env
STORAGE_DRIVER=aws
AWS_REGION=us-east-1
DYNAMODB_TABLE=crud-items
S3_BUCKET=crud-item-attachments
SIGNED_URL_EXPIRES_SECONDS=3600
```

Create these AWS resources:

- A DynamoDB table named `crud-items`, or the name you set in `DYNAMODB_TABLE`.
- The DynamoDB table must use `id` as the partition key with type `String`.
- An S3 bucket named `crud-item-attachments`, or the name you set in `S3_BUCKET`.

The backend uses the standard AWS SDK credential chain. You can provide credentials through environment variables, an AWS profile, EC2 role, Elastic Beanstalk role, or another supported AWS identity source.

The IAM identity running the backend needs permission to:

- Read, write, scan, and delete items in the DynamoDB table.
- Put, get, and delete objects in the S3 bucket.

## Docker

Create `backend/.env` first, then build and run with Docker Compose:

```bash
docker compose up --build
```

The container exposes the backend on:

```text
http://localhost:3001
```

In production Docker mode, the backend serves the compiled frontend as well.

## API Endpoints

```text
GET    /health
GET    /api/items
GET    /api/items/:id
POST   /api/items
PUT    /api/items/:id
DELETE /api/items/:id
```

Create and update requests use `multipart/form-data`.

Fields:

- `name` required.
- `description` optional.
- `file` optional attachment.
- `removeFile` optional on update. Use `true` to remove the current attachment.

## Useful Scripts

```bash
npm run dev
npm run build
npm start
npm run lint --workspace frontend
```

## Notes

- Local mode stores data in `backend/data` and uploaded files in `backend/uploads`.
- Uploaded files are limited to 10MB.
- S3 attachments are accessed through signed URLs.
- Signed URL expiry is controlled by `SIGNED_URL_EXPIRES_SECONDS`.
