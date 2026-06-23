import { ReportManager, apiRequest } from './helpers'
import type { Payload } from 'payload'

export async function runCatalogTests(
  report: ReportManager,
  payload: Payload,
  adminToken: string,
  customerToken: string,
  retailerToken?: string
) {
  report.setSuite('Catalog Foundation')
  console.log('\nRunning Catalog Foundation tests...')

  // Step 0: Ensure we have tokens
  if (!adminToken) {
    report.assert('Catalog tests setup failed: missing adminToken', false, 'Best Case')
    return
  }

  // --- SECURITY / BOUNDARY SCENARIOS (IMPOSSIBLE SCENARIOS) ---

  // 1. Attempt to create a brand without authentication
  const unauthBrandRes = await apiRequest('/api/brands', 'POST', {
    name: 'Unauthorized Brand',
  })
  report.assert(
    'Attempt to create Brand without auth token returns 401 or 403 error',
    unauthBrandRes.status === 401 || unauthBrandRes.status === 403,
    'Impossible Scenario',
    `Expected status 401 or 403, got ${unauthBrandRes.status}`
  )

  // 2. Attempt to create a brand with customer-only auth
  const customerBrandRes = await apiRequest(
    '/api/brands',
    'POST',
    {
      name: 'Customer Role Brand',
    },
    customerToken
  )
  report.assert(
    'Attempt to create Brand with customer role token returns 401 or 403 error',
    customerBrandRes.status === 401 || customerBrandRes.status === 403,
    'Impossible Scenario',
    `Expected status 401 or 403, got ${customerBrandRes.status}`
  )

  // 3. Attempt to create a category without authentication
  const unauthCategoryRes = await apiRequest('/api/categories', 'POST', {
    title: 'Unauthorized Category',
  })
  report.assert(
    'Attempt to create Category without auth token returns 401 or 403 error',
    unauthCategoryRes.status === 401 || unauthCategoryRes.status === 403,
    'Impossible Scenario',
    `Expected status 401 or 403, got ${unauthCategoryRes.status}`
  )

  // 4. Attempt to create a product without authentication
  const unauthProductRes = await apiRequest('/api/products', 'POST', {
    title: 'Unauthorized Product',
  })
  report.assert(
    'Attempt to create Product without auth token returns 401 or 403 error',
    unauthProductRes.status === 401 || unauthProductRes.status === 403,
    'Impossible Scenario',
    `Expected status 401 or 403, got ${unauthProductRes.status}`
  )

  // --- BEST CASE SCENARIOS (ADMIN CREATIONS) ---

  // 5. Create Brand with admin auth
  const createBrandRes = await apiRequest(
    '/api/brands',
    'POST',
    {
      name: 'ZiniTech',
      description: 'ZiniKart Official Electronics Brand',
      featured: true,
    },
    adminToken
  )
  const brandId = createBrandRes.body?.doc?.id
  const isBrandCreated = createBrandRes.status === 201 && !!brandId

  report.assert(
    'Create Brand with admin auth returns 201 and Brand ID',
    isBrandCreated,
    'Best Case',
    `Expected status 201, got ${createBrandRes.status}. Response: ${JSON.stringify(createBrandRes.body)}`
  )

  if (!isBrandCreated) return

  // 6. Create Parent Category with admin auth
  const createParentCategoryRes = await apiRequest(
    '/api/categories',
    'POST',
    {
      title: 'Mobiles',
    },
    adminToken
  )
  const parentCategoryId = createParentCategoryRes.body?.doc?.id
  const isParentCategoryCreated = createParentCategoryRes.status === 201 && !!parentCategoryId

  report.assert(
    'Create Parent Category with admin auth returns 201 and Category ID',
    isParentCategoryCreated,
    'Best Case',
    `Expected status 201, got ${createParentCategoryRes.status}`
  )

  if (!isParentCategoryCreated) return

  // 7. Create Subcategory with admin auth (linking to Parent Category)
  const createSubcategoryRes = await apiRequest(
    '/api/categories',
    'POST',
    {
      title: 'Smartphones',
      parentCategory: parentCategoryId,
      specificationTemplates: [
        { name: 'RAM', type: 'number', required: true },
        { name: 'Color', type: 'select', required: false, options: [{ option: 'Black' }, { option: 'White' }] },
        { name: 'Release Date', type: 'date', required: false }
      ]
    },
    adminToken
  )
  const subcategoryId = createSubcategoryRes.body?.doc?.id
  const isSubcategoryCreated = createSubcategoryRes.status === 201 && !!subcategoryId

  report.assert(
    'Create Subcategory linked to Parent Category returns 201 and Category ID',
    isSubcategoryCreated,
    'Best Case',
    `Expected status 201, got ${createSubcategoryRes.status}`
  )

  if (!isSubcategoryCreated) return

  // 8. Create Product with specs and brand relation via admin auth
  const createProductRes = await apiRequest(
    '/api/products',
    'POST',
    {
      title: 'ZiniPhone 14 Max',
      _status: 'published',
      priceInINR: 99900,
      inventory: 100,
      categories: [subcategoryId],
      brand: brandId,
      warranty: '2 Year Manufacturer Warranty',
      specifications: [
        { key: 'RAM', value: '12', type: 'number' },
        { key: 'Color', value: 'Black', type: 'select' },
        { key: 'Release Date', value: '2026-05-30', type: 'date' }
      ]
    },
    adminToken
  )
  const productId = createProductRes.body?.doc?.id
  const isProductCreated = createProductRes.status === 201 && !!productId

  report.assert(
    'Create Product with brand and specifications returns 201 and Product ID',
    isProductCreated,
    'Best Case',
    `Expected status 201, got ${createProductRes.status}. Response: ${JSON.stringify(createProductRes.body)}`
  )

  report.assert(
    'Admin-created product defaults to isMasterTemplate: true and parentTemplate: null',
    createProductRes.body?.doc?.isMasterTemplate === true && createProductRes.body?.doc?.parentTemplate === null,
    'Best Case',
    `Expected isMasterTemplate true and parentTemplate null, got isMasterTemplate ${createProductRes.body?.doc?.isMasterTemplate} and parentTemplate ${createProductRes.body?.doc?.parentTemplate}`
  )

  // 8b. Create Standalone Product as Retailer (where isMasterTemplate should be forced to false)
  let clonedProductId: any = null
  if (retailerToken) {
    const retailerProductRes = await apiRequest(
      '/api/products',
      'POST',
      {
        title: 'Retailer Standalone Phone',
        _status: 'published',
        priceInINR: 89900,
        inventory: 100,
        categories: [subcategoryId],
        brand: brandId,
        warranty: '1 Year Warranty',
        isMasterTemplate: true, // Retailer tries to force this to true
        specifications: [
          { key: 'RAM', value: '12', type: 'number' }
        ]
      },
      retailerToken
    )
    const retailerProductId = retailerProductRes.body?.doc?.id
    const isRetailerProductCreated = retailerProductRes.status === 201 && !!retailerProductId

    report.assert(
      'Retailer creating product gets isMasterTemplate set to false (roles hook enforcement)',
      isRetailerProductCreated && retailerProductRes.body?.doc?.isMasterTemplate === false,
      'Best Case',
      `Expected status 201 and isMasterTemplate false, got status ${retailerProductRes.status} and response body ${JSON.stringify(retailerProductRes.body)}`
    )

    // 8c. Create Cloned Product as Retailer (linked to parent master template)
    const clonedProductRes = await apiRequest(
      '/api/products',
      'POST',
      {
        title: 'Cloned ZiniPhone 14 Max',
        _status: 'published',
        priceInINR: 89900,
        inventory: 100,
        categories: [subcategoryId],
        brand: brandId,
        warranty: '2 Year Manufacturer Warranty',
        parentTemplate: productId, // Links to master product
        specifications: [
          { key: 'RAM', value: '12', type: 'number' },
          { key: 'Color', value: 'Black', type: 'select' },
          { key: 'Release Date', value: '2026-05-30', type: 'date' }
        ]
      },
      retailerToken
    )
    const clonedId = clonedProductRes.body?.doc?.id
    const isClonedProductCreated = clonedProductRes.status === 201 && !!clonedId
    if (isClonedProductCreated) {
      clonedProductId = clonedId
    }

    const parentTemplateId = typeof clonedProductRes.body?.doc?.parentTemplate === 'object'
      ? clonedProductRes.body?.doc?.parentTemplate?.id
      : clonedProductRes.body?.doc?.parentTemplate

    report.assert(
      'Retailer cloning product gets parentTemplate linked and isMasterTemplate set to false',
      isClonedProductCreated &&
        parentTemplateId === productId &&
        clonedProductRes.body?.doc?.isMasterTemplate === false,
      'Best Case',
      `Expected parentTemplate match and isMasterTemplate false, got status ${clonedProductRes.status} and response body ${JSON.stringify(clonedProductRes.body)}`
    )
  }

  if (!isProductCreated) return

  // --- BOUNDARY VALIDATION SCENARIOS (IMPOSSIBLE/WORST CASE) ---

  // A. Create product missing required specification "RAM"
  const missingSpecRes = await apiRequest(
    '/api/products',
    'POST',
    {
      title: 'Invalid Product (Missing Spec)',
      _status: 'published',
      categories: [subcategoryId],
      brand: brandId,
      warranty: '1 Year',
      specifications: [
        { key: 'Color', value: 'Black', type: 'select' }
      ]
    },
    adminToken
  )
  report.assert(
    'Attempt to create Product missing a required specification returns 400 bad request',
    missingSpecRes.status === 400,
    'Impossible Scenario',
    `Expected status 400, got ${missingSpecRes.status}. Response: ${JSON.stringify(missingSpecRes.body)}`
  )

  // B. Create product with invalid type for numeric specification "RAM"
  const invalidNumberSpecRes = await apiRequest(
    '/api/products',
    'POST',
    {
      title: 'Invalid Product (Invalid Number)',
      _status: 'published',
      categories: [subcategoryId],
      brand: brandId,
      warranty: '1 Year',
      specifications: [
        { key: 'RAM', value: 'twelve', type: 'number' }
      ]
    },
    adminToken
  )
  report.assert(
    'Attempt to create Product with non-numeric value for numeric specification returns 400',
    invalidNumberSpecRes.status === 400,
    'Impossible Scenario',
    `Expected status 400, got ${invalidNumberSpecRes.status}`
  )

  // C. Create product with invalid date for specification "Release Date"
  const invalidDateSpecRes = await apiRequest(
    '/api/products',
    'POST',
    {
      title: 'Invalid Product (Invalid Date)',
      _status: 'published',
      categories: [subcategoryId],
      brand: brandId,
      warranty: '1 Year',
      specifications: [
        { key: 'RAM', value: '12', type: 'number' },
        { key: 'Release Date', value: 'invalid-date', type: 'date' }
      ]
    },
    adminToken
  )
  report.assert(
    'Attempt to create Product with invalid date format returns 400',
    invalidDateSpecRes.status === 400,
    'Impossible Scenario',
    `Expected status 400, got ${invalidDateSpecRes.status}`
  )

  // D. Create product with invalid option for select specification "Color"
  const invalidSelectSpecRes = await apiRequest(
    '/api/products',
    'POST',
    {
      title: 'Invalid Product (Invalid Option)',
      _status: 'published',
      categories: [subcategoryId],
      brand: brandId,
      warranty: '1 Year',
      specifications: [
        { key: 'RAM', value: '12', type: 'number' },
        { key: 'Color', value: 'Red', type: 'select' }
      ]
    },
    adminToken
  )
  report.assert(
    'Attempt to create Product with invalid option for select specification returns 400',
    invalidSelectSpecRes.status === 400,
    'Impossible Scenario',
    `Expected status 400, got ${invalidSelectSpecRes.status}`
  )

  // --- READ & QUERY SCENARIOS ---

  // 9. Query Brands list publicly (without token)
  const queryBrandsRes = await apiRequest('/api/brands', 'GET')
  const foundBrand = queryBrandsRes.body?.docs?.find((d: any) => d.id === brandId)
  report.assert(
    'Public query of Brands list returns 200 and matches created Brand data',
    queryBrandsRes.status === 200 && foundBrand?.name === 'ZiniTech',
    'Best Case',
    `Expected status 200, got ${queryBrandsRes.status}`
  )

  // 10. Query Categories list publicly and verify parent-child relationship
  const queryCategoriesRes = await apiRequest('/api/categories', 'GET')
  const foundSubcat = queryCategoriesRes.body?.docs?.find((d: any) => d.id === subcategoryId)
  const parentIdFromSubcat = typeof foundSubcat?.parentCategory === 'object' 
    ? foundSubcat?.parentCategory?.id 
    : foundSubcat?.parentCategory

  report.assert(
    'Public query of Categories list returns 200 and subcategory correctly links to parent',
    queryCategoriesRes.status === 200 && parentIdFromSubcat === parentCategoryId,
    'Best Case',
    `Expected status 200 and parentCategory match. Subcategory parent: ${parentIdFromSubcat}, Parent: ${parentCategoryId}`
  )

  // 11. Verify master template is hidden from public query
  const queryMasterRes = await apiRequest(`/api/products/${productId}`, 'GET')
  report.assert(
    'Public query of master template product returns 404 or 403 forbidden',
    queryMasterRes.status === 403 || queryMasterRes.status === 404,
    'Worst Case',
    `Expected status 403 or 404, got ${queryMasterRes.status}`
  )

  // 11b. Query Product detail publicly and verify brand and specs exist
  const targetProductId = clonedProductId || productId
  const queryProductRes = await apiRequest(`/api/products/${targetProductId}`, 'GET')
  const productDoc = queryProductRes.body
  const brandIdFromProduct = typeof productDoc?.brand === 'object'
    ? productDoc?.brand?.id
    : productDoc?.brand

  const specs = productDoc?.specifications
  const hasSpecs = Array.isArray(specs) && 
    specs.some((s: any) => s.key === 'RAM' && s.value === '12' && s.type === 'number') &&
    specs.some((s: any) => s.key === 'Color' && s.value === 'Black' && s.type === 'select') &&
    specs.some((s: any) => s.key === 'Release Date' && s.value === '2026-05-30' && s.type === 'date')

  report.assert(
    'Public query of Product returns 200, populated brand, warranty, and specifications',
    queryProductRes.status === 200 && brandIdFromProduct === brandId && productDoc?.warranty === '2 Year Manufacturer Warranty' && hasSpecs,
    'Best Case',
    `Expected status 200 and populated fields, got: ${JSON.stringify(productDoc?.specifications)}`
  )

  // 12. Custom Mobile Product Details API verification
  // A. Dynamic query of master template details endpoint returns 404
  const mobileMasterRes = await apiRequest(`/api/mobile/product/${productId}`, 'GET')
  report.assert(
    'GET /api/mobile/product/:id for master template returns 404 not found',
    mobileMasterRes.status === 404,
    'Worst Case',
    `Expected status 404, got ${mobileMasterRes.status}`
  )

  // B. Dynamic query of cloned product details endpoint returns 200 with details and competitor offers
  if (clonedProductId) {
    // Resolve a valid media ID to use for the retailer profiles
    const mediaDocs = await payload.find({
      collection: 'media',
      limit: 1,
      overrideAccess: true,
    })
    let mediaId = mediaDocs.docs[0]?.id
    if (!mediaId) {
      const mockMedia = await payload.create({
        collection: 'media',
        data: {
          alt: 'Mock License',
        },
        file: {
          name: 'license.pdf',
          data: Buffer.from('mock license data'),
          mimetype: 'application/pdf',
          size: 17,
        },
        overrideAccess: true,
      })
      mediaId = mockMedia.id
    }

    // Resolve the active retailer user
    const retailerUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: 'retailer.user@testing.zinikart.local' },
      },
      overrideAccess: true,
    })
    const activeRetailerUserId = retailerUsers.docs[0]?.id

    let activeRetailerProfile: any = null
    if (activeRetailerUserId) {
      activeRetailerProfile = await payload.create({
        collection: 'retailers',
        data: {
          shopName: 'Active Retailer Gadgets',
          ownerName: 'Active Seller',
          mobileNumber: '+916666666666',
          emailId: 'retailer.user@testing.zinikart.local',
          gstNumber: 'GST99ABCDE6666',
          images: [mediaId],
          shopAddress: {
            street: '123 Active St',
            city: 'Delhi',
            state: 'Delhi',
            zipCode: '110001',
          },
          businessHours: {
            startTime: '09:00',
            endTime: '21:00',
            openEveryday: true,
          },
          bankDetails: {
            accountHolderName: 'Active Seller',
            accountNumber: '444455556666',
            ifscCode: 'IFSC0006666',
            bankName: 'Delhi Bank',
          },
          approvalStatus: 'approved',
          user: activeRetailerUserId,
        },
        overrideAccess: true,
      })
    }

    // Create a competitor retailer user
    const competitorUser = await payload.create({
      collection: 'users',
      data: {
        email: 'competitor.retailer@testing.zinikart.local',
        mobileNumber: '+915555555555',
        mobileVerified: true,
        password: 'compPassword123',
        roles: ['retailer'],
      } as any,
      overrideAccess: true,
    })

    // Create a retailer profile for the competitor
    const competitorProfile = await payload.create({
      collection: 'retailers',
      data: {
        shopName: 'Competitor Gadgets',
        ownerName: 'Competitor Seller',
        mobileNumber: '+915555555555',
        emailId: 'competitor.gadgets@testing.zinikart.local',
        gstNumber: 'GST99ABCDE5555',
        images: [mediaId],
        shopAddress: {
          street: '789 Comp Lane',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
        },
        businessHours: {
          startTime: '09:00',
          endTime: '21:00',
          openEveryday: true,
        },
        bankDetails: {
          accountHolderName: 'Competitor Seller',
          accountNumber: '111122223333',
          ifscCode: 'IFSC0005555',
          bankName: 'Mumbai Bank',
        },
        approvalStatus: 'approved',
        user: competitorUser.id,
      },
      overrideAccess: true,
    })

    // Create a competitor cloned product
    const competitorProduct = await payload.create({
      collection: 'products',
      data: {
        title: 'Competitor Cloned Phone',
        slug: 'competitor-cloned-phone',
        _status: 'published',
        categories: [subcategoryId],
        brand: brandId,
        priceInINREnabled: true,
        priceInINR: 75000,
        warranty: '1 Year Warranty',
        isMasterTemplate: false,
        parentTemplate: productId,
        retailer: competitorUser.id,
        specifications: [
          { key: 'RAM', value: '12', type: 'number' },
        ],
      },
      overrideAccess: true,
    })

    // Fetch the cloned product details via the custom endpoint
    const mobileClonedRes = await apiRequest(`/api/mobile/product/${clonedProductId}`, 'GET')
    const hasCompetitorOffer = Array.isArray(mobileClonedRes.body?.otherOffers) &&
      mobileClonedRes.body?.otherOffers.some((offer: any) =>
        offer.productId === competitorProduct.id &&
        offer.price === 75000 &&
        offer.shopName === 'Competitor Gadgets' &&
        offer.city === 'Mumbai' &&
        typeof offer.averageRating === 'number' &&
        typeof offer.ratingCount === 'number'
      )

    report.assert(
      'GET /api/mobile/product/:id for cloned product returns 200, product details with ratings, active retailer profile with ratings, and competitor otherOffers with ratings',
      mobileClonedRes.status === 200 &&
        mobileClonedRes.body?.product?.id === clonedProductId &&
        typeof mobileClonedRes.body?.product?.averageRating === 'number' &&
        typeof mobileClonedRes.body?.product?.ratingCount === 'number' &&
        mobileClonedRes.body?.retailer?.shopName === 'Active Retailer Gadgets' &&
        typeof mobileClonedRes.body?.retailer?.averageRating === 'number' &&
        typeof mobileClonedRes.body?.retailer?.ratingCount === 'number' &&
        hasCompetitorOffer,
      'Best Case',
      `Expected status 200, correct product ID, ratings, and competitor offer. Got status: ${mobileClonedRes.status}, Body: ${JSON.stringify(mobileClonedRes.body)}`
    )

    // 13. Custom Mobile Search Endpoint (/api/mobile/search) verification
    
    // A. Search by product name (q=Cloned)
    const searchProdRes = await apiRequest('/api/mobile/search?q=Cloned', 'GET')
    const hasClonedProduct = Array.isArray(searchProdRes.body?.products) &&
      searchProdRes.body?.products.some((p: any) => p.id === clonedProductId)

    report.assert(
      'GET /api/mobile/search?q=Cloned returns 200 and matches the cloned product listing',
      searchProdRes.status === 200 && hasClonedProduct,
      'Best Case',
      `Expected status 200 and products array containing cloned product. Got status: ${searchProdRes.status}, Body: ${JSON.stringify(searchProdRes.body)}`
    )

    // B. Search by brand name (q=ZiniTech)
    const searchBrandRes = await apiRequest('/api/mobile/search?q=ZiniTech', 'GET')
    const hasProductFromBrand = Array.isArray(searchBrandRes.body?.products) &&
      searchBrandRes.body?.products.some((p: any) => p.id === clonedProductId)

    report.assert(
      'GET /api/mobile/search?q=ZiniTech (brand search) returns 200 and matches products of that brand',
      searchBrandRes.status === 200 && hasProductFromBrand,
      'Best Case',
      `Expected status 200 and products belonging to brand. Got status: ${searchBrandRes.status}, Body: ${JSON.stringify(searchBrandRes.body)}`
    )

    // C. Search by category title (q=Smartphones)
    const searchCategoryRes = await apiRequest('/api/mobile/search?q=Smartphones', 'GET')
    const hasProductFromCategory = Array.isArray(searchCategoryRes.body?.products) &&
      searchCategoryRes.body?.products.some((p: any) => p.id === clonedProductId)

    report.assert(
      'GET /api/mobile/search?q=Smartphones (category search) returns 200 and matches products in that category',
      searchCategoryRes.status === 200 && hasProductFromCategory,
      'Best Case',
      `Expected status 200 and products belonging to category. Got status: ${searchCategoryRes.status}, Body: ${JSON.stringify(searchCategoryRes.body)}`
    )

    // D. Search by retailer shopName (q=Active Retailer)
    const searchRetailerRes = await apiRequest('/api/mobile/search?q=Active Retailer', 'GET')
    const hasRetailerProduct = Array.isArray(searchRetailerRes.body?.products) &&
      searchRetailerRes.body?.products.some((p: any) => p.id === clonedProductId)
    const hasRetailerProfile = Array.isArray(searchRetailerRes.body?.retailers) &&
      searchRetailerRes.body?.retailers.some((r: any) => r.shopName === 'Active Retailer Gadgets')

    report.assert(
      'GET /api/mobile/search?q=Active Retailer (retailer search) returns 200, matching products, and matching retailer profiles',
      searchRetailerRes.status === 200 && hasRetailerProduct && hasRetailerProfile,
      'Best Case',
      `Expected status 200, products, and retailer profile. Got status: ${searchRetailerRes.status}, Body: ${JSON.stringify(searchRetailerRes.body)}`
    )

    // E. Search with empty query q= returns empty results
    const searchEmptyRes = await apiRequest('/api/mobile/search?q=', 'GET')
    const isEmptyResults = Array.isArray(searchEmptyRes.body?.products) && searchEmptyRes.body?.products.length === 0 &&
                           Array.isArray(searchEmptyRes.body?.retailers) && searchEmptyRes.body?.retailers.length === 0

    report.assert(
      'GET /api/mobile/search?q= (empty query) returns 200 and empty lists',
      searchEmptyRes.status === 200 && isEmptyResults,
      'Best Case',
      `Expected empty lists, got status: ${searchEmptyRes.status}, Body: ${JSON.stringify(searchEmptyRes.body)}`
    )

    // F. Search with non-existent query q=NonExistentQueryXYZ returns empty results
    const searchNoMatchRes = await apiRequest('/api/mobile/search?q=NonExistentQueryXYZ', 'GET')
    const isNoMatchResults = Array.isArray(searchNoMatchRes.body?.products) && searchNoMatchRes.body?.products.length === 0 &&
                           Array.isArray(searchNoMatchRes.body?.retailers) && searchNoMatchRes.body?.retailers.length === 0

    report.assert(
      'GET /api/mobile/search?q=NonExistentQueryXYZ (no matches) returns 200 and empty lists',
      searchNoMatchRes.status === 200 && isNoMatchResults,
      'Best Case',
      `Expected empty lists, got status: ${searchNoMatchRes.status}, Body: ${JSON.stringify(searchNoMatchRes.body)}`
    )

    // Cleanup competitor and active retailer test records
    await payload.delete({
      collection: 'products',
      where: {
        id: { equals: competitorProduct.id },
      },
      overrideAccess: true,
    })
    const profilesToCleanup = [competitorProfile.id]
    if (activeRetailerProfile) {
      profilesToCleanup.push(activeRetailerProfile.id)
    }
    await payload.delete({
      collection: 'retailers',
      where: {
        id: { in: profilesToCleanup },
      },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'users',
      where: {
        id: { equals: competitorUser.id },
      },
      overrideAccess: true,
    })
  } else {
    report.assert('Custom endpoint test skipped: clonedProductId not defined', false, 'Best Case')
  }
}
