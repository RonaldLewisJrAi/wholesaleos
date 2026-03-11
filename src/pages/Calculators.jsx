import React, { useState } from 'react';
import { Calculator, DollarSign, Percent, TrendingUp } from 'lucide-react';
import './Calculators.css';

const Calculators = () => {
    const [arv, setArv] = useState(300000);
    const [repairCosts, setRepairCosts] = useState(40000);
    const [wholesaleFee, setWholesaleFee] = useState(15000);
    const [investorMargin, setInvestorMargin] = useState(70); // 70% rule

    const calculateMAO = () => {
        return (arv * (investorMargin / 100)) - repairCosts - wholesaleFee;
    };

    const mao = calculateMAO();

    return (
        <div className="calculators-container animate-fade-in max-w-7xl mx-auto w-full">
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">Wholesale Calculators</h1>
                    <p className="page-description">Determine Maximum Allowable Offer (MAO) and analyze deal profitability.</p>
                </div>
            </div>

            <div className="calculator-layout">
                {/* Input Form Column */}
                <div className="card calc-form-card glass-panel">
                    <div className="card-header">
                        <h3>Deal Parameters</h3>
                        <Calculator size={20} className="text-primary" />
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">After Repair Value (ARV)</label>
                            <div className="input-group">
                                <span className="input-prefix"><DollarSign size={16} /></span>
                                <input
                                    type="number"
                                    className="form-input with-prefix"
                                    value={arv}
                                    onChange={(e) => setArv(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Estimated Repair Costs</label>
                            <div className="input-group">
                                <span className="input-prefix"><DollarSign size={16} /></span>
                                <input
                                    type="number"
                                    className="form-input with-prefix"
                                    value={repairCosts}
                                    onChange={(e) => setRepairCosts(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Desired Wholesale Fee</label>
                            <div className="input-group">
                                <span className="input-prefix"><DollarSign size={16} /></span>
                                <input
                                    type="number"
                                    className="form-input with-prefix"
                                    value={wholesaleFee}
                                    onChange={(e) => setWholesaleFee(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Investor Margin Rule (%)</label>
                            <div className="input-group">
                                <span className="input-prefix"><Percent size={16} /></span>
                                <input
                                    type="number"
                                    className="form-input with-prefix"
                                    value={investorMargin}
                                    onChange={(e) => setInvestorMargin(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                    <button className="btn btn-primary w-full mt-4" onClick={() => alert("Analysis saved to Property Record.")}>Save Analysis to Property</button>
                </div>

                {/* Results Column */}
                <div className="calc-results-column">
                    <div className="card mao-result-card glass-panel">
                        <div className="mao-header">
                            <h3>Maximum Allowable Offer</h3>
                            <span className="mao-badge">MAO</span>
                        </div>
                        <div className="mao-value-display">
                            ${mao.toLocaleString()}
                        </div>
                        <p className="mao-subtitle">
                            Based on the {investorMargin}% rule with a ${wholesaleFee.toLocaleString()} assignment fee.
                        </p>
                    </div>

                    <div className="card breakdown-card glass-panel mt-4">
                        <div className="card-header">
                            <h3>Deal Breakdown</h3>
                            <TrendingUp size={20} className="text-secondary" />
                        </div>
                        <div className="breakdown-list">
                            <div className="breakdown-item">
                                <span>ARV base ({investorMargin}%)</span>
                                <span>${(arv * (investorMargin / 100)).toLocaleString()}</span>
                            </div>
                            <div className="breakdown-item minus">
                                <span>Less Repairs</span>
                                <span>-${repairCosts.toLocaleString()}</span>
                            </div>
                            <div className="breakdown-item minus">
                                <span>Less Wholesale Fee</span>
                                <span>-${wholesaleFee.toLocaleString()}</span>
                            </div>
                            <div className="breakdown-divider"></div>
                            <div className="breakdown-item total">
                                <span>Target Offer Price</span>
                                <span className="text-success">${mao.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calculators;
