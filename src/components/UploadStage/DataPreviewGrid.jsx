import React, { useState, useMemo } from 'react';
import { PlayCircle, AlertCircle, ShieldAlert, ShieldCheck, Shield, AlertTriangle } from 'lucide-react';

export default function DataPreviewGrid({ data, mapping, onExecute, onBack }) {
    const [overrideChecked, setOverrideChecked] = useState(false);
    // Filter out ignored columns and map to intended DB fields
    const mappedHeaders = Object.entries(mapping)
        .filter(([, dbField]) => dbField !== 'ignore')
        .map(([origField, dbField]) => ({ origField, dbField }));

    // Preview top 10 rows maximum
    const previewData = data.slice(0, 10);

    // Compute Health Score
    const { score, issueCount, sampleIssues } = useMemo(() => {
        let penalty = 0;
        let issues = 0;
        const samples = [];
        const seenAddresses = new Set();

        data.forEach((row, idx) => {
            const mappedRow = {};
            mappedHeaders.forEach(h => {
                mappedRow[h.dbField] = row[h.origField];
            });

            // 1. Formulas
            const hasFormulas = Object.values(mappedRow).some(v => v && typeof v === 'string' && v.trim().startsWith('='));
            if (hasFormulas) {
                penalty += 5; issues++;
                if (samples.length < 5) samples.push(`Row ${idx + 1}: Formula artifact detected.`);
            }

            // 2. Duplicate Address
            const addr = mappedRow['property_address']?.toString().trim().toLowerCase();
            if (addr) {
                if (seenAddresses.has(addr)) {
                    penalty += 2; issues++;
                    if (samples.length < 5) samples.push(`Row ${idx + 1}: Duplicate address.`);
                }
                seenAddresses.add(addr);
            }

            // 3. Blank Seller Name
            if (mappedHeaders.some(h => h.dbField === 'seller_name') && !mappedRow['seller_name']) {
                penalty += 1; issues++;
            }

            // 4. Invalid Phone
            if (mappedRow['phone']) {
                const digits = mappedRow['phone'].toString().replace(/\D/g, '');
                if (digits.length > 0 && (digits.length < 10 || digits.length > 15)) {
                    penalty += 1; issues++;
                }
            }

            // 5. ARV Outliers
            if (mappedRow['arv']) {
                const arvVal = parseFloat(mappedRow['arv'].toString().replace(/[^0-9.-]/g, ''));
                if (!isNaN(arvVal) && (arvVal < 10000 || arvVal > 5000000)) {
                    penalty += 2; issues++;
                    if (samples.length < 5) samples.push(`Row ${idx + 1}: ARV Outlier ($${arvVal.toLocaleString()}).`);
                }
            }
        });

        return {
            score: Math.max(0, 100 - Math.ceil(penalty)),
            issueCount: issues,
            sampleIssues: samples
        };
    }, [data, mappedHeaders]);

    const getScoreColor = () => {
        if (score >= 90) return 'text-green-400 bg-green-500/10 border-green-500/30';
        if (score >= 70) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
        if (score >= 50) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
        return 'text-red-400 bg-red-500/10 border-red-500/30';
    };

    const needsOverride = score < 90;
    const canExecute = !needsOverride || overrideChecked;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 p-4 rounded-lg flex items-start gap-4">
                    <AlertCircle className="text-blue-400 mt-1 shrink-0" size={24} />
                    <div>
                        <h3 className="text-lg font-semibold text-white">Preview Your Data</h3>
                        <p className="text-gray-400 text-sm mt-1">
                            Review the first {previewData.length} rows to ensure data aligns correctly with your mapped columns.
                            You are about to import <strong>{data.length.toLocaleString()}</strong> total rows.
                        </p>
                    </div>
                </div>

                <div className={`p-4 rounded-lg border flex items-start gap-4 ${getScoreColor()}`}>
                    {score >= 90 ? <ShieldCheck className="mt-1 shrink-0" size={24} /> :
                        score >= 70 ? <Shield className="mt-1 shrink-0" size={24} /> :
                            <ShieldAlert className="mt-1 shrink-0" size={24} />}
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            Import Health Score: <span className="text-2xl">{score}</span>
                        </h3>
                        <p className="text-sm mt-1 opacity-90">
                            {issueCount === 0 ? "Perfectly clean data." : `${issueCount.toLocaleString()} issues detected across your payload.`}
                        </p>
                        {sampleIssues.length > 0 && (
                            <ul className="text-xs mt-2 list-disc list-inside opacity-75 space-y-1">
                                {sampleIssues.map((msg, i) => <li key={i}>{msg}</li>)}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            <div className="glass-panel overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/10">
                            <th className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16 text-center">Row</th>
                            {mappedHeaders.map(h => (
                                <th key={h.dbField} className="p-3 text-sm font-semibold text-blue-300">
                                    {h.dbField}
                                    <div className="text-xs text-gray-500 font-normal mt-1">from: {h.origField}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {previewData.map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-white/5 transition-colors">
                                <td className="p-3 text-sm text-gray-500 text-center">{rowIdx + 1}</td>
                                {mappedHeaders.map(h => (
                                    <td key={h.dbField} className="p-3 text-sm text-gray-300 truncate max-w-[200px]">
                                        {row[h.origField] || '-'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {needsOverride && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-red-400">
                        <AlertTriangle size={20} />
                        <p className="text-sm font-medium">This import contains a significant number of anomalies. Operational discipline requires confirmation.</p>
                    </div>
                    <label className="flex items-center gap-2 text-white text-sm cursor-pointer whitespace-nowrap bg-white/5 px-4 py-2 rounded border border-white/10 hover:bg-white/10 transition">
                        <input
                            type="checkbox"
                            className="rounded border-white/20 bg-black/50 text-red-500 focus:ring-red-500"
                            checked={overrideChecked}
                            onChange={(e) => setOverrideChecked(e.target.checked)}
                        />
                        Import Anyway
                    </label>
                </div>
            )}

            <div className="flex justify-between items-center pt-4">
                <button onClick={onBack} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                    Back to Mapping
                </button>
                <button
                    onClick={() => onExecute(overrideChecked)}
                    disabled={!canExecute}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${canExecute
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-white/10 text-gray-400 cursor-not-allowed border border-white/5'
                        }`}
                >
                    <PlayCircle size={18} /> Execute Initial Import
                </button>
            </div>
        </div>
    );
}
