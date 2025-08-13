# FPL Company Challenge

A modern web application for running Fantasy Premier League competitions within your company. Built with Next.js 14, TypeScript, Prisma, and PostgreSQL.

## ✨ Features

- **User Registration & Management**: Self-service registration with admin approval workflow
- **Weekly Leaderboards**: Real-time gameweek standings from FPL API
- **Monthly Competitions**: Monthly leaderboards with CSV export functionality
- **Admin Dashboard**: Comprehensive user management with secure authentication
- **FPL Integration**: Direct integration with Fantasy Premier League API
- **Responsive Design**: Works perfectly on desktop and mobile devices

## 🔧 Recent Improvements

This version includes several key improvements over the original MVP:

### Security Enhancements

- ✅ **JWT-based admin authentication** instead of simple cookies
- ✅ **Rate limiting** on all API endpoints to prevent abuse
- ✅ **Secure password comparison** to prevent timing attacks
- ✅ **Input validation** with comprehensive error handling
- ✅ **Admin operation logging** and attempt tracking

### Performance Optimizations

- ✅ **In-memory caching** for FPL API responses
- ✅ **Retry logic** with exponential backoff for API calls
- ✅ **Parallel data fetching** where possible
- ✅ **Database query optimization**

### User Experience Improvements

- ✅ **Loading states** throughout the application
- ✅ **Confirmation dialogs** for destructive actions
- ✅ **Toast notifications** for better feedback
- ✅ **Better error messages** with actionable information
- ✅ **Enhanced styling** with improved CSS classes

### Developer Experience

- ✅ **Environment variable validation** with Zod
- ✅ **Better TypeScript types** throughout
- ✅ **Comprehensive error handling**
- ✅ **Code organization** and modularity

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- FPL team IDs for testing

### Environment Setup

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd fpl-company-challenge
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```bash
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/fpl_challenge"

   # Admin Configuration (minimum 8 characters)
   ADMIN_PASSWORD="your-secure-admin-password"

   # Environment
   NODE_ENV="development"

   # Optional configurations (defaults shown)
   RATE_LIMIT_REQUESTS=100
   RATE_LIMIT_WINDOW_MS=900000
   FPL_API_TIMEOUT_MS=10000
   FPL_CACHE_TTL_SECONDS=300
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Visit the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Usage Guide

### For Participants

1. **Register**: Go to `/register` and fill out the form with your FPL Team ID
2. **Wait for approval**: Admin will review and approve your registration
3. **View leaderboards**: Check weekly and monthly standings once approved

### For Administrators

1. **Access admin panel**: Navigate to `/admin` (you'll be redirected to login)
2. **Login**: Use the admin password you set in environment variables
3. **Manage users**: Approve pending registrations, manage existing users
4. **Add users directly**: Pre-approve users without registration process

### Finding Your FPL Team ID

1. Log in to [fantasy.premierleague.com](https://fantasy.premierleague.com)
2. Go to "Pick Team" → "Gameweek History"
3. Your Team ID is the number in the URL (e.g., 1234567)

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom components
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based admin sessions
- **External API**: Fantasy Premier League API

### Project Structure

```
├── app/                    # Next.js App Router pages and API routes
│   ├── admin/             # Admin panel pages
│   ├── api/               # API endpoints
│   ├── leaderboard/       # Leaderboard page
│   ├── monthly/           # Monthly competition page
│   └── register/          # User registration page
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
│   ├── db.ts             # Database connection
│   ├── fpl.ts            # FPL API integration
│   ├── adminAuth.ts      # Admin authentication
│   ├── rateLimiter.ts    # Rate limiting middleware
│   └── env.ts            # Environment validation
├── prisma/               # Database schema and migrations
└── public/               # Static assets
```

### API Endpoints

- `GET /api/leaderboard` - Weekly leaderboard data
- `GET /api/monthly` - Monthly competition data
- `POST /api/registrations` - User registration
- `GET /api/users` - List users (admin only)
- `POST /api/users` - Create user (admin only)
- `PATCH /api/users/[id]` - Update user status (admin only)
- `DELETE /api/users/[id]` - Delete user (admin only)
- `POST /api/admin/login` - Admin authentication

## 🔒 Security Features

- **Rate limiting** prevents API abuse
- **JWT authentication** with secure token handling
- **Password complexity** requirements for admin
- **Input validation** on all endpoints
- **SQL injection protection** via Prisma ORM
- **CSRF protection** through SameSite cookies

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Add database** (Vercel Postgres or external PostgreSQL)
4. **Deploy** - Vercel will automatically build and deploy

### Docker Deployment

```dockerfile
# Example Dockerfile (create this file)
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production

```bash
DATABASE_URL="your-production-database-url"
ADMIN_PASSWORD="strong-production-password"
NODE_ENV="production"
```

## 🐛 Troubleshooting

### Common Issues

**Database connection fails**

- Check DATABASE_URL format
- Ensure PostgreSQL is running
- Verify network connectivity

**FPL API errors**

- Check if FPL website is accessible
- Verify team IDs are valid
- Rate limiting may be in effect

**Admin login issues**

- Verify ADMIN_PASSWORD in environment
- Check for rate limiting after multiple failed attempts
- Clear cookies and try again

### Health Checks

Visit `/api/health` (if implemented) to check system status:

- Database connectivity
- FPL API accessibility
- Cache status

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Check environment configuration
npm run env-check

# Test database connection
npx prisma db push --preview-feature
```

## 📈 Performance Tips

1. **Database optimization**

   - Index frequently queried columns
   - Use connection pooling in production

2. **Caching strategy**

   - FPL API responses are cached for 5 minutes
   - Consider Redis for distributed caching

3. **Monitoring**
   - Monitor FPL API response times
   - Track database query performance
   - Watch rate limit hit rates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Add proper error handling
- Update documentation for new features
- Test admin functionality thoroughly

## 📝 License

This project is for educational and internal company use. Fantasy Premier League is a trademark of the Premier League.

## 🆘 Support

For support:

1. Check the troubleshooting section
2. Review environment variable configuration
3. Check application logs for specific errors
4. Ensure FPL API is accessible from your server

---

**Note**: This application uses public FPL API endpoints and respects their rate limits. It's designed for internal company use and should not be used for commercial purposes without proper authorization.
