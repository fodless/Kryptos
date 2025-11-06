import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface UploadRequest {
  encryptedData: string
  encryptedFileKey: string
  salt: string
  passwordHash?: string
  fileName: string
  fileSize: number
  mimeType: string
  expirationHours: number
  maxDownloads?: number
}

export interface UploadResponse {
  success: boolean
  shareLink: string
  expiresAt: string
  downloadUrl: string
}

export async function uploadFile(data: UploadRequest): Promise<UploadResponse> {
  const response = await api.post('/api/upload', data)
  return response.data
}

export interface FileInfo {
  success: boolean
  fileName: string
  fileSize: number
  mimeType: string
  expiresAt: string
  hasPassword: boolean
  downloadsRemaining: number | null
}

export async function getFileInfo(shareLink: string): Promise<FileInfo> {
  const response = await api.get(`/api/download/${shareLink}/info`)
  return response.data
}

export interface DownloadRequest {
  password?: string
}

export interface DownloadResponse {
  success: boolean
  presignedUrl: string
  encryptedFileKey: string
  salt: string
  fileName: string
}

export async function requestFileDownload(
  shareLink: string,
  data: DownloadRequest
): Promise<DownloadResponse> {
  const response = await api.post(`/api/download/${shareLink}/download`, data)
  return response.data
}

export function getDownloadUrl(presignedUrl: string): string {
  return presignedUrl
}
