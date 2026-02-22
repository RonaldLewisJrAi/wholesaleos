import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Edit2, Trash2, MapPin, Clock, AlignLeft } from 'lucide-react';
import { useDemoMode } from '../contexts/DemoModeContext';

// Basic utility to get days in month
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const generateMockEvents = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return [
        { id: 1, date: 15, month: currentMonth, year: currentYear, title: 'Seller Walkthrough', time: '10:00 AM', location: '123 Main St', description: 'Initial walkthrough and condition check.' },
        { id: 2, date: Math.min(18, getDaysInMonth(currentYear, currentMonth)), month: currentMonth, year: currentYear, title: 'Title Company Closing', time: '2:30 PM', location: 'Texas Title Co.', description: 'Sign closing docs for the Smith parcel.' },
        { id: 3, date: Math.min(22, getDaysInMonth(currentYear, currentMonth)), month: currentMonth, year: currentYear, title: 'Buyer Showing', time: '4:00 PM', location: '456 Oak Ave', description: 'Showing the property to prospective cash buyers.' }
    ];
};

const CalendarView = () => {
    const { isDemoMode } = useDemoMode();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);

    // Auto-load demo data or local storage
    useEffect(() => {
        if (isDemoMode) {
            setEvents(generateMockEvents());
        } else {
            const saved = localStorage.getItem('wholesale_os_calendar_events');
            if (saved) {
                setEvents(JSON.parse(saved));
            } else {
                setEvents([]);
            }
        }
    }, [isDemoMode]);

    // Save live data to local storage
    useEffect(() => {
        if (!isDemoMode && events.length > 0) {
            localStorage.setItem('wholesale_os_calendar_events', JSON.stringify(events));
        }
    }, [events, isDemoMode]);

    const [selectedDate, setSelectedDate] = useState(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    // Form state
    const [eventTitle, setEventTitle] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [eventLocation, setEventLocation] = useState('');
    const [eventDesc, setEventDesc] = useState('');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const openModal = (date, event = null) => {
        setSelectedDate(date);
        if (event) {
            setEditingEvent(event);
            setEventTitle(event.title);
            setEventTime(event.time);
            setEventLocation(event.location);
            setEventDesc(event.description);
        } else {
            setEditingEvent(null);
            setEventTitle('');
            setEventTime('');
            setEventLocation('');
            setEventDesc('');
        }
        setIsEventModalOpen(true);
    };

    const handleSaveEvent = (e) => {
        e.preventDefault();
        if (!eventTitle) return;

        if (editingEvent) {
            setEvents(events.map(ev => ev.id === editingEvent.id ? {
                ...ev, title: eventTitle, time: eventTime, location: eventLocation, description: eventDesc
            } : ev));
        } else {
            setEvents([...events, {
                id: Date.now(),
                date: selectedDate,
                month: month,
                year: year,
                title: eventTitle,
                time: eventTime,
                location: eventLocation,
                description: eventDesc
            }]);
        }
        setIsEventModalOpen(false);
    };

    const handleDeleteEvent = (id) => {
        if (window.confirm("Are you sure you want to delete this event?")) {
            setEvents(events.filter(ev => ev.id !== id));
            setIsEventModalOpen(false);
        }
    }

    const renderCalendarDays = () => {
        const grid = [];
        // Blank spots for offset
        for (let i = 0; i < firstDay; i++) {
            grid.push(<div key={`empty-${i}`} className="min-h-[140px] border-r border-b border-[var(--border-light)] bg-[var(--bg-secondary)] opacity-50 p-2"></div>);
        }

        // Actual days
        const today = new Date();
        const isCurrentMonthThisMonth = today.getMonth() === month && today.getFullYear() === year;

        for (let i = 1; i <= daysInMonth; i++) {
            const dayEvents = events.filter(e => e.date === i && e.month === month && e.year === year);
            const isToday = isCurrentMonthThisMonth && i === today.getDate();

            grid.push(
                <div key={i} className={`min-h-[140px] border-r border-b border-[var(--border-light)] p-2 transition-colors hover:bg-[rgba(255,255,255,0.05)] cursor-pointer ${isToday ? 'bg-[rgba(59,130,246,0.1)]' : 'bg-[var(--bg-primary)]'} ${(i + firstDay) % 7 === 0 ? 'border-r-0' : ''}`} onClick={() => openModal(i)}>
                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-muted'}`}>{i}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[80px] custom-scrollbar">
                        {dayEvents.map(ev => (
                            <div key={ev.id} className="text-xs bg-[var(--accent-primary)] text-white px-2 py-1 rounded truncate shadow-sm cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); openModal(i, ev); }}>
                                {ev.time && <span className="font-semibold mr-1">{ev.time}</span>}
                                {ev.title}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return grid;
    };

    return (
        <div className="calendar-container animate-fade-in">
            <div className="page-header flex-between mb-6">
                <div>
                    <h1 className="page-title flex items-center gap-2">
                        <CalendarIcon className="text-primary" size={28} /> Schedule
                        {isDemoMode && <span className="badge bg-[rgba(255,255,255,0.1)] text-xs ml-2 border border-[var(--border-light)]">Demo Mode Active</span>}
                    </h1>
                    <p className="page-description">Manage walkthroughs, closings, notate details, and schedule follow-ups.</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => openModal(new Date().getDate())}>
                        <Plus size={16} /> New Appointment
                    </button>
                </div>
            </div>

            <div className="glass-panel p-6 shadow-xl border-[var(--border-light)]">
                <div className="flex-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-4">
                        <button className="icon-btn-small border border-[var(--border-light)] rounded hover:bg-[rgba(255,255,255,0.1)] transition-colors" onClick={prevMonth}><ChevronLeft size={20} /></button>
                        {monthNames[month]} {year}
                        <button className="icon-btn-small border border-[var(--border-light)] rounded hover:bg-[rgba(255,255,255,0.1)] transition-colors" onClick={nextMonth}><ChevronRight size={20} /></button>
                    </h2>
                    <div className="flex gap-2 bg-[var(--bg-tertiary)] p-1 rounded-lg border border-[var(--border-light)]">
                        <button className="px-4 py-1.5 text-sm bg-[var(--accent-primary)] text-white font-medium rounded shadow-sm">Month</button>
                        <button className="px-4 py-1.5 text-sm text-muted hover:text-white transition-colors disabled opacity-50 cursor-not-allowed">Week</button>
                        <button className="px-4 py-1.5 text-sm text-muted hover:text-white transition-colors disabled opacity-50 cursor-not-allowed">Day</button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-0 rounded-xl overflow-hidden border-2 border-[var(--border-light)] bg-[var(--bg-secondary)]">
                    {days.map(day => (
                        <div key={day} className="text-center font-bold text-muted bg-[rgba(0,0,0,0.3)] py-3 uppercase text-xs tracking-wider border-b-2 border-[var(--border-light)]">{day}</div>
                    ))}
                    {renderCalendarDays()}
                </div>
            </div>

            {isEventModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content glass-panel animate-fade-in shadow-2xl" style={{ maxWidth: '500px', width: '90%', padding: '0', position: 'relative', overflow: 'hidden' }}>

                        <div className="flex-between p-5 border-b border-[var(--border-light)] bg-[rgba(0,0,0,0.2)]">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2 text-white">{editingEvent ? 'Edit Appointment' : 'New Appointment'}</h2>
                                <p className="text-sm text-primary font-medium mt-1">
                                    {monthNames[month]} {selectedDate}, {year}
                                </p>
                            </div>
                            <button className="icon-btn-small text-muted hover:text-white" onClick={() => setIsEventModalOpen(false)}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSaveEvent} className="flex flex-col gap-5 p-6">
                            <div>
                                <label className="block text-xs font-bold text-muted mb-1.5 uppercase tracking-wider">Event Title</label>
                                <input type="text" className="fillable-input w-full text-lg" value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="e.g. Seller Walkthrough" required autoFocus />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-muted mb-1.5 uppercase tracking-wider flex items-center gap-1.5"><Clock size={12} className="text-primary" /> Time</label>
                                    <input type="text" className="fillable-input w-full" value={eventTime} onChange={e => setEventTime(e.target.value)} placeholder="e.g. 2:00 PM" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-muted mb-1.5 uppercase tracking-wider flex items-center gap-1.5"><MapPin size={12} className="text-primary" /> Location</label>
                                    <input type="text" className="fillable-input w-full" value={eventLocation} onChange={e => setEventLocation(e.target.value)} placeholder="Address or Link" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-muted mb-1.5 uppercase tracking-wider flex items-center gap-1.5"><AlignLeft size={12} className="text-primary" /> Description / Notes</label>
                                <textarea className="fillable-input w-full min-h-[100px] resize-y" value={eventDesc} onChange={e => setEventDesc(e.target.value)} placeholder="Add any details, property access codes, or follow-up notes..."></textarea>
                            </div>

                            <div className="mt-2 pt-5 border-t border-[var(--border-light)] flex justify-between items-center">
                                {editingEvent ? (
                                    <button type="button" className="text-danger flex items-center gap-1.5 text-sm hover:underline font-medium p-2" onClick={() => handleDeleteEvent(editingEvent.id)}>
                                        <Trash2 size={16} /> Delete Event
                                    </button>
                                ) : <div></div>}

                                <div className="flex gap-3">
                                    <button type="button" className="btn btn-secondary font-medium" onClick={() => setIsEventModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary font-medium">{editingEvent ? 'Save Changes' : 'Schedule Event'}</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;
