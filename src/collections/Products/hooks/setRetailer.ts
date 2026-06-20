import type { CollectionBeforeChangeHook } from 'payload'

export const setRetailer: CollectionBeforeChangeHook = ({ req, operation, data }) => {
  if (operation === 'create' && req.user && !data.retailer) {
    data.retailer = req.user.id
  }
  return data
}
