# Remote Maintenance Server Example

This is a basic Node.js/Express server example that implements the endpoints needed for the remote maintenance system.

## Installation

```bash
npm init -y
npm install express cors helmet morgan body-parser
npm install --save-dev @types/express @types/node typescript nodemon
```

## Server Implementation

```typescript
// server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// In-memory storage (use database in production)
let diagnosticData: Record<string, any> = {};
let supportTickets: Record<string, any[]> = {};
let remoteCommands: Record<string, any[]> = {};
let backups: Record<string, any[]> = {};

// Authentication middleware
const authenticateRequest = (req: any, res: any, next: any) => {
  const licenseKey = req.headers.authorization?.replace('Bearer ', '');
  const businessId = req.headers['x-business-id'];
  
  if (!licenseKey || !businessId) {
    return res.status(401).json({ error: 'Missing authentication' });
  }
  
  // Validate license key (implement your validation logic)
  if (licenseKey === 'demo-license' || licenseKey.startsWith('valid-')) {
    req.businessId = businessId;
    req.licenseKey = licenseKey;
    next();
  } else {
    res.status(401).json({ error: 'Invalid license key' });
  }
};

// Health check endpoint
app.post('/api/diagnostic', authenticateRequest, (req, res) => {
  const { businessId } = req;
  const diagnosticInfo = req.body;
  
  // Store diagnostic data
  diagnosticData[businessId] = {
    ...diagnosticInfo,
    lastReported: new Date(),
    serverTimestamp: Date.now()
  };
  
  console.log(`Diagnostic data received from ${businessId}:`, {
    version: diagnosticInfo.version,
    errorCount: diagnosticInfo.errorLogs?.length || 0,
    lastSync: diagnosticInfo.lastSync
  });
  
  res.json({ 
    status: 'received',
    nextCheckIn: Date.now() + 300000 // 5 minutes
  });
});

// Get remote commands
app.get('/api/commands', authenticateRequest, (req, res) => {
  const { businessId } = req;
  
  // Return pending commands for this business
  const commands = remoteCommands[businessId] || [];
  
  // Clear commands after sending
  remoteCommands[businessId] = [];
  
  res.json(commands);
});

// Create support ticket
app.post('/api/support', authenticateRequest, (req, res) => {
  const { businessId } = req;
  const ticketData = req.body;
  
  const ticket = {
    id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    businessId,
    ...ticketData,
    status: 'open',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Store ticket
  if (!supportTickets[businessId]) {
    supportTickets[businessId] = [];
  }
  supportTickets[businessId].push(ticket);
  
  console.log(`Support ticket created for ${businessId}:`, ticket.subject);
  
  res.json({ 
    ticketId: ticket.id,
    status: 'created',
    estimatedResponse: '24 hours'
  });
});

// Backup endpoint
app.post('/api/backup', authenticateRequest, (req, res) => {
  const { businessId } = req;
  const backupData = req.body;
  
  const backup = {
    id: `backup_${Date.now()}`,
    businessId,
    ...backupData,
    serverTimestamp: Date.now()
  };
  
  // Store backup
  if (!backups[businessId]) {
    backups[businessId] = [];
  }
  backups[businessId].push(backup);
  
  // Keep only last 10 backups per business
  if (backups[businessId].length > 10) {
    backups[businessId] = backups[businessId].slice(-10);
  }
  
  console.log(`Backup received from ${businessId}, size: ${JSON.stringify(backup).length} bytes`);
  
  res.json({ 
    status: 'stored',
    backupId: backup.id
  });
});

// Admin endpoints for monitoring

// Get all business statuses
app.get('/admin/businesses', (req, res) => {
  const businesses = Object.keys(diagnosticData).map(businessId => ({
    businessId,
    lastSeen: diagnosticData[businessId].lastReported,
    status: diagnosticData[businessId].isOnline ? 'online' : 'offline',
    version: diagnosticData[businessId].version,
    errorCount: diagnosticData[businessId].errorLogs?.length || 0
  }));
  
  res.json(businesses);
});

// Get support tickets for admin
app.get('/admin/tickets', (req, res) => {
  const allTickets = Object.entries(supportTickets).flatMap(([businessId, tickets]) => 
    tickets.map(ticket => ({ ...ticket, businessId }))
  );
  
  res.json(allTickets);
});

// Send remote command to business
app.post('/admin/command/:businessId', (req, res) => {
  const { businessId } = req.params;
  const command = {
    id: `cmd_${Date.now()}`,
    timestamp: new Date(),
    ...req.body
  };
  
  if (!remoteCommands[businessId]) {
    remoteCommands[businessId] = [];
  }
  remoteCommands[businessId].push(command);
  
  console.log(`Command queued for ${businessId}:`, command.type);
  
  res.json({ 
    status: 'queued',
    commandId: command.id
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Remote maintenance server running on port ${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin/businesses`);
});
```

## Usage Examples

### Starting the Server
```bash
npx tsx server.ts
```

### Testing with curl

1. **Send diagnostic data:**
```bash
curl -X POST http://localhost:3001/api/diagnostic \
  -H "Authorization: Bearer demo-license" \
  -H "X-Business-ID: test-business" \
  -H "Content-Type: application/json" \
  -d '{"version":"1.0.0","platform":"web","browser":"Chrome"}'
```

2. **Create support ticket:**
```bash
curl -X POST http://localhost:3001/api/support \
  -H "Authorization: Bearer demo-license" \
  -H "X-Business-ID: test-business" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Test Issue","description":"Testing support system","priority":"medium","category":"technical"}'
```

3. **Send remote command:**
```bash
curl -X POST http://localhost:3001/admin/command/test-business \
  -H "Content-Type: application/json" \
  -d '{"type":"update","payload":{"version":"1.1.0","critical":false,"changelog":"Bug fixes"}}'
```

### Admin Dashboard

Access the admin endpoints:
- `GET /admin/businesses` - List all connected businesses
- `GET /admin/tickets` - View all support tickets
- `POST /admin/command/:businessId` - Send command to specific business

## Production Considerations

1. **Database**: Replace in-memory storage with proper database (PostgreSQL, MongoDB, etc.)
2. **Authentication**: Implement proper JWT or API key authentication
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **Logging**: Use proper logging service (Winston, Loggly, etc.)
5. **Monitoring**: Add health checks and monitoring (Prometheus, DataDog, etc.)
6. **SSL/TLS**: Use HTTPS in production
7. **Backup Storage**: Store backups in cloud storage (AWS S3, Google Cloud, etc.)
8. **Scalability**: Consider load balancing for multiple server instances

## Environment Variables

```bash
# .env
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/maintenance_db
JWT_SECRET=your-super-secret-key
BACKUP_STORAGE_PATH=/var/backups/pos-systems
LOG_LEVEL=info
```

This server example provides a foundation for implementing the remote maintenance backend that works with your POS system's remote maintenance client.
