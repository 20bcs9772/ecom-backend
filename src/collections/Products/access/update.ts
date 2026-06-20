import type { Access } from 'payload'

export const updateAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.roles?.includes('admin')) return true
  if (user.roles?.includes('retailer')) {
    return { retailer: { equals: user.id } }
  }
  return false
}
