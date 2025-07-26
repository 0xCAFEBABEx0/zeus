# Payload CMS Website Template

A modern website template built with [Payload CMS](https://payloadcms.com) and [Next.js](https://nextjs.org).

## Features

- **Payload CMS** - Headless CMS with admin panel
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Sentry Integration** - Error tracking and performance monitoring
- **CodeRabbit** - AI-powered code review and suggestions
- **Vercel Analytics & Speed Insights** - Performance monitoring
- **Form Builder** - Dynamic form creation
- **SEO Plugin** - Built-in SEO management
- **Search Plugin** - Full-text search capabilities
- **Redirects Plugin** - URL redirection management
- **Nested Docs** - Hierarchical content structure

## Development Flow

This project follows a **Development → Preview → Production** workflow using Vercel:

### 1. **Development (Local)**
```bash
# Clone and setup
git clone https://github.com/w9be1tip0v/zeus.git
cd zeus
pnpm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your local configuration

# Start development server
pnpm dev
```

**Access**: [http://localhost:3000](http://localhost:3000)

### 2. **Preview (Staging)**
```bash
# Create and push to preview branch
git checkout -b preview
git push -u origin preview
```

**Access**: Vercel automatically creates a preview URL for each push to the `preview` branch

### 3. **Production**
```bash
# Merge preview branch to main
git checkout main
git merge preview
git push origin main
```

**Access**: Production URL (configured in Vercel)

## Environment Configuration

### Environment Variables
- **Development**: Uses `.env.local`
- **Preview**: Uses Vercel environment variables (staging)
- **Production**: Uses Vercel environment variables (production)

### Sentry Integration
- **Development**: `development` environment
- **Preview**: `staging` environment  
- **Production**: `production` environment

### Database
- **Development**: Local or development database
- **Preview**: Production database (read-only recommended)
- **Production**: Production database

## Deployment

This project is configured for deployment on Vercel with automatic deployments triggered by Git pushes.

### Environment Variables

Set the following environment variables in your Vercel project:

- `PAYLOAD_SECRET` - Secret key for Payload CMS
- `MONGODB_URI` - MongoDB connection string (if using MongoDB)
- `POSTGRES_URL` - PostgreSQL connection string (if using PostgreSQL)
- `SENTRY_DSN` - Sentry DSN for error tracking

## Sentry Integration

This project includes comprehensive Sentry integration for error tracking, performance monitoring, and logging.

### Test Sentry Features

Visit `/sentry-test` to test Sentry functionality:
- Error tracking with `myUndefinedFunction()`
- Performance monitoring with custom spans
- Structured logging
- API error tracking

## Code Review with CodeRabbit

CodeRabbit provides AI-powered code reviews for every pull request:

### Features
- **Automatic Review**: CodeRabbit automatically reviews all PRs
- **Inline Comments**: Get suggestions directly in your code
- **VSCode/Cursor Integration**: View reviews in your editor
- **Learning**: CodeRabbit learns from your codebase patterns

### Setup in VSCode/Cursor
1. Install recommended extensions: `Ctrl/Cmd + Shift + P` → "Extensions: Show Recommended Extensions"
2. Install `CodeRabbit` extension from the list
3. CodeRabbit will show inline comments and suggestions in your editor
4. Access CodeRabbit panel from the sidebar for detailed reviews

### Usage
- CodeRabbit automatically reviews all pull requests
- Check the GitHub PR page for comprehensive review comments
- Use the VSCode extension to see suggestions while coding
- Interactive chat with CodeRabbit for code explanations

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run generate:types` - Generate TypeScript types
- `npm run generate:importmap` - Generate import map for admin

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (frontend)/        # Public-facing pages
│   └── (payload)/         # Payload CMS admin
├── blocks/                # Content blocks
├── collections/           # Payload CMS collections
├── components/            # React components
├── fields/                # Custom form fields
├── heros/                 # Hero section components
├── plugins/               # Payload CMS plugins
├── providers/             # React context providers
└── utilities/             # Utility functions
```

## License

MIT

---

**Deployment Trigger**: This commit triggers a new Vercel deployment.
