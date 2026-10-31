import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { BrightloopLogo } from '../../components/layout/Sidebar';
import { ShieldCheck, Info, CheckCircle2, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@brightloop.com');
  const [password, setPassword] = useState('Admin@Brightloop2026!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFirebaseGuide, setShowFirebaseGuide] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Verify credentials or use demo presets below.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoRole: 'admin' | 'staff' | 'customer') => {
    if (demoRole === 'admin') {
      setEmail('admin@brightloop.com');
      setPassword('Admin@Brightloop2026!');
    } else if (demoRole === 'staff') {
      setEmail('staff@brightloop.com');
      setPassword('Staff@Brightloop2026!');
    } else {
      setEmail('rohit@acme-tech.com');
      setPassword('Customer@Acme2026!');
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] bg-grid-pattern flex flex-col items-center justify-center p-4 selection:bg-blue-500 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-xl bg-[#0F172A] border border-[#1E293B] flex items-center justify-center shadow-lg shadow-blue-500/10 mb-3">
            <BrightloopLogo className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Brightloop Subscription Management
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Enterprise Infrastructure • Engineered by <span className="text-blue-400 font-semibold">Team Ripple</span>
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-[#1E293B] bg-[#0C101A]/95 backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-white font-semibold">Sign In</CardTitle>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                SSO & RBAC Active
              </span>
            </div>
            <CardDescription className="text-xs text-slate-400">
              Enter your corporate credentials to access billing controls
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-md text-xs space-y-1">
                  <p className="font-semibold">{error}</p>
                  <p className="text-[11px] text-rose-400/80">
                    If this is a Firebase Auth API key error, use the quick personas below to enter immediately.
                  </p>
                </div>
              )}

              <Input
                label="Corporate Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@brightloop.com"
                required
                className="bg-[#070A11] border-[#1E293B] text-white placeholder:text-slate-600 focus-visible:ring-blue-500 text-xs h-9"
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="bg-[#070A11] border-[#1E293B] text-white placeholder:text-slate-600 focus-visible:ring-blue-500 text-xs h-9"
              />

              {/* Quick Persona Fill */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                    1-Click Test Personas:
                  </span>
                  <span className="text-[10px] text-slate-400">Auto-fills credentials</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin')}
                    className="px-2 py-1.5 bg-[#131B2E] hover:bg-[#1A253F] border border-[#1E2D4A] rounded text-xs font-medium text-slate-200 transition-colors text-center"
                  >
                    👑 Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('staff')}
                    className="px-2 py-1.5 bg-[#131B2E] hover:bg-[#1A253F] border border-[#1E2D4A] rounded text-xs font-medium text-slate-200 transition-colors text-center"
                  >
                    💼 Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('customer')}
                    className="px-2 py-1.5 bg-[#131B2E] hover:bg-[#1A253F] border border-[#1E2D4A] rounded text-xs font-medium text-slate-200 transition-colors text-center"
                  >
                    🏢 Client
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button type="submit" isLoading={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-9">
                Sign In to Workspace
              </Button>

              <div className="flex items-center justify-between w-full text-xs text-slate-400 pt-1 border-t border-[#192233]">
                <Link to="/register" className="text-blue-400 hover:underline">
                  Customer Self-Registration
                </Link>
                <button
                  type="button"
                  onClick={() => setShowFirebaseGuide(!showFirebaseGuide)}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[11px]"
                >
                  Firebase Setup Note {showFirebaseGuide ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Collapsible Firebase Console Checklist */}
        {showFirebaseGuide && (
          <div className="p-4 bg-[#0E1526] border border-[#1E293B] rounded-xl text-xs space-y-2 text-slate-300 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-blue-400 text-xs">
              <Terminal className="h-4 w-4" /> Firebase Console Setup Checklist
            </div>
            <p className="text-[11px] text-slate-400">
              If Firebase returns an API key error, make sure these 2 toggles are enabled in your Firebase Console:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
              <li>
                <span className="font-semibold text-white">Authentication → Sign-in method:</span> Click <strong>Email/Password</strong> and toggle <strong>Enable</strong>.
              </li>
              <li>
                <span className="font-semibold text-white">Authentication → Settings → Authorized domains:</span> Add your Vercel domain (e.g. <code>*.vercel.app</code>).
              </li>
              <li>
                <span className="font-semibold text-white">Firestore Database:</span> Click <strong>Create Database</strong> and select <strong>Start in test mode</strong>.
              </li>
            </ol>
          </div>
        )}

        {/* Attribution */}
        <div className="text-center text-[11px] text-slate-400 font-mono">
          Brightloop Software © 2026 • Built by Team Ripple
        </div>
      </div>
    </div>
  );
};
