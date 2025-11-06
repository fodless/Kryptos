# Kryptos - Secure File Sharing

A zero-knowledge encrypted file sharing platform. Files are encrypted on your device before upload, and the server never sees the unencrypted data or encryption keys.

## What This Does

- **Upload a file** → encrypted client-side → sent to server
- **Server stores** → encrypted blob in S3 + metadata in database  
- **Share a link** → recipient downloads encrypted file → decrypts client-side
- **Auto-expires** → files delete after time limit
- **Password protected** → optional password for downloads

The core idea: **you control the encryption keys, not us**.

## How It Works

### Upload Flow

1. You pick a file in browser
2. Browser generates a random encryption key
3. Browser encrypts file with AES-256-GCM
4. You enter a password
5. Browser derives a key from your password (PBKDF2, 600k iterations = slow & secure)
6. Browser encrypts the encryption key with the password-derived key
7. Browser sends: encrypted file + encrypted key + salt to backend
8. Backend stores encrypted file in S3, metadata + encrypted key in database
9. You get a share link

**What the server never sees**: your password, your file contents, or your encryption key.

### Download Flow

1. Someone visits your share link
2. Browser asks server: "what's the file info?"
3. Server returns: filename, size, expiration, whether password needed
4. They enter password
5. Browser sends password to server for verification
6. Server checks: is it expired? download limit reached? password correct?
7. If good, server generates a temporary S3 URL (5 minute expiration)
8. Browser downloads encrypted file from S3
9. Browser derives the key from password + salt
10. Browser decrypts the file key
11. Browser decrypts the file
12. Browser triggers download

**Everything decrypts in the browser. Server only handles encrypted data.**

## Tech Stack

### Frontend (Vercel)
- **Next.js** - React app with server-side rendering
- **Web Crypto API** - browser's built-in encryption (no external crypto libs)
- **Tailwind CSS** - styling
- **Axios** - API calls

### Backend (Railway)
- **Express.js** - Node.js API server
- **PostgreSQL** - metadata only (file names, timestamps, hashes, etc)
- **AWS S3** - encrypted file storage
- **Rate limiting** - prevents abuse

### Database
Only stores metadata:
- File info (name, size, type)
- Encrypted file key (locked with password)
- Salt (for key derivation)
- Password hash (SHA-256, not plaintext)
- Expiration date
- Download count & limit
- Download history (IP + user agent)

**No actual file contents in database.**

### Storage
S3 stores encrypted files as binary blobs. Even S3 admins can't read them.

## How They Connect

```
Browser (Frontend on Vercel)
    ↓
    │ encrypted file + encrypted key + salt
    ↓
Express API (Backend on Railway)
    ├→ Check database (PostgreSQL)
    │  (validate password, check expiration)
    │
    └→ Upload to S3 or generate S3 download URL
```

**Key point**: The backend is the middleman. It:
- Stores metadata in database
- Uploads/downloads files from S3
- Never has access to unencrypted data

## Setup

### Prerequisites
- Node.js 18+
- AWS account with S3 bucket
- Railway account (or any backend hosting)
- Vercel account (or any frontend hosting)

### Local Development

1. **Clone & install**
```bash
git clone [your-repo]
cd Kryptos
npm install
```

2. **Set up .env**
```bash
cp .env.example .env
# Edit .env with your AWS credentials and local database URL
```

3. **Start PostgreSQL locally**
```bash
docker-compose up -d
```

4. **Run backend**
```bash
npm run dev --workspace=backend
```

5. **Run frontend** (new terminal)
```bash
npm run dev --workspace=frontend
```

Visit `http://localhost:3000`

### Production Deployment

**Frontend to Vercel:**
1. Push to GitHub
2. Connect repo to Vercel
3. Set `NEXT_PUBLIC_API_URL` env var to your backend URL
4. Deploy

**Backend to Railway:**
1. Connect repo to Railway
2. Add PostgreSQL service
3. Set env vars:
   - `DATABASE_URL` (from PostgreSQL service)
   - `AWS_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `S3_BUCKET_NAME`
   - `FRONTEND_URL` (your Vercel domain)
   - `NODE_ENV=production`
4. Deploy

**S3 Bucket CORS Setup:**
Go to AWS S3 console → your bucket → Permissions → CORS and add:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedOrigins": ["http://localhost:3000", "https://*.vercel.app"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## Security

### What It Does
- ✅ Encrypts files before sending to server
- ✅ Uses industry-standard encryption (AES-256-GCM)
- ✅ Strong key derivation (PBKDF2, 600,000 iterations)
- ✅ Unique salts for each file
- ✅ Auto-expires files
- ✅ Download limits
- ✅ Password protection
- ✅ Rate limiting

### What It Doesn't Do
- ❌ Doesn't protect against weak passwords (user's responsibility)
- ❌ Doesn't protect against unsafe password sharing (use separate channel)
- ❌ Doesn't protect against compromised client device
- ❌ Doesn't protect against phishing (user education needed)

## File Structure

```
Kryptos/
├── backend/              # Express API
│   ├── src/
│   │   ├── index.ts      # main server setup
│   │   ├── routes/       # upload & download endpoints
│   │   ├── db/           # database connection & migrations
│   │   ├── utils/        # S3, validation, crypto utilities
│   │   └── middleware/   # error handling, auth
│   └── package.json
│
├── frontend/             # Next.js app
│   ├── app/
│   │   ├── page.tsx      # home/upload page
│   │   ├── download/     # download page with dynamic routes
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── crypto.ts     # Web Crypto API utilities
│   │   └── api.ts        # API client
│   ├── components/       # React components
│   └── package.json
│
├── package.json          # monorepo root
├── docker-compose.yml    # local PostgreSQL
└── README.md
```

## API Endpoints

### POST /api/upload
Upload encrypted file
```json
{
  "encryptedData": "base64_string",
  "encryptedFileKey": "base64_string",
  "salt": "base64_string",
  "passwordHash": "sha256_string",
  "fileName": "document.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf",
  "expirationHours": 24,
  "maxDownloads": 5
}
```

Returns: `{ shareLink, downloadUrl, expiresAt }`

### GET /api/download/:shareLink/info
Get file metadata before download

Returns: `{ fileName, fileSize, mimeType, expiresAt, hasPassword, downloadsRemaining }`

### POST /api/download/:shareLink/download
Request download with password
```json
{
  "password": "user_password"
}
```

Returns: `{ presignedUrl, encryptedFileKey, salt, fileName }`

## Encryption Details

### AES-256-GCM
- 256-bit encryption key
- Authenticated encryption (detects tampering)
- 12-byte random IV per encryption

### PBKDF2
- 600,000 iterations (takes ~0.1 seconds)
- SHA-256 hash function
- 16-byte random salt per file
- Derives 256-bit key from password

### Key Management
1. File key: random, used to encrypt file
2. Password-derived key: derived from password, used to encrypt file key
3. Password hash: one-way, sent to server for verification only

**Result**: Even if database is stolen, encrypted files and keys are useless without the password.

## Common Issues

**CORS errors on download?**
- Make sure S3 CORS is configured (see above)
- Check allowed origins include your frontend domain

**Files not uploading?**
- Check AWS credentials in env vars
- Check S3 bucket exists and is readable
- Check backend logs

**Database connection errors?**
- For local dev: make sure PostgreSQL is running (`docker-compose up`)
- For production: check `DATABASE_URL` env var is correct

## License

MIT - feel free to use this however you want
