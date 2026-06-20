import type { Access } from 'payload'
import { checkRole } from '@/access/utilities'

export const adminOrRetailer: Access = ({ req: { user } }) => {
  if (user) {
    return checkRole(['admin', 'retailer'], user)
  }
  return false
}
