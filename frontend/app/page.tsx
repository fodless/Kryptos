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
      </main>
    </div>
  )
}
