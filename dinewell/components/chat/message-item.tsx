interface MessageItemProps {
  message: string
  isUser: boolean
}

export function MessageItem({ message, isUser }: MessageItemProps) {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        {message}
      </div>
    </div>
  )
}
