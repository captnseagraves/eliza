import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_PHONE_NUMBER

if (!accountSid || !authToken || !fromNumber) {
  throw new Error('Missing Twilio credentials')
}

export const twilioClient = twilio(accountSid, authToken)

export const sendInvitationSMS = async ({
  to,
  eventName,
  personalMessage,
  invitationToken,
}: {
  to: string
  eventName: string
  personalMessage: string
  invitationToken: string
}) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  const message = `🍽️ You're invited to ${eventName}!\n\n${personalMessage}\n\nView invitation and RSVP:\n${baseUrl}/invite/${invitationToken}\n\n- Mister Dinewell`

  try {
    await twilioClient.messages.create({
      body: message,
      to,
      from: fromNumber,
    })
  } catch (error) {
    console.error('Failed to send SMS:', error)
    throw error
  }
}
