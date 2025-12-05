import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Ship, Anchor, User, Shield, Eye, ChefHat, ClipboardList } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().trim().email("Please enter a valid email address").max(255, "Email too long");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(100, "Password too long");
const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long");

const roleInfo = {
    voyager: { label: "Voyager", icon: <User className="h-4 w-4" />, description: "Passenger - Order services and book amenities" },
    admin: { label: "Admin", icon: <Shield className="h-4 w-4" />, description: "Manage items, menus, and voyager registrations" },
    manager: { label: "Manager", icon: <Eye className="h-4 w-4" />, description: "View all bookings and reservations" },
    head_cook: { label: "Head Cook", icon: <ChefHat className="h-4 w-4" />, description: "View and manage catering orders" },
    supervisor: { label: "Supervisor", icon: <ClipboardList className="h-4 w-4" />, description: "View and manage stationery orders" },
};

const Auth = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, signIn, signUp } = useAuth();

    const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState("admin");
    const [secretKey, setSecretKey] = useState("");
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user) {
            navigate("/dashboard");
        }
    }, [user, navigate]);

    const validateForm = () => {
        const newErrors = {};

        try {
            emailSchema.parse(email);
        } catch (e) {
            if (e instanceof z.ZodError) {
                newErrors.email = e.errors[0].message;
            }
        }

        try {
            passwordSchema.parse(password);
        } catch (e) {
            if (e instanceof z.ZodError) {
                newErrors.password = e.errors[0].message;
            }
        }

        if (isSignUp) {
            try {
                nameSchema.parse(fullName);
            } catch (e) {
                if (e instanceof z.ZodError) {
                    newErrors.fullName = e.errors[0].message;
                }
            }

            if (role !== "voyager") {
                const adminSecret = import.meta.env.VITE_ADMIN_SECRET_KEY;
                if (secretKey !== adminSecret) {
                    newErrors.secretKey = "Invalid secret key for privileged role";
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await signUp(email, password, fullName, role, secretKey.trim());
                if (error) {
                    if (error.message.includes("already registered")) {
                        toast.error("This email is already registered. Please sign in instead.");
                    } else {
                        toast.error(error.message);
                    }
                } else {
                    toast.success("Account created successfully! Please sign in.");
                    setIsSignUp(false); // Switch to Sign In mode
                    setErrors({});
                    setPassword(""); // Clear password for security
                }
            } else {
                const { error } = await signIn(email, password);
                if (error) {
                    if (error.message.includes("Invalid login")) {
                        toast.error("Invalid email or password. Please try again.");
                    } else {
                        toast.error(error.message);
                    }
                } else {
                    toast.success("Welcome back!");
                    navigate("/dashboard");
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen ocean-gradient flex items-center justify-center p-6">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <Link to="/" className="flex items-center justify-center gap-3 mb-8">
                    <img src="/logo.jpg" alt="Logo" className="h-12 w-12 object-contain" />
                    <span className="text-2xl font-serif font-bold text-primary-foreground">
                        Cruise Ship Management
                    </span>
                </Link>

                <Card variant="glass" className="backdrop-blur-xl bg-card/95">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                            <Anchor className="h-8 w-8 text-accent" />
                        </div>
                        <CardTitle className="text-2xl">
                            {isSignUp ? "Create Account" : "Welcome Back"}
                        </CardTitle>
                        <CardDescription>
                            {isSignUp
                                ? "Join us for an unforgettable voyage"
                                : "Sign in to access your cruise services"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isSignUp && (
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className={errors.fullName ? "border-destructive" : ""}
                                    />
                                    {errors.fullName && (
                                        <p className="text-sm text-destructive">{errors.fullName}</p>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={errors.email ? "border-destructive" : ""}
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={errors.password ? "border-destructive" : ""}
                                />
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password}</p>
                                )}
                            </div>

                            {isSignUp && (
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select value={role} onValueChange={(value) => setRole(value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select your role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(roleInfo).map(([key, { label, icon, description }]) => (
                                                <SelectItem key={key} value={key}>
                                                    <div className="flex items-center gap-2">
                                                        {icon}
                                                        <div>
                                                            <span className="font-medium">{label}</span>
                                                            <span className="text-xs text-muted-foreground ml-2">
                                                                {description}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {isSignUp && role !== "voyager" && (
                                <div className="space-y-2">
                                    <Label htmlFor="secretKey">Secret Key</Label>
                                    <Input
                                        id="secretKey"
                                        type="password"
                                        placeholder="Enter admin secret key"
                                        value={secretKey}
                                        onChange={(e) => setSecretKey(e.target.value)}
                                        className={errors.secretKey ? "border-destructive" : ""}
                                    />
                                    {errors.secretKey && (
                                        <p className="text-sm text-destructive">{errors.secretKey}</p>
                                    )}
                                </div>
                            )}

                            <Button
                                type="submit"
                                variant="ocean"
                                size="lg"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setErrors({});
                                }}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {isSignUp
                                    ? "Already have an account? Sign in"
                                    : "Don't have an account? Sign up"}
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Auth;
