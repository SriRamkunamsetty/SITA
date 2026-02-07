import { useEffect, useRef } from 'react';

const StarField = () => {
    const canvasRef = useRef(null);
    const starsRef = useRef([]);
    const mouseRef = useRef({ x: 0, y: 0 });
    const starCacheRef = useRef(null);

    // Create cached star sprite
    const getStarCache = () => {
        if (starCacheRef.current) return starCacheRef.current;

        const cacheCanvas = document.createElement('canvas');
        cacheCanvas.width = 50;
        cacheCanvas.height = 50;
        const ctx = cacheCanvas.getContext('2d');

        const x = 25;
        const y = 25;
        const size = 5; // Base radius

        // Outer glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
        gradient.addColorStop(0, `rgba(0, 245, 255, 1)`);
        gradient.addColorStop(0.5, `rgba(0, 245, 255, 0.2)`);
        gradient.addColorStop(1, 'rgba(0, 245, 255, 0)');

        ctx.beginPath();
        ctx.arc(x, y, size * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        starCacheRef.current = cacheCanvas;
        return cacheCanvas;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false }); // Optimization: Disable alpha if not needed (we need it for clear, but maybe?)
        // Actually we need transparency for the stars, so alpha: true (default)

        if (!ctx) return;

        const starSprite = getStarCache();

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Initialize stars
        const starCount = 100; // Increased count since we are more efficient now
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
            // Trail effect (keep this, it's nice)
            ctx.fillStyle = 'rgba(10, 10, 20, 0.2)'; // Slightly reduced trail length (higher alpha = shorter trails)
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            starsRef.current.forEach((star) => {
                // Move stars toward camera
                star.z -= 1.5; // Faster speed for less "lazy" feel
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
                if (x < -50 || x > canvas.width + 50 || y < -50 || y > canvas.height + 50) return;

                // Draw star from cache
                const scale = (star.size * perspective * 0.5) / 5; // Scale relative to sprite base size (5)
                const opacity = star.opacity * (1 - star.z / 1000);

                ctx.globalAlpha = opacity;

                // Draw Image is much faster than gradients
                // Center the sprite (25, 25 is center of 50x50 sprite)
                const sizeW = 50 * scale;
                const sizeH = 50 * scale;

                ctx.drawImage(starSprite, x - sizeW / 2, y - sizeH / 2, sizeW, sizeH);
            });
            ctx.globalAlpha = 1.0; // Reset

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
