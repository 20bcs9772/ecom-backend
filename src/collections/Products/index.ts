import { CallToAction } from '@/blocks/CallToAction/config'
import { Content } from '@/blocks/Content/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { slugField } from 'payload'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { DefaultDocumentIDType, Where } from 'payload'
import { validateSpecifications } from './hooks/validateSpecifications'
import { calculateDiscountedPrice } from './hooks/calculateDiscountedPrice'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { createAccess } from './access/create'
import { readAccess } from './access/read'
import { updateAccess } from './access/update'
import { deleteAccess } from './access/delete'
import { setRetailer } from './hooks/setRetailer'
import { setTemplateFields } from './hooks/setTemplateFields'

export const ProductsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  admin: {
    ...defaultCollection?.admin,
    defaultColumns: ['title', 'enableVariants', '_status', 'variants.variants'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'products',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'products',
        req,
      }),
    useAsTitle: 'title',
  },
  defaultPopulate: {
    ...defaultCollection?.defaultPopulate,
    title: true,
    slug: true,
    variantOptions: true,
    variants: true,
    enableVariants: true,
    gallery: true,
    priceInINR: true,
    inventory: true,
    meta: true,
  },
  access: {
    create: createAccess,
    read: readAccess,
    update: updateAccess,
    delete: deleteAccess,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'description',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              label: false,
              required: false,
            },
            {
              name: 'gallery',
              type: 'array',
              minRows: 1,
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'variantOption',
                  type: 'relationship',
                  relationTo: 'variantOptions',
                  admin: {
                    condition: (data) => {
                      return data?.enableVariants === true && data?.variantTypes?.length > 0
                    },
                  },
                  filterOptions: ({ data }) => {
                    if (data?.enableVariants && data?.variantTypes?.length) {
                      const variantTypeIDs = data.variantTypes.map((item: any) => {
                        if (typeof item === 'object' && item?.id) {
                          return item.id
                        }
                        return item
                      }) as DefaultDocumentIDType[]

                      if (variantTypeIDs.length === 0)
                        return {
                          variantType: {
                            in: [],
                          },
                        }

                      const query: Where = {
                        variantType: {
                          in: variantTypeIDs,
                        },
                      }

                      return query
                    }

                    return {
                      variantType: {
                        in: [],
                      },
                    }
                  },
                },
              ],
            },

            {
              name: 'layout',
              type: 'blocks',
              blocks: [CallToAction, Content, MediaBlock],
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            ...defaultCollection.fields,
            {
              name: 'discountPercent',
              type: 'number',
              label: 'Discount Percent',
              min: 0,
              max: 100,
              admin: {
                placeholder: 'e.g. 10 for 10%',
                description: 'Discount percentage to apply to this product.',
              },
            },
            {
              name: 'discountedPrice',
              type: 'number',
              label: 'Discounted Price',
              admin: {
                description: 'Automatically calculated price after discount.',
              },
            },
            {
              name: 'brand',
              type: 'relationship',
              relationTo: 'brands',
              required: false,
              admin: {
                position: 'sidebar',
              },
            },
            {
              name: 'warranty',
              type: 'text',
              label: 'Warranty Details',
              required: false,
            },
            {
              name: 'specifications',
              type: 'array',
              label: 'Specifications',
              validate: validateSpecifications,
              fields: [
                {
                  name: 'key',
                  type: 'text',
                  required: true,
                  label: 'Name',
                },
                {
                  name: 'value',
                  type: 'text',
                  required: true,
                  label: 'Value',
                },
                {
                  name: 'type',
                  type: 'select',
                  required: true,
                  defaultValue: 'text',
                  options: [
                    { label: 'Plain Text', value: 'text' },
                    { label: 'Numeric Value', value: 'number' },
                    { label: 'Preset Options', value: 'select' },
                    { label: 'Date', value: 'date' },
                  ],
                },
              ],
            },
            {
              name: 'relatedProducts',
              type: 'relationship',
              filterOptions: ({ id }) => {
                if (id) {
                  return {
                    id: {
                      not_in: [id],
                    },
                  }
                }

                // ID comes back as undefined during seeding so we need to handle that case
                return {
                  id: {
                    exists: true,
                  },
                }
              },
              hasMany: true,
              relationTo: 'products',
            },
          ],
          label: 'Product Details',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        sortOptions: 'title',
      },
      hasMany: true,
      relationTo: 'categories',
    },
    {
      name: 'retailer',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isMasterTemplate',
      type: 'checkbox',
      access: {
        update: adminOnlyFieldAccess,
      },
      admin: {
        position: 'sidebar',
        description: 'Indicates if this product serves as a master catalog template.',
      },
    },
    {
      name: 'parentTemplate',
      type: 'relationship',
      relationTo: 'products',
      required: false,
      access: {
        update: adminOnlyFieldAccess,
      },
      admin: {
        position: 'sidebar',
        description: 'The master catalog template this product was cloned/listed from.',
      },
    },
    slugField(),
  ],
  hooks: {
    ...defaultCollection?.hooks,
    beforeChange: [
      ...(defaultCollection?.hooks?.beforeChange || []),
      setRetailer,
      setTemplateFields,
    ],
    beforeValidate: [
      ...(defaultCollection?.hooks?.beforeValidate || []),
      calculateDiscountedPrice,
    ],
  },
})

