import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@brightloop.com');
  const [password, setPassword] = useState('Admin@Brightloop2026!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary to-violet-500 items-center justify-center text-white shadow-xl shadow-primary/30 mb-3">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Brightloop Subscription Management System
          </h1>
          <p className="text-sm font-semibold text-indigo-300 mt-1">Built by Team Ripple</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/90 text-slate-100 shadow-2xl backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-xl text-white">Sign In to Workspace</CardTitle>
            <CardDescription className="text-slate-400">
              Access the unified subscription lifecycle & recurring billing platform
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-medium">
                  {error}
                </div>
              )}

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@brightloop.com"
                required
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
              />

              {/* Quick Persona Fill for reviewers */}
              <div className="pt-2">
                <p className="text-[11px] uppercase font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                  Quick Demo Accounts:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin')}
                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-medium text-slate-200 transition-colors"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('staff')}
                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-medium text-slate-200 transition-colors"
                  >
                    Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('customer')}
                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-medium text-slate-200 transition-colors"
                  >
                    Customer
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" isLoading={isLoading} className="w-full bg-primary hover:bg-primary/90">
                Sign In
              </Button>

              <div className="flex items-center justify-between w-full text-xs text-slate-400">
                <Link to="/register" className="hover:text-white transition-colors">
                  Customer Registration
                </Link>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">Enterprise Security Active</span>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer Credit */}
        <div className="text-center mt-6 text-xs text-slate-500">
          Brightloop Software © 2026. Built by Team Ripple.
        </div>
      </div>
    </div>
  );
};

