import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOrRetailer } from '@/access/adminOrRetailer'

export const Brands: CollectionConfig = {
  slug: 'brands',
  access: {
    create: adminOrRetailer,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    useAsTitle: 'name',
    group: 'Content',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
    },
    slugField({
      fieldToUse: 'name',
    }),
  ],
}
