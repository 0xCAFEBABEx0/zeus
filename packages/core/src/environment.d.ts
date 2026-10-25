declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URI: string
      /** Public website URL, e.g. https://ausor.ai */
      NEXT_PUBLIC_SERVER_URL: string
      /** Payload CMS URL, e.g. https://cms.ausor.ai */
      NEXT_PUBLIC_CMS_URL: string
      /** Shared secret the CMS uses to call the website's /api/revalidate */
      REVALIDATION_SECRET?: string
      /** Admin session cookie domain, e.g. .ausor.ai (production only) */
      COOKIE_DOMAIN?: string
      VERCEL_PROJECT_PRODUCTION_URL: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
