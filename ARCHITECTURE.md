# 🏗️ Architecture Guide

This document describes the architecture, design decisions, and data flows of GitTogether.

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser / Client                         │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────▼──────────────────────────────────────┐
│                                                              │
│  Frontend Layer (Next.js + React + TypeScript)              │
│  ├── Pages (app router)                                     │
│  ├── Components (UI, Forms, Filters)                        │
│  └── Hooks & State Management                               │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ JSON-RPC / HTTP API
┌──────────────────────▼──────────────────────────────────────┐
│                                                              │
│  Backend Layer (Node.js + Express + TypeScript)             │
│  ├── API Routes (REST endpoints)                            │
│  ├── Business Logic (Services)                              │
│  ├── GitHub Integration (API sync)                          │
│  └── Authentication (OAuth, JWT)                            │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ SQL Queries
┌──────────────────────▼──────────────────────────────────────┐
│                                                              │
│  Data Layer (PostgreSQL + Prisma ORM)                       │
│  ├── User Profiles & Auth                                   │
│  ├── Repository Metadata                                    │
│  ├── Contribution Tracking                                  │
│  ├── Messaging & Collaboration                              │
│  └── Collections & Favorites                                │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP API
┌──────────────────────▼──────────────────────────────────────┐
│                    GitHub API                               │
└──────────────────────────────────────────────────────────────┘
```

## 🗄️ Database Schema

### Users Table
```sql
users {
  id              String @id @default(cuid())
  username        String @unique
  email           String @unique
  avatarUrl       String?
  bio             String?
  skills          String[]
  level           String  -- beginner, intermediate, advanced
  portfolioUrl    String?
  githubId        Int @unique
  githubToken     String @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Repositories Table
```sql
repositories {
  id              String @id @default(cuid())
  name            String
  owner           String
  description     String?
  url             String @unique
  stars           Int @default(0)
  forks           Int @default(0)
  issues          Int @default(0)
  language        String?
  topics          String[]
  difficulty      String  -- beginner, intermediate, advanced
  isActive        Boolean @default(true)
  lastSyncedAt    DateTime
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Contributions Table
```sql
contributions {
  id              String @id @default(cuid())
  userId          String @db.StringId
  repositoryId    String @db.StringId
  role            String  -- contributor, maintainer
  pullRequests    Int @default(0)
  issues          Int @default(0)
  commits         Int @default(0)
  joinedAt        DateTime
  createdAt       DateTime @default(now())

  user            User @relation(fields: [userId], references: [id])
  repository      Repository @relation(fields: [repositoryId], references: [id])
}
```

### Messages Table
```sql
messages {
  id              String @id @default(cuid())
  senderId        String @db.StringId
  recipientId     String @db.StringId
  conversationId  String @db.StringId
  content         String @db.Text
  isRead          Boolean @default(false)
  createdAt       DateTime @default(now())

  sender          User @relation("sent", fields: [senderId], references: [id])
  recipient       User @relation("received", fields: [recipientId], references: [id])
}
```

### Collections Table
```sql
collections {
  id              String @id @default(cuid())
  userId          String @db.StringId
  name            String
  description     String?
  isPublic        Boolean @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User @relation(fields: [userId], references: [id])
  repositories    Repository[]
}
```

## 🔄 Data Flows

### Discovery Flow

```
User Search Query
       ↓
Search Service (lib/services/SearchService.ts)
       ↓
Database Query (Prisma)
       ↓
Apply Filters (language, difficulty, stars, etc)
       ↓
Sort Results (by relevance, stars, activity)
       ↓
Return Paginated Results (20 per page)
       ↓
Frontend renders Repository Cards
```

### Collaboration Flow

```
User Finds Project
       ↓
View Project Details
       ↓
View Contributors List
       ↓
Click "Connect" on a contributor
       ↓
Create Message in Database
       ↓
Send Notification (WebSocket/Email)
       ↓
Recipient Accepts/Declines Connection
       ↓
Start Messaging in Direct Messages
```

### GitHub Sync Flow

```
Scheduled Job (every 6 hours)
       ↓
GitHub API Client (lib/github.ts)
       ↓
Fetch trending repos, new projects, etc
       ↓
Transform data to normalized format
       ↓
Upsert into PostgreSQL (Prisma)
       ↓
Update search indexes
       ↓
Log sync completion
```

## 🔐 Authentication & Authorization

### Flow

```
1. User clicks "Sign in with GitHub"
   ↓
2. OAuth2 Authorization Code Grant
   - User approves GitTogether access
   - GitHub redirects with authorization code
   ↓
3. Backend exchanges code for access token
   - Stores encrypted token in database
   ↓
4. Create/Update user session
   - Generate JWT token
   - Store in httpOnly cookie
   ↓
5. Frontend authenticated for subsequent requests
```

### Permissions

- **Public**: View repos, search, browse
- **Authenticated**: Save collections, message users, edit profile
- **Repository Owner**: Delete collections, manage settings

## 📊 API Structure

### REST Endpoints

```
GET    /api/repos                    # List repositories
GET    /api/repos/:id                # Get repository details
GET    /api/repos/:id/contributors   # Get contributors

POST   /api/auth/github              # GitHub OAuth callback
GET    /api/auth/me                  # Current user
POST   /api/auth/logout              # Logout

GET    /api/users/:id                # Get user profile
PUT    /api/users/:id                # Update user profile

POST   /api/messages                 # Send message
GET    /api/messages/:conversationId # Get conversation
PUT    /api/messages/:id             # Mark as read

POST   /api/collections              # Create collection
GET    /api/collections/:id          # Get collection
DELETE /api/collections/:id          # Delete collection
```

## ⚡ Performance Optimizations

### Database
- **Indexing**: Indexed on `difficulty`, `language`, `stars`, `createdAt`
- **Query Optimization**: Use Prisma's `select` to fetch only needed fields
- **Pagination**: Always paginate large result sets (20 items per page)

### Frontend
- **Code Splitting**: Dynamic imports for route-based code splitting
- **Image Optimization**: Next.js Image component with lazy loading
- **Caching**: Implemented react-query for data caching & synchronization

### Backend
- **Response Caching**: Redis cache for frequently accessed repos (TTL: 1 hour)
- **Database Connection Pooling**: PgBouncer for connection management
- **Compression**: gzip for all JSON responses

## 🔌 External Integrations

### GitHub API
- **Endpoint**: `https://api.github.com`
- **Rate Limiting**: 5,000 req/hour (authenticated)
- **Sync Frequency**: Every 6 hours
- **Used For**: Repository data, contributor stats, trending projects

### Email Service (future)
- **Provider**: SendGrid or Mailgun
- **Use Cases**: Connection requests, notifications, newsletters

### Analytics (future)
- **Provider**: Plausible or Mixpanel
- **Tracking**: Search queries, profile views, collaborations

## 🚀 Deployment Architecture

### Production Stack

```
GitHub → (Webhooks) → CloudFlare → (HTTPS) → Load Balancer → 
   ├── API Server 1 (Docker container)
   ├── API Server 2 (Docker container)
   └── API Server 3 (Docker container)
          ↓
      PostgreSQL (managed)
          ↓
      Redis (cache)
```

### Scaling Strategy

- **Horizontal**: Add more container replicas behind load balancer
- **Database**: Connection pooling + read replicas for scaling
- **Caching**: Redis for session & frequent query caching
- **CDN**: CloudFlare for static assets & DDoS protection

## 🔒 Security

### Data Protection
- **Passwords**: Bcrypt with salt rounds = 12
- **Tokens**: JWT with HS256, expiry = 7 days
- **API Keys**: Encrypted in database, rotated quarterly
- **HTTPS**: Enforced for all connections

### API Security
- **Rate Limiting**: 100 req/minute per IP
- **CORS**: Restricted to known domains
- **CSRF Protection**: Tokens for state-changing operations
- **Input Validation**: Sanitized & validated on backend

### Database Security
- **Prepared Statements**: Prisma prevents SQL injection
- **Row-Level Security**: Users can only access their own data
- **Encryption at Rest**: Database encryption enabled
- **Backups**: Daily automated backups with point-in-time recovery

## 📈 Monitoring & Logging

- **Application Logs**: Stored in `/var/log/gitogether/`
- **Error Tracking**: Sentry integration for crash reporting
- **Performance Metrics**: Prometheus + Grafana for monitoring
- **Uptime Monitoring**: Healthcheck endpoint at `/api/health`

## 🛠️ Technology Decisions

### Why Next.js?
- Server-side rendering for better SEO
- Built-in API routes (no separate backend needed initially)
- Excellent TypeScript support
- Vercel deployment with zero-config

### Why PostgreSQL?
- ACID compliance for data integrity
- Powerful query language for complex searches
- JSON columns for flexible schema
- Excellent full-text search capabilities

### Why Prisma ORM?
- Type-safe database access
- Auto-generated migrations
- Great developer experience
- Excellent documentation

## 📚 Related Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) — Infrastructure and deployment
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Development guidelines
- [SECURITY.md](./SECURITY.md) — Security policies

---

**Questions?** Open an issue or start a discussion!
