import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ship, Utensils, ShoppingBag, Film, Scissors, Dumbbell, PartyPopper, Anchor, Waves, Star } from "lucide-react";
import heroCruise from "@/assets/hero-cruise.jpg";
import { useAuth } from "@/lib/auth";

const Index = () => {
    const { user, userRole } = useAuth();

    const features = [
        {
            icon: Utensils,
            title: "Catering Services",
            description: "Order gourmet meals, snacks, and beverages delivered to your cabin",
        },
        {
            icon: ShoppingBag,
            title: "Stationery Shop",
            description: "Browse gift items, chocolates, books, and souvenirs",
        },
        {
            icon: Film,
            title: "Resort Movies",
            description: "Book tickets for exclusive screenings in our luxury cinema",
        },
        {
            icon: Scissors,
            title: "Beauty Salon",
            description: "Premium spa and beauty treatments by expert stylists",
        },
        {
            icon: Dumbbell,
            title: "Fitness Center",
            description: "State-of-the-art equipment and personal training sessions",
        },
        {
            icon: PartyPopper,
            title: "Party Hall",
            description: "Celebrate special occasions with stunning ocean views",
        },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="relative h-[90vh] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${heroCruise})` }}
                />
                <div className="absolute inset-0 hero-gradient" />

                {/* Navigation */}
                <nav className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12">
                    <div className="flex items-center gap-3">
                        <Ship className="h-8 w-8 text-accent" />
                        <span className="text-xl font-serif font-bold text-primary-foreground">
                            Oceanic Voyages
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <Link to="/dashboard">
                                <Button variant="hero" size="lg">
                                    Go to Dashboard
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link to="/auth">
                                    <Button variant="glass" size="lg">
                                        Sign In
                                    </Button>
                                </Link>
                                <Link to="/auth?mode=signup">
                                    <Button variant="hero" size="lg">
                                        Join Now
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </nav>

                {/* Hero Content */}
                <div className="relative z-10 flex h-[calc(100%-80px)] flex-col items-center justify-center px-6 text-center">
                    <div className="animate-float mb-6">
                        <Anchor className="h-16 w-16 text-accent" />
                    </div>
                    <h1 className="mb-6 text-5xl font-bold text-primary-foreground md:text-7xl font-serif animate-fade-in">
                        Experience Luxury
                        <span className="block text-accent">At Sea</span>
                    </h1>
                    <p className="mb-8 max-w-2xl text-lg text-primary-foreground/90 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                        Your complete cruise companion. Order services, book amenities, and make the most of your voyage with our seamless digital experience.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.4s" }}>
                        <Link to={user ? "/dashboard" : "/auth?mode=signup"}>
                            <Button variant="hero" size="xl">
                                Start Your Journey
                            </Button>
                        </Link>
                        <Button variant="glass" size="xl" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                            Explore Services
                        </Button>
                    </div>
                </div>

                {/* Wave decoration */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                        <path
                            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
                            fill="hsl(var(--background))"
                        />
                    </svg>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-6 lg:px-12">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Star className="h-5 w-5 text-accent" />
                            <span className="text-sm font-semibold text-accent uppercase tracking-wider">Premium Services</span>
                            <Star className="h-5 w-5 text-accent" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold font-serif mb-4">
                            Everything You Need
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            From dining to entertainment, we bring all ship services to your fingertips
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <Card
                                key={feature.title}
                                variant="elevated"
                                className="group cursor-pointer animate-fade-in"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <CardHeader>
                                    <div className="w-14 h-14 rounded-xl ocean-gradient flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <feature.icon className="h-7 w-7 text-primary-foreground" />
                                    </div>
                                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                                    <CardDescription>{feature.description}</CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 lg:px-12 ocean-gradient">
                <div className="max-w-4xl mx-auto text-center">
                    <Waves className="h-12 w-12 text-accent mx-auto mb-6 animate-wave" />
                    <h2 className="text-4xl md:text-5xl font-bold font-serif text-primary-foreground mb-6">
                        Ready to Set Sail?
                    </h2>
                    <p className="text-primary-foreground/90 mb-8 text-lg">
                        Join thousands of voyagers enjoying seamless cruise experiences
                    </p>
                    <Link to={user ? "/dashboard" : "/auth?mode=signup"}>
                        <Button variant="gold" size="xl">
                            {user ? "Go to Dashboard" : "Create Your Account"}
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-primary py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <Ship className="h-6 w-6 text-accent" />
                        <span className="text-lg font-serif font-semibold text-primary-foreground">
                            Oceanic Voyages
                        </span>
                    </div>
                    <p className="text-primary-foreground/70 text-sm">
                        © 2024 Oceanic Voyages. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Index;
