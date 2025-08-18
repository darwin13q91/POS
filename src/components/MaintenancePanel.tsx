import { useState, useEffect } from 'react';
import { getMaintenanceService } from '../lib/remote-maintenance';
import { Settings, Wifi, WifiOff, AlertCircle, CheckCircle, Download } from 'lucide-react';

export default function MaintenancePanel() {
  const [systemStatus, setSystemStatus] = useState<{
    online: boolean;
    maintenanceMode: boolean;
    lastSync: Date;
  } | null>(null);

  const [isVisible, setIsVisible] = useState(false);
  const maintenanceService = getMaintenanceService();

  console.log('MaintenancePanel rendered, service:', maintenanceService);

  useEffect(() => {
    if (maintenanceService) {
      console.log('Setting up maintenance service status updates');
      // Update system status every 30 seconds
      const updateStatus = () => {
        const status = maintenanceService.getSystemStatus();
        console.log('System status updated:', status);
        setSystemStatus(status);
      };
      
      updateStatus();
      const interval = setInterval(updateStatus, 30000);
      
      return () => clearInterval(interval);
    } else {
      console.log('Maintenance service not available');
    }
  }, [maintenanceService]);

  const handleCreateSupportTicket = async () => {
    if (!maintenanceService) return;
    
    try {
      const ticketId = await maintenanceService.createSupportTicket({
        subject: 'User Request',
        description: 'Need assistance with POS system',
        priority: 'medium',
        category: 'technical'
      });
      
      alert(`Support ticket created: ${ticketId}`);
    } catch (error) {
      console.error('Failed to create support ticket:', error);
      alert('Failed to create support ticket. It will be sent when online.');
    }
  };

  const handleForceSync = async () => {
    if (!maintenanceService) return;
    
    try {
      await maintenanceService.syncWithServer();
      alert('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed. Will retry automatically.');
    }
  };

  const handleToggleMaintenanceMode = async () => {
    if (!maintenanceService) return;
    
    try {
      if (systemStatus?.maintenanceMode) {
        await maintenanceService.disableMaintenanceMode();
      } else {
        await maintenanceService.enableMaintenanceMode();
      }
      
      // Update status
      setSystemStatus(maintenanceService.getSystemStatus());
    } catch (error) {
      console.error('Failed to toggle maintenance mode:', error);
    }
  };

  if (!maintenanceService) {
    // Show basic panel even without service
    return (
      <>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="fixed bottom-4 right-4 bg-gray-600 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 z-50"
          title="Maintenance Panel (Service Not Available)"
        >
          <Settings className="w-5 h-5" />
        </button>

        {isVisible && (
          <div className="fixed bottom-20 right-4 bg-white rounded-lg shadow-xl border p-4 w-80 z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">System Status</h3>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="text-center text-gray-500">
              <p>Maintenance service initializing...</p>
              <p className="text-xs mt-2">Refresh page if this persists</p>
            </div>
          </div>
        )}
      </>
    );
  }

  if (!systemStatus) {
    return null;
  }

  return (
    <>
      {/* Floating maintenance button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 z-50"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Maintenance panel */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 bg-white rounded-lg shadow-xl border p-4 w-80 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">System Status</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 mb-3">
            {systemStatus.online ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-green-600 text-sm">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-red-600 text-sm">Offline</span>
              </>
            )}
          </div>

          {/* Maintenance Mode */}
          <div className="flex items-center gap-2 mb-3">
            {systemStatus.maintenanceMode ? (
              <>
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-600 text-sm">Maintenance Mode</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-600 text-sm">Normal Operation</span>
              </>
            )}
          </div>

          {/* Last Sync */}
          <div className="text-xs text-gray-500 mb-4">
            Last sync: {systemStatus.lastSync.toLocaleString()}
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={handleForceSync}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center gap-2"
              disabled={!systemStatus.online}
            >
              <Download className="w-4 h-4" />
              Force Sync
            </button>

            <button
              onClick={handleCreateSupportTicket}
              className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
            >
              Create Support Ticket
            </button>

            <button
              onClick={handleToggleMaintenanceMode}
              className={`w-full px-3 py-2 rounded text-sm ${
                systemStatus.maintenanceMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              }`}
            >
              {systemStatus.maintenanceMode ? 'Exit Maintenance' : 'Enter Maintenance'}
            </button>
          </div>

          {/* Status indicators */}
          <div className="mt-4 pt-3 border-t text-xs text-gray-500">
            <div>Business ID: {maintenanceService.getSystemStatus().online ? '✓' : '✗'}</div>
            <div>Remote Support: {systemStatus.online ? 'Available' : 'Unavailable'}</div>
          </div>
        </div>
      )}
    </>
  );
}
