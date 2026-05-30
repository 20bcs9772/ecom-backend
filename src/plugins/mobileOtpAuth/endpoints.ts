import type { Endpoint } from 'payload'
import { generatePayloadCookie } from 'payload'
import type { OtpRequestBody, OtpVerifyBody } from './types'
import {
  getMobileNumberFromBody,
  getCodeFromBody,
  isTestOtp,
  sanitizeMobileUser,
  jsonResponse,
  errorResponse,
} from './helpers'
import { requestTwilioOtp, verifyTwilioOtp } from './twilio'
import {
  findUserByMobileNumber,
  createOtpUser,
  markUserOtpLogin,
  createSessionToken,
  getUsersCollection,
} from './services'

export const requestOtpEndpoint = (usersSlug: string): Endpoint => ({
  method: 'post',
  path: '/mobile/auth/otp/request',
  handler: async (req) => {
    try {
      const body = (await req.json?.()) as OtpRequestBody
      const mobileNumber = getMobileNumberFromBody(body)

      if (!isTestOtp(mobileNumber)) {
        await requestTwilioOtp(mobileNumber)
      }

      return jsonResponse(req, {
        mobileNumber,
        success: true,
        test: isTestOtp(mobileNumber),
      })
    } catch (error) {
      req.payload.logger.error({ err: error }, 'OTP request failed')
      return errorResponse(req, error instanceof Error ? error.message : 'Unable to request OTP.')
    }
  },
  custom: {
    openapi: {
      summary: 'Request mobile OTP',
    },
  },
})

export const verifyOtpEndpoint = (usersSlug: string): Endpoint => ({
  method: 'post',
  path: '/mobile/auth/otp/verify',
  handler: async (req) => {
    try {
      const body = (await req.json?.()) as OtpVerifyBody
      const mobileNumber = getMobileNumberFromBody(body)
      const code = getCodeFromBody(body)
      const name = body.name?.trim()
      const role = body.role || 'customer'

      if (!['customer', 'retailer', 'delivery_partner'].includes(role)) {
        return errorResponse(req, 'Invalid role requested.', 400)
      }

      const approved = isTestOtp(mobileNumber, code) || (await verifyTwilioOtp(mobileNumber, code))

      if (!approved) {
        return errorResponse(req, 'Invalid OTP code.', 401)
      }

      let user = await findUserByMobileNumber(req, usersSlug, mobileNumber)

      if (!user) {
        user = await createOtpUser(req, usersSlug, mobileNumber, name, role)
      } else if (!user.roles?.includes(role)) {
        user = await req.payload.update({
          id: user.id,
          collection: usersSlug as 'users',
          data: {
            roles: [...(user.roles || []), role],
          } as any,
          overrideAccess: true,
          showHiddenFields: true,
        })
      }

      user = await markUserOtpLogin(req, usersSlug, user.id, name)

      let status: 'approved' | 'registration_required' | 'pending_approval' | 'rejected' | 'suspended' = 'approved'

      if (role === 'retailer') {
        const retailerDocs = await req.payload.find({
          collection: 'retailers',
          where: {
            user: { equals: user.id },
          },
          limit: 1,
          overrideAccess: true,
        })
        const retailer = retailerDocs.docs[0]
        if (!retailer) {
          status = 'registration_required'
        } else {
          const appStatus = retailer.approvalStatus as string
          if (appStatus === 'approved') status = 'approved'
          else if (appStatus === 'pending') status = 'pending_approval'
          else if (appStatus === 'rejected') status = 'rejected'
          else if (appStatus === 'suspended') status = 'suspended'
        }
      } else if (role === 'delivery_partner') {
        const deliveryDocs = await req.payload.find({
          collection: 'delivery-partners',
          where: {
            user: { equals: user.id },
          },
          limit: 1,
          overrideAccess: true,
        })
        const partner = deliveryDocs.docs[0]
        if (!partner) {
          status = 'registration_required'
        } else {
          const appStatus = partner.approvalStatus as string
          if (appStatus === 'approved') status = 'approved'
          else if (appStatus === 'pending') status = 'pending_approval'
          else if (appStatus === 'rejected') status = 'rejected'
          else if (appStatus === 'suspended') status = 'suspended'
        }
      }

      let token: string | null = null
      let exp: number | null = null
      const headers = new Headers()

      if (status === 'approved' || status === 'registration_required') {
        const session = await createSessionToken({
          req,
          user,
          usersSlug,
        })
        token = session.token
        exp = session.exp

        const usersCollection = getUsersCollection(req, usersSlug)
        const cookie = generatePayloadCookie({
          collectionAuthConfig: usersCollection.config.auth,
          cookiePrefix: req.payload.config.cookiePrefix,
          token,
        })
        headers.set('Set-Cookie', cookie)
      }

      return jsonResponse(
        req,
        {
          success: true,
          status,
          exp,
          token,
          user: sanitizeMobileUser(user),
        },
        {
          headers,
        },
      )
    } catch (error) {
      req.payload.logger.error({ err: error }, 'OTP verification failed')
      return errorResponse(req, error instanceof Error ? error.message : 'Unable to verify OTP.')
    }
  },
  custom: {
    openapi: {
      summary: 'Verify mobile OTP and login',
    },
  },
})

export const meEndpoint = (): Endpoint => ({
  method: 'get',
  path: '/mobile/auth/me',
  handler: async (req) => {
    if (!req.user) {
      return errorResponse(req, 'Unauthorized.', 401)
    }

    return jsonResponse(req, {
      user: sanitizeMobileUser(req.user),
    })
  },
  custom: {
    openapi: {
      summary: 'Get current mobile user',
    },
  },
})
