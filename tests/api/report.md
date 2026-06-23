# ZiniKart API Integration Test Report

**Execution Time:** 23/6/2026, 8:19:25 pm
**Total Assertions:** 92 | **Passed:** 90 | **Failed:** 2

### Pass Rate: 98%
`[██████████]`

## Summary Table

| Suite | Scenario | Test Case / Assertion | Status | Error Details |
| --- | --- | --- | --- | --- |
| Authentication Endpoints | Best Case | Request OTP with a valid mobile number returns 200 and success: true | ✅ PASS | - |
| Authentication Endpoints | Best Case | Verify OTP with correct code and retailer role context returns 200, status registration_required, and JWT token | ✅ PASS | - |
| Authentication Endpoints | Possible Scenario | Verify OTP saves the optional name parameter on user creation | ✅ PASS | - |
| Authentication Endpoints | Possible Scenario | Verify OTP for an existing user requesting a new role updates the user roles list | ✅ PASS | - |
| Authentication Endpoints | Impossible Scenario | Request OTP with missing phone number returns 400 error | ✅ PASS | - |
| Authentication Endpoints | Impossible Scenario | Request OTP with malformed phone number returns 400 error | ✅ PASS | - |
| Authentication Endpoints | Impossible Scenario | Verify OTP with incorrect code returns 401 unauthorized error | ✅ PASS | - |
| Authentication Endpoints | Impossible Scenario | Verify OTP with invalid role parameter returns 400 error | ✅ PASS | - |
| Retailer Profile Lifecycle | Impossible Scenario | Attempt to create profile without auth token returns 401 or 403 error | ✅ PASS | - |
| Retailer Profile Lifecycle | Best Case | Create retailer profile with valid data returns 201 and profile document ID | ✅ PASS | - |
| Retailer Profile Lifecycle | Worst Case | Field Access Security: Client cannot force approvalStatus to approved during creation (defaults to pending) | ✅ PASS | - |
| Retailer Profile Lifecycle | Best Case | Verify OTP for retailer with pending profile returns status pending_approval and null token | ✅ PASS | - |
| Retailer Profile Lifecycle | Worst Case | Access Control: Unauthorized user is blocked from reading another user's profile (returns 403 or 404) | ✅ PASS | - |
| Retailer Profile Lifecycle | Worst Case | Access Control: Unauthorized user is blocked from updating another user's profile (returns 403 or 404) | ✅ PASS | - |
| Retailer Profile Lifecycle | Worst Case | Field Access Security: Owner is blocked from changing their own approvalStatus (value remains pending or is ignored) | ✅ PASS | - |
| Retailer Profile Lifecycle | Impossible Scenario | Attempt to create duplicate retailer profile for the same user is rejected (returns non-201 status) | ✅ PASS | - |
| Retailer Profile Lifecycle | Best Case | Verify OTP for approved retailer profile returns status approved and JWT token | ✅ PASS | - |
| Delivery Partner Lifecycle | Impossible Scenario | Attempt to create profile without driving license document returns error (non-201 status) | ✅ PASS | - |
| Delivery Partner Lifecycle | Impossible Scenario | Attempt to create profile without auth token returns 401 or 403 error | ✅ PASS | - |
| Delivery Partner Lifecycle | Best Case | Create delivery partner profile with valid data returns 201 and profile document ID | ✅ PASS | - |
| Delivery Partner Lifecycle | Worst Case | Field Access Security: Client cannot force approvalStatus to approved during creation (defaults to pending) | ✅ PASS | - |
| Delivery Partner Lifecycle | Best Case | Verify OTP for delivery partner with pending profile returns status pending_approval and null token | ✅ PASS | - |
| Delivery Partner Lifecycle | Worst Case | Access Control: Unauthorized user is blocked from reading another user's profile (returns 403 or 404) | ✅ PASS | - |
| Delivery Partner Lifecycle | Worst Case | Access Control: Unauthorized user is blocked from updating another user's profile (returns 403 or 404) | ✅ PASS | - |
| Delivery Partner Lifecycle | Worst Case | Field Access Security: Owner is blocked from changing their own approvalStatus (value remains pending or is ignored) | ✅ PASS | - |
| Delivery Partner Lifecycle | Possible Scenario | Profile Owner is allowed to toggle their own onlineStatus | ✅ PASS | - |
| Delivery Partner Lifecycle | Impossible Scenario | Attempt to create duplicate delivery partner profile for the same user is rejected (returns non-201 status) | ✅ PASS | - |
| Delivery Partner Lifecycle | Best Case | Verify OTP for approved delivery partner profile returns status approved and JWT token | ✅ PASS | - |
| Catalog Foundation | Impossible Scenario | Attempt to create Brand without auth token returns 401 or 403 error | ✅ PASS | - |
| Catalog Foundation | Impossible Scenario | Attempt to create Brand with customer role token returns 401 or 403 error | ✅ PASS | - |
| Catalog Foundation | Impossible Scenario | Attempt to create Category without auth token returns 401 or 403 error | ✅ PASS | - |
| Catalog Foundation | Impossible Scenario | Attempt to create Product without auth token returns 401 or 403 error | ✅ PASS | - |
| Catalog Foundation | Best Case | Create Brand with admin auth returns 201 and Brand ID | ✅ PASS | - |
| Catalog Foundation | Best Case | Create Parent Category with admin auth returns 201 and Category ID | ✅ PASS | - |
| Catalog Foundation | Best Case | Create Subcategory linked to Parent Category returns 201 and Category ID | ✅ PASS | - |
| Catalog Foundation | Best Case | Create Product with brand and specifications returns 201 and Product ID | ✅ PASS | - |
| Catalog Foundation | Best Case | Admin-created product defaults to isMasterTemplate: true and parentTemplate: null | ✅ PASS | - |
| Catalog Foundation | Best Case | Retailer creating product gets isMasterTemplate set to false (roles hook enforcement) | ✅ PASS | - |
| Catalog Foundation | Best Case | Retailer cloning product gets parentTemplate linked and isMasterTemplate set to false | ✅ PASS | - |
| Catalog Foundation | Impossible Scenario | Attempt to create Product missing a required specification returns 400 bad request | ✅ PASS | - |
| Catalog Foundation | Impossible Scenario | Attempt to create Product with non-numeric value for numeric specification returns 400 | ✅ PASS | - |
| Catalog Foundation | Impossible Scenario | Attempt to create Product with invalid date format returns 400 | ✅ PASS | - |
| Catalog Foundation | Impossible Scenario | Attempt to create Product with invalid option for select specification returns 400 | ✅ PASS | - |
| Catalog Foundation | Best Case | Public query of Brands list returns 200 and matches created Brand data | ✅ PASS | - |
| Catalog Foundation | Best Case | Public query of Categories list returns 200 and subcategory correctly links to parent | ✅ PASS | - |
| Catalog Foundation | Worst Case | Public query of master template product returns 404 or 403 forbidden | ✅ PASS | - |
| Catalog Foundation | Best Case | Public query of Product returns 200, populated brand, warranty, and specifications | ✅ PASS | - |
| Catalog Foundation | Worst Case | GET /api/mobile/product/:id for master template returns 404 not found | ✅ PASS | - |
| Catalog Foundation | Best Case | GET /api/mobile/product/:id for cloned product returns 200, product details with ratings, active retailer profile with ratings, and competitor otherOffers with ratings | ✅ PASS | - |
| Catalog Foundation | Best Case | GET /api/mobile/search?q=Cloned returns 200 and matches the cloned product listing | ✅ PASS | - |
| Catalog Foundation | Best Case | GET /api/mobile/search?q=ZiniTech (brand search) returns 200 and matches products of that brand | ✅ PASS | - |
| Catalog Foundation | Best Case | GET /api/mobile/search?q=Smartphones (category search) returns 200 and matches products in that category | ✅ PASS | - |
| Catalog Foundation | Best Case | GET /api/mobile/search?q=Active Retailer (retailer search) returns 200, matching products, and matching retailer profiles | ✅ PASS | - |
| Catalog Foundation | Best Case | GET /api/mobile/search?q= (empty query) returns 200 and empty lists | ✅ PASS | - |
| Catalog Foundation | Best Case | GET /api/mobile/search?q=NonExistentQueryXYZ (no matches) returns 200 and empty lists | ✅ PASS | - |
| Ratings & Reviews | Impossible Scenario | Attempt to create Rating without authentication returns 401 or 403 error | ✅ PASS | - |
| Ratings & Reviews | Best Case | Customer can successfully create a rating (returns 201 and ID) | ✅ PASS | - |
| Ratings & Reviews | Best Case | Product rating aggregates (averageRating and ratingCount) are updated automatically | ✅ PASS | - |
| Ratings & Reviews | Best Case | Retailer rating aggregates (averageRating and ratingCount) are updated automatically | ✅ PASS | - |
| Ratings & Reviews | Impossible Scenario | Uniqueness constraint: Customer is blocked from creating a duplicate rating for the same product and retailer (returns 400) | ✅ PASS | - |
| Ratings & Reviews | Best Case | A second authenticated user can rate the same product and retailer (returns 201) | ✅ PASS | - |
| Ratings & Reviews | Best Case | Aggregated average rating and count are updated correctly after a second rating | ✅ PASS | - |
| Ratings & Reviews | Best Case | Customer can delete their own rating record (returns 200 or 204) | ✅ PASS | - |
| Ratings & Reviews | Best Case | Rating aggregates reset to 0 after all ratings are deleted | ✅ PASS | - |
| Wishlist Collection | Impossible Scenario | Attempt to read Wishlist without authentication returns 401 or 403 error | ✅ PASS | - |
| Wishlist Collection | Impossible Scenario | Attempt to create Wishlist entry without authentication returns 401 or 403 error | ✅ PASS | - |
| Wishlist Collection | Impossible Scenario | Attempt to add a master catalog template to wishlist returns 400 validation error | ✅ PASS | - |
| Wishlist Collection | Best Case | Customer can successfully add a retail product listing to their wishlist (returns 201) | ✅ PASS | - |
| Wishlist Collection | Impossible Scenario | Attempt to add duplicate product entry to wishlist returns 400 validation error | ✅ PASS | - |
| Wishlist Collection | Best Case | Customer can retrieve their own wishlist entries successfully | ✅ PASS | - |
| Wishlist Collection | Worst Case | Unauthorized user is blocked from reading another customer's wishlist entry (returns 403 or 404) | ✅ PASS | - |
| Wishlist Collection | Worst Case | Unauthorized user is blocked from deleting another customer's wishlist entry (returns 403 or 404) | ✅ PASS | - |
| Wishlist Collection | Best Case | Customer can delete their own wishlist entry (returns 200 or 204) | ✅ PASS | - |
| Wishlist Collection | Best Case | Wishlist is empty after successful item deletion | ✅ PASS | - |
| Cart Operations | Best Case | Retrieve or create an active cart for the customer returns a valid cart ID | ✅ PASS | - |
| Cart Operations | Best Case | Successfully add a product to the cart (returns status 200 or 201) | ✅ PASS | - |
| Cart Operations | Best Case | Successfully update a cart item quantity (returns status 200 or 201 and checks updated quantity) | ✅ PASS | - |
| Cart Operations | Best Case | Successfully remove an item from the cart (returns status 200 or 201) | ✅ PASS | - |
| Cart Operations | Best Case | Successfully clear all items from the cart (returns status 200 or 201) | ✅ PASS | - |
| Cart Operations | Impossible Scenario | Querying carts without auth token is restricted or returns empty results | ✅ PASS | - |
| Cart Operations | Impossible Scenario | Attempt to add item to a cart without auth token is rejected (returns 401, 403, or 404) | ✅ PASS | - |
| Cart Operations | Impossible Scenario | Attempt to add a non-existent product to the cart is rejected (returns non-200/201 status) | ✅ PASS | - |
| Cart Operations | Worst Case | Access Control: Customer B is blocked from reading Customer A's cart (returns 403 or 404) | ✅ PASS | - |
| Cart Operations | Worst Case | Access Control: Customer B is blocked from adding items to Customer A's cart (returns 403 or 404) | ✅ PASS | - |
| Cart Operations | Worst Case | Access Control: Customer B is blocked from clearing Customer A's cart (returns 403 or 404) | ✅ PASS | - |
| Checkout & Payments | Best Case | Successfully initiate payment via Stripe adapter (returns status 200 or 201 and a clientSecret) | ❌ FAIL | `Expected status 200/201 and clientSecret. Got status: 500, Body: {"message":"Error initiating payment."}` |
| Checkout & Payments | Best Case | Successfully confirm order and generate Order ID (returns status 200 or 201) | ❌ FAIL | `Expected status 200/201 and orderID. Got status: 500, Body: {"message":"Error confirming order."}` |
| Checkout & Payments | Impossible Scenario | Attempt to initiate payment without auth token is rejected (returns 400, 401, or 403) | ✅ PASS | - |
| Checkout & Payments | Impossible Scenario | Attempt to initiate payment with non-existent cart ID is rejected (returns 400 or 404) | ✅ PASS | - |
| Checkout & Payments | Impossible Scenario | Attempt to initiate payment with an empty cart is rejected (returns 400 or 500 with proper error) | ✅ PASS | - |
| Checkout & Payments | Worst Case | Access Control: Customer B is blocked from initiating payment on Customer A's cart (returns 403 or 404) | ✅ PASS | - |
| Checkout & Payments | Worst Case | Access Control: Customer B is blocked from confirming order on Customer A's cart (returns 403 or 404) | ✅ PASS | - |
