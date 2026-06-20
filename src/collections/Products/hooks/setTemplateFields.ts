import type { CollectionBeforeChangeHook } from 'payload'

export const setTemplateFields: CollectionBeforeChangeHook = ({ req, operation, data }) => {
  if (operation === 'create' && req.user) {
    const isAdmin = req.user.roles?.includes('admin')
    const isRetailer = req.user.roles?.includes('retailer')

    if (isAdmin) {
      // Admins: Default to a master template unless explicitly set otherwise
      if (data.isMasterTemplate === undefined) {
        data.isMasterTemplate = true
      }
      // Admins don't list under a parent template
      data.parentTemplate = null
    } else if (isRetailer) {
      // Retailers: Forced to false (retailers cannot create master templates)
      data.isMasterTemplate = false

      // If the retailer is cloning a product, data.parentTemplate is passed from the UI
      // If creating a custom product from scratch, enforce parentTemplate to be null
      if (!data.parentTemplate) {
        data.parentTemplate = null
      }
    }
  }

  return data
}
