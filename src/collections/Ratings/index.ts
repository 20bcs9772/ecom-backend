import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '@/access/isAuthenticated'
import { adminOrFieldOwner } from '@/access/adminOrFieldOwner'
import { setCustomer } from './hooks/setCustomer'
import { checkUniqueRating } from './hooks/checkUniqueRating'
import { updateAggregatesAfterChange, updateAggregatesAfterDelete } from './hooks/updateAggregates'

export const Ratings: CollectionConfig = {
  slug: 'ratings',
  access: {
    create: isAuthenticated,
    read: () => true,
    update: adminOrFieldOwner('customer'),
    delete: adminOrFieldOwner('customer'),
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['rating', 'product', 'retailer', 'customer', 'createdAt'],
    group: 'Profiles',
  },
  hooks: {
    beforeValidate: [checkUniqueRating],
    beforeChange: [setCustomer],
    afterChange: [updateAggregatesAfterChange],
    afterDelete: [updateAggregatesAfterDelete],
  },
  fields: [
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      admin: {
        description: 'Rating score from 1 to 5',
      },
    },
    {
      name: 'reviewText',
      type: 'textarea',
      required: false,
      admin: {
        description: 'Optional review text',
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      index: true,
    },
    {
      name: 'retailer',
      type: 'relationship',
      relationTo: 'retailers',
      required: true,
      index: true,
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        readOnly: true,
      },
    },
  ],
}
