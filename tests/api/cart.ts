import { ReportManager, apiRequest } from './helpers'
import type { Payload } from 'payload'

export async function runCartTests(
  report: ReportManager,
  payload: Payload,
  customerToken: string
) {
  report.setSuite('Cart Operations')
  console.log('\nRunning Cart Operations tests...')

  // Step 0: Setup checks
  if (!customerToken) {
    report.assert('Cart tests setup failed: missing customerToken', false, 'Best Case')
    return
  }

  // Find a cloned/retailer product to add
  const clonedProducts = await payload.find({
    collection: 'products',
    where: {
      isMasterTemplate: { equals: false },
    },
    limit: 1,
    overrideAccess: true,
  })
  const product = clonedProducts.docs[0]

  if (!product) {
    report.assert('Cart tests setup failed: no cloned products found', false, 'Best Case')
    return
  }

  // 1. Get or Create Cart
  let cartID: any = null
  const getCartsRes = await apiRequest('/api/carts', 'GET', null, customerToken)
  
  if (getCartsRes.status === 200 && getCartsRes.body?.docs?.length > 0) {
    cartID = getCartsRes.body.docs[0].id
  } else {
    // Get logged-in user details to associate the cart with the customer
    const meRes = await apiRequest('/api/users/me', 'GET', null, customerToken)
    const customerId = meRes.body?.user?.id

    // Attempt to create a cart
    const createCartRes = await apiRequest('/api/carts', 'POST', { customer: customerId }, customerToken)
    cartID = createCartRes.body?.doc?.id
  }

  report.assert(
    'Retrieve or create an active cart for the customer returns a valid cart ID',
    !!cartID,
    'Best Case',
    `Expected valid cart ID, got status ${getCartsRes.status}. Body: ${JSON.stringify(getCartsRes.body)}`
  )

  if (!cartID) return

  // 2. Add item to cart
  const addItemRes = await apiRequest(
    `/api/carts/${cartID}/add-item`,
    'POST',
    {
      item: { product: product.id },
      quantity: 1,
    },
    customerToken
  )

  const items = addItemRes.body?.cart?.items || addItemRes.body?.doc?.items || addItemRes.body?.items
  const addedItem = Array.isArray(items) ? items.find((i: any) => {
    const prodId = typeof i.product === 'object' ? i.product?.id : i.product
    return prodId === product.id
  }) : null
  const itemID = addedItem?.id

  report.assert(
    'Successfully add a product to the cart (returns status 200 or 201)',
    (addItemRes.status === 200 || addItemRes.status === 201) && !!itemID,
    'Best Case',
    `Expected status 200/201 and valid itemID. Got status: ${addItemRes.status}, Body: ${JSON.stringify(addItemRes.body)}`
  )

  if (!itemID) return

  // 3. Update cart item quantity
  const updateItemRes = await apiRequest(
    `/api/carts/${cartID}/update-item`,
    'POST',
    {
      itemID,
      quantity: 3,
    },
    customerToken
  )

  const updatedItems = updateItemRes.body?.cart?.items || updateItemRes.body?.doc?.items || updateItemRes.body?.items
  const updatedItem = Array.isArray(updatedItems) ? updatedItems.find((i: any) => i.id === itemID) : null

  report.assert(
    'Successfully update a cart item quantity (returns status 200 or 201 and checks updated quantity)',
    (updateItemRes.status === 200 || updateItemRes.status === 201) && updatedItem?.quantity === 3,
    'Best Case',
    `Expected status 200/201 and quantity 3. Got status: ${updateItemRes.status}, Body: ${JSON.stringify(updateItemRes.body)}`
  )

  // 4. Remove item from cart
  const removeItemRes = await apiRequest(
    `/api/carts/${cartID}/remove-item`,
    'POST',
    {
      itemID,
    },
    customerToken
  )

  const itemsAfterRemove = removeItemRes.body?.cart?.items || removeItemRes.body?.doc?.items || removeItemRes.body?.items
  const isRemoved = Array.isArray(itemsAfterRemove) ? !itemsAfterRemove.some((i: any) => i.id === itemID) : true

  report.assert(
    'Successfully remove an item from the cart (returns status 200 or 201)',
    (removeItemRes.status === 200 || removeItemRes.status === 201) && isRemoved,
    'Best Case',
    `Expected status 200/201 and item removed. Got status: ${removeItemRes.status}, Body: ${JSON.stringify(removeItemRes.body)}`
  )

  // 5. Clear cart
  // First add the item back
  await apiRequest(
    `/api/carts/${cartID}/add-item`,
    'POST',
    {
      item: { product: product.id },
      quantity: 1,
    },
    customerToken
  )

  const clearCartRes = await apiRequest(
    `/api/carts/${cartID}/clear`,
    'POST',
    {},
    customerToken
  )

  const itemsAfterClear = clearCartRes.body?.cart?.items || clearCartRes.body?.doc?.items || clearCartRes.body?.items
  const isCleared = Array.isArray(itemsAfterClear) ? itemsAfterClear.length === 0 : true

  report.assert(
    'Successfully clear all items from the cart (returns status 200 or 201)',
    (clearCartRes.status === 200 || clearCartRes.status === 201) && isCleared,
    'Best Case',
    `Expected status 200/201 and empty cart items. Got status: ${clearCartRes.status}, Body: ${JSON.stringify(clearCartRes.body)}`
  )

  // --- IMPOSSIBLE & SECURITY SCENARIOS ---

  // 6. Retrieve/Query carts without auth token (should fail to get other carts, or return empty/401)
  const queryCartsNoAuthRes = await apiRequest('/api/carts', 'GET', null, '')
  // Carts should be restricted to authenticated users or return an empty array if guest/not configured
  const unauthorizedQueryBlocked = queryCartsNoAuthRes.status === 401 || 
                                   queryCartsNoAuthRes.status === 403 || 
                                   (queryCartsNoAuthRes.status === 200 && (!queryCartsNoAuthRes.body?.docs || queryCartsNoAuthRes.body.docs.length === 0))
  report.assert(
    'Querying carts without auth token is restricted or returns empty results',
    unauthorizedQueryBlocked,
    'Impossible Scenario',
    `Status: ${queryCartsNoAuthRes.status}, Body: ${JSON.stringify(queryCartsNoAuthRes.body)}`
  )

  // 7. Add item to a cart without auth token
  const addItemNoAuthRes = await apiRequest(
    `/api/carts/${cartID}/add-item`,
    'POST',
    {
      item: { product: product.id },
      quantity: 1,
    },
    ''
  )
  report.assert(
    'Attempt to add item to a cart without auth token is rejected (returns 401, 403, or 404)',
    addItemNoAuthRes.status === 401 || addItemNoAuthRes.status === 403 || addItemNoAuthRes.status === 404,
    'Impossible Scenario',
    `Expected status 401/403/404, got status: ${addItemNoAuthRes.status}, Body: ${JSON.stringify(addItemNoAuthRes.body)}`
  )

  // 8. Attempt to add a non-existent product to cart
  const addInvalidProductRes = await apiRequest(
    `/api/carts/${cartID}/add-item`,
    'POST',
    {
      item: { product: '999999999999999999999999' }, // non-existent Mongo ID format
      quantity: 1,
    },
    customerToken
  )
  report.assert(
    'Attempt to add a non-existent product to the cart is rejected (returns non-200/201 status)',
    addInvalidProductRes.status !== 200 && addInvalidProductRes.status !== 201,
    'Impossible Scenario',
    `Expected non-200/201 status, got status: ${addInvalidProductRes.status}, Body: ${JSON.stringify(addInvalidProductRes.body)}`
  )

  // 9. Worst Case: Cross-User access controls
  // Create a second customer User B and login
  let userB: any = null
  try {
    userB = await payload.create({
      collection: 'users',
      data: {
        email: 'userb.carttest@testing.zinikart.local',
        mobileNumber: '+915555555555',
        mobileVerified: true,
        password: 'password123',
        roles: ['customer'],
      } as any,
      overrideAccess: true,
    })

    const loginRes = await apiRequest('/api/users/login', 'POST', {
      email: 'userb.carttest@testing.zinikart.local',
      password: 'password123',
    })
    const tokenB = loginRes.body?.token

    if (!tokenB) {
      throw new Error('Failed to login User B in Cart tests')
    }

    // Customer B attempts to read Customer A's cart
    const readOtherCartRes = await apiRequest(`/api/carts/${cartID}`, 'GET', null, tokenB)
    report.assert(
      'Access Control: Customer B is blocked from reading Customer A\'s cart (returns 403 or 404)',
      readOtherCartRes.status === 403 || readOtherCartRes.status === 404,
      'Worst Case',
      `Expected status 403/404, got status: ${readOtherCartRes.status}`
    )

    // Customer B attempts to add item to Customer A's cart
    const addOtherCartRes = await apiRequest(
      `/api/carts/${cartID}/add-item`,
      'POST',
      {
        item: { product: product.id },
        quantity: 1,
      },
      tokenB
    )
    report.assert(
      'Access Control: Customer B is blocked from adding items to Customer A\'s cart (returns 403 or 404)',
      addOtherCartRes.status === 403 || addOtherCartRes.status === 404,
      'Worst Case',
      `Expected status 403/404, got status: ${addOtherCartRes.status}`
    )

    // Customer B attempts to clear Customer A's cart
    const clearOtherCartRes = await apiRequest(
      `/api/carts/${cartID}/clear`,
      'POST',
      {},
      tokenB
    )
    report.assert(
      'Access Control: Customer B is blocked from clearing Customer A\'s cart (returns 403 or 404)',
      clearOtherCartRes.status === 403 || clearOtherCartRes.status === 404,
      'Worst Case',
      `Expected status 403/404, got status: ${clearOtherCartRes.status}`
    )

  } catch (err: any) {
    console.error('Error during cross-user cart security tests:', err)
    report.assert('Cross-User cart checks setup error', false, 'Worst Case', err.message)
  } finally {
    if (userB?.id) {
      await payload.delete({
        collection: 'users',
        id: userB.id,
        overrideAccess: true,
      })
    }
  }
}
