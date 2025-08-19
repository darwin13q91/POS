# Modern POS System

A comprehensive, offline-first Point of Sale system built with React, TypeScript, and IndexedDB. Perfect for retail businesses, restaurants, and service providers.

## 🚀 Features

### Core POS Functionality
- **🛒 Sales Management** - Process transactions with barcode scanning, manual entry, and receipt generation
- **📦 Inventory Control** - Real-time stock tracking, low stock alerts, bulk operations, and SKU management
- **👥 Customer Management** - Customer profiles, purchase history, and loyalty program integration
- **💰 Multiple Payment Methods** - Cash, card, and digital payment support
- **🧾 Receipt Generation** - PDF and text receipts with customizable templates

### Advanced Features
- **🏆 Loyalty Program** - Points-based rewards system with tier management
- **📊 Analytics & Reports** - Sales trends, product performance, and customer insights
- **👨‍💼 Employee Management** - User roles, permissions, and access control
- **⚡ Offline-First** - Works without internet connection, syncs when online
- **📱 PWA Support** - Install as a mobile/desktop app
- **🔐 Multi-User System** - Role-based access (Staff, Manager, Owner, SuperAdmin)
- **💾 Backup & Restore** - Automated backups with import/export functionality

### SuperAdmin Features
- **🏢 Multi-Business Management** - Manage multiple POS installations
- **📈 System-Wide Analytics** - Cross-business reporting and insights
- **⚙️ Global Configuration** - System-wide settings and feature control
- **🛠️ Maintenance Tools** - Database management and system health monitoring
- **Touch-friendly**: Optimized for tablets and touch devices
- **PWA Ready**: Progressive Web App capabilities
- **TypeScript**: Type-safe development

## 🛠 Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS for modern, responsive design
- **State Management**: Zustand for lightweight state management
- **Database**: IndexedDB with Dexie.js for offline data storage
- **Icons**: Lucide React for modern icons
- **PWA**: Service Worker for offline functionality

## 📱 Core Modules

### 1. Point of Sale (POS)
- Product selection with search and category filters
- Shopping cart management
- Multiple payment methods (Cash, Card, Digital Wallet)
- Real-time calculation of taxes and totals
- Receipt generation

### 2. Inventory Management
- Product catalog management
- Stock level tracking
- Category organization
- Barcode support
- Low stock alerts

### 3. Sales Analytics
- Transaction history
- Sales reports
- Revenue analytics
- Payment method tracking

### 4. Customer Management
- Customer database
- Purchase history
- Contact information
- Loyalty tracking

### 5. Settings
- System configuration
- Tax rates
- Payment methods
- User preferences

## 🚀 Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

### Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📊 Sample Data

The application comes pre-loaded with sample data including:
- 5 product categories (Electronics, Clothing, Food & Beverage, Books, Home & Garden)
- Sample products with realistic pricing and descriptions
- Demo inventory levels

## 🎯 Usage

1. **POS Operations**: Select products from the grid, manage quantities in the cart, and process payments
2. **Inventory**: View and manage product catalog (coming soon)
3. **Sales**: Access transaction history and reports (coming soon)
4. **Customers**: Manage customer database (coming soon)
5. **Settings**: Configure system preferences (coming soon)

## 🔧 Configuration

The system is designed to work out of the box with sensible defaults:
- 10% tax rate (configurable)
- Local currency formatting
- Offline-first data storage

## 📱 PWA Features

- Offline functionality
- App-like experience
- Fast loading times
- Responsive design
- Cross-platform compatibility

## 🎯 Roadmap

- [ ] Complete inventory management interface
- [ ] Sales analytics dashboard
- [ ] Customer management system
- [ ] Receipt printing functionality
- [ ] Backup and sync capabilities
- [ ] Multi-user support
- [ ] Advanced reporting
- [ ] Barcode scanning integration

---

**ModernPOS** - Built with modern web technologies for the future of retail.
