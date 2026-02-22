import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Map, FileCheck, Info } from 'lucide-react';
import './Compliance.css';

const US_STATES = [
    { abbr: 'AL', name: 'Alabama' }, { abbr: 'AK', name: 'Alaska' }, { abbr: 'AZ', name: 'Arizona' },
    { abbr: 'AR', name: 'Arkansas' }, { abbr: 'CA', name: 'California' }, { abbr: 'CO', name: 'Colorado' },
    { abbr: 'CT', name: 'Connecticut' }, { abbr: 'DE', name: 'Delaware' }, { abbr: 'FL', name: 'Florida' },
    { abbr: 'GA', name: 'Georgia' }, { abbr: 'HI', name: 'Hawaii' }, { abbr: 'ID', name: 'Idaho' },
    { abbr: 'IL', name: 'Illinois' }, { abbr: 'IN', name: 'Indiana' }, { abbr: 'IA', name: 'Iowa' },
    { abbr: 'KS', name: 'Kansas' }, { abbr: 'KY', name: 'Kentucky' }, { abbr: 'LA', name: 'Louisiana' },
    { abbr: 'ME', name: 'Maine' }, { abbr: 'MD', name: 'Maryland' }, { abbr: 'MA', name: 'Massachusetts' },
    { abbr: 'MI', name: 'Michigan' }, { abbr: 'MN', name: 'Minnesota' }, { abbr: 'MS', name: 'Mississippi' },
    { abbr: 'MO', name: 'Missouri' }, { abbr: 'MT', name: 'Montana' }, { abbr: 'NE', name: 'Nebraska' },
    { abbr: 'NV', name: 'Nevada' }, { abbr: 'NH', name: 'New Hampshire' }, { abbr: 'NJ', name: 'New Jersey' },
    { abbr: 'NM', name: 'New Mexico' }, { abbr: 'NY', name: 'New York' }, { abbr: 'NC', name: 'North Carolina' },
    { abbr: 'ND', name: 'North Dakota' }, { abbr: 'OH', name: 'Ohio' }, { abbr: 'OK', name: 'Oklahoma' },
    { abbr: 'OR', name: 'Oregon' }, { abbr: 'PA', name: 'Pennsylvania' }, { abbr: 'RI', name: 'Rhode Island' },
    { abbr: 'SC', name: 'South Carolina' }, { abbr: 'SD', name: 'South Dakota' }, { abbr: 'TN', name: 'Tennessee' },
    { abbr: 'TX', name: 'Texas' }, { abbr: 'UT', name: 'Utah' }, { abbr: 'VT', name: 'Vermont' },
    { abbr: 'VA', name: 'Virginia' }, { abbr: 'WA', name: 'Washington' }, { abbr: 'WV', name: 'West Virginia' },
    { abbr: 'WI', name: 'Wisconsin' }, { abbr: 'WY', name: 'Wyoming' }
];

const stateRules = {
    TX: {
        assignmentLegal: true,
        disclosureRequired: true,
        notes: 'Texas requires clear disclosure if the assignor does not hold a real estate license (Equitable Interest Disclosure). Standard TREC forms do not prohibit assignment by default, but check box 21.',
        riskLevel: 'Low',
    },
    IL: {
        assignmentLegal: 'Restricted',
        disclosureRequired: true,
        notes: 'The Wholesale Real Estate Act requires a broker\'s license if you do more than one wholesale deal per year.',
        riskLevel: 'High',
    },
    OK: {
        assignmentLegal: 'Restricted',
        disclosureRequired: true,
        notes: 'Publicly marketing equitable interest requires a real estate license.',
        riskLevel: 'High',
    }
};

const getDetailedStateRules = (stateAbbr) => {
    const stateInfo = US_STATES.find(s => s.abbr === stateAbbr);
    const specificRules = stateRules[stateAbbr];

    if (specificRules) {
        return { ...specificRules, name: stateInfo?.name || stateAbbr };
    }

    return {
        name: stateInfo?.name || stateAbbr,
        assignmentLegal: 'Varies',
        disclosureRequired: 'Unknown',
        notes: 'Standard state rules apply. Please consult with a local real estate attorney to verify wholesale legality and disclosure requirements in this jurisdiction.',
        riskLevel: 'Medium',
    };
};

const Compliance = () => {
    const [selectedState, setSelectedState] = useState('TX');
    const details = getDetailedStateRules(selectedState);

    return (
        <div className="compliance-container animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Legal Compliance & Guidance</h1>
                <p className="page-description">Verify state-specific wholesaling laws, required disclosures, and audit your transaction history.</p>
            </div>

            <div className="compliance-grid">
                {/* State Selection & Rules Container */}
                <div className="card state-rules-card glass-panel">
                    <div className="card-header border-b pb-4 mb-4">
                        <div className="flex items-center gap-2">
                            <Map size={20} className="text-primary" />
                            <h3>State-Specific Guidance</h3>
                        </div>
                        <select
                            className="state-selector"
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                        >
                            {US_STATES.map((state) => (
                                <option key={state.abbr} value={state.abbr}>
                                    {state.name} ({state.abbr})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="rules-content">
                        <div className="rule-item">
                            <span className="rule-label">Assignment of Contract Legality</span>
                            <span className={`rule-value ${details.riskLevel === 'High' ? 'text-danger' : 'text-success'}`}>
                                {details.assignmentLegal === true ? 'Legal' : details.assignmentLegal}
                            </span>
                        </div>

                        <div className="rule-item">
                            <span className="rule-label">Specific Disclosure Required</span>
                            <span className="rule-value">
                                {details.disclosureRequired === true ? 'Yes' : details.disclosureRequired === false ? 'No' : details.disclosureRequired}
                            </span>
                        </div>

                        <div className={`alert-box ${details.riskLevel === 'High' ? 'alert-warning' : 'alert-info'}`}>
                            <div className="alert-icon">
                                {details.riskLevel === 'High' ? <AlertTriangle size={20} /> : <Info size={20} />}
                            </div>
                            <div className="alert-text">
                                <strong>{details.riskLevel === 'High' ? 'Regulatory Warning' : 'Guidance Note'}:</strong>
                                <p>{details.notes}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit Log Container */}
                <div className="card audit-log-card glass-panel">
                    <div className="card-header">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={20} className="text-secondary" />
                            <h3>Security & Audit Trail</h3>
                        </div>
                    </div>
                    <div className="audit-list">
                        <div className="audit-item">
                            <div className="audit-icon bg-secondary"><FileCheck size={14} /></div>
                            <div className="audit-details">
                                <p className="audit-action">Signature Captured: Assignee (Michael Chen)</p>
                                <p className="audit-meta">Doc ID: JR-8821 • IP: 104.28.192.4 • Today, 10:45 AM</p>
                            </div>
                        </div>
                        <div className="audit-item">
                            <div className="audit-icon bg-primary"><Info size={14} /></div>
                            <div className="audit-details">
                                <p className="audit-action">TX Statutory Disclosure appended to Contract JR-8821</p>
                                <p className="audit-meta">System Auto-action • Today, 10:42 AM</p>
                            </div>
                        </div>
                        <div className="audit-item">
                            <div className="audit-icon bg-secondary"><FileCheck size={14} /></div>
                            <div className="audit-details">
                                <p className="audit-action">Signature Captured: Assignor (Ronald Lewis)</p>
                                <p className="audit-meta">Doc ID: JR-8821 • IP: 73.125.44.11 • Yesterday, 4:15 PM</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Compliance;
