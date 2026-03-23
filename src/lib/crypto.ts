import type { ProfileData } from '../types'

// Constants for encryption
const ENCRYPTION_ALGORITHM = 'AES-GCM'
const KEY_DERIVATION_ALGORITHM = 'PBKDF2'
const ITERATIONS = 100000
const SALT_LENGTH = 32
const IV_LENGTH = 12

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
}

/**
 * Generate a random IV for encryption
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH))
}

/**
 * Derive encryption key from password and salt
 */
export async function deriveKey(
  password: string,
  salt: ArrayBuffer
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: KEY_DERIVATION_ALGORITHM,
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt profile data with password
 */
export async function encryptProfileData(
  data: ProfileData,
  password: string
): Promise<{ encryptedData: string; salt: string; iv: string }> {
  const salt = generateSalt()
  const iv = generateIV()
  const saltBuffer = new ArrayBuffer(salt.length)
  new Uint8Array(saltBuffer).set(salt)
  const key = await deriveKey(password, saltBuffer)

  const encoder = new TextEncoder()
  const dataString = JSON.stringify(data)
  const dataBuffer = encoder.encode(dataString)

  const ivBuffer = new ArrayBuffer(iv.length)
  new Uint8Array(ivBuffer).set(iv)

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv: ivBuffer,
    },
    key,
    dataBuffer
  )

  return {
    encryptedData: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
    salt: btoa(String.fromCharCode(...new Uint8Array(salt))),
    iv: btoa(String.fromCharCode(...new Uint8Array(iv))),
  }
}

/**
 * Decrypt profile data with password
 */
export async function decryptProfileData(
  encryptedData: string,
  password: string,
  salt: string,
  iv: string
): Promise<ProfileData> {
  try {
    // Validate inputs
    if (!encryptedData || !password || !salt || !iv) {
      throw new Error('Missing required decryption parameters')
    }

    // Decode salt from base64
    let saltBuffer: ArrayBuffer
    try {
      saltBuffer = new ArrayBuffer(atob(salt).length)
      new Uint8Array(saltBuffer).set(
        atob(salt)
          .split('')
          .map(char => char.charCodeAt(0))
      )
    } catch (error) {
      throw new Error('Invalid salt format')
    }

    // Decode iv from base64
    let ivBuffer: ArrayBuffer
    try {
      ivBuffer = new ArrayBuffer(atob(iv).length)
      new Uint8Array(ivBuffer).set(
        atob(iv)
          .split('')
          .map(char => char.charCodeAt(0))
      )
    } catch (error) {
      throw new Error('Invalid iv format')
    }

    // Decode encrypted data from base64
    let encryptedBuffer: ArrayBuffer
    try {
      encryptedBuffer = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      ).buffer
    } catch (error) {
      throw new Error('Invalid encrypted data format')
    }

    // Derive key
    let key: CryptoKey
    try {
      key = await deriveKey(password, saltBuffer)
    } catch (error) {
      throw new Error('Failed to derive key from password')
    }

    // Decrypt data
    let decryptedBuffer: ArrayBuffer
    try {
      decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBuffer
        },
        key,
        encryptedBuffer
      )
    } catch (error) {
      throw new Error('Decryption failed - incorrect password or corrupted data')
    }

    // Decode and parse result
    try {
      const decoder = new TextDecoder()
      const decryptedString = decoder.decode(decryptedBuffer)
      const parsedData = JSON.parse(decryptedString)
      
      // Validate profile data structure
      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error('Invalid profile data structure')
      }
      
      return parsedData as ProfileData
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON in decrypted data')
      }
      throw error
    }
  } catch (error) {
    // Re-throw with more context if it's already a custom error
    if (error instanceof Error && (error.message.includes('Invalid') || 
        error.message.includes('Failed') || error.message.includes('Decryption failed'))) {
      console.error('Profile decryption error:', error.message)
      throw error
    }
    
    // Generic fallback error
    console.error('Unexpected decryption error:', error)
    throw new Error('Failed to decrypt profile data')
  }
}

/**
 * Verify password by attempting to decrypt data
 */
export async function verifyPassword(
  encryptedData: string,
  password: string,
  salt: string,
  iv: string
): Promise<boolean> {
  try {
    await decryptProfileData(encryptedData, password, salt, iv)
    return true
  } catch {
    return false
  }
}

/**
 * Convert Uint8Array to base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  return btoa(String.fromCharCode(...bytes))
}

/**
 * Convert base64 string to Uint8Array
 */
export function base64ToArrayBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}
