import { Router, Request, Response, NextFunction } from 'express';
import { nanoid } from 'nanoid';
import { query } from '../db/index.js';
import { uploadToS3 } from '../utils/s3.js';
import { validate, uploadSchema } from '../utils/validation.js';
import { createError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const MAX_FILE_SIZE = 104857600; // 100MB

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const validation = validate(uploadSchema, req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
      });
    }

    const {
      encryptedData,
      encryptedFileKey,
      salt,
      passwordHash,
      fileName,
      fileSize,
      mimeType,
      expirationHours,
      maxDownloads,
    } = validation.value;

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return res.status(413).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
      });
    }

    // Convert base64 to buffer
    const encryptedBuffer = Buffer.from(encryptedData, 'base64');

    // Upload to S3
    const s3Key = await uploadToS3(encryptedBuffer, mimeType);

    // Calculate expiration date
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + expirationHours);

    // Generate unique share link
    const shareLink = nanoid(21);

    // Get client IP
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown';

    // Insert into database
    const fileId = uuidv4();
    await query(
      `INSERT INTO files (
        id, file_name, file_size, mime_type, encrypted_file_key,
        s3_key, share_link, password_hash, salt,
        expiration_date, max_downloads, uploader_ip
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        fileId,
        fileName,
        fileSize,
        mimeType,
        encryptedFileKey,
        s3Key,
        shareLink,
        passwordHash || null,
        salt,
        expirationDate,
        maxDownloads || null,
        clientIp,
      ]
    );

    res.status(201).json({
      success: true,
      shareLink,
      expiresAt: expirationDate.toISOString(),
      downloadUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/download/${shareLink}`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
