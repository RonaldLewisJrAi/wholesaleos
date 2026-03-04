import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Building, Mail, Lock, User, CheckCircle, Eye, EyeOff } from 'lucide-react';

const Signup = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        company: '',
        email: '',
        password: '',
        confirmPassword: '',
        persona: 'WHOLESALER',
        termsAccepted: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (!formData.termsAccepted) {
            setError("You must accept the system Terms of Service to create an identity.");
            return;
        }

        setLoading(true);

        try {
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        company: formData.company,
                        primary_persona: formData.persona
                    }
                }
            });

            if (signUpError) throw signUpError;

            // In projects requiring Email Confirmation, the user is NOT issued a session on signup.
            // Halt execution here to avoid 'new row violates row-level security policy' on organizations table.
            // The Bootstrap Protocol in useSubscription.jsx will build their Organization on first login.
            if (!authData.session) {
                setSuccessMessage("Identity secured! Please check your inbox for an activation link. You must verify your email before logging in.");
                setTimeout(() => {
                    navigate('/login');
                }, 4000);
                return; // Stop execution
            }

            const userId = authData.user.id;

            // Second: Create the Organization
            const { data: orgData, error: orgError } = await supabase
                .from('organizations')
                .insert({
                    name: formData.company,
                    subscription_tier: 'BASIC', // Default tier
                    subscription_status: 'DEMO', // New users start in Demo restriction
                    team_seat_limit: 1
                })
                .select()
                .single();

            if (orgError) throw orgError;

            // Third: Link the Profile to the Organization and assign 'Owner' role
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    organization_id: orgData.id,
                    role: 'Owner',
                    system_role: 'ADMIN' // They are an admin of their own default setup
                })
                .eq('id', userId);

            if (profileError) throw profileError;

            // Wait, the public.profiles trigger usually creates the db row.
            // On successful creation, send them to login.
            setSuccessMessage("Identity secured! Please check your email to verify your account before logging in.");

            // Auto redirect after a few seconds
            setTimeout(() => {
                navigate('/login');
            }, 4000);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#0B0F19] text-white p-4 animate-fade-in">
            <div className="w-full max-w-md bg-[#131B2C] border border-gray-800 rounded-xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 mb-2">Initialize Identity</h1>
                    <p className="text-gray-400 text-sm">Deploy your Wholesale OS architecture</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-md mb-6 text-sm text-center animate-slide-up">
                        {error}
                    </div>
                )}

                {successMessage ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-md mb-6 text-center animate-slide-up flex flex-col items-center">
                        <CheckCircle size={48} className="mb-4 text-emerald-500" />
                        <span className="font-semibold text-lg">{successMessage}</span>
                    </div>
                ) : (
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">First Name</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3 top-3 text-gray-500" />
                                    <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                                        className="w-full bg-[#0B0F19] border border-gray-700 rounded-md py-2.5 pl-9 pr-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Last Name</label>
                                <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                                    className="w-full bg-[#0B0F19] border border-gray-700 rounded-md px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Organization / Company</label>
                            <div className="relative">
                                <Building size={16} className="absolute left-3 top-3 text-gray-500" />
                                <input required type="text" name="company" value={formData.company} onChange={handleChange}
                                    className="w-full bg-[#0B0F19] border border-gray-700 rounded-md py-2.5 pl-9 pr-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Email Directive</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-3 text-gray-500" />
                                <input required type="email" name="email" value={formData.email} onChange={handleChange}
                                    className="w-full bg-[#0B0F19] border border-gray-700 rounded-md py-2.5 pl-9 pr-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Primary Operation Persona</label>
                            <select name="persona" value={formData.persona} onChange={handleChange}
                                className="w-full bg-[#0B0F19] border border-gray-700 rounded-md px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm">
                                <option value="WHOLESALER">Wholesaler (Default Pipeline)</option>
                                <option value="INVESTOR">Investor (Buy Box Matrix)</option>
                                <option value="REALTOR">Realtor (Listings & Comps)</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Security Key (Password)</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3 top-3 text-gray-500 z-10" />
                                    <input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full bg-[#0B0F19] border border-gray-700 rounded-md py-2.5 pl-9 pr-10 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300 transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Verify Key</label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full bg-[#0B0F19] border border-gray-700 rounded-md py-2.5 px-3 pr-10 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300 transition-colors"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <label className="flex flex-row items-start gap-3 mt-6 cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
                            <input required type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange}
                                className="mt-1 bg-[#0B0F19] border-gray-600 rounded" />
                            <span className="text-xs text-gray-400 leading-tight">
                                By checking this, I irrevocably agree to the Wholesale OS <Link to="/terms" className="text-indigo-400 hover:text-indigo-300">Master Services Agreement</Link> and Data Compliance Protocol.
                            </span>
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-md transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 mt-6"
                        >
                            {loading ? 'Initializing Identity Matrix...' : 'Execute Deployment'}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center pt-6 border-t border-gray-800">
                    <p className="text-sm text-gray-400 mb-3">
                        Already have an account?
                    </p>
                    <Link
                        to="/login"
                        className="block w-full bg-[#131B2C] border border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-400 font-medium py-2.5 px-4 rounded-md transition-all text-center"
                    >
                        Return to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
