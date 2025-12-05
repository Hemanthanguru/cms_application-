import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
    Ship,
    LogOut,
    Menu,
    X,
    Home,
    Utensils,
    ShoppingBag,
    Film,
    Scissors,
    Dumbbell,
    PartyPopper,
    Settings,
    Users,
    Eye,
    ChefHat,
    ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";

const DashboardLayout = ({ children }) => {
    const { user, userRole, signOut } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate("/");
    };

    const voyagerNavItems = [
        { icon: Home, label: "Dashboard", href: "/dashboard" },
        { icon: Utensils, label: "Catering", href: "/dashboard/catering" },
        { icon: ShoppingBag, label: "Stationery", href: "/dashboard/stationery" },
        { icon: Film, label: "Movies", href: "/dashboard/movies" },
        { icon: Scissors, label: "Salon", href: "/dashboard/salon" },
        { icon: Dumbbell, label: "Fitness", href: "/dashboard/fitness" },
        { icon: PartyPopper, label: "Party Hall", href: "/dashboard/party-hall" },
    ];

    const adminNavItems = [
        { icon: Home, label: "Dashboard", href: "/dashboard" },
        { icon: Settings, label: "Manage Items", href: "/dashboard/items" },
    ];

    const managerNavItems = [
        { icon: Home, label: "Dashboard", href: "/dashboard" },
        { icon: Eye, label: "All Bookings", href: "/dashboard/bookings" },
    ];

    const headCookNavItems = [
        { icon: Home, label: "Dashboard", href: "/dashboard" },
        { icon: ChefHat, label: "Catering Orders", href: "/dashboard/catering-orders" },
    ];

    const supervisorNavItems = [
        { icon: Home, label: "Dashboard", href: "/dashboard" },
        { icon: ClipboardList, label: "Stationery Orders", href: "/dashboard/stationery-orders" },
    ];

    const getNavItems = () => {
        switch (userRole) {
            case "admin":
                return adminNavItems;
            case "manager":
                return managerNavItems;
            case "head_cook":
                return headCookNavItems;
            case "supervisor":
                return supervisorNavItems;
            default:
                return voyagerNavItems;
        }
    };

    const navItems = getNavItems();

    const getRoleLabel = () => {
        switch (userRole) {
            case "admin": return "Administrator";
            case "manager": return "Manager";
            case "head_cook": return "Head Cook";
            case "supervisor": return "Supervisor";
            default: return "Voyager";
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-primary px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.jpg" alt="Logo" className="h-8 w-8 object-contain" />
                        <span className="text-lg font-serif font-semibold text-primary-foreground">
                            Cruise Ship Management
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="text-primary-foreground hover:bg-sidebar-accent"
                    >
                        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                </div>
            </header>

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-40 h-full w-64 bg-sidebar transform transition-transform duration-300 lg:translate-x-0",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="hidden lg:flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
                        <img src="/logo.jpg" alt="Logo" className="h-10 w-10 object-contain" />
                        <span className="text-xl font-serif font-bold text-sidebar-foreground">
                            Cruise Ship Management
                        </span>
                    </div>

                    {/* User Info */}
                    <div className="px-6 py-4 border-b border-sidebar-border mt-14 lg:mt-0">
                        <p className="text-sm text-sidebar-foreground/70">Welcome,</p>
                        <p className="font-semibold text-sidebar-foreground truncate">
                            {user?.user_metadata?.full_name || user?.email}
                        </p>
                        <span className="inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                            {getRoleLabel()}
                        </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                            >
                                <item.icon className="h-5 w-5" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* Sign Out */}
                    <div className="p-4 border-t border-sidebar-border">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            onClick={handleSignOut}
                        >
                            <LogOut className="h-5 w-5" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-foreground/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
