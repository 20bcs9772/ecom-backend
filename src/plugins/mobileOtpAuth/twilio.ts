export const requestTwilioOtp = async (mobileNumber: string): Promise<void> => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

  if (!accountSid || !authToken || !verifyServiceSid) {
    throw new Error('Twilio Verify is not configured.')
  }

  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`,
    {
      body: new URLSearchParams({
        Channel: 'sms',
        To: mobileNumber,
      }),
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    },
  )

  if (!response.ok) {
    throw new Error('Unable to send OTP.')
  }
}

export const verifyTwilioOtp = async (mobileNumber: string, code: string): Promise<boolean> => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

  if (!accountSid || !authToken || !verifyServiceSid) {
    throw new Error('Twilio Verify is not configured.')
  }

  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`,
    {
      body: new URLSearchParams({
        Code: code,
        To: mobileNumber,
      }),
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    },
  )

  if (!response.ok) {
    return false
  }

  const data = (await response.json()) as { status?: string }
  return data.status === 'approved'
}
