import { useState, useEffect } from 'react';
import { getDataManager, type DataEvent } from '../dynamic-data';

export function useRealTimeData() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<DataEvent | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    const dataManager = getDataManager();
    if (!dataManager) return;

    const handleDataChange = (event: DataEvent) => {
      setLastUpdate(event);
      setUpdateCount(prev => prev + 1);
    };

    // Check connection status
    const checkConnection = () => {
      const status = dataManager.getSyncStatus();
      setIsConnected(status.isOnline && status.websocketConnected);
    };

    dataManager.addEventListener(handleDataChange);
    checkConnection();

    // Check connection status periodically
    const interval = setInterval(checkConnection, 5000);

    return () => {
      dataManager.removeEventListener(handleDataChange);
      clearInterval(interval);
    };
  }, []);

  const forceSync = async () => {
    const dataManager = getDataManager();
    if (dataManager) {
      await dataManager.forceSync();
    }
  };

  const getSyncStatus = () => {
    const dataManager = getDataManager();
    return dataManager?.getSyncStatus() || null;
  };

  return {
    isConnected,
    lastUpdate,
    updateCount,
    forceSync,
    getSyncStatus
  };
}
