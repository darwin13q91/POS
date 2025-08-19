import { db } from '../lib/database';
import type { Sale, LoyaltyProgram, CustomerLoyalty, LoyaltyTransaction, RewardThreshold } from '../lib/database';

export interface LoyaltyReward {
  id: number;
  name: string;
  description: string;
  pointCost: number;
  discountType: 'percentage' | 'fixed' | 'free_item';
  discountValue: number;
  isActive: boolean;
  expirationDays?: number;
}

class CustomerLoyaltyService {
  // Initialize default loyalty program
  async initializeDefaultProgram(): Promise<LoyaltyProgram> {
    try {
      const existingProgram = await db.loyaltyPrograms?.orderBy('id').first();
      if (existingProgram) {
        return existingProgram;
      }

      const defaultProgram: LoyaltyProgram = {
        id: 1,
        name: 'Default Loyalty Program',
        description: 'Earn points for every purchase and redeem for discounts',
        pointsPerDollar: 1, // 1 point per dollar spent
        minimumPurchase: 0,
        rewardThresholds: [
          {
            points: 100,
            reward: '5% Discount',
            discountType: 'percentage',
            discountValue: 5,
            description: 'Get 5% off your next purchase'
          },
          {
            points: 250,
            reward: '$10 Off',
            discountType: 'fixed',
            discountValue: 10,
            description: 'Get $10 off your next purchase'
          },
          {
            points: 500,
            reward: '15% Discount',
            discountType: 'percentage',
            discountValue: 15,
            description: 'Get 15% off your next purchase'
          },
          {
            points: 1000,
            reward: '$25 Off',
            discountType: 'fixed',
            discountValue: 25,
            description: 'Get $25 off your next purchase'
          }
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.loyaltyPrograms?.add(defaultProgram);
      return defaultProgram;
    } catch (error) {
      console.error('Error initializing default loyalty program:', error);
      throw error;
    }
  }

  // Enroll customer in loyalty program
  async enrollCustomer(customerId: number, programId: number = 1): Promise<CustomerLoyalty> {
    try {
      const existing = await db.customerLoyalty?.where({ customerId, programId }).first();
      if (existing) {
        return existing;
      }

      const loyalty: CustomerLoyalty = {
        customerId,
        programId,
        totalPoints: 0,
        pointsUsed: 0,
        pointsAvailable: 0,
        tier: 'Bronze',
        joinDate: new Date(),
        lastActivity: new Date()
      };

      await db.customerLoyalty?.add(loyalty);
      return loyalty;
    } catch (error) {
      console.error('Error enrolling customer in loyalty program:', error);
      throw error;
    }
  }

  // Calculate and award points for a sale
  async awardPoints(customerId: number, sale: Sale): Promise<void> {
    try {
      const program = await db.loyaltyPrograms?.where('isActive').equals(1).first();
      if (!program) return;

      let loyalty = await db.customerLoyalty?.where({ customerId, programId: program.id }).first();
      if (!loyalty) {
        loyalty = await this.enrollCustomer(customerId, program.id);
      }

      // Calculate points based on sale total
      const pointsEarned = Math.floor(sale.total * program.pointsPerDollar);

      if (pointsEarned > 0) {
        // Update customer loyalty
        loyalty.totalPoints += pointsEarned;
        loyalty.pointsAvailable += pointsEarned;
        loyalty.lastActivity = new Date();
        loyalty.tier = this.calculateTier(loyalty.totalPoints);

        await db.customerLoyalty?.update(loyalty.customerId, loyalty);

        // Record transaction
        const transaction: LoyaltyTransaction = {
          id: Date.now(),
          customerId,
          saleId: sale.id,
          type: 'earned',
          points: pointsEarned,
          description: `Earned ${pointsEarned} points from purchase #${sale.id}`,
          createdAt: new Date()
        };

        await db.loyaltyTransactions?.add(transaction);

        console.log(`Awarded ${pointsEarned} points to customer ${customerId}`);
      }
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  }

  // Redeem points for discount
  async redeemPoints(customerId: number, points: number, description: string = 'Points redeemed'): Promise<number> {
    try {
      const loyalty = await db.customerLoyalty?.where('customerId').equals(customerId).first();
      if (!loyalty || loyalty.pointsAvailable < points) {
        throw new Error('Insufficient points available');
      }

      // Update loyalty points
      loyalty.pointsUsed += points;
      loyalty.pointsAvailable -= points;
      loyalty.lastActivity = new Date();

      await db.customerLoyalty?.update(customerId, loyalty);

      // Record transaction
      const transaction: LoyaltyTransaction = {
        id: Date.now(),
        customerId,
        type: 'redeemed',
        points: -points,
        description,
        createdAt: new Date()
      };

      await db.loyaltyTransactions?.add(transaction);

      // Calculate discount amount based on redemption rate
      const discountAmount = this.calculateDiscountFromPoints(points);
      
      return discountAmount;
    } catch (error) {
      console.error('Error redeeming points:', error);
      throw error;
    }
  }

  // Get customer loyalty status
  async getCustomerLoyalty(customerId: number): Promise<CustomerLoyalty | null> {
    try {
      return await db.customerLoyalty?.where('customerId').equals(customerId).first() || null;
    } catch (error) {
      console.error('Error getting customer loyalty:', error);
      return null;
    }
  }

  // Get available rewards for customer
  async getAvailableRewards(customerId: number): Promise<RewardThreshold[]> {
    try {
      const loyalty = await this.getCustomerLoyalty(customerId);
      if (!loyalty) return [];

      const program = await db.loyaltyPrograms?.get(loyalty.programId);
      if (!program) return [];

      return program.rewardThresholds.filter(reward => 
        loyalty.pointsAvailable >= reward.points
      );
    } catch (error) {
      console.error('Error getting available rewards:', error);
      return [];
    }
  }

  // Get loyalty transaction history
  async getLoyaltyHistory(customerId: number, limit: number = 50): Promise<LoyaltyTransaction[]> {
    try {
      const transactions = await db.loyaltyTransactions?.where('customerId').equals(customerId).toArray() || [];
      
      // Sort by creation date (most recent first) and limit
      return transactions
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting loyalty history:', error);
      return [];
    }
  }

  // Get top loyal customers
  async getTopLoyalCustomers(limit: number = 10): Promise<Array<CustomerLoyalty & { customerName: string }>> {
    try {
      const loyaltyRecords = await db.customerLoyalty?.orderBy('totalPoints').reverse().limit(limit).toArray() || [];
      const customers = await db.customers.toArray();

      return loyaltyRecords.map(loyalty => {
        const customer = customers.find(c => c.id === loyalty.customerId);
        return {
          ...loyalty,
          customerName: customer?.name || 'Unknown Customer'
        };
      });
    } catch (error) {
      console.error('Error getting top loyal customers:', error);
      return [];
    }
  }

  // Calculate loyalty analytics
  async getLoyaltyAnalytics(): Promise<{
    totalMembers: number;
    activeMembers: number;
    totalPointsIssued: number;
    totalPointsRedeemed: number;
    averagePointsPerCustomer: number;
    topTier: string;
  }> {
    try {
      const loyaltyRecords = await db.customerLoyalty?.toArray() || [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const totalMembers = loyaltyRecords.length;
      const activeMembers = loyaltyRecords.filter(l => l.lastActivity >= thirtyDaysAgo).length;
      const totalPointsIssued = loyaltyRecords.reduce((sum, l) => sum + l.totalPoints, 0);
      const totalPointsRedeemed = loyaltyRecords.reduce((sum, l) => sum + l.pointsUsed, 0);
      const averagePointsPerCustomer = totalMembers > 0 ? totalPointsIssued / totalMembers : 0;

      // Find most common tier
      const tierCounts = loyaltyRecords.reduce((acc, l) => {
        acc[l.tier] = (acc[l.tier] || 0) + 1;
        return acc;
      }, {} as { [tier: string]: number });

      const topTier = Object.entries(tierCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Bronze';

      return {
        totalMembers,
        activeMembers,
        totalPointsIssued,
        totalPointsRedeemed,
        averagePointsPerCustomer,
        topTier
      };
    } catch (error) {
      console.error('Error getting loyalty analytics:', error);
      return {
        totalMembers: 0,
        activeMembers: 0,
        totalPointsIssued: 0,
        totalPointsRedeemed: 0,
        averagePointsPerCustomer: 0,
        topTier: 'Bronze'
      };
    }
  }

  // Helper methods
  private calculateTier(totalPoints: number): string {
    if (totalPoints >= 2000) return 'Platinum';
    if (totalPoints >= 1000) return 'Gold';
    if (totalPoints >= 500) return 'Silver';
    return 'Bronze';
  }

  private calculateDiscountFromPoints(points: number): number {
    // Convert points to dollars (100 points = $5 discount)
    return Math.floor(points / 20); // 20 points = $1
  }

  // Expire old points (run periodically)
  async expireOldPoints(daysOld: number = 365): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const expiredTransactions = await db.loyaltyTransactions?.where('createdAt').below(cutoffDate).toArray() || [];

      for (const transaction of expiredTransactions) {
        if (transaction.type === 'earned') {
          const loyalty = await db.customerLoyalty?.where('customerId').equals(transaction.customerId).first();
          if (loyalty && loyalty.pointsAvailable >= transaction.points) {
            loyalty.pointsAvailable -= transaction.points;
            await db.customerLoyalty?.update(transaction.customerId, loyalty);

            // Record expiration
            const expiration: LoyaltyTransaction = {
              id: Date.now() + Math.random(),
              customerId: transaction.customerId,
              type: 'expired',
              points: -transaction.points,
              description: `${transaction.points} points expired`,
              createdAt: new Date()
            };

            await db.loyaltyTransactions?.add(expiration);
          }
        }
      }

      console.log(`Expired ${expiredTransactions.length} old point transactions`);
    } catch (error) {
      console.error('Error expiring old points:', error);
    }
  }

  // Apply loyalty discount to sale
  async applyLoyaltyDiscount(customerId: number, saleTotal: number, pointsToRedeem: number): Promise<{
    discountAmount: number;
    newTotal: number;
    pointsRedeemed: number;
  }> {
    try {
      const loyalty = await this.getCustomerLoyalty(customerId);
      if (!loyalty || loyalty.pointsAvailable < pointsToRedeem) {
        throw new Error('Insufficient points or customer not in loyalty program');
      }

      const discountAmount = this.calculateDiscountFromPoints(pointsToRedeem);
      const newTotal = Math.max(0, saleTotal - discountAmount);

      return {
        discountAmount,
        newTotal,
        pointsRedeemed: pointsToRedeem
      };
    } catch (error) {
      console.error('Error applying loyalty discount:', error);
      throw error;
    }
  }
}

export const loyaltyService = new CustomerLoyaltyService();
