import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);

                // Defer role fetching
                if (session?.user) {
                    setTimeout(() => {
                        fetchUserRole(session.user.id);
                    }, 0);
                } else {
                    setUserRole(null);
                }
            }
        );

        // THEN check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                fetchUserRole(session.user.id);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserRole = async (userId) => {
        console.log("Fetching role for user:", userId);
        const { data, error } = await supabase
            .from('user_roles')
            .select('*') // Select all columns to be sure
            .eq('id', userId)
            .maybeSingle();

        console.log("Role fetch result:", { data, error });

        if (error) {
            console.error("Error fetching role:", error);
        }

        if (data) {
            console.log("Setting user role to:", data.role);
            setUserRole(data.role);
        } else {
            console.warn("No role found for user, defaulting to null (Voyager)");
        }
    };

    const signIn = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error };
    };

    const signUp = async (email, password, fullName, role, secretKey) => {
        // ALERT: Debugging step to confirm what is being sent
        alert(`Sending Signup Request:\nRole: ${role}\nKey: ${secretKey}`);

        console.log("Attempting signup:", { email, role, secretKey });
        const redirectUrl = window.location.origin;

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: redirectUrl,
                data: {
                    full_name: fullName,
                    role: role,
                    secret_key: secretKey,
                },
            },
        });

        if (error) return { error };

        // If Supabase auto-logged us in (because email confirmation is off),
        // we sign out immediately so the user has to log in manually as requested.
        if (data?.session) {
            await supabase.auth.signOut();
        }

        return { data, error: null };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setUserRole(null);
    };

    return (
        <AuthContext.Provider value={{ user, session, userRole, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
