import type React from "react"
import type { Metadata } from "next"
import { Geist_Mono as GeistMono } from "next/font/google"
import "./globals.css"
import Web3Providers from "@/components/Web3Providers"

const geistMono = GeistMono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Vigilant - Security Protection Dashboard",
  description: "Advanced MEV protection and security monitoring system",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${geistMono.className} bg-black text-white antialiased`}>
        <Web3Providers>
          {children}
        </Web3Providers>
      </body>
    </html>
  )
}
