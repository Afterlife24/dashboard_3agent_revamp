# Admin Dashboard

A React-based admin dashboard to view and manage user signups from MongoDB.

## Features

- Admin authentication using the auth_backend
- View all registered users
- Display user statistics (total, verified, unverified, by provider)
- User details including:
  - Name and avatar
  - Email address
  - Provider (email/google)
  - Verification status
  - Signup and last update timestamps

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
The `.env` file is already configured with the production API:
```
VITE_API_URL=https://g1wymxzrle.execute-api.eu-west-3.amazonaws.com
```

For local development, change it to:
```
VITE_API_URL=http://localhost:5000
```

3. Start the development server:
```bash
npm run dev
```

The dashboard will run on `http://localhost:3001`

## Usage

1. The dashboard connects to the production auth backend and displays all users directly
2. No login required - the dashboard is publicly accessible
3. View user statistics and complete user table with all signup details

## Build for Production

```bash
npm run build
```

The production build will be in the `dist` folder.
