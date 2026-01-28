const GridOverlay = () => {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
            {/* Grid Pattern */}
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage: `
            linear-gradient(hsl(187 100% 48% / 0.03) 1px, transparent 1px),
            linear-gradient(90deg, hsl(187 100% 48% / 0.03) 1px, transparent 1px)
          `,
                    backgroundSize: '60px 60px',
                }}
            />

            {/* Scan Line */}
            <div
                className="absolute left-0 right-0 h-px animate-scan-line"
                style={{
                    background: 'linear-gradient(90deg, transparent, hsl(187 100% 48% / 0.5), transparent)',
                    boxShadow: '0 0 30px 10px hsl(187 100% 48% / 0.2)',
                }}
            />

            {/* Vignette */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 0%, hsl(222 47% 4% / 0.8) 100%)',
                }}
            />

            {/* Corner Accents */}
            <div className="absolute top-4 left-4 w-20 h-20 border-l-2 border-t-2 border-primary/30" />
            <div className="absolute top-4 right-4 w-20 h-20 border-r-2 border-t-2 border-primary/30" />
            <div className="absolute bottom-4 left-4 w-20 h-20 border-l-2 border-b-2 border-primary/30" />
            <div className="absolute bottom-4 right-4 w-20 h-20 border-r-2 border-b-2 border-primary/30" />
        </div>
    );
};

export default GridOverlay;
