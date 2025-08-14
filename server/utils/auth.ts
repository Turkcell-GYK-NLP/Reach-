import { randomBytes, scrypt as _scrypt, timingSafeEqual, createHmac } from "crypto";
import { promisify } from "util";

const scrypt = promisify(_scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = passwordHash.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const givenHash = Buffer.from(hashHex, "hex");
  return timingSafeEqual(derivedKey, givenHash);
}

export function signToken(payload: Record<string, any>, secret: string, maxAgeSeconds = 3600): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + maxAgeSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const hmac = createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${hmac}`;
}


