# Upasna Borewells Management System

A modern web application for managing borewell services, service requests, inventory, employees, and expenses. Built with React, Vite, and Supabase.

## Tech Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS
- **Backend/Database:** Supabase (PostgreSQL)
- **Maps/Location:** Mappls SDK (GPS-based address resolution)
- **State Management:** React Query (TanStack Query)

## Features

- **Service Request Management:**
  - Create and track drilling/repair requests.
  - **GPS Integration:** Automatically capture exact location coordinates and resolve to structured address (House/Street, Locality/Village, City/SubDistrict, District, State, Pincode).
  - Calculate costs based on depth, rates, and casing types.
- **Inventory Management:** Track products in category-based inventory.
- **Employee Management:** Role-based access (Admin/Staff) and profile management.
- **Expense Tracking:** Monitor operational costs.
- **Mobile-First Design:** Fully responsive UI with dark mode support.