import { motion } from 'framer-motion';

export default function AnimatedInput({ type = "text", placeholder, value, onChange, label, required }) {
    return (
        <div className="relative group mb-6">
            <label className="block text-brand-neon/70 text-xs font-mono mb-2 uppercase tracking-wider">
                {label} {required && <span className="text-brand-alert">*</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                required={required}
                className="input-field peer"
                placeholder=" "
            />
            {/* Animated Underline */}
            <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-brand-neon transition-all duration-500 peer-focus:w-full" />

            {!value && (
                <div className="absolute top-[38px] left-4 text-slate-600 text-sm pointer-events-none transition-all peer-focus:opacity-0">
                    {placeholder}
                </div>
            )}
        </div>
    );
}
