import { NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"
import { StreamingTextResponse } from "ai"

export async function POST(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { text } = await req.json()

    // Here we'll integrate with the agent system
    // For now, returning a mock response
    return NextResponse.json([
      {
        text,
        user: "user",
      },
      {
        text: "Splendid! I'd be delighted to assist with your dinner arrangements. Your message has been noted, and I shall craft a most appropriate response. *adjusts monocle thoughtfully*",
        user: "assistant",
      },
    ])
  } catch (error) {
    console.error("[CHAT_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
