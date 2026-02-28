import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle, ShieldAlert } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/login`, // Or a dedicated reset-password route
            });

            if (error) throw error;
            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#0B0F19] text-white p-4">
            <div className="w-full max-w-sm bg-[#131B2C] border border-gray-800 rounded-xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <ShieldAlert size={48} className="text-indigo-500 mx-auto mb-4 opacity-80" />
                    <h1 className="text-2xl font-bold text-white mb-2">Emergency Override</h1>
                    <p className="text-gray-400 text-sm">Initialize security key recovery sequence</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-md mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-md mb-6 text-center flex flex-col items-center">
                        <CheckCircle size={36} className="mb-3 text-emerald-500" />
                        <h3 className="font-bold text-lg text-emerald-300">Signal Transmitted</h3>
                        <p className="text-sm mt-2 opacity-80">A secure hyper-link has been dispatched to that address. It will self-destruct shortly.</p>
                        <Link to="/login" className="mt-6 text-emerald-400 hover:text-emerald-300 font-semibold border-b border-transparent hover:border-emerald-300 transition-all text-sm">
                            Return to Gateway
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleReset} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Target Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-3 text-gray-500" />
                                <input
                                    type="email"
                                    className="w-full bg-[#0B0F19] border border-gray-700 rounded-md px-4 py-2.5 pl-10 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your-comlink@domain.com"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? 'Transmitting...' : 'Dispatch Reset Link'}
                        </button>

                        <div className="mt-6 text-center pt-4 border-t border-gray-800">
                            <Link to="/login" className="text-sm border-b border-transparent hover:border-gray-400 text-gray-400 transition-all">
                                Cancel Override Sequence
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
