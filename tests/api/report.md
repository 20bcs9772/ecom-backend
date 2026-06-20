# ZiniKart API Integration Test Report

**Execution Time:** 20/6/2026, 7:29:48 pm
**Total Assertions:** 47 | **Passed:** 47 | **Failed:** 0

### Pass Rate: 100%
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
