import React from 'react';

const PrivacyPolicy = () => {
    return (
        <div className="animate-fade-in p-8 max-w-4xl mx-auto h-full overflow-y-auto">
            <h1 className="text-3xl font-bold mb-6 text-primary">Privacy Policy</h1>
            <p className="text-muted mb-6">Last Updated: October 2026</p>

            <div className="space-y-6 text-sm">
                <section>
                    <h2 className="text-xl font-bold mb-2">1. Information We Collect</h2>
                    <p className="text-muted leading-relaxed">
                        We collect information you directly provide to us, including your name, email, company details, billing information via Stripe, and user-generated data stored within your CRM and Organization (leads, properties, documents). We also collect telemetry data regarding your API usage and interaction with the platform features.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">2. How We Use Your Information</h2>
                    <p className="text-muted leading-relaxed">
                        We use the collected information to:
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Provide, maintain, and improve the Wholesale OS SaaS platform.</li>
                            <li>Process payments and monitor subscription limits.</li>
                            <li>Develop aggregated, anonymized intelligence models (such as the Buyer Demand Index) that do not expose personally identifiable information.</li>
                            <li>Communicate administrative updates and platform changes.</li>
                        </ul>
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">3. Data Security</h2>
                    <p className="text-muted leading-relaxed">
                        Wholesale OS utilizes industry-standard security measures, including Supabase Row Level Security (RLS) enforcement, encryption in transit (HTTPS), and secure authentication pathways. However, no data transmission over the internet is completely secure.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">4. Third-Party Services</h2>
                    <p className="text-muted leading-relaxed">
                        Our platform integrates with third-party providers (Stripe, Apify, Zillow). We only share information absolutely necessary for these integrations to function. Your payment credentials are never stored on our servers and are handled entirely by Stripe.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold mb-2">5. Data Deletion</h2>
                    <p className="text-muted leading-relaxed">
                        You may request the full deletion of your organizational data by contacting support. Upon termination of your account, active property lock exclusivity will immediately expire, and sensitive metadata will be purged according to our retention protocols.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
