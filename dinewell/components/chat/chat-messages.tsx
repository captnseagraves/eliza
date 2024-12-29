import { MessageItem } from "./message-item"

interface Message {
  text: string
  user: string
}

interface ChatMessagesProps {
  messages: Message[]
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <MessageItem
              key={index}
              message={message.text}
              isUser={message.user === "user"}
            />
          ))
        ) : (
          <div className="text-center text-muted-foreground">
            Greetings! I am Mister Dinewell, at your service. How may I assist you with your dinner arrangements?
          </div>
        )}
      </div>
    </div>
  )
}
