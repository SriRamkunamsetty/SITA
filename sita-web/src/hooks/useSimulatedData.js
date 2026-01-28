import { useState, useEffect } from 'react';

export function useSimulatedData() {
    const [stats, setStats] = useState({
        scanned: 1240,
        speed: 45,
        congestion: 12
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({
                scanned: prev.scanned + Math.floor(Math.random() * 3),
                speed: Math.max(20, Math.min(80, prev.speed + (Math.random() - 0.5) * 5)),
                congestion: Math.max(0, Math.min(100, prev.congestion + (Math.random() - 0.5) * 2))
            }));
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return stats;
}
