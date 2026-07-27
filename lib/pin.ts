import bcrypt from "bcryptjs";

export function generatePin(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

export function isValidPinFormat(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
