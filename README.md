# Book Inventory Management System

A comprehensive, modern web-based inventory management system specifically designed for book distribution across school campuses. Built with React, TypeScript, and Lovable Cloud (Supabase) backend.

## 🌟 Features

### Core Modules

#### 📚 Product Management
- Complete book catalog with ISBN/SKU tracking
- Author and edition management
- Category organization (subjects/genres)
- CRUD operations for all book information

#### 🏢 Supplier Management
- Supplier contact information and terms
- Per-item pricing by supplier
- Delivery time tracking
- Purchase agreement management
- Supplier performance analytics

#### 📦 Purchasing & Procurement
- Create and manage purchase orders
- Receive goods and update inventory
- Batch tracking with lot numbers
- Cost price recording per batch
- PO status tracking (pending/received)
- PDF generation for purchase orders

#### 📊 Inventory Management
- Central warehouse stock tracking
- Batch-level inventory control
- Stock in/out logging
- Expiry date tracking
- Real-time inventory valuation
- Low stock alerts
- Complete audit trail via inventory logs

#### 💰 Sales & Distribution
- Sales invoice creation for campuses
- Multiple items per invoice support
- Discount management (percentage-based)
- Automatic profit calculation
- FIFO stock deduction
- Payment tracking (paid/pending/partial)
- Outstanding dues management
- PDF invoice generation

#### 🏫 Campus Management
- Manage multiple school campuses
- Campus-specific sales tracking
- Contact person and location details
- Payment history per campus

#### 📈 Reporting & Analytics
- **Inventory Valuation Reports**: Total stock value by product and batch
- **Supplier Reports**: Purchase analysis, spend tracking, pending orders
- **Campus Sales Reports**: Sales performance, profit analysis, outstanding amounts
- **Profit & Loss Statements**: Revenue, COGS, profit margins
- **Dashboard KPIs**: Real-time metrics and insights
- **CSV Export**: All reports exportable to CSV format

#### ⚙️ System Settings
- Company information management
- Central warehouse configuration
- Tax rate and currency settings
- Business preferences

### Technical Features

- 🔐 **Authentication**: Secure admin login with Lovable Cloud Auth
- 💾 **PostgreSQL Database**: Robust relational database with RLS policies
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- 📄 **PDF Generation**: Professional invoices and purchase orders
- 📊 **CSV Export**: Easy data export for external analysis
- 🔄 **Real-time Updates**: Instant data synchronization
- 🛡️ **Type Safety**: Full TypeScript implementation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm installed
- Git for version control

### Installation

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

4. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Database Setup

**IMPORTANT:** You must run the database migration before using the application.

1. **Open Supabase SQL Editor**
   - Go to your Supabase project at [supabase.com](https://supabase.com)
   - Navigate to **SQL Editor** in the left sidebar

2. **Run the Migration**
   - Open the `database-setup.sql` file in this repository
   - Copy the entire SQL script
   - Paste it into the SQL Editor
   - Click **Run** to execute

3. **Create Your Admin Account**
   - Go to your application at `/auth` and sign up
   - After signup, return to Supabase Dashboard
   - Go to **Authentication** → **Users**
   - Copy your **User ID**
   - Run this SQL in the SQL Editor:
   ```sql
   INSERT INTO public.user_roles (user_id, role) 
   VALUES ('paste-your-user-id-here', 'admin');
   ```

4. **Verify Setup**
   - Log out and log back in
   - You should now have access to all features

The database includes these tables:
- **products**: Book catalog with ISBN/SKU
- **categories**: Product categorization
- **suppliers**: Supplier information and terms
- **purchase_orders**: Purchase order management
- **purchase_items**: PO line items
- **batches**: Batch-level inventory tracking
- **inventory_logs**: Complete stock movement audit trail
- **sales_invoices**: Sales orders and invoicing
- **sales_items**: Invoice line items with profit calculation
- **campuses**: School campus/customer locations
- **system_settings**: Company and warehouse configuration
- **user_roles**: Role-based access control

## 📖 Usage Guide

### First Time Setup

1. **Login**: Use the authentication page to sign in
2. **Configure Settings**: Go to Settings and add your company information
3. **Add Categories**: Create product categories (subjects/genres)
4. **Add Suppliers**: Enter supplier details and pricing
5. **Add Products**: Build your book catalog
6. **Add Campuses**: Set up your school campus locations

### Daily Operations

#### Creating a Purchase Order
1. Navigate to **Purchasing**
2. Click **Create Purchase Order**
3. Select supplier and add products with quantities
4. Submit the order

#### Receiving Inventory
1. Go to **Purchasing** and find your PO
2. Click **Receive** on the pending order
3. Enter batch details (batch number, expiry date if applicable)
4. Confirm receipt to update inventory

#### Creating a Sales Invoice
1. Navigate to **Sales**
2. Click **Create Invoice**
3. Select campus and add products from available batches
4. Set unit prices (system shows cost and calculates profit)
5. Apply discounts if needed
6. Enter payment amount
7. Submit to create invoice and update inventory

#### Viewing Reports
1. Go to **Reports** to see:
   - Inventory valuation
   - Supplier performance
   - Campus sales analysis
   - Profit & loss summary
2. Export any report to CSV for further analysis

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18**: Modern React with hooks
- **TypeScript**: Full type safety
- **Vite**: Lightning-fast build tool
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: High-quality component library
- **React Router**: Client-side routing
- **TanStack Query**: Data fetching and caching
- **date-fns**: Date manipulation
- **jsPDF**: PDF generation
- **Lucide Icons**: Beautiful icon library

### Backend Stack
- **Lovable Cloud (Supabase)**: PostgreSQL database and authentication
- **Row Level Security (RLS)**: Database-level security policies
- **Real-time subscriptions**: Live data updates
- **RESTful API**: Auto-generated from database schema

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── AppSidebar.tsx  # Navigation sidebar
│   ├── DashboardLayout.tsx
│   └── NavLink.tsx
├── pages/              # Application pages
│   ├── Auth.tsx        # Login page
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Products.tsx    # Product management
│   ├── Suppliers.tsx   # Supplier management
│   ├── Purchasing.tsx  # Purchase orders
│   ├── Inventory.tsx   # Inventory tracking
│   ├── Sales.tsx       # Sales invoices
│   ├── Campuses.tsx    # Campus management
│   ├── Reports.tsx     # Reports & analytics
│   └── Settings.tsx    # System settings
├── utils/              # Utility functions
│   ├── pdfGenerator.ts # PDF generation
│   └── csvExporter.ts  # CSV export
├── integrations/       # External integrations
│   └── supabase/       # Supabase client and types
├── hooks/              # Custom React hooks
├── lib/                # Library utilities
└── main.tsx           # Application entry point
```

## 🔒 Security

- All authentication handled by Lovable Cloud (Supabase Auth)
- Row Level Security (RLS) policies on all database tables
- Secure API key management via environment variables
- Input validation and sanitization
- Protected routes requiring authentication

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

This is a Lovable project. To make changes:

1. **Via Lovable**: Visit the project in Lovable and use the AI assistant
2. **Via IDE**: Clone the repo, make changes, and push to trigger Lovable sync
3. **Via GitHub**: Edit files directly on GitHub

## 📄 License

Copyright © 2025. All rights reserved.

## 🔗 Links

- **Lovable Project**: [View in Lovable](https://lovable.dev/projects/fc1e9cdb-27d0-47bb-a9de-0aa766ac1c83)
- **Documentation**: [Lovable Docs](https://docs.lovable.dev)
- **Support**: [Lovable Discord](https://discord.com/channels/1119885301872070706/1280461670979993613)

## 🎯 Roadmap

Completed features:
- ✅ User authentication
- ✅ Product catalog with categories
- ✅ Supplier management
- ✅ Purchase order system
- ✅ Batch inventory tracking
- ✅ Sales invoicing
- ✅ Campus management
- ✅ Comprehensive reporting
- ✅ PDF invoice generation
- ✅ CSV export functionality
- ✅ System settings

Future enhancements:
- 📧 Email notifications for low stock
- 📊 Advanced analytics and charts
- 📱 Mobile app
- 🔄 Automated reorder points
- 📦 Barcode scanning
- 🌐 Multi-language support

## 💡 Tips

- Use **Visual Edits** in Lovable for quick UI changes
- Enable **Dev Mode** to view and edit code directly
- All reports are exportable - use this for external analysis
- Set up system settings first for professional invoices
- Regular backups are recommended (use CSV exports)

## 🐛 Troubleshooting

**Database tables not found?**
- Make sure you've run the `database-setup.sql` script in Supabase SQL Editor
- Check for any errors when running the migration
- Verify all tables are created by going to Table Editor in Supabase

**Can't log in?**
- Ensure you've created a user account at `/auth`
- Make sure you've added your user to the `user_roles` table as admin
- Check that environment variables are set correctly

**Data not loading?**
- Check browser console for errors
- Verify Lovable Cloud is enabled and running
- Ensure RLS policies are properly configured
- Confirm you're logged in as an admin user

**PDF not downloading?**
- Check browser popup blocker settings
- Ensure system settings are configured

## 📞 Support

For support:
1. Check [Lovable Documentation](https://docs.lovable.dev)
2. Join [Lovable Discord Community](https://discord.com/channels/1119885301872070706/1280461670979993613)
3. Contact support through Lovable platform

---

Built with ❤️ using [Lovable](https://lovable.dev) - The AI-powered web application builder
