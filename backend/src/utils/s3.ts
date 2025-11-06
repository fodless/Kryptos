import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'kryptos-file-storage';

export async function uploadToS3(
  encryptedData: Buffer,
  mimeType: string
): Promise<string> {
  const s3Key = `files/${uuidv4()}`;

  const params = {
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: encryptedData,
    ContentType: mimeType,
    ServerSideEncryption: 'AES256',
  };

  try {
    await s3.upload(params).promise();
    return s3Key;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
}

export async function generatePresignedUrl(
  s3Key: string,
  expiresIn: number = 300 // 5 minutes
): Promise<string> {
  const params = {
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Expires: expiresIn,
  };

  try {
    const url = await s3.getSignedUrlPromise('getObject', params);
    return url;
  } catch (error) {
    console.error('Presigned URL generation error:', error);
    throw new Error('Failed to generate download URL');
  }
}

export async function deleteFromS3(s3Key: string): Promise<void> {
  const params = {
    Bucket: BUCKET_NAME,
    Key: s3Key,
  };

  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete file from S3');
  }
}

export async function checkS3Connection(): Promise<boolean> {
  try {
    await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
    return true;
  } catch (error) {
    console.error('S3 connection error:', error);
    return false;
  }
}
