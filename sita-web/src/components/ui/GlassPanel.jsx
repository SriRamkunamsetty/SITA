import { cn } from '../../lib/utils';

const GlassPanel = ({ children, className, glow = false, corners = false, style }) => {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-lg',
                glow && 'animate-pulse-glow',
                className
            )}
            style={{
                background: 'hsl(220 40% 8% / 0.6)',
                border: '1px solid hsl(187 100% 48% / 0.15)',
                backdropFilter: 'blur(20px)',
                ...style,
            }}
        >
            {/* Noise Texture */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Corner Accents */}
            {corners && (
                <>
                    <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-primary/50" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-primary/50" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-primary/50" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-primary/50" />
                </>
            )}

            {/* Content */}
            <div className="relative z-10">{children}</div>
        </div>
    );
};

export default GlassPanel;
