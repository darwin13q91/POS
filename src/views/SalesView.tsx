import React from 'react';

const SalesView: React.FC = () => {
  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
        <p className="text-gray-600">View sales analytics and transaction history</p>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
        <p className="text-gray-600">Sales reports coming soon...</p>
      </div>
    </div>
  );
};

export default SalesView;
