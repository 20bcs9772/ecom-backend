import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

export const updateAggregatesAfterChange: CollectionAfterChangeHook = async ({
  doc,
  req,
}) => {
  const productId = typeof doc.product === 'object' ? doc.product?.id : doc.product
  const retailerId = typeof doc.retailer === 'object' ? doc.retailer?.id : doc.retailer

  if (productId) {
    await recalculateProductRating(productId, req)
  }

  if (retailerId) {
    await recalculateRetailerRating(retailerId, req)
  }
}

export const updateAggregatesAfterDelete: CollectionAfterDeleteHook = async ({
  doc,
  req,
}) => {
  const productId = typeof doc.product === 'object' ? doc.product?.id : doc.product
  const retailerId = typeof doc.retailer === 'object' ? doc.retailer?.id : doc.retailer

  if (productId) {
    await recalculateProductRating(productId, req)
  }

  if (retailerId) {
    await recalculateRetailerRating(retailerId, req)
  }
}

async function recalculateProductRating(productId: string | number, req: any) {
  const ratingsResult = await req.payload.find({
    collection: 'ratings',
    where: {
      product: { equals: productId },
    },
    limit: 10000,
    depth: 0,
    req,
    overrideAccess: true,
  })

  const ratings = ratingsResult.docs
  const count = ratings.length
  let average = 0

  if (count > 0) {
    const sum = ratings.reduce((acc: number, curr: any) => acc + (curr.rating || 0), 0)
    average = Math.round((sum / count) * 100) / 100
  }

  await req.payload.update({
    collection: 'products',
    id: productId,
    data: {
      averageRating: average,
      ratingCount: count,
    },
    req,
    overrideAccess: true,
  })
}

async function recalculateRetailerRating(retailerId: string | number, req: any) {
  const ratingsResult = await req.payload.find({
    collection: 'ratings',
    where: {
      retailer: { equals: retailerId },
    },
    limit: 10000,
    depth: 0,
    req,
    overrideAccess: true,
  })

  const ratings = ratingsResult.docs
  const count = ratings.length
  let average = 0

  if (count > 0) {
    const sum = ratings.reduce((acc: number, curr: any) => acc + (curr.rating || 0), 0)
    average = Math.round((sum / count) * 100) / 100
  }

  await req.payload.update({
    collection: 'retailers',
    id: retailerId,
    data: {
      averageRating: average,
      ratingCount: count,
    },
    req,
    overrideAccess: true,
  })
}
