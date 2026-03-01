import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '../lib/supabase';
import { X, Download, PenTool, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { useSubscription } from '../contexts/useSubscription';

const DocumentGenerator = ({ dealData, onClose }) => {
    const { user } = useAuth();
    const { subscriptionTier } = useSubscription();
    const [isGenerating, setIsGenerating] = useState(false);
    const [signatureData, setSignatureData] = useState(null);
    const [ipAddress, setIpAddress] = useState('Fetching...');
    const [documentType, setDocumentType] = useState('Purchase Agreement');

    // Form State
    const [sellerName, setSellerName] = useState(dealData?.seller_name || '');
    const [buyerEntity, setBuyerEntity] = useState('Acquisitions LLC');
    const [purchasePrice, setPurchasePrice] = useState(dealData?.arv ? (dealData.arv * 0.7) : 0);
    const [emDeposit, setEmDeposit] = useState(1000);
    const [closingDays, setClosingDays] = useState(30);

    const sigPadRef = useRef({});
    const documentRef = useRef(null);

    // Fetch IP for compliance logging
    React.useEffect(() => {
        fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => setIpAddress(data.ip))
            .catch(() => setIpAddress('Unavailable'));
    }, []);

    const clearSignature = () => {
        sigPadRef.current.clear();
        setSignatureData(null);
    };

    const saveSignature = () => {
        if (!sigPadRef.current.isEmpty()) {
            setSignatureData(sigPadRef.current.getTrimmedCanvas().toDataURL('image/png'));
        }
    };

    const handleGeneratePDF = async () => {
        if (!signatureData) {
            alert("Please sign the document before generating the PDF.");
            return;
        }

        setIsGenerating(true);

        try {
            const element = documentRef.current;
            const canvas = await html2canvas(element, {
                scale: 2, // Higher quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: 'letter'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            // Generate filename
            const fileName = `${sellerName.replace(/\s+/g, '_')}_${documentType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

            // Pre-save actions: Log Generation
            if (supabase && dealData?.id) {
                await supabase.from('documents').insert([{
                    organization_id: dealData.organization_id,
                    deal_id: dealData.id,
                    document_type: 'Purchase_Agreement',
                    document_name: fileName,
                    status: 'Signed',
                    created_by: user.id
                }]);

                // Log Compliance Audit
                await supabase.from('activity_logs').insert([{
                    organization_id: dealData.organization_id,
                    user_id: user.id,
                    action: 'document_generated',
                    entity_type: 'deals',
                    entity_id: dealData.id,
                    details: {
                        document_type: documentType,
                        ip_address: ipAddress,
                        timestamp: new Date().toISOString(),
                        certified: true
                    }
                }]);
            }

            pdf.save(fileName);

            alert("Document Generated & Logged Successfully!");

        } catch (error) {
            console.error("PDF Generation failed:", error);
            alert("Failed to generate PDF. Check console for details.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl w-full max-w-5xl shadow-2xl my-8 relative flex flex-col md:flex-row">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted hover:text-white z-10 p-2 bg-black/50 rounded-full"
                >
                    <X size={24} />
                </button>

                {/* Left Panel: Configuration */}
                <div className="w-full md:w-1/3 p-6 border-r border-[var(--border-light)] bg-[var(--bg-primary)] rounded-l-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <PenTool size={20} className="text-primary" /> Document Settings
                    </h2>

                    <div className="space-y-4">
                        <div className="form-group">
                            <label className="form-label">Document Type</label>
                            <select
                                className="form-input"
                                value={documentType}
                                onChange={(e) => setDocumentType(e.target.value)}
                            >
                                <option value="Purchase Agreement">Purchase Agreement</option>
                                <option value="Assignment of Contract">Assignment of Contract</option>
                                <option value="Joint Venture Agreement">Joint Venture Agreement</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Seller / Assignor Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={sellerName}
                                onChange={(e) => setSellerName(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Buyer Entity / Assignee</label>
                            <input
                                type="text"
                                className="form-input"
                                value={buyerEntity}
                                onChange={(e) => setBuyerEntity(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Contract Price ($)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={purchasePrice}
                                onChange={(e) => setPurchasePrice(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group mb-0">
                                <label className="form-label">EMD ($)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={emDeposit}
                                    onChange={(e) => setEmDeposit(e.target.value)}
                                />
                            </div>
                            <div className="form-group mb-0">
                                <label className="form-label">Closing (Days)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={closingDays}
                                    onChange={(e) => setClosingDays(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-2">Electronic Signature</h3>
                        <div className="bg-white rounded p-1 mb-2 border-2 border-dashed border-gray-300">
                            <SignatureCanvas
                                penColor="black"
                                canvasProps={{ className: 'w-full h-32 rounded' }}
                                ref={sigPadRef}
                                onEnd={saveSignature}
                            />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <button onClick={clearSignature} className="text-danger hover:underline">Clear Signature</button>
                            {signatureData && <span className="text-success flex items-center gap-1"><CheckCircle size={12} /> Captured</span>}
                        </div>
                    </div>

                    {/* Compliance Audit Log Trail Notice */}
                    <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg text-xs text-muted flex items-start gap-3">
                        <ShieldCheck className="text-primary flex-shrink-0 mt-0.5" size={16} />
                        <div>
                            <p className="font-bold text-white mb-1">ESIGN Act Audit Trail Active</p>
                            <p>Generation will be logged under your Organization.</p>
                            <p className="mt-1 font-mono text-[10px]">IP: {ipAddress}</p>
                            <p className="font-mono text-[10px]">Time: {new Date().toISOString()}</p>
                        </div>
                    </div>

                    <button
                        className="btn btn-primary w-full mt-6"
                        onClick={handleGeneratePDF}
                        disabled={isGenerating || !signatureData}
                    >
                        {isGenerating ? 'Generating PDF...' : <><Download size={18} /> Generate & Save PDF</>}
                    </button>
                </div>

                <div className="w-full md:w-2/3 p-4 md:p-8 bg-gray-100 overflow-y-auto" style={{ maxHeight: '90vh' }}>
                    <div
                        ref={documentRef}
                        className="bg-white mx-auto shadow-sm p-12 text-black relative"
                        style={{ width: '816px', minHeight: '1056px', fontFamily: '"Times New Roman", Times, serif' }} // Standard Letter Size 8.5x11 @ 96dpi
                    >
                        {/* Subscription Gated Watermark */}
                        {subscriptionTier === 'BASIC' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" style={{ opacity: 0.08 }}>
                                <span className="font-sans text-[120px] font-black tracking-widest uppercase text-gray-500" style={{ transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                                    WHOLESALE OS BASIC
                                </span>
                            </div>
                        )}

                        {/* Header */}
                        <div className="text-center mb-10 border-b-2 border-black pb-4">
                            <h1 className="text-3xl font-bold uppercase tracking-widest">{documentType}</h1>
                            <p className="mt-2 text-sm">REAL ESTATE WHOLESALE CONTRACT</p>
                        </div>

                        {/* Body Container */}
                        <div className="space-y-6 text-sm leading-relaxed text-justify">
                            <p>
                                This <strong>{documentType}</strong> (the "Agreement") is entered into on this <strong>{new Date().toLocaleDateString()}</strong>, by and between <strong>{sellerName || '[SELLER NAME]'}</strong> ("Seller") and <strong>{buyerEntity || '[BUYER ENTITY]'}</strong> ("Buyer/Assignee").
                            </p>

                            <p>
                                <strong>1. PROPERTY:</strong> The Seller agrees to sell and the Buyer agrees to buy the property located at: <strong>{dealData?.property_address || '[PROPERTY ADDRESS]'}</strong>, along with all fixtures and appurtenances (the "Property").
                            </p>

                            <p>
                                <strong>2. PURCHASE PRICE:</strong> The total purchase price to be paid for the Property shall be: <strong>${Number(purchasePrice).toLocaleString()}</strong>.
                            </p>

                            <p>
                                <strong>3. EARNEST MONEY:</strong> The Buyer shall deposit the sum of <strong>${Number(emDeposit).toLocaleString()}</strong> as Earnest Money with the designated escrow/title company within three (3) business days of the effective date of this Agreement.
                            </p>

                            <p>
                                <strong>4. CLOSING:</strong> This transaction shall be closed on or before <strong>{closingDays} days</strong> from the effective date (the "Closing Date"), or at such other time as the parties may mutually agree in writing.
                            </p>

                            <p>
                                <strong>5. ASSIGNABILITY:</strong> Buyer shall have the absolute right to assign their rights and interests in this Agreement to a third party. Seller explicitly acknowledges and agrees that the Buyer acts as a principal seeking to assign this contract for a fee.
                            </p>

                            <p>
                                <strong>6. INSPECTION & DUE DILIGENCE:</strong> The Buyer shall have an inspection period of 14 days from the effective date to inspect the Property. Buyer may terminate this agreement at any time during the inspection period in their sole discretion.
                            </p>

                            <p>
                                <strong>7. ACCESS:</strong> Seller agrees to provide Buyer and Buyer's assignees, partners, or contractors reasonable access to the property to conduct inspections, take photographs, and show the property to prospective end-buyers.
                            </p>

                            {/* Signature Section */}
                            <div className="mt-16 pt-8 grid grid-cols-2 gap-12">
                                <div>
                                    <p className="mb-8 font-bold">SELLER:</p>
                                    <div className="border-b border-black w-full h-12 mb-2"></div>
                                    <p>Name: {sellerName}</p>
                                    <p>Date: ________________________</p>
                                </div>
                                <div>
                                    <p className="mb-2 font-bold">BUYER (Authorized Signature):</p>
                                    <div className="border-b border-black w-full h-16 flex items-end relative overflow-hidden">
                                        {signatureData && (
                                            <img src={signatureData} alt="Signature" className="absolute bottom-0 left-0 max-h-16 h-full object-contain mix-blend-multiply" />
                                        )}
                                    </div>
                                    <p className="mt-2">Name: {buyerEntity}</p>
                                    <p>Date: {new Date().toLocaleDateString()}</p>
                                    <p className="text-[10px] text-gray-500 mt-4 leading-tight">
                                        E-Sign Validation: {ipAddress} <br />
                                        Timestamp: {new Date().toISOString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DocumentGenerator;
