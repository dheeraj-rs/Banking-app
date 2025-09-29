// Simple file-based database for WebContainer environment
// In production, replace with MongoDB, PostgreSQL, or Supabase
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const USERS_FILE = join(DATA_DIR, 'users.json');
const ACCOUNTS_FILE = join(DATA_DIR, 'accounts.json');
const TRANSACTIONS_FILE = join(DATA_DIR, 'transactions.json');

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
  balance: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  fromAccountId: string;
  toAccountId?: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'transfer';
  description: string;
  category: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

class Database {
  private ensureDataDir() {
    if (!existsSync(DATA_DIR)) {
      require('fs').mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private readFile<T>(filePath: string): T[] {
    this.ensureDataDir();
    if (!existsSync(filePath)) {
      return [];
    }
    try {
      const data = readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private writeFile<T>(filePath: string, data: T[]): void {
    this.ensureDataDir();
    writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  // User operations
  getUsers(): User[] {
    return this.readFile<User>(USERS_FILE);
  }

  getUserById(id: string): User | undefined {
    return this.getUsers().find(user => user.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.getUsers().find(user => user.email === email);
  }

  createUser(user: User): User {
    const users = this.getUsers();
    users.push(user);
    this.writeFile(USERS_FILE, users);
    return user;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const index = users.findIndex(user => user.id === id);
    if (index === -1) return null;
    
    users[index] = { ...users[index], ...updates };
    this.writeFile(USERS_FILE, users);
    return users[index];
  }

  // Account operations
  getAccounts(): Account[] {
    return this.readFile<Account>(ACCOUNTS_FILE);
  }

  getAccountsByUserId(userId: string): Account[] {
    return this.getAccounts().filter(account => account.userId === userId);
  }

  getAccountById(id: string): Account | undefined {
    return this.getAccounts().find(account => account.id === id);
  }

  createAccount(account: Account): Account {
    const accounts = this.getAccounts();
    accounts.push(account);
    this.writeFile(ACCOUNTS_FILE, accounts);
    return account;
  }

  updateAccount(id: string, updates: Partial<Account>): Account | null {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(account => account.id === id);
    if (index === -1) return null;
    
    accounts[index] = { ...accounts[index], ...updates };
    this.writeFile(ACCOUNTS_FILE, accounts);
    return accounts[index];
  }

  // Transaction operations
  getTransactions(): Transaction[] {
    return this.readFile<Transaction>(TRANSACTIONS_FILE);
  }

  getTransactionsByAccountId(accountId: string): Transaction[] {
    return this.getTransactions().filter(
      transaction => transaction.fromAccountId === accountId || transaction.toAccountId === accountId
    );
  }

  createTransaction(transaction: Transaction): Transaction {
    const transactions = this.getTransactions();
    transactions.push(transaction);
    this.writeFile(TRANSACTIONS_FILE, transactions);
    return transaction;
  }

  updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    const transactions = this.getTransactions();
    const index = transactions.findIndex(transaction => transaction.id === id);
    if (index === -1) return null;
    
    transactions[index] = { ...transactions[index], ...updates };
    this.writeFile(TRANSACTIONS_FILE, transactions);
    return transactions[index];
  }
}

export const db = new Database();