# Integrations Technical Assessment

A full-stack application that integrates with HubSpot, Airtable, and Notion, allowing users to connect and manage data from these services.

## Features

- OAuth 2.0 authentication for HubSpot, Airtable, and Notion
- Data management interface for connected services
- Real-time data synchronization
- Secure credential storage using Redis
- Modern UI with Material-UI components

## Prerequisites

- Python 3.10 or higher
- Node.js 16 or higher
- Redis Server
- Git (optional)

## Backend Dependencies

```txt
fastapi==0.115.12
uvicorn==0.21.0
python-multipart==0.0.20
httpx==0.24.1
redis==4.6.0
requests==2.32.3
python-jose==3.3.0
pydantic==2.10.6
starlette==0.46.1
python-dotenv==1.0.1
```

## Frontend Dependencies

```json
{
  "dependencies": {
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.17.1",
    "@mui/material": "^5.15.0",
    "@testing-library/jest-dom": "^5.17.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.6.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "reactflow": "^11.10.1",
    "web-vitals": "^2.1.4"
  },
  "devDependencies": {
    "@babel/plugin-proposal-private-property-in-object": "^7.21.11"
  }
}
```

## Setup Instructions

### 1. Backend Setup

1. Install Python dependencies:

```bash
cd backend
pip install -r requirements.txt
```

2. Set up Redis:

   - Windows: Download and install Redis from [Redis for Windows](https://github.com/microsoftarchive/redis/releases)
   - macOS: `brew install redis`
   - Linux: `sudo apt-get install redis-server`

3. Start Redis server:

   - Windows: Start Redis service from Services
   - macOS/Linux: `redis-server`

4. Start the backend server:

```bash
uvicorn main:app --reload
```

### 3. Frontend Setup

1. Install Node.js dependencies:

```bash
cd frontend
npm install
```

2. Start the frontend development server:

```bash
npm start
```

## API Documentation

### HubSpot Integration

- `POST /integrations/hubspot/authorize`: Initiate HubSpot OAuth flow
- `GET /integrations/hubspot/oauth2callback`: OAuth callback endpoint
- `GET /integrations/hubspot/credentials`: Retrieve stored credentials
- `DELETE /integrations/hubspot/credentials`: Clear stored credentials
- `GET /integrations/hubspot/items`: Fetch HubSpot items (contacts, companies, deals)

### Airtable Integration

- `POST /integrations/airtable/authorize`: Initiate Airtable OAuth flow
- `GET /integrations/airtable/oauth2callback`: OAuth callback endpoint
- `GET /integrations/airtable/credentials`: Retrieve stored credentials
- `DELETE /integrations/airtable/credentials`: Clear stored credentials
- `GET /integrations/airtable/items`: Fetch Airtable items

### Notion Integration

- `POST /integrations/notion/authorize`: Initiate Notion OAuth flow
- `GET /integrations/notion/oauth2callback`: OAuth callback endpoint
- `GET /integrations/notion/credentials`: Retrieve stored credentials
- `DELETE /integrations/notion/credentials`: Clear stored credentials
- `GET /integrations/notion/items`: Fetch Notion items
