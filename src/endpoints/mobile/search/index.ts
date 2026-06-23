import type { PayloadRequest } from 'payload'

export const searchEndpoint = async (req: PayloadRequest): Promise<Response> => {
  // Retrieve the search query parameter 'q'
  const url = new URL(req.url || '', 'http://localhost:3000')
  const q = url.searchParams.get('q') || ''

  if (!q.trim()) {
    return Response.json({
      products: [],
      retailers: [],
    })
  }

  try {
    // 1. Search Brands matching query
    const matchingBrands = await req.payload.find({
      collection: 'brands',
      where: {
        name: {
          like: q,
        },
      },
      limit: 50,
      depth: 0,
      overrideAccess: true,
    })
    const brandIds = matchingBrands.docs.map((b) => b.id)

    // 2. Search Categories matching query
    const matchingCategories = await req.payload.find({
      collection: 'categories',
      where: {
        title: {
          like: q,
        },
      },
      limit: 50,
      depth: 0,
      overrideAccess: true,
    })
    const categoryIds = matchingCategories.docs.map((c) => c.id)

    // 3. Search Retailers matching query directly by shopName, ownerName, or city
    const matchingRetailers = await req.payload.find({
      collection: 'retailers',
      where: {
        or: [
          { shopName: { like: q } },
          { ownerName: { like: q } },
          { 'shopAddress.city': { like: q } },
        ],
      },
      limit: 50,
      depth: 1,
      overrideAccess: true,
    })
    const retailerUserIds = matchingRetailers.docs
      .map((r: any) => (typeof r.user === 'object' ? r.user?.id : r.user))
      .filter(Boolean)

    // 4. Construct Product Search filter criteria
    // Matches if title contains query, or linked to matching brands, categories, or retailers.
    // Exclude master catalog templates; only list active retailer products (isMasterTemplate: false).
    const productsWhere: any = {
      and: [
        { isMasterTemplate: { equals: false } },
        { _status: { equals: 'published' } },
        {
          or: [
            { title: { like: q } },
          ],
        },
      ],
    }

    if (brandIds.length > 0) {
      productsWhere.and[2].or.push({ brand: { in: brandIds } })
    }
    if (categoryIds.length > 0) {
      productsWhere.and[2].or.push({ categories: { in: categoryIds } })
    }
    if (retailerUserIds.length > 0) {
      productsWhere.and[2].or.push({ retailer: { in: retailerUserIds } })
    }

    // 5. Query Products matching criteria
    const matchingProducts = await req.payload.find({
      collection: 'products',
      where: productsWhere,
      depth: 1,
      limit: 50,
      req,
      overrideAccess: true,
    })

    // 6. Resolve Retailer Profiles for matching products
    const productRetailerUserIds = matchingProducts.docs
      .map((p: any) => (typeof p.retailer === 'object' ? p.retailer?.id : p.retailer))
      .filter(Boolean)

    // Merge direct matching retailer user IDs and product retailer user IDs to query profiles
    const allRetailerUserIds = Array.from(new Set([...retailerUserIds, ...productRetailerUserIds]))
    const retailerProfilesMap = new Map<string, any>()

    if (allRetailerUserIds.length > 0) {
      const resolvedRetailers = await req.payload.find({
        collection: 'retailers',
        where: {
          user: {
            in: allRetailerUserIds,
          },
        },
        depth: 1,
        limit: 100,
        req,
        overrideAccess: true,
      })

      for (const profile of resolvedRetailers.docs) {
        const userId = typeof profile.user === 'object' ? profile.user?.id : profile.user
        if (userId) {
          retailerProfilesMap.set(String(userId), profile)
        }
      }
    }

    // 7. Format matching Products with resolved Retailer details
    const formattedProducts = matchingProducts.docs.map((p: any) => {
      const retUserId = typeof p.retailer === 'object' ? p.retailer?.id : p.retailer
      const profile = retUserId ? retailerProfilesMap.get(String(retUserId)) : null
      return {
        id: p.id,
        title: p.title,
        priceInINR: p.priceInINR,
        discountedPrice: p.discountedPrice,
        brand: p.brand,
        categories: p.categories,
        gallery: p.gallery,
        meta: p.meta,
        images: p.gallery,
        media: p.meta?.image,
        averageRating: p.averageRating || 0,
        ratingCount: p.ratingCount || 0,
        retailer: profile
          ? {
              id: profile.id,
              shopName: profile.shopName,
              city: profile.shopAddress?.city,
              landmark: profile.shopAddress?.landmark,
              averageRating: profile.averageRating || 0,
              ratingCount: profile.ratingCount || 0,
            }
          : null,
      }
    })

    // 8. Format matching Retailers directly found
    const formattedRetailers = matchingRetailers.docs.map((r: any) => ({
      id: r.id,
      shopName: r.shopName,
      ownerName: r.ownerName,
      city: r.shopAddress?.city,
      landmark: r.shopAddress?.landmark,
      businessHours: r.businessHours,
      averageRating: r.averageRating || 0,
      ratingCount: r.ratingCount || 0,
    }))

    return Response.json({
      products: formattedProducts,
      retailers: formattedRetailers,
    })
  } catch (err: any) {
    req.payload.logger.error(`Error in mobile search endpoint: ${err.message}`)
    return Response.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
