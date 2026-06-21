import { ValidationError } from 'payload'
import type { CollectionBeforeValidateHook } from 'payload'

export const checkUniqueRating: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
}) => {
  if (operation === 'create') {
    const customerId = req.user?.id
    const productId = data?.product
    const retailerId = data?.retailer

    if (customerId && productId && retailerId) {
      const existing = await req.payload.find({
        collection: 'ratings',
        where: {
          and: [
            { customer: { equals: customerId } },
            { product: { equals: productId } },
            { retailer: { equals: retailerId } },
          ],
        },
        limit: 1,
        depth: 0,
        req,
        overrideAccess: true,
      })

      if (existing.docs.length > 0) {
        throw new ValidationError({
          errors: [
            {
              message: 'You have already rated this product from this retailer.',
              path: 'product',
            },
          ],
        })
      }
    }
  }
  return data
}
