import React, { useState, useEffect } from 'react';
import { Search, Filter, UserPlus, Mail, Phone, MapPin, X, UploadCloud } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './CRM.css';

const mockContacts = [
    { id: 1, name: 'Sarah Jenkins', type: 'Cash Buyer', tags: ['VIP', 'Multi-family'], email: 'sarah.j@investments.com', phone: '(555) 123-4567', location: 'Austin, TX', tier: 'Tier 1' },
    { id: 2, name: 'Michael Chen', type: 'Lead (Motivated)', tags: ['Pre-foreclosure'], email: 'mchen88@gmail.com', phone: '(555) 987-6543', location: 'Dallas, TX', tier: 'N/A' },
    { id: 3, name: 'Apex Properties LLC', type: 'Cash Buyer', tags: ['Fix & Flip', 'Commercial'], email: 'acquisitions@apexprop.net', phone: '(555) 456-7890', location: 'Houston, TX', tier: 'Tier 2' },
    { id: 4, name: 'David Rodriguez', type: 'Lead (Probate)', tags: ['High Equity'], email: 'd.rodriguez.estate@yahoo.com', phone: '(555) 222-3333', location: 'San Antonio, TX', tier: 'N/A' },
];

const CRM = () => {
    const [activeTab, setActiveTab] = useState('All');
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [modalTab, setModalTab] = useState('Manual'); // 'Manual' or 'Import'
    const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', tags: '' });
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const fetchContacts = async () => {
            if (!supabase) {
                setContacts(mockContacts);
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('crm_contacts')
                    .select('*');

                if (error) throw error;

                if (data && data.length > 0) {
                    setContacts(data);
                } else {
                    setContacts(mockContacts);
                }
            } catch (error) {
                console.error('Error fetching CRM contacts, falling back to mock data:', error);
                setContacts(mockContacts);
            } finally {
                setLoading(false);
            }
        };

        fetchContacts();
    }, []);

    const handleOpenModal = () => {
        setIsAddModalOpen(true);
        setModalTab('Manual');
        setNewContact({ name: '', phone: '', email: '', tags: '' });
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
    };

    const submitManualContact = (e) => {
        e.preventDefault();
        if (!newContact.name) return;

        const contactData = {
            id: Date.now(),
            name: newContact.name,
            type: 'Lead (Manual)',
            tags: newContact.tags ? newContact.tags.split(',').map(t => t.trim()) : [],
            email: newContact.email || 'N/A',
            phone: newContact.phone || 'N/A',
            location: 'Unknown',
            tier: 'N/A'
        };

        setContacts(prev => [contactData, ...prev]);
        handleCloseModal();
    };

    const simulateFileUpload = async () => {
        setIsUploading(true);
        try {
            // Simulate reading a CSV file
            await new Promise(resolve => setTimeout(resolve, 2000));
            const batchContacts = [
                { id: Date.now() + 1, name: 'Hedge Fund Alpha', type: 'Cash Buyer', tags: ['Institutional', 'Bulk'], email: 'acquisitions@hf-alpha.com', phone: '(800) 555-0000', location: 'National', tier: 'Tier 1' },
                { id: Date.now() + 2, name: 'Zillow Offers', type: 'iBuyer', tags: ['Automated'], email: 'offers@zillow.com', phone: 'N/A', location: 'National', tier: 'Tier 2' },
                { id: Date.now() + 3, name: 'Local Flipper LLC', type: 'Cash Buyer', tags: ['Cosmetic Rehab'], email: 'deals@localflipper.com', phone: '(555) 999-8888', location: 'Regional', tier: 'Tier 3' }
            ];
            setContacts(prev => [...batchContacts, ...prev]);
            handleCloseModal();
        } finally {
            setIsUploading(false);
        }
    };

    // Simple client-side filtering logic for the tabs
    const filteredContacts = contacts.filter(contact => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Cash Buyers' && contact.type.includes('Buyer')) return true;
        if (activeTab === 'Motivated Leads' && contact.type.includes('Motivated')) return true;
        if (activeTab === 'VIP Investors' && contact.tags && contact.tags.includes('VIP')) return true;
        return false;
    });

    return (
        <div className="crm-container animate-fade-in">
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">Leads & Buyers (CRM)</h1>
                    <p className="page-description">Manage your investor network, inbound leads, and communication history.</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary"><Filter size={16} /> Filter</button>
                    <button className="btn btn-primary" onClick={handleOpenModal}><UserPlus size={16} /> Add Contact</button>
                </div>
            </div>

            <div className="crm-toolbar glass-panel">
                <div className="tabs">
                    {['All', 'Cash Buyers', 'Motivated Leads', 'VIP Investors'].map(tab => (
                        <button
                            key={tab}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input type="text" placeholder="Search contacts..." className="search-input" />
                </div>
            </div>

            <div className="card table-card glass-panel">
                <div className="table-responsive">
                    <table className="crm-table">
                        <thead>
                            <tr>
                                <th>Name / Entity</th>
                                <th>Type</th>
                                <th>Contact Info</th>
                                <th>Target Market</th>
                                <th>Tags</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className="text-center p-4 text-muted">Loading contacts...</td></tr>
                            ) : (
                                filteredContacts.map(contact => (
                                    <tr key={contact.id}>
                                        <td>
                                            <div className="contact-name-cell">
                                                <div className="contact-avatar">{contact.name ? contact.name.charAt(0) : '?'}</div>
                                                <div>
                                                    <div className="contact-name">{contact.name}</div>
                                                    {contact.tier && contact.tier !== 'N/A' && <div className="contact-tier">{contact.tier}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`type-badge ${contact.type && contact.type.includes('Buyer') ? 'bg-primary' : 'bg-warning'}`}>
                                                {contact.type || 'Unknown'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="contact-info-cell">
                                                <span><Mail size={12} /> {contact.email}</span>
                                                <span><Phone size={12} /> {contact.phone}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="location-text"><MapPin size={12} /> {contact.location}</span>
                                        </td>
                                        <td>
                                            <div className="contact-tags">
                                                {contact.tags && contact.tags.map(tag => (
                                                    <span key={tag} className="tag">{tag}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <button className="btn btn-secondary btn-sm">Profile</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Contact Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel animate-fade-in" style={{ maxWidth: '500px', width: '90%' }}>
                        <div className="modal-header flex-between" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Add New Contacts</h2>
                            <button className="icon-btn-small" onClick={handleCloseModal}><X size={20} /></button>
                        </div>

                        <div className="tabs mb-4" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)' }}>
                            <button
                                className={`tab-btn ${modalTab === 'Manual' ? 'active' : ''}`}
                                onClick={() => setModalTab('Manual')}
                                style={{ borderRadius: '4px 4px 0 0', padding: '8px 16px', borderBottom: modalTab === 'Manual' ? '2px solid var(--accent-primary)' : 'none' }}
                            >
                                Manual Entry
                            </button>
                            <button
                                className={`tab-btn ${modalTab === 'Import' ? 'active' : ''}`}
                                onClick={() => setModalTab('Import')}
                                style={{ borderRadius: '4px 4px 0 0', padding: '8px 16px', borderBottom: modalTab === 'Import' ? '2px solid var(--accent-primary)' : 'none' }}
                            >
                                Import File (.csv)
                            </button>
                        </div>

                        {modalTab === 'Manual' ? (
                            <form onSubmit={submitManualContact} className="modal-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Full Name / Entity</label>
                                    <input type="text" className="form-input" required placeholder="e.g. Acme Investments LLC" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'white' }} />
                                </div>
                                <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Email Address</label>
                                        <input type="email" className="form-input" placeholder="contact@example.com" value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'white' }} />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Phone Number</label>
                                        <input type="tel" className="form-input" placeholder="(555) 000-0000" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'white' }} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Tags (comma isolated)</label>
                                    <input type="text" className="form-input" placeholder="e.g. VIP, Multi-family, Fix & Flip" value={newContact.tags} onChange={e => setNewContact({ ...newContact, tags: e.target.value })} style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'white' }} />
                                </div>
                                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={!newContact.name}>Save Contact</button>
                                </div>
                            </form>
                        ) : (
                            <div className="import-tab" style={{ textAlign: 'center', padding: '24px 0' }}>
                                <div className="upload-dropzone" style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '40px 20px', background: 'var(--bg-primary)', cursor: 'pointer', marginBottom: '24px' }} onClick={simulateFileUpload}>
                                    <UploadCloud size={48} style={{ margin: '0 auto 16px auto', color: 'var(--text-muted)' }} />
                                    <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>Click to Upload .CSV Spreadsheet</h3>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Drag and drop your exported contacts file here</p>
                                </div>
                                <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                                    <button type="button" className="btn btn-primary" onClick={simulateFileUpload} disabled={isUploading}>
                                        {isUploading ? 'Importing...' : 'Simulate Import'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CRM;
