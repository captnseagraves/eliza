import { SignInButton, SignOutButton, SignedIn, SignedOut } from "@clerk/nextjs"
import Link from "next/link"
import { ChatBox } from "@/components/chat/chat-box"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-yellow-50">
      {/* Navigation */}
      <nav className="absolute top-0 right-0 p-6 flex gap-3">
        <SignedIn>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-full bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors"
          >
            Dashboard
          </Link>
          <SignOutButton>
            <button className="px-6 py-3 rounded-full bg-gray-600 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
              Sign out
            </button>
          </SignOutButton>
        </SignedIn>
        <SignedOut>
          <SignInButton>
            <button className="px-6 py-3 rounded-full bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors">
              Sign in
            </button>
          </SignInButton>
        </SignedOut>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="transform translate-y-[-1rem] opacity-100 transition duration-1000">
            <h1 className="text-6xl font-bold text-gray-900 mb-6">
              Welcome to <span className="text-rose-600">The Spirit of Dinner</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Your personal AI dinner host, fostering connections over shared meals.
              Let me, the Spirit of Dinner, guide you in organizing the perfect gatherings.
            </p>
          </div>

          <div className="flex gap-4 justify-center mb-16">
            <SignedOut>
              <SignInButton>
                <button className="px-8 py-4 rounded-full bg-rose-600 text-white text-lg font-semibold hover:bg-rose-700 transition-colors">
                  Start Your Gathering
                </button>
              </SignInButton>
            </SignedOut>
          </div>

          {/* Chat Box */}
          <div className="mt-8">
            <ChatBox
              eventId="landing"
              initialMessage="Welcome to the Spirit of Dinner! How can I help you create meaningful connections today?"
            />
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
