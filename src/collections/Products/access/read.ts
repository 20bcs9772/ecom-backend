import type { Access, Where } from 'payload'

export const readAccess: Access = ({ req: { user } }) => {
  if (!user || (!user.roles?.includes('admin') && !user.roles?.includes('retailer'))) {
    return {
      and: [
        { _status: { equals: 'published' } } as Where,
        {
          or: [
            { isMasterTemplate: { equals: false } } as Where,
            { isMasterTemplate: { exists: false } } as Where,
          ],
        } as Where,
      ],
    } as Where
  }
  if (user.roles?.includes('admin')) return true
  if (user.roles?.includes('retailer')) {
    return {
      or: [
        { _status: { equals: 'published' } } as Where,
        { retailer: { equals: user.id } } as Where,
      ],
    } as Where
  }
  return {
    and: [
      { _status: { equals: 'published' } } as Where,
      {
        or: [
          { isMasterTemplate: { equals: false } } as Where,
          { isMasterTemplate: { exists: false } } as Where,
        ],
      } as Where,
    ],
  } as Where
}
