import { Group, Member, Balance, Transaction } from '../types';

export class ExpenseCalculator {
  static calculateBalances(group: Group): Balance[] {
    const balances: Record<string, number> = {};
    
    // Initialize balances for all members
    group.members.forEach(member => {
      balances[member.id] = 0;
    });

    // Calculate balances from expenses
    group.expenses.forEach(expense => {
      // Add amount paid by member
      balances[expense.paidBy] += expense.amount;

      // Subtract amount owed by each member
      expense.splitBetween.forEach(split => {
        const amountOwed = split.amount || (expense.amount / expense.splitBetween.length);
        balances[split.memberId] -= amountOwed;
      });
    });

    return group.members.map(member => ({
      memberId: member.id,
      memberName: member.name,
      balance: Math.round(balances[member.id] * 100) / 100,
      currency: group.currency
    }));
  }

  static simplifyDebts(balances: Balance[]): Transaction[] {
    // Create working copies of balances
    const workingBalances = balances.map(b => ({ ...b }));
    const transactions: Transaction[] = [];
    
    // Continue until all balances are settled (within 0.01 tolerance)
    while (true) {
      // Get current creditors and debtors
      const creditors = workingBalances
        .filter(b => b.balance > 0.01)
        .sort((a, b) => b.balance - a.balance);
      
      const debtors = workingBalances
        .filter(b => b.balance < -0.01)
        .sort((a, b) => a.balance - b.balance);
      
      // If no more creditors or debtors, we're done
      if (creditors.length === 0 || debtors.length === 0) {
        break;
      }
      
      // Find the best transaction to minimize future transactions
      const bestTransaction = this.findOptimalTransaction(creditors, debtors, workingBalances);
      
      if (!bestTransaction) {
        break;
      }
      
      transactions.push(bestTransaction);
      
      // Update working balances
      const creditor = workingBalances.find(b => b.memberId === bestTransaction.to);
      const debtor = workingBalances.find(b => b.memberId === bestTransaction.from);
      
      if (creditor && debtor) {
        creditor.balance = Math.round((creditor.balance - bestTransaction.amount) * 100) / 100;
        debtor.balance = Math.round((debtor.balance + bestTransaction.amount) * 100) / 100;
      }
    }
    
    return transactions;
  }
  
  /**
   * Find the optimal transaction that minimizes future transactions
   * Prioritizes transactions that can settle accounts completely
   */
  private static findOptimalTransaction(
    creditors: Balance[],
    debtors: Balance[],
    allBalances: Balance[]
  ): Transaction | null {
    if (creditors.length === 0 || debtors.length === 0) {
      return null;
    }
    
    // Strategy 1: Find transactions that completely settle one or both parties
    for (const creditor of creditors) {
      for (const debtor of debtors) {
        const maxTransfer = Math.min(creditor.balance, Math.abs(debtor.balance));
        
        if (maxTransfer > 0.01) {
          // Check if this transaction settles either party completely
          const settlesCreditor = Math.abs(creditor.balance - maxTransfer) <= 0.01;
          const settlesDebtor = Math.abs(debtor.balance + maxTransfer) <= 0.01;
          
          if (settlesCreditor || settlesDebtor) {
            return {
              from: debtor.memberId,
              to: creditor.memberId,
              amount: Math.round(maxTransfer * 100) / 100,
              fromName: debtor.memberName,
              toName: creditor.memberName
            };
          }
        }
      }
    }
    
    // Strategy 2: Look for indirect debt chains (A owes B, B owes C -> A pays C directly)
    const chainTransaction = this.findDebtChain(creditors, debtors, allBalances);
    if (chainTransaction) {
      return chainTransaction;
    }
    
    // Strategy 3: Default to largest creditor and largest debtor
    const largestCreditor = creditors[0];
    const largestDebtor = debtors[0];
    const amount = Math.min(largestCreditor.balance, Math.abs(largestDebtor.balance));
    
    if (amount > 0.01) {
      return {
        from: largestDebtor.memberId,
        to: largestCreditor.memberId,
        amount: Math.round(amount * 100) / 100,
        fromName: largestDebtor.memberName,
        toName: largestCreditor.memberName
      };
    }
    
    return null;
  }
  
  /**
   * Find debt chains where A owes B and B owes C, so A can pay C directly
   */
  private static findDebtChain(
    creditors: Balance[],
    debtors: Balance[],
    allBalances: Balance[]
  ): Transaction | null {
    // Look for members who are both creditors and debtors (intermediate in chain)
    const intermediates = allBalances.filter(balance => {
      const isCreditor = creditors.some(c => c.memberId === balance.memberId);
      const isDebtor = debtors.some(d => d.memberId === balance.memberId);
      return isCreditor && isDebtor;
    });
    
    for (const intermediate of intermediates) {
      // Find who owes money to this intermediate
      const owesToIntermediate = debtors.filter(d => d.memberId !== intermediate.memberId);
      // Find who this intermediate owes money to
      const intermediateOwesTo = creditors.filter(c => c.memberId !== intermediate.memberId);
      
      for (const debtor of owesToIntermediate) {
        for (const creditor of intermediateOwesTo) {
          // Calculate the amount that can be transferred directly
          const debtToIntermediate = Math.abs(debtor.balance);
          const intermediateDebt = Math.abs(intermediate.balance);
          const creditFromIntermediate = creditor.balance;
          
          const transferAmount = Math.min(debtToIntermediate, intermediateDebt, creditFromIntermediate);
          
          if (transferAmount > 0.01) {
            return {
              from: debtor.memberId,
              to: creditor.memberId,
              amount: Math.round(transferAmount * 100) / 100,
              fromName: debtor.memberName,
              toName: creditor.memberName
            };
          }
        }
      }
    }
    
    return null;
  }
    
  /**
   * Generate human-readable transaction descriptions
   */
  static formatTransactionDescription(transaction: Transaction): string {
    const amount = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(transaction.amount);
    
    return `${transaction.fromName} doit ${amount} à ${transaction.toName}`;
  }

  static getTotalExpenses(group: Group): number {
    return group.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  static getMemberExpenses(group: Group, memberId: string): number {
    return group.expenses
      .filter(expense => expense.paidBy === memberId)
      .reduce((sum, expense) => sum + expense.amount, 0);
  }
  
  /**
   * Get statistics about debt optimization
   */
  static getOptimizationStats(balances: Balance[]): {
    totalTransactions: number;
    totalAmount: number;
    maxTransaction: number;
  } {
    const transactions = this.simplifyDebts(balances);
    
    return {
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
      maxTransaction: transactions.length > 0 ? Math.max(...transactions.map(t => t.amount)) : 0
    };
  }
}