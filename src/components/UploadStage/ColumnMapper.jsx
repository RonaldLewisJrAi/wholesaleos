import React, { useState } from 'react';
import { ArrowRight, CheckCircle, Database } from 'lucide-react';

const ALLOWED_FIELDS = [
    { value: 'ignore', label: '-- Ignore this column --' },
    { value: 'property_address', label: 'Property Address (Required)' },
    { value: 'seller_name', label: 'Owner Name' },
    { value: 'phone', label: 'Phone Number' },
    { value: 'email', label: 'Email Address' },
    { value: 'city', label: 'City' },
    { value: 'state', label: 'State' },
    { value: 'zip', label: 'Zip Code' },
    { value: 'arv', label: 'Estimated ARV' },
    { value: 'notes', label: 'General Notes' },
    { value: 'custom_tag', label: 'Custom Tag (e.g. List Name)' }
];

export default function ColumnMapper({ headers, onMappingComplete, onCancel }) {
    const [mapping, setMapping] = useState(() => {
        const initialMap = {};
        headers.forEach(header => {
            const h = header.toLowerCase().trim();
            if (h.includes('address') && !h.includes('email')) initialMap[header] = 'property_address';
            else if (h.includes('name') || h === 'owner') initialMap[header] = 'seller_name';
            else if (h.includes('phone') || h === 'cell') initialMap[header] = 'phone';
            else if (h.includes('email')) initialMap[header] = 'email';
            else if (h === 'city') initialMap[header] = 'city';
            else if (h === 'state') initialMap[header] = 'state';
            else if (h === 'zip' || h === 'zipcode') initialMap[header] = 'zip';
            else if (h.includes('arv') || h.includes('value')) initialMap[header] = 'arv';
            else if (h.includes('note')) initialMap[header] = 'notes';
            else if (h.includes('tag') || h.includes('list')) initialMap[header] = 'custom_tag';
            else initialMap[header] = 'ignore';
        });
        return initialMap;
    });

    const handleSelectChange = (header, value) => {
        setMapping(prev => ({
            ...prev,
            [header]: value
        }));
    };

    const handleConfirm = () => {
        // Enforce required fields
        const mappedValues = Object.values(mapping);
        if (!mappedValues.includes('property_address')) {
            alert('You must map at least one column to Property Address.');
            return;
        }

        onMappingComplete(mapping);
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg flex items-start gap-4">
                <Database className="text-blue-400 mt-1 shrink-0" size={24} />
                <div>
                    <h3 className="text-lg font-semibold text-white">Map Your Data</h3>
                    <p className="text-blue-200/80 text-sm mt-1">
                        We detected {headers.length} columns in your file. Match them to the Wholesale OS fields below. Fields left as "Ignore" will not be imported.
                    </p>
                </div>
            </div>

            <div className="glass-panel overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 border-b border-white/10">
                            <th className="p-4 text-sm font-semibold text-gray-300 w-1/2">Spreadsheet Column</th>
                            <th className="p-4 text-sm font-semibold text-gray-300 w-1/2">Wholesale OS Field</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {headers.map((header, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-300 font-medium">{header || '(Empty Header)'}</span>
                                        <ArrowRight size={16} className="text-gray-500" />
                                    </div>
                                </td>
                                <td className="p-4">
                                    <select
                                        className="w-full bg-slate-800 border border-white/10 rounded-md p-2 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                        value={mapping[header] || 'ignore'}
                                        onChange={(e) => handleSelectChange(header, e.target.value)}
                                    >
                                        {ALLOWED_FIELDS.map(field => (
                                            <option key={field.value} value={field.value}>
                                                {field.label}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center pt-4">
                <button onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
                    Cancel & Restart
                </button>
                <button
                    onClick={handleConfirm}
                    className="btn-primary flex items-center gap-2"
                >
                    <CheckCircle size={18} /> Confirm Mapping
                </button>
            </div>
        </div>
    );
}
