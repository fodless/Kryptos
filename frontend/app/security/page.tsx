'use client'

import Header from '@/components/Header'

export default function Security() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-white">End-to-End Encryption</h1>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">How It Works</h2>
          <p className="text-slate-300 mb-4">
            Kryptos uses end-to-end encryption (E2EE) to ensure your files remain private and secure. Here's how:
          </p>
          <ol className="list-decimal list-inside space-y-3 text-slate-300">
            <li><strong>Client-Side Encryption:</strong> When you upload a file, it is encrypted in your browser using strong cryptographic algorithms before it ever leaves your device.</li>
            <li><strong>Upload:</strong> Only the encrypted file is sent to our servers. We never see the unencrypted content.</li>
            <li><strong>Secure Storage:</strong> Your encrypted file is stored safely on our servers with no way for us to decrypt it.</li>
            <li><strong>Decryption Key:</strong> The decryption key stays with the recipient. When they receive the share link, they can decrypt the file in their browser.</li>
            <li><strong>Optional Password:</strong> Add an extra layer of security with optional password protection that encrypts the file key itself.</li>
          </ol>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">Why It's Reliable</h2>
          <div className="space-y-6">
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <h3 className="text-lg font-semibold mb-2 text-white">Industry-Standard Cryptography</h3>
              <p className="text-slate-300">
                Kryptos uses AES-256-GCM, one of the most secure and widely-trusted encryption algorithms used by governments and major corporations worldwide.
              </p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <h3 className="text-lg font-semibold mb-2 text-white">Zero-Knowledge Architecture</h3>
              <p className="text-slate-300">
                We operate on a zero-knowledge principle: we have no ability to access your files, even if forced to. We don't hold encryption keys, and the encryption happens entirely on your device.
              </p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <h3 className="text-lg font-semibold mb-2 text-white">No Keys Stored</h3>
              <p className="text-slate-300">
                Encryption keys are never sent to or stored on our servers. Each file's key is derived from the share link and optionally a password, making it impossible for us to decrypt files without both pieces of information.
              </p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <h3 className="text-lg font-semibold mb-2 text-white">Verifiable & Auditable</h3>
              <p className="text-slate-300">
                All encryption logic runs in your browser where you can inspect it. The use of established cryptographic libraries means the implementation follows best practices and can be verified by security experts.
              </p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <h3 className="text-lg font-semibold mb-2 text-white">Auto-Expiring Files</h3>
              <p className="text-slate-300">
                Files automatically expire after your chosen time period (1 hour to 30 days). This means even if a share link is compromised, the encrypted file is permanently deleted from our servers.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">Technical Details</h2>
          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 space-y-4 text-slate-300">
            <p>
              <strong>Algorithm:</strong> AES-256-GCM (Advanced Encryption Standard with 256-bit key)
            </p>
            <p>
              <strong>Key Derivation:</strong> PBKDF2 with SHA-256 for password-based keys
            </p>
            <p>
              <strong>Random Generation:</strong> Cryptographically secure random number generation for unique initialization vectors (IVs)
            </p>
            <p>
              <strong>Library:</strong> TweetNaCl.js - A proven, audited cryptographic library used by security professionals
            </p>
            <p>
              <strong>Transport Security:</strong> All communications use HTTPS/TLS encryption
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-blue-400">Your Privacy, Our Commitment</h2>
          <p className="text-slate-300">
            We believe privacy is a fundamental right. By using end-to-end encryption, we ensure that only you and your recipients can ever access your files. Even we cannot. This isn't a feature – it's our core promise to you.
          </p>
        </section>
      </main>
    </div>
  )
}
