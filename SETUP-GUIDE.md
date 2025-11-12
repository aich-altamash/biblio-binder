# 🚀 Quick Setup Guide

Follow these steps to get your Inventory Management System up and running.

## Step 1: Database Setup (5 minutes)

### 1.1 Open Supabase SQL Editor
1. Go to [supabase.com](https://supabase.com) and log in
2. Select your project (Project ID: `yldexvlmrpsmcehsopad`)
3. Click on **SQL Editor** in the left sidebar

### 1.2 Run the Migration
1. Open the `database-setup.sql` file from this repository
2. Copy the **entire** SQL script (Ctrl+A, Ctrl+C)
3. Paste it into the Supabase SQL Editor
4. Click the **Run** button (or press Ctrl+Enter)
5. Wait for the success message

**Expected output:** You should see "Success. No rows returned" - this is normal!

### 1.3 Verify Tables Were Created
1. Click on **Table Editor** in the left sidebar
2. You should see these tables:
   - ✅ batches
   - ✅ campuses
   - ✅ categories
   - ✅ inventory_logs
   - ✅ products
   - ✅ purchase_items
   - ✅ purchase_orders
   - ✅ sales_invoices
   - ✅ sales_items
   - ✅ suppliers
   - ✅ system_settings
   - ✅ user_roles

## Step 2: Create Your Admin Account (2 minutes)

### 2.1 Sign Up
1. Go to your application URL
2. Click on the **Sign Up** tab
3. Enter your email and a strong password
4. Click **Sign Up**

### 2.2 Make Yourself Admin
1. Go back to Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Find your newly created user
4. Copy the **User ID** (it looks like: `123e4567-e89b-12d3-a456-426614174000`)
5. Go back to **SQL Editor**
6. Run this command (replace with your actual User ID):

```sql
INSERT INTO public.user_roles (user_id, role) 
VALUES ('paste-your-user-id-here', 'admin');
```

### 2.3 Verify Admin Access
1. Log out of the application
2. Log back in with your credentials
3. You should now see the full navigation menu with all features

## Step 3: Configure System Settings (3 minutes)

1. Click on **Settings** in the sidebar
2. Fill in your company information:
   - Company Name
   - Company Address
   - Company Phone
   - Company Email
3. Fill in your warehouse information:
   - Warehouse Name
   - Warehouse Address
4. Set business preferences:
   - Currency (default: PKR)
   - Tax Rate (%)
5. Click **Save Settings**

## Step 4: Start Using the System

### Add Initial Data

1. **Categories** (Books > Categories)
   - Add subject categories (e.g., Mathematics, Science, English)
   - Add genre categories (e.g., Fiction, Non-Fiction, Reference)

2. **Suppliers** (Suppliers page)
   - Add your book suppliers with contact details
   - Include pricing terms and delivery information

3. **Products** (Products page)
   - Add books to your catalog
   - Include ISBN, author, edition details
   - Assign categories

4. **Campuses** (Campuses page)
   - Add all school campuses you distribute to
   - Include contact persons and addresses

### Your First Operations

**Create a Purchase Order:**
1. Go to **Purchasing** → **Create Purchase Order**
2. Select a supplier
3. Add products with quantities and prices
4. Submit the order

**Receive Inventory:**
1. Find the pending PO in **Purchasing**
2. Click **Receive**
3. Enter batch details
4. Confirm to add stock

**Create a Sales Invoice:**
1. Go to **Sales** → **Create Invoice**
2. Select a campus
3. Add products from available batches
4. Set prices and quantities
5. Apply discounts if needed
6. Enter payment amount
7. Submit to create invoice

**View Reports:**
1. Go to **Reports**
2. View inventory valuation
3. Check supplier statistics
4. Analyze campus sales
5. Review profit & loss
6. Export any report to CSV

## Troubleshooting

### "Tables not found" error
- Make sure you ran the entire `database-setup.sql` script
- Check Supabase SQL Editor for any error messages
- Verify tables exist in Table Editor

### Can't see any pages after login
- Confirm you added your user to `user_roles` table
- Check that the role is set to 'admin'
- Log out and log back in

### RLS policy errors
- Ensure all tables have Row Level Security enabled
- Check that the `has_role` function was created
- Verify you're logged in as an admin user

### Need help?
1. Check the main [README.md](./README.md)
2. Review [Lovable Documentation](https://docs.lovable.dev)
3. Join [Lovable Discord](https://discord.com/channels/1119885301872070706/1280461670979993613)

## Next Steps

Once everything is set up:
- ✅ Explore the Dashboard to see key metrics
- ✅ Set up your complete product catalog
- ✅ Start processing purchase orders
- ✅ Create sales invoices for campuses
- ✅ Generate reports for insights
- ✅ Export data to CSV for analysis

---

**Estimated total setup time: 10-15 minutes**

Happy inventory managing! 🎉
