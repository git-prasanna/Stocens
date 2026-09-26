import React, { useState, useId } from 'react';
import {
  Boxes,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  KeyRound,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type AuthMode =
  | 'login'
  | 'signup'
  | 'verify_signup_otp'
  | 'reset_request'
  | 'reset_verify'
  | 'reset_new_password'
  | 'reset_success';

interface PasswordEvaluation {
  score: number; // 0 to 4
  label: 'Too Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function evaluatePassword(pass: string): PasswordEvaluation {
  const hasMinLength = (pass || '').length >= 8;
  const hasUppercase = /[A-Z]/.test(pass || '');
  const hasLowercase = /[a-z]/.test(pass || '');
  const hasNumber = /[0-9]/.test(pass || '');
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pass || '');

  const rulesPassed = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  if (!pass) {
    return {
      score: 0,
      label: 'Too Weak',
      color: 'bg-slate-200 text-slate-800',
      hasMinLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecial: false
    };
  }

  if (rulesPassed <= 2 || !hasMinLength) {
    return {
      score: 1,
      label: 'Weak',
      color: 'bg-rose-500 text-rose-900',
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial
    };
  }
  if (rulesPassed === 3) {
    return {
      score: 2,
      label: 'Fair',
      color: 'bg-amber-500 text-amber-900',
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial
    };
  }
  if (rulesPassed === 4) {
    return {
      score: 3,
      label: 'Good',
      color: 'bg-blue-500 text-blue-900',
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial
    };
  }
  return {
    score: 4,
    label: 'Strong',
    color: 'bg-emerald-600 text-emerald-900',
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial
  };
}

export interface AuthModalProps {
  redirectNotice?: string | null;
  onClearNotice?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ redirectNotice, onClearNotice }) => {
  const {
    login,
    signup,
    demoLogin,
    verifySignupOtp,
    resendVerificationOtp,
    forgotPassword,
    verifyResetOtp,
    resetPassword
  } = useAuth();

  const getInitialMode = (): AuthMode => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/signup') return 'signup';
      if (path === '/forgot-password') return 'reset_request';
    }
    return 'login';
  };

  const [mode, setMode] = useState<AuthMode>(getInitialMode);

  // Sync mode with browser back/forward buttons
  React.useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/signup') {
        setMode('signup');
      } else if (path === '/forgot-password') {
        setMode('reset_request');
      } else if (path === '/login') {
        setMode('login');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const switchMode = (newMode: AuthMode) => {
    setError(null);
    setSuccess(null);
    setOtpNotice(null);
    onClearNotice?.();
    setMode(newMode);

    if (typeof window !== 'undefined') {
      if (newMode === 'signup' && window.location.pathname !== '/signup') {
        window.history.pushState(null, '', '/signup');
      } else if (newMode === 'login' && window.location.pathname !== '/login') {
        window.history.pushState(null, '', '/login');
      } else if (newMode === 'reset_request' && window.location.pathname !== '/forgot-password') {
        window.history.pushState(null, '', '/forgot-password');
      }
    }
  };

  // Input states
  const [loginIdentifier, setLoginIdentifier] = useState('alex@stocksense.io');
  const [loginPassword, setLoginPassword] = useState('stocksense123');

  // Signup states
  const [signupName, setSignupName] = useState('');
  const [signupEmailOrPhone, setSignupEmailOrPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupRole, setSignupRole] = useState('Inventory Manager');
  const [signupDepartment, setSignupDepartment] = useState('Logistics & Operations');

  // Password visibility toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  // OTP Verification states
  const [verificationEmail, setVerificationEmail] = useState('');
  const [signupOtp, setSignupOtp] = useState('');
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  // Reset Password states
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Unique IDs for accessibility
  const baseId = useId();
  const loginEmailId = `${baseId}-login-email`;
  const loginPassId = `${baseId}-login-pass`;
  const signupNameId = `${baseId}-signup-name`;
  const signupEmailId = `${baseId}-signup-email`;
  const signupPassId = `${baseId}-signup-pass`;
  const signupConfirmPassId = `${baseId}-signup-confirm-pass`;
  const signupRoleId = `${baseId}-signup-role`;
  const signupDeptId = `${baseId}-signup-dept`;
  const signupOtpId = `${baseId}-signup-otp`;
  const resetEmailId = `${baseId}-reset-email`;
  const resetOtpId = `${baseId}-reset-otp`;
  const resetNewPassId = `${baseId}-reset-new-pass`;
  const resetConfirmPassId = `${baseId}-reset-confirm-pass`;
  const alertId = `${baseId}-status-alert`;

  // Password evaluation
  const signupPassEval = evaluatePassword(signupPassword);
  const resetPassEval = evaluatePassword(newPassword);

  const isSignupMatch = signupPassword && signupConfirmPassword && signupPassword === signupConfirmPassword;
  const isResetMatch = newPassword && confirmNewPassword && newPassword === confirmNewPassword;

  // 1. Handle Login Submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!loginIdentifier.trim()) {
      setError('Please enter your work email or phone number.');
      return;
    }
    if (!loginPassword) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login(loginIdentifier.trim(), loginPassword);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/dashboard');
      }
    } catch (err: any) {
      if (err.requiresVerification || err.message?.includes('pending verification')) {
        setError(err.message || 'Account requires verification before sign-in.');
        setVerificationEmail(err.email || loginIdentifier.trim());
        if (err.otpPreview) {
          setOtpNotice(`Your verification code is: ${err.otpPreview}`);
        }
        setMode('verify_signup_otp');
      } else {
        setError(err.message || 'Invalid email or password. Please verify your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Signup Submit (Creates account and opens OTP confirmation)
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!signupName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!signupEmailOrPhone.trim()) {
      setError('Work email or phone number is required.');
      return;
    }
    if (signupPassEval.score < 4) {
      setError('Please ensure your password meets all required security criteria.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setError("Passwords don't match. Please make sure both password fields are identical.");
      return;
    }

    setLoading(true);
    try {
      const res = await signup({
        name: signupName.trim(),
        email: signupEmailOrPhone.trim(),
        password: signupPassword,
        role: signupRole,
        department: signupDepartment
      });

      setVerificationEmail(res.email);
      setOtpNotice(res.otpPreview ? `Demo Confirmation Code: ${res.otpPreview}` : res.message);
      setMode('verify_signup_otp');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check the provided information.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Verify Signup OTP
  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!signupOtp.trim()) {
      setError('Please enter the 6-digit confirmation code.');
      return;
    }
    if (signupOtp.trim().length !== 6) {
      setError('The confirmation code must be exactly 6 digits.');
      return;
    }

    setLoading(true);
    try {
      await verifySignupOtp(verificationEmail, signupOtp.trim());
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/dashboard');
      }
      // AuthContext sets user and state redirects to Dashboard automatically!
    } catch (err: any) {
      setError(err.message || 'Invalid or expired confirmation code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend Signup OTP
  const handleResendSignupOtp = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await resendVerificationOtp(verificationEmail);
      setOtpNotice(res.otpPreview ? `New Confirmation Code: ${res.otpPreview}` : res.message);
      setSuccess('A fresh 6-digit confirmation code has been generated.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend confirmation code.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Request Password Reset OTP
  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!resetIdentifier.trim()) {
      setError('Please enter your registered email address or phone number.');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(resetIdentifier.trim());
      setResetOtp('');
      setOtpNotice(res.otpPreview ? `Reset Code: ${res.otpPreview}` : res.message);
      setMode('reset_verify');
    } catch (err: any) {
      setError(err.message || 'Failed to generate reset code.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Verify Password Reset OTP
  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!resetOtp.trim()) {
      setError('Please enter the 6-digit reset code.');
      return;
    }
    if (resetOtp.trim().length !== 6) {
      setError('The reset code must be exactly 6 digits.');
      return;
    }

    setLoading(true);
    try {
      await verifyResetOtp(resetIdentifier.trim(), resetOtp.trim());
      setMode('reset_new_password');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired reset code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Set New Password
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (resetPassEval.score < 4) {
      setError('Please ensure your new password meets all security requirements.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords don't match. Please make sure both password fields are identical.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(resetIdentifier.trim(), resetOtp.trim(), newPassword);
      setLoginIdentifier(resetIdentifier.trim());
      setLoginPassword(newPassword);
      setMode('reset_success');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-Click Demo Login
  const handleDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin();
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Test demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="region"
      aria-label="StockSense Authentication"
      className="min-h-screen w-full bg-[#070D18] flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto relative selection:bg-blue-500 selection:text-white"
    >
      {/* Background ambient accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Banner: Deep Navy Blue Theme */}
        <div className="p-6 bg-[#0B1528] text-white text-center border-b border-[#1E293B]">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 mx-auto flex items-center justify-center mb-3 text-blue-400 shadow-sm">
            <Boxes className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            StockSense IMS
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
            Centralized inventory tracking, multi-facility operations & append-only stock ledger
          </p>
        </div>

        {/* Top Segmented Navigation Tabs: Sign In vs Sign Up */}
        {(mode === 'login' || mode === 'signup') && (
          <div
            role="tablist"
            aria-label="StockSense Account Options"
            className="flex border-b border-slate-200 bg-slate-100 p-1.5"
          >
            <button
              role="tab"
              id="tab-login"
              aria-selected={mode === 'login'}
              aria-controls="panel-login"
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-hidden min-h-[40px] ${
                mode === 'login'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign In</span>
            </button>
            <button
              role="tab"
              id="tab-signup"
              aria-selected={mode === 'signup'}
              aria-controls="panel-signup"
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2.5 px-4 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-hidden min-h-[40px] ${
                mode === 'signup'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Create Account</span>
            </button>
          </div>
        )}

        {/* Redirect Notice Banner (e.g. redirected from /dashboard or direct URL) */}
        {redirectNotice && mode === 'login' && (
          <div
            role="alert"
            aria-live="assertive"
            className="mx-6 mt-4 p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs font-medium"
          >
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <span className="font-bold block">Access Restricted</span>
              <span className="leading-relaxed">{redirectNotice}</span>
            </div>
          </div>
        )}

        {/* Live Feedback Region for Screen Readers & Users */}
        <div
          id={alertId}
          role="alert"
          aria-live="polite"
          className="px-6 pt-4 empty:hidden"
        >
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-xs text-rose-900 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="font-semibold leading-relaxed">{success}</div>
            </div>
          )}

          {otpNotice && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-2 text-xs text-blue-900 shadow-2xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                <span className="font-semibold">{otpNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const match = otpNotice.match(/\d{6}/);
                  if (match) {
                    if (mode === 'verify_signup_otp') setSignupOtp(match[0]);
                    if (mode === 'reset_verify') setResetOtp(match[0]);
                  }
                }}
                className="text-[11px] font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                aria-label="Auto-fill 6-digit code from hint"
              >
                Auto-fill Code
              </button>
            </div>
          )}
        </div>

        {/* Auth Body */}
        <div className="p-6">
          {/* ========================================================================= */}
          {/* 1. LOGIN MODE                                                             */}
          {/* ========================================================================= */}
          {mode === 'login' && (
            <div
              id="panel-login"
              role="tabpanel"
              aria-labelledby="tab-login"
              className="space-y-4"
            >
              {/* 1-Click Test Access for Quick Demonstration */}
              <button
                type="button"
                onClick={handleDemo}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors cursor-pointer min-h-[44px] focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-hidden"
              >
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>1-Click Test Login (Alex Morgan - Verified Admin)</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider shrink-0">
                  Or enter credentials
                </span>
              </div>

              <form onSubmit={handleLogin} className="space-y-4" noValidate>
                <div>
                  <label
                    htmlFor={loginEmailId}
                    className="block text-xs font-bold text-slate-800 mb-1"
                  >
                    Email Address or Phone Number
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                    <input
                      id={loginEmailId}
                      type="text"
                      name="username"
                      autoComplete="username"
                      required
                      placeholder="e.g. alex@stocksense.io or 555-0199"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      aria-invalid={!!error}
                      className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition-all min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor={loginPassId}
                      className="block text-xs font-bold text-slate-800"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetIdentifier(loginIdentifier);
                        switchMode('reset_request');
                      }}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer py-1"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                    <input
                      id={loginPassId}
                      type={showLoginPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      aria-invalid={!!error}
                      className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-11 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition-all min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showLoginPassword}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Electric Blue Primary Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[46px] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <div className="pt-3 text-center text-xs text-slate-600 border-t border-slate-100">
                  New to StockSense?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer py-1"
                  >
                    Create an account
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. SIGNUP MODE (UP FRONT PASSWORD RULES & STRENGTH METER)                */}
          {/* ========================================================================= */}
          {mode === 'signup' && (
            <div id="panel-signup" role="tabpanel" aria-labelledby="tab-signup">
              <form onSubmit={handleSignup} className="space-y-3.5" noValidate>
              <div>
                <label
                  htmlFor={signupNameId}
                  className="block text-xs font-bold text-slate-800 mb-1"
                >
                  Full Name <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    id={signupNameId}
                    type="text"
                    name="name"
                    autoComplete="name"
                    required
                    placeholder="e.g. Jordan Lee"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition-all min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor={signupEmailId}
                  className="block text-xs font-bold text-slate-800 mb-1"
                >
                  Work Email or Mobile Phone <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    id={signupEmailId}
                    type="text"
                    name="email"
                    autoComplete="email"
                    required
                    placeholder="e.g. jordan@company.com or 555-0144"
                    value={signupEmailOrPhone}
                    onChange={(e) => setSignupEmailOrPhone(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition-all min-h-[44px]"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  We'll send a 6-digit confirmation code to verify this address before account activation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={signupRoleId} className="block text-xs font-bold text-slate-800 mb-1">
                    Job Role
                  </label>
                  <select
                    id={signupRoleId}
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden min-h-[44px]"
                  >
                    <option value="Inventory Manager">Inventory Manager</option>
                    <option value="Warehouse Admin">Warehouse Admin</option>
                    <option value="Logistics Coordinator">Logistics Coordinator</option>
                    <option value="Supply Chain Lead">Supply Chain Lead</option>
                  </select>
                </div>
                <div>
                  <label htmlFor={signupDeptId} className="block text-xs font-bold text-slate-800 mb-1">
                    Department
                  </label>
                  <input
                    id={signupDeptId}
                    type="text"
                    value={signupDepartment}
                    onChange={(e) => setSignupDepartment(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-hidden min-h-[44px]"
                  />
                </div>
              </div>

              {/* Password Input with show/hide toggle */}
              <div>
                <label
                  htmlFor={signupPassId}
                  className="block text-xs font-bold text-slate-800 mb-1"
                >
                  Create Password <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    id={signupPassId}
                    type={showSignupPassword ? 'text' : 'password'}
                    name="new-password"
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    aria-describedby={`${baseId}-password-rules ${baseId}-strength-meter`}
                    className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-11 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition-all min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showSignupPassword}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* VISIBLE PASSWORD STRENGTH METER */}
                <div
                  id={`${baseId}-strength-meter`}
                  aria-live="polite"
                  aria-atomic="true"
                  className="mt-2 space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 font-medium">Password Strength:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        signupPassEval.score === 4
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                          : signupPassEval.score === 3
                          ? 'bg-blue-50 text-blue-900 border border-blue-300'
                          : signupPassEval.score === 2
                          ? 'bg-amber-50 text-amber-900 border border-amber-300'
                          : 'bg-rose-50 text-rose-900 border border-rose-300'
                      }`}
                    >
                      {signupPassEval.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full flex-1 transition-all duration-300 ${
                          signupPassEval.score >= step
                            ? signupPassEval.score === 4
                              ? 'bg-emerald-600'
                              : signupPassEval.score === 3
                              ? 'bg-blue-600'
                              : signupPassEval.score === 2
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* CLEAR RULES SHOWN UP FRONT (Not just error after submission) */}
                <div
                  id={`${baseId}-password-rules`}
                  className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px]"
                >
                  <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Required Password Criteria:
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-700">
                    <li className="flex items-center gap-1.5">
                      {signupPassEval.hasMinLength ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                      )}
                      <span className={signupPassEval.hasMinLength ? 'text-emerald-900 font-semibold' : 'text-slate-700'}>
                        At least 8 characters
                      </span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      {signupPassEval.hasUppercase ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                      )}
                      <span className={signupPassEval.hasUppercase ? 'text-emerald-900 font-semibold' : 'text-slate-700'}>
                        One uppercase (A-Z)
                      </span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      {signupPassEval.hasLowercase ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                      )}
                      <span className={signupPassEval.hasLowercase ? 'text-emerald-900 font-semibold' : 'text-slate-700'}>
                        One lowercase (a-z)
                      </span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      {signupPassEval.hasNumber ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                      )}
                      <span className={signupPassEval.hasNumber ? 'text-emerald-900 font-semibold' : 'text-slate-700'}>
                        One number (0-9)
                      </span>
                    </li>
                    <li className="flex items-center gap-1.5 sm:col-span-2">
                      {signupPassEval.hasSpecial ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                      )}
                      <span className={signupPassEval.hasSpecial ? 'text-emerald-900 font-semibold' : 'text-slate-700'}>
                        One symbol (!@#$%^&*...)
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Confirm Password with match check */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor={signupConfirmPassId}
                    className="block text-xs font-bold text-slate-800"
                  >
                    Confirm Password <span className="text-rose-600" aria-hidden="true">*</span>
                  </label>
                  {signupConfirmPassword && (
                    <span
                      aria-live="polite"
                      className={`text-[11px] font-bold inline-flex items-center gap-1 ${
                        isSignupMatch ? 'text-emerald-900' : 'text-rose-900'
                      }`}
                    >
                      {isSignupMatch ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                          <span>Passwords match</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5 text-rose-700" aria-hidden="true" />
                          <span>Passwords do not match</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    id={signupConfirmPassId}
                    type={showSignupConfirmPassword ? 'text' : 'password'}
                    name="confirm-password"
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-11 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition-all min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                    aria-label={showSignupConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    aria-pressed={showSignupConfirmPassword}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
                  >
                    {showSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Electric Blue Action Button */}
              <button
                type="submit"
                disabled={loading || signupPassEval.score < 4 || !isSignupMatch}
                className="w-full mt-2 py-3 px-4 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 min-h-[46px] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <span>{loading ? 'Creating Account...' : 'Continue to Confirmation Code'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <div className="pt-2 text-center text-xs text-slate-600 border-t border-slate-100">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer py-1"
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
          )}

          {/* ========================================================================= */}
          {/* 3. SIGNUP OTP VERIFICATION STEP                                          */}
          {/* ========================================================================= */}
          {mode === 'verify_signup_otp' && (
            <form onSubmit={handleVerifySignupOtp} className="space-y-4" noValidate>
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-200 mx-auto flex items-center justify-center">
                  <KeyRound className="w-5 h-5" aria-hidden="true" />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Verify Account Activation
                </h2>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Enter the 6-digit confirmation code generated for <span className="font-semibold text-slate-900">{verificationEmail}</span>.
                </p>
              </div>

              <div>
                <label
                  htmlFor={signupOtpId}
                  className="block text-xs font-bold text-slate-800 mb-1 text-center"
                >
                  6-Digit Confirmation Code
                </label>
                <input
                  id={signupOtpId}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  placeholder="000000"
                  value={signupOtp}
                  onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-xl font-mono tracking-widest text-center bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition-all min-h-[50px]"
                />
              </div>

              {/* Electric Blue Activation Button */}
              <button
                type="submit"
                disabled={loading || signupOtp.trim().length !== 6}
                className="w-full py-3 px-4 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 min-h-[46px] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <span>{loading ? 'Activating...' : 'Verify & Enter Dashboard'}</span>
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={handleResendSignupOtp}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-800 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer py-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                  <span>Resend Confirmation Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-slate-500 hover:text-slate-800 font-medium py-1"
                >
                  Back to Registration
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* 4. PASSWORD RESET: STEP 1 (REQUEST OTP)                                   */}
          {/* ========================================================================= */}
          {mode === 'reset_request' && (
            <form onSubmit={handleRequestResetOtp} className="space-y-4" noValidate>
              <div className="text-center space-y-1">
                <h2 className="text-base font-bold text-slate-900">
                  Reset Forgotten Password
                </h2>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Enter your registered email address or phone number. We will generate a secure 6-digit OTP code to verify your identity.
                </p>
              </div>

              <div>
                <label
                  htmlFor={resetEmailId}
                  className="block text-xs font-bold text-slate-800 mb-1"
                >
                  Registered Email or Phone
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    id={resetEmailId}
                    type="text"
                    required
                    placeholder="e.g. alex@stocksense.io or 555-0199"
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition-all min-h-[44px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[46px] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <span>{loading ? 'Generating Code...' : 'Send Reset Code'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer py-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Return to Sign In</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* 5. PASSWORD RESET: STEP 2 (VERIFY RESET OTP)                              */}
          {/* ========================================================================= */}
          {mode === 'reset_verify' && (
            <form onSubmit={handleVerifyResetOtp} className="space-y-4" noValidate>
              <div className="text-center space-y-1">
                <h2 className="text-base font-bold text-slate-900">
                  Enter Password Reset Code
                </h2>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  A 6-digit security code was generated for <span className="font-semibold text-slate-900">{resetIdentifier}</span>.
                </p>
              </div>

              <div>
                <label
                  htmlFor={resetOtpId}
                  className="block text-xs font-bold text-slate-800 mb-1 text-center"
                >
                  6-Digit OTP Code
                </label>
                <input
                  id={resetOtpId}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  placeholder="000000"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-xl font-mono tracking-widest text-center bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition-all min-h-[50px]"
                />
              </div>

              <button
                type="submit"
                disabled={loading || resetOtp.trim().length !== 6}
                className="w-full py-3 px-4 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 min-h-[46px] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <span>{loading ? 'Verifying Code...' : 'Verify & Set New Password'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={handleRequestResetOtp}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer py-1"
                >
                  Resend Code
                </button>
                <button
                  type="button"
                  onClick={() => setMode('reset_request')}
                  className="text-slate-500 hover:text-slate-800 font-medium py-1"
                >
                  Change Email/Phone
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* 6. PASSWORD RESET: STEP 3 (SET NEW PASSWORD WITH STRENGTH RULES)          */}
          {/* ========================================================================= */}
          {mode === 'reset_new_password' && (
            <form onSubmit={handleSetNewPassword} className="space-y-3.5" noValidate>
              <div className="text-center space-y-1">
                <h2 className="text-base font-bold text-slate-900">
                  Set Your New Password
                </h2>
                <p className="text-xs text-slate-600">
                  Create a new secure password adhering to enterprise complexity rules.
                </p>
              </div>

              <div>
                <label
                  htmlFor={resetNewPassId}
                  className="block text-xs font-bold text-slate-800 mb-1"
                >
                  New Password <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    id={resetNewPassId}
                    type={showResetPassword ? 'text' : 'password'}
                    name="new-password"
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    aria-describedby={`${baseId}-reset-password-rules ${baseId}-reset-strength-meter`}
                    className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-11 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition-all min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showResetPassword}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* VISIBLE PASSWORD STRENGTH METER */}
                <div
                  id={`${baseId}-reset-strength-meter`}
                  aria-live="polite"
                  aria-atomic="true"
                  className="mt-2 space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 font-medium">Password Strength:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        resetPassEval.score === 4
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                          : resetPassEval.score === 3
                          ? 'bg-blue-50 text-blue-900 border border-blue-300'
                          : resetPassEval.score === 2
                          ? 'bg-amber-50 text-amber-900 border border-amber-300'
                          : 'bg-rose-50 text-rose-900 border border-rose-300'
                      }`}
                    >
                      {resetPassEval.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full flex-1 transition-all duration-300 ${
                          resetPassEval.score >= step
                            ? resetPassEval.score === 4
                              ? 'bg-emerald-600'
                              : resetPassEval.score === 3
                              ? 'bg-blue-600'
                              : resetPassEval.score === 2
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* RULES SHOWN UP FRONT */}
                <div
                  id={`${baseId}-reset-password-rules`}
                  className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px]"
                >
                  <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Required Password Rules:
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-700">
                    <li className="flex items-center gap-1.5">
                      {resetPassEval.hasMinLength ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                      )}
                      <span className={resetPassEval.hasMinLength ? 'text-emerald-900 font-semibold' : 'text-slate-700'}>
                        Min 8 characters
                      </span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      {resetPassEval.hasUppercase ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                      )}
                      <span className={resetPassEval.hasUppercase ? 'text-emerald-900 font-semibold' : 'text-slate-700'}>
                        One uppercase (A-Z)
                      </span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      {resetPassEval.hasLowercase ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                      )}
                      <span className={resetPassEval.hasLowercase ? 'text-emerald-900 font-semibold' : 'text-slate-700'}>
                        One lowercase (a-z)
                      </span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      {resetPassEval.hasNumber ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                      )}
                      <span className={resetPassEval.hasNumber ? 'text-emerald-900 font-semibold' : 'text-slate-700'}>
                        One number (0-9)
                      </span>
                    </li>
                    <li className="flex items-center gap-1.5 sm:col-span-2">
                      {resetPassEval.hasSpecial ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                      )}
                      <span className={resetPassEval.hasSpecial ? 'text-emerald-900 font-semibold' : 'text-slate-700'}>
                        One symbol (!@#$%^&*...)
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor={resetConfirmPassId}
                    className="block text-xs font-bold text-slate-800"
                  >
                    Confirm New Password <span className="text-rose-600" aria-hidden="true">*</span>
                  </label>
                  {confirmNewPassword && (
                    <span
                      aria-live="polite"
                      className={`text-[11px] font-bold inline-flex items-center gap-1 ${
                        isResetMatch ? 'text-emerald-900' : 'text-rose-900'
                      }`}
                    >
                      {isResetMatch ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                          <span>Passwords match</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5 text-rose-700" aria-hidden="true" />
                          <span>Passwords do not match</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                  <input
                    id={resetConfirmPassId}
                    type={showResetConfirmPassword ? 'text' : 'password'}
                    name="confirm-password"
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-11 py-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition-all min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                    aria-label={showResetConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    aria-pressed={showResetConfirmPassword}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
                  >
                    {showResetConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || resetPassEval.score < 4 || !isResetMatch}
                className="w-full mt-2 py-3 px-4 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 min-h-[46px] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <span>{loading ? 'Saving New Password...' : 'Save Password & Complete Reset'}</span>
                <Check className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
          )}

          {/* ========================================================================= */}
          {/* 7. PASSWORD RESET: STEP 4 (SUCCESS CONFIRMATION SCREEN)                   */}
          {/* ========================================================================= */}
          {mode === 'reset_success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Password Successfully Updated!
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                  Your credentials have been securely updated in the database. You can now sign in to your StockSense workspace.
                </p>
              </div>

              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full py-3 px-4 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/25 active:scale-[0.98] transition-all cursor-pointer min-h-[46px]"
              >
                Proceed to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
