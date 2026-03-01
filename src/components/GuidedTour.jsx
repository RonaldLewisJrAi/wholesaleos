import React, { useState, useEffect } from 'react';
import HolographicPanel from './HolographicPanel';
import { useGuidance } from '../contexts/GuidanceContext';
import { useSubscription } from '../contexts/useSubscription';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';

const GuidedTour = () => {
    const { guidanceMode, setGuidanceMode } = useGuidance();
    const { currentViewPersona, subscriptionTier, subscriptionStatus } = useSubscription();
    const [currentStep, setCurrentStep] = useState(0);

    // Dynamic generation of tour steps based on Persona and State
    const [tourSteps, setTourSteps] = useState([]);

    useEffect(() => {
        if (guidanceMode === 'tour') {
            setCurrentStep(0);

            // Build base steps applicable to everyone
            const steps = [
                {
                    title: "Welcome to Wholesale OS",
                    description: "This environment is dynamically generated based on your Persona. We've optimized the layout for speed and clarity.",
                    targetElement: null
                },
                {
                    title: "Immediate Action Zone",
                    description: "The top section calculates your single most important task. Trust the engine; it routes based on urgency.",
                    targetElement: null
                },
                {
                    title: "Decision KPIs",
                    description: "You'll only ever see 3 KPIs here at maximum. This prevents analysis paralysis and focuses your execution.",
                    targetElement: null
                }
            ];

            // Inject persona-specific logic
            if (currentViewPersona === 'WHOLESALER') {
                steps.push({
                    title: "Compliance Advisory: Assignment Legality",
                    description: "Confirm assignment is permitted in your selected state. Certain locales have specific disclosure laws.",
                    targetElement: null,
                    isRisk: true
                });
                steps.push({
                    title: "Compliance Advisory: Earnest Money",
                    description: "Earnest money protects deal stability and buyer trust. Ensure your EMDs are always logged and verified.",
                    targetElement: null,
                    isRisk: true
                });
                steps.push({
                    title: "Compliance Advisory: Marketing",
                    description: "Avoid implying ownership if the contract is not yet recorded. Always state you are selling an equitable interest.",
                    targetElement: null,
                    isRisk: true
                });
            } else if (currentViewPersona === 'DISPOSITION') {
                steps.push({
                    title: "Buyer Matching",
                    description: "When deals move to 'Under Contract', your disposition queue will automatically suggest buyers based on their buy box criteria.",
                    targetElement: null
                });
            }

            // Billing state logic
            if (subscriptionStatus !== 'ACTIVE' && subscriptionStatus !== 'SUPERIOR') {
                steps.push({
                    title: "Account Status Restricted",
                    description: `Your account is currently in a ${subscriptionStatus} state. Features may be read-only until brought current.`,
                    targetElement: null
                });
            }

            steps.push({
                title: "You're ready to execute.",
                description: "This concludes the tour. You can always restart it or toggle 'Insight Mode' from the info icon in the header.",
                targetElement: null
            });

            setTourSteps(steps);
        }
    }, [guidanceMode, currentViewPersona, subscriptionStatus]);

    if (guidanceMode !== 'tour' || tourSteps.length === 0) return null;

    const step = tourSteps[currentStep];

    const handleNext = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            setGuidanceMode('off');
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    };

    const handleSkip = () => {
        setGuidanceMode('off');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
            {/* Dimmed Background Overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"></div>

            <div className="relative z-10 w-full max-w-md animate-fade-in transform transition-all duration-300 scale-100 hover:scale-[1.02]">
                <HolographicPanel className={`border border-t-4 ${step.isRisk ? 'border-t-warning shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 'border-t-primary shadow-[0_0_30px_rgba(99,102,241,0.2)]'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                            {step.isRisk && <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>}
                            {!step.isRisk && <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>}
                            <h3 className="font-bold text-lg text-white tracking-wide">{step.title}</h3>
                        </div>
                        <button onClick={handleSkip} className="text-muted hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <p className="text-gray-300 text-sm leading-relaxed mb-6 min-h-[60px]">
                        {step.description}
                    </p>

                    <div className="flex items-center justify-between border-t border-[var(--border-light)] pt-4">
                        <div className="text-xs text-muted font-bold tracking-widest">
                            STEP {currentStep + 1} / {tourSteps.length}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handlePrev}
                                disabled={currentStep === 0}
                                className={`flex items-center gap-1 text-sm font-semibold transition-colors ${currentStep === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
                            >
                                <ArrowLeft size={16} /> Back
                            </button>
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-1 text-sm font-bold text-primary hover:text-indigo-400 transition-colors"
                            >
                                {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'} <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </HolographicPanel>
            </div>
        </div>
    );
};

export default GuidedTour;
