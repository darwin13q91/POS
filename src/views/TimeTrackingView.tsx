import React, { useState, useEffect } from 'react';
import { db } from '../lib/database';
import { PayrollCalculator } from '../lib/payroll';
import type { Employee, TimeEntry } from '../lib/database';

export const TimeTrackingView: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeEntries, setActiveEntries] = useState<TimeEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const payrollCalculator = new PayrollCalculator();

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Load employees
        const employeeList = await db.employees.where('status').equals('active').toArray();
        setEmployees(employeeList);

        // Load active entries
        const activeEntriesList = await db.timeEntries.where('status').equals('clocked_in').toArray();
        setActiveEntries(activeEntriesList);

        // Load time entries for selected date/employee
        let entriesQuery = db.timeEntries.orderBy('date').reverse();
        
        if (selectedDate) {
          const startDate = new Date(selectedDate);
          const endDate = new Date(selectedDate);
          endDate.setDate(endDate.getDate() + 1);
          
          entriesQuery = entriesQuery.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startDate && entryDate < endDate;
          });
        }

        let entries = await entriesQuery.toArray();

        if (selectedEmployee) {
          const empId = parseInt(selectedEmployee);
          entries = entries.filter(entry => entry.employeeId === empId);
        }

        setTimeEntries(entries);
      } catch (error) {
        console.error('Error loading time tracking data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [selectedDate, selectedEmployee]);

  const refreshData = async () => {
    try {
      // Load employees
      const employeeList = await db.employees.where('status').equals('active').toArray();
      setEmployees(employeeList);

      // Load active entries
      const activeEntriesList = await db.timeEntries.where('status').equals('clocked_in').toArray();
      setActiveEntries(activeEntriesList);

      // Load time entries for selected date/employee
      let entriesQuery = db.timeEntries.orderBy('date').reverse();
      
      if (selectedDate) {
        const startDate = new Date(selectedDate);
        const endDate = new Date(selectedDate);
        endDate.setDate(endDate.getDate() + 1);
        
        entriesQuery = entriesQuery.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= startDate && entryDate < endDate;
        });
      }

      let entries = await entriesQuery.toArray();

      if (selectedEmployee) {
        const empId = parseInt(selectedEmployee);
        entries = entries.filter(entry => entry.employeeId === empId);
      }

      setTimeEntries(entries);
    } catch (error) {
      console.error('Error loading time tracking data:', error);
    }
  };

  const handleClockAction = async (employeeId: number, action: 'in' | 'out') => {
    try {
      if (action === 'in') {
        await payrollCalculator.clockIn(employeeId);
        alert('Employee clocked in successfully!');
      } else {
        await payrollCalculator.clockOut(employeeId);
        alert('Employee clocked out successfully!');
      }
      await refreshData();
    } catch (error) {
      console.error(`Error clocking ${action}:`, error);
      alert(`Error: ${error}`);
    }
  };

  const handleBreakAction = async (employeeId: number, action: 'start' | 'end') => {
    try {
      if (action === 'start') {
        await payrollCalculator.startBreak(employeeId);
        alert('Break started!');
      } else {
        await payrollCalculator.endBreak(employeeId);
        alert('Break ended!');
      }
      await refreshData();
    } catch (error) {
      console.error(`Error ${action === 'start' ? 'starting' : 'ending'} break:`, error);
      alert(`Error: ${error}`);
    }
  };

  const deleteTimeEntry = async (entryId: number) => {
    if (window.confirm('Are you sure you want to delete this time entry?')) {
      try {
        await db.timeEntries.delete(entryId);
        await refreshData();
        alert('Time entry deleted successfully!');
      } catch (error) {
        console.error('Error deleting time entry:', error);
        alert('Error deleting time entry. Please try again.');
      }
    }
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString();
  };

  const formatDuration = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee';
  };

  const getEmployeePosition = (employeeId: number) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.position : '';
  };

  const isEmployeeClockedIn = (employeeId: number) => {
    return activeEntries.some(entry => entry.employeeId === employeeId);
  };

  const isEmployeeOnBreak = (employeeId: number) => {
    return activeEntries.some(entry => entry.employeeId === employeeId && entry.status === 'on_break');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clocked_in':
        return 'bg-green-100 text-green-800';
      case 'on_break':
        return 'bg-yellow-100 text-yellow-800';
      case 'clocked_out':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Time Tracking</h1>
        <p className="text-gray-600">Manage employee clock-ins, breaks, and time entries</p>
      </div>

      {/* Quick Clock Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Clock Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(employee => {
            const isClockedIn = isEmployeeClockedIn(employee.id!);
            const isOnBreak = isEmployeeOnBreak(employee.id!);
            
            return (
              <div key={employee.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{employee.position}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                      isClockedIn 
                        ? isOnBreak 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isOnBreak ? 'On Break' : isClockedIn ? 'Clocked In' : 'Clocked Out'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {!isClockedIn ? (
                    <button
                      onClick={() => handleClockAction(employee.id!, 'in')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
                    >
                      Clock In
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleClockAction(employee.id!, 'out')}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
                      >
                        Clock Out
                      </button>
                      {!isOnBreak ? (
                        <button
                          onClick={() => handleBreakAction(employee.id!, 'start')}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm"
                        >
                          Start Break
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBreakAction(employee.id!, 'end')}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
                        >
                          End Break
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Time Entry Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Employees</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedDate(new Date().toISOString().split('T')[0]);
                setSelectedEmployee('');
              }}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Time Entries Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Time Entries</h2>
          {selectedDate && (
            <p className="text-sm text-gray-600 mt-1">
              Showing entries for {formatDate(selectedDate)}
              {selectedEmployee && ` for ${getEmployeeName(parseInt(selectedEmployee))}`}
            </p>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clock In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clock Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Break Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeEntries.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getEmployeeName(entry.employeeId)}
                    </div>
                    <div className="text-sm text-gray-500">{getEmployeePosition(entry.employeeId)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(entry.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(entry.clockIn)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.clockOut ? formatTime(entry.clockOut) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.breakStart && entry.breakEnd 
                      ? formatDuration((new Date(entry.breakEnd).getTime() - new Date(entry.breakStart).getTime()) / (1000 * 60 * 60))
                      : entry.breakStart ? 'In progress' : '-'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.totalHours > 0 ? formatDuration(entry.totalHours) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                      {entry.status.replace('_', ' ').split(' ').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => deleteTimeEntry(entry.id!)}
                      className="text-red-600 hover:text-red-900"
                      disabled={entry.status === 'clocked_in'}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              
              {timeEntries.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No time entries found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      {timeEntries.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Total Entries</h3>
              <p className="text-2xl font-bold text-blue-600">{timeEntries.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Total Hours</h3>
              <p className="text-2xl font-bold text-green-600">
                {formatDuration(timeEntries.reduce((sum, entry) => sum + entry.totalHours, 0))}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Regular Hours</h3>
              <p className="text-2xl font-bold text-orange-600">
                {formatDuration(timeEntries.reduce((sum, entry) => sum + entry.regularHours, 0))}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Overtime Hours</h3>
              <p className="text-2xl font-bold text-purple-600">
                {formatDuration(timeEntries.reduce((sum, entry) => sum + entry.overtimeHours, 0))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTrackingView;
