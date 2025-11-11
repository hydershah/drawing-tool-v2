# Drawing Tool v2

A modern web-based drawing application with support for both local (IndexedDB) and cloud (PostgreSQL) storage.

## 🎯 Key Features

- **Organic Brush Engine**: Speed-sensitive brush with natural texture and randomization
- **Flexible Storage**: Choose between local IndexedDB or PostgreSQL backend
- **Modern Architecture**: Built with React 18, TypeScript, and Vite
- **Dark Mode**: Full theme support with next-themes
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Admin System**: Simple password-based admin authentication
- **Cloud Deployment**: Ready to deploy on Railway

## 🗄️ Storage Options

### Option 1: IndexedDB (Local - Default)
- ✅ Fast and offline-first
- ✅ No backend required
- ✅ Free
- ❌ Data isolated per device

### Option 2: PostgreSQL (Cloud)
- ✅ Shared database across users
- ✅ Works across devices
- ✅ Automatic backups
- ⚠️ Requires backend server (~$10/month)

**See:** [SWITCH_TO_POSTGRESQL.md](SWITCH_TO_POSTGRESQL.md)

## 🏗️ Architecture Improvements

### What's New in v2

1. **No Backend Dependency**: Fully local storage using localStorage
2. **Better TypeScript**: Strict typing throughout with comprehensive type definitions
3. **Cleaner Code**: Rebuilt from scratch with modern React patterns
4. **Better Organization**: Feature-based folder structure
5. **Improved Performance**: Optimized rendering and state management
6. **Simplified Config**: Clean Vite config without workarounds

### Tech Stack

- **Framework**: React 18.3.1
- **Language**: TypeScript 5.7.2
- **Build Tool**: Vite 6.3.5 with SWC
- **Routing**: React Router DOM 7.9.5
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI primitives
- **State Management**: React Context API
- **Theme**: next-themes for dark mode

## 📁 Project Structure

```
drawing-tool-v2/
├── src/
│   ├── components/
│   │   ├── canvas/          # Drawing canvas components
│   │   ├── layout/          # Layout components (Header, ThemeToggle)
│   │   └── ui/              # Reusable UI components (Button, Input, etc.)
│   ├── contexts/            # React Context providers
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Page components
│   ├── services/            # Services (storage)
│   ├── styles/              # Global styles
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Main app with routing
│   └── main.tsx             # Entry point
├── public/
│   ├── fonts/               # Custom fonts
│   └── logos/               # Logo assets
└── [config files]
```

## 🚀 Getting Started

### Quick Start (Local IndexedDB)

```bash
cd drawing-tool-v2
npm install
npm run dev
```

App will be available at `http://localhost:5173`

### PostgreSQL Backend Setup

For shared database with cloud deployment:

**Quick Deploy (10 minutes):**
See [QUICK_START.md](QUICK_START.md)

**Full Guide:**
See [POSTGRESQL_RAILWAY_SETUP.md](POSTGRESQL_RAILWAY_SETUP.md)

```bash
# 1. Install backend dependencies
cd server && npm install

# 2. Set up PostgreSQL on Railway
# Follow guide in QUICK_START.md

# 3. Start backend
npm run dev  # Runs on :3001

# 4. Start frontend (new terminal)
cd .. && npm run dev  # Runs on :5173
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🎨 Features

### Public Features

- **Submit Prompts**: Users can submit drawing prompts with their email
- **Browse Gallery**: View all approved artworks
- **Browse Prompts**: See all submitted prompts and their status
- **Theme Toggle**: Switch between light and dark modes

### Admin Features

- **Create Artwork**: Use the drawing canvas with adjustable brush settings
- **Admin Authentication**: Simple password-based login (default: `admin123`)
- **Manage Gallery**: All admin-created artwork automatically appears in gallery

## 🎯 Canvas Features

- **Canvas Size**: 500x700px (aspect ratio 5:7)
- **Brush Settings**:
  - Size: 5-80 pixels
  - Ink Density: 10-100
  - Contrast: 0-100
- **Speed-Sensitive**: Brush width varies with drawing speed
- **Organic Texture**: Randomized dots for natural appearance
- **High-Res Export**: 5x scale export for quality
- **Background**: Warm beige (#f4efe9)

## 💾 Data Storage

### IndexedDB (Default)
All data stored locally in browser:

- **Database Name**: `DrawingToolDB`
- **Tables**: `prompts`, `artworks`, `siteContent`
- **Admin Session**: localStorage
- **Theme**: localStorage

### PostgreSQL (Optional)
Server-side storage with Railway:

- **Tables**: `prompts`, `artworks`, `site_content`
- **Backend API**: Express + TypeScript
- **ORM**: Drizzle ORM
- **See**: [server/README.md](server/README.md)

**Switch between backends:** [SWITCH_TO_POSTGRESQL.md](SWITCH_TO_POSTGRESQL.md)

## 🔒 Admin Access

Default admin password: `admin123`

To change the password, update `ADMIN_PASSWORD` in:
```typescript
src/utils/constants.ts
```

## 🎨 Customization

### Theme Colors

Edit theme colors in `src/styles/globals.css`:
- Light mode: `:root { --background: ... }`
- Dark mode: `.dark { --background: ... }`

### Canvas Settings

Edit canvas configuration in `src/utils/constants.ts`:
- Canvas dimensions
- Brush defaults
- Export settings

## 📦 Build Output

- Production build: `dist/`
- Bundle size: ~277KB (89KB gzipped)
- Static assets optimized for production

## 🔧 Development Notes

### Code Quality

- Strict TypeScript mode enabled
- ESLint configured
- No unused locals/parameters allowed
- Comprehensive error handling

### Performance

- Request Animation Frame for smooth drawing
- React.memo() for component optimization
- Lazy loading where applicable
- Optimized bundle with code splitting

## 📝 Differences from v1

| Feature | v1 | v2 |
|---------|----|----|
| Backend | Supabase | Local Storage |
| Config | Complex with aliases | Clean |
| TypeScript | Partial | Strict |
| State | Mixed | Context API |
| Code Style | Original | Rebuilt from scratch |
| Dependencies | Many workarounds | Clean |

## 📚 Documentation

- **Quick Start**: [QUICK_START.md](QUICK_START.md) - Deploy in 10 minutes
- **Full Setup**: [POSTGRESQL_RAILWAY_SETUP.md](POSTGRESQL_RAILWAY_SETUP.md) - Complete guide
- **Migration**: [SWITCH_TO_POSTGRESQL.md](SWITCH_TO_POSTGRESQL.md) - Switch storage backends
- **Summary**: [POSTGRESQL_MIGRATION_SUMMARY.md](POSTGRESQL_MIGRATION_SUMMARY.md) - What changed
- **Backend**: [server/README.md](server/README.md) - API documentation

## 🚀 Deployment

### Static Site (IndexedDB)
Deploy frontend only:
- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **Railway**: See [railway-deploy-guide.md](railway-deploy-guide.md)

### Full Stack (PostgreSQL)
Deploy backend + frontend:
1. Deploy PostgreSQL to Railway
2. Deploy backend API to Railway
3. Deploy frontend to Vercel/Netlify
4. **Guide**: [QUICK_START.md](QUICK_START.md)

## 🚀 Future Enhancements

Potential improvements:
- [x] PostgreSQL backend option
- [x] Cloud deployment support
- [ ] Export data to JSON
- [ ] Import/restore from backup
- [ ] More brush types
- [ ] Undo/redo functionality
- [ ] Layer support
- [ ] Real-time collaboration
- [ ] Image optimization/compression

## 📄 License

Same as original project

---

Built with ❤️ using React + TypeScript + Vite + PostgreSQL
