import { useRef, useState, useEffect } from 'react';
import { cn } from '../lib/utils';

const Hero3D = () => {
    const containerRef = useRef(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const rotateX = ((e.clientY - centerY) / rect.height) * 15;
            const rotateY = ((e.clientX - centerX) / rect.width) * 15;

            setRotation({ x: -rotateX, y: rotateY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative"
            style={{ perspective: '1000px' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className="transition-transform duration-200 ease-out"
                style={{
                    transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                    transformStyle: 'preserve-3d',
                }}
            >
                {/* SITA Title */}
                <h1
                    className={cn(
                        'font-orbitron text-[12vw] md:text-[10vw] lg:text-[8vw] font-black tracking-[0.2em] text-primary',
                        'transition-all duration-300',
                        isHovered && 'text-glow'
                    )}
                    style={{
                        textShadow: `
              0 0 20px hsl(187 100% 48% / 0.5),
              0 0 40px hsl(187 100% 48% / 0.3),
              0 0 80px hsl(187 100% 48% / 0.2)
            `,
                        transform: 'translateZ(50px)',
                    }}
                >
                    SITA
                </h1>

                {/* Subtitle */}
                <p
                    className="font-orbitron text-sm md:text-base lg:text-lg tracking-[0.5em] text-muted-foreground mt-4"
                    style={{ transform: 'translateZ(30px)' }}
                >
                    SMART INTELLIGENT TRAFFIC ANALYZER
                </p>

                {/* Decorative Elements */}
                <div
                    className="absolute -inset-10 border border-primary/20 rounded-lg opacity-50"
                    style={{ transform: 'translateZ(-20px)' }}
                />
                <div
                    className="absolute -inset-20 border border-primary/10 rounded-lg opacity-30"
                    style={{ transform: 'translateZ(-40px)' }}
                />
            </div>

            {/* Floating Particles Around Title */}
            {[...Array(6)].map((_, i) => (
                <div
                    key={i}
                    className="absolute w-1 h-1 bg-primary rounded-full animate-float opacity-60"
                    style={{
                        top: `${20 + Math.random() * 60}%`,
                        left: `${10 + Math.random() * 80}%`,
                        animationDelay: `${i * 0.5}s`,
                        animationDuration: `${4 + Math.random() * 2}s`,
                    }}
                />
            ))}
        </div>
    );
};

export default Hero3D;
