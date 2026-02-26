import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, CheckCircle, Edit3, UploadCloud, Link as LinkIcon } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './Documents.css';

const SignatureBlock = ({ label, printedNameValue, defaultNameValue, printedNameKey, onPrintedNameChange, sigRef }) => {
    const value = printedNameValue !== undefined ? printedNameValue : defaultNameValue;
    return (
        <div className="sig-block flex-1" style={{ minWidth: '200px', maxWidth: '300px' }}>
            <div className="signature-box">
                <span className="signature-placeholder">Draw Signature Here</span>
                <SignatureCanvas
                    ref={sigRef}
                    penColor="white"
                    canvasProps={{ className: 'sig-canvas' }}
                />
            </div>
            <div className="flex justify-between items-center">
                <p className="text-sm font-medium m-0 p-0">{label} Signature</p>
                <button
                    onClick={(e) => { e.preventDefault(); sigRef.current?.clear(); }}
                    className="text-[10px] text-muted hover:text-white px-2 py-0.5 rounded bg-[rgba(255,255,255,0.1)] transition-colors hover:bg-[rgba(255,255,255,0.2)]"
                >
                    Clear
                </button>
            </div>
            <div className="text-xs text-muted mt-2 flex items-center gap-1">
                <span className="whitespace-nowrap">Printed Name:</span>
                <input
                    type="text"
                    name={printedNameKey}
                    value={value}
                    onChange={onPrintedNameChange}
                    placeholder={`[${label} Name]`}
                    className="fillable-input flex-1 text-xs px-1 py-0.5"
                    style={{ minWidth: '0' }}
                />
            </div>
        </div>
    );
};

const templates = [
    { id: 't1', name: 'Standard Purchase Agreement', type: 'Acquisition', states: 'All', popular: true },
    { id: 't2', name: 'Assignment of Contract', type: 'Disposition', states: 'All', popular: true },
    { id: 't3', name: 'Joint Venture Agreement', type: 'Partnership', states: 'All', popular: false },
    { id: 't4', name: 'State Promulgated Forms', type: 'Acquisition', states: 'Multiple', popular: true },
    { id: 't5', name: 'Option to Purchase', type: 'Acquisition', states: 'All', popular: false }
];

const Documents = () => {
    const [selectedTemplate, setSelectedTemplate] = useState('t2');
    const [formData, setFormData] = useState({
        date: '',
        assignor: '',
        assignee: '',
        seller: '',
        buyer: '',
        purchasePrice: '',
        propertyAddress: '',
        contractDate: '',
        assignmentFee: '',
        sellerSignature: '',
        buyerSignature: '',
        assignorSignature: '',
        assigneeSignature: '',
        sellerPrinted: undefined,
        buyerPrinted: undefined,
        assignorPrinted: undefined,
        assigneePrinted: undefined,
        // JV fields
        partyA: '',
        partyB: '',
        jvFeeType: 'percentage', // 'percentage' or 'flat'
        jvFeeValue: '',
        partyAPrinted: undefined,
        partyBPrinted: undefined,
        // TREC fields
        earnestMoney: '',
        titleCompany: ''
    });

    const [pipelineDealsState, setPipelineDeals] = useState([]);
    const [promulgatedState, setPromulgatedState] = useState('TX');
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const pdfContainerRef = useRef(null);

    const sellerSigRef = useRef(null);
    const buyerSigRef = useRef(null);
    const assignorSigRef = useRef(null);
    const assigneeSigRef = useRef(null);
    const partyASigRef = useRef(null);
    const partyBSigRef = useRef(null);

    useEffect(() => {
        const fetchDeals = async () => {
            if (!supabase) return;
            try {
                const { data, error } = await supabase.from('pipeline').select('*');
                if (!error && data) {
                    setPipelineDeals(data);
                }
            } catch (err) {
                console.log("Failed to fetch deals, using local state", err);
            }
        };
        fetchDeals();
    }, []);

    const handleAutoFillDeal = (e) => {
        const dealId = e.target.value;
        const deal = pipelineDealsState.find(d => d.id === dealId);
        if (deal) {
            setFormData(prev => ({
                ...prev,
                propertyAddress: deal.address || prev.propertyAddress,
                purchasePrice: deal.value || prev.purchasePrice
            }));
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCloudSync = async () => {
        setIsSyncing(true);
        try {
            // Simulated upload delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // In a real scenario, we would upload the PDF blob to Supabase:
            // const { data, error } = await supabase.storage.from('contracts').upload(`contract_${Date.now()}.pdf`, pdfBlob);

            // Generate a mock secure share link
            const mockSecureLink = `https://wholesaletool.vercel.app/sign/${Math.random().toString(36).substr(2, 9)}`;

            // Try to copy to clipboard
            await navigator.clipboard.writeText(mockSecureLink);
            alert(`Document successfully synced to Supabase (Simulated).\n\nSecure Sign Link copied to clipboard:\n${mockSecureLink}`);
        } catch (error) {
            console.error(error);
            alert('Cloud sync simulation failed.');
        } finally {
            setIsSyncing(false);
        }
    };

    const generatePDF = async () => {
        if (!pdfContainerRef.current) return;
        setIsGeneratingPDF(true);
        try {
            // Render actual PDF of the contract bounds
            const canvas = await html2canvas(pdfContainerRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');

            // Apply standard 8.5x11 PDF size logic
            const pdf = new jsPDF('p', 'mm', 'letter');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            // Append E-Sign Audit Trail Page securely as a rasterized image (Prevents text highlighting/copying)
            const auditDiv = document.createElement('div');
            auditDiv.style.position = 'absolute';
            auditDiv.style.left = '-9999px';
            auditDiv.style.top = '0';
            auditDiv.style.width = '800px';
            auditDiv.style.backgroundColor = 'white';
            auditDiv.style.padding = '40px';
            auditDiv.style.color = 'black';
            auditDiv.style.fontFamily = 'Helvetica, sans-serif';

            const timestamp = new Date().toISOString();
            const userAgent = navigator.userAgent;
            let ip = 'Fetching...';
            try {
                const ipRes = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipRes.json();
                ip = ipData.ip;
            } catch (e) {
                console.log(e);
                ip = 'Unavailable (Client Network Error)';
            }

            let printedNamesHtml = '';
            if (selectedTemplate === 't1' || selectedTemplate === 't4') {
                printedNamesHtml = `
                    <div style="margin-bottom: 10px;">Seller Printed Name: ${formData.sellerPrinted || formData.seller || 'N/A'}</div>
                    <div style="margin-bottom: 10px;">Buyer Printed Name: ${formData.buyerPrinted || formData.buyer || 'N/A'}</div>
                `;
            } else if (selectedTemplate === 't2') {
                printedNamesHtml = `
                    <div style="margin-bottom: 10px;">Assignor Printed Name: ${formData.assignorPrinted || formData.assignor || 'N/A'}</div>
                    <div style="margin-bottom: 10px;">Assignee Printed Name: ${formData.assigneePrinted || formData.assignee || 'N/A'}</div>
                `;
            } else if (selectedTemplate === 't3') {
                printedNamesHtml = `
                    <div style="margin-bottom: 10px;">Party A Printed Name: ${formData.partyAPrinted || formData.partyA || 'N/A'}</div>
                    <div style="margin-bottom: 10px;">Party B Printed Name: ${formData.partyBPrinted || formData.partyB || 'N/A'}</div>
                `;
            }

            auditDiv.innerHTML = `
                <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 30px; letter-spacing: -0.5px;">Electronic Signature Certificate of Completion</h1>
                <div style="font-size: 14px; margin-bottom: 15px;">Document Reference: DOC-${Date.now()}</div>
                <div style="font-size: 14px; margin-bottom: 15px;">Execution Timestamp: ${timestamp}</div>
                <div style="font-size: 14px; margin-bottom: 15px;">Executing IP Address: ${ip}</div>
                <div style="font-size: 14px; margin-bottom: 30px; color: #555;">Client User-Agent: ${userAgent}</div>
                <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 20px;">Executed By:</h2>
                <div style="font-size: 14px;">
                    ${printedNamesHtml}
                </div>
                <div style="margin-top: 30px; font-weight: bold; font-size: 14px;">Status: EXECUTED & SEALED</div>
            `;

            document.body.appendChild(auditDiv);

            const auditCanvas = await html2canvas(auditDiv, { scale: 2 });
            const auditImgData = auditCanvas.toDataURL('image/png');

            pdf.addPage();
            const auditImgHeight = (auditCanvas.height * pdfWidth) / auditCanvas.width;
            pdf.addImage(auditImgData, 'PNG', 0, 0, pdfWidth, auditImgHeight);

            document.body.removeChild(auditDiv);

            pdf.save(`Contract_${Date.now()}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert("Failed to generate PDF. Make sure all canvas resources have loaded.");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return (
        <div className="documents-container animate-fade-in">
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">Document Automation</h1>
                    <p className="page-description">Generate, sign, and manage state-specific real estate contracts.</p>
                </div>
            </div>

            <div className="documents-layout">
                {/* Templates List */}
                <div className="card templates-card glass-panel">
                    <div className="card-header">
                        <h3>Contract Templates</h3>
                        <button className="btn btn-secondary btn-sm">+ Upload custom</button>
                    </div>
                    <div className="templates-list">
                        {templates.map(template => (
                            <div key={template.id} className={`template - item ${template.popular ? 'featured' : ''} `}>
                                <div className="template-icon">
                                    <FileText size={20} className={template.popular ? 'text-primary' : 'text-muted'} />
                                </div>
                                <div className="template-info">
                                    <h4>{template.name}</h4>
                                    <div className="template-meta">
                                        <span className="badge">{template.type}</span>
                                        <span className="state-req">{template.states}</span>
                                    </div>
                                </div>
                                {template.id === 't4' ? (
                                    <select
                                        className={`btn btn-sm ${selectedTemplate === template.id ? 'btn-primary' : 'btn-secondary'} border-none`}
                                        style={{ cursor: 'pointer', appearance: 'auto' }}
                                        value={selectedTemplate === template.id ? promulgatedState : ''}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                setSelectedTemplate(template.id);
                                                setPromulgatedState(e.target.value);
                                            }
                                        }}
                                    >
                                        <option value="" disabled={selectedTemplate === template.id}>Select State...</option>
                                        <option value="TX">Texas (TREC)</option>
                                        <option value="FL">Florida (FAR/BAR)</option>
                                        <option value="CA">California (C.A.R.)</option>
                                        <option value="GA">Georgia (GAR)</option>
                                    </select>
                                ) : (
                                    <button
                                        className={`btn btn-sm ${selectedTemplate === template.id ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setSelectedTemplate(template.id)}
                                    >
                                        {selectedTemplate === template.id ? 'Active' : 'Use'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Active Document Generator Preview */}
                <div className="card active-doc-card glass-panel">
                    <div className="doc-preview-header flex-between border-b pb-4 mb-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3>{templates.find(t => t.id === selectedTemplate)?.name || 'Document Preview'}</h3>
                                {selectedTemplate === 't4' && (
                                    <select
                                        className="fillable-input text-sm bg-[rgba(0,0,0,0.2)] border border-[var(--border-light)] px-2 py-1 rounded"
                                        value={promulgatedState}
                                        onChange={(e) => setPromulgatedState(e.target.value)}
                                        style={{ height: '32px' }}
                                    >
                                        <option value="TX">Texas (TREC)</option>
                                        <option value="FL">Florida (FAR/BAR)</option>
                                        <option value="CA">California (C.A.R.)</option>
                                        <option value="GA">Georgia (GAR)</option>
                                    </select>
                                )}
                            </div>
                            <p className="text-sm text-muted mt-1">Draft mode • Auto-saving active</p>
                        </div>
                        <div className="flex gap-2">
                            {pipelineDealsState.length > 0 && (
                                <select
                                    className="fillable-input text-sm bg-transparent border border-[var(--border-light)] px-2 py-1 rounded w-48"
                                    onChange={handleAutoFillDeal}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Link to Pipeline Deal...</option>
                                    {pipelineDealsState.map(deal => (
                                        <option key={deal.id} value={deal.id}>{deal.address}</option>
                                    ))}
                                </select>
                            )}
                            <button className="btn btn-secondary" onClick={handleCloudSync} disabled={isSyncing || isGeneratingPDF}>
                                <UploadCloud size={16} /> {isSyncing ? 'Syncing...' : 'Cloud Sync'}
                            </button>
                            <button className="btn btn-success" onClick={generatePDF} disabled={isGeneratingPDF || isSyncing}>
                                <Download size={16} /> {isGeneratingPDF ? 'Compiling...' : 'Generate PDF'}
                            </button>
                        </div>
                    </div>

                    <div className="mock-pdf-container">
                        <div className="mock-pdf-page text-black" ref={pdfContainerRef} style={{ background: '#ffffff', color: '#000000' }}>
                            {selectedTemplate === 't1' && (
                                <div className="animate-fade-in">
                                    <h2 className="text-center font-bold mb-6">REAL ESTATE PURCHASE AND SALE AGREEMENT</h2>

                                    <p className="mb-4">
                                        THIS AGREEMENT is made and entered into this
                                        <input
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                            className="fillable-input mx-1"
                                        />
                                        , by and between
                                        <input
                                            type="text"
                                            name="seller"
                                            value={formData.seller}
                                            onChange={handleInputChange}
                                            placeholder="[Seller Name]"
                                            className="fillable-input mx-1"
                                        />
                                        (hereinafter referred to as "Seller") and
                                        <input
                                            type="text"
                                            name="buyer"
                                            value={formData.buyer}
                                            onChange={handleInputChange}
                                            placeholder="[Buyer Name]"
                                            className="fillable-input mx-1"
                                        />
                                        (hereinafter referred to as "Buyer").
                                    </p>

                                    <p className="mb-4">
                                        <strong>1. PROPERTY DESCRIPTION:</strong> The Seller agrees to sell, and the Buyer agrees to buy, the real property and improvements located at:
                                        <input
                                            type="text"
                                            name="propertyAddress"
                                            value={formData.propertyAddress}
                                            onChange={handleInputChange}
                                            placeholder="[Property Address]"
                                            className="fillable-input mx-1"
                                            style={{ width: '250px' }}
                                        />
                                        (the "Subject Property").
                                    </p>

                                    <p className="mb-4">
                                        <strong>2. PURCHASE PRICE:</strong> The total agreed purchase price for the Subject Property shall be
                                        <input
                                            type="text"
                                            name="purchasePrice"
                                            value={formData.purchasePrice}
                                            onChange={handleInputChange}
                                            placeholder="$[Amount]"
                                            className="fillable-input mx-1"
                                        />
                                        payable at the time of closing.
                                    </p>

                                    <p className="mb-4 text-justify">
                                        <strong>3. DUE DILIGENCE & COMPLIANCE INSPECTION:</strong> Buyer shall have a sweeping and unconditional inspection period strictly spanning seven (7) to fourteen (14) calendar days from the Effective Date of this Agreement to conduct any and all physical, structural, environmental, and financial due diligence on the Subject Property. This period explicitly grants Buyer exhaustive access to the premises for the purpose of identifying any latent defects, municipal code violations, unpermitted additions, or non-compliant infrastructure. Seller expressly agrees and covenants to provide unfettered access to Buyer, their agents, inspectors, and contractors. Furthermore, Purchaser retains the unilateral, absolute, and unmitigated discretion to reject the property condition should any components be deemed "out of code," functionally obsolete, or otherwise unsatisfactory to Buyer's proprietary investment criteria, without any requisite justification or evidentiary burden owed to the Seller.
                                    </p>
                                    <p className="mb-4 text-justify">
                                        <strong>4. SELLER REPRESENTATIONS & EXPECTATIONS:</strong> Seller hereby warrants, represents, and guarantees that they possess absolute, unencumbered fee simple title to the Subject Property and maintain the sole, exclusive legal capacity to execute this transaction. Seller shall maintain the property in its current condition, completely mitigating any risk of deterioration, vandalism, or damage prior to closing. Seller acknowledges that Buyer is a principal acting for profit and that this Agreement may be subject to assignment, syndication, or concurrent closing procedures without prior notification or consent required from Seller.
                                    </p>

                                    <div className="signature-section mt-12 flex gap-8 flex-wrap">
                                        <SignatureBlock
                                            label="Seller"
                                            printedNameValue={formData.sellerPrinted}
                                            defaultNameValue={formData.seller}
                                            printedNameKey="sellerPrinted"
                                            onPrintedNameChange={handleInputChange}
                                            sigRef={sellerSigRef}
                                        />
                                        <SignatureBlock
                                            label="Buyer"
                                            printedNameValue={formData.buyerPrinted}
                                            defaultNameValue={formData.buyer}
                                            printedNameKey="buyerPrinted"
                                            onPrintedNameChange={handleInputChange}
                                            sigRef={buyerSigRef}
                                        />
                                    </div>

                                    <div className="mt-12 pt-4 border-t" style={{ borderColor: 'var(--border-light)' }}>
                                        <p className="text-justify italic" style={{ fontSize: '0.65rem', lineHeight: '1.4', color: 'var(--text-muted)' }}>
                                            <strong>RIGHT OF TERMINATION AND CANCELLATION FEE:</strong> It is hereby mutually understood, covenanted, and agreed by both Parties that either the Buyer or the Seller reserves the absolute and unequivocal right to terminate and cancel this Agreement at any given time prior to the final designated closing date. Such termination may be effectuated by providing formal notice, which shall be deemed legally sufficient whether delivered in written or oral form, to the opposing Party. Notwithstanding the foregoing, in the express event that the Buyer elects to exercise this absolute right of termination for any reason or cause whatsoever, the Buyer shall be immediately held liable and obligated to pay a termination penalty fee equal to five percent (5%) of the total gross Purchase Price of the Subject Property. Said termination fee shall become immediately due and strictly payable at the time of closing, or upon the formal execution of the cancellation, whichever condition occurs first. This fee shall serve as agreed-upon liquidated damages to rightfully compensate the Seller for the time, administrative burden, and removal of the Subject Property from the active real estate market.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {selectedTemplate === 't2' && (
                                <div className="animate-fade-in">
                                    <h2 className="text-center font-bold mb-6">ASSIGNMENT OF REAL ESTATE PURCHASE AND SALE AGREEMENT</h2>

                                    <p className="mb-4">
                                        THIS ASSIGNMENT is made this
                                        <input
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                            className="fillable-input mx-1"
                                        />
                                        , by and between
                                        <input
                                            type="text"
                                            name="assignor"
                                            value={formData.assignor}
                                            onChange={handleInputChange}
                                            placeholder="[Assignor Name]"
                                            className="fillable-input mx-1"
                                        />
                                        ("Assignor") and
                                        <input
                                            type="text"
                                            name="assignee"
                                            value={formData.assignee}
                                            onChange={handleInputChange}
                                            placeholder="[Assignee Name]"
                                            className="fillable-input mx-1"
                                        />
                                        ("Assignee").
                                    </p>

                                    <p className="mb-4">
                                        <strong>WITNESSETH:</strong>
                                        <br /><br />
                                        WHEREAS, Assignor has entered into a certain Real Estate Purchase and Sale Agreement with
                                        <input
                                            type="text"
                                            name="seller"
                                            value={formData.seller}
                                            onChange={handleInputChange}
                                            placeholder="[Seller Name]"
                                            className="fillable-input mx-1"
                                        />
                                        as Seller and Assignor as Buyer, which Agreement was executed on
                                        <input
                                            type="text"
                                            name="contractDate"
                                            value={formData.contractDate}
                                            onChange={handleInputChange}
                                            placeholder="[Contract Date]"
                                            className="fillable-input mx-1"
                                        />.
                                    </p>

                                    <p className="mb-4">
                                        <strong>ASSIGNMENT FEE:</strong> In consideration of this Assignment, Assignee agrees to pay Assignor a non-refundable assignment fee in the amount of $
                                        <input
                                            type="text"
                                            name="assignmentFee"
                                            value={formData.assignmentFee}
                                            onChange={handleInputChange}
                                            placeholder="[Amount]"
                                            className="fillable-input mx-1"
                                        />
                                        payable at the time of closing.
                                    </p>

                                    <div className="signature-section mt-12 flex gap-8 flex-wrap">
                                        <SignatureBlock
                                            label="Assignor"
                                            printedNameValue={formData.assignorPrinted}
                                            defaultNameValue={formData.assignor}
                                            printedNameKey="assignorPrinted"
                                            onPrintedNameChange={handleInputChange}
                                            sigRef={assignorSigRef}
                                        />
                                        <SignatureBlock
                                            label="Assignee"
                                            printedNameValue={formData.assigneePrinted}
                                            defaultNameValue={formData.assignee}
                                            printedNameKey="assigneePrinted"
                                            onPrintedNameChange={handleInputChange}
                                            sigRef={assigneeSigRef}
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedTemplate === 't3' && (
                                <div className="animate-fade-in">
                                    <h2 className="text-center font-bold mb-6">JOINT VENTURE (CO-WHOLESALING) AGREEMENT</h2>

                                    <p className="mb-4">
                                        THIS JOINT VENTURE AGREEMENT is made and entered into this
                                        <input
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                            className="fillable-input mx-1"
                                        />
                                        , by and between
                                        <input
                                            type="text"
                                            name="partyA"
                                            value={formData.partyA}
                                            onChange={handleInputChange}
                                            placeholder="[Party A Name]"
                                            className="fillable-input mx-1"
                                        />
                                        (hereinafter "Party A") and
                                        <input
                                            type="text"
                                            name="partyB"
                                            value={formData.partyB}
                                            onChange={handleInputChange}
                                            placeholder="[Party B Name]"
                                            className="fillable-input mx-1"
                                        />
                                        (hereinafter "Party B").
                                    </p>

                                    <p className="mb-4">
                                        <strong>1. PURPOSE:</strong> The parties are entering into this Agreement to memorialize their intent to work together as Joint Venturers (Co-Wholesalers) for the purpose of assigning, selling, or buying the real estate contract for the property located at:
                                        <input
                                            type="text"
                                            name="propertyAddress"
                                            value={formData.propertyAddress}
                                            onChange={handleInputChange}
                                            placeholder="[Property Address]"
                                            className="fillable-input mx-1"
                                            style={{ width: '250px' }}
                                        />
                                        (the "Subject Property").
                                    </p>

                                    <p className="mb-4">
                                        <strong>2. COMPENSATION DISTRIBUTION:</strong> In consideration of the mutual promises contained herein, the Parties agree that any assignment fee, wholesale fee, or net profit derived from the closing of the Subject Property transaction shall be split as follows:
                                        <br /><br />
                                        <select
                                            name="jvFeeType"
                                            value={formData.jvFeeType}
                                            onChange={handleInputChange}
                                            className="fillable-input mx-1"
                                        >
                                            <option value="percentage">Percentage Split (%)</option>
                                            <option value="flat">Flat Fee Amount ($)</option>
                                        </select>
                                        <input
                                            type="text"
                                            name="jvFeeValue"
                                            value={formData.jvFeeValue}
                                            onChange={handleInputChange}
                                            placeholder={formData.jvFeeType === 'percentage' ? "e.g. 50/50" : "e.g. $5,000"}
                                            className="fillable-input mx-1"
                                        />
                                        (describe the split or amount owed to Party B, with the remainder to Party A).
                                    </p>

                                    <p className="mb-4 text-justify">
                                        <strong>3. INDEPENDENT CONTRACTOR STATUS:</strong> This Agreement does not create a partnership, employer-employee relationship, or formal legal entity between the Parties beyond the scope of this single transaction. Each Party acknowledges they act independently.
                                    </p>

                                    <p className="mb-4 text-justify">
                                        <strong>4. NON-CIRCUMVENTION:</strong> Both Parties expressly agree not to bypass, circumvent, or negotiate directly with any buyers, sellers, or contacts introduced by the other Party regarding the Subject Property without explicit written consent.
                                    </p>

                                    <div className="signature-section mt-12 flex gap-8 flex-wrap">
                                        <SignatureBlock
                                            label="Party A"
                                            printedNameValue={formData.partyAPrinted}
                                            defaultNameValue={formData.partyA}
                                            printedNameKey="partyAPrinted"
                                            onPrintedNameChange={handleInputChange}
                                            sigRef={partyASigRef}
                                        />
                                        <SignatureBlock
                                            label="Party B"
                                            printedNameValue={formData.partyBPrinted}
                                            defaultNameValue={formData.partyB}
                                            printedNameKey="partyBPrinted"
                                            onPrintedNameChange={handleInputChange}
                                            sigRef={partyBSigRef}
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedTemplate === 't4' && (
                                <div className="animate-fade-in">
                                    {promulgatedState === 'TX' && (
                                        <>
                                            <h2 className="text-center font-bold mb-2">PROMULGATED BY THE TEXAS REAL ESTATE COMMISSION (TREC)</h2>
                                            <h2 className="text-center font-bold mb-6 text-xl">ONE TO FOUR FAMILY RESIDENTIAL CONTRACT (RESALE)</h2>
                                        </>
                                    )}
                                    {promulgatedState === 'FL' && (
                                        <>
                                            <h2 className="text-center font-bold mb-2">FLORIDA REALTORS / FLORIDA BAR</h2>
                                            <h2 className="text-center font-bold mb-6 text-xl">"AS IS" RESIDENTIAL CONTRACT FOR SALE AND PURCHASE</h2>
                                        </>
                                    )}
                                    {promulgatedState === 'CA' && (
                                        <>
                                            <h2 className="text-center font-bold mb-2">CALIFORNIA ASSOCIATION OF REALTORS® (C.A.R.)</h2>
                                            <h2 className="text-center font-bold mb-6 text-xl">CALIFORNIA RESIDENTIAL PURCHASE AGREEMENT</h2>
                                        </>
                                    )}
                                    {promulgatedState === 'GA' && (
                                        <>
                                            <h2 className="text-center font-bold mb-2">GEORGIA ASSOCIATION OF REALTORS® (GAR)</h2>
                                            <h2 className="text-center font-bold mb-6 text-xl">PURCHASE AND SALE AGREEMENT</h2>
                                        </>
                                    )}

                                    <p className="mb-4">
                                        <strong>1. PARTIES:</strong> The parties to this contract are
                                        <input
                                            type="text"
                                            name="seller"
                                            value={formData.seller}
                                            onChange={handleInputChange}
                                            placeholder="[Seller Name]"
                                            className="fillable-input mx-1"
                                        />
                                        (Seller) and
                                        <input
                                            type="text"
                                            name="buyer"
                                            value={formData.buyer}
                                            onChange={handleInputChange}
                                            placeholder="[Buyer Name]"
                                            className="fillable-input mx-1"
                                        />
                                        (Buyer). Seller agrees to sell and convey to Buyer and Buyer agrees to buy from Seller the Property defined below.
                                    </p>

                                    <p className="mb-4">
                                        <strong>2. PROPERTY:</strong> The land, improvements and accessories are collectively referred to as the Property.
                                        <br />
                                        <strong>A. LAND:</strong> Lot Block Addition, City of, County of, Texas, known as
                                        <input
                                            type="text"
                                            name="propertyAddress"
                                            value={formData.propertyAddress}
                                            onChange={handleInputChange}
                                            placeholder="[Property Address]"
                                            className="fillable-input mx-1"
                                            style={{ width: '250px' }}
                                        />
                                        (address/zip code), or as described on attached exhibit.
                                    </p>

                                    <p className="mb-4">
                                        <strong>3. SALES PRICE:</strong>
                                        <br />
                                        <strong>A. Cash portion of Sales Price payable by Buyer at closing:</strong> $
                                        <input
                                            type="text"
                                            name="purchasePrice"
                                            value={formData.purchasePrice}
                                            onChange={handleInputChange}
                                            placeholder="[Amount]"
                                            className="fillable-input mx-1"
                                        />
                                        <br />
                                        <strong>B. Sum of all financing described in the attached:</strong> $___________
                                        <br />
                                        <strong>C. Sales Price (Sum of A and B):</strong> $___________
                                    </p>

                                    <p className="mb-4 text-justify">
                                        <strong>5. EARNEST MONEY AND TERMINATION OPTION:</strong>
                                        <br />
                                        <strong>A. DELIVERY OF EARNEST MONEY AND OPTION FEE:</strong> Within 3 days after the Effective Date, Buyer must deliver to
                                        <input
                                            type="text"
                                            name="titleCompany"
                                            value={formData.titleCompany}
                                            onChange={handleInputChange}
                                            placeholder="[Escrow Agent / Title Company]"
                                            className="fillable-input mx-1"
                                            style={{ width: '200px' }}
                                        />
                                        as escrow agent, at [Address] an earnest money deposit in the amount of $
                                        <input
                                            type="text"
                                            name="earnestMoney"
                                            value={formData.earnestMoney}
                                            onChange={handleInputChange}
                                            placeholder="[Earnest Money Amount]"
                                            className="fillable-input mx-1"
                                        />
                                        and an Option Fee.
                                    </p>

                                    <p className="text-xs text-muted mb-6 italic text-center">
                                        [This is a simplified representation of the {promulgatedState} State Promulgated Form for demonstration purposes.]
                                    </p>

                                    <div className="signature-section mt-12 flex gap-8 flex-wrap">
                                        <SignatureBlock
                                            label="Seller"
                                            printedNameValue={formData.sellerPrinted}
                                            defaultNameValue={formData.seller}
                                            printedNameKey="sellerPrinted"
                                            onPrintedNameChange={handleInputChange}
                                            sigRef={sellerSigRef}
                                        />
                                        <SignatureBlock
                                            label="Buyer"
                                            printedNameValue={formData.buyerPrinted}
                                            defaultNameValue={formData.buyer}
                                            printedNameKey="buyerPrinted"
                                            onPrintedNameChange={handleInputChange}
                                            sigRef={buyerSigRef}
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedTemplate !== 't1' && selectedTemplate !== 't2' && selectedTemplate !== 't3' && selectedTemplate !== 't4' && (
                                <div className="text-center p-12 text-muted animate-fade-in" style={{ marginTop: '100px' }}>
                                    <FileText size={48} className="mx-auto mb-4" style={{ opacity: 0.2 }} />
                                    <h3>Template Preview Placeholder</h3>
                                    <p className="mt-2 text-sm">Select a supported template from the sidebar to view its live preview and fillable form.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Documents;
