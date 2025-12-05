# Cruise Concierge - Cruise Management System

A comprehensive web application designed for managing luxury cruise ship operations, providing tailored interfaces for guests (Voyagers) and crew members (Admin, Manager, Head Cook, Supervisor).

## 🌟 Features

*   **Role-Based Access Control**: Secure authentication and authorization with dedicated dashboards for:
    *   **Voyagers**: Guests can explore services, make bookings, and view itineraries.
    *   **Admins**: Full control over system settings, user management, and global operations.
    *   **Managers**: oversee specific departments and operational flows.
    *   **Head Cooks**: Manage kitchen inventory, menus, and food service orders.
    *   **Supervisors**: Monitor staff and service execution.

*   **Operational Management**:
    *   **Item Management**: internal inventory tracking for various departments.
    *   **Booking System**: Streamlined reservation process for onboard amenities and events.

*   **Modern UI/UX**:
    *   Responsive design providing a seamless experience across devices.
    *   Themed aesthetics reflecting a luxury maritime atmosphere.
    *   Interactive elements using modern React components.

## 🛠️ Technology Stack

*   **Frontend**: [React](https://reactjs.org/) with [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (based on Radix UI)
*   **State Management**: [TanStack Query](https://tanstack.com/query/latest)
*   **Routing**: [React Router](https://reactrouter.com/)
*   **Backend / Database**: Supabase (Authentication & PostgreSQL)

## 🚀 Getting Started

### Prerequisites

*   Node.js (v16.0.0 or higher)
*   npm (v7.0.0 or higher)

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd cruise-concierge
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory and configure your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:8080` (or the port shown in your terminal).

## 📂 Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── admin/          # Admin-specific components (ManageItems, ManageBookings)
│   ├── dashboards/     # Role-specific dashboard views
│   ├── layout/         # Layout wrappers (DashboardLayout)
│   └── ui/             # Generic UI elements (buttons, inputs, etc.)
├── pages/              # Main application pages (Auth, Dashboard, Index)
├── lib/                # Utilities and configurations (Auth, Supabase client)
├── hooks/              # Custom React hooks
└── assets/             # Static assets (images, icons)
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

# Special Key
2004
