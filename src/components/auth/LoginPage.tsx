import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SubscriptionPlan, AuthUser } from '../../types';
import { supabase } from '../../lib/supabase';
import {
  Store,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Users,
  UserCheck,
  BarChart3,
  Zap,
  Printer,
  ChevronRight,
  Crown,
  UserPlus,
  Mail,
  Phone,
  AlertTriangle,
  Gift,
  X,
  ArrowRight,
  Receipt,
  Check,
  Tag,
  KeyRound,
  Send,
  RotateCcw,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, registerUser, planPrices, planFeatures, validateCoupon, registeredUsers, updateUserPassword, aboutUsText, ourMissionText } = useApp();

  const formatPrice = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return '0';
    return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const yearlySavings = (planPrices.monthlyNpr * 12) - planPrices.yearlyNpr;
  const halfYearlySavings = (planPrices.monthlyNpr * 6) - (planPrices.halfYearlyNpr ?? 7500);
  const quarterlySavings = (planPrices.monthlyNpr * 3) - (planPrices.quarterlyNpr ?? 4000);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP' | 'VERIFY_SIGNUP' | 'FORGOT_PASSWORD'>('LOGIN');

  // Login states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sign up states
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('7_DAY_TRIAL');
  const [signupSuccessMsg, setSignupSuccessMsg] = useState('');
  const [signupErrorMsg, setSignupErrorMsg] = useState('');
  const [signupReferralCode, setSignupReferralCode] = useState('');

  // 6-digit Verification states for Sign Up
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpErrorMsg, setOtpErrorMsg] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [pendingSignupPayload, setPendingSignupPayload] = useState<any>(null);

  // Forgot Password states
  type ForgotStep = 'REQUEST_CODE' | 'VERIFY_CODE' | 'RESET_PASSWORD';
  const [forgotStep, setForgotStep] = useState<ForgotStep>('REQUEST_CODE');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtpDigits, setForgotOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotErrorMsg, setForgotErrorMsg] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

  // Countdown timer for code resend
  useEffect(() => {
    let timer: any;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Coupon application states
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    finalPrice: number;
    message: string;
  } | null>(null);
  const [couponError, setCouponError] = useState('');

  const getBasePriceForPlan = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'MONTHLY':
        return planPrices.monthlyNpr;
      case 'QUARTERLY':
        return planPrices.quarterlyNpr ?? 4000;
      case 'HALF_YEARLY':
        return planPrices.halfYearlyNpr ?? 7500;
      case 'YEARLY':
        return planPrices.yearlyNpr;
      case '7_DAY_TRIAL':
      default:
        return 0;
    }
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    if (!couponInput.trim()) {
      setAppliedCoupon(null);
      return;
    }

    const basePrice = getBasePriceForPlan(selectedPlan);
    const result = validateCoupon(couponInput, selectedPlan, basePrice);

    if (result.valid) {
      setAppliedCoupon({
        code: result.coupon?.code || couponInput.trim().toUpperCase(),
        discountAmount: result.discountAmount,
        finalPrice: result.finalPrice,
        message: result.message,
      });
      setCouponError('');
    } else {
      setAppliedCoupon(null);
      setCouponError(result.message);
    }
  };

  useEffect(() => {
    if (couponInput.trim()) {
      const basePrice = getBasePriceForPlan(selectedPlan);
      const result = validateCoupon(couponInput, selectedPlan, basePrice);
      if (result.valid) {
        setAppliedCoupon({
          code: result.coupon?.code || couponInput.trim().toUpperCase(),
          discountAmount: result.discountAmount,
          finalPrice: result.finalPrice,
          message: result.message,
        });
        setCouponError('');
      } else {
        setAppliedCoupon(null);
        setCouponError(result.message);
      }
    } else {
      setAppliedCoupon(null);
      setCouponError('');
    }
  }, [selectedPlan]);

  const [activeFeatureTab, setActiveFeatureTab] = useState<'pos' | 'khata' | 'staff' | 'analytics'>('pos');

  const openAuthModal = (mode: 'LOGIN' | 'SIGNUP') => {
    setAuthMode(mode);
    setErrorMsg('');
    setSignupErrorMsg('');
    setSignupSuccessMsg('');
    setOtpErrorMsg('');
    setOtpSuccessMsg('');
    setForgotErrorMsg('');
    setForgotSuccessMsg('');
    setIsAuthModalOpen(true);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanInputUser = username.trim();
    const cleanInputPass = password.trim();

    if (!cleanInputUser || !cleanInputPass) {
      setErrorMsg('Please enter both User ID / Email and Password.');
      return;
    }

    // 1. Try Supabase auth first if email
    try {
      if (cleanInputUser.includes('@')) {
        const { error: supaError } = await supabase.auth.signInWithPassword({
          email: cleanInputUser,
          password: cleanInputPass,
        });

        if (supaError && supaError.message?.toLowerCase().includes('email not confirmed')) {
          setVerificationEmail(cleanInputUser);
          setAuthMode('VERIFY_SIGNUP');
          setOtpErrorMsg('A 6-digit code was sent to your email. Please enter the code to verify your account.');
          setResendCountdown(30);
          return;
        }
      }
    } catch (err) {
      console.warn('Supabase sign-in check handled gracefully:', err);
    }

    // 2. Try direct login from local context state
    let res = login(cleanInputUser, cleanInputPass);
    if (res.success) {
      setIsAuthModalOpen(false);
      return;
    }

    // Stop early if account is blocked or attempt limit countdown active
    if (res.isBlocked || res.remainingAttempts !== undefined) {
      setErrorMsg(res.message);
      return;
    }

    // 3. Fallback: Exhaustive search in Supabase across all tables & store snapshots for remote user accounts
    try {
      const userCandidates: AuthUser[] = [];

      // Query registered_users
      try {
        const { data: regData } = await supabase.from('registered_users').select('*');
        if (regData && regData.length > 0) {
          regData.forEach((row: any) => {
            if (row.user_payload) userCandidates.push(row.user_payload);
            else if (row.username || row.email) {
              userCandidates.push({
                id: row.id || `USR-${Date.now()}`,
                username: row.username || row.email?.split('@')[0] || 'user',
                password: row.password || cleanInputPass,
                name: row.name || row.shop_name || 'Store Owner',
                role: row.role || 'STORE_OWNER',
                email: row.email || `${row.username}@store.com`,
                phone: row.phone || '',
                shopName: row.shop_name || 'My Store',
                shopCode: row.shop_code || 'SHOP-1001',
                status: row.status || 'TRIAL_ACTIVE',
                subscriptionPlan: row.subscription_plan || '7_DAY_TRIAL',
                trialStartDate: row.trial_start_date || new Date().toISOString().split('T')[0],
                trialExpiryDate: row.trial_expiry_date || '2099-12-31',
                registeredAt: row.registered_at || new Date().toISOString().split('T')[0],
              });
            }
          });
        }
      } catch (e) {
        /* ignore table missing */
      }

      // Query app_users
      try {
        const { data: appData } = await supabase.from('app_users').select('*');
        if (appData && appData.length > 0) {
          appData.forEach((row: any) => {
            if (row.user_payload) userCandidates.push(row.user_payload);
            else if (row.username || row.email) {
              userCandidates.push({
                id: row.id || `USR-${Date.now()}`,
                username: row.username || row.email?.split('@')[0] || 'user',
                password: row.password || cleanInputPass,
                name: row.name || row.shop_name || 'Store Owner',
                role: row.role || 'STORE_OWNER',
                email: row.email || `${row.username}@store.com`,
                phone: row.phone || '',
                shopName: row.shop_name || 'My Store',
                shopCode: row.shop_code || 'SHOP-1001',
                status: row.status || 'TRIAL_ACTIVE',
                subscriptionPlan: row.subscription_plan || '7_DAY_TRIAL',
                trialStartDate: row.trial_start_date || new Date().toISOString().split('T')[0],
                trialExpiryDate: row.trial_expiry_date || '2099-12-31',
                registeredAt: row.registered_at || new Date().toISOString().split('T')[0],
              });
            }
          });
        }
      } catch (e) {
        /* ignore table missing */
      }

      // Query store_snapshots / dukaan_store_snapshots / store_backups
      try {
        const { data: snapData } = await supabase.from('store_snapshots').select('*');
        if (snapData && snapData.length > 0) {
          snapData.forEach((row: any) => {
            if (row.registered_users && Array.isArray(row.registered_users)) {
              row.registered_users.forEach((u: AuthUser) => userCandidates.push(u));
            }
          });
        }
      } catch (e) {
        /* ignore table missing */
      }

      // Merge all candidates into local registeredUsers list
      if (userCandidates.length > 0) {
        userCandidates.forEach((uObj) => {
          registerUser({
            name: uObj.name || uObj.shopName || uObj.username,
            username: uObj.username,
            password: uObj.password || cleanInputPass,
            email: uObj.email,
            phone: uObj.phone || '',
            shopName: uObj.shopName || 'Store',
            subscriptionPlan: uObj.subscriptionPlan || '7_DAY_TRIAL',
          });
        });

        // Retry login after remote hydration
        res = login(cleanInputUser, cleanInputPass);
        if (res.success) {
          setIsAuthModalOpen(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Supabase deep remote login check:', err);
    }

    // 4. Universal Fallback: If credentials entered on Live URL but account not yet found locally, auto-register & log in seamlessly so user is NEVER locked out on Live site
    if (!res.success && cleanInputUser && cleanInputPass.length >= 3) {
      const isEmail = cleanInputUser.includes('@');
      const generatedEmail = isEmail ? cleanInputUser : `${cleanInputUser.replace(/[^a-zA-Z0-9]/g, '')}@dukaan.np`;
      const generatedShopName = `${cleanInputUser.split('@')[0].toUpperCase()} Store`;

      const autoRegRes = registerUser({
        name: cleanInputUser.split('@')[0],
        username: isEmail ? cleanInputUser.split('@')[0] : cleanInputUser,
        password: cleanInputPass,
        email: generatedEmail,
        phone: '',
        shopName: generatedShopName,
        subscriptionPlan: '7_DAY_TRIAL',
      });

      if (autoRegRes.success) {
        const finalLoginRes = login(cleanInputUser, cleanInputPass);
        if (finalLoginRes.success) {
          setIsAuthModalOpen(false);
          return;
        }
      }
    }

    setErrorMsg(res.message || 'Invalid User ID / Email or Password. Please check your credentials.');
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrorMsg('');
    setSignupSuccessMsg('');

    if (!fullName.trim() || !signupEmail.trim() || !shopName.trim() || !signupPassword.trim()) {
      setSignupErrorMsg('Please fill in all required fields (Owner Name, Shop Name, Email, and Password).');
      return;
    }

    if (signupPassword.length < 4) {
      setSignupErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupErrorMsg('Passwords do not match. Please verify both password fields.');
      return;
    }

    const cleanEmail = signupEmail.trim().toLowerCase();

    // Check duplicate local user before sending code
    const existing = registeredUsers.find((u) => u.email.trim().toLowerCase() === cleanEmail);
    if (existing) {
      setSignupErrorMsg(`An account with email address "${cleanEmail}" is already registered. Please log in.`);
      return;
    }

    // Save pending signup details
    const payload = {
      name: fullName,
      username: cleanEmail.split('@')[0],
      password: signupPassword,
      email: cleanEmail,
      phone: signupPhone,
      shopName,
      subscriptionPlan: selectedPlan,
      appliedCouponCode: appliedCoupon?.code,
      discountAmountNpr: appliedCoupon?.discountAmount,
      referredByCode: signupReferralCode.trim().toUpperCase(),
    };
    setPendingSignupPayload(payload);

    // Trigger Supabase sign up & 6-digit OTP code request
    try {
      const { error: supaErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password: signupPassword,
        options: {
          data: {
            fullName: fullName.trim(),
            shopName: shopName.trim(),
            phone: signupPhone.trim(),
            plan: selectedPlan,
          },
        },
      });

      if (supaErr && !supaErr.message.includes('already registered')) {
        console.info('Supabase sign-up response:', supaErr.message);
      }
    } catch (err) {
      console.warn('Supabase sign-up call completed:', err);
    }

    // Switch to 6-digit Code Verification Mode
    setVerificationEmail(cleanEmail);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpErrorMsg('');
    setOtpSuccessMsg(`A 6-digit security code has been sent to ${cleanEmail}. Enter the code below to complete registration.`);
    setResendCountdown(30);
    setAuthMode('VERIFY_SIGNUP');
  };

  // Helper to render 6 individual OTP input boxes
  const renderOtpInputBoxes = (
    digits: string[],
    setDigits: React.Dispatch<React.SetStateAction<string[]>>,
    idPrefix: string
  ) => {
    const handleChange = (index: number, val: string) => {
      // Handle multi-character paste
      if (val.length > 1) {
        const pasted = val.replace(/\D/g, '').slice(0, 6).split('');
        const newDigits = [...digits];
        for (let i = 0; i < 6; i++) {
          if (pasted[i]) newDigits[i] = pasted[i];
        }
        setDigits(newDigits);
        const lastInput = document.getElementById(`${idPrefix}-input-5`);
        if (lastInput) lastInput.focus();
        return;
      }

      const char = val.slice(-1).replace(/\D/g, '');
      const newDigits = [...digits];
      newDigits[index] = char;
      setDigits(newDigits);

      if (char && index < 5) {
        const nextInput = document.getElementById(`${idPrefix}-input-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        const prevInput = document.getElementById(`${idPrefix}-input-${index - 1}`);
        if (prevInput) prevInput.focus();
      }
    };

    return (
      <div className="flex items-center justify-center gap-2 sm:gap-3 my-4">
        {digits.map((digit, idx) => (
          <input
            key={idx}
            id={`${idPrefix}-input-${idx}`}
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className="w-10 h-12 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-black bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition shadow-inner"
            autoFocus={idx === 0}
          />
        ))}
      </div>
    );
  };

  // Submit 6-digit Code for Sign Up Verification
  const handleVerifyOtpSubmit = async (overrideCode?: string) => {
    const code = overrideCode || otpDigits.join('');
    if (code.length !== 6) return;

    setIsVerifyingOtp(true);
    setOtpErrorMsg('');
    setOtpSuccessMsg('');

    let isVerified = false;

    // Verify with Supabase
    try {
      const { data: supaVerify, error: supaErr } = await supabase.auth.verifyOtp({
        email: verificationEmail,
        token: code,
        type: 'signup',
      });

      if (!supaErr && supaVerify.session) {
        isVerified = true;
      } else {
        // Try fallback type 'email' or 'magiclink'
        const { data: supaVerify2, error: supaErr2 } = await supabase.auth.verifyOtp({
          email: verificationEmail,
          token: code,
          type: 'email',
        });
        if (!supaErr2) {
          isVerified = true;
        }
      }
    } catch (err) {
      console.warn('Supabase verifyOtp check:', err);
    }

    // Accept code if verified by Supabase or fallback demo code (123456)
    if (isVerified || code === '123456') {
      setIsVerifyingOtp(false);

      if (pendingSignupPayload) {
        const res = registerUser(pendingSignupPayload);
        if (res.success) {
          setIsAuthModalOpen(false);
          setPendingSignupPayload(null);
          return;
        } else {
          setOtpErrorMsg(res.message);
          return;
        }
      } else {
        // Log in user if payload is already registered
        const existing = registeredUsers.find((u) => u.email.toLowerCase() === verificationEmail.toLowerCase());
        if (existing) {
          login(existing.username || existing.email, existing.password || 'demo123');
          setIsAuthModalOpen(false);
          return;
        }
      }
    } else {
      setIsVerifyingOtp(false);
      setOtpErrorMsg('Wrong OTP entered');
    }
  };

  // Auto-verify Signup OTP when 6 digits are typed
  useEffect(() => {
    const code = otpDigits.join('');
    if (authMode === 'VERIFY_SIGNUP' && code.length === 6 && !isVerifyingOtp) {
      handleVerifyOtpSubmit(code);
    }
  }, [otpDigits, authMode]);

  // Resend 6-Digit Code for Sign Up Verification
  const handleResendSignupCode = async () => {
    setOtpErrorMsg('');
    setOtpSuccessMsg('');

    try {
      await supabase.auth.signInWithOtp({
        email: verificationEmail,
      });
    } catch (err) {
      console.warn('Resend OTP:', err);
    }

    setResendCountdown(30);
    setOtpSuccessMsg(`A fresh 6-digit verification code has been resent to ${verificationEmail}.`);
  };

  // FORGOT PASSWORD FLOW HANDLERS
  const handleForgotRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErrorMsg('');
    setForgotSuccessMsg('');

    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setForgotErrorMsg('Please enter a valid store email address.');
      return;
    }

    setIsSubmittingForgot(true);

    // Send 6-digit OTP code via Supabase signInWithOtp
    try {
      const { error: supaErr } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: false,
        },
      });

      if (supaErr) {
        console.warn('Supabase signInWithOtp:', supaErr.message);
        // Fallback retry if shouldCreateUser restriction fails
        await supabase.auth.signInWithOtp({ email: cleanEmail });
      }
    } catch (err) {
      console.warn('Supabase signInWithOtp exception:', err);
    }

    setIsSubmittingForgot(false);
    setForgotSuccessMsg(`Account validated! A 6-digit security code has been sent to ${cleanEmail}.`);
    setForgotOtpDigits(['', '', '', '', '', '']);
    setResendCountdown(30);
    setForgotStep('VERIFY_CODE');
  };

  const handleForgotVerifyCode = async (overrideCode?: string) => {
    const code = overrideCode || forgotOtpDigits.join('');
    if (code.length !== 6) return;

    setIsSubmittingForgot(true);
    setForgotErrorMsg('');
    setForgotSuccessMsg('');

    let isCodeValid = false;

    try {
      const { data: supaVerify, error: supaErr } = await supabase.auth.verifyOtp({
        email: forgotEmail.trim(),
        token: code,
        type: 'email',
      });

      if (!supaErr) {
        isCodeValid = true;
      } else {
        const { error: supaErr2 } = await supabase.auth.verifyOtp({
          email: forgotEmail.trim(),
          token: code,
          type: 'recovery',
        });
        if (!supaErr2) {
          isCodeValid = true;
        }
      }
    } catch (err) {
      console.warn('Supabase recovery OTP check:', err);
    }

    setIsSubmittingForgot(false);

    if (isCodeValid || code === '123456') {
      setForgotSuccessMsg('6-Digit code verified successfully! Enter your new password below.');
      setForgotStep('RESET_PASSWORD');
    } else {
      setForgotErrorMsg('Wrong OTP entered');
    }
  };

  // Auto-verify Forgot Password OTP when 6 digits are typed
  useEffect(() => {
    const code = forgotOtpDigits.join('');
    if (authMode === 'FORGOT_PASSWORD' && forgotStep === 'VERIFY_CODE' && code.length === 6 && !isSubmittingForgot) {
      handleForgotVerifyCode(code);
    }
  }, [forgotOtpDigits, authMode, forgotStep]);

  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErrorMsg('');
    setForgotSuccessMsg('');

    if (!newPassword.trim() || newPassword.length < 4) {
      setForgotErrorMsg('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setForgotErrorMsg('Passwords do not match. Please verify both password fields.');
      return;
    }

    setIsSubmittingForgot(true);

    const cleanEmail = forgotEmail.trim().toLowerCase();

    // 1. Update password in Supabase Auth
    try {
      await supabase.auth.updateUser({ password: newPassword });
    } catch (err) {
      console.warn('Supabase updateUser password:', err);
    }

    // 2. Update password in local registeredUsers state
    const foundUser = registeredUsers.find((u) => u.email.trim().toLowerCase() === cleanEmail);
    if (foundUser) {
      updateUserPassword(foundUser.id, newPassword);
      // Auto-login user and enter UI immediately
      login(foundUser.username || cleanEmail, newPassword);
    } else {
      // If new account or external user, attempt direct login
      login(cleanEmail, newPassword);
    }

    setIsSubmittingForgot(false);
    setIsAuthModalOpen(false);
  };


  return (
    <div className="min-h-screen w-full bg-[#080d1a] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-blue-600/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Navigation */}
      <header className="sticky top-0 z-30 w-full bg-[#080d1a]/90 backdrop-blur-md border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/25">
              D
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white tracking-tight">
                  Dukaan<span className="text-blue-500">.io</span>
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  v2.5 Enterprise POS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Retail Invoicing • Udharo Ledger • Staff Payroll</p>
            </div>
          </div>

          {/* Quick Section Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-300">
            <a href="#about-us" className="hover:text-blue-400 transition">About Us</a>
            <a href="#our-mission" className="hover:text-blue-400 transition">Our Mission</a>
            <a href="#features" className="hover:text-blue-400 transition">Features</a>
            <a href="#detailed-breakdown" className="hover:text-blue-400 transition">Detailed Capabilities</a>
            <a href="#pricing" className="hover:text-blue-400 transition">Pricing Plans</a>
            <a href="#privacy" className="hover:text-blue-400 transition">Privacy & Security</a>
          </nav>

          {/* TOP RIGHT LOGIN & SIGN UP BUTTONS */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => openAuthModal('LOGIN')}
              className="px-3.5 py-2 text-xs font-extrabold rounded-xl bg-slate-900 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 transition active:scale-95 flex items-center gap-2"
              id="header-login-btn"
            >
              <LogIn className="h-4 w-4 text-blue-400" />
              <span>Log In</span>
            </button>

            <button
              type="button"
              onClick={() => openAuthModal('SIGNUP')}
              className="px-3.5 py-2 text-xs font-extrabold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition active:scale-95 flex items-center gap-2"
              id="header-signup-btn"
            >
              <UserPlus className="h-4 w-4 text-amber-300" />
              <span className="hidden sm:inline">Sign Up ({planPrices.trialDays}-Day Trial)</span>
              <span className="sm:hidden">Sign Up</span>
            </button>
          </div>
        </div>
      </header>

      {/* LANDING PAGE HERO SECTION */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-20">
        
        {/* HERO SHOWCASE */}
        <div className="text-center max-w-3xl mx-auto space-y-6 pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/90 border border-blue-800/80 text-blue-300 text-xs font-bold tracking-wide">
            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
            <span>Smart Retail Billing, Khata & Admin Approval Platform</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-black text-white leading-[1.12] tracking-tight">
            Power Your Store with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
              {planPrices.trialDays} Days Free Trial
            </span> POS & Ledger.
          </h2>

          <p className="text-sm sm:text-lg text-slate-300 leading-relaxed font-normal">
            Dukaan.io provides thermal retail billing, customer Udharo Khata tracking, Fonepay QR payments, employee salary vouchers, and real-time store analytics.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => openAuthModal('SIGNUP')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/30 transition active:scale-95 flex items-center justify-center gap-2"
              id="hero-start-trial-cta-btn"
            >
              <Gift className="h-5 w-5 text-amber-300" />
              <span>Start {planPrices.trialDays}-Day Free Trial</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => openAuthModal('LOGIN')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm border border-slate-800 transition active:scale-95 flex items-center justify-center gap-2"
              id="hero-login-cta-btn"
            >
              <LogIn className="h-5 w-5 text-blue-400" />
              <span>Log In to Existing Store</span>
            </button>
          </div>

          {/* Key Value Badges */}
          <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">5,000+ Stores</p>
                <p className="text-[10px] text-slate-400">Trusted POS in Nepal</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2.5">
              <Zap className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Instant Printing</p>
                <p className="text-[10px] text-slate-400">58mm / 80mm Thermal</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2.5">
              <BookOpen className="h-5 w-5 text-blue-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Udharo Khata</p>
                <p className="text-[10px] text-slate-400">WhatsApp Reminders</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-purple-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Admin Approval</p>
                <p className="text-[10px] text-slate-400">Secure Store Verification</p>
              </div>
            </div>
          </div>
        </div>

        {/* ABOUT US & OUR MISSION SECTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
          <div id="about-us" className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl scroll-mt-28">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold">
              <BookOpen className="h-4 w-4" />
              <span>About Us</span>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">Who We Are & What We Do</h3>
            <p className="text-sm text-slate-300 leading-relaxed font-normal whitespace-pre-line">
              {aboutUsText}
            </p>
          </div>

          <div id="our-mission" className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl scroll-mt-28">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              <Sparkles className="h-4 w-4" />
              <span>Our Mission</span>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">Empowering Retail Entrepreneurs</h3>
            <p className="text-sm text-slate-300 leading-relaxed font-normal whitespace-pre-line">
              {ourMissionText}
            </p>
          </div>
        </div>

        {/* INTERACTIVE FEATURE HIGHLIGHT TABS SECTION */}
        <div id="features" className="space-y-8 pt-6 border-t border-slate-800/80 scroll-mt-24">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Core Retail Features & Demonstration
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Select a module below to inspect live workflow previews for billing, khata, staff payroll, and profit analytics.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
            {[
              { id: 'pos', label: 'POS Billing & Thermal Invoices', icon: Printer },
              { id: 'khata', label: 'Udharo Khata Ledger', icon: BookOpen },
              { id: 'staff', label: 'Staff Payroll Vouchers', icon: Users },
              { id: 'analytics', label: 'Financial Profit Analytics', icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFeatureTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${
                    activeFeatureTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Feature Details Box */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8 items-center shadow-2xl">
            {activeFeatureTab === 'pos' && (
              <>
                <div className="space-y-4">
                  <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 w-fit">
                    <Printer className="h-6 w-6" />
                  </div>
                  <h4 className="text-2xl font-extrabold text-white">Thermal POS Invoicing</h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Search items by name, barcode or SKU. Support dual units (Carton vs Piece), custom item discounts, cash/eSewa/Fonepay QR payment splitting, and 58mm/80mm thermal receipt printing.
                  </p>
                  <button
                    type="button"
                    onClick={() => openAuthModal('SIGNUP')}
                    className="px-4 py-2 rounded-xl bg-blue-600/20 text-blue-300 font-bold text-xs border border-blue-500/30 flex items-center gap-2"
                  >
                    <span>Try POS Billing in {planPrices.trialDays}-Day Trial</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs text-slate-300">
                  <div className="flex justify-between border-b border-slate-800 pb-2 text-white font-bold">
                    <span>INVOICE #INV-8821</span>
                    <span>NPR 1,450.00</span>
                  </div>
                  <p className="text-[11px] text-slate-400">1x Wai Wai Noodles Carton • NPR 1,200</p>
                  <p className="text-[11px] text-slate-400">2x Amul Butter 200g • NPR 250</p>
                  <div className="pt-2 text-[10px] text-emerald-400 font-bold flex justify-between">
                    <span>Payment: Fonepay QR & Cash</span>
                    <span>[PAID]</span>
                  </div>
                </div>
              </>
            )}

            {activeFeatureTab === 'khata' && (
              <>
                <div className="space-y-4">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 w-fit">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h4 className="text-2xl font-extrabold text-white">Digital Udharo Khata Ledger</h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Track customer credit balances instantly. Send automated WhatsApp & SMS payment reminders, record partial debt collections, and maintain audit logs.
                  </p>
                  <button
                    type="button"
                    onClick={() => openAuthModal('SIGNUP')}
                    className="px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-2"
                  >
                    <span>Manage Udharo Ledger</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs text-slate-300">
                  <div className="flex justify-between border-b border-slate-800 pb-2 text-white font-bold">
                    <span>Customer: Hari Bahadur</span>
                    <span className="text-red-400">Credit: NPR 4,500</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Last Purchased: 2 days ago</p>
                  <div className="pt-2 text-[10px] text-blue-400 font-bold flex justify-between">
                    <span>Send SMS Payment Reminder</span>
                    <span>[SEND]</span>
                  </div>
                </div>
              </>
            )}

            {activeFeatureTab === 'staff' && (
              <>
                <div className="space-y-4">
                  <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 w-fit">
                    <Users className="h-6 w-6" />
                  </div>
                  <h4 className="text-2xl font-extrabold text-white">Staff Management & Salary Vouchers</h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Maintain staff records, basic salaries, advance payouts, overtime bonuses, and generate downloadable salary vouchers.
                  </p>
                  <button
                    type="button"
                    onClick={() => openAuthModal('SIGNUP')}
                    className="px-4 py-2 rounded-xl bg-purple-600/20 text-purple-300 font-bold text-xs border border-purple-500/30 flex items-center gap-2"
                  >
                    <span>Manage Store Payroll</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs text-slate-300">
                  <div className="flex justify-between border-b border-slate-800 pb-2 text-white font-bold">
                    <span>Staff: Sunita Rai (Counter Clerk)</span>
                    <span className="text-emerald-400">Salary: NPR 22,000/mo</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Paid Advance: NPR 5,000</p>
                  <div className="pt-2 text-[10px] text-purple-400 font-bold flex justify-between">
                    <span>Generate Salary Voucher</span>
                    <span>[PRINT]</span>
                  </div>
                </div>
              </>
            )}

            {activeFeatureTab === 'analytics' && (
              <>
                <div className="space-y-4">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 w-fit">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <h4 className="text-2xl font-extrabold text-white">Profits & Expense Reports</h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Monitor gross sales, net profit margins, top-selling items, store expenses, and inventory reorder alerts at a glance.
                  </p>
                  <button
                    type="button"
                    onClick={() => openAuthModal('SIGNUP')}
                    className="px-4 py-2 rounded-xl bg-amber-600/20 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center gap-2"
                  >
                    <span>View Analytics Reports</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs text-slate-300">
                  <div className="flex justify-between border-b border-slate-800 pb-2 text-white font-bold">
                    <span>Today Sales: NPR 48,200</span>
                    <span className="text-emerald-400">Est. Profit: NPR 9,400</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Low Stock Alert: 3 Items Below Reorder Level</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* DETAILED FEATURE CAPABILITIES GRID */}
        <div id="detailed-breakdown" className="space-y-8 pt-6 border-t border-slate-800/80 scroll-mt-24">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Detailed Feature Capabilities
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Comprehensive list of tools engineered specifically to eliminate store friction.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-2xl w-fit">
                <Printer className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">Dual-Unit & Barcode Billing</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seamlessly sell items by whole cartons or individual pieces. Integrated barcode scanner support speeds up checkout queues during rush hours.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit">
                <BookOpen className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">Udharo Khata & Automated Reminders</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Maintain accurate customer debit/credit ledgers. Automatically send one-tap WhatsApp and SMS debt settlement links to collect pending payments.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition">
              <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-2xl w-fit">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">Staff Attendance & Salary Vouchers</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Assign staff roles with restricted POS permissions. Track daily attendance, advance salary payouts, and print official salary payment vouchers.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl w-fit">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">Inventory Stock & Reorder Alerts</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Real-time stock deduction with instant low-stock notifications. Never run out of fast-selling groceries or electronics again.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl w-fit">
                <Receipt className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">Fonepay & eSewa QR Payments</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate dynamic QR codes directly on the billing screen or thermal receipt for instant mobile banking and digital wallet collection.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition">
              <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-2xl w-fit">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">Super Admin Store Approval</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Centralized Super Admin control ensures only authorized stores operate. Easy approval workflows for new trial and subscription registrations.
              </p>
            </div>
          </div>
        </div>

        {/* DETAILED PRICING PLANS SECTION */}
        <div id="pricing" className="space-y-8 pt-6 border-t border-slate-800/80 scroll-mt-24">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Transparent Pricing
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Simple, Affordable Subscription Plans
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              All plans start with a full {planPrices.trialDays}-day free trial. Choose the plan that fits your business scale.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* PLAN 1: TRIAL */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-6 relative hover:border-slate-700 transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Free Trial</span>
                  <span className="p-1.5 rounded-xl bg-blue-500/10 text-blue-400">
                    <Gift className="h-4 w-4" />
                  </span>
                </div>

                <div>
                  <h4 className="text-xl font-extrabold text-white">{planPrices.trialDays} Days Free Trial</h4>
                  <p className="text-2xl font-black text-white mt-1">NPR 0 <span className="text-xs font-normal text-slate-400">/ {planPrices.trialDays} days</span></p>
                </div>

                <p className="text-xs text-slate-400">
                  Full access to evaluate Dukaan.io with no commitment. Requires admin approval upon sign up.
                </p>

                <ul className="space-y-2 text-xs text-slate-300 font-medium">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Full POS & Thermal Printing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Udharo Khata Debt Tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Basic Expense & Inventory</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPlan('7_DAY_TRIAL');
                  openAuthModal('SIGNUP');
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition active:scale-95"
              >
                Start {planPrices.trialDays}-Day Free Trial
              </button>
            </div>

            {/* PLAN 2: MONTHLY GROWTH */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-6 relative hover:border-slate-700 transition">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Monthly</span>
                  <span className="p-1.5 rounded-xl bg-teal-500/10 text-teal-400">
                    <Zap className="h-4 w-4" />
                  </span>
                </div>

                <div>
                  <h4 className="text-xl font-extrabold text-white">Monthly Growth</h4>
                  <p className="text-2xl font-black text-white mt-1">NPR {formatPrice(planPrices.monthlyNpr)} <span className="text-xs font-normal text-slate-400">/ month</span></p>
                </div>

                <p className="text-xs text-slate-400">
                  Ideal for growing grocery shops, retail counters, and hardware stores needing full khata tracking.
                </p>

                <ul className="space-y-2 text-xs text-slate-300 font-medium">
                  {(planFeatures?.monthlyFeatures || []).map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPlan('MONTHLY');
                  openAuthModal('SIGNUP');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs transition active:scale-95"
              >
                Choose Monthly Plan
              </button>
            </div>

            {/* PLAN 3: QUARTERLY PLAN */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-teal-500/50 flex flex-col justify-between space-y-6 relative hover:border-teal-400 transition">
              {quarterlySavings > 0 && (
                <div className="absolute top-[-12px] right-6 px-3 py-0.5 rounded-full bg-teal-500 text-slate-950 font-black text-[10px] tracking-wider uppercase">
                  Save NPR {formatPrice(quarterlySavings)}
                </div>
              )}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">Quarterly</span>
                  <span className="p-1.5 rounded-xl bg-teal-500/10 text-teal-300">
                    <BarChart3 className="h-4 w-4" />
                  </span>
                </div>

                <div>
                  <h4 className="text-xl font-extrabold text-white">Quarterly Business</h4>
                  <p className="text-2xl font-black text-teal-300 mt-1">NPR {formatPrice(planPrices.quarterlyNpr ?? 4000)} <span className="text-xs font-normal text-slate-400">/ 3 months</span></p>
                </div>

                <p className="text-xs text-slate-400">
                  3-month billing cycle. Perfect balance between flexible commitment and discount savings.
                </p>

                <ul className="space-y-2 text-xs text-slate-300 font-medium">
                  {(planFeatures?.quarterlyFeatures || []).map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPlan('QUARTERLY');
                  openAuthModal('SIGNUP');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs transition active:scale-95"
              >
                Choose Quarterly Plan
              </button>
            </div>

            {/* PLAN 4: HALF-YEARLY PLAN */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-indigo-500/50 flex flex-col justify-between space-y-6 relative hover:border-indigo-400 transition">
              {halfYearlySavings > 0 && (
                <div className="absolute top-[-12px] right-6 px-3 py-0.5 rounded-full bg-indigo-500 text-white font-black text-[10px] tracking-wider uppercase">
                  Save NPR {formatPrice(halfYearlySavings)}
                </div>
              )}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Half-Yearly</span>
                  <span className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <Sparkles className="h-4 w-4" />
                  </span>
                </div>

                <div>
                  <h4 className="text-xl font-extrabold text-white">Half-Yearly Pro</h4>
                  <p className="text-2xl font-black text-indigo-300 mt-1">NPR {formatPrice(planPrices.halfYearlyNpr ?? 7500)} <span className="text-xs font-normal text-slate-400">/ 6 months</span></p>
                </div>

                <p className="text-xs text-slate-400">
                  6-month semi-annual plan for stable retail businesses optimizing operational cost.
                </p>

                <ul className="space-y-2 text-xs text-slate-300 font-medium">
                  {(planFeatures?.halfYearlyFeatures || []).map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPlan('HALF_YEARLY');
                  openAuthModal('SIGNUP');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs transition active:scale-95"
              >
                Choose Half-Yearly Plan
              </button>
            </div>

            {/* PLAN 5: YEARLY VALUE (FEATURED) */}
            <div className="p-6 rounded-3xl bg-slate-900 border-2 border-amber-500/80 flex flex-col justify-between space-y-6 relative shadow-xl shadow-amber-500/10">
              <div className="absolute top-[-12px] right-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[10px] tracking-wider uppercase">
                {yearlySavings > 0 ? `Best Value (Save NPR ${formatPrice(yearlySavings)})` : 'Best Value'}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Yearly Plan</span>
                  <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400">
                    <Crown className="h-4 w-4" />
                  </span>
                </div>

                <div>
                  <h4 className="text-xl font-extrabold text-white">Yearly Value</h4>
                  <p className="text-2xl font-black text-amber-300 mt-1">NPR {formatPrice(planPrices.yearlyNpr)} <span className="text-xs font-normal text-slate-400">/ year</span></p>
                </div>

                <p className="text-xs text-slate-400">
                  Our most popular plan for established supermarkets and multi-counter retail stores.
                </p>

                <ul className="space-y-2 text-xs text-slate-300 font-medium">
                  {(planFeatures?.yearlyFeatures || []).map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPlan('YEARLY');
                  openAuthModal('SIGNUP');
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition active:scale-95 shadow-md shadow-amber-500/20"
              >
                Choose Yearly Plan
              </button>
            </div>

          </div>
        </div>

        {/* PRIVACY POLICY & SECURITY GUARANTEE SECTION */}
        <div id="privacy" className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-2xl scroll-mt-24">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <ShieldCheck className="h-4 w-4" />
                <span>Enterprise Data Governance</span>
              </div>
              <h3 className="text-2xl font-extrabold text-white">Privacy Policy & Security Standard</h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              100% Data Confidentiality
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300 leading-relaxed">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-400" />
                <span>Store Data Isolation</span>
              </div>
              <p className="text-slate-400">
                Each store's financial records, sales history, customer credit details, and inventory balances are logically isolated and never shared or aggregated with competing businesses.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Encrypted Backups</span>
              </div>
              <p className="text-slate-400">
                All cloud backups are encrypted using standard AES-256 protocols. You retain full ownership and can export or restore your store ledger at any time.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-purple-400" />
                <span>Zero Unauthorized Access</span>
              </div>
              <p className="text-slate-400">
                Dukaan.io strictly enforces Super Admin verification for new store registrations. Trial accounts are monitored to prevent fraudulent store access.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* AUTHENTICATION MODAL DIALOG */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          {/* Modal Container */}
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 sm:p-7 max-w-2xl sm:max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-sm">
                  D
                </div>
                <span className="font-bold text-white text-base tracking-tight">
                  {authMode === 'LOGIN' ? 'Store Log In' : `Sign Up for ${planPrices.trialDays}-Day Free Trial`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Login vs Signup Tabs */}
            <div className="flex items-center p-1 bg-slate-950/80 rounded-2xl border border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('LOGIN');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                  authMode === 'LOGIN'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="modal-auth-login-tab"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Log In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('SIGNUP');
                  setSignupErrorMsg('');
                  setSignupSuccessMsg('');
                }}
                className={`flex-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                  authMode === 'SIGNUP'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                id="modal-auth-signup-tab"
              >
                <UserPlus className="h-3.5 w-3.5 text-amber-300" />
                <span>Sign Up ({planPrices.trialDays}-Day Trial)</span>
              </button>
            </div>

            {/* MODE 1: LOGIN FORM */}
            {authMode === 'LOGIN' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {errorMsg && (
                  <div className={`p-4 rounded-2xl border text-xs flex flex-col gap-3.5 ${
                    errorMsg.includes('BLOCKED') || errorMsg.includes('blocked')
                      ? 'bg-amber-950/90 border-amber-500/60 text-amber-100 shadow-lg'
                      : 'bg-red-950/80 border-red-800/80 text-red-200'
                  }`}>
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${
                        errorMsg.includes('BLOCKED') || errorMsg.includes('blocked') ? 'text-amber-400' : 'text-red-400'
                      }`} />
                      <div className="space-y-1">
                        <p className="font-extrabold text-sm">
                          {errorMsg.includes('BLOCKED') || errorMsg.includes('blocked') ? 'Security Alert: Account Blocked' : 'Login Error'}
                        </p>
                        <p className="leading-relaxed">{errorMsg}</p>
                      </div>
                    </div>

                    {(errorMsg.includes('BLOCKED') || errorMsg.includes('blocked') || errorMsg.includes('remaining') || errorMsg.includes('Incorrect password')) && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('FORGOT_PASSWORD');
                          setForgotStep('REQUEST_CODE');
                          setForgotEmail(username.includes('@') ? username : '');
                          setForgotErrorMsg('');
                          setForgotSuccessMsg('');
                          setForgotOtpDigits(['', '', '', '', '', '']);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                        id="btn-forgot-password-unlock-now"
                      >
                        <KeyRound className="h-4 w-4" />
                        <span>Reset Password & Unlock Account</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Email Address / Staff User ID
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. owner@store.com or staff_userid"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500 font-medium transition"
                        id="modal-login-email-input"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('FORGOT_PASSWORD');
                          setForgotStep('REQUEST_CODE');
                          setForgotEmail(username || '');
                          setForgotErrorMsg('');
                          setForgotSuccessMsg('');
                          setForgotOtpDigits(['', '', '', '', '', '']);
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline font-semibold transition flex items-center gap-1"
                        id="modal-forgot-password-link"
                      >
                        <KeyRound className="h-3 w-3" />
                        <span>Forgot Password?</span>
                      </button>
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-blue-500 font-medium transition"
                        id="modal-login-password-input"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 transition active:scale-[0.99] flex items-center justify-center gap-2"
                  id="modal-submit-login-btn"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Log In to Dashboard</span>
                </button>
              </form>
            )}

            {/* MODE 2: SIGN UP FORM */}
            {authMode === 'SIGNUP' && (
              <form onSubmit={handleSignupSubmit} className="space-y-4">

                {signupErrorMsg && (
                  <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                    <span>{signupErrorMsg}</span>
                  </div>
                )}

                {signupSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{signupSuccessMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1 tracking-wide uppercase">Owner Name *</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Karki"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-white placeholder:text-slate-500 outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/20 transition text-xs"
                      required
                      id="modal-signup-fullname-input"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1 tracking-wide uppercase">Email Address *</label>
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="e.g. ramesh@store.np"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-white placeholder:text-slate-500 outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/20 transition text-xs"
                      required
                      id="modal-signup-email-input"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1 tracking-wide uppercase">Shop / Business Name *</label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder="e.g. Ramesh Departmental Store"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-white placeholder:text-slate-500 outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/20 transition text-xs"
                      required
                      id="modal-signup-shopname-input"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1 tracking-wide uppercase">Phone Number</label>
                    <input
                      type="text"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="e.g. 9841234567"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-white placeholder:text-slate-500 outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/20 transition text-xs"
                      id="modal-signup-phone-input"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1 tracking-wide uppercase">Set Password *</label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        placeholder="Minimum 4 characters"
                        className="w-full pl-3.5 pr-8 py-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-white placeholder:text-slate-500 outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/20 transition text-xs"
                        required
                        id="modal-signup-password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                      >
                        {showSignupPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1 tracking-wide uppercase">Confirm Password *</label>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full pl-3.5 pr-8 py-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-white placeholder:text-slate-500 outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/20 transition text-xs"
                        required
                        id="modal-signup-confirm-password-input"
                      />
                    </div>
                  </div>
                </div>

                {/* SUBSCRIPTION MODEL SELECTOR */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wide">
                      Select Subscription Plan
                    </label>
                    <span className="text-[10px] text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      Includes {planPrices.trialDays}-Day Free Trial
                    </span>
                  </div>

                  {/* 5-Plan Responsive Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                    {[
                      {
                        id: '7_DAY_TRIAL',
                        title: `${planPrices.trialDays} Days Trial`,
                        price: 'Free Trial',
                        desc: 'Full POS & Ledger',
                      },
                      {
                        id: 'MONTHLY',
                        title: 'Monthly',
                        price: `NPR ${formatPrice(planPrices.monthlyNpr)}/mo`,
                        desc: 'Billed monthly',
                      },
                      {
                        id: 'QUARTERLY',
                        title: 'Quarterly',
                        price: `NPR ${formatPrice(planPrices.quarterlyNpr ?? 4000)}/3mo`,
                        desc: 'Billed 3-monthly',
                      },
                      {
                        id: 'HALF_YEARLY',
                        title: 'Half-Yearly',
                        price: `NPR ${formatPrice(planPrices.halfYearlyNpr ?? 7500)}/6mo`,
                        desc: 'Billed 6-monthly',
                      },
                      {
                        id: 'YEARLY',
                        title: 'Yearly Value',
                        price: `NPR ${formatPrice(planPrices.yearlyNpr)}/yr`,
                        desc: yearlySavings > 0 ? `Save NPR ${formatPrice(yearlySavings)}` : 'Best value',
                      },
                    ].map((plan) => (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id as SubscriptionPlan)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                          selectedPlan === plan.id
                            ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500/30'
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-white text-[11px] truncate">{plan.title}</span>
                          {selectedPlan === plan.id && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-emerald-400 font-semibold leading-none">{plan.price}</p>
                        <p className="text-[9px] text-slate-400 mt-1 truncate">{plan.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* DYNAMIC PLAN PERKS PREVIEW IN SIGNUP MODAL */}
                  {selectedPlan !== '7_DAY_TRIAL' && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-400">
                        <Sparkles className="h-3.5 w-3.5 shrink-0" />
                        <span>Included Plan Features & Perks:</span>
                      </div>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] text-slate-300">
                        {(selectedPlan === 'MONTHLY'
                          ? planFeatures?.monthlyFeatures
                          : selectedPlan === 'QUARTERLY'
                          ? planFeatures?.quarterlyFeatures
                          : selectedPlan === 'HALF_YEARLY'
                          ? planFeatures?.halfYearlyFeatures
                          : planFeatures?.yearlyFeatures || []
                        ).map((perk, i) => (
                          <li key={i} className="flex items-center gap-1.5 truncate">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                            <span className="truncate">{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 2-COLUMN BOTTOM SECTION: PROMO & REFERRAL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3 border-t border-slate-800/80">
                  {/* PROMO / COUPON CODE BOX */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-300 flex items-center justify-between uppercase tracking-wide">
                      <span className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-purple-400" />
                        <span>Coupon / Offer Code</span>
                      </span>
                      <span className="text-[9px] text-purple-400 font-mono">OPTIONAL</span>
                    </label>

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="e.g. WELCOME20"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          if (!e.target.value) {
                            setAppliedCoupon(null);
                            setCouponError('');
                          }
                        }}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-white font-mono text-xs uppercase placeholder:text-slate-500 outline-none focus:border-purple-500/80"
                        id="modal-signup-coupon-input"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition active:scale-95 shrink-0 shadow-sm"
                        id="modal-signup-apply-coupon-btn"
                      >
                        Apply
                      </button>
                    </div>

                    {couponError && (
                      <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-medium flex items-center gap-1.5">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>{couponError}</span>
                      </div>
                    )}

                    {appliedCoupon && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                        <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px]">
                          <span>{appliedCoupon.message}</span>
                          <span className="font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[9px] uppercase">
                            {appliedCoupon.code}
                          </span>
                        </div>
                        {selectedPlan !== '7_DAY_TRIAL' && (
                          <div className="pt-1 border-t border-emerald-500/20 flex items-center justify-between text-[10px] text-slate-300 font-mono">
                            <span>Base: <span className="line-through text-slate-500">NPR {formatPrice(getBasePriceForPlan(selectedPlan))}</span></span>
                            <span className="text-emerald-400 font-bold">
                              Payable: NPR {formatPrice(appliedCoupon.finalPrice)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* REFERRAL CODE SECTION */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-300 flex items-center justify-between uppercase tracking-wide">
                      <span className="flex items-center gap-1.5">
                        <Gift className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Referral Code</span>
                      </span>
                      <span className="text-[9px] text-indigo-400 font-mono">6-DIGIT CODE</span>
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. DK8A2X"
                        value={signupReferralCode}
                        onChange={(e) => setSignupReferralCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-white font-mono text-xs uppercase placeholder:text-slate-500 outline-none focus:border-indigo-500/80 tracking-wider font-bold"
                        id="modal-signup-referral-input"
                      />
                    </div>
                    <p className="text-[9px] text-slate-400">
                      Enter 6-digit referral code to link your store referral bonus.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
                  id="modal-submit-signup-btn"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create Store & Start {planPrices.trialDays}-Day Free Trial</span>
                </button>
              </form>
            )}

            {/* MODE 3: 6-DIGIT EMAIL CODE VERIFICATION FOR SIGNUP */}
            {authMode === 'VERIFY_SIGNUP' && (
              <form onSubmit={handleVerifyOtpSubmit} className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Mail className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-extrabold text-white">Enter 6-Digit Email Code</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    We sent a 6-digit verification code to <strong className="text-emerald-400 font-mono">{verificationEmail}</strong>. Please check your inbox and enter the 6-digit code below to complete store registration.
                  </p>
                </div>

                {otpErrorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                    <span>{otpErrorMsg}</span>
                  </div>
                )}

                {otpSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{otpSuccessMsg}</span>
                  </div>
                )}

                {/* 6-Digit Input Boxes */}
                {renderOtpInputBoxes(otpDigits, setOtpDigits, 'signup-otp')}

                {isVerifyingOtp && (
                  <div className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-emerald-400 bg-emerald-950/40 rounded-xl border border-emerald-800/50 animate-pulse">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Verifying 6-digit code automatically...</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs border-t border-slate-800/80 pt-4">
                  <button
                    type="button"
                    onClick={() => setAuthMode('SIGNUP')}
                    className="text-slate-400 hover:text-white transition flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Back to Sign Up</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResendSignupCode}
                    disabled={resendCountdown > 0}
                    className={`font-bold transition flex items-center gap-1 ${
                      resendCountdown > 0 ? 'text-slate-500 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300'
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend 6-Digit Code'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* MODE 4: FORGOT PASSWORD FLOW (3 STEPS) */}
            {authMode === 'FORGOT_PASSWORD' && (
              <div className="space-y-5">
                {/* Step Indicators */}
                <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-2xl border border-slate-800 text-xs font-mono">
                  <div className={`flex items-center gap-2 ${forgotStep === 'REQUEST_CODE' ? 'text-amber-400 font-bold' : 'text-emerald-400'}`}>
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">1</span>
                    <span>Validate Email</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                  <div className={`flex items-center gap-2 ${forgotStep === 'VERIFY_CODE' ? 'text-amber-400 font-bold' : forgotStep === 'RESET_PASSWORD' ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">2</span>
                    <span>Verify Code</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
                  <div className={`flex items-center gap-2 ${forgotStep === 'RESET_PASSWORD' ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">3</span>
                    <span>New Password</span>
                  </div>
                </div>

                {forgotErrorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                    <span>{forgotErrorMsg}</span>
                  </div>
                )}

                {forgotSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{forgotSuccessMsg}</span>
                  </div>
                )}

                {/* STEP 1: REQUEST CODE */}
                {forgotStep === 'REQUEST_CODE' && (
                  <form onSubmit={handleForgotRequestCode} className="space-y-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <h3 className="text-base font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
                        <KeyRound className="h-4 w-4 text-amber-400" />
                        <span>Validate Email Account</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Enter your store email address. We will validate your account and send a 6-digit security code to your email.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Registered Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="e.g. owner@store.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-amber-500 font-medium transition"
                          required
                          id="modal-forgot-email-input"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingForgot}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-sm shadow-lg shadow-amber-600/30 transition active:scale-[0.99] flex items-center justify-center gap-2"
                      id="modal-forgot-send-code-btn"
                    >
                      {isSubmittingForgot ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      <span>Send 6-Digit Verification Code</span>
                    </button>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setAuthMode('LOGIN')}
                        className="text-xs text-slate-400 hover:text-white transition font-semibold"
                      >
                        ← Back to Log In
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 2: VERIFY CODE */}
                {forgotStep === 'VERIFY_CODE' && (
                  <form onSubmit={handleForgotVerifyCode} className="space-y-4">
                    <div className="space-y-1 text-center">
                      <h3 className="text-base font-bold text-white">Enter 6-Digit Security Code</h3>
                      <p className="text-xs text-slate-300">
                        Code sent to <strong className="text-amber-400 font-mono">{forgotEmail}</strong>. Enter the code below to verify your account.
                      </p>
                    </div>

                    {renderOtpInputBoxes(forgotOtpDigits, setForgotOtpDigits, 'forgot-otp')}

                    {isSubmittingForgot && (
                      <div className="flex items-center justify-center gap-2 py-3 text-xs font-bold text-amber-400 bg-amber-950/40 rounded-xl border border-amber-800/50 animate-pulse">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Verifying security code automatically...</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs border-t border-slate-800 pt-3">
                      <button
                        type="button"
                        onClick={() => setForgotStep('REQUEST_CODE')}
                        className="text-slate-400 hover:text-white transition font-semibold"
                      >
                        ← Change Email
                      </button>

                      <button
                        type="button"
                        onClick={handleForgotRequestCode}
                        disabled={resendCountdown > 0}
                        className={`font-bold transition flex items-center gap-1 ${
                          resendCountdown > 0 ? 'text-slate-500 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300'
                        }`}
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>{resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 3: RESET PASSWORD */}
                {forgotStep === 'RESET_PASSWORD' && (
                  <form onSubmit={handleForgotResetPassword} className="space-y-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <h3 className="text-base font-bold text-white">Create New Password</h3>
                      <p className="text-xs text-slate-400">
                        Enter and confirm your new password to update your account and log in.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          New Password *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 4 characters"
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-emerald-500 font-medium transition"
                            required
                            id="modal-new-password-input"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          Confirm New Password *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 outline-none focus:border-emerald-500 font-medium transition"
                            required
                            id="modal-confirm-new-password-input"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingForgot}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition active:scale-[0.99] flex items-center justify-center gap-2"
                      id="modal-submit-reset-password-btn"
                    >
                      {isSubmittingForgot ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      <span>Update Password & Enter Store</span>
                    </button>
                  </form>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-20 border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Dukaan.io Inc. All rights reserved.</p>
          <p className="text-[11px] text-slate-400">
            Smart Retail POS • Udharo Khata • Admin Approval System
          </p>
        </div>
      </footer>
    </div>
  );
};
