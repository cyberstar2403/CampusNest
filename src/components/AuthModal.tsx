import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { X, LogIn, UserPlus, Mail, Lock, User, Phone, GraduationCap, Building, ShieldCheck, AlertCircle, Upload, CheckCircle2, RefreshCw, Send, HelpCircle, ExternalLink, Info } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'student_register' | 'agent_register' | 'admin_login';
  onClose: () => void;
  onSuccess?: (role: string) => void;
  promptMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
  promptMessage,
}) => {
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<'login' | 'student_register' | 'agent_register' | 'admin_login'>(
    initialMode || 'login'
  );

  // Common Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Student Form states
  const [matricNumber, setMatricNumber] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [level, setLevel] = useState('100 Level');

  // Agent Form states
  const [agencyName, setAgencyName] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [nin, setNin] = useState('');
  const [idType, setIdType] = useState('National ID (NIN)');
  const [govIdFile, setGovIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentSuccessMsg, setAgentSuccessMsg] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showManualSteps, setShowManualSteps] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setAgentSuccessMsg(null);
      setResendFeedback(null);
      setShowManualSteps(false);
    }
  }, [isOpen, initialMode]);

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setResendFeedback({
        type: 'error',
        text: 'Please enter your email address in the field below first.',
      });
      return;
    }

    setResendLoading(true);
    setResendFeedback(null);
    try {
      await authService.resendConfirmationEmail(email.trim());
      setResendFeedback({
        type: 'success',
        text: `Verification link resent to ${email.trim()}! Check your inbox and spam/junk folder.`,
      });
    } catch (err: any) {
      setResendFeedback({
        type: 'error',
        text: err?.message || 'Could not resend email. Please verify the email or use the manual Supabase steps below.',
      });
    } finally {
      setResendLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAgentSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login' || mode === 'admin_login') {
        await authService.signIn(email.trim(), password);
        const current = await authService.getCurrentProfile();
        
        if (!current || !current.profile) {
          throw new Error('Unable to retrieve your user account profile from the database. Please verify your connection or contact support.');
        }

        await refreshProfile();

        if (mode === 'admin_login' && current.profile.role !== 'admin') {
          setError(`Authentication succeeded, but this account has role "${current.profile.role}" in the database (requires "admin"). Please update your profile role to "admin" in Supabase SQL editor or sign in with an admin account.`);
          if (onSuccess) {
            onSuccess(current.profile.role);
          }
          return;
        }

        if (onSuccess) {
          onSuccess(current.profile.role);
        }
        onClose();
      } else if (mode === 'student_register') {
        // Student Registration
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        if (!phoneNumber.trim()) {
          throw new Error('Phone number is required.');
        }

        const regRes = await authService.registerStudent({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          matricNumber: matricNumber.trim() || undefined,
          department,
          level,
        });

        if (!regRes.session) {
          setError('Account created! Please check your email or sign in with your credentials.');
          setMode('login');
        } else {
          await refreshProfile();
          if (onSuccess) onSuccess('student');
          onClose();
        }
      } else if (mode === 'agent_register') {
        // Agent Registration
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        if (!phoneNumber.trim()) {
          throw new Error('Phone number is required for agents.');
        }
        if (!nin.trim() || nin.trim().length < 10) {
          throw new Error('Please enter a valid National Identification Number (NIN) or ID Number.');
        }

        await authService.registerAgent({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim(),
          agencyName: agencyName.trim() || 'Independent Agent',
          officeAddress: officeAddress.trim() || 'Wukari, Taraba State',
          nin: nin.trim(),
          idType,
          govIdFile,
          selfieFile,
        });

        await refreshProfile();
        setAgentSuccessMsg('Your Agent Application has been submitted successfully! It is now pending admin review.');
        setTimeout(() => {
          if (onSuccess) onSuccess('agent');
          onClose();
        }, 3000);
      }
    } catch (err: any) {
      console.warn('Auth notice:', err);
      const msg = err?.message || String(err) || '';
      if (mode === 'login' || mode === 'admin_login') {
        if (msg.includes('Email not confirmed')) {
          setError('Email address not confirmed yet. Please check your inbox or sign in with verified credentials.');
        } else if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
          setError('Invalid email address or password. If you do not have an account yet, please register below.');
        } else if (msg.includes('Failed to fetch') || msg.includes('fetch') || msg.includes('NetworkError')) {
          setError('Network connectivity error. Please check your internet connection and try signing in again.');
        } else {
          setError(msg || 'Invalid email or password. Please try again.');
        }
      } else {
        if (msg.includes('already registered') || msg.includes('already exists')) {
          setError('An account with this email address already exists. Please sign in instead.');
        } else if (msg.includes('Failed to fetch') || msg.includes('fetch') || msg.includes('NetworkError')) {
          setError('Network connectivity error. Please check your internet connection and try again.');
        } else {
          setError(msg || 'Registration failed. Please check your details.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-gray-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
              mode === 'login' || mode === 'admin_login' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('student_register'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
              mode === 'student_register' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Register
          </button>
          <button
            type="button"
            onClick={() => { setMode('agent_register'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 ${
              mode === 'agent_register' ? 'bg-white text-purple-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Agent Register
          </button>
        </div>

        {promptMessage && !agentSuccessMsg && !error && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-medium flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{promptMessage}</span>
          </div>
        )}

        {agentSuccessMsg && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Application Submitted!</p>
              <p>{agentSuccessMsg}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1 space-y-2.5">
              <p className="font-semibold text-red-800">{error}</p>
              
              {/* Unconfirmed Email Special Action Panel */}
              {(error.includes('Email address not confirmed') || error.includes('Email not confirmed')) && (
                <div className="p-3 bg-white/80 rounded-lg border border-red-200/80 space-y-2 text-slate-800">
                  <div className="text-[11px] text-slate-600 leading-relaxed">
                    Supabase Auth requires email verification before login. If you registered with a real address, check your inbox and <strong>Spam/Junk</strong> folder.
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={resendLoading}
                      onClick={handleResendConfirmation}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      {resendLoading ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Resending...
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          Resend Confirmation Link
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowManualSteps(!showManualSteps)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                    >
                      <HelpCircle className="w-3 h-3 text-slate-500" />
                      {showManualSteps ? 'Hide Manual Steps' : 'Manual Setup Guide (Supabase)'}
                    </button>
                  </div>

                  {resendFeedback && (
                    <div className={`p-2 rounded-lg text-[11px] font-medium flex items-start gap-1.5 ${
                      resendFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {resendFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <span>{resendFeedback.text}</span>
                    </div>
                  )}

                  {showManualSteps && (
                    <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200 text-[11px] text-amber-950 space-y-2.5">
                      <div className="font-bold text-amber-900 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-amber-700" />
                        Developer / Admin Manual Solutions:
                      </div>
                      
                      <div className="p-2 bg-amber-100/70 border border-amber-300/80 rounded-md text-amber-900 text-[10px] leading-snug">
                        <strong>Already toggled &quot;Confirm email&quot; OFF?</strong> Supabase does <em>not</em> retroactively confirm accounts created before the toggle was disabled. To fix your existing account, follow step 1 below or re-register.
                      </div>

                      <ol className="list-decimal list-inside space-y-2 pl-1 text-slate-700 font-medium">
                        <li>
                          <strong className="text-slate-900">Manually Confirm Existing Account (Instant fix):</strong>
                          <div className="pl-4 text-slate-600 text-[10px] mt-0.5">
                            In Supabase Dashboard &rarr; <strong>Authentication</strong> &rarr; <strong>Users</strong>, locate the user email, click the three dots (<code className="bg-amber-100 px-1 py-0.2 rounded font-mono">...</code>), and select <strong>&quot;Confirm email&quot;</strong> (or <strong>&quot;Auto-confirm&quot;</strong>). You can then sign in immediately!
                          </div>
                        </li>
                        <li>
                          <strong className="text-slate-900">Or Delete &amp; Re-register:</strong>
                          <div className="pl-4 text-slate-600 text-[10px] mt-0.5">
                            In <strong>Users</strong>, click <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">...</code> &rarr; <strong>Delete user</strong>, then register again on CampusNest. With &quot;Confirm email&quot; toggled off, your new account will be confirmed on creation.
                          </div>
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {(mode === 'login' || mode === 'admin_login') && (error.includes('Invalid') || error.includes('credentials')) && (
                <div className="pt-1 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => { setMode('student_register'); setError(null); }}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" /> Register Student Account
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('agent_register'); setError(null); }}
                    className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3 h-3" /> Register Agent Account
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode !== 'login' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={mode === 'agent_register' ? 'e.g. Alh. Ibrahim Garba' : 'John Doe'}
                  className="w-full pl-10 pr-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full pl-10 pr-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
              />
            </div>
          </div>

          {mode !== 'login' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08012345678"
                  className="w-full pl-10 pr-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                />
              </div>
            </div>
          )}

          {/* Student Specific Fields */}
          {mode === 'student_register' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Microbiology">Microbiology</option>
                  <option value="Economics">Economics</option>
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Political Science">Political Science</option>
                  <option value="Public Administration">Public Admin</option>
                  <option value="Sociology">Sociology</option>
                  <option value="Other">Other Department</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Academic Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                >
                  <option value="100 Level">100 Level</option>
                  <option value="200 Level">200 Level</option>
                  <option value="300 Level">300 Level</option>
                  <option value="400 Level">400 Level</option>
                  <option value="500 Level">500 Level</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>
            </div>
          )}

          {/* Agent Specific Fields */}
          {mode === 'agent_register' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Agency / Brand Name
                  </label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="e.g. Wukari Prime Realty"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Office / Contact Address
                  </label>
                  <input
                    type="text"
                    value={officeAddress}
                    onChange={(e) => setOfficeAddress(e.target.value)}
                    placeholder="e.g. Back Gate Road, Wukari"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  ID Type & NIN / Identity Number <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="px-2 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                  >
                    <option value="National ID (NIN)">NIN</option>
                    <option value="Voters Card">Voter's Card</option>
                    <option value="Drivers License">Driver's License</option>
                    <option value="Passport">Passport</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={nin}
                    onChange={(e) => setNin(e.target.value)}
                    placeholder="11-digit NIN or ID Number"
                    className="sm:col-span-2 px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900 font-mono"
                  />
                </div>
              </div>

              {/* File Upload Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Upload Government ID Card
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setGovIdFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Upload Verification Selfie
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
              />
            </div>
          </div>

          {mode !== 'login' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-sm font-semibold text-white rounded-xl shadow-md transition-colors disabled:opacity-50 mt-2 ${
              mode === 'agent_register'
                ? 'bg-purple-700 hover:bg-purple-800'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading
              ? 'Processing...'
              : mode === 'login'
              ? 'Sign In to CampusNest'
              : mode === 'agent_register'
              ? 'Submit Agent Registration'
              : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-4">
          {mode === 'login' ? (
            <>
              Need an account?{' '}
              <button
                type="button"
                onClick={() => setMode('student_register')}
                className="text-blue-600 font-semibold hover:underline mr-2"
              >
                Register
              </button>
              |
              <button
                type="button"
                onClick={() => setMode('agent_register')}
                className="text-purple-700 font-semibold hover:underline ml-2"
              >
                Register as Agent
              </button>
            </>
          ) : (
            <>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-blue-600 font-semibold hover:underline"
              >
                Sign In
              </button>
            </>
          )}
        </p>

        {mode === 'agent_register' && (
          <p className="text-[11px] text-gray-400 text-center mt-2 leading-tight">
            Agent applications undergo admin verification before full listing privileges are enabled.
          </p>
        )}
      </div>
    </div>
  );
};
