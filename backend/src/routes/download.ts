import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../db/index.js';
import { generatePresignedUrl } from '../utils/s3.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const router = Router();

// GET /api/download/:shareLink/info
router.get('/:shareLink/info', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shareLink } = req.params;

    const result = await query(
      `SELECT id, file_name, file_size, mime_type, expiration_date,
              password_hash, max_downloads, download_count, is_active
       FROM files WHERE share_link = $1`,
      [shareLink]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found',
        },
      });
    }

    const file = result.rows[0];

    // Check if expired
    if (new Date(file.expiration_date) < new Date() || !file.is_active) {
      return res.status(410).json({
        success: false,
        error: {
          code: 'FILE_EXPIRED',
          message: 'This file has expired and is no longer available',
        },
      });
    }

    // Check download limit
    if (file.max_downloads && file.download_count >= file.max_downloads) {
      return res.status(410).json({
        success: false,
        error: {
          code: 'DOWNLOAD_LIMIT_REACHED',
          message: 'Download limit reached for this file',
        },
      });
    }

    res.json({
      success: true,
      fileName: file.file_name,
      fileSize: file.file_size,
      mimeType: file.mime_type,
      expiresAt: file.expiration_date,
      hasPassword: !!file.password_hash,
      downloadsRemaining: file.max_downloads ? file.max_downloads - file.download_count : null,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/download/:shareLink/download
router.post('/:shareLink/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shareLink } = req.params;
    const { password } = req.body;

    const result = await query(
      `SELECT id, file_name, encrypted_file_key, salt, password_hash,
              s3_key, expiration_date, max_downloads, download_count, is_active
       FROM files WHERE share_link = $1`,
      [shareLink]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found',
        },
      });
    }

    const file = result.rows[0];

    // Check if expired
    if (new Date(file.expiration_date) < new Date() || !file.is_active) {
      return res.status(410).json({
        success: false,
        error: {
          code: 'FILE_EXPIRED',
          message: 'This file has expired and is no longer available',
        },
      });
    }

    // Check download limit
    if (file.max_downloads && file.download_count >= file.max_downloads) {
      return res.status(410).json({
        success: false,
        error: {
          code: 'DOWNLOAD_LIMIT_REACHED',
          message: 'Download limit reached for this file',
        },
      });
    }

    // Verify password if required
    if (file.password_hash) {
      if (!password) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'PASSWORD_REQUIRED',
            message: 'Password required for this file',
          },
        });
      }

      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      if (passwordHash !== file.password_hash) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Incorrect password',
          },
        });
      }
    }

    // Increment download count and log download
    const downloadId = uuidv4();
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    await query(
      `UPDATE files SET download_count = download_count + 1, last_accessed = NOW()
       WHERE id = $1`,
      [file.id]
    );

    await query(
      `INSERT INTO downloads (id, file_id, downloader_ip, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [downloadId, file.id, clientIp, userAgent]
    );

    // Generate presigned URL
    const presignedUrl = await generatePresignedUrl(file.s3_key, 300); // 5 minutes

    res.json({
      success: true,
      presignedUrl,
      encryptedFileKey: file.encrypted_file_key,
      salt: file.salt,
      fileName: file.file_name,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
