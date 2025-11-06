'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { getFileInfo, requestFileDownload } from '@/lib/api'
import { decryptFileFlow } from '@/lib/crypto'
import Header from '@/components/Header'

export default function DownloadPage() {
  const params = useParams()
  const shareLink = params.shareLink as string

  const [fileInfo, setFileInfo] = useState<any>(null)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFileInfo = async () => {
      try {
        const info = await getFileInfo(shareLink)
        setFileInfo(info)
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load file')
      } finally {
        setLoading(false)
      }
    }

    loadFileInfo()
  }, [shareLink])

  const handleDownload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (fileInfo.hasPassword && !password) {
      toast.error('Password required')
      return
    }

    setDownloading(true)
    const toastId = toast.loading('Downloading file...')

    try {
      // Request download from server
      const downloadResponse = await requestFileDownload(shareLink, {
        password: password || undefined,
      })

      toast.loading('Decrypting file...', { id: toastId })

      // Download encrypted file from S3
      const response = await fetch(downloadResponse.presignedUrl)
      const encryptedData = await response.arrayBuffer()

      // Convert to base64
      const encryptedDataBase64 = btoa(
        new Uint8Array(encryptedData)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      )

      // Decrypt the file
      const decryptedData = await decryptFileFlow(
        encryptedDataBase64,
        downloadResponse.encryptedFileKey,
        downloadResponse.salt,
        password || ''
      )

      // Create blob and download
      const blob = new Blob([decryptedData])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = downloadResponse.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('File downloaded successfully!', { id: toastId })
    } catch (err: any) {
      console.error('Download error:', err)
      const message = err.response?.data?.error?.message || 'Failed to download file'
      setError(message)
      toast.error(message, { id: toastId })
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading file...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !fileInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">❌ Error</h2>
            <p className="text-red-300 mb-6">{error}</p>
            <a
              href="/"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded inline-block transition"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />

      <main className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
          <h1 className="text-3xl font-bold text-white mb-6">Download File</h1>

          {/* File Info */}
          <div className="bg-slate-900 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm">File Name</p>
                <p className="text-white font-semibold">{fileInfo.fileName}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">File Size</p>
                <p className="text-white font-semibold">
                  {(fileInfo.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Expires At</p>
                <p className="text-white font-semibold">
                  {new Date(fileInfo.expiresAt).toLocaleString()}
                </p>
              </div>
              {fileInfo.downloadsRemaining !== null && (
                <div>
                  <p className="text-slate-400 text-sm">Downloads Remaining</p>
                  <p className="text-white font-semibold">{fileInfo.downloadsRemaining}</p>
                </div>
              )}
            </div>
          </div>

          {/* Download Form */}
          <form onSubmit={handleDownload}>
            {fileInfo.hasPassword && (
              <div className="mb-6">
                <label className="block text-white font-semibold mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter the password"
                  disabled={downloading}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={downloading || (fileInfo.hasPassword && !password)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 rounded transition"
            >
              {downloading ? 'Downloading...' : 'Download & Decrypt'}
            </button>
          </form>

          {/* Security Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-6">
            <p className="text-blue-300 text-sm">
              🔐 This file is encrypted end-to-end. It will be decrypted in your browser.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
