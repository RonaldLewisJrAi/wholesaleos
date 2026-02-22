import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Edit2, Trash2, MapPin, Clock, AlignLeft } from 'lucide-react';

// Basic utility to get days in month
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const mockEvents = [
    { id: 1, date: 15, title: 'Seller Walkthrough', time: '10:00 AM', location: '123 Main St', description: 'Initial walkthrough and condition check.' },
    { id: 2, date: 18, title: 'Title Company Closing', time: '2:30 PM', location: 'Texas Title Co.', description: 'Sign closing docs for the Smith parcel.' },
    { id: 3, date: 22, title: 'Buyer Showing', time: '4:00 PM', location: '456 Oak Ave', description: 'Showing the property to prospective cash buyers.' }
];

const CalendarView = () => {
    const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); // Defaulting to Feb 2026 for prototype
    const [events, setEvents] = useState(mockEvents);
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
            grid.push(<div key={`empty-${i}`} className="min-h-[100px] border border-[var(--border-light)] bg-[rgba(255,255,255,0.02)] p-2"></div>);
        }

        // Actual days
        for (let i = 1; i <= daysInMonth; i++) {
            const dayEvents = events.filter(e => e.date === i);
            const isToday = i === 21 && month === 1 && year === 2026; // Hardcode "today" for prototype feel

            grid.push(
                <div key={i} className={`min-h-[120px] border border-[var(--border-light)] p-2 transition-colors hover:bg-[rgba(255,255,255,0.05)] cursor-pointer ${isToday ? 'bg-[rgba(var(--primary-color-rgb),0.1)]' : ''}`} onClick={() => openModal(i)}>
                    <div className="flex justify-between items-start mb-2">
                        <span className={`font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white' : 'text-muted'}`}>{i}</span>
                        {/* Hidden plus icon that shows on hover might be nice, but keeping simple */}
                    </div>
                    <div className="flex flex-col gap-1">
                        {dayEvents.map(ev => (
                            <div key={ev.id} className="text-xs bg-[var(--accent-primary)] text-white px-2 py-1 rounded truncate shadow-sm cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => { e.stopPropagation(); openModal(i, ev); }}>
                                {ev.time} - {ev.title}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return grid;
    };

    return (
        <div className="calendar-container animate-fade-in" style={{ padding: '24px' }}>
            <div className="page-header flex-between mb-6">
                <div>
                    <h1 className="page-title flex items-center gap-2">
                        <CalendarIcon className="text-primary" size={28} /> Schedule
                    </h1>
                    <p className="page-description">Manage walkthroughs, closings, and followups.</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => openModal(21)}>
                        <Plus size={16} /> New Appointment
                    </button>
                </div>
            </div>

            <div className="glass-panel p-6">
                <div className="flex-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-4">
                        <button className="icon-btn" onClick={prevMonth}><ChevronLeft /></button>
                        {monthNames[month]} {year}
                        <button className="icon-btn" onClick={nextMonth}><ChevronRight /></button>
                    </h2>
                    <div className="flex gap-2">
                        <span className="badge bg-primary text-white">Month</span>
                        <span className="badge">Week</span>
                        <span className="badge">Day</span>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-0">
                    {days.map(day => (
                        <div key={day} className="text-center font-bold text-muted py-2 uppercase text-xs tracking-wider border-b border-[var(--border-light)]">{day}</div>
                    ))}
                    {renderCalendarDays()}
                </div>
            </div>

            {isEventModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="modal-content glass-panel animate-fade-in" style={{ maxWidth: '500px', width: '90%', padding: '24px', position: 'relative' }}>
                        <div className="flex-between mb-4 pb-4 border-b border-[var(--border-light)]">
                            <h2 className="text-xl font-bold flex items-center gap-2">{editingEvent ? 'Edit Appointment' : 'New Appointment'}</h2>
                            <button className="icon-btn-small" onClick={() => setIsEventModalOpen(false)}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSaveEvent} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs text-muted mb-1">Date</label>
                                <div className="p-2 bg-[rgba(0,0,0,0.2)] rounded font-semibold text-sm">
                                    {monthNames[month]} {selectedDate}, {year}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-muted mb-1">Event Title</label>
                                <input type="text" className="fillable-input w-full" value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="e.g. Seller Walkthrough" required />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs text-muted mb-1 flex items-center gap-1"><Clock size={12} /> Time</label>
                                    <input type="text" className="fillable-input w-full" value={eventTime} onChange={e => setEventTime(e.target.value)} placeholder="e.g. 2:00 PM" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs text-muted mb-1 flex items-center gap-1"><MapPin size={12} /> Location</label>
                                    <input type="text" className="fillable-input w-full" value={eventLocation} onChange={e => setEventLocation(e.target.value)} placeholder="Address or Link" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-muted mb-1 flex items-center gap-1"><AlignLeft size={12} /> Description / Notes</label>
                                <textarea className="fillable-input w-full" rows="3" value={eventDesc} onChange={e => setEventDesc(e.target.value)} placeholder="Add any details..."></textarea>
                            </div>

                            <div className="mt-4 pt-4 border-t border-[var(--border-light)] flex justify-between">
                                {editingEvent ? (
                                    <button type="button" className="btn btn-secondary text-danger border-danger" onClick={() => handleDeleteEvent(editingEvent.id)}>
                                        <Trash2 size={16} /> Delete
                                    </button>
                                ) : <div></div>}

                                <div className="flex gap-2">
                                    <button type="button" className="btn btn-secondary" onClick={() => setIsEventModalOpen(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Event</button>
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
