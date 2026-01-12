# Contributing to BookMyBike

Thank you for your interest in contributing to BookMyBike! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+
- Git
- Supabase account (for database)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/riderbookmybike-blip/bookmy.bike.git
   cd bookmy.bike
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your Supabase credentials.

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

5. **Run a production build (before pushing)**
   ```bash
   npm run build
   ```

### Database Setup

1. Create a new Supabase project
2. Run the schema from `marketplace_v2.sql`
3. Seed data using `seed/tenants.json` via `/api/admin/seed`

## 📁 Project Structure

```
src/
├── app/           # Next.js App Router pages & API routes
├── components/    # Reusable UI components
├── lib/           # Utilities, Supabase clients, contexts
├── actions/       # Server actions
├── hooks/         # Custom React hooks
├── types/         # TypeScript type definitions
└── proxy.ts       # Middleware for subdomain routing
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |
| `npm run format` | Format code with Prettier |

## 📝 Code Style

- Use TypeScript for all new files
- Follow existing patterns in the codebase
- Run `npm run lint` before committing
- Run `npm run build` to verify no errors

## 🔀 Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run build` locally
4. Commit with descriptive messages
5. Push and create a Pull Request
6. Wait for review

## 🐛 Reporting Issues

Please use GitHub Issues to report bugs. Include:
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser/OS information

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.
