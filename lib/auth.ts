import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, User } from './database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.getUserById(decoded.id);
    if (!user) return null;
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  } catch {
    return null;
  }
}

export async function registerUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}): Promise<AuthUser> {
  const existingUser = db.getUserByEmail(userData.email);
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await hashPassword(userData.password);
  const user: User = {
    id: Math.random().toString(36).substring(2) + Date.now().toString(36),
    email: userData.email,
    password: hashedPassword,
    firstName: userData.firstName,
    lastName: userData.lastName,
    phone: userData.phone,
    address: userData.address,
    createdAt: new Date().toISOString(),
  };

  const createdUser = db.createUser(user);

  // Create default checking account
  const account = {
    id: Math.random().toString(36).substring(2) + Date.now().toString(36),
    userId: createdUser.id,
    accountNumber: generateAccountNumber(),
    accountType: 'checking' as const,
    balance: 1000, // Starting balance
    createdAt: new Date().toISOString(),
  };

  db.createAccount(account);

  return {
    id: createdUser.id,
    email: createdUser.email,
    firstName: createdUser.firstName,
    lastName: createdUser.lastName,
  };
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const user = db.getUserByEmail(email);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

function generateAccountNumber(): string {
  return Math.random().toString().substring(2, 12).padStart(10, '0');
}