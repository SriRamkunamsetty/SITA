import { cn } from '../lib/utils';

const StatusIndicator = ({ status, label, className, pulse = true }) => {
    const statusColors = {
        online: 'bg-success',
        processing: 'bg-primary',
        warning: 'bg-warning',
        error: 'bg-destructive',
        offline: 'bg-muted-foreground',
    };

    const glowColors = {
        online: 'shadow-[0_0_10px_hsl(160_100%_45%_/_0.8)]',
        processing: 'shadow-[0_0_10px_hsl(187_100%_48%_/_0.8)]',
        warning: 'shadow-[0_0_10px_hsl(45_100%_50%_/_0.8)]',
        error: 'shadow-[0_0_10px_hsl(340_100%_60%_/_0.8)]',
        offline: '',
    };

    return (
        <div className={cn('flex items-center gap-2', className)}>
            <div
                className={cn(
                    'w-2 h-2 rounded-full',
                    statusColors[status],
                    glowColors[status],
                    pulse && status !== 'offline' && 'animate-pulse'
                )}
            />
            {label && (
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    {label}
                </span>
            )}
        </div>
    );
};

export default StatusIndicator;
