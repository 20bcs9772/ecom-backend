import { ReportManager, apiRequest } from './helpers'
import type { Payload } from 'payload'

export async function runRatingsTests(
  report: ReportManager,
  payload: Payload,
  customerToken: string,
  retailerToken?: string
) {
  report.setSuite('Ratings & Reviews')
  console.log('\nRunning Ratings & Reviews tests...')

  // Step 0: Ensure we have tokens
  if (!customerToken) {
    report.assert('Ratings tests setup failed: missing customerToken', false, 'Best Case')
    return
  }

  // Find a product to rate
  const products = await payload.find({
    collection: 'products',
    where: {
      isMasterTemplate: { equals: false },
    },
    limit: 1,
    overrideAccess: true,
  })
  const product = products.docs[0]

  // Find a retailer profile
  const retailers = await payload.find({
    collection: 'retailers',
    limit: 1,
    overrideAccess: true,
  })
  const retailer = retailers.docs[0]

  if (!product || !retailer) {
    report.assert('Ratings test setup failed: missing product or retailer in database', false, 'Best Case')
    return
  }

  // 1. Attempt to submit a rating as an unauthenticated guest
  const guestRatingRes = await apiRequest('/api/ratings', 'POST', {
    rating: 5,
    product: product.id,
    retailer: retailer.id,
  })
  report.assert(
    'Attempt to create Rating without authentication returns 401 or 403 error',
    guestRatingRes.status === 401 || guestRatingRes.status === 403,
    'Impossible Scenario',
    `Expected 401 or 403, got ${guestRatingRes.status}`
  )

  // 2. Submit a valid rating as an authenticated customer
  const customerRatingRes = await apiRequest(
    '/api/ratings',
    'POST',
    {
      rating: 4,
      reviewText: 'Great product and quick delivery!',
      product: product.id,
      retailer: retailer.id,
    },
    customerToken
  )
  const ratingId = customerRatingRes.body?.doc?.id
  const isCreated = customerRatingRes.status === 201 && !!ratingId

  report.assert(
    'Customer can successfully create a rating (returns 201 and ID)',
    isCreated,
    'Best Case',
    `Expected status 201, got ${customerRatingRes.status}. Body: ${JSON.stringify(customerRatingRes.body)}`
  )

  if (!isCreated) return

  // 3. Verify the product aggregated averages and counts
  const updatedProduct = await payload.findByID({
    collection: 'products',
    id: product.id,
    overrideAccess: true,
  })
  report.assert(
    'Product rating aggregates (averageRating and ratingCount) are updated automatically',
    updatedProduct.ratingCount === 1 && updatedProduct.averageRating === 4,
    'Best Case',
    `Expected ratingCount 1 and averageRating 4, got count ${updatedProduct.ratingCount} and average ${updatedProduct.averageRating}`
  )

  // 4. Verify the retailer aggregated averages and counts
  const updatedRetailer = await payload.findByID({
    collection: 'retailers',
    id: retailer.id,
    overrideAccess: true,
  })
  report.assert(
    'Retailer rating aggregates (averageRating and ratingCount) are updated automatically',
    updatedRetailer.ratingCount === 1 && updatedRetailer.averageRating === 4,
    'Best Case',
    `Expected ratingCount 1 and averageRating 4, got count ${updatedRetailer.ratingCount} and average ${updatedRetailer.averageRating}`
  )

  // 5. Verify the unique rating constraint
  const duplicateRatingRes = await apiRequest(
    '/api/ratings',
    'POST',
    {
      rating: 5,
      reviewText: 'Another review',
      product: product.id,
      retailer: retailer.id,
    },
    customerToken
  )
  report.assert(
    'Uniqueness constraint: Customer is blocked from creating a duplicate rating for the same product and retailer (returns 400)',
    duplicateRatingRes.status === 400,
    'Impossible Scenario',
    `Expected status 400, got ${duplicateRatingRes.status}. Body: ${JSON.stringify(duplicateRatingRes.body)}`
  )

  // 6. Submit a second rating from a different retailer user to verify aggregation
  let isSecondCreated = false
  let secondRatingId: any = null
  if (retailerToken) {
    const secondRatingRes = await apiRequest(
      '/api/ratings',
      'POST',
      {
        rating: 5,
        reviewText: 'Excellent service.',
        product: product.id,
        retailer: retailer.id,
      },
      retailerToken
    )
    secondRatingId = secondRatingRes.body?.doc?.id
    isSecondCreated = secondRatingRes.status === 201 && !!secondRatingId
    report.assert(
      'A second authenticated user can rate the same product and retailer (returns 201)',
      isSecondCreated,
      'Best Case',
      `Expected status 201, got ${secondRatingRes.status}`
    )
  }

  // 7. Verify aggregates after the second rating
  if (isSecondCreated) {
    const doubleProduct = await payload.findByID({
      collection: 'products',
      id: product.id,
      overrideAccess: true,
    })
    report.assert(
      'Aggregated average rating and count are updated correctly after a second rating',
      doubleProduct.ratingCount === 2 && doubleProduct.averageRating === 4.5,
      'Best Case',
      `Expected ratingCount 2 and averageRating 4.5, got count ${doubleProduct.ratingCount} and average ${doubleProduct.averageRating}`
    )
  }

  // 8. Clean up/delete the submitted ratings and verify aggregates are recalculated down
  if (ratingId) {
    const deleteRes = await apiRequest(`/api/ratings/${ratingId}`, 'DELETE', null, customerToken)
    report.assert(
      'Customer can delete their own rating record (returns 200 or 204)',
      deleteRes.status === 200 || deleteRes.status === 204,
      'Best Case',
      `Expected status 200/204, got ${deleteRes.status}`
    )
  }

  if (secondRatingId && retailerToken) {
    await apiRequest(`/api/ratings/${secondRatingId}`, 'DELETE', null, retailerToken)
  }

  // Verify aggregates reset to 0
  const finalProduct = await payload.findByID({
    collection: 'products',
    id: product.id,
    overrideAccess: true,
  })
  report.assert(
    'Rating aggregates reset to 0 after all ratings are deleted',
    finalProduct.ratingCount === 0 && finalProduct.averageRating === 0,
    'Best Case',
    `Expected ratingCount 0 and averageRating 0, got count ${finalProduct.ratingCount} and average ${finalProduct.averageRating}`
  )
}
