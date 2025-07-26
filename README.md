# Payload CMS Website Template

A modern website template built with [Payload CMS](https://payloadcms.com) and [Next.js](https://nextjs.org).

## Features

- **Payload CMS** - Headless CMS with admin panel
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Sentry Integration** - Error tracking and performance monitoring
- **Vercel Analytics & Speed Insights** - Performance monitoring
- **Form Builder** - Dynamic form creation
- **SEO Plugin** - Built-in SEO management
- **Search Plugin** - Full-text search capabilities
- **Redirects Plugin** - URL redirection management
- **Nested Docs** - Hierarchical content structure

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/w9be1tip0v/zeus.git
   cd zeus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

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
