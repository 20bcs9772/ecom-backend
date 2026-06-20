import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload, jwtSign } from 'payload'
import configPromise from '../../src/payload.config'
import { ReportManager, apiRequest } from './helpers'
import { runAuthTests } from './auth'
import { runRetailerTests } from './retailer'
import { runDeliveryTests } from './delivery'
import { runCatalogTests } from './catalog'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  console.log('=== Starting ZiniKart API Integration Testing ===\n')

  const report = new ReportManager()

  // 1. Boot Payload
  console.log('Initializing Payload CMS local API...')
  const payloadConfig = await configPromise
  const payload = await getPayload({ config: payloadConfig })

  const testMobile = '+919999999999'
  const otherMobile = '+918888888888'
  const adminMobile = '+917777777777'
  const retailerMobile = '+916666666666'

  // 2. Perform Database Cleanup first to ensure clean state
  console.log('\nCleaning up old test data from database...')
  
  const cleanMobiles = [testMobile, otherMobile, adminMobile, retailerMobile]
  const existingUsers = await payload.find({
    collection: 'users',
    where: {
      mobileNumber: { in: cleanMobiles },
    },
    overrideAccess: true,
  })

  const userIds = existingUsers.docs.map((u) => u.id)
  if (userIds.length > 0) {
    console.log(`Batch deleting profiles and users for IDs: ${userIds.join(', ')}`)
    await payload.delete({
      collection: 'retailers',
      where: {
        user: { in: userIds },
      },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'delivery-partners',
      where: {
        user: { in: userIds },
      },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'users',
      where: {
        id: { in: userIds },
      },
      overrideAccess: true,
    })
  }

  // Clean up any mock media uploads from previous test runs.
  // This must happen after deleting delivery-partners referencing it to avoid foreign key violations.
  await payload.delete({
    collection: 'media',
    where: {
      alt: { equals: 'Mock License' },
    },
    overrideAccess: true,
  })

  // Clean up any mock catalog items from previous runs.
  // Products must be deleted first because they reference categories and brands.
  await payload.delete({
    collection: 'products',
    where: {
      title: { in: ['ZiniPhone 14 Max', 'Retailer Standalone Phone', 'Cloned ZiniPhone 14 Max'] },
    },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'categories',
    where: {
      title: { in: ['Mobiles', 'Smartphones'] },
    },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'brands',
    where: {
      name: { equals: 'ZiniTech' },
    },
    overrideAccess: true,
  })

  // 3. Create a second test user locally for security/access control checks
  console.log('\nCreating second test user for access control validation...')
  const otherUser = await payload.create({
    collection: 'users',
    data: {
      email: 'other.user@testing.zinikart.local',
      mobileNumber: otherMobile,
      mobileVerified: true,
      password: 'testPassword123',
      roles: ['customer'],
    } as any,
    overrideAccess: true,
  })

  // Generate JWT token for the second user
  const { token: otherUserToken } = await jwtSign({
    fieldsToSign: {
      collection: 'users',
      email: otherUser.email,
      id: otherUser.id,
      roles: ['customer'],
    },
    secret: payload.secret,
    tokenExpiration: 1209600,
  })

  if (!otherUserToken) {
    throw new Error('Failed to generate JWT token for second user')
  }

  // Create a retailer user locally for catalog tests
  console.log('\nCreating retailer test user for catalog tests...')
  const retailerUser = await payload.create({
    collection: 'users',
    data: {
      email: 'retailer.user@testing.zinikart.local',
      mobileNumber: retailerMobile,
      mobileVerified: true,
      password: 'retailerPassword123',
      roles: ['retailer'],
    } as any,
    overrideAccess: true,
  })

  // Log in as retailer via standard REST API to obtain a valid authenticated token
  const retailerLoginRes = await apiRequest('/api/users/login', 'POST', {
    email: 'retailer.user@testing.zinikart.local',
    password: 'retailerPassword123',
  })
  const retailerUserToken = retailerLoginRes.body?.token

  if (!retailerUserToken) {
    throw new Error(`Failed to log in retailer user: ${JSON.stringify(retailerLoginRes.body)}`)
  }

  // Create an admin user locally for catalog tests
  console.log('\nCreating admin test user for catalog tests...')
  const adminUser = await payload.create({
    collection: 'users',
    data: {
      email: 'admin.user@testing.zinikart.local',
      mobileNumber: adminMobile,
      mobileVerified: true,
      password: 'adminPassword123',
      roles: ['admin'],
    } as any,
    overrideAccess: true,
  })

  // Log in as admin via standard REST API to obtain a valid authenticated token
  const adminLoginRes = await apiRequest('/api/users/login', 'POST', {
    email: 'admin.user@testing.zinikart.local',
    password: 'adminPassword123',
  })
  const adminUserToken = adminLoginRes.body?.token

  if (!adminUserToken) {
    throw new Error(`Failed to log in admin user: ${JSON.stringify(adminLoginRes.body)}`)
  }

  // 4. Run Test Suites
  try {
    await runAuthTests(report, testMobile)
    await runRetailerTests(report, payload, testMobile, otherUserToken)
    await runDeliveryTests(report, payload, testMobile, otherUserToken)
    await runCatalogTests(report, payload, adminUserToken, otherUserToken, retailerUserToken)
  } catch (err) {
    console.error('Test execution error occurred:', err)
  }

  // 5. Clean up all created test data at the end
  console.log('\nCleaning up created test records from database...')
  
  const finalCleanUsers = await payload.find({
    collection: 'users',
    where: {
      mobileNumber: { in: cleanMobiles },
    },
    overrideAccess: true,
  })

  const finalUserIds = finalCleanUsers.docs.map((u) => u.id)
  if (finalUserIds.length > 0) {
    console.log(`Batch cleaning profiles and users for IDs: ${finalUserIds.join(', ')}`)
    await payload.delete({
      collection: 'retailers',
      where: {
        user: { in: finalUserIds },
      },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'delivery-partners',
      where: {
        user: { in: finalUserIds },
      },
      overrideAccess: true,
    })
    await payload.delete({
      collection: 'users',
      where: {
        id: { in: finalUserIds },
      },
      overrideAccess: true,
    })
  }

  // Clean up any mock media uploads created during this test run.
  // This must happen after deleting delivery-partners referencing it to avoid foreign key violations.
  await payload.delete({
    collection: 'media',
    where: {
      alt: { equals: 'Mock License' },
    },
    overrideAccess: true,
  })

  // Clean up any mock catalog items created during this test run.
  // Products must be deleted first because they reference categories and brands.
  await payload.delete({
    collection: 'products',
    where: {
      title: { in: ['ZiniPhone 14 Max', 'Retailer Standalone Phone', 'Cloned ZiniPhone 14 Max'] },
    },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'categories',
    where: {
      title: { in: ['Mobiles', 'Smartphones'] },
    },
    overrideAccess: true,
  })
  await payload.delete({
    collection: 'brands',
    where: {
      name: { equals: 'ZiniTech' },
    },
    overrideAccess: true,
  })

  // 6. Generate Report
  const reportPath = path.resolve(__dirname, 'report.md')
  report.generateMarkdownReport(reportPath)

  const failedCount = report.results.filter((r) => !r.success).length
  console.log(`\n=== Testing completed. Failed assertions: ${failedCount} ===`)

  process.exit(failedCount > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Test runner main process crash:', err)
  process.exit(1)
})
