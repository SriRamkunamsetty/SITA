import { cn } from '../../lib/utils';

const NeonButton = ({
    children,
    onClick,
    className,
    disabled = false,
    variant = 'primary',
    size = 'md',
    type = 'button'
}) => {
    const sizeClasses = {
        sm: 'px-4 py-2 text-xs',
        md: 'px-8 py-3 text-sm',
        lg: 'px-12 py-4 text-base',
    };

    const variantClasses = {
        primary: 'border-primary text-primary hover:shadow-[0_0_30px_hsl(187_100%_48%_/_0.5)]',
        secondary: 'border-muted-foreground text-muted-foreground hover:border-primary hover:text-primary',
        danger: 'border-destructive text-destructive hover:shadow-[0_0_30px_hsl(340_100%_60%_/_0.5)]',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'relative font-orbitron font-semibold uppercase tracking-[0.2em] transition-[transform,box-shadow,opacity,background-color] duration-300',
                'border bg-transparent rounded-sm',
                'hover:translate-y-[-2px]',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none',
                'group overflow-hidden',
                sizeClasses[size],
                variantClasses[variant],
                className
            )}
        >
            {/* Hover Gradient Overlay */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: variant === 'primary'
                        ? 'linear-gradient(135deg, hsl(187 100% 48% / 0.15), transparent)'
                        : variant === 'danger'
                            ? 'linear-gradient(135deg, hsl(340 100% 60% / 0.15), transparent)'
                            : 'linear-gradient(135deg, hsl(220 30% 50% / 0.15), transparent)',
                }}
            />

            {/* Text Glow */}
            <span
                className="relative z-10"
                style={{
                    textShadow: variant === 'primary'
                        ? '0 0 10px hsl(187 100% 48% / 0.5)'
                        : variant === 'danger'
                            ? '0 0 10px hsl(340 100% 60% / 0.5)'
                            : 'none',
                }}
            >
                {children}
            </span>
        </button>
    );
};

export default NeonButton;
