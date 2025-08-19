import React, { useState, useEffect } from 'react';
import { db } from '../lib/database';
import { PayrollCalculator } from '../lib/payroll';
import type { Employee, PayrollPeriod, PayrollRecord, TimeEntry } from '../lib/database';

export const PayrollView: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [activeTimeEntries, setActiveTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayroll, setProcessingPayroll] = useState(false);

  const payrollCalculator = new PayrollCalculator();

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [employeesData, periodsData, activeEntries] = await Promise.all([
          db.employees.orderBy('lastName').toArray(),
          db.payrollPeriods.orderBy('endDate').reverse().toArray(),
          db.timeEntries.where('status').equals('clocked_in').toArray()
        ]);

        setEmployees(employeesData);
        setPayrollPeriods(periodsData);
        setActiveTimeEntries(activeEntries);

        // Set current period as default
        const currentPeriod = periodsData.find(p => 
          new Date() >= new Date(p.startDate) && new Date() <= new Date(p.endDate)
        );
        if (currentPeriod) {
          setSelectedPeriod(currentPeriod);
          const records = await db.payrollRecords.where('payrollPeriodId').equals(currentPeriod.id!).toArray();
          setPayrollRecords(records);
        }
      } catch (error) {
        console.error('Error loading payroll data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const loadPayrollRecords = async (periodId: string) => {
    const records = await db.payrollRecords.where('payrollPeriodId').equals(parseInt(periodId)).toArray();
    setPayrollRecords(records);
  };

  const handlePeriodChange = (periodId: string) => {
    const period = payrollPeriods.find(p => p.id!.toString() === periodId);
    if (period) {
      setSelectedPeriod(period);
      loadPayrollRecords(periodId);
    }
  };

  const processPayrollForPeriod = async () => {
    if (!selectedPeriod) return;

    setProcessingPayroll(true);
    try {
      await payrollCalculator.processPayroll(selectedPeriod.startDate, selectedPeriod.endDate);
      await loadPayrollRecords(selectedPeriod.id!.toString());
      alert('Payroll processed successfully!');
    } catch (error) {
      console.error('Error processing payroll:', error);
      alert('Error processing payroll. Please try again.');
    } finally {
      setProcessingPayroll(false);
    }
  };

  const handleClockAction = async (employeeId: string, action: 'in' | 'out') => {
    try {
      const empId = parseInt(employeeId);
      if (action === 'in') {
        await payrollCalculator.clockIn(empId);
      } else {
        await payrollCalculator.clockOut(empId);
      }
      // Reload active time entries
      const activeEntries = await db.timeEntries.where('status').equals('clocked_in').toArray();
      setActiveTimeEntries(activeEntries);
    } catch (error) {
      console.error(`Error clocking ${action}:`, error);
      alert(`Error clocking ${action}. Please try again.`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payroll Management</h1>
        <p className="text-gray-600">Manage employee time tracking and payroll processing</p>
      </div>

      {/* Period Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Payroll Period</h2>
          {selectedPeriod && selectedPeriod.status === 'draft' && (
            <button
              onClick={processPayrollForPeriod}
              disabled={processingPayroll}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {processingPayroll ? 'Processing...' : 'Process Payroll'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Period
            </label>
            <select
              value={selectedPeriod?.id || ''}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a period</option>
              {payrollPeriods.map(period => (
                <option key={period.id} value={period.id}>
                  {formatDate(period.startDate)} - {formatDate(period.endDate)}
                  {period.status === 'paid' && ' (Paid)'}
                  {period.status === 'processing' && ' (Processing)'}
                  {period.status === 'closed' && ' (Closed)'}
                </option>
              ))}
            </select>
          </div>

          {selectedPeriod && (
            <>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Period Details</h3>
                <p className="text-sm text-gray-600">
                  {formatDate(selectedPeriod.startDate)} - {formatDate(selectedPeriod.endDate)}
                </p>
                <p className="text-sm font-medium mt-1">
                  Status: {selectedPeriod.status.charAt(0).toUpperCase() + selectedPeriod.status.slice(1)}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Total Payroll</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(
                    payrollRecords.reduce((sum, record) => sum + record.netPay, 0)
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Active Clock-ins */}
      {activeTimeEntries.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Currently Clocked In</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTimeEntries.map(entry => {
              const employee = employees.find(emp => emp.id === entry.employeeId);
              return (
                <div key={entry.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {employee?.firstName} {employee?.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{employee?.position}</p>
                      <p className="text-sm text-green-600 font-medium">
                        Clocked in: {formatTime(entry.clockIn)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleClockAction(entry.employeeId.toString(), 'out')}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Clock Out
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Employee Time Tracking */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Employee Time Tracking</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees
            .filter(emp => emp.status === 'active')
            .map(employee => {
              const isActiveEntry = activeTimeEntries.some(entry => entry.employeeId === employee.id);
              return (
                <div key={employee.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{employee.position}</p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(employee.hourlyRate)}/hr
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${isActiveEntry ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleClockAction(employee.id!.toString(), 'in')}
                      disabled={isActiveEntry}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
                    >
                      Clock In
                    </button>
                    <button
                      onClick={() => handleClockAction(employee.id!.toString(), 'out')}
                      disabled={!isActiveEntry}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
                    >
                      Clock Out
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Payroll Records */}
      {selectedPeriod && payrollRecords.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payroll Records</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Regular Pay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overtime Pay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross Pay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Pay
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrollRecords.map(record => {
                  const employee = employees.find(emp => emp.id === record.employeeId);
                  return (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {employee?.firstName} {employee?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{employee?.position}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(record.regularHours * (employee?.hourlyRate || 0) / record.regularHours || 0).toFixed(2)} + {record.overtimeHours.toFixed(2)} OT
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency((record.regularHours * (employee?.hourlyRate || 0)))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency((record.overtimeHours * (employee?.hourlyRate || 0) * 1.5))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(record.grossPay)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(record.federalTax + record.stateTax + record.socialSecurityTax + record.medicareTax + record.otherDeductions)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                        {formatCurrency(record.netPay)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollView;
