import bcrypt from "bcryptjs"
import * as jose from "jose"

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_development_only"
if (!JWT_SECRET) {
  console.warn("JWT_SECRET is not set. Using fallback secret for development only.")
}

// Text encoder for the secret key
const textEncoder = new TextEncoder()
const secretKey = textEncoder.encode(JWT_SECRET)

// Function to hash a password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Function to verify a password against a hash
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Function to generate a JWT token
export async function generateToken(userId: number): Promise<string> {
  return new jose.SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secretKey)
}

// Function to verify a JWT token
export async function verifyToken(token: string): Promise<{ userId: number } | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secretKey)
    return payload as { userId: number }
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}
