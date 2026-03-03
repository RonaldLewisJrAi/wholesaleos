import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const AuthCallback = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing');
    const [message, setMessage] = useState('Verifying authentication tokens...');

    useEffect(() => {
        const processAuth = async () => {
            try {
                // Supabase SDK automatically intercepts the hash fragment on load.
                // We just need to give it a brief moment, then check if we have a valid session.
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;

                if (session) {
                    setStatus('success');
                    setMessage('Identity confirmed successfully. Rerouting to your workspace...');

                    // Allow the user to see the success message briefly before bouncing them
                    setTimeout(() => {
                        navigate('/dashboard', { replace: true });
                    }, 2500);
                } else {
                    setStatus('error');
                    setMessage('Verification link has expired or is invalid. Please request a new link or try logging in.');

                    setTimeout(() => {
                        navigate('/login', { replace: true });
                    }, 4000);
                }
            } catch (err) {
                console.error("Auth callback processing failed:", err);
                setStatus('error');
                setMessage(err.message || 'An unexpected error occurred during verification.');

                setTimeout(() => {
                    navigate('/login', { replace: true });
                }, 4000);
            }
        };

        processAuth();
    }, [navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#0B0F19] text-white p-4 animate-fade-in">
            <div className="w-full max-w-md bg-[#131B2C] border border-gray-800 rounded-xl p-8 shadow-2xl text-center flex flex-col items-center">

                {status === 'processing' && (
                    <>
                        <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
                        <h2 className="text-xl font-bold text-white mb-2">Analyzing Access Token</h2>
                        <p className="text-gray-400 text-sm">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle className="w-16 h-16 text-emerald-500 mb-6" />
                        <h2 className="text-xl font-bold text-white mb-2">Verification Complete</h2>
                        <p className="text-emerald-400/80 text-sm">{message}</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
                        <h2 className="text-xl font-bold text-white mb-2">Authentication Failed</h2>
                        <p className="text-red-400/80 text-sm">{message}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="mt-6 w-full bg-[#0B0F19] border border-gray-700 hover:border-indigo-500 text-white font-medium py-2.5 px-4 rounded-md transition-colors"
                        >
                            Return to Login
                        </button>
                    </>
                )}

            </div>
        </div>
    );
};

export default AuthCallback;
