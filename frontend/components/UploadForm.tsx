'use client'

import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { encryptFileFlow } from '@/lib/crypto'
import { uploadFile } from '@/lib/api'

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [expiration, setExpiration] = useState('24')
  const [maxDownloads, setMaxDownloads] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.size > 100 * 1024 * 1024) {
      toast.error('File size exceeds 100MB limit')
      return
    }

    setFile(selectedFile)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      handleFileSelect({
        target: { files: e.dataTransfer.files },
      } as any)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!file) {
      toast.error('Please select a file')
      return
    }

    if (!password) {
      toast.error('Please enter a password')
      return
    }

    setLoading(true)
    const toastId = toast.loading('Encrypting file...')

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()

      // Encrypt the file
      setUploadProgress(50)
      const { encryptedData, encryptedFileKey, salt, passwordHash } =
        await encryptFileFlow(arrayBuffer, password)

      setUploadProgress(75)

      // Upload to server
      const response = await uploadFile({
        encryptedData,
        encryptedFileKey,
        salt,
        passwordHash,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        expirationHours: parseInt(expiration),
        maxDownloads: maxDownloads ? parseInt(maxDownloads) : undefined,
      })

      if (response.success) {
        setShareLink(response.shareLink)
        toast.success('File uploaded successfully!', { id: toastId })
        setFile(null)
        setPassword('')
        setUploadProgress(0)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload file', { id: toastId })
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  if (shareLink) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">✓ File Uploaded Successfully!</h2>

          <div className="bg-slate-900 p-4 rounded-lg mb-6">
            <p className="text-slate-400 text-sm mb-2">Share this link:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={`${window.location.origin}/download/${shareLink}`}
                readOnly
                className="flex-1 bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${window.location.origin}/download/${shareLink}`
                  )
                  toast.success('Link copied!')
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <p className="text-yellow-300 text-sm">
              ⚠️ Remember to share the password separately through a secure channel. The recipient will need it to decrypt the file.
            </p>
          </div>

          <button
            onClick={() => {
              setShareLink(null)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition"
          >
            Share Another File
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
      {/* File Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-slate-600 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 transition mb-6"
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={loading}
          className="hidden"
        />
        <div className="text-4xl mb-2">📁</div>
        <p className="text-white font-semibold mb-1">
          {file ? file.name : 'Drag and drop your file here'}
        </p>
        <p className="text-slate-400 text-sm">
          {file
            ? `${(file.size / 1024 / 1024).toFixed(2)}MB`
            : 'or click to select (max 100MB)'}
        </p>
      </div>

      {/* Password Input */}
      <div className="mb-6">
        <label className="block text-white font-semibold mb-2">Encryption Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Choose a strong password"
          disabled={loading}
          className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
        />
        <p className="text-slate-400 text-sm mt-1">
          ⚠️ Share this password separately via secure channel
        </p>
      </div>

      {/* Expiration */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-white font-semibold mb-2">Expiration</label>
          <select
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
            disabled={loading}
            className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
          >
            <option value="1">1 hour</option>
            <option value="24">24 hours</option>
            <option value="168">7 days</option>
            <option value="720">30 days</option>
          </select>
        </div>

        <div>
          <label className="block text-white font-semibold mb-2">Max Downloads (optional)</label>
          <input
            type="number"
            value={maxDownloads}
            onChange={(e) => setMaxDownloads(e.target.value)}
            placeholder="Unlimited"
            disabled={loading}
            min="1"
            className="w-full bg-slate-900 border border-slate-600 rounded px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Progress Bar */}
      {uploadProgress > 0 && (
        <div className="mb-6">
          <div className="h-2 bg-slate-700 rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-slate-400 text-sm mt-2">
            {uploadProgress < 50 ? 'Encrypting...' : 'Uploading...'}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!file || !password || loading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 rounded transition"
      >
        {loading ? 'Uploading...' : 'Encrypt & Upload'}
      </button>
    </form>
  )
}
