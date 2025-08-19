import { db } from './database';
import type { Employee, TimeEntry, PayrollPeriod, PayrollRecord, PayrollSettings } from './database';

export class PayrollCalculator {
  private settings: PayrollSettings | null = null;

  async getSettings(): Promise<PayrollSettings | null> {
    if (!this.settings) {
      this.settings = await db.payrollSettings.orderBy('updatedAt').last() || null;
    }
    return this.settings;
  }

  async initializeSettings(): Promise<PayrollSettings> {
    const defaultSettings: Omit<PayrollSettings, 'id'> = {
      companyName: 'My POS Company',
      federalTaxRate: 0.12,
      stateTaxRate: 0.06,
      socialSecurityRate: 0.062,
      medicareRate: 0.0145,
      overtimeMultiplier: 1.5,
      payFrequency: 'biweekly',
      updatedAt: new Date()
    };

    const id = await db.payrollSettings.add(defaultSettings);
    const settings = { ...defaultSettings, id };
    this.settings = settings;
    return settings;
  }

  calculateHours(timeEntries: TimeEntry[]): { regularHours: number; overtimeHours: number } {
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
    const regularHours = Math.min(totalHours, 40);
    const overtimeHours = Math.max(0, totalHours - 40);
    
    return { regularHours, overtimeHours };
  }

  async calculatePay(employee: Employee, regularHours: number, overtimeHours: number): Promise<{
    grossPay: number;
    federalTax: number;
    stateTax: number;
    socialSecurityTax: number;
    medicareTax: number;
    netPay: number;
  }> {
    const settings = await this.getSettings();
    if (!settings) {
      throw new Error('Payroll settings not found');
    }

    let regularPay = 0;
    let overtimePay = 0;

    if (employee.payType === 'hourly') {
      regularPay = regularHours * employee.hourlyRate;
      overtimePay = overtimeHours * employee.hourlyRate * settings.overtimeMultiplier;
    } else if (employee.salary) {
      // For salary employees, calculate based on 40 hours per week
      const hourlyEquivalent = employee.salary / 52 / 40;
      regularPay = regularHours * hourlyEquivalent;
      overtimePay = overtimeHours * hourlyEquivalent * settings.overtimeMultiplier;
    }

    const grossPay = regularPay + overtimePay;
    
    // Calculate taxes
    const federalTax = grossPay * settings.federalTaxRate;
    const stateTax = grossPay * settings.stateTaxRate;
    const socialSecurityTax = grossPay * settings.socialSecurityRate;
    const medicareTax = grossPay * settings.medicareRate;
    
    const totalTaxes = federalTax + stateTax + socialSecurityTax + medicareTax;
    const netPay = grossPay - totalTaxes;

    return {
      grossPay,
      federalTax,
      stateTax,
      socialSecurityTax,
      medicareTax,
      netPay
    };
  }

  async processPayroll(startDate: Date, endDate: Date): Promise<PayrollPeriod> {
    const settings = await this.getSettings();
    if (!settings) {
      throw new Error('Payroll settings not found');
    }

    // Calculate pay date based on frequency
    const payDate = new Date(endDate);
    payDate.setDate(payDate.getDate() + 7); // Pay 7 days after period end

    // Create payroll period
    const payrollPeriod: Omit<PayrollPeriod, 'id'> = {
      startDate,
      endDate,
      payDate,
      status: 'draft',
      totalGrossPay: 0,
      totalNetPay: 0,
      totalTaxes: 0,
      totalDeductions: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const payrollPeriodId = await db.payrollPeriods.add(payrollPeriod);

    // Get all active employees
    const employees = await db.employees.where('status').equals('active').toArray();
    
    let totalGrossPay = 0;
    let totalNetPay = 0;
    let totalTaxes = 0;

    for (const employee of employees) {
      // Get time entries for this employee in the pay period
      const timeEntries = await db.timeEntries
        .where('employeeId')
        .equals(employee.id!)
        .and(entry => entry.date >= startDate && entry.date <= endDate)
        .toArray();

      const { regularHours, overtimeHours } = this.calculateHours(timeEntries);
      const payCalculation = await this.calculatePay(employee, regularHours, overtimeHours);

      // Create payroll record
      const payrollRecord: Omit<PayrollRecord, 'id'> = {
        payrollPeriodId,
        employeeId: employee.id!,
        regularHours,
        overtimeHours,
        grossPay: payCalculation.grossPay,
        federalTax: payCalculation.federalTax,
        stateTax: payCalculation.stateTax,
        socialSecurityTax: payCalculation.socialSecurityTax,
        medicareTax: payCalculation.medicareTax,
        otherDeductions: 0,
        netPay: payCalculation.netPay,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.payrollRecords.add(payrollRecord);

      totalGrossPay += payCalculation.grossPay;
      totalNetPay += payCalculation.netPay;
      totalTaxes += payCalculation.federalTax + payCalculation.stateTax + 
                   payCalculation.socialSecurityTax + payCalculation.medicareTax;
    }

    // Update payroll period totals
    await db.payrollPeriods.update(payrollPeriodId, {
      totalGrossPay,
      totalNetPay,
      totalTaxes,
      totalDeductions: 0
    });

    return { ...payrollPeriod, id: payrollPeriodId, totalGrossPay, totalNetPay, totalTaxes };
  }

  async clockIn(employeeId: number): Promise<TimeEntry> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if employee is already clocked in
    const existingEntry = await db.timeEntries
      .where('employeeId')
      .equals(employeeId)
      .and(entry => entry.date >= today && entry.status === 'clocked_in')
      .first();

    if (existingEntry) {
      throw new Error('Employee is already clocked in');
    }

    const timeEntry: Omit<TimeEntry, 'id'> = {
      employeeId,
      date: today,
      clockIn: now,
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      status: 'clocked_in',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const id = await db.timeEntries.add(timeEntry);
    return { ...timeEntry, id };
  }

  async clockOut(employeeId: number): Promise<TimeEntry> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const timeEntry = await db.timeEntries
      .where('employeeId')
      .equals(employeeId)
      .and(entry => entry.date >= today && entry.status === 'clocked_in')
      .first();

    if (!timeEntry) {
      throw new Error('No active time entry found');
    }

    // Calculate total hours
    const totalHours = (now.getTime() - timeEntry.clockIn.getTime()) / (1000 * 60 * 60);
    
    // Subtract break time if applicable
    let adjustedHours = totalHours;
    if (timeEntry.breakStart && timeEntry.breakEnd) {
      const breakHours = (timeEntry.breakEnd.getTime() - timeEntry.breakStart.getTime()) / (1000 * 60 * 60);
      adjustedHours = totalHours - breakHours;
    }

    const regularHours = Math.min(adjustedHours, 8);
    const overtimeHours = Math.max(0, adjustedHours - 8);

    await db.timeEntries.update(timeEntry.id!, {
      clockOut: now,
      totalHours: adjustedHours,
      regularHours,
      overtimeHours,
      status: 'clocked_out'
    });

    return await db.timeEntries.get(timeEntry.id!) as TimeEntry;
  }

  async startBreak(employeeId: number): Promise<TimeEntry> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const timeEntry = await db.timeEntries
      .where('employeeId')
      .equals(employeeId)
      .and(entry => entry.date >= today && entry.status === 'clocked_in')
      .first();

    if (!timeEntry) {
      throw new Error('No active time entry found');
    }

    await db.timeEntries.update(timeEntry.id!, {
      breakStart: now,
      status: 'on_break'
    });

    return await db.timeEntries.get(timeEntry.id!) as TimeEntry;
  }

  async endBreak(employeeId: number): Promise<TimeEntry> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const timeEntry = await db.timeEntries
      .where('employeeId')
      .equals(employeeId)
      .and(entry => entry.date >= today && entry.status === 'on_break')
      .first();

    if (!timeEntry) {
      throw new Error('No active break found');
    }

    await db.timeEntries.update(timeEntry.id!, {
      breakEnd: now,
      status: 'clocked_in'
    });

    return await db.timeEntries.get(timeEntry.id!) as TimeEntry;
  }
}

export const payrollCalculator = new PayrollCalculator();

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatHours = (hours: number): string => {
  return `${hours.toFixed(2)}h`;
};

export const getPayPeriodDates = (frequency: string, date: Date = new Date()): { startDate: Date; endDate: Date } => {
  const currentDate = new Date(date);
  
  switch (frequency) {
    case 'weekly': {
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - currentDate.getDay()); // Start of week (Sunday)
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // End of week (Saturday)
      return { startDate, endDate };
    }
    
    case 'biweekly': {
      // Biweekly starting from a reference date
      const referenceDate = new Date('2024-01-01'); // Monday
      const daysDiff = Math.floor((currentDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
      const weeksSinceRef = Math.floor(daysDiff / 14) * 14;
      
      const startDate = new Date(referenceDate);
      startDate.setDate(referenceDate.getDate() + weeksSinceRef);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 13);
      
      return { startDate, endDate };
    }
    
    case 'monthly': {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      return { startDate, endDate };
    }
    
    case 'semimonthly': {
      const day = currentDate.getDate();
      let startDate: Date, endDate: Date;
      
      if (day <= 15) {
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 15);
      } else {
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 16);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      }
      
      return { startDate, endDate };
    }
    
    default:
      throw new Error('Invalid pay frequency');
  }
};
