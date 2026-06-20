import type { Access } from 'payload'

export const createAccess: Access = ({ req: { user } }) => {
  return Boolean(user?.roles?.includes('admin') || user?.roles?.includes('retailer'))
}
