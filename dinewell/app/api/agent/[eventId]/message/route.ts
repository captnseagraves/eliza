import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@clerk/nextjs/server"

export async function POST(
  req: NextRequest,
  context: { params: { eventId: string } }
) {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { text, roomId } = await req.json()

    // TODO: Integrate with the agent system
    // For now, returning a mock response in Mr. Dinewell's style
    return NextResponse.json([
      {
        text,
        user: "user",
      },
      {
        text: "Ah, splendid! *adjusts monocle thoughtfully* I shall make note of your message regarding the dinner arrangements. How else may I be of assistance?",
        user: "assistant",
      },
    ])
  } catch (error) {
    console.error("[AGENT_CHAT_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
