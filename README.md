# Sharow

A smart electricity bill analyzer that helps users understand their energy consumption and reduce costs through appliance-level cost breakdown and AI-powered insights.

## Overview

Sharow allows users to scan their electricity bills, track appliance-specific energy costs, and receive personalized recommendations for reducing their electricity bills. The system uses Gemini AI to extract bill data and provide contextual energy-saving advice through conversational chat.

## Architecture

- **Client**: Flutter mobile application (Android)
- **Server**: Node.js/Express backend with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Google Gemini for bill OCR and conversational assistance
- **Storage**: Cloudinary for bill image hosting

## Features

- Bill image upload and automatic data extraction
- Appliance-level cost calculation based on usage hours and wattage
- Shadow waste (vampire load) estimation
- Conversational AI for follow-up questions about bills
- Historical bill tracking and comparison
- Personalized energy-saving recommendations

## Project Structure

```
sharow/
├── client/          # Flutter mobile app
│   ├── lib/
│   │   ├── models/
│   │   ├── providers/
│   │   ├── screens/
│   │   ├── services/
│   │   └── widgets/
│   └── pubspec.yaml
├── server/          # Express backend
│   ├── src/
│   │   ├── agent/          # Gemini AI agent
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   └── services/
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
└── compose.dev.yaml
```

## Setup

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Flutter SDK
- PostgreSQL (via Docker)

### Environment Variables

Create `.env` file in server directory:

```
GEMINI_API_KEY=your_gemini_api_key
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/sharow
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=8080
```

### Installation

1. Start the database:

```bash
docker compose -f compose.dev.yaml up -d db
```

1. Install server dependencies:

```bash
cd server
npm install
```

1. Run database migrations:

```bash
npx prisma migrate deploy
npx prisma generate
```

1. Start the server:

```bash
npm run dev
```

1. Install Flutter dependencies:

```bash
cd client
flutter pub get
```

1. Run the Flutter app:

```bash
flutter run
```

## API Endpoints

### Authentication

- POST `/api/auth/signup` - User registration
- POST `/api/auth/login` - User login
- POST `/api/auth/refresh` - Refresh access token

### Bills

- POST `/api/bills/analyze` - Upload and analyze bill image
- POST `/api/bills/chat` - Chat about a specific bill
- GET `/api/bills` - Get all user bills
- GET `/api/bills/:billId` - Get specific bill details

## Database Schema

### User

- Basic authentication and profile information

### Bill

- Extracted bill data including total amount, units consumed, billing date
- Appliance-level cost breakdown
- Shadow waste calculation
- AI-generated analysis and tips

### Conversation

- Chat history for each bill
- Maintains context for follow-up questions

## Development

### Running in Development

Server with hot reload:

```bash
cd server
npm run dev
```

Flutter with hot reload:

```bash
cd client
flutter run
```

### Database Management

Generate Prisma client after schema changes:

```bash
npx prisma generate
```

Create new migration:

```bash
npx prisma migrate dev --name migration_name
```

View database in Prisma Studio:

```bash
npx prisma studio
```

## License

MIT
