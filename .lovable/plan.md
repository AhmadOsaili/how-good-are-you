

# Roofing Lead Generation App

## Overview
A lead generation platform for the roofing industry with two sides:
1. **Public-facing lead form** where homeowners submit their info
2. **Admin dashboard** where you manage vetted roofing companies, view leads, and assign them

Since you want email/SMS confirmation and admin-managed assignments, this requires **Lovable Cloud** for the database, authentication, and email sending.

## Architecture

### Pages
- **/** -- Landing page with trust messaging ("We connect you with vetted, honest roofers") and lead capture form
- **/thank-you** -- Confirmation page after submission
- **/admin/login** -- Admin authentication
- **/admin/dashboard** -- Leads overview with status filters
- **/admin/companies** -- Manage vetted roofing companies (CRUD)
- **/admin/leads/:id** -- Lead detail with company assignment

### Database Tables (Lovable Cloud / Supabase)
- **companies** -- id, name, phone, email, service_area (zip codes), website, notes, created_at
- **leads** -- id, name, address, zip_code, phone, email, roof_age, concerns, status (new/assigned/contacted/closed), created_at
- **lead_assignments** -- id, lead_id (FK), company_id (FK), assigned_at, notified (boolean)
- **user_roles** -- id, user_id (FK to auth.users), role (admin enum) -- for secure admin access

### Lead Form Fields
Name, address (with zip code), phone, email, roof age (select: 0-5, 5-10, 10-15, 15-20, 20+ years), concerns (textarea)

### Admin Features
- View all leads with filters (status, date range, zip code)
- Add/edit/remove vetted companies with service areas
- Assign a lead to one or more companies
- Email notification sent to assigned companies with lead details
- Email confirmation sent to homeowner

### Security
- Admin routes protected by auth + role check via `has_role()` security definer function
- RLS on all tables
- Input validation with Zod on both form and server side

## Implementation Order
1. Enable Lovable Cloud and set up database schema + RLS
2. Build the public landing page and lead form
3. Build the thank-you page
4. Set up admin auth (login page, protected routes, user_roles)
5. Build admin dashboard (leads list, company management, assignment flow)
6. Add email notifications via edge function (homeowner confirmation + company notification)

## Tech Details
- React Router for routing, shadcn/ui components throughout
- Sidebar layout for admin with SidebarProvider
- react-hook-form + zod for form validation
- Supabase edge function for sending emails on lead assignment
- Recharts for optional lead analytics on admin dashboard

