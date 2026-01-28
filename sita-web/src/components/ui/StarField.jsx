import { useEffect, useRef } from 'react';

export default function StarField() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resize);
        resize();

        const stars = Array.from({ length: 200 }).map(() => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            z: Math.random() * 2 + 0.5, // Depth factor
            size: Math.random() * 1.5,
        }));

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#06b6d4'; // brand-neon

            stars.forEach(star => {
                // Move star
                star.y -= star.z * 0.5; // Upward float

                // Reset if out of bounds
                if (star.y < 0) {
                    star.y = canvas.height;
                    star.x = Math.random() * canvas.width;
                }

                // Parallax shift based on mouse (optional simple version)
                // drawing
                ctx.globalAlpha = (Math.random() * 0.5 + 0.5) * (star.z / 2); // sparkle & depth dimming
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size * star.z, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0 opacity-40 mix-blend-screen"
        />
    );
}
