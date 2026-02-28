import React from 'react';

const TermsOfService = () => {
    return (
        <div className="animate-fade-in p-8 max-w-4xl mx-auto h-full overflow-y-auto">
            <h1 className="text-3xl font-bold mb-6 text-primary">Terms of Service</h1>
            <p className="text-muted mb-6">Last Updated: October 2026</p>

            <div className="space-y-6 text-sm">
                <section>
                    <h2 className="text-xl font-bold mb-2">1. Acceptance of Terms</h2>
                    <p className="text-muted leading-relaxed">
                        By accessing and using the Wholesale OS platform ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service. The Service is provided as-is for real estate professionals.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">2. Acceptable Use & Data Scraping</h2>
                    <p className="text-muted leading-relaxed mb-2">
                        You agree to use the Service's data extraction and analysis tools (including live "Radar" finders and Property Imports) in compliance with all applicable local, state, and federal laws, as well as the Terms of Service of any third-party data providers (e.g., Zillow, Realtor.com, public county records).
                    </p>
                    <p className="text-muted leading-relaxed">
                        <strong>Liability Waiver:</strong> Wholesale OS acts solely as a technological conduit. You, the user, assume all liability for data usage. Wholesale OS does not condone or support the violation of third-party Terms of Service or automated scraping that disrupts third-party infrastructure.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">3. Intellectual Property</h2>
                    <p className="text-muted leading-relaxed">
                        The Software, workflows, algorithms (including Deal Probability Score and Buyer Demand Index), and interface designs are the intellectual property of Wholesale OS. You may not reverse engineer, duplicate, or resell the platform architecture.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">4. Subscriptions and Payments</h2>
                    <p className="text-muted leading-relaxed">
                        Subscription fees are billed monthly through Stripe based on your agreed tier (Basic, Pro, Super). We do not offer refunds for partial months of service. Exceeding your tier's limits for API usage (Lead imports or Scrapes) requires an immediate upgrade to maintain service continuity.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">5. Disclaimer of Warranties</h2>
                    <p className="text-muted leading-relaxed">
                        THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. Wholesale OS makes no guarantees regarding the accuracy of estimated property values (ARV, MAO), estimated repair costs, or the likelihood of a deal closing. All investment risk rests with the user.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default TermsOfService;
