import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: {
    cookies: {
      // Set to `.ausor.ai` in production so the website (ausor.ai) receives the admin session
      // for draft previews. Leave unset on *.vercel.app and localhost.
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
  timestamps: true,
}
