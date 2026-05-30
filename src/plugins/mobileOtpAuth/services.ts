import type { CollectionSlug, PayloadRequest } from 'payload'
import { jwtSign } from 'payload'
import { DEFAULT_CUSTOMER_ROLE } from './constants'
import { syntheticEmailForMobile } from './helpers'

export const getUsersCollection = (req: PayloadRequest, usersSlug: string) => {
  const collection = req.payload.collections[usersSlug as CollectionSlug]

  if (!collection) {
    throw new Error(`Users collection "${usersSlug}" was not found.`)
  }

  return collection
}

export const findUserByMobileNumber = async (req: PayloadRequest, usersSlug: string, mobileNumber: string) => {
  const result = await req.payload.find({
    collection: usersSlug as 'users',
    limit: 1,
    overrideAccess: true,
    pagination: false,
    showHiddenFields: true,
    where: {
      mobileNumber: {
        equals: mobileNumber,
      },
    } as any,
  })

  return result.docs[0] || null
}

export const createOtpUser = async (
  req: PayloadRequest,
  usersSlug: string,
  mobileNumber: string,
  name?: string,
  role = DEFAULT_CUSTOMER_ROLE,
) => {
  return req.payload.create({
    collection: usersSlug as 'users',
    data: {
      email: syntheticEmailForMobile(mobileNumber),
      mobileNumber,
      mobileVerified: true,
      password: crypto.randomUUID(),
      roles: [role],
      name,
    } as any,
    overrideAccess: true,
    showHiddenFields: true,
  })
}

export const markUserOtpLogin = async (
  req: PayloadRequest,
  usersSlug: string,
  userID: number | string,
  name?: string,
) => {
  const data: any = {
    lastOtpLoginAt: new Date().toISOString(),
    mobileVerified: true,
  }
  if (name) {
    data.name = name
  }
  return req.payload.update({
    id: userID as any,
    collection: usersSlug as 'users',
    data,
    overrideAccess: true,
    showHiddenFields: true,
  })
}

export const createSessionToken = async ({
  req,
  user,
  usersSlug,
}: {
  req: PayloadRequest
  user: any
  usersSlug: string
}) => {
  const usersCollection = getUsersCollection(req, usersSlug)
  const collectionConfig = usersCollection.config
  const sid = crypto.randomUUID()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + collectionConfig.auth.tokenExpiration * 1000)
  const sessions = [
    ...((user.sessions || []).filter((session: { expiresAt: string }) => {
      return new Date(session.expiresAt) > now
    }) ?? []),
    {
      id: sid,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    },
  ]

  if (collectionConfig.auth.useSessions) {
    await req.payload.db.updateOne({
      id: user.id,
      collection: usersSlug as CollectionSlug,
      data: {
        ...user,
        sessions,
        updatedAt: null,
      },
      req,
      returning: false,
    })
  }

  const { exp, token } = await jwtSign({
    fieldsToSign: {
      collection: usersSlug,
      email: user.email,
      id: user.id,
      ...(collectionConfig.auth.useSessions ? { sid } : {}),
    },
    secret: req.payload.secret,
    tokenExpiration: collectionConfig.auth.tokenExpiration,
  })

  return { exp, token }
}
