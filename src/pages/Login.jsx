import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!supabase) {
            setError("Unable to connect: Supabase environment configuration is missing.");
            return;
        }

        setLoading(true);
        setError(null);



        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                setError(error.message);
                setLoading(false);
                return;
            }

            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#0B0F19] text-white p-4">
            <div className="w-full max-w-md bg-[#131B2C] border border-gray-800 rounded-xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Wholesale OS</h1>
                    <p className="text-gray-400 text-sm">Sign in to access your acquisition pipeline</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-md mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            autoComplete="email"
                            className="w-full bg-[#0B0F19] border border-gray-700 rounded-md px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@wholesaleos.com"
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-400">Password</label>
                        </div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                autoComplete="current-password"
                                className="w-full bg-[#0B0F19] border border-gray-700 rounded-md px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors pr-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-3.5 text-gray-500 hover:text-gray-300 transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-400">
                            <input
                                type="checkbox"
                                className="rounded border-gray-700 bg-[#0B0F19] accent-indigo-500 w-4 h-4 cursor-pointer"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            Keep me logged in
                        </label>
                        <Link to="/forgot-password" className="text-sm border-b border-transparent hover:border-indigo-400 text-indigo-400 transition-colors">
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>

                    <div className="mt-6 text-center pt-4 border-t border-gray-800">
                        <p className="text-sm text-gray-400 mb-3">
                            Don't have an account yet?
                        </p>
                        <Link
                            to="/signup"
                            className="block w-full bg-[#131B2C] border border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-400 font-medium py-2.5 px-4 rounded-md transition-all text-center mb-4"
                        >
                            Sign Up
                        </Link>


                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
