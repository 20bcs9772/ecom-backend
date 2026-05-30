export type MobileOtpAuthPluginOptions = {
  enabled?: boolean
  usersSlug?: string
}

export type OtpRequestBody = {
  mobileNumber?: string
  phone?: string
}

export type OtpVerifyBody = OtpRequestBody & {
  code?: string
  otp?: string
  name?: string
  role?: 'customer' | 'retailer' | 'delivery_partner'
}
