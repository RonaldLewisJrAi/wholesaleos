import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Edit2, Trash2, MapPin, Clock, AlignLeft } from 'lucide-react';
import './CalendarView.css';

// Basic utility to get days in month
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();



const CalendarView = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);

    // Auto-load local storage
    useEffect(() => {
        const saved = localStorage.getItem('wholesale_os_calendar_events');
        if (saved) {
            setEvents(JSON.parse(saved));
        } else {
            setEvents([]);
        }
    }, []);

    // Save live data to local storage
    useEffect(() => {
        if (events.length > 0) {
            localStorage.setItem('wholesale_os_calendar_events', JSON.stringify(events));
        }
    }, [events]);

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
            grid.push(<div key={`empty-${i}`} className="calendar-cell is-empty"></div>);
        }

        // Actual days
        const today = new Date();
        const isCurrentMonthThisMonth = today.getMonth() === month && today.getFullYear() === year;

        for (let i = 1; i <= daysInMonth; i++) {
            const dayEvents = events.filter(e => e.date === i && e.month === month && e.year === year);
            const isToday = isCurrentMonthThisMonth && i === today.getDate();

            grid.push(
                <div key={i} className={`calendar-cell ${isToday ? 'is-today' : ''} ${(i + firstDay) % 7 === 0 ? 'no-right-border' : ''}`} onClick={() => openModal(i)}>
                    <div className={`date-badge ${isToday ? 'is-today' : ''}`}>{i}</div>
                    <div className="events-list custom-scrollbar">
                        {dayEvents.map(ev => (
                            <div key={ev.id} className="calendar-event" onClick={(e) => { e.stopPropagation(); openModal(i, ev); }}>
                                {ev.time && <span className="event-time">{ev.time}</span>}
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
                    </h1>
                    <p className="page-description">Manage walkthroughs, closings, notate details, and schedule follow-ups.</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => openModal(new Date().getDate())}>
                        <Plus size={16} /> New Appointment
                    </button>
                </div>
            </div>

            <div className="card shadow-xl p-0 overflow-hidden border-[var(--border-light)]">
                <div className="flex-between p-6 pb-4">
                    <div className="navigation-controls">
                        <button className="icon-btn-small border-control" onClick={prevMonth}><ChevronLeft size={20} /></button>
                        {monthNames[month]} {year}
                        <button className="icon-btn-small border-control" onClick={nextMonth}><ChevronRight size={20} /></button>
                    </div>
                    <div className="view-toggles">
                        <button className="toggle-btn active">Month</button>
                        <button className="toggle-btn disabled">Week</button>
                        <button className="toggle-btn disabled">Day</button>
                    </div>
                </div>

                <div className="calendar-grid-container" style={{ margin: '0 24px 24px 24px' }}>
                    {days.map(day => (
                        <div key={day} className="calendar-day-header">{day}</div>
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
