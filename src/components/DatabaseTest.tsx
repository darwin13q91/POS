import { useState, useEffect } from 'react';
import { db } from '../lib/database';
import type { AppUser, SystemConfig } from '../lib/database';

export default function DatabaseTest() {
  const [status, setStatus] = useState('Checking database...');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [configs, setConfigs] = useState<SystemConfig[]>([]);

  useEffect(() => {
    const testDatabase = async () => {
      try {
        // Test database connection
        await db.open();
        setStatus('Database connected');

        // Test users table
        const userCount = await db.appUsers.count();
        const allUsers = await db.appUsers.toArray();
        setUsers(allUsers);

        // Test system configs
        const configCount = await db.systemConfigs.count();
        const allConfigs = await db.systemConfigs.toArray();
        setConfigs(allConfigs);

        setStatus(`Database OK: ${userCount} users, ${configCount} configs`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setStatus(`Database error: ${errorMessage}`);
        console.error('Database test error:', error);
      }
    };

    testDatabase();
  }, []);

  const reinitializeDatabase = async () => {
    try {
      setStatus('Reinitializing database...');
      await db.clearAllData();
      await db.initializeWithDefaultData();
      
      // Reload data
      const allUsers = await db.appUsers.toArray();
      const allConfigs = await db.systemConfigs.toArray();
      setUsers(allUsers);
      setConfigs(allConfigs);
      
      setStatus(`Database reinitialized: ${allUsers.length} users, ${allConfigs.length} configs`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatus(`Reinitialization error: ${errorMessage}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Database Test</h1>
      
      <div className="mb-4">
        <p className="mb-2"><strong>Status:</strong> {status}</p>
        <button 
          onClick={reinitializeDatabase}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Reinitialize Database
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Users ({users.length})</h2>
          <div className="space-y-2">
            {users.map((user, index) => (
              <div key={index} className="p-2 border rounded">
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>Email:</strong> {user.email}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">System Configs ({configs.length})</h2>
          <div className="space-y-2">
            {configs.map((config, index) => (
              <div key={index} className="p-2 border rounded">
                <p><strong>Key:</strong> {config.key}</p>
                <p><strong>Value:</strong> {config.value}</p>
                <p><strong>Category:</strong> {config.category}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
