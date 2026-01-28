import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

const AnimatedCounter = ({
    value,
    duration = 2000,
    className,
    prefix = '',
    suffix = '',
    decimals = 0
}) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const startTime = Date.now();
        const startValue = displayValue;
        const endValue = value;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);

            const currentValue = startValue + (endValue - startValue) * easeOutQuart;
            setDisplayValue(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    return (
        <span className={cn('font-mono tabular-nums', className)}>
            {prefix}{displayValue.toFixed(decimals)}{suffix}
        </span>
    );
};

export default AnimatedCounter;
