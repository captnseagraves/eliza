import { prisma } from "./prisma"
import { Nylas } from "nylas"

export async function getAvailableTimes(userId: string, startDate: Date, endDate: Date) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      nylasAccessToken: true,
      calendarId: true,
    },
  })

  if (!user?.nylasAccessToken || !user?.calendarId) {
    return null
  }

  const nylas = new Nylas({
    apiKey: process.env.NYLAS_CLIENT_ID!,
  })

  // Initialize calendar with user's access token
  const calendar = nylas.with(user.nylasAccessToken).calendar

  try {
    // Get busy times from calendar
    const events = await calendar.events.list({
      calendar_id: user.calendarId,
      starts_after: startDate.toISOString(),
      ends_before: endDate.toISOString(),
    })

    // Convert events to busy times
    const busyTimes = events.map((event: { when: { start_time: string; end_time: string } }) => ({
      start: new Date(event.when.start_time),
      end: new Date(event.when.end_time),
    }))

    return busyTimes
  } catch (error) {
    console.error("Error fetching calendar data:", error)
    return null
  }
}
