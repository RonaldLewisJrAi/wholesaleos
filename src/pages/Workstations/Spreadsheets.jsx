import React, { useState, useEffect, useCallback } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import FileDropzone from '../../components/UploadStage/FileDropzone';
import ColumnMapper from '../../components/UploadStage/ColumnMapper';
import DataPreviewGrid from '../../components/UploadStage/DataPreviewGrid';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/useAuth';
import { useSubscription } from '../../contexts/useSubscription';
import './Spreadsheets.css';

const Spreadsheets = () => {
    const { user } = useAuth();
    const { organization_id } = useSubscription();

    const [activeTab, setActiveTab] = useState('upload');
    const [importStage, setImportStage] = useState('dropzone');
    const [fileData, setFileData] = useState({ file: null, headers: [], records: [] });
    const [columnMapping, setColumnMapping] = useState({});

    const [importHistory, setImportHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const fetchHistory = useCallback(async () => {
        setIsLoadingHistory(true);
        const { data, error } = await supabase
            .from('lead_import_logs')
            .select('*')
            .eq('organization_id', organization_id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (!error && data) {
            setImportHistory(data);
        }
        setIsLoadingHistory(false);
    }, [organization_id]);

    useEffect(() => {
        if (activeTab === 'history' && organization_id) {
            fetchHistory();
        }
    }, [activeTab, organization_id, fetchHistory]);

    const handleFileParsed = (file, headers, records) => {
        setFileData({ file, headers, records });
        setImportStage('mapping');
    };

    const handleMappingComplete = (mapping) => {
        setColumnMapping(mapping);
        setImportStage('preview');
    };

    const handleExecuteImport = async (wasOverridden = false) => {
        if (!user || !organization_id) {
            alert("Authentication Error: Organization not found.");
            return;
        }

        setImportStage('executing');

        try {
            // 1. Upload Original File to Storage Bucket
            const filePath = `${organization_id}/${Date.now()}_${fileData.file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('import_files')
                .upload(filePath, fileData.file);

            if (uploadError) throw new Error("Failed to upload source file: " + uploadError.message);

            // 2. Insert Tracking Record into Staging Table
            const { data: stagingData, error: stagingErr } = await supabase
                .from('staging_lead_imports')
                .insert([{
                    organization_id,
                    uploaded_by: user.id,
                    original_filename: fileData.file.name,
                    row_count: fileData.records.length,
                    status: 'mapped',
                    raw_json_data: [] // Omitted to prevent bloated DB sizes; file persists in secure storage
                }])
                .select().single();

            if (stagingErr) throw new Error("Failed to create staging record: " + stagingErr.message);

            // 3. Process & Map Records
            const mappedHeaders = Object.entries(columnMapping)
                .filter(([, dbField]) => dbField !== 'ignore');

            const insertPayloads = fileData.records.map(row => {
                const leadRecord = { organization_id };
                mappedHeaders.forEach(([origField, dbField]) => {
                    let val = row[origField];
                    if (val !== undefined && val !== null && val !== '') {
                        // Standardize ARV formatting from string currency formats to pure Float
                        if (dbField === 'arv') val = parseFloat(val.toString().replace(/[^0-9.]/g, ''));
                        leadRecord[dbField] = val;
                    }
                });
                return leadRecord;
            });

            // 4. Batch Insert to `leads`
            const chunkSize = 500;
            let successCount = 0;
            let failureCount = 0;

            for (let i = 0; i < insertPayloads.length; i += chunkSize) {
                const chunk = insertPayloads.slice(i, i + chunkSize);
                const { error: insertErr } = await supabase.from('leads').insert(chunk);
                if (insertErr) {
                    console.error("Batch insert error:", insertErr);
                    failureCount += chunk.length;
                } else {
                    successCount += chunk.length;
                }
            }

            // 5. Update Audit Logs and Staging 
            await supabase.from('staging_lead_imports')
                .update({ status: 'imported' })
                .eq('id', stagingData.id);

            await supabase.from('lead_import_logs').insert([{
                organization_id,
                imported_by: user.id,
                file_name: fileData.file.name,
                total_rows: fileData.records.length,
                success_count: successCount,
                failure_count: failureCount
            }]);

            await supabase.from('activity_logs').insert([{
                organization_id,
                user_id: user.id,
                action: wasOverridden ? 'Forced Dirty Lead Import' : 'Lead Imported via Spreadsheet',
                details: { file_name: fileData.file.name, success_count: successCount, forced_override: wasOverridden },
                module: 'Acquisition'
            }]);

            setImportStage('complete');
        } catch (err) {
            console.error("Import execution failed:", err);
            setImportStage('dropzone');
            alert(`Import Sequence Failed: ${err.message}`);
        }
    };

    const handleRestart = () => {
        setImportStage('dropzone');
        setFileData({ file: null, headers: [], records: [] });
        setColumnMapping({});
    };

    return (
        <div className="p-6 md:p-8 space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
                        Spreadsheet Ingestion Utility
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Safely import localized CSV and XLSX lead lists into the CRM.
                    </p>
                </div>
            </header>

            <div className="glass-panel p-2 flex gap-4 overflow-x-auto">
                <button
                    className={`nav-tab ${activeTab === 'upload' ? 'active' : ''}`}
                    onClick={() => setActiveTab('upload')}
                >
                    <UploadCloud size={18} /> New Import
                </button>
                <button
                    className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <FileSpreadsheet size={18} /> Import History
                </button>
            </div>

            {activeTab === 'upload' && (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                    {importStage === 'dropzone' && (
                        <FileDropzone onFileParsed={handleFileParsed} />
                    )}

                    {importStage === 'mapping' && (
                        <div className="glass-panel p-6">
                            <ColumnMapper
                                headers={fileData.headers}
                                onMappingComplete={handleMappingComplete}
                                onCancel={handleRestart}
                            />
                        </div>
                    )}

                    {importStage === 'preview' && (
                        <div className="glass-panel p-6">
                            <DataPreviewGrid
                                data={fileData.records}
                                mapping={columnMapping}
                                onExecute={handleExecuteImport}
                                onBack={() => setImportStage('mapping')}
                            />
                        </div>
                    )}

                    {importStage === 'executing' && (
                        <div className="glass-panel p-12 text-center flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-6"></div>
                            <h3 className="text-2xl font-bold text-white mb-2">Executing Batch Import...</h3>
                            <p className="text-gray-400">Please do not close this window. Inserting <strong>{fileData.records.length.toLocaleString()}</strong> rows into the pipeline.</p>
                        </div>
                    )}

                    {importStage === 'complete' && (
                        <div className="glass-panel p-12 text-center flex flex-col items-center justify-center border-green-500/50 border">
                            <CheckCircle2 size={64} className="text-green-500 mb-6" />
                            <h3 className="text-2xl font-bold text-white mb-2">Import Complete!</h3>
                            <p className="text-gray-400 max-w-lg mb-8">
                                Successfully routed <strong>{fileData.records.length.toLocaleString()}</strong> records to the Acquisition Pipeline. Automation triggers are recalculating localized ARV/MAO models now.
                            </p>
                            <button onClick={handleRestart} className="btn-primary flex items-center gap-2">
                                <ArrowLeft size={18} /> Import Another File
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="glass-panel p-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Recent Imports</h3>
                        <button onClick={fetchHistory} className="text-sm text-blue-400 hover:text-blue-300">
                            Refresh
                        </button>
                    </div>

                    {isLoadingHistory ? (
                        <div className="text-center py-8 text-gray-400">Loading history...</div>
                    ) : importHistory.length === 0 ? (
                        <div className="text-gray-400 text-center py-8">
                            <FileSpreadsheet size={32} className="mx-auto mb-3 opacity-50" />
                            <p>No import history found for your organization.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/10">
                                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase">File Name</th>
                                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase text-right">Rows</th>
                                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase text-right">Success</th>
                                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase text-right">Failed</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {importHistory.map((log) => (
                                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-3 text-sm text-gray-300">
                                                {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-3 text-sm text-gray-300 max-w-[200px] truncate" title={log.file_name}>
                                                {log.file_name}
                                            </td>
                                            <td className="p-3 text-sm text-gray-300 text-right">{log.total_rows.toLocaleString()}</td>
                                            <td className="p-3 text-sm text-green-400 text-right">{log.success_count.toLocaleString()}</td>
                                            <td className="p-3 text-sm text-red-400 text-right">{log.failure_count.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Spreadsheets;
