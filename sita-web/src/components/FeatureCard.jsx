import GlassPanel from './ui/GlassPanel';
import { cn } from '../lib/utils';

const FeatureCard = ({ icon, title, description, index = 0 }) => {
    return (
        <GlassPanel
            className={cn(
                'p-6 md:p-8 opacity-0 animate-fade-in-up group',
                'hover:border-primary/30 transition-all duration-500'
            )}
            style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'forwards' }}
            corners
        >
            <div className="text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="font-orbitron text-lg md:text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
                {title}
            </h3>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {description}
            </p>
        </GlassPanel>
    );
};

export default FeatureCard;
