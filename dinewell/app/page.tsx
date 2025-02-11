"use client"

import { SignInButton, SignOutButton, SignedIn, SignedOut } from "@clerk/nextjs"
import Link from "next/link"
import { ChatBox, ChatBoxRef } from "@/components/chat/chat-box"
import { useRef } from "react"
import { Twitter } from "lucide-react"
import Image from "next/image"

const CONTRACT_ADDRESS = "0xc4ecaf115cbce3985748c58dccfc4722fef8247c"
const DEX_SCREENER_URL = `https://dexscreener.com/base/${CONTRACT_ADDRESS}`

export default function Home() {
  const chatRef = useRef<ChatBoxRef>(null)

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-yellow-50">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 bg-white border-b z-[100] pointer-events-auto">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <Link href="/" className="text-lg font-medium">
            Dinner.fun
          </Link>
          <a
            href={DEX_SCREENER_URL}
            className="text-sm text-muted-foreground hover:text-rose-600 transition-colors hidden md:block"
            target="_blank"
            rel="noopener noreferrer"
          >
            {CONTRACT_ADDRESS}
          </a>
          <div className="flex items-center gap-4">
            <Link
              href="https://x.com/misterdinewell"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <Twitter className="h-5 w-5" />
            </Link>
            <Link
              href={DEX_SCREENER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <Image
                src="/dexscreener.png"
                alt="Dexscreener"
                width={20}
                height={20}
              />
            </Link>
            <SignedIn>
              <SignOutButton>
                <button className="text-sm text-muted-foreground hover:text-rose-600 transition-colors">
                  Sign out
                </button>
              </SignOutButton>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm text-muted-foreground hover:text-rose-600 transition-colors">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="text-center">
          <div className="mt-8">
            <h1 className="text-6xl font-bold text-gray-900 mb-6">
              Welcome to <span className="text-rose-600">Dinner 🍽️</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Your personal AI dinner host, fostering connections over shared meals.
              Let me, the Spirit of Dinner, guide you in organizing the perfect gatherings.
            </p>
          </div>

          {/* Chat Box */}
          <div className="mt-8 space-y-8">
            <ChatBox
              ref={chatRef}
              eventId="landing"
              initialMessage="How can I help you create meaningful connections today?"
            />
            <div>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "Tell me about Dinner.fun",
                  "How do I host a dinner?",
                  "What is the Spirit of Dinner?",
                  "What is $DINE?",
                  "How does this work?",
                  "Schedule a dinner for me",
                  "What makes Dinner.fun special?",
                  "Who is behind Dinner.fun?"
                ].map((question, index) => (
                  <div
                    key={index}
                    onClick={() => chatRef.current?.sendMessage(question)}
                    className="bg-gray-100 rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
                    role="button"
                  >
                    {question}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-8 rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300">
            <div className="text-rose-600 text-4xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold mb-2">Effortless Planning</h3>
            <p className="text-gray-600">
              Let me handle everything from invitations to RSVPs, while you focus on the joy of connection.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300">
            <div className="text-rose-600 text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-semibold mb-2">Meaningful Connections</h3>
            <p className="text-gray-600">
              Create lasting friendships over carefully curated dining experiences.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300">
            <div className="text-rose-600 text-4xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-2">Smart Coordination</h3>
            <p className="text-gray-600">
              Automated reminders, dietary preferences tracking, and seamless communication.
            </p>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-20 text-center">
          <div className="opacity-100 transition-opacity duration-1000">
            <h2 className="text-2xl font-semibold mb-8">Trusted by food lovers everywhere</h2>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="text-gray-500">🌟 4.9/5 Average Rating</div>
              <div className="text-gray-500">👥 10,000+ Happy Diners</div>
              <div className="text-gray-500">🍽️ 5,000+ Dinners Hosted</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
