import type { CollectionBeforeChangeHook } from 'payload'

export const setCustomer: CollectionBeforeChangeHook = ({ req, operation, data }) => {
  if (operation === 'create' && req.user && !data.customer) {
    data.customer = req.user.id
  }
  return data
}
