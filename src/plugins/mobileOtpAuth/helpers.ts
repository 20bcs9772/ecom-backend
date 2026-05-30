import type { PayloadRequest } from 'payload'
import { headersWithCors } from 'payload'
import { OTP_TEST_MOBILE_NUMBER, OTP_TEST_CODE, OTP_AUTH_EMAIL_DOMAIN } from './constants'
import type { OtpRequestBody, OtpVerifyBody } from './types'

export const normalizeMobileNumber = (value?: string): string => {
  const raw = value?.trim()

  if (!raw) {
    throw new Error('Mobile number is required.')
  }

  const compact = raw.replace(/[\s()-]/g, '')

  if (/^\+[1-9]\d{7,14}$/.test(compact)) {
    return compact
  }

  if (/^\d{10}$/.test(compact)) {
    return `+91${compact}`
  }

  throw new Error('Mobile number must be a valid E.164 number.')
}

export const syntheticEmailForMobile = (mobileNumber: string): string => {
  const normalized = mobileNumber.replace(/^\+/, '').replace(/\D/g, '')
  return `${normalized}@${OTP_AUTH_EMAIL_DOMAIN}`
}

export const getMobileNumberFromBody = (body: OtpRequestBody): string => {
  return normalizeMobileNumber(body.mobileNumber || body.phone)
}

export const getCodeFromBody = (body: OtpVerifyBody): string => {
  const code = (body.code || body.otp || '').trim()

  if (!/^\d{4,8}$/.test(code)) {
    throw new Error('OTP code is required.')
  }

  return code
}

export const isTestOtp = (mobileNumber: string, code?: string): boolean => {
  if (code) {
    return mobileNumber === OTP_TEST_MOBILE_NUMBER && code === OTP_TEST_CODE
  }

  return mobileNumber === OTP_TEST_MOBILE_NUMBER
}

export const sanitizeMobileUser = (user: any) => {
  return {
    id: user.id,
    email: user.email?.endsWith(`@${OTP_AUTH_EMAIL_DOMAIN}`) ? null : user.email,
    mobileNumber: user.mobileNumber,
    mobileVerified: user.mobileVerified,
    name: user.name || null,
    roles: user.roles || [],
  }
}

export const jsonResponse = (req: PayloadRequest, body: unknown, init?: ResponseInit) => {
  return Response.json(body, {
    ...init,
    headers: headersWithCors({
      headers: new Headers(init?.headers),
      req,
    }),
  })
}

export const errorResponse = (req: PayloadRequest, message: string, status = 400) => {
  return jsonResponse(
    req,
    {
      error: message,
      success: false,
    },
    { status },
  )
}
