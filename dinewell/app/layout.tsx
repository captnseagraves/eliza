import { Inter } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { Providers } from "@/providers"
import { GoogleMapsProvider } from "@/providers/google-maps-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Dinewell.ai",
  description: "Your personal social organizer",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body className={inter.className}>
          <Providers>
            <GoogleMapsProvider>
              {children}
            </GoogleMapsProvider>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
