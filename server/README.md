# Drawing Tool V2 - Backend API

Express + TypeScript + PostgreSQL backend for Drawing Tool V2.

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your DATABASE_URL
# DATABASE_URL=postgresql://user:password@localhost:5432/drawing_tool

# Initialize database
psql -d drawing_tool -f init.sql

# Start development server
npm run dev
```

Server runs on `http://localhost:3001`

### Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Check if server is running

### Prompts
- `GET /api/prompts` - Get all prompts
- `GET /api/prompts/:id` - Get specific prompt
- `POST /api/prompts` - Create new prompt
- `PATCH /api/prompts/:id` - Update prompt
- `DELETE /api/prompts/:id` - Delete prompt

### Artworks
- `GET /api/artworks` - Get all artworks
- `GET /api/artworks?status=approved` - Get approved artworks
- `GET /api/artworks/next-number` - Get next prompt number
- `POST /api/artworks` - Create new artwork
- `PATCH /api/artworks/:id/approve` - Approve artwork
- `DELETE /api/artworks/:id` - Delete artwork

### Site Content
- `GET /api/site-content` - Get site configuration
- `PUT /api/site-content` - Update site configuration

## Database Schema

### Tables

**prompts**
- id (TEXT, PRIMARY KEY)
- prompt (TEXT)
- email (TEXT)
- status (TEXT) - 'pending' | 'completed' | 'in_progress'
- prompt_number (INTEGER)
- created_at (TIMESTAMP)
- completed_at (TIMESTAMP)
- artwork_id (TEXT)

**artworks**
- id (TEXT, PRIMARY KEY)
- prompt_id (TEXT, FOREIGN KEY)
- prompt_number (INTEGER)
- image_data (TEXT) - base64 encoded
- artist_name (TEXT)
- artist_email (TEXT)
- status (TEXT) - 'pending' | 'approved' | 'rejected'
- is_admin_created (BOOLEAN)
- created_at (TIMESTAMP)
- approved_at (TIMESTAMP)

**site_content**
- id (TEXT, PRIMARY KEY)
- project_title (TEXT)
- project_description (TEXT)
- book_link (TEXT)
- book_title (TEXT)
- updated_at (TIMESTAMP)

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development|production)

## Tech Stack

- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Runtime**: Node.js 18+

## Deployment

See [POSTGRESQL_RAILWAY_SETUP.md](../POSTGRESQL_RAILWAY_SETUP.md) for complete deployment guide.

Quick deploy to Railway:
```bash
railway init
railway up
```

## Development

### File Structure

```
server/
├── src/
│   ├── index.ts      # Express server & routes
│   ├── schema.ts     # Database schema (Drizzle)
│   ├── db.ts         # Database connection
│   └── migrate.ts    # Migration script
├── init.sql          # Database initialization
├── package.json
└── tsconfig.json
```

### Adding New Endpoints

1. Define schema in `src/schema.ts`
2. Add route in `src/index.ts`
3. Update `init.sql` if needed
4. Test locally
5. Deploy

### Database Migrations

For schema changes:

1. Update `src/schema.ts`
2. Update `init.sql`
3. Test locally
4. Deploy (Railway will use new schema)

## Testing

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test get prompts
curl http://localhost:3001/api/prompts

# Test create prompt
curl -X POST http://localhost:3001/api/prompts \
  -H "Content-Type: application/json" \
  -d '{"id":"test1","prompt":"Test","email":"test@test.com"}'
```

## Troubleshooting

### Connection refused
- Check `DATABASE_URL` is correct
- Verify PostgreSQL is running
- Check firewall settings

### Port already in use
```bash
# Change PORT in .env
PORT=3002
```

### Build errors
```bash
# Clean install
rm -rf node_modules dist
npm install
npm run build
```

## License

MIT
