import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileSpreadsheet, XCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const MAX_FILE_SIZE = 10485760; // 10MB
const MAX_ROWS = 10000;

export default function FileDropzone({ onFileParsed }) {
    const [error, setError] = useState(null);
    const [isParsing, setIsParsing] = useState(false);

    const parseCSV = (file) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data.length > MAX_ROWS) {
                    setError(`File exceeds maximum row limit of ${MAX_ROWS.toLocaleString()}.`);
                    setIsParsing(false);
                    return;
                }
                onFileParsed(file, results.meta.fields, results.data);
                setIsParsing(false);
            },
            error: (err) => {
                setError(`Failed to parse CSV: ${err.message}`);
                setIsParsing(false);
            }
        });
    };

    const parseXLSX = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                if (json.length > MAX_ROWS) {
                    setError(`File exceeds maximum row limit of ${MAX_ROWS.toLocaleString()}.`);
                    setIsParsing(false);
                    return;
                }

                if (json.length > 0) {
                    const headers = Object.keys(json[0]);
                    onFileParsed(file, headers, json);
                } else {
                    setError("Spreadsheet appears to be empty.");
                }
            } catch (err) {
                setError(`Failed to parse XLSX: ${err.message}`);
            } finally {
                setIsParsing(false);
            }
        };
        reader.onerror = () => {
            setError("Error reading file.");
            setIsParsing(false);
        };
        reader.readAsArrayBuffer(file);
    };

    const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
        setError(null);

        if (rejectedFiles.length > 0) {
            const rejection = rejectedFiles[0];
            if (rejection.errors[0]?.code === 'file-too-large') {
                setError('File is larger than 10MB limit.');
            } else {
                setError('Invalid file type. Please upload .csv or .xlsx');
            }
            return;
        }

        const file = acceptedFiles[0];
        if (!file) return;

        setIsParsing(true);

        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            parseCSV(file);
        } else if (
            file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.name.endsWith('.xlsx')
        ) {
            parseXLSX(file);
        } else {
            setError('Unsupported file type. Please use .csv or .xlsx.');
            setIsParsing(false);
        }
    }, [onFileParsed]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        },
        maxSize: MAX_FILE_SIZE,
        multiple: false
    });

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`glass-panel p-8 text-center space-y-4 flex flex-col items-center justify-center border-dashed border-2 cursor-pointer min-h-[300px] transition-all
                ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-blue-500/50'}`}
            >
                <input {...getInputProps()} />

                {isParsing ? (
                    <div className="flex flex-col items-center text-blue-400">
                        <Loader2 size={48} className="animate-spin mb-4" />
                        <h3 className="text-xl font-semibold text-white">Parsing File...</h3>
                    </div>
                ) : (
                    <>
                        <UploadCloud size={48} className={isDragActive ? "text-blue-400" : "text-gray-400"} />
                        <h3 className="text-xl font-semibold text-white">
                            {isDragActive ? "Drop file to upload" : "Drag & Drop Spreadsheet Here"}
                        </h3>
                        <p className="text-gray-400 text-sm max-w-sm">
                            Supports .csv and .xlsx files. Maximum file size is 10MB (approx. 10,000 rows).
                        </p>
                        <button type="button" className="btn-primary mt-4 pointer-events-none">
                            Browse Files
                        </button>
                    </>
                )}
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                    <XCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="text-red-400 font-medium">Upload Rejected</h4>
                        <p className="text-red-300/80 text-sm mt-1">{error}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
