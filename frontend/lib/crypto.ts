/**
 * Web Crypto API utilities for encryption/decryption
 * Uses AES-256-GCM for file encryption and PBKDF2 for key derivation
 */

// Generate random bytes (salt or IV)
export async function generateRandomBytes(length: number): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(length));
}

// Generate salt for key derivation
export async function generateSalt(): Promise<Uint8Array> {
  return generateRandomBytes(16);
}

// Generate IV for AES encryption
export async function generateIV(): Promise<Uint8Array> {
  return generateRandomBytes(12);
}

// Derive key from password using PBKDF2
export async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number = 600000
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  // Import the password as a key
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive the encryption key
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      // @ts-ignore - Uint8Array is compatible with BufferSource at runtime
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    baseKey,
    256 // 256 bits for AES-256
  );

  return crypto.subtle.importKey(
    'raw',
    derivedBits,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

// Generate a random file encryption key
export async function generateFileKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

// Encrypt file data with AES-256-GCM
export async function encryptFile(
  fileData: ArrayBuffer,
  fileKey: CryptoKey
): Promise<{
  encryptedData: Uint8Array;
  iv: Uint8Array;
}> {
  const iv = await generateIV();

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      // @ts-ignore - Uint8Array is compatible with BufferSource at runtime
      iv: iv,
    },
    fileKey,
    fileData
  );

  return {
    encryptedData: new Uint8Array(encryptedData),
    iv,
  };
}

// Decrypt file data with AES-256-GCM
export async function decryptFile(
  encryptedData: Uint8Array,
  fileKey: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      // @ts-ignore - Uint8Array is compatible with BufferSource at runtime
      iv: iv,
    },
    fileKey,
    encryptedData
  );
}

// Encrypt file key with password-derived key
export async function encryptFileKey(
  fileKey: CryptoKey,
  derivedKey: CryptoKey
): Promise<{
  encryptedKey: Uint8Array;
  iv: Uint8Array;
}> {
  // Export the file key to raw format
  const rawFileKey = await crypto.subtle.exportKey('raw', fileKey);

  const iv = await generateIV();

  const encryptedKey = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      // @ts-ignore - Uint8Array is compatible with BufferSource at runtime
      iv: iv,
    },
    derivedKey,
    rawFileKey
  );

  return {
    encryptedKey: new Uint8Array(encryptedKey),
    iv,
  };
}

// Decrypt file key with password-derived key
export async function decryptFileKey(
  encryptedFileKey: Uint8Array,
  derivedKey: CryptoKey,
  iv: Uint8Array
): Promise<CryptoKey> {
  const decryptedKey = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      // @ts-ignore - Uint8Array is compatible with BufferSource at runtime
      iv: iv,
    },
    derivedKey,
    encryptedFileKey
  );

  return crypto.subtle.importKey(
    'raw',
    decryptedKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

// Hash password with SHA-256
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

// Convert ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Convert ArrayBuffer to Hex string
export function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Uint8Array to Base64
export function uint8ArrayToBase64(arr: Uint8Array): string {
  return bufferToBase64(arr);
}

// Full encryption flow for a file
export async function encryptFileFlow(
  fileData: ArrayBuffer,
  password: string
): Promise<{
  encryptedData: string;
  encryptedFileKey: string;
  salt: string;
  passwordHash: string;
}> {
  // Generate salt
  const salt = await generateSalt();

  // Generate file key
  const fileKey = await generateFileKey();

  // Encrypt the file
  const { encryptedData, iv: fileIV } = await encryptFile(fileData, fileKey);

  // Derive key from password
  const derivedKey = await deriveKey(password, salt);

  // Encrypt the file key with password-derived key
  const { encryptedKey, iv: keyIV } = await encryptFileKey(fileKey, derivedKey);

  // Combine IV + encrypted key for storage
  const combinedEncryptedKey = new Uint8Array(keyIV.length + encryptedKey.length);
  combinedEncryptedKey.set(keyIV);
  combinedEncryptedKey.set(encryptedKey, keyIV.length);

  // Combine IV + encrypted data for storage
  const combinedEncryptedData = new Uint8Array(fileIV.length + encryptedData.length);
  combinedEncryptedData.set(fileIV);
  combinedEncryptedData.set(encryptedData, fileIV.length);

  // Hash password for server verification
  const passwordHash = await hashPassword(password);

  return {
    encryptedData: bufferToBase64(combinedEncryptedData),
    encryptedFileKey: bufferToBase64(combinedEncryptedKey),
    salt: bufferToBase64(salt),
    passwordHash,
  };
}

// Full decryption flow for a file
export async function decryptFileFlow(
  encryptedData: string,
  encryptedFileKey: string,
  salt: string,
  password: string
): Promise<ArrayBuffer> {
  // Convert from Base64
  const encryptedDataBuffer = base64ToBuffer(encryptedData);
  const encryptedKeyBuffer = base64ToBuffer(encryptedFileKey);
  const saltBuffer = base64ToBuffer(salt);

  // Extract IVs and data
  const fileIV = encryptedDataBuffer.slice(0, 12);
  const fileEncryptedData = encryptedDataBuffer.slice(12);

  const keyIV = encryptedKeyBuffer.slice(0, 12);
  const keyEncryptedKey = encryptedKeyBuffer.slice(12);

  // Derive key from password
  const derivedKey = await deriveKey(password, saltBuffer);

  // Decrypt the file key
  const fileKey = await decryptFileKey(keyEncryptedKey, derivedKey, keyIV);

  // Decrypt the file
  return decryptFile(fileEncryptedData, fileKey, fileIV);
}
