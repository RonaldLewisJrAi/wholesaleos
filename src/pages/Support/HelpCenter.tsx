import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Search, ChevronRight, Hash, Phone, AlertCircle, ShieldCheck, Target, Zap, Activity, ShieldAlert, Award, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/useAuth';
import { useNavigate } from 'react-router-dom';

// Use Vite's raw import to bring in the markdown text directly
import knowledgeBaseRaw from '../../docs/wholesaleos_knowledge_base.md?raw';

// Helper to parse the raw markdown into sections based on `## ` headings
const parseMarkdownSections = (markdown: string) => {
    const sections = [];
    const lines = markdown.split('\n');
    let currentSection = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('## ')) {
            if (currentSection) {
                sections.push(currentSection);
            }
            const title = line.replace('## ', '').trim();
            // Generate a slug ID for linking (e.g. "1. Platform Overview" -> "1-platform-overview")
            const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            currentSection = { id, title, content: '' };
        } else if (currentSection) {
            currentSection.content += line + '\n';
        }
    }

    // push the last section
    if (currentSection) {
        sections.push(currentSection);
    }

    return sections;
};

export const HelpCenter = () => {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Support Ticket Form State
    const [ticketSubject, setTicketSubject] = useState('');
    const [ticketMessage, setTicketMessage] = useState('');
    const [ticketStatus, setTicketStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    // Parse Sections Once
    const allSections = useMemo(() => parseMarkdownSections(knowledgeBaseRaw), []);

    // Filter Sections based on Search
    const filteredSections = useMemo(() => {
        if (!searchQuery.trim()) return allSections;
        const query = searchQuery.toLowerCase();
        return allSections.filter(sec =>
            sec.title.toLowerCase().includes(query) ||
            sec.content.toLowerCase().includes(query)
        );
    }, [searchQuery, allSections]);

    // Handle Scroll Navigation
    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Auto-select first section on load
    useEffect(() => {
        if (allSections.length > 0 && !activeSection) {
            setActiveSection(allSections[0].id);
        }
    }, [allSections]);


    // Intersection Observer for Scroll Spying
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // If it's hitting the top third of the viewport, consider it active
                if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
                    setActiveSection(entry.target.id);
                }
            });
        }, { rootMargin: '-10% 0px -80% 0px' });

        allSections.forEach(sec => {
            const el = document.getElementById(sec.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [allSections, filteredSections]);


    // Formatting helper to render bold text simply
    const renderContent = (text: string) => {
        return text.split('\n').map((line, idx) => {
            if (!line.trim()) return <br key={idx} />;

            // Basic bold markdown `**text**` simulation (very rudimentary)
            // For a robust implementation, a Markdown React renderer (like react-markdown) would be superior.
            // Since this is plain text rendering from the raw prompt, we use simple line mapping.
            const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');

            return (
                <p key={idx} className={`mb-2 ${isBullet ? 'pl-4 border-l-2 border-indigo-500/30' : ''}`}>
                    {line}
                </p>
            );
        });
    };

    const handleSubmitTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticketSubject.trim() || !ticketMessage.trim() || !user) return;

        setTicketStatus('submitting');

        try {
            if (!supabase) throw new Error("Database client unavailable");

            const { error } = await supabase
                .from('support_tickets')
                .insert([{
                    user_id: user.id,
                    subject: ticketSubject,
                    message: ticketMessage,
                    status: 'open'
                }]);

            if (error) throw error;

            setTicketStatus('success');
            setTicketSubject('');
            setTicketMessage('');

            // Reset after 3 seconds
            setTimeout(() => setTicketStatus('idle'), 3000);

        } catch (error) {
            console.error("Error submitting ticket:", error);
            setTicketStatus('error');
        }
    };


    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-[var(--bg-primary)]">

            {/* Sidebar Navigation */}
            <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col h-full hidden md:flex shrink-0">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <BookOpen className="text-indigo-400" /> Knowledge Base
                    </h2>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search guides..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
                    <nav className="space-y-1">
                        {allSections.map((section) => {
                            // Determine if this section matches the search query visually 
                            const isMatch = filteredSections.some(s => s.id === section.id);

                            if (searchQuery && !isMatch) return null;

                            return (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${activeSection === section.id
                                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                                        }`}
                                >
                                    <span className="truncate">{section.title}</span>
                                    {activeSection === section.id && <ChevronRight size={16} />}
                                </button>
                            );
                        })}
                        {searchQuery && filteredSections.length === 0 && (
                            <div className="text-sm text-slate-500 text-center py-4">
                                No topics found matching "{searchQuery}"
                            </div>
                        )}
                    </nav>
                </div>

                {/* Direct Support Module */}
                <div className="p-6 border-t border-slate-800 bg-indigo-950/20">
                    <h3 className="text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                        <Phone size={14} className="text-indigo-400" /> Contact Support
                    </h3>
                    <p className="text-xs text-slate-500 mb-3">Email: MyWholesaleOS@gmail.com</p>
                    <button
                        onClick={() => scrollToSection('submit-ticket')}
                        className="w-full py-2 bg-[var(--bg-tertiary)] hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-bold text-white uppercase tracking-wider transition-colors"
                    >
                        Submit Request Form
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 scroll-smooth custom-scrollbar">
                <div className="max-w-4xl mx-auto pb-32">

                    <div className="mb-12 border-b border-slate-800 pb-8">
                        <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">WholesaleOS Documentation</h1>
                        <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
                            The official platform Help Center. This manual mirrors the platform architecture, providing
                            clear guidance on Deal Intelligence, Tri-Party Verification, and automated transaction distribution.
                        </p>
                    </div>

                    <div className="prose prose-invert prose-indigo max-w-none">

                        {filteredSections.map((section) => {
                            if (searchQuery && !filteredSections.some(s => s.id === section.id)) return null;

                            return (
                                <section key={section.id} id={section.id} className="scroll-mt-10 mb-16 shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-xl border border-slate-800 bg-slate-900/40 p-8">
                                    <h2 className="text-3xl font-bold text-white border-b border-slate-800 pb-4 flex items-center gap-3 mb-6 tracking-tight">
                                        <Hash className="text-indigo-500" size={24} />
                                        {section.title}
                                    </h2>
                                    <div className="text-slate-300 leading-relaxed text-sm">
                                        {renderContent(section.content)}
                                    </div>
                                </section>
                            );
                        })}

                        {/* Interactive Supabase Support Ticket Injector */}
                        <section id="submit-ticket" className="scroll-mt-10 mb-16 shadow-[0_4px_30px_rgba(0,0,0,0.1)] rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 p-8 border-b border-slate-800">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2 m-0">
                                    <Send className="text-indigo-400" /> Submit Support Request
                                </h2>
                                <p className="text-slate-300 mt-2 text-sm">
                                    Cannot find what you are looking for in the Knowledge Base? Submit a ticket directly to the Super Admin engineering team.
                                </p>
                            </div>

                            <div className="p-8">
                                <form onSubmit={handleSubmitTicket} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Subject Header</label>
                                        <input
                                            type="text"
                                            value={ticketSubject}
                                            onChange={(e) => setTicketSubject(e.target.value)}
                                            required
                                            disabled={ticketStatus === 'submitting'}
                                            placeholder="e.g. Issue Publishing Property ID #8492"
                                            className="w-full bg-[var(--bg-tertiary)] border border-slate-700 rounded-lg py-3 px-4 text-white focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detailed Message</label>
                                        <textarea
                                            rows={5}
                                            required
                                            value={ticketMessage}
                                            onChange={(e) => setTicketMessage(e.target.value)}
                                            disabled={ticketStatus === 'submitting'}
                                            placeholder="Please describe exactly what you were trying to accomplish..."
                                            className="w-full bg-[var(--bg-tertiary)] border border-slate-700 rounded-lg py-3 px-4 text-white resize-none focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="pt-2 flex items-center gap-4">
                                        <button
                                            type="submit"
                                            disabled={ticketStatus === 'submitting'}
                                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center gap-2"
                                        >
                                            {ticketStatus === 'submitting' ? 'Transmitting to Admin...' : 'Submit Priority Ticket'}
                                        </button>

                                        {ticketStatus === 'success' && (
                                            <span className="text-emerald-400 text-sm font-bold flex items-center gap-2 animate-fade-in">
                                                <ShieldCheck size={16} /> Ticket Submitted Successfully.
                                            </span>
                                        )}
                                        {ticketStatus === 'error' && (
                                            <span className="text-red-400 text-sm font-bold flex items-center gap-2 animate-fade-in">
                                                <AlertCircle size={16} /> Connection Failure. Please try again.
                                            </span>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
};
