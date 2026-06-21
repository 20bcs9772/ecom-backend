import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest, File } from 'payload'
import fs from 'fs'
import path from 'path'

import { contactFormData } from './contact-form'
import { contactPageData } from './contact-page'
import { productHeadphonesData } from './product-headphones'
import { productSmartphoneData, productSmartphoneVariant } from './product-smartphone'
import { productCameraData } from './product-camera'
import { homePageData } from './home'
import { headphonesMediaData, smartphoneBlackMediaData, smartphoneWhiteMediaData } from './media-metadata'
import { imageHero1Data } from './image-hero-1'
import { Address, Transaction, VariantOption } from '@/payload-types'

const collections: CollectionSlug[] = [
  'orders',
  'carts',
  'transactions',
  'addresses',
  'delivery-partners',
  'retailers',
  'variants',
  'products',
  'variantOptions',
  'variantTypes',
  'pages',
  'forms',
  'form-submissions',
  'categories',
  'brands',
  'media',
]

const globals: GlobalSlug[] = ['header', 'footer']

const baseAddressUSData: Transaction['billingAddress'] = {
  title: 'Dr.',
  firstName: 'Otto',
  lastName: 'Octavius',
  phone: '1234567890',
  company: 'Oscorp',
  addressLine1: '123 Main St',
  addressLine2: 'Suite 100',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  country: 'US',
}

const baseAddressUKData: Transaction['billingAddress'] = {
  title: 'Mr.',
  firstName: 'Oliver',
  lastName: 'Twist',
  phone: '1234567890',
  addressLine1: '48 Great Portland St',
  city: 'London',
  postalCode: 'W1W 7ND',
  country: 'GB',
}

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  // we need to clear the media directory before seeding
  // as well as the collections and globals
  // this is because while `yarn seed` drops the database
  // the custom `/api/seed` endpoint does not
  payload.logger.info(`— Clearing collections and globals...`)

  // clear the database
  await Promise.all(
    globals.map((global) =>
      payload.updateGlobal({
        slug: global,
        data: {
          navItems: [],
        },
        depth: 0,
        context: {
          disableRevalidate: true,
        },
      }),
    ),
  )

  for (const collection of collections) {
    await payload.db.deleteMany({ collection, req, where: {} })
    if (payload.collections[collection].config.versions) {
      await payload.db.deleteVersions({ collection, req, where: {} })
    }
  }

  payload.logger.info(`— Seeding customer and customer data...`)

  await payload.delete({
    collection: 'users',
    depth: 0,
    where: {
      email: {
        in: ['customer@example.com', 'retailer@example.com', 'delivery@example.com'],
      },
    },
  })

  payload.logger.info(`— Seeding media...`)

  const [imageHatBuffer, imageTshirtBlackBuffer, imageTshirtWhiteBuffer, heroBuffer] =
    await Promise.all([
      fetchFileByURL(
        'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/ecommerce/src/endpoints/seed/hat-logo.png',
      ),
      fetchFileByURL(
        'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/ecommerce/src/endpoints/seed/tshirt-black.png',
      ),
      fetchFileByURL(
        'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/ecommerce/src/endpoints/seed/tshirt-white.png',
      ),
      fetchFileByURL(
        'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/3.x/templates/website/src/endpoints/seed/image-hero1.webp',
      ),
    ])

  const [
    customer,
    retailerUser,
    deliveryPartnerUser,
    imageHat,
    imageTshirtBlack,
    imageTshirtWhite,
    imageHero,
  ] = await Promise.all([
    payload.create({
      collection: 'users',
      data: {
        name: 'Customer',
        email: 'customer@example.com',
        password: 'password',
        roles: ['customer'],
      },
    }),
    payload.create({
      collection: 'users',
      data: {
        name: 'Retailer User',
        email: 'retailer@example.com',
        password: 'password',
        roles: ['retailer'],
      },
    }),
    payload.create({
      collection: 'users',
      data: {
        name: 'Delivery Partner User',
        email: 'delivery@example.com',
        password: 'password',
        roles: ['customer'],
      },
    }),
    payload.create({
      collection: 'media',
      data: headphonesMediaData,
      file: imageHatBuffer,
    }),
    payload.create({
      collection: 'media',
      data: smartphoneBlackMediaData,
      file: imageTshirtBlackBuffer,
    }),
    payload.create({
      collection: 'media',
      data: smartphoneWhiteMediaData,
      file: imageTshirtWhiteBuffer,
    }),
    payload.create({
      collection: 'media',
      data: imageHero1Data,
      file: heroBuffer,
    }),
  ])

  // Load mobile phone dataset
  let dataset: any[] = []
  try {
    const datasetPath = path.resolve(process.cwd(), 'datasets/phones_data_20250729_022344.json')
    if (fs.existsSync(datasetPath)) {
      payload.logger.info(`— Reading dataset from ${datasetPath}...`)
      dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'))
    } else {
      payload.logger.warn(`Dataset file not found at ${datasetPath}`)
    }
  } catch (err) {
    payload.logger.error(`Failed to read dataset: ${err instanceof Error ? err.message : String(err)}`)
  }

  // Pick 4 products for each of the 6 brands: Apple, Samsung, Oppo, Vivo, Realme, Motorola
  const targetBrands = ['apple', 'samsung', 'oppo', 'vivo', 'realme', 'motorola']
  const selectedProductsByBrand: Record<string, any[]> = {
    apple: [],
    samsung: [],
    oppo: [],
    vivo: [],
    realme: [],
    motorola: [],
  }

  for (const item of dataset) {
    const brandName = item.brand?.trim().toLowerCase()
    if (brandName && targetBrands.includes(brandName)) {
      const ramNum = parseInt(item.ram || '')
      const storage = (item.internal_storage || '').trim().replace(/\s+/g, '')
      if (!isNaN(ramNum) && storage && selectedProductsByBrand[brandName].length < 4) {
        selectedProductsByBrand[brandName].push(item)
      }
    }
  }

  // Collect unique storage values to set up Mobile category template options
  const uniqueStorageOptions = new Set<string>()
  for (const brandName of targetBrands) {
    for (const item of selectedProductsByBrand[brandName]) {
      const storage = (item.internal_storage || '').trim().replace(/\s+/g, '')
      if (storage) {
        uniqueStorageOptions.add(storage)
      }
    }
  }
  if (uniqueStorageOptions.size === 0) {
    uniqueStorageOptions.add('128GB')
    uniqueStorageOptions.add('256GB')
    uniqueStorageOptions.add('512GB')
  }

  // Create categories and brands
  const [
    mobileCategory,
    cameraCategory,
    headphonesCategory,
    appleBrand,
    samsungBrand,
    sonyBrand,
    oppoBrand,
    vivoBrand,
    realmeBrand,
    motorolaBrand,
  ] = await Promise.all([
    payload.create({
      collection: 'categories',
      data: {
        title: 'Mobile',
        slug: 'mobile',
        specificationTemplates: [
          { name: 'RAM', type: 'number', required: true },
          {
            name: 'Storage',
            type: 'select',
            options: Array.from(uniqueStorageOptions).map((opt) => ({ option: opt })),
            required: true,
          },
          { name: 'Release Date', type: 'date', required: false },
        ],
      },
    }),
    payload.create({
      collection: 'categories',
      data: {
        title: 'Camera',
        slug: 'camera',
        specificationTemplates: [
          { name: 'Megapixels', type: 'number', required: true },
          { name: 'Sensor Type', type: 'text', required: false },
        ],
      },
    }),
    payload.create({
      collection: 'categories',
      data: {
        title: 'Headphones',
        slug: 'headphones',
        specificationTemplates: [
          { name: 'Type', type: 'select', options: [{ option: 'In-Ear' }, { option: 'Over-Ear' }], required: true },
          { name: 'Wireless', type: 'select', options: [{ option: 'Yes' }, { option: 'No' }], required: true },
        ],
      },
    }),
    payload.create({
      collection: 'brands',
      data: {
        name: 'Apple',
        slug: 'apple',
        description: 'Apple Inc. official brand.',
        featured: true,
      },
    }),
    payload.create({
      collection: 'brands',
      data: {
        name: 'Samsung',
        slug: 'samsung',
        description: 'Samsung Electronics official brand.',
        featured: true,
      },
    }),
    payload.create({
      collection: 'brands',
      data: {
        name: 'Sony',
        slug: 'sony',
        description: 'Sony Corporation official brand.',
        featured: true,
      },
    }),
    payload.create({
      collection: 'brands',
      data: {
        name: 'Oppo',
        slug: 'oppo',
        description: 'Oppo official brand.',
        featured: true,
      },
    }),
    payload.create({
      collection: 'brands',
      data: {
        name: 'Vivo',
        slug: 'vivo',
        description: 'Vivo official brand.',
        featured: true,
      },
    }),
    payload.create({
      collection: 'brands',
      data: {
        name: 'Realme',
        slug: 'realme',
        description: 'Realme official brand.',
        featured: true,
      },
    }),
    payload.create({
      collection: 'brands',
      data: {
        name: 'Motorola',
        slug: 'motorola',
        description: 'Motorola official brand.',
        featured: true,
      },
    }),
  ])

  payload.logger.info(`— Seeding variant types and options...`)

  const storageType = await payload.create({
    collection: 'variantTypes',
    data: { name: 'storage', label: 'Storage' },
  })
  const colorType = await payload.create({
    collection: 'variantTypes',
    data: { name: 'color', label: 'Color' },
  })
  const kitType = await payload.create({
    collection: 'variantTypes',
    data: { name: 'kit', label: 'Lens Kit' },
  })

  const opt128GB = await payload.create({
    collection: 'variantOptions',
    data: { label: '128GB', value: '128gb', variantType: storageType.id },
  })
  const opt256GB = await payload.create({
    collection: 'variantOptions',
    data: { label: '256GB', value: '256gb', variantType: storageType.id },
  })
  const opt512GB = await payload.create({
    collection: 'variantOptions',
    data: { label: '512GB', value: '512gb', variantType: storageType.id },
  })

  const optBlack = await payload.create({
    collection: 'variantOptions',
    data: { label: 'Black', value: 'black', variantType: colorType.id },
  })
  const optWhite = await payload.create({
    collection: 'variantOptions',
    data: { label: 'White', value: 'white', variantType: colorType.id },
  })
  const optGold = await payload.create({
    collection: 'variantOptions',
    data: { label: 'Gold', value: 'gold', variantType: colorType.id },
  })
  const optSilver = await payload.create({
    collection: 'variantOptions',
    data: { label: 'Silver', value: 'silver', variantType: colorType.id },
  })
  const optBlue = await payload.create({
    collection: 'variantOptions',
    data: { label: 'Blue', value: 'blue', variantType: colorType.id },
  })

  const optBodyOnly = await payload.create({
    collection: 'variantOptions',
    data: { label: 'Body Only', value: 'body-only', variantType: kitType.id },
  })
  const optLensKit2870 = await payload.create({
    collection: 'variantOptions',
    data: { label: '28-70mm Lens Kit', value: '28-70mm', variantType: kitType.id },
  })
  const optLensKit50 = await payload.create({
    collection: 'variantOptions',
    data: { label: '50mm Prime Lens Kit', value: '50mm-prime', variantType: kitType.id },
  })

  payload.logger.info(`— Seeding products...`)

  const productHeadphones = await payload.create({
    collection: 'products',
    depth: 0,
    data: {
      ...productHeadphonesData({
        galleryImage: imageHat,
        metaImage: imageHat,
        variantTypes: [colorType],
        categories: [headphonesCategory],
        relatedProducts: [],
      }),
      brand: sonyBrand.id,
      isMasterTemplate: true,
      parentTemplate: null,
      description: createLexicalDescription('Premium noise-cancelling wireless headphones with custom color options.'),
    },
  })

  const brandToDoc = {
    apple: appleBrand,
    samsung: samsungBrand,
    oppo: oppoBrand,
    vivo: vivoBrand,
    realme: realmeBrand,
    motorola: motorolaBrand,
  }

  payload.logger.info(`— Seeding master template products from dataset...`)
  const masterProducts: any[] = []
  let productSmartphone: any = null

  for (const brandName of targetBrands) {
    const brandDoc = brandToDoc[brandName as keyof typeof brandToDoc]
    const items = selectedProductsByBrand[brandName]
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const ramNum = parseInt(item.ram || '')
      const storage = (item.internal_storage || '').trim().replace(/\s+/g, '')
      const isFirstSmartphone = !productSmartphone && brandName === 'apple'
      
      const slug = `${item.brand}-${item.model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      
      let price = 25000
      if (brandName === 'apple') {
        price = 79900 + (ramNum * 3000)
      } else if (brandName === 'samsung') {
        price = 29900 + (ramNum * 2000)
      } else {
        price = 14900 + (ramNum * 1500)
      }

      const releaseDate = parseReleaseDate(item.release_date)
      const specs: { key: string; value: string; type: 'text' | 'number' | 'select' | 'date' }[] = [
        { key: 'RAM', value: String(ramNum), type: 'number' },
        { key: 'Storage', value: storage, type: 'select' },
      ]
      if (releaseDate) {
        specs.push({ key: 'Release Date', value: releaseDate, type: 'date' })
      }

      const mainImageId = await fetchImageWithFallback(payload, item.image_url, imageTshirtBlack.id)

      const categories = [mobileCategory.id]
      let description: any = null

      if (categories.includes(mobileCategory.id)) {
        const ramStr = item.ram ? `with ${item.ram} RAM` : ''
        const storageStr = item.internal_storage ? `and ${item.internal_storage} internal storage` : ''
        const chipsetStr = item.chipset ? `, powered by the ${item.chipset} processor` : ''
        const batteryStr = item.battery_capacity ? `. Equipped with a ${item.battery_capacity} battery` : ''
        const autoDesc = `${item.model} is a high-performance ${item.device_type || 'smartphone'} ${ramStr} ${storageStr}${chipsetStr}${batteryStr}.`
        description = createLexicalDescription(autoDesc)
      } else {
        description = createLexicalDescription('Standard mobile device.')
      }

      const productData: any = {
        title: item.model,
        slug,
        _status: 'published',
        brand: brandDoc.id,
        categories,
        priceInINREnabled: true,
        priceInINR: price,
        isMasterTemplate: true,
        parentTemplate: null,
        description,
        specifications: specs,
        gallery: [{ image: mainImageId }],
        meta: {
          title: `${item.model} | ZiniKart`,
          description: `The ultimate ${item.model} experience.`,
          image: mainImageId,
        },
      }

      if (isFirstSmartphone) {
        productData.enableVariants = true
        productData.variantTypes = [colorType.id, storageType.id]
        productData.gallery = [
          { image: imageTshirtBlack.id, variantOption: optBlack.id },
          { image: imageTshirtWhite.id, variantOption: optWhite.id },
        ]
      } else {
        productData.enableVariants = false
      }

      const createdProduct = await payload.create({
        collection: 'products',
        depth: 0,
        data: productData,
      })

      masterProducts.push(createdProduct)
      
      if (isFirstSmartphone) {
        productSmartphone = createdProduct
      }
    }
  }

  const productCamera = await payload.create({
    collection: 'products',
    depth: 0,
    data: {
      ...productCameraData({
        galleryImage: imageHat,
        categories: [cameraCategory],
        variantTypes: [kitType],
        relatedProducts: [],
      }),
      brand: sonyBrand.id,
      isMasterTemplate: true,
      parentTemplate: null,
      description: createLexicalDescription('Professional Mirrorless Camera.'),
    },
  })

  let hoodieID: number | string = productSmartphone.id

  if (payload.db.defaultIDType === 'text') {
    hoodieID = `"${hoodieID}"`
  }

  // Seeding 3 variants for each product
  // 1. Smartphone Variants
  const [
    smartphoneVar1,
    smartphoneVar2,
    smartphoneVar3,
  ] = await Promise.all([
    payload.create({
      collection: 'variants',
      depth: 0,
      data: productSmartphoneVariant({
        product: productSmartphone,
        variantOptions: [optBlack, opt128GB],
        inventory: 10,
        priceInINR: 99900,
      }),
    }),
    payload.create({
      collection: 'variants',
      depth: 0,
      data: productSmartphoneVariant({
        product: productSmartphone,
        variantOptions: [optWhite, opt256GB],
        inventory: 15,
        priceInINR: 109900,
      }),
    }),
    payload.create({
      collection: 'variants',
      depth: 0,
      data: productSmartphoneVariant({
        product: productSmartphone,
        variantOptions: [optGold, opt512GB],
        inventory: 5,
        priceInINR: 124900,
      }),
    }),
  ])

  // 2. Headphones Variants
  const [
    headphonesVar1,
    headphonesVar2,
    headphonesVar3,
  ] = await Promise.all([
    payload.create({
      collection: 'variants',
      depth: 0,
      data: productSmartphoneVariant({
        product: productHeadphones,
        variantOptions: [optBlack],
        inventory: 20,
        priceInINR: 14900,
      }),
    }),
    payload.create({
      collection: 'variants',
      depth: 0,
      data: productSmartphoneVariant({
        product: productHeadphones,
        variantOptions: [optSilver],
        inventory: 25,
        priceInINR: 14900,
      }),
    }),
    payload.create({
      collection: 'variants',
      depth: 0,
      data: productSmartphoneVariant({
        product: productHeadphones,
        variantOptions: [optBlue],
        inventory: 15,
        priceInINR: 16900,
      }),
    }),
  ])

  // 3. Camera Variants
  const [
    cameraVar1,
    cameraVar2,
    cameraVar3,
  ] = await Promise.all([
    payload.create({
      collection: 'variants',
      depth: 0,
      data: productSmartphoneVariant({
        product: productCamera,
        variantOptions: [optBodyOnly],
        inventory: 8,
        priceInINR: 119900,
      }),
    }),
    payload.create({
      collection: 'variants',
      depth: 0,
      data: productSmartphoneVariant({
        product: productCamera,
        variantOptions: [optLensKit2870],
        inventory: 12,
        priceInINR: 139900,
      }),
    }),
    payload.create({
      collection: 'variants',
      depth: 0,
      data: productSmartphoneVariant({
        product: productCamera,
        variantOptions: [optLensKit50],
        inventory: 5,
        priceInINR: 149900,
      }),
    }),
  ])

  payload.logger.info(`— Seeding retailer and delivery partner profiles...`)

  const retailerProfile = await payload.create({
    collection: 'retailers',
    data: {
      shopName: 'ZiniTech Shop',
      ownerName: 'Madhav G',
      mobileNumber: '+919999999990',
      emailId: 'retailer@example.com',
      gstNumber: '07AAAAA1111A1Z1',
      images: [imageHat.id],
      shopAddress: {
        street: '123 Retailer Lane',
        city: 'New Delhi',
        state: 'Delhi',
        zipCode: '110001',
      },
      bankDetails: {
        accountHolderName: 'Madhav G',
        accountNumber: '1234567890',
        ifscCode: 'UTIB0000001',
        bankName: 'Axis Bank',
      },
      businessHours: {
        startTime: '09:00',
        endTime: '21:00',
        openEveryday: true,
      },
      approvalStatus: 'approved',
      user: retailerUser.id,
    },
  })

  // Seed retailer cloned products
  payload.logger.info(`— Seeding retailer cloned products...`)
  const clonedCount = 3
  const templatesToClone = masterProducts.filter(p => p.id !== productSmartphone.id).slice(0, clonedCount)
  for (let i = 0; i < templatesToClone.length; i++) {
    const template = templatesToClone[i]
    const brandId = typeof template.brand === 'object' ? template.brand.id : template.brand
    const categoryIds = Array.isArray(template.categories)
      ? template.categories.map((c: any) => typeof c === 'object' ? c.id : c)
      : []

    const cleanSpecs = Array.isArray(template.specifications)
      ? template.specifications.map((s: any) => ({ key: s.key, value: s.value, type: s.type }))
      : []

    const cleanGallery = Array.isArray(template.gallery)
      ? template.gallery.map((g: any) => ({
          image: typeof g.image === 'object' ? g.image.id : g.image,
          variantOption: typeof g.variantOption === 'object' ? g.variantOption?.id : g.variantOption,
        }))
      : []

    const metaImageId = typeof template.meta?.image === 'object'
      ? template.meta.image.id
      : template.meta?.image || imageTshirtBlack.id

    await payload.create({
      collection: 'products',
      data: {
        title: `${template.title} (ZiniTech Shop)`,
        slug: `${template.slug}-cloned-${i}`,
        _status: 'published',
        enableVariants: false,
        categories: categoryIds,
        brand: brandId,
        priceInINREnabled: true,
        priceInINR: Math.round(template.priceInINR * 0.95), // 5% discount
        warranty: '1 Year Retailer Warranty',
        isMasterTemplate: false,
        parentTemplate: template.id,
        retailer: retailerUser.id,
        specifications: cleanSpecs,
        gallery: cleanGallery,
        meta: {
          title: `${template.title} | ZiniTech Shop`,
          description: `Buy ${template.title} at custom prices from ZiniTech Shop.`,
          image: metaImageId,
        },
      },
    })
  }

  const deliveryProfile = await payload.create({
    collection: 'delivery-partners',
    data: {
      fullName: 'Rider Ramesh',
      mobileNumber: '+918888888880',
      email: 'delivery@example.com',
      drivingLicense: imageHat.id,
      vehicleType: 'bike',
      approvalStatus: 'approved',
      onlineStatus: true,
      user: deliveryPartnerUser.id,
    },
  })

  payload.logger.info(`— Seeding contact form...`)

  const contactForm = await payload.create({
    collection: 'forms',
    depth: 0,
    data: contactFormData(),
  })

  payload.logger.info(`— Seeding pages...`)

  const [_, contactPage] = await Promise.all([
    payload.create({
      collection: 'pages',
      depth: 0,
      context: {
        disableRevalidate: true,
      },
      data: homePageData({
        contentImage: imageHero,
        metaImage: imageHat,
      }),
    }),
    payload.create({
      collection: 'pages',
      depth: 0,
      context: {
        disableRevalidate: true,
      },
      data: contactPageData({
        contactForm: contactForm,
      }),
    }),
  ])

  payload.logger.info(`— Seeding addresses...`)

  const customerUSAddress = await payload.create({
    collection: 'addresses',
    depth: 0,
    data: {
      customer: customer.id,
      ...(baseAddressUSData as Address),
    },
  })

  const customerUKAddress = await payload.create({
    collection: 'addresses',
    depth: 0,
    data: {
      customer: customer.id,
      ...(baseAddressUKData as Address),
    },
  })

  payload.logger.info(`— Seeding transactions...`)

  const pendingTransaction = await payload.create({
    collection: 'transactions',
    data: {
      currency: 'INR',
      customer: customer.id,
      paymentMethod: 'stripe',
      stripe: {
        customerID: 'cus_123',
        paymentIntentID: 'pi_123',
      },
      status: 'pending',
      billingAddress: baseAddressUSData,
    },
  })

  const succeededTransaction = await payload.create({
    collection: 'transactions',
    data: {
      currency: 'INR',
      customer: customer.id,
      paymentMethod: 'stripe',
      stripe: {
        customerID: 'cus_123',
        paymentIntentID: 'pi_123',
      },
      status: 'succeeded',
      billingAddress: baseAddressUSData,
    },
  })

  let succeededTransactionID: number | string = succeededTransaction.id

  if (payload.db.defaultIDType === 'text') {
    succeededTransactionID = `"${succeededTransactionID}"`
  }

  payload.logger.info(`— Seeding carts...`)

  // This cart is open as it's created now
  const openCart = await payload.create({
    collection: 'carts',
    data: {
      customer: customer.id,
      currency: 'INR',
      items: [
        {
          product: productSmartphone.id,
          variant: smartphoneVar2.id,
          quantity: 1,
        },
      ],
    },
  })

  const oldTimestamp = new Date('2023-01-01T00:00:00Z').toISOString()

  // Cart is abandoned because it was created long in the past
  const abandonedCart = await payload.create({
    collection: 'carts',
    data: {
      currency: 'INR',
      createdAt: oldTimestamp,
      items: [
        {
          product: productHeadphones.id,
          variant: headphonesVar1.id,
          quantity: 1,
        },
      ],
    },
  })

  // Cart is purchased because it has a purchasedAt date
  const completedCart = await payload.create({
    collection: 'carts',
    data: {
      customer: customer.id,
      currency: 'INR',
      purchasedAt: new Date().toISOString(),
      subtotal: 209800,
      items: [
        {
          product: productSmartphone.id,
          variant: smartphoneVar1.id,
          quantity: 1,
        },
        {
          product: productSmartphone.id,
          variant: smartphoneVar2.id,
          quantity: 1,
        },
      ],
    },
  })

  let completedCartID: number | string = completedCart.id

  if (payload.db.defaultIDType === 'text') {
    completedCartID = `"${completedCartID}"`
  }

  payload.logger.info(`— Seeding orders...`)

  const orderInCompleted = await payload.create({
    collection: 'orders',
    data: {
      amount: 209800,
      currency: 'INR',
      customer: customer.id,
      shippingAddress: baseAddressUSData,
      items: [
        {
          product: productSmartphone.id,
          variant: smartphoneVar1.id,
          quantity: 1,
        },
        {
          product: productSmartphone.id,
          variant: smartphoneVar2.id,
          quantity: 1,
        },
      ],
      status: 'completed',
      transactions: [succeededTransaction.id],
    },
  })

  const orderInProcessing = await payload.create({
    collection: 'orders',
    data: {
      amount: 209800,
      currency: 'INR',
      customer: customer.id,
      shippingAddress: baseAddressUSData,
      items: [
        {
          product: productSmartphone.id,
          variant: smartphoneVar1.id,
          quantity: 1,
        },
        {
          product: productSmartphone.id,
          variant: smartphoneVar2.id,
          quantity: 1,
        },
      ],
      status: 'processing',
      transactions: [succeededTransaction.id],
    },
  })

  payload.logger.info(`— Seeding globals...`)

  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      context: {
        disableRevalidate: true,
      },
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Home',
              url: '/',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Shop',
              url: '/shop',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Account',
              url: '/account',
            },
          },
        ],
      },
    }),
    payload.updateGlobal({
      slug: 'footer',
      context: {
        disableRevalidate: true,
      },
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Admin',
              url: '/admin',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Find my order',
              url: '/find-order',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Source Code',
              newTab: true,
              url: 'https://github.com/payloadcms/payload/tree/3.x/templates/website',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Payload',
              newTab: true,
              url: 'https://payloadcms.com/',
            },
          },
        ],
      },
    }),
  ])

  payload.logger.info('Seeded database successfully!')
}

async function fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()

  return {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split('.').pop()}`,
    size: data.byteLength,
  }
}

async function fetchImageWithFallback(
  payload: Payload,
  url: string | null | undefined,
  fallbackImageId: string | number
): Promise<string | number> {
  if (!url) return fallbackImageId
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const arrayBuffer = await res.arrayBuffer()
    const filename = url.split('/').pop() || `phone-${Date.now()}.webp`
    const file: File = {
      name: filename,
      data: Buffer.from(arrayBuffer),
      mimetype: `image/${filename.split('.').pop() || 'webp'}`,
      size: arrayBuffer.byteLength,
    }
    const mediaDoc = await payload.create({
      collection: 'media',
      data: {
        alt: filename,
      },
      file,
    })
    return mediaDoc.id
  } catch (err) {
    payload.logger.warn(`Failed to fetch image ${url}, falling back.`)
    return fallbackImageId
  }
}

function parseReleaseDate(dateStr: string | null | undefined): string | undefined {
  if (!dateStr) return undefined
  const cleaned = dateStr.replace(/Exp\.|Rumored|Upcoming|Announced/gi, '').trim()
  const parsed = Date.parse(cleaned)
  if (isNaN(parsed)) return undefined
  return new Date(parsed).toISOString().split('T')[0]
}

function createLexicalDescription(text: string): any {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text,
              type: 'text',
              version: 1,
            },
          ],
        },
      ],
    },
  }
}
