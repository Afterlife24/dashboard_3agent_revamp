# Dashboard with WhatsApp Integration

This dashboard now includes both User Management and WhatsApp Agent features in a single interface.

## Features

- **Overview**: User statistics and charts
- **Users**: User management table with export to Excel
- **Analytics**: Detailed analytics charts
- **Agent Usage**: Track agent usage by type (Web, Calling, WhatsApp)
- **WhatsApp**: Live WhatsApp conversation management with AI/Human takeover

## Configuration

The dashboard uses two separate backend APIs:

### 1. User Management API
- **Environment Variable**: `VITE_API_URL`
- **Production**: `https://g1wymxzrle.execute-api.eu-west-3.amazonaws.com`
- **Local**: Configure if you have a local user management backend

### 2. WhatsApp Backend API
- **Environment Variable**: `VITE_WHATSAPP_API_URL`
- **Local Development**: `http://localhost:5000`
- **Production**: Update with your deployed WhatsApp backend URL

## Setup

1. **Install dependencies**:
```bash
cd dashboard_3
npm install
```

2. **Configure environment variables**:
Create a `.env` file (or copy from `.env.example`):
```env
# User Management API
VITE_API_URL=https://g1wymxzrle.execute-api.eu-west-3.amazonaws.com

# WhatsApp Backend API
VITE_WHATSAPP_API_URL=http://localhost:5000
```

3. **Start WhatsApp Backend** (in another terminal):
```bash
cd whatsapp
python app.py
```
This will start the WhatsApp backend on `http://localhost:5000`

4. **Start Dashboard**:
```bash
cd dashboard_3
npm run dev
```

5. **Access Dashboard**:
Open `http://localhost:5173` in your browser

## WhatsApp Features

- View all active conversations
- See AI/Human mode status for each conversation
- Take over conversations from AI to respond manually
- Release conversations back to AI
- Real-time message updates (auto-refresh every 3 seconds)
- Search conversations by phone number

## Production Deployment

When deploying to production:

1. Deploy your WhatsApp backend to a cloud service (AWS Lambda, Heroku, etc.)
2. Update `.env` with the production WhatsApp backend URL:
```env
VITE_WHATSAPP_API_URL=https://your-whatsapp-backend-url.com
```
3. Build and deploy the dashboard:
```bash
npm run build
```

## Port Configuration

- **Dashboard**: Runs on Vite's default port (usually 5173)
- **WhatsApp Backend**: Runs on port 5000 (configurable via `PORT` env variable in `whatsapp/.env`)
- **User Management Backend**: Already deployed on AWS Lambda

Both backends are accessed via their respective environment variables, so no port conflicts occur.
