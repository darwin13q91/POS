import { useState, useEffect } from 'react';
import { HeadphonesIcon, Ticket, Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface SupportTicket {
  id: string;
  businessId: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ConnectedSystem {
  businessId: string;
  status: 'online' | 'offline';
  lastSeen: Date;
  version: string;
}

export default function SupportView() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [connectedSystems, setConnectedSystems] = useState<ConnectedSystem[]>([]);
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    activeSystems: 0
  });

  useEffect(() => {
    loadSupportData();
    const interval = setInterval(loadSupportData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSupportData = () => {
    // Mock data - in production, this would come from your support server
    const mockTickets: SupportTicket[] = [
      {
        id: 'ticket-001',
        businessId: 'demo-business',
        subject: 'POS System Not Starting',
        description: 'The POS system crashes on startup after the latest update',
        priority: 'high',
        status: 'open',
        category: 'technical',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'ticket-002',
        businessId: 'coffee-shop-123',
        subject: 'Receipt Printer Not Working',
        description: 'Customer receipts are not printing, thermal printer shows no connection',
        priority: 'medium',
        status: 'in-progress',
        category: 'technical',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)  // 1 hour ago
      },
      {
        id: 'ticket-003',
        businessId: 'restaurant-456',
        subject: 'Feature Request: Table Management',
        description: 'Would like to add table management functionality for restaurant orders',
        priority: 'low',
        status: 'open',
        category: 'feature-request',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ];

    const mockSystems: ConnectedSystem[] = [
      { businessId: 'demo-business', status: 'online', lastSeen: new Date(), version: '1.0.0' },
      { businessId: 'coffee-shop-123', status: 'offline', lastSeen: new Date(Date.now() - 30 * 60 * 1000), version: '1.0.0' },
      { businessId: 'restaurant-456', status: 'online', lastSeen: new Date(), version: '0.9.8' }
    ];

    setTickets(mockTickets);
    setConnectedSystems(mockSystems);
    setStats({
      totalTickets: mockTickets.length,
      openTickets: mockTickets.filter(t => t.status === 'open' || t.status === 'in-progress').length,
      resolvedTickets: mockTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
      activeSystems: mockSystems.filter(s => s.status === 'online').length
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'in-progress': return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed': return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleTicketAction = (ticketId: string, action: string) => {
    // In production, this would send the action to your support server
    alert(`Action "${action}" performed on ticket ${ticketId}`);
  };

  const sendRemoteCommand = (businessId: string, command: string) => {
    // In production, this would send the command through the maintenance service
    alert(`Remote command "${command}" sent to ${businessId}`);
  };

  return (
    <div className="flex-1 p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HeadphonesIcon className="h-6 w-6 text-red-600" />
            Support Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Remote support and system monitoring</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
              </div>
              <Ticket className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                <p className="text-2xl font-bold text-orange-600">{stats.openTickets}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolvedTickets}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Systems</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activeSystems}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Support Tickets */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Support Tickets</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{ticket.businessId}</span>
                      <span>{ticket.createdAt.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleTicketAction(ticket.id, 'assign')}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
                        Assign to Me
                      </button>
                      <button
                        onClick={() => handleTicketAction(ticket.id, 'resolve')}
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Connected Systems */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Connected Systems</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {connectedSystems.map((system) => (
                  <div key={system.businessId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-900">{system.businessId}</div>
                      <div className="text-sm text-gray-600">Version: {system.version}</div>
                      <div className="text-xs text-gray-500">
                        Last seen: {system.lastSeen.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        system.status === 'online' 
                          ? 'text-green-600 bg-green-50' 
                          : 'text-red-600 bg-red-50'
                      }`}>
                        {system.status}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => sendRemoteCommand(system.businessId, 'diagnostic')}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          title="Run Diagnostics"
                        >
                          Diagnose
                        </button>
                        <button
                          onClick={() => sendRemoteCommand(system.businessId, 'restart')}
                          className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                          title="Restart System"
                        >
                          Restart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
