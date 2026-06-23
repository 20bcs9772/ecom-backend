import { ReportManager, apiRequest } from './helpers'
import type { Payload } from 'payload'

export async function runCheckoutTests(
  report: ReportManager,
  payload: Payload,
  customerToken: string
) {
  report.setSuite('Checkout & Payments')
  console.log('\nRunning Checkout & Payments tests...')

  // Step 0: Setup checks
  if (!customerToken) {
    report.assert('Checkout tests setup failed: missing customerToken', false, 'Best Case')
    return
  }

  // Find a cloned product to buy
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
    report.assert('Checkout tests setup failed: no cloned products found in database', false, 'Best Case')
    return
  }

  // 1. Get or Create Cart and ensure it has items
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

  if (!cartID) {
    report.assert('Checkout tests setup failed: could not retrieve or create cart', false, 'Best Case')
    return
  }

  // Add the product to cart
  const addRes = await apiRequest(
    `/api/carts/${cartID}/add-item`,
    'POST',
    {
      item: { product: product.id },
      quantity: 1,
    },
    customerToken
  )

  if (addRes.status !== 200 && addRes.status !== 201) {
    report.assert('Checkout tests setup failed: could not add item to cart', false, 'Best Case', `Status: ${addRes.status}, Body: ${JSON.stringify(addRes.body)}`)
    return
  }

  const address = {
    firstName: 'John',
    lastName: 'Doe',
    addressLine1: '123 Test St',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'IN',
  }

  // 2. Initiate Stripe Payment
  const initiateRes = await apiRequest(
    '/api/payments/stripe/initiate',
    'POST',
    {
      cartID,
      billingAddress: address,
      shippingAddress: address,
    },
    customerToken
  )

  const clientSecret = initiateRes.body?.clientSecret
  const transactionID = initiateRes.body?.transactionID || initiateRes.body?.transaction?.id

  report.assert(
    'Successfully initiate payment via Stripe adapter (returns status 200 or 201 and a clientSecret)',
    (initiateRes.status === 200 || initiateRes.status === 201) && !!clientSecret,
    'Best Case',
    `Expected status 200/201 and clientSecret. Got status: ${initiateRes.status}, Body: ${JSON.stringify(initiateRes.body)}`
  )

  // 3. Confirm Stripe Order
  // Since we cannot run standard Stripe JS confirmation in a CLI integration test,
  // we will attempt to hit the backend confirm-order endpoint directly with the transactionID or paymentIntentID.
  const confirmRes = await apiRequest(
    '/api/payments/stripe/confirm-order',
    'POST',
    {
      cartID,
      transactionID: transactionID || 'mock_tx_id',
      paymentIntentID: initiateRes.body?.paymentIntentID || 'pi_mock_intent_id',
      billingAddress: address,
      shippingAddress: address,
    },
    customerToken
  )

  const orderID = confirmRes.body?.orderID || confirmRes.body?.order?.id

  report.assert(
    'Successfully confirm order and generate Order ID (returns status 200 or 201)',
    (confirmRes.status === 200 || confirmRes.status === 201) && !!orderID,
    'Best Case',
    `Expected status 200/201 and orderID. Got status: ${confirmRes.status}, Body: ${JSON.stringify(confirmRes.body)}`
  )

  // --- IMPOSSIBLE & SECURITY SCENARIOS ---

  // 4. Initiate payment without auth token
  const initiateNoAuthRes = await apiRequest(
    '/api/payments/stripe/initiate',
    'POST',
    {
      cartID,
      billingAddress: address,
      shippingAddress: address,
    },
    ''
  )
  report.assert(
    'Attempt to initiate payment without auth token is rejected (returns 400, 401, or 403)',
    initiateNoAuthRes.status === 400 || initiateNoAuthRes.status === 401 || initiateNoAuthRes.status === 403,
    'Impossible Scenario',
    `Expected status 400/401/403, got status: ${initiateNoAuthRes.status}, Body: ${JSON.stringify(initiateNoAuthRes.body)}`
  )

  // 5. Initiate payment with non-existent cart ID
  const initiateInvalidCartRes = await apiRequest(
    '/api/payments/stripe/initiate',
    'POST',
    {
      cartID: 999999, // non-existent integer ID format
      billingAddress: address,
      shippingAddress: address,
    },
    customerToken
  )
  report.assert(
    'Attempt to initiate payment with non-existent cart ID is rejected (returns 400 or 404)',
    initiateInvalidCartRes.status === 400 || initiateInvalidCartRes.status === 404,
    'Impossible Scenario',
    `Expected status 400/404, got status: ${initiateInvalidCartRes.status}, Body: ${JSON.stringify(initiateInvalidCartRes.body)}`
  )

  // 6. Initiate payment with empty cart
  let emptyCartID: any = null
  let userB: any = null
  try {
    // Create another user B to hold an empty cart
    userB = await payload.create({
      collection: 'users',
      data: {
        email: 'userb.checkouttest@testing.zinikart.local',
        mobileNumber: '+915555555555',
        mobileVerified: true,
        password: 'password123',
        roles: ['customer'],
      } as any,
      overrideAccess: true,
    })

    const loginRes = await apiRequest('/api/users/login', 'POST', {
      email: 'userb.checkouttest@testing.zinikart.local',
      password: 'password123',
    })
    const tokenB = loginRes.body?.token

    if (!tokenB) {
      throw new Error('Failed to login User B in Checkout tests')
    }

    const createEmptyCartRes = await apiRequest('/api/carts', 'POST', { customer: userB.id }, tokenB)
    emptyCartID = createEmptyCartRes.body?.doc?.id

    if (!emptyCartID) {
      throw new Error('Failed to create empty cart for User B')
    }

    const initiateEmptyCartRes = await apiRequest(
      '/api/payments/stripe/initiate',
      'POST',
      {
        cartID: emptyCartID,
        billingAddress: address,
        shippingAddress: address,
      },
      tokenB
    )
    report.assert(
      'Attempt to initiate payment with an empty cart is rejected (returns 400 or 500 with proper error)',
      initiateEmptyCartRes.status === 400 || initiateEmptyCartRes.status === 500,
      'Impossible Scenario',
      `Expected status 400/500, got status: ${initiateEmptyCartRes.status}, Body: ${JSON.stringify(initiateEmptyCartRes.body)}`
    )

    // 7. Worst Case: Cross-User payment access
    // Customer B attempts to initiate payment on Customer A's cart
    const initiateOtherCartRes = await apiRequest(
      '/api/payments/stripe/initiate',
      'POST',
      {
        cartID,
        billingAddress: address,
        shippingAddress: address,
      },
      tokenB
    )
    report.assert(
      'Access Control: Customer B is blocked from initiating payment on Customer A\'s cart (returns 403 or 404)',
      initiateOtherCartRes.status === 403 || initiateOtherCartRes.status === 404,
      'Worst Case',
      `Expected status 403/404, got status: ${initiateOtherCartRes.status}, Body: ${JSON.stringify(initiateOtherCartRes.body)}`
    )

    // Customer B attempts to confirm order on Customer A's cart
    const confirmOtherCartRes = await apiRequest(
      '/api/payments/stripe/confirm-order',
      'POST',
      {
        cartID,
        transactionID: transactionID || 'mock_tx_id',
        paymentIntentID: initiateRes.body?.paymentIntentID || 'pi_mock_intent_id',
        billingAddress: address,
        shippingAddress: address,
      },
      tokenB
    )
    report.assert(
      'Access Control: Customer B is blocked from confirming order on Customer A\'s cart (returns 403 or 404)',
      confirmOtherCartRes.status === 403 || confirmOtherCartRes.status === 404,
      'Worst Case',
      `Expected status 403/404, got status: ${confirmOtherCartRes.status}, Body: ${JSON.stringify(confirmOtherCartRes.body)}`
    )

  } catch (err: any) {
    console.error('Error during cross-user checkout security tests:', err)
    report.assert('Cross-User checkout checks setup error', false, 'Worst Case', err.message)
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
