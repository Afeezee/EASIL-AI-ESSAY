import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@/api/entities";
import { getStoredUser } from "@/api/base44Client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // Optimistically hydrate from the last known user, then confirm with the server.
    const [user, setUser] = useState(() => getStoredUser());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const me = await User.me();
                if (active) setUser(me);
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, []);

    const login = useCallback(async (credentials) => {
        const u = await User.login(credentials);
        setUser(u);
        return u;
    }, []);

    const register = useCallback(async (details) => {
        const u = await User.register(details);
        setUser(u);
        return u;
    }, []);

    const logout = useCallback(() => {
        User.logout();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
}
