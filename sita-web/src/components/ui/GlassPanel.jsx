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
