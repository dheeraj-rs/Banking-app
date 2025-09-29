'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/layout/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRightLeft, DollarSign, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface Account {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  createdAt: string;
}

export default function TransferPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: '',
    type: 'transfer',
  });

  useEffect(() => {
    fetchAccounts();
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fromAccountId || !formData.amount || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (formData.type === 'transfer' && !formData.toAccountId) {
      toast.error('Please select a destination account for transfers');
      return;
    }

    if (formData.type === 'transfer' && formData.fromAccountId === formData.toAccountId) {
      toast.error('Source and destination accounts cannot be the same');
      return;
    }

    // Check if source account has sufficient balance
    const sourceAccount = accounts.find(acc => acc.id === formData.fromAccountId);
    if (sourceAccount && (formData.type === 'withdrawal' || formData.type === 'transfer')) {
      if (sourceAccount.balance < parseFloat(formData.amount)) {
        toast.error('Insufficient balance in source account');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          category: 'Transfer',
        }),
      });

      if (response.ok) {
        toast.success(`${formData.type === 'transfer' ? 'Transfer' : formData.type === 'deposit' ? 'Deposit' : 'Withdrawal'} completed successfully!`);
        
        // Reset form
        setFormData({
          fromAccountId: '',
          toAccountId: '',
          amount: '',
          description: '',
          type: 'transfer',
        });

        // Refresh accounts to show updated balances
        fetchAccounts();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Transaction failed');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getAccountLabel = (account: Account) => {
    return `${account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} - ****${account.accountNumber.slice(-4)} (${formatCurrency(account.balance)})`;
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Transfer Money</h1>
            <p className="text-gray-600">Send money between accounts, deposit, or withdraw funds</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Transfer Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ArrowRightLeft className="w-5 h-5" />
                    <span>New Transaction</span>
                  </CardTitle>
                  <CardDescription>
                    Complete the form below to process your transaction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Transaction Type */}
                    <div className="space-y-2">
                      <Label>Transaction Type</Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(value) => handleChange('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transfer">Transfer Between Accounts</SelectItem>
                          <SelectItem value="deposit">Deposit Funds</SelectItem>
                          <SelectItem value="withdrawal">Withdraw Funds</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Source Account */}
                    <div className="space-y-2">
                      <Label>
                        {formData.type === 'deposit' ? 'Destination Account' : 'From Account'}
                      </Label>
                      <Select 
                        value={formData.fromAccountId} 
                        onValueChange={(value) => handleChange('fromAccountId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {getAccountLabel(account)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Destination Account (only for transfers) */}
                    {formData.type === 'transfer' && (
                      <div className="space-y-2">
                        <Label>To Account</Label>
                        <Select 
                          value={formData.toAccountId} 
                          onValueChange={(value) => handleChange('toAccountId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts
                              .filter(account => account.id !== formData.fromAccountId)
                              .map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {getAccountLabel(account)}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Amount */}
                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={formData.amount}
                          onChange={(e) => handleChange('amount', e.target.value)}
                          className="pl-10"
                          step="0.01"
                          min="0.01"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Enter a description for this transaction"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        rows={3}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Processing...' : `Complete ${formData.type === 'transfer' ? 'Transfer' : formData.type === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Account Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Your Accounts</span>
                  </CardTitle>
                  <CardDescription>
                    Current account balances
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {accounts.map((account) => (
                    <div key={account.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="font-medium text-sm capitalize">
                            {account.accountType}
                          </p>
                          <p className="text-xs text-gray-500">
                            ****{account.accountNumber.slice(-4)}
                          </p>
                        </div>
                        <CreditCard className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(account.balance)}
                      </p>
                    </div>
                  ))}

                  <div className="pt-4 border-t text-center">
                    <p className="text-sm text-gray-600">
                      Total Balance
                    </p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(accounts.reduce((sum, account) => sum + account.balance, 0))}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Transfer Limits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Daily limit:</span>
                      <span className="font-medium">$10,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Per transaction:</span>
                      <span className="font-medium">$5,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly limit:</span>
                      <span className="font-medium">$50,000</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}