import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const accounts = db.getAccountsByUserId(user.id);
    const accountIds = accounts.map(account => account.id);
    
    const allTransactions = db.getTransactions();
    const userTransactions = allTransactions.filter(transaction => 
      accountIds.includes(transaction.fromAccountId) || 
      (transaction.toAccountId && accountIds.includes(transaction.toAccountId))
    );

    return NextResponse.json({ transactions: userTransactions });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fromAccountId, toAccountId, amount, type, description, category } = body;

    if (!fromAccountId || !amount || !type || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify account ownership
    const fromAccount = db.getAccountById(fromAccountId);
    if (!fromAccount || fromAccount.userId !== user.id) {
      return NextResponse.json(
        { error: 'Account not found or unauthorized' },
        { status: 403 }
      );
    }

    // Check sufficient balance for withdrawals and transfers
    if ((type === 'withdrawal' || type === 'transfer') && fromAccount.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    const transaction = {
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      fromAccountId,
      toAccountId: toAccountId || undefined,
      amount: parseFloat(amount),
      type,
      description,
      category: category || 'Other',
      status: 'completed' as const,
      createdAt: new Date().toISOString(),
    };

    // Update account balances
    if (type === 'deposit') {
      db.updateAccount(fromAccountId, { balance: fromAccount.balance + parseFloat(amount) });
    } else if (type === 'withdrawal') {
      db.updateAccount(fromAccountId, { balance: fromAccount.balance - parseFloat(amount) });
    } else if (type === 'transfer' && toAccountId) {
      const toAccount = db.getAccountById(toAccountId);
      if (toAccount) {
        db.updateAccount(fromAccountId, { balance: fromAccount.balance - parseFloat(amount) });
        db.updateAccount(toAccountId, { balance: toAccount.balance + parseFloat(amount) });
      }
    }

    const createdTransaction = db.createTransaction(transaction);
    return NextResponse.json({ transaction: createdTransaction });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}