import type { CollectionConfig } from 'payload'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { isAdmin } from '@/access/isAdmin'
import { isAuthenticated } from '@/access/isAuthenticated'
import { adminOrFieldOwner } from '@/access/adminOrFieldOwner'

export const Retailers: CollectionConfig = {
  slug: 'retailers',
  access: {
    create: isAuthenticated,
    read: adminOrFieldOwner('user'),
    update: adminOrFieldOwner('user'),
    delete: isAdmin,
  },
  admin: {
    useAsTitle: 'shopName',
    defaultColumns: ['shopName', 'ownerName', 'approvalStatus', 'createdAt'],
    group: 'Profiles',
  },
  hooks: {
    beforeChange: [
      ({ req, operation, data }) => {
        if (operation === 'create' && req.user && !data.user) {
          data.user = req.user.id
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'shopName',
      type: 'text',
      required: true,
    },
    {
      name: 'ownerName',
      type: 'text',
      required: true,
    },
    {
      name: 'mobileNumber',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'emailId',
      type: 'email',
      required: true,
    },
    {
      name: 'alternateContactNumber',
      type: 'text',
      required: false,
    },
    {
      name: 'gstNumber',
      type: 'text',
      required: true,
    },
    {
      name: 'images',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      required: true,
    },
    {
      name: 'shopAddress',
      type: 'group',
      required: true,
      fields: [
        {
          name: 'street',
          type: 'text',
          required: true,
        },
        {
          name: 'landmark',
          type: 'text',
          required: false,
        },
        {
          name: 'city',
          type: 'text',
          required: true,
        },
        {
          name: 'state',
          type: 'text',
          required: true,
        },
        {
          name: 'zipCode',
          type: 'text',
          required: true,
        },
        {
          name: 'lat',
          type: 'number',
        },
        {
          name: 'lng',
          type: 'number',
        },
      ],
    },
    {
      name: 'bankDetails',
      type: 'group',
      required: true,
      fields: [
        {
          name: 'accountHolderName',
          type: 'text',
          required: true,
        },
        {
          name: 'accountNumber',
          type: 'text',
          required: true,
        },
        {
          name: 'ifscCode',
          type: 'text',
          required: true,
        },
        {
          name: 'bankName',
          type: 'text',
          required: true,
        },
        {
          name: 'upiId',
          type: 'text',
          required: false,
        },
      ],
    },
    {
      name: 'businessHours',
      type: 'group',
      required: true,
      fields: [
        {
          name: 'startTime',
          type: 'text',
          required: true,
        },
        {
          name: 'endTime',
          type: 'text',
          required: true,
        },
        {
          name: 'weekOff',
          type: 'select',
          hasMany: true,
          options: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
        },
        {
          name: 'openEveryday',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'approvalStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      access: {
        create: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      options: [
        {
          label: 'Pending',
          value: 'pending',
        },
        {
          label: 'Approved',
          value: 'approved',
        },
        {
          label: 'Rejected',
          value: 'rejected',
        },
        {
          label: 'Suspended',
          value: 'suspended',
        },
      ],
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      index: true,
      access: {
        update: adminOnlyFieldAccess,
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'averageRating',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Pre-calculated average rating cached from the reviews',
      },
    },
    {
      name: 'ratingCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Total number of ratings submitted for this retailer',
      },
    },
  ],
}
