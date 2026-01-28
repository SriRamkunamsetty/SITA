import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, User, Phone, FileText, Shield, Mail, Lock, Globe } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { useToast } from '../context/ToastContext';
import StarField from '../components/StarField';
import GridOverlay from '../components/GridOverlay';
import GlassPanel from '../components/ui/GlassPanel';
import NeonButton from '../components/ui/NeonButton';
import StatusIndicator from '../components/StatusIndicator';
import { cn } from '../lib/utils';

const steps = [
    { id: 1, label: 'IDENTITY', icon: User },
    { id: 2, label: 'CONTACT', icon: Phone },
    { id: 3, label: 'PURPOSE', icon: FileText },
    { id: 4, label: 'ETHICS', icon: Shield },
];

const countryCodes = [
    { code: '+1', flag: '🇺🇸', name: 'USA' },
    { code: '+44', flag: '🇬🇧', name: 'UK' },
    { code: '+91', flag: '🇮🇳', name: 'India' },
    { code: '+81', flag: '🇯🇵', name: 'Japan' },
    { code: '+49', flag: '🇩🇪', name: 'Germany' },
    { code: '+33', flag: '🇫🇷', name: 'France' },
    { code: '+86', flag: '🇨🇳', name: 'China' },
    { code: '+61', flag: '🇦🇺', name: 'Australia' },
];

const AccessGate = () => {
    const navigate = useNavigate();
    const { user, login, refreshUser } = useAuth();
    const { showToast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);

    // Auth State
    const [authMethod, setAuthMethod] = useState('google'); // 'google' | 'email' | 'mobile'
    const [otpState, setOtpState] = useState('input'); // 'input' | 'verify'

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        countryCode: '+1',
        reason: '',
        pledgeAccepted: false,
        otp: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    // --- Actions ---

    const handleGoogleSuccess = async (tokenResponse) => {
        try {
            setIsLoading(true);
            const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            }).then(res => res.json());

            setFormData(prev => ({
                ...prev,
                name: userInfo.name,
                email: userInfo.email
            }));

            await login(userInfo.email, userInfo);
            showToast(`GREETINGS, ${userInfo.given_name || 'AGENT'}. ACCESS GRANTED.`, "success");
            setCurrentStep(2);
        } catch (error) {
            console.error("Google Login Failed", error);
            showToast("GOOGLE AUTHENTICATION FAILURE", "error");
            setMessage("Authentication failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const googleLogin = useGoogleLogin({ onSuccess: handleGoogleSuccess });

    const sendOtp = async () => {
        setMessage('');

        // Validation
        if (authMethod === 'email' && !formData.email.includes('@')) {
            setMessage("Invalid email address.");
            return;
        }
        if (authMethod === 'mobile' && formData.phone.length < 8) {
            setMessage("Invalid mobile number.");
            return;
        }

        setIsLoading(true);
        try {
            const payload = authMethod === 'email'
                ? { email: formData.email }
                : { phone: formData.phone, country_code: formData.countryCode };

            const res = await apiRequest('/auth/otp/send', 'POST', payload);
            setOtpState('verify');
            showToast("SECURITY PROTOCOL DISPATCHED", "info");
            setMessage(res.message || "Access Protocol Dispatched.");
        } catch (e) {
            showToast("PROTOCOL DISPATCH FAILED", "error");
            setMessage("Failed to initialize security protocol.");
        } finally {
            setIsLoading(false);
        }
    };

    const verifyOtp = async () => {
        setIsLoading(true);
        try {
            const payload = {
                code: formData.otp,
                ...(authMethod === 'email' ? { email: formData.email } : { phone: formData.phone, country_code: formData.countryCode })
            };

            const user = await apiRequest('/auth/otp/verify', 'POST', payload);

            // Login with returned user data
            await login(user.email, user);
            showToast("IDENTITY VERIFIED. WELCOME AGENT.", "success");

            setFormData(prev => ({
                ...prev,
                name: user.name || 'Agent',
                email: user.email // Sync the unique identifier (email or phone)
            }));
            setCurrentStep(2);
        } catch (e) {
            showToast("INVALID SECURITY CODE", "error");
            setMessage("Invalid code.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalSubmit = async () => {
        setIsLoading(true);
        try {
            const userIdentifier = user?.email || formData.email;

            await apiRequest('/user/onboard', 'POST', {
                email: userIdentifier,
                name: formData.name,
                phone: formData.phone,
                country_code: formData.countryCode,
                reason: formData.reason
            });

            // Refresh local user state before navigating
            await refreshUser();
            showToast("PROFILE ENCRYPTED AND SYNCED", "success");
            navigate('/verification');
        } catch (e) {
            // Error handled by Toast
        } finally {
            setIsLoading(false);
        }
    };

    // --- Navigation Handlers ---

    const isStepValid = () => {
        switch (currentStep) {
            case 1:
                // Handled inside component for OTP/Google
                return false;
            case 2:
                return formData.name.length >= 2 && formData.phone.length >= 5;
            case 3:
                return formData.reason.length > 20;
            case 4:
                return formData.pledgeAccepted;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (currentStep < 4) setCurrentStep(prev => prev + 1);
        else handleFinalSubmit();
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
        else navigate('/');
    };

    // --- Renderers ---

    const renderStep1 = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
                <h2 className="font-orbitron text-lg font-semibold text-primary mb-2">
                    IDENTITY CONFIRMATION
                </h2>

                {/* Auth Toggle */}
                <div className="flex bg-muted/20 p-1 rounded-lg border border-border/50 max-w-sm mx-auto mb-4 overflow-x-auto">
                    <button
                        onClick={() => { setAuthMethod('google'); setMessage(''); setOtpState('input'); setFormData(p => ({ ...p, otp: '' })); }}
                        className={cn("flex-1 py-1 px-3 text-xs font-mono rounded transition-all whitespace-nowrap", authMethod === 'google' ? 'bg-primary/20 text-primary' : 'text-muted-foreground')}
                    >
                        GOOGLE
                    </button>
                    <button
                        onClick={() => { setAuthMethod('email'); setMessage(''); setOtpState('input'); setFormData(p => ({ ...p, otp: '' })); }}
                        className={cn("flex-1 py-1 px-3 text-xs font-mono rounded transition-all whitespace-nowrap", authMethod === 'email' ? 'bg-primary/20 text-primary' : 'text-muted-foreground')}
                    >
                        EMAIL OTP
                    </button>
                    <button
                        onClick={() => { setAuthMethod('mobile'); setMessage(''); setOtpState('input'); setFormData(p => ({ ...p, otp: '' })); }}
                        className={cn("flex-1 py-1 px-3 text-xs font-mono rounded transition-all whitespace-nowrap", authMethod === 'mobile' ? 'bg-primary/20 text-primary' : 'text-muted-foreground')}
                    >
                        MOBILE OTP
                    </button>
                </div>
            </div>

            {authMethod === 'google' ? (
                <button
                    className="w-full p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/30 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50"
                    onClick={() => googleLogin()}
                    disabled={isLoading}
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="font-mono text-sm">{isLoading ? 'Authenticating...' : 'Continue with Google'}</span>
                </button>
            ) : (
                <div className="space-y-4">
                    {otpState === 'input' ? (
                        <>
                            {authMethod === 'email' ? (
                                <div>
                                    <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                                        Agent Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="agent@sita.ai"
                                            className="w-full p-3 pl-10 bg-muted/30 border border-border rounded-lg font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 text-white"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-2">
                                    <div className="col-span-1">
                                        <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                                            Code
                                        </label>
                                        <select
                                            value={formData.countryCode}
                                            onChange={(e) => setFormData(prev => ({ ...prev, countryCode: e.target.value }))}
                                            className="w-full p-3 bg-muted/30 border border-border rounded-lg font-mono text-xs appearance-none focus:border-primary focus:outline-none text-white"
                                        >
                                            {countryCodes.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-3">
                                        <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                                            Mobile Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                            placeholder="MOBILE NUMBER"
                                            className="w-full p-3 bg-muted/30 border border-border rounded-lg font-mono text-sm focus:border-primary focus:outline-none text-white"
                                        />
                                    </div>
                                </div>
                            )}
                            <NeonButton onClick={sendOtp} disabled={isLoading} className="w-full">
                                {isLoading ? 'INITIALIZING...' : 'GET OTP'}
                            </NeonButton>
                        </>
                    ) : (
                        <>
                            <div className="text-center relative">
                                <p className="font-mono text-[10px] text-primary mb-4">
                                    {authMethod === 'email' ? `CODE SENT TO: ${formData.email}` : `SMS DISPATCHED TO: ${formData.countryCode}${formData.phone}`}
                                </p>

                                {/* DEV ONLY REVEAL */}
                                {message.includes('DEV_MODE') && (
                                    <div className="mb-4 p-4 border border-dashed border-primary/50 bg-primary/5 rounded-lg animate-pulse">
                                        <p className="font-orbitron text-[10px] text-primary mb-1">LOCAL BYPASS ACTIVE</p>
                                        <p className="font-mono text-xl font-bold text-white tracking-widest">
                                            {message.match(/\d{6}/)?.[0] || 'REFETCHING...'}
                                        </p>
                                    </div>
                                )}

                                <input
                                    type="text"
                                    maxLength="6"
                                    value={formData.otp}
                                    onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value }))}
                                    placeholder="000000"
                                    className="w-full p-4 bg-muted/30 border border-border rounded-lg font-mono text-2xl text-center tracking-[1rem] focus:border-primary focus:outline-none text-white"
                                />
                            </div>
                            <NeonButton onClick={verifyOtp} disabled={isLoading} className="w-full">
                                {isLoading ? 'AUTHENTICATING...' : 'AUTHORIZE ACCESS'}
                            </NeonButton>
                            <button
                                onClick={() => setOtpState('input')}
                                className="w-full text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
                            >
                                Change credentials
                            </button>
                        </>
                    )}
                    {message && (
                        <div className="p-3 bg-warning/10 border border-warning/30 rounded text-center">
                            <p className="text-[10px] font-mono text-warning uppercase">{message}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
                <h2 className="font-orbitron text-lg font-semibold text-primary mb-2">
                    SECURE CONTACT
                </h2>
                <p className="font-mono text-xs text-muted-foreground">
                    VERIFIED COMMUNICATION ENDPOINT
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                        Agent Full Name
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="ENTER FULL NAME"
                        className="w-full p-3 bg-muted/30 border border-border rounded-lg font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 text-white"
                    />
                </div>

                <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-1">
                        <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                            Region
                        </label>
                        <div className="relative">
                            <select
                                value={formData.countryCode}
                                onChange={(e) => setFormData(prev => ({ ...prev, countryCode: e.target.value }))}
                                className="w-full p-3 bg-muted/30 border border-border rounded-lg font-mono text-sm appearance-none focus:border-primary focus:outline-none text-white"
                            >
                                {countryCodes.map(c => (
                                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="col-span-3">
                        <label className="font-mono text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                            Mobile Number
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="555-0123"
                            className="w-full p-3 bg-muted/30 border border-border rounded-lg font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 text-white"
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 bg-muted/10 border border-border/50 rounded-lg flex gap-3">
                <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="font-mono text-xs text-muted-foreground">
                    Connecting to secure node in {countryCodes.find(c => c.code === formData.countryCode)?.name || 'Unknown'}.
                    End-to-end encryption enabled.
                </p>
            </div>

            <div className="flex justify-end pt-4">
                <NeonButton onClick={handleNext} disabled={!isStepValid()}>
                    CONTINUE <ArrowRight className="w-4 h-4 ml-2" />
                </NeonButton>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <StarField />
            <GridOverlay />

            <div className="w-full max-w-lg relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <StatusIndicator status="processing" label="AGENT VERIFICATION" className="justify-center mb-4" />
                    <h1 className="font-orbitron text-2xl md:text-3xl font-bold mb-2">
                        ACCESS <span className="text-primary">GATE</span>
                    </h1>
                </div>

                {/* Steps Header (Simplified) */}
                <div className="flex items-center justify-between mb-8 px-8">
                    {steps.map((step) => (
                        <div key={step.id} className="flex flex-col items-center gap-2">
                            <div className={cn(
                                "w-2 h-2 rounded-full transition-all",
                                currentStep >= step.id ? "bg-primary shadow-[0_0_10px_currentColor]" : "bg-muted"
                            )} />
                            <span className={cn(
                                "text-[10px] font-mono tracking-widest",
                                currentStep === step.id ? "text-primary" : "text-muted-foreground"
                            )}>{step.label}</span>
                        </div>
                    ))}
                </div>

                <GlassPanel className="p-8 relative overflow-hidden" corners>
                    {/* Content render based on step, customized for first 2 steps */}
                    {currentStep === 1 ? renderStep1() :
                        currentStep === 2 ? renderStep2() :
                            (
                                // Standard Flow for Step 3 & 4 (Reusing similar logic but inline for brevity)
                                <div className="space-y-6 animate-fade-in">
                                    {currentStep === 3 && (
                                        <>
                                            <div className="text-center mb-6">
                                                <h2 className="font-orbitron text-lg font-semibold text-primary mb-2">MISSION BRIEF</h2>
                                                <p className="font-mono text-xs text-muted-foreground">STATE OPERATIONAL INTENT</p>
                                            </div>
                                            <textarea
                                                value={formData.reason}
                                                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                                placeholder="Authorized mission details..."
                                                rows={5}
                                                className="w-full p-3 bg-muted/30 border border-border rounded-lg font-mono text-sm text-white resize-none focus:border-primary focus:outline-none"
                                            />
                                            <div className="flex justify-end">
                                                <NeonButton onClick={handleNext} disabled={!isStepValid()}>CONTINUE <ArrowRight className="w-4 h-4 ml-2" /></NeonButton>
                                            </div>
                                        </>
                                    )}

                                    {currentStep === 4 && (
                                        <>
                                            <div className="text-center mb-6">
                                                <h2 className="font-orbitron text-lg font-semibold text-primary mb-2">ETHICS PROTOCOL</h2>
                                                <p className="font-mono text-xs text-muted-foreground">MANDATORY COMPLIANCE CHECK</p>
                                            </div>
                                            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg mb-4">
                                                <div className="flex items-center gap-2 text-destructive mb-2">
                                                    <Shield className="w-4 h-4" />
                                                    <span className="font-semibold font-orbitron text-xs">RESTRICTED ACCESS</span>
                                                </div>
                                                <p className="font-mono text-xs text-muted-foreground">
                                                    By proceeding, you agree to the SITA Surveillance Accord.
                                                    All actions are logged. Misuse will result in immediate termination.
                                                </p>
                                            </div>
                                            <label
                                                onClick={() => setFormData(prev => ({ ...prev, pledgeAccepted: !prev.pledgeAccepted }))}
                                                className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded transition-colors"
                                            >
                                                <div className={cn("w-5 h-5 rounded border flex items-center justify-center", formData.pledgeAccepted ? "bg-primary border-primary" : "border-muted-foreground")}>
                                                    {formData.pledgeAccepted && <Check className="w-3 h-3 text-black" />}
                                                </div>
                                                <span className="font-mono text-sm text-white uppercase tracking-wider">I ACCEPT PROTOCOL</span>
                                            </label>
                                            <div className="flex justify-between pt-6">
                                                <button onClick={handleBack} className="text-muted-foreground hover:text-white font-mono text-sm">BACK</button>
                                                <NeonButton onClick={handleNext} disabled={!isStepValid() || isLoading}>
                                                    {isLoading ? 'INITIALIZING...' : 'GRANT ACCESS'} <Lock className="w-4 h-4 ml-2" />
                                                </NeonButton>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )
                    }
                </GlassPanel>
            </div>
        </div>
    );
};

export default AccessGate;
