# ZiniKart Backend Project Plan

This document tracks backend requirements, architecture decisions, and implementation planning for **ZiniKart**, a multi-vendor ecommerce platform for mobile phones, mobile accessories, and gadgets.

The backend is based on **Payload CMS v3** and the **Payload Ecommerce Template**. The immediate focus is the backend app only: Payload collections, access control, APIs, workflows, admin capabilities, background jobs, integrations, and Swagger/OpenAPI documentation.

## Product Summary

| Item | Details |
| --- | --- |
| Project name | ZiniKart |
| Product type | Multi-vendor ecommerce platform |
| Primary categories | Mobile phones, mobile accessories, gadgets |
| Backend base | Payload CMS v3 + Payload Ecommerce Template |
| Primary clients | Customer app, retailer app, delivery partner app, admin panel |
| MVP priority | Backend architecture, collections, APIs, workflows, admin operations |

## Applications

| Application | Users | Backend Needs |
| --- | --- | --- |
| Customer App | Customers | OTP login, browse/search products, wishlist, cart, checkout, orders, tracking, profile |
| Retailer App | Sellers/retailers | OTP login, product pricing/stock, accept/reject orders, packing, pickup handover, earnings |
| Delivery Partner App | Delivery executives | Registration, approval, OTP login, online/offline, delivery requests, pickup OTP, COD handling, earnings |
| Admin Panel | Platform administrators | Manage users, retailers, delivery partners, catalog, orders, payments, coupons, notifications, analytics |

## Tech Stack

| Area | Choice | Notes |
| --- | --- | --- |
| CMS / Backend | Payload CMS v3 | Admin panel, collections, access control, REST/GraphQL/custom APIs |
| Base Template | Payload Ecommerce Template | Reuse products, variants, carts, addresses, orders, transactions where practical |
| Database | PostgreSQL | Current Payload adapter uses isolated `payload` schema |
| Mobile Apps | React Native | Planned separately; backend should expose stable APIs |
| Auth | Mobile OTP auth via Twilio | Primary auth for customer, retailer, delivery partner apps |
| Admin Auth | Payload admin auth | Keep email/password initially unless changed later |
| Payments | Razorpay MVP | PRD also mentions PhonePe/Cashfree as future supported gateways |
| COD | Supported | Requires payment state and delivery partner COD workflow |
| Push Notifications | Firebase Cloud Messaging | Used for order, retailer, delivery, promotional alerts |
| Email | Provider TBD | Use jobs/background tasks |
| SMS | Twilio | OTP and optional critical SMS alerts |
| Maps | Google Maps | Rendering/navigation only; app opens external Google Maps for route navigation |
| Location Tracking | Device geolocation | Polling for MVP; realtime can be added later |
| File Storage | AWS S3 or Cloudinary | PRD allows both; AWS deployment planned |
| Deployment | AWS | Production setup later |
| API Docs | Swagger/OpenAPI | Current `payload-oapi` setup should be preserved |

## PRD Scope Mapping

| PRD Area | Backend Capability | MVP Priority |
| --- | --- | --- |
| Customer auth | OTP request/verify, JWT/session generation, auto-login support | P0 |
| Retailer auth | OTP login, retailer profile linkage, approval status | P0 |
| Delivery auth | Registration, document submission, admin approval, OTP login | P0 |
| Catalog | Categories, subcategories, brands, products, seller offers | P0 |
| Search | Product/category/brand search, suggestions, recent searches | P1 |
| Wishlist | Save/remove/move to cart | P1 |
| Cart | Seller-wise pricing, quantities, totals, delivery charges | P0 |
| Checkout | Coupon validation, taxes, delivery charges, payment type | P0 |
| Payments | Razorpay online payment, COD, payment verification | P0 |
| Orders | Order creation, details, invoice data, status tracking | P0 |
| Retailer orders | Accept/reject, preparing, packed, ready for pickup | P0 |
| Pickup handover | Pickup OTP/code verification | P0 |
| Delivery orders | Accept/reject delivery request, pickup, out for delivery, delivered | P0 |
| COD collection | Mark collected/confirmed before delivery completion | P0 |
| Earnings | Retailer and delivery partner earnings summaries | P1 |
| Withdrawals | Delivery partner withdrawal request flow | P2 |
| Admin dashboard | Counts, revenue analytics, monitoring | P1 |
| Coupons | Create rules and expiry | P1 |
| Notifications | Push/email/SMS/in-app notification jobs | P0/P1 |
| Realtime features | Push + polling first; sockets later if needed | P1 |

## Existing Template Assets To Reuse

| Existing Area | Reuse Level | Notes |
| --- | --- | --- |
| `users` collection | High | Extend roles and add mobile OTP fields |
| Access helpers | High | Extend for retailer/delivery ownership |
| Ecommerce plugin products | Medium | Use as catalog base; separate seller-specific offers/stock |
| Ecommerce plugin variants | Medium | Useful for phone/accessory variants if needed |
| Ecommerce plugin carts | Medium/High | Reuse where possible, but seller-wise pricing may require customization |
| Ecommerce plugin orders | Medium | Extend lifecycle, payment type, seller/delivery fields |
| Ecommerce plugin transactions | Medium | Store Razorpay/PhonePe/Cashfree/COD metadata |
| Ecommerce plugin addresses | High | Add coordinates, landmark, delivery instructions |
| Media collection | High | Product, category, banner, retailer, document images |
| Categories collection | High | Extend for subcategories and display metadata |
| OpenAPI setup | High | Keep Swagger docs for custom APIs |
| Web storefront UI | Low | Treat as reference/demo only; mobile APIs are primary |

## Current Template Limitations

| Limitation | Impact | Planned Direction |
| --- | --- | --- |
| Template is web-storefront oriented | Does not directly satisfy mobile PRD | Build mobile/backend custom endpoints |
| No retailer entity | Cannot model shops/seller comparison | Add `retailers` collection |
| No seller product/offers model | Cannot support multiple sellers per product | Add `sellerProducts` collection |
| Global product inventory | Wrong for multi-vendor stock | Stock lives on `sellerProducts` |
| No delivery partner entity | Cannot handle delivery workflows | Add `deliveryPartners` collection |
| Basic order statuses | PRD needs detailed lifecycle | Override/extend order statuses |
| Stripe payments | PRD wants Razorpay, PhonePe, Cashfree, COD | Implement Razorpay first, gateway abstraction later |
| No pickup OTP | Handover cannot be verified | Add pickup code/OTP on order or delivery assignment |
| No earnings/settlements | Retailer/delivery apps need earnings | Add earnings/settlement models |
| No wishlist | Customer PRD requires wishlist | Add `wishlists` or wishlist relation |
| No brand model | Filters/search need brand | Add `brands` collection |
| No background jobs | Notifications and retries need async processing | Use Payload jobs/background task layer |

## Core Domain Model

| Entity | Purpose | MVP Notes |
| --- | --- | --- |
| Users | Auth identities for all roles | Mobile number unique; roles determine app access |
| Retailers | Shop/seller profile | Includes shop, owner, GST, address, bank details, approval |
| DeliveryPartners | Delivery executive profile | Includes documents, vehicle, approval, online status |
| Categories | Product categories/subcategories | Existing collection should be extended |
| Brands | Product brand filtering/search | Needed for phones/gadgets |
| Products | Master catalog product | Product details, specs, warranty, images, brand/category |
| SellerProducts | Retailer-specific offer | Product + retailer + price + stock + discount + availability |
| Carts | Customer cart | Must resolve seller-wise price and stock |
| WishlistItems | Saved products/offers | Move to cart support |
| Addresses | Customer addresses | Add lat/lng, label, landmark, instructions |
| Orders | Customer order | Top-level order/payment/delivery lifecycle |
| OrderItems | Purchased seller product rows | May be embedded in order or separate collection |
| OrderStatusEvents | Append-only timeline | Status history for all apps/admin |
| DeliveryAssignments | Delivery partner assignment | Request accept/reject, pickup OTP, COD state |
| DeliveryLocationUpdates | Polling GPS updates | Append-only or latest+history |
| Transactions | Payment attempts | Razorpay/COD status, gateway metadata |
| Coupons | Discount rules | Basic MVP coupons |
| Notifications | Queued/sent notifications | Push/email/SMS/in-app |
| DeviceTokens | FCM tokens per user/device | Needed for push reliability |
| Banners | App homepage banners | Admin-managed |
| SearchLogs | Recent searches/suggestions | Optional P1 |
| Reviews | Ratings and reviews | Optional P1/P2 |
| Settlements | Retailer earnings settlement | P1/P2 |
| WithdrawalRequests | Delivery partner withdrawals | P2 |
| Settings | Platform config | Delivery charges, tax, support, feature flags |

## Roles And Permissions

| Role | Description | Primary Permissions |
| --- | --- | --- |
| `admin` | Platform administrator | Full backend/admin access |
| `customer` | Buyer using user app | Own profile, addresses, wishlist, cart, orders |
| `retailer` | Seller/shop owner or staff | Own retailer profile, seller products, assigned retailer orders |
| `delivery_partner` | Delivery executive | Own profile, delivery requests, assigned orders, location updates, earnings |

## Authentication Plan

Primary app authentication is mobile-number OTP via Twilio. Payload admin login can remain email/password initially.

| Flow | Endpoint | Description |
| --- | --- | --- |
| Request OTP | `POST /api/mobile/auth/otp/request` | Normalize phone, rate limit, send OTP |
| Verify OTP | `POST /api/mobile/auth/otp/verify` | Verify OTP, create/find user, return JWT/session/profile |
| Fetch profile | `GET /api/mobile/auth/me` | Return user + role-specific profile status |
| Logout | `POST /api/mobile/auth/logout` | Client clears token; optional server-side token invalidation later |
| Register delivery partner | `POST /api/mobile/delivery/register` | Submit profile/documents before approval |
| Retailer onboarding | Admin or API TBD | Retailer record must be approved before retailer app access |

### Authentication Requirements

| Requirement | Plan |
| --- | --- |
| Mobile auth | Store E.164 mobile number on `users` |
| JWT auth | Use Payload-compatible token/session approach |
| Auto-login | Mobile apps persist JWT/refresh strategy TBD |
| OTP expiry | Twilio Verify-managed expiry |
| Rate limiting | Per phone, IP, and device |
| Customer registration | Auto-create customer user after OTP verify |
| Retailer login | User must have `retailer` role and approved retailer link |
| Delivery login | User must have `delivery_partner` role and approved profile |
| Admin login | Keep Payload admin auth initially |

## Retailer Model

| Field | Required | Notes |
| --- | --- | --- |
| Shop name | Yes | Display seller name |
| Owner name | Yes | Admin/internal |
| Mobile number | Yes | Unique/contact |
| GST number | Yes | Required by PRD |
| Shop address | Yes | Include lat/lng later if location-based |
| Bank details | Yes | Needed for settlements |
| Approval status | Yes | `pending`, `approved`, `rejected`, `suspended` |
| Users | Yes | Link retailer users/staff |
| Rating | Later | For seller comparison |

## Delivery Partner Model

| Field | Required | Notes |
| --- | --- | --- |
| Full name | Yes | PRD required |
| Mobile number | Yes | OTP login/contact |
| Email | Yes | PRD required |
| Driving license | Yes | Upload/document field |
| Vehicle type | Yes | Bike/scooter/etc. |
| Approval status | Yes | `pending`, `approved`, `rejected`, `suspended` |
| Online status | Yes | Receives delivery requests only when online |
| Bank details | Later/P1 | Needed for withdrawals/settlements |

## Catalog And Seller Products

PRD requires master catalog products with multiple sellers and seller comparison. Recommended model:

| Collection | Ownership | Purpose |
| --- | --- | --- |
| `products` | Retailers (CRUD for their own), Admin (everything) | Master product data: name, brand, specs, warranty, images, discounts |
| `sellerProducts` | Retailer/admin | Seller-specific price, discount, stock, status, estimated delivery |
| `categories` | Retailer (Create/Read), Admin (everything) | Category/subcategory hierarchy and specification templates |
| `brands` | Retailer (Create/Read), Admin (everything) | Brand filters and search |

### Product Fields

| Field | Source | Notes |
| --- | --- | --- |
| Product name | Master product | Admin/catalog / Retailer |
| Images | Master product | Media uploads |
| Description | Master product | AI autofill later |
| Specifications | Master product | Dynamic validation against category specification templates |
| Brand | Master product | Brand relation |
| Warranty | Master product | Text/select |
| Category/subcategory | Master product | Category relation |
| discountPercent | Master product | Applied discount percentage (0-100), bidirectionally synced with discountedPrice |
| discountedPrice | Master product | Calculated final price after discount |
| retailer | Master product | Links the product to its creator/owner user |
| Ratings/reviews | Aggregated | Later |

### External Catalog Importer Service

A modular integration service (`CatalogService`) using an **Adapter Pattern** is designed to import products into the master catalog.

1.  **Supported Adapters**:
    *   **MobileAPI.dev**: Provides live REST endpoint access to ~31,000+ smartphones, tablets, and laptops.
    *   **GSMArena Scraper**: Community scraper API to fetch phone specifications and brand listings.
    *   **DBpedia/Wikidata**: RDF query engine via SPARQL to get phone/camera specifications and Wikimedia image URLs.
    *   **Kaggle Datasets**: Local CSV parser for digital cameras, headphones, and other static hardware specifications.
2.  **Import Logic**:
    *   **Just-in-Time Import**: When a retailer chooses to sell an item from the external list, the system automatically checks if it exists in the master catalog. If not, it imports it dynamically (saving title, brand, category, specifications, and downloading CC-licensed Wikimedia Commons images) before creating the seller's offer.
    *   **Batch Synchronization**: Optional background cron job to cache popular models to minimize live API latency and stay within API rate limits.

### Seller Product Fields

| Field | Source | Notes |
| --- | --- | --- |
| Retailer | Seller product | Required |
| Product | Seller product | Required |
| Selling price | Retailer | Required |
| Stock quantity | Retailer | Required |
| Stock status | Derived/manual | In stock/out of stock |
| Discount | Retailer | Optional |
| Availability | Retailer | Toggle |
| Estimated delivery time | Retailer/system | For seller comparison |

## Customer App Backend Modules

| Module | Backend Features |
| --- | --- |
| Home | Top products, categories, best sellers, discounts, recommendations, banners |
| Categories | Category tree, category products, filters |
| Search | Keyword/category/brand search, suggestions, recent searches |
| Product listing | Product cards with price, discount, rating, seller name |
| Product detail | Master product details plus seller comparison |
| Wishlist | Save/remove products or seller offers, move to cart |
| Cart | Seller-wise pricing, quantity, delivery charges, final total |
| Checkout | Coupon, tax, delivery charges, payment type |
| Payment | Razorpay online payment and COD |
| Orders | Current/previous orders, repeat order, invoice data |
| Tracking | Status timeline and delivery location |
| Profile | Name/email/address management; mobile non-editable |

## Retailer App Backend Modules

| Module | Backend Features |
| --- | --- |
| Dashboard | Live order count, today orders, today earnings, latest orders |
| Products | Search master catalog, create seller product, update price/stock/availability |
| Orders | Accept/reject, preparing, packed, ready for pickup |
| Handover | Verify pickup OTP/code, mark package handed over |
| Earnings | Daily/weekly/lifetime earnings, order-wise earnings, commissions |

## Delivery Partner App Backend Modules

| Module | Backend Features |
| --- | --- |
| Registration | Profile, documents, vehicle type, admin approval |
| Home | Online/offline toggle, live delivery requests |
| Delivery requests | Accept/reject delivery assignment |
| Pickup | Navigate to retailer, verify pickup OTP/code, mark picked up |
| Delivery | Start delivery, update location, collect COD if needed, mark delivered |
| Earnings | Today/weekly/total earnings |
| Withdrawal | Withdrawal amount, bank account, request status |
| Profile | Edit profile, support, logout |

## Admin Backend Modules

| Module | Backend Features |
| --- | --- |
| Dashboard | Total orders, users, retailers, delivery partners, revenue analytics |
| User management | View users, block/unblock, order history |
| Retailer management | Approve retailers, manage products, monitor performance |
| Delivery management | Approve/suspend partners, view active deliveries |
| Product/category management | Categories, subcategories, brands, catalog, banners |
| Order management | View all orders, update statuses, cancellations, refunds |
| Coupon management | Create coupons, discount rules, expiry |
| Payment management | Payment states, refunds, COD reconciliation |
| Notification management | Send promotional/order notifications |
| Analytics | Revenue, orders, earnings, retailer performance |

## Order Lifecycle

Client PRD lifecycle:

```txt
order_received -> preparing -> packed -> ready_for_pickup -> picked_up -> out_for_delivery -> delivered
```

Operational lifecycle with actors:

| Status | Actor | Meaning | Side Effects |
| --- | --- | --- | --- |
| `order_received` | System | Order created after payment/COD confirmation | Notify retailer/customer |
| `accepted` | Retailer | Retailer accepts order | Confirm fulfillment |
| `rejected` | Retailer | Retailer rejects order | Trigger refund/reassignment/cancel flow |
| `preparing` | Retailer | Retailer preparing order | Notify customer |
| `packed` | Retailer | Order packed | Notify customer/admin |
| `ready_for_pickup` | Retailer | Ready for delivery pickup | Generate pickup OTP/code; notify delivery/admin |
| `delivery_assigned` | Admin/system | Partner assigned | Notify delivery partner |
| `picked_up` | Delivery partner | Pickup verified and collected | Start delivery tracking |
| `out_for_delivery` | Delivery partner | Partner is en route to customer | Notify customer |
| `delivered` | Delivery partner | Order completed | Close assignment, queue earnings |
| `cancelled` | Customer/admin/system | Order cancelled | Refund/release inventory if needed |
| `failed` | System/payment | Payment/order failure | Notify customer/admin |
| `refunded` | Admin/payment | Refund completed | Close payment issue |

## Payment Plan

| Payment Method | MVP Support | Notes |
| --- | --- | --- |
| Razorpay | Yes | First online gateway |
| Cash on Delivery | Yes | Requires COD collection workflow |
| PhonePe | Later | Keep gateway abstraction extensible |
| Cashfree | Later | Keep gateway abstraction extensible |

### Payment States

| State | Meaning |
| --- | --- |
| `pending` | Awaiting payment |
| `success` | Payment completed |
| `failed` | Payment failed |
| `refunded` | Amount refunded |
| `cod_pending` | COD expected from customer |
| `cod_collected` | COD collected by delivery partner |
| `cod_settled` | COD settled internally |

### Online Payment Flow

| Step | Backend Responsibility |
| --- | --- |
| Create payment order | Create Razorpay order from server-side cart totals |
| Open gateway | Mobile app handles Razorpay checkout |
| Verify transaction | Backend verifies Razorpay signature/payment |
| Create order | Backend creates order after verification |
| Notify actors | Queue customer/retailer notifications |

### COD Flow

| Step | Backend Responsibility |
| --- | --- |
| Place order | Validate cart and address |
| Confirm COD | Create order with COD payment state |
| Delivery collection | Delivery partner marks COD collected |
| Delivery completion | Mark delivered only after COD confirmation if required |

## Delivery And Tracking Strategy

| Requirement | MVP Plan |
| --- | --- |
| Live order tracking | Status updates plus location polling |
| Delivery assignment | Manual admin assignment first; auto assignment later |
| Instant alerts | Firebase push notifications |
| Status sync | Apps poll order detail or refresh after push notification |
| Route navigation | Mobile app opens Google Maps |
| Location data | Delivery app posts lat/lng periodically |

For MVP, avoid Socket.IO/realtime servers unless absolutely needed. Push notifications plus polling can satisfy most "realtime" user expectations at lower complexity.

## Pickup Verification

| Item | Plan |
| --- | --- |
| Pickup OTP/code | Generate when order becomes `ready_for_pickup` or assignment is created |
| Verification actor | Retailer verifies code shown/provided by delivery partner |
| Result | Status moves to `picked_up` and handover timestamp is stored |
| Audit | Store verification event in order status history |

## Background Jobs And Notifications

Use background jobs for slow, retryable, or external side effects. Keep critical order/payment writes synchronous.

| Job Type | Trigger | Action | Priority |
| --- | --- | --- | --- |
| OTP SMS | OTP request | Send/verify through Twilio | P0 |
| Customer push | Order status/payment changes | FCM push to customer | P0 |
| Retailer push | New order/ready actions | FCM push to retailer users | P0 |
| Delivery push | Delivery request/assignment | FCM push to delivery partner | P0 |
| Promotional push | Admin campaign | FCM push to selected audience | P1 |
| Email notification | Order/invoice/refund events | Send email via provider | P1 |
| Order timeout | Scheduled job | Detect stale retailer/delivery acceptance | P1/P2 |
| Earnings credit | Delivered order | Calculate retailer/delivery earnings | P1 |
| Settlement processing | Scheduled/manual | Mark settlements/withdrawals | P2 |
| AI autofill | Vendor product draft | Generate product metadata suggestions | P2 |

### Notification Audiences

| Notification Type | Audience |
| --- | --- |
| OTP received | Customer/retailer/delivery partner |
| Order placed | Customer |
| New order received | Retailer |
| Pickup assigned | Retailer |
| Delivery request | Delivery partner |
| Order shipped/out for delivery | Customer |
| Delivered | Customer |
| Earnings credited | Retailer/delivery partner |
| Promotional | All users or segmented users |

## Notification Model

| Field | Purpose |
| --- | --- |
| `recipient` | User receiving notification |
| `audienceRole` | Optional role segment |
| `channel` | `push`, `email`, `sms`, `in_app` |
| `type` | `order_placed`, `delivery_request`, etc. |
| `title` | Short title |
| `message` | Notification body |
| `data` | JSON navigation payload |
| `status` | `queued`, `sent`, `failed`, `cancelled` |
| `attempts` | Retry count |
| `lastError` | Last failure |
| `sentAt` | Dispatch timestamp |

## API Strategy

Use Payload REST for simple admin-safe CRUD. Use custom endpoints for mobile workflows, payments, OTP, status transitions, and side effects.

| Area | API Type | Notes |
| --- | --- | --- |
| Auth | Custom mobile endpoints | Twilio OTP + Payload-compatible token |
| Catalog | Custom read endpoints + Payload REST | Seller pricing must be resolved server-side |
| Search | Custom endpoint | Keyword/category/brand suggestions |
| Wishlist | Custom or Payload REST | Enforce current customer ownership |
| Cart | Plugin endpoints or custom wrapper | Must validate seller product availability |
| Checkout | Custom service endpoint | Coupon, tax, delivery charges, payment type |
| Razorpay | Custom endpoints | Create order and verify payment |
| COD | Custom checkout/order endpoints | COD state transitions |
| Order status | Custom endpoints | Enforce allowed transitions by role |
| Retailer orders | Custom endpoints | Accept/reject/update status |
| Delivery assignment | Custom endpoints | Accept/reject pickup/delivery actions |
| Tracking | Custom endpoint | Post delivery location; read latest tracking |
| Earnings | Custom read endpoints | Aggregates for retailer/delivery app |
| Withdrawals | Custom/Payload REST | Delivery partner withdrawal requests |
| Notifications | Jobs + admin endpoints | Apps should not directly send system notifications |

## Recommended Folder Structure

```txt
src/
  access/
  collections/
    Users/
    Retailers/
    DeliveryPartners/
    Categories/
    Brands/
    Products/
    SellerProducts/
    Wishlists/
    Carts/
    Orders/
    OrderStatusEvents/
    DeliveryAssignments/
    DeliveryLocationUpdates/
    Transactions/
    Coupons/
    Notifications/
    DeviceTokens/
    Banners/
    Settlements/
    WithdrawalRequests/
    Settings/
  endpoints/
    mobile/
      auth/
      catalog/
      search/
      wishlist/
      cart/
      checkout/
      orders/
      retailer/
      delivery/
      profile/
    admin/
    ai/
      productAutofill/
  services/
    auth/
    catalog/
    cart/
    checkout/
    orders/
    inventory/
    payments/
      razorpay/
      cod/
    delivery/
    earnings/
    notifications/
    ai/
  hooks/
    orders/
    inventory/
    notifications/
  jobs/
    notifications/
    email/
    push/
    earnings/
    maintenance/
  fields/
  utilities/
```

## Integrations

| Integration | MVP Role | Backend Responsibility |
| --- | --- | --- |
| Twilio | OTP authentication | Request/verify OTP, rate limit, normalize phone |
| Razorpay | Online payments | Create gateway order, verify signature, update transaction/order |
| PhonePe | Future payment gateway | Keep payment abstraction extensible |
| Cashfree | Future payment gateway | Keep payment abstraction extensible |
| Firebase FCM | Push notifications | Store device tokens, enqueue/send notifications |
| Email provider | Email/invoice/refund notifications | Send through jobs |
| AWS S3 / Cloudinary | File storage | Product images, delivery docs, retailer docs |
| Google Maps | Navigation/rendering | Store coordinates; apps handle map UI/navigation |
| AI/LLM + web search | Product autofill | Generate draft metadata for retailer/admin review |

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection |
| `PAYLOAD_SECRET` | Payload secret |
| `NEXT_PUBLIC_SERVER_URL` | Public server URL |
| `TWILIO_ACCOUNT_SID` | Twilio account |
| `TWILIO_AUTH_TOKEN` | Twilio auth |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify service |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay secret |
| `FIREBASE_PROJECT_ID` | Firebase project |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account |
| `FIREBASE_PRIVATE_KEY` | Firebase private key |
| `EMAIL_FROM` | Default email sender |
| `EMAIL_PROVIDER_API_KEY` | Email provider key |
| `STORAGE_BUCKET` | S3/Cloudinary bucket/config |
| `AI_PROVIDER_API_KEY` | Product autofill provider |

## Implementation Roadmap

| Phase | Focus | Deliverables |
| --- | --- | --- |
| 0 | Planning and cleanup | Finalize schema decisions, roles, statuses, API boundaries |
| 1 | Auth foundation | Mobile fields, OTP endpoints, Twilio service, JWT/session profile |
| 2 | Core actors | Retailers, delivery partners, approvals, role access |
| 3 | Catalog foundation | Categories, subcategories, brands, product specs |
| 4 | Seller products | Retailer price, stock, availability, seller comparison |
| 5 | Customer features | Wishlist, catalog APIs, search, cart validation |
| 6 | Checkout/payment | Coupons, totals, Razorpay, COD, transaction states |
| 7 | Order lifecycle | Order overrides, order items, status events, transition services |
| 8 | Retailer workflow | Accept/reject, preparing, packed, ready for pickup, earnings basis |
| 9 | Delivery workflow | Assignment, delivery requests, pickup OTP, COD collection, delivery completion |
| 10 | Notifications/jobs | Device tokens, notifications collection, Firebase/email jobs |
| 11 | Admin operations | Dashboards, approval flows, payment/refund/coupon management |
| 12 | API docs/testing | Swagger cleanup, Postman collection, integration tests |
| 13 | AI autofill | Product draft suggestions for admin/retailer review |
| 14 | Production | AWS deploy, storage, logging, monitoring, rate limits |

## MVP Milestones

| Milestone | Success Criteria |
| --- | --- |
| Auth MVP | Customer/retailer/delivery OTP login works with role-aware profile |
| Retailer MVP | Admin approves retailer; retailer manages seller products and stock |
| Catalog MVP | Customer can browse/search phones/accessories/gadgets with seller pricing |
| Wishlist MVP | Customer can save/remove/move products to cart |
| Cart MVP | Customer can manage seller-specific cart items and totals |
| Payment MVP | Razorpay and COD order flows work |
| Order MVP | Order lifecycle works from received to delivered |
| Retailer Ops MVP | Retailer accepts/rejects, prepares, packs, marks ready |
| Delivery MVP | Partner accepts request, verifies pickup OTP, delivers order, handles COD |
| Notification MVP | Key lifecycle events send queued push notifications |
| Admin MVP | Admin can manage users, retailers, delivery partners, orders, catalog, coupons |

## Open Decisions

| Decision | Options | Recommendation |
| --- | --- | --- |
| Seller inventory model | Product stock vs `sellerProducts` | Use `sellerProducts` |
| Order item storage | Embedded in orders vs separate collection | Use plugin order items initially; separate if reporting becomes painful |
| Admin auth | Email/password vs OTP | Keep Payload admin email/password initially |
| OTP provider | Twilio Verify vs custom OTP | Use Twilio Verify |
| First payment gateway | Razorpay vs generic abstraction first | Implement Razorpay service with generic interface shape |
| COD settlement | Manual vs automated | Manual/admin MVP, automate later |
| Delivery assignment | Manual vs auto | Manual/admin MVP, auto later |
| Tracking transport | Polling/push vs Socket.IO | Polling + push MVP |
| File storage | S3 vs Cloudinary | AWS S3 if AWS deployment is primary |
| Search | Database search vs external search | Start with DB search; external search later |
| Reviews/ratings | MVP vs later | Later unless client insists |

## Security Requirements

| Requirement | Backend Plan |
| --- | --- |
| JWT authentication | Payload-compatible JWT/session for mobile APIs |
| HTTPS | Required in production |
| OTP expiry | Twilio Verify expiry |
| Rate limiting | OTP and sensitive endpoints |
| Role-based access | Payload access functions and custom endpoint checks |
| API authentication | Bearer token for mobile APIs |
| SQL injection prevention | Use Payload/structured queries, avoid raw SQL unless parameterized |
| XSS protection | Sanitize/admin-controlled rich text where exposed |
| Document protection | Delivery licenses/bank details require restricted access |
| Payment verification | Server-side signature verification |
| Auditability | Status events for important order/delivery/payment changes |

## Backend Deliverables

| Deliverable | Notes |
| --- | --- |
| REST/custom APIs | Mobile app workflows |
| Authentication system | OTP, JWT/session, roles |
| Database schema | Payload collections and generated types |
| Admin APIs/panel | Payload admin + custom admin workflows |
| Payment integration | Razorpay first, COD support |
| Tracking system | Polling location updates and status timeline |
| Notification system | FCM/email/SMS jobs |
| Swagger documentation | Keep custom APIs OpenAPI-compatible |
| Postman collection | Later, after endpoint stabilization |
| Production deployment setup | AWS, storage, env, logs, monitoring |

## Engineering Principles

- Keep the Payload admin panel useful for operations from day one.
- Use Payload collections for data ownership, admin screens, and schema clarity.
- Use custom endpoints for mobile workflows and state transitions.
- Put business logic in `services/`, not UI components.
- Avoid uncontrolled direct status updates from apps.
- Record lifecycle events instead of overwriting history.
- Use `overrideAccess: false` when operating on behalf of a user.
- Pass `req` through nested Payload operations in hooks/services.
- Keep background jobs idempotent and retry-safe.
- Start with polling + push before adding realtime infrastructure.
- Keep the gateway/payment code abstract enough to add PhonePe/Cashfree later.

## Immediate Next Steps

| Step | Action |
| --- | --- |
| 1 | Confirm `sellerProducts` as retailer-specific price/stock model |
| 2 | Confirm admin auth remains Payload email/password |
| 3 | Finalize order/payment status enums |
| 4 | Design OTP auth fields and Twilio service |
| 5 | Design `retailers` and `deliveryPartners` collections |
| 6 | Design `brands`, product specs, and seller comparison fields |
| 7 | Design order lifecycle/status event model |
| 8 | Create implementation tickets phase by phase |
