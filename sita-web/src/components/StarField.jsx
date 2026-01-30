import { useEffect, useRef } from 'react';

const StarField = () => {
    const canvasRef = useRef(null);
    const starsRef = useRef([]);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Initialize stars
        const starCount = 75;
        starsRef.current = Array.from({ length: starCount }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            z: Math.random() * 1000,
            size: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.8 + 0.2,
        }));

        // Mouse tracking
        const handleMouseMove = (e) => {
            mouseRef.current = {
                x: (e.clientX - canvas.width / 2) * 0.02,
                y: (e.clientY - canvas.height / 2) * 0.02,
            };
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Animation loop
        let animationId;
        const animate = () => {
            ctx.fillStyle = 'rgba(10, 10, 20, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            starsRef.current.forEach((star) => {
                // Move stars toward camera
                star.z -= 0.5;
                if (star.z <= 0) {
                    star.z = 1000;
                    star.x = Math.random() * canvas.width;
                    star.y = Math.random() * canvas.height;
                }

                // Project to 2D with perspective
                const perspective = 800 / star.z;
                const x = (star.x - canvas.width / 2) * perspective + canvas.width / 2 + mouseRef.current.x * (1000 - star.z) * 0.01;
                const y = (star.y - canvas.height / 2) * perspective + canvas.height / 2 + mouseRef.current.y * (1000 - star.z) * 0.01;

                // Skip if outside viewport
                if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return;

                // Draw star with glow
                const size = star.size * perspective * 0.5;
                const opacity = star.opacity * (1 - star.z / 1000);

                // Outer glow
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
                gradient.addColorStop(0, `rgba(0, 245, 255, ${opacity * 0.5})`);
                gradient.addColorStop(0.5, `rgba(0, 245, 255, ${opacity * 0.1})`);
                gradient.addColorStop(1, 'rgba(0, 245, 255, 0)');

                ctx.beginPath();
                ctx.arc(x, y, size * 3, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                // Core
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.fill();
            });

            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: 0 }}
        />
    );
};

export default StarField;
