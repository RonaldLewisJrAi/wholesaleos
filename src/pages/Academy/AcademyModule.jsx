import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, CheckCircle, MessageSquare, AlertTriangle, BookOpen, Shield, Target, Calculator } from 'lucide-react';
import { useGuidance } from '../../contexts/GuidanceContext';

const MODULE_DATA = {
    'foundations': {
        title: 'Stage 1: Foundations',
        description: 'Core concepts, legalities, and what wholesaling is NOT.',
        videoTitle: 'Welcome to Real Estate Wholesaling',
        sections: [
            {
                heading: 'What is Wholesaling?',
                text: 'Wholesaling is acquiring the legal right to purchase a property via a contract, and then assigning that right to an end buyer for a fee. You are NOT selling the property; you are selling the contract.',
                icon: BookOpen
            },
            {
                heading: 'Legal & Compliance',
                text: 'Never market properties without Proof of Control (an executed agreement). Always disclose you are assigning your contractual rights. Follow state laws regarding licensure.',
                icon: Shield
            },
            {
                heading: 'Common Terminology',
                text: 'ARV = After Repair Value. MAO = Maximum Allowable Offer. EMD = Earnest Money Deposit. Assignment Fee = Your Profit.',
                icon: MessageSquare
            }
        ],
        oscarPrompts: ['OSCAR: Explain assignment fees', 'OSCAR: What is earnest money?', 'OSCAR: Difference between assignment and double close']
    },
    'finding-deals': {
        title: 'Stage 2: Finding Deals',
        description: 'Acquisition strategies and lead generation.',
        videoTitle: 'Driving for Dollars & Sourcing Lists',
        sections: [
            {
                heading: 'Acquisition Strategies',
                text: 'Driving for Dollars, List Pulling (Absentee, Probates, Tax Delinquent), Cold Calling, SMS Marketing, Direct Mail, Networking.',
                icon: Target
            },
            {
                heading: 'Seller Communication',
                text: 'Use the 4 Pillars of Motivation: Condition, Timeline, Motivation, Price. Never negotiate price before understanding motivation.',
                icon: MessageSquare
            }
        ],
        oscarPrompts: ['OSCAR: Generate a cold calling script', 'OSCAR: How do I pull an absentee owner list?']
    },
    'deal-analysis': {
        title: 'Stage 3: Deal Analysis',
        description: 'ARV estimation, repair calculations, MAO, and ROI math.',
        videoTitle: 'The Math Behind the Deal',
        sections: [
            {
                heading: 'Calculating MAO',
                text: 'MAO = (ARV x 70%) - Repairs - Assignment Fee. This formula ensures your cash buyer has enough equity to flip the house profitably.',
                icon: Calculator
            },
            {
                heading: 'Using the Deal Analyzer',
                text: 'Always back up your ARV with 3 solid comps sold within the last 6 months, half a mile away, and +/- 10% sqft.',
                icon: BookOpen
            }
        ],
        oscarPrompts: ['OSCAR: Walk me through a deal analysis', 'OSCAR: Help me calculate MAO']
    }
};

export default function AcademyModule() {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const { addContext } = useGuidance();

    // Fallback to empty data if not defined
    const data = MODULE_DATA[moduleId] || MODULE_DATA['foundations'];

    const handlePromptOscar = (promptText) => {
        addContext(promptText);
        // You would typically trigger the assistant panel opening here
    };

    return (
        <div className="p-8 animate-fade-in max-w-4xl mx-auto pb-12">
            <button
                onClick={() => navigate('/academy')}
                className="flex items-center gap-2 text-gray-400 hover:text-white font-mono text-sm uppercase tracking-widest transition-colors mb-6"
            >
                <ArrowLeft size={16} /> Back to Dashboard
            </button>

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{data.title}</h1>
                    <p className="text-gray-400 font-mono text-sm">{data.description}</p>
                </div>
                <button className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/50 px-6 py-2 rounded-lg font-mono tracking-widest uppercase text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-center gap-2">
                    <CheckCircle size={16} /> Mark Complete
                </button>
            </div>

            {/* Video Placeholder */}
            <div className="w-full aspect-video bg-[var(--bg-secondary)] border border-blue-900/50 rounded-xl mb-8 flex items-center justify-center relative group overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 bg-blue-900/20 group-hover:bg-blue-900/40 transition-colors"></div>
                <div className="flex flex-col items-center z-10">
                    <PlayCircle size={64} className="text-blue-500 mb-4 group-hover:scale-110 transition-transform opacity-80" />
                    <span className="text-white font-mono tracking-widest uppercase">{data.videoTitle}</span>
                </div>
            </div>

            {/* Content Sections */}
            <div className="grid gap-6 mb-8">
                {data.sections.map((section, i) => {
                    const Icon = section.icon || BookOpen;
                    return (
                        <div key={i} className="glass-card p-6 border-blue-900/30">
                            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                <Icon size={20} className="text-blue-400" />
                                {section.heading}
                            </h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                {section.text}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* OSCAR Integration Block */}
            <div className="glass-card p-6 border-emerald-900/30 bg-gradient-to-r from-emerald-900/10 to-blue-900/10">
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MessageSquare size={16} /> Ask OSCAR About This Lesson
                </h3>
                <div className="flex flex-wrap gap-3">
                    {data.oscarPrompts.map((prompt, i) => (
                        <button
                            key={i}
                            onClick={() => handlePromptOscar(prompt)}
                            className="bg-[var(--bg-secondary)] text-blue-300 border border-blue-900/50 hover:border-emerald-500/50 hover:text-emerald-400 px-4 py-2 rounded font-mono text-xs transition-colors shadow-sm"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
