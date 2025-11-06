'use client'

import { useState, useRef } from 'react'
import UploadForm from '@/components/UploadForm'
import Header from '@/components/Header'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 text-white">
            Secure File Sharing
          </h1>
          <p className="text-xl text-slate-300 mb-2">
            End-to-end encrypted file sharing with zero-knowledge architecture
          </p>
          <p className="text-slate-400">
            Your files are encrypted on your device. We can't read them even if we wanted to.
          </p>
        </section>

        {/* Upload Form */}
        <UploadForm />

        {/* Features */}
        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold mb-2 text-white">🔐 End-to-End Encrypted</h3>
            <p className="text-slate-300">
              Files are encrypted in your browser before uploading. Only the recipient can decrypt them.
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold mb-2 text-white">⏱️ Auto-Expiring Links</h3>
            <p className="text-slate-300">
              Set expiration times (1h, 24h, 7d, 30d) to automatically delete files after sharing.
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold mb-2 text-white">🛡️ Password Protected</h3>
            <p className="text-slate-300">
              Optional password protection adds an extra layer of security to your shared files.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
