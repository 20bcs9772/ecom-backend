import { CollectionBeforeValidateHook } from 'payload'

export const calculateDiscountedPrice: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  if (!data) return data

  const isCreate = !originalDoc

  const basePrice = data.priceInINR !== undefined ? data.priceInINR : (originalDoc?.priceInINR || 0)
  const discountPercent = data.discountPercent !== undefined ? data.discountPercent : (originalDoc?.discountPercent || 0)
  const discountedPrice = data.discountedPrice !== undefined ? data.discountedPrice : (originalDoc?.discountedPrice || 0)

  const basePriceChanged = !isCreate && data.priceInINR !== undefined && data.priceInINR !== originalDoc?.priceInINR
  const percentChanged = isCreate ? (data.discountPercent !== undefined) : (data.discountPercent !== undefined && data.discountPercent !== originalDoc?.discountPercent)
  const priceChanged = isCreate ? (data.discountedPrice !== undefined) : (data.discountedPrice !== undefined && data.discountedPrice !== originalDoc?.discountedPrice)

  if (percentChanged) {
    if (discountPercent > 0) {
      data.discountedPrice = Math.round(basePrice * (1 - discountPercent / 100))
    } else {
      data.discountedPrice = basePrice
    }
  } else if (priceChanged) {
    if (basePrice > 0 && discountedPrice < basePrice) {
      data.discountPercent = Math.round(((basePrice - discountedPrice) / basePrice) * 100)
    } else {
      data.discountPercent = 0
      data.discountedPrice = basePrice
    }
  } else if (basePriceChanged) {
    if (discountPercent > 0) {
      data.discountedPrice = Math.round(basePrice * (1 - discountPercent / 100))
    } else {
      data.discountedPrice = basePrice
    }
  }

  return data
}
