# CHARISM Community Service Platform

A comprehensive community service management system for universities.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Render account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd CommunityLink
   ```

2. **Set up environment variables**
   - Copy `backend/env_template.txt` to `backend/.env`
   - Fill in your MongoDB URI and other credentials

3. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

4. **Start the application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm start
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

### Production Deployment

1. **Set up Render environment variables:**
   - `MONGO_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Strong random string
   - `EMAIL_USER` - Your email address
   - `EMAIL_PASS` - Your email password

2. **Deploy:**
   - Push to main branch
   - Render will automatically deploy

## 🔒 Security Features

- Rate limiting
- Input sanitization
- Security headers
- Request monitoring
- Password validation
- Email verification

## 📁 Project Structure

```
CommunityLink/
├── backend/                 # Node.js/Express API
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Authentication & security
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   └── server.js           # Main server file
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── api/            # API calls
│   │   └── config/         # Configuration
│   └── public/             # Static assets
└── render.yaml             # Deployment configuration
```

## 🛠️ API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/events` - Get events
- `POST /api/events` - Create event
- `POST /api/contact-us` - Contact form
- `GET /api/health` - Health check

## 📧 Support

For issues and questions, please contact the development team.
