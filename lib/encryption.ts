import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const PREFIX = "enc:gcm:";

function getSecretKey(): Buffer {
  const secret =
    process.env.ENCRYPTION_KEY ||
    process.env.AUTH_SECRET ||
    process.env.DATABASE_URL ||
    "pressforge-secure-credential-salt-2026";
  return crypto.scryptSync(secret, "pressforge-options-salt", 32);
}

/**
 * Encrypts sensitive values (e.g. SMTP passwords) before storing in wp_options.
 * Output format: enc:gcm:<iv_hex>:<tag_hex>:<ciphertext_hex>
 */
export function encryptValue(plainText: string): string {
  if (!plainText) return "";
  // If already encrypted, return as is
  if (plainText.startsWith(PREFIX)) return plainText;

  try {
    const key = getSecretKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plainText, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag().toString("hex");

    return `${PREFIX}${iv.toString("hex")}:${tag}:${encrypted}`;
  } catch (err) {
    console.error("Encryption error:", err);
    return plainText;
  }
}

/**
 * Decrypts sensitive values retrieved from wp_options.
 * Returns the decrypted plain string or the original value if not encrypted.
 */
export function decryptValue(cipherText: string): string {
  if (!cipherText) return "";
  if (!cipherText.startsWith(PREFIX)) {
    // Unencrypted / plaintext legacy fallback
    return cipherText;
  }

  try {
    const key = getSecretKey();
    const payload = cipherText.slice(PREFIX.length);
    const parts = payload.split(":");
    if (parts.length !== 3) return cipherText;

    const [ivHex, tagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Decryption error:", err);
    return cipherText;
  }
}
