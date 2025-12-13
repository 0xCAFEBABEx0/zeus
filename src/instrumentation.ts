

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

export const onRequestError = async (err: Error, request: Request, context: unknown) => {
  const Sentry = await import('@sentry/nextjs')
  Sentry.captureRequestError(err, request as any, context)
}
