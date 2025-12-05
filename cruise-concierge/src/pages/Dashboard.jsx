import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import VoyagerDashboard from "@/components/dashboards/VoyagerDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import ManagerDashboard from "@/components/dashboards/ManagerDashboard";
import HeadCookDashboard from "@/components/dashboards/HeadCookDashboard";
import SupervisorDashboard from "@/components/dashboards/SupervisorDashboard";
import DashboardLayout from "@/components/layout/DashboardLayout";

const Dashboard = () => {
    const { user, userRole, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) {
            navigate("/auth");
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const renderDashboard = () => {
        switch (userRole) {
            case "admin":
                return <AdminDashboard />;
            case "manager":
                return <ManagerDashboard />;
            case "head_cook":
                return <HeadCookDashboard />;
            case "supervisor":
                return <SupervisorDashboard />;
            case "voyager":
            default:
                return <VoyagerDashboard />;
        }
    };

    return (
        <DashboardLayout>
            {renderDashboard()}
        </DashboardLayout>
    );
};

export default Dashboard;
