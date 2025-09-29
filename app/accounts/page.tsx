'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Plus, 
  Eye, 
  EyeOff,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Account {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  createdAt: string;
}

interface Transaction {
  id: string;
  fromAccountId: string;
  toAccountId?: string;
  amount: number;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  useEffect(() => {
    Promise.all([fetchAccounts(), fetchTransactions()]).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  const createAccount = async (accountType: string) => {
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountType }),
      });

      if (response.ok) {
        toast.success(`${accountType} account created successfully!`);
        fetchAccounts();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to create account');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getAccountTransactions = (accountId: string) => {
    return transactions.filter(
      transaction => 
        transaction.fromAccountId === accountId || 
        transaction.toAccountId === accountId
    );
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="w-4 h-4 text-green-600" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case 'transfer':
        return <ArrowUpRight className="w-4 h-4 text-blue-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600';
      case 'withdrawal':
        return 'text-red-600';
      case 'transfer':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div>
        <Navigation />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Accounts</h1>
              <p className="text-gray-600">Manage your banking accounts and view transaction history</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowBalances(!showBalances)}
              className="flex items-center space-x-2"
            >
              {showBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showBalances ? 'Hide' : 'Show'} Balances</span>
            </Button>
          </div>

          {/* Account Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {accounts.map((account) => {
              const accountTransactions = getAccountTransactions(account.id);
              const lastTransaction = accountTransactions[0];
              
              return (
                <Card 
                  key={account.id} 
                  className="cursor-pointer transition-shadow hover:shadow-lg"
                  onClick={() => setSelectedAccount(selectedAccount?.id === account.id ? null : account)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg capitalize">
                          {account.accountType} Account
                        </CardTitle>
                        <CardDescription>
                          ****{account.accountNumber.slice(-4)}
                        </CardDescription>
                      </div>
                      <div className="p-2 bg-blue-100 rounded-full">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Available Balance</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {showBalances ? formatCurrency(account.balance) : '••••••'}
                        </p>
                      </div>
                      
                      {lastTransaction && (
                        <div className="pt-3 border-t">
                          <p className="text-sm text-gray-600 mb-1">Last Transaction</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getTransactionIcon(lastTransaction.type)}
                              <span className="text-sm font-medium">
                                {lastTransaction.description}
                              </span>
                            </div>
                            <span className={`text-sm font-medium ${getTransactionColor(lastTransaction.type)}`}>
                              {lastTransaction.type === 'deposit' ? '+' : '-'}
                              {formatCurrency(lastTransaction.amount)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(lastTransaction.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Create New Account Card */}
            <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors">
              <CardContent className="flex flex-col items-center justify-center p-6 h-full min-h-[200px]">
                <div className="p-3 bg-blue-100 rounded-full mb-4">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Add New Account</h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Create a new checking or savings account
                </p>
                <div className="space-x-2">
                  <Button 
                    size="sm" 
                    onClick={() => createAccount('checking')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Checking
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => createAccount('savings')}
                  >
                    Savings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Details */}
          {selectedAccount && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span className="capitalize">{selectedAccount.accountType} Account Details</span>
                </CardTitle>
                <CardDescription>
                  Account Number: {selectedAccount.accountNumber} | 
                  Opened: {format(new Date(selectedAccount.createdAt), 'MMMM dd, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Current Balance</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedAccount.balance)}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Total Transactions</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {getAccountTransactions(selectedAccount.id).length}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <ArrowUpRight className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Account Status</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-4">Recent Transactions</h4>
                  <div className="space-y-3">
                    {getAccountTransactions(selectedAccount.id).slice(0, 10).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white rounded-full">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{transaction.description}</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${getTransactionColor(transaction.type)}`}>
                            {transaction.type === 'deposit' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}