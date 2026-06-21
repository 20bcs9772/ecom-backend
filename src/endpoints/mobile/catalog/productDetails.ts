import type { PayloadRequest } from 'payload'

export const productDetailsEndpoint = async (req: PayloadRequest): Promise<Response> => {
  const id = req.routeParams?.id as string

  if (!id) {
    return Response.json({ error: 'Product ID is required' }, { status: 400 })
  }

  // 1. Fetch target product
  let product: any
  try {
    product = await req.payload.findByID({
      collection: 'products',
      id,
      depth: 2,
      req,
      overrideAccess: true,
    })
  } catch (err) {
    return Response.json({ error: 'Product not found' }, { status: 404 })
  }

  if (!product || product.isMasterTemplate) {
    return Response.json({ error: 'Product not found' }, { status: 404 })
  }

  // 2. Query retailer profile linked to product.retailer user ID
  const retailerUserId = typeof product.retailer === 'object' ? product.retailer?.id : product.retailer

  let activeRetailer: any = null
  if (retailerUserId) {
    const retailerResult = await req.payload.find({
      collection: 'retailers',
      where: {
        user: {
          equals: retailerUserId,
        },
      },
      depth: 1,
      req,
      overrideAccess: true,
    })

    if (retailerResult.docs.length > 0) {
      const activeRetDoc = retailerResult.docs[0]
      activeRetailer = {
        shopName: activeRetDoc.shopName,
        city: activeRetDoc.shopAddress?.city,
        landmark: activeRetDoc.shopAddress?.landmark,
        businessHours: activeRetDoc.businessHours,
        averageRating: activeRetDoc.averageRating || 0,
        ratingCount: activeRetDoc.ratingCount || 0,
      }
    }
  }

  // 3. Fetch competitor offers if product has a parentTemplate
  const parentTemplateId = typeof product.parentTemplate === 'object' ? product.parentTemplate?.id : product.parentTemplate
  let otherOffers: any[] = []

  if (parentTemplateId) {
    const competitorProducts = await req.payload.find({
      collection: 'products',
      where: {
        and: [
          { parentTemplate: { equals: parentTemplateId } },
          { id: { not_equals: product.id } },
          { isMasterTemplate: { equals: false } },
          { _status: { equals: 'published' } },
        ],
      },
      depth: 1,
      req,
      overrideAccess: true,
    })

    if (competitorProducts.docs.length > 0) {
      // Collect unique user IDs of competitor retailers
      const competitorRetailerUserIds = competitorProducts.docs
        .map((p: any) => typeof p.retailer === 'object' ? p.retailer?.id : p.retailer)
        .filter(Boolean)

      const competitorRetailerProfilesMap = new Map<string, any>()

      if (competitorRetailerUserIds.length > 0) {
        const retailerProfiles = await req.payload.find({
          collection: 'retailers',
          where: {
            user: {
              in: competitorRetailerUserIds,
            },
          },
          depth: 1,
          req,
          overrideAccess: true,
        })

        for (const profile of retailerProfiles.docs) {
          const userId = typeof profile.user === 'object' ? profile.user?.id : profile.user
          if (userId) {
            competitorRetailerProfilesMap.set(String(userId), profile)
          }
        }
      }

      // Map competitor products to their listing and retailer details
      otherOffers = competitorProducts.docs.map((p: any) => {
        const retUserId = typeof p.retailer === 'object' ? p.retailer?.id : p.retailer
        const profile = retUserId ? competitorRetailerProfilesMap.get(String(retUserId)) : null
        return {
          productId: p.id,
          price: p.priceInINR,
          discountedPrice: p.discountedPrice,
          shopName: profile?.shopName || 'Unknown Shop',
          city: profile?.shopAddress?.city || 'Unknown City',
          averageRating: profile?.averageRating || 0,
          ratingCount: profile?.ratingCount || 0,
        }
      })
    }
  }

  return Response.json({
    product,
    retailer: activeRetailer,
    otherOffers,
  })
}
