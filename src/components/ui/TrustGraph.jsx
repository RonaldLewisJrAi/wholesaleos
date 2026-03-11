import React from 'react';
import { Shield, Users, Building, ArrowRight, GraduationCap, Award } from 'lucide-react';

export default function TrustGraph({ score = 85, closings = 12 }) {
    // Generate some mock nodes for the graph
    const nodes = [
        { id: 1, type: 'WHOLESALER', trust: 90, academy_status: 'CERTIFIED', x: 20, y: 30 },
        { id: 2, type: 'INVESTOR', trust: 85, x: 80, y: 20 },
        { id: 3, type: 'TITLE_COMPANY', trust: 99, x: 50, y: 80 },
        { id: 4, type: 'INVESTOR', trust: 75, x: 15, y: 80 },
        { id: 5, type: 'WHOLESALER', trust: 88, academy_status: 'GRADUATE', x: 85, y: 70 },
    ];

    return (
        <div className="bg-[#050816] border border-blue-900/50 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-900/10 mix-blend-screen pointer-events-none group-hover:bg-blue-900/20 transition-all"></div>

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                        <Users className="text-blue-400" size={18} /> Title Trust Network
                    </h3>
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Verified Participants</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-emerald-400">{score}</div>
                    <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Platform Trust</div>
                </div>
            </div>

            <div className="h-48 relative border border-blue-900/30 rounded-lg bg-black/40 mb-4 overflow-hidden mask-fade-edges">
                {/* Connections */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line x1="20%" y1="30%" x2="50%" y2="80%" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
                    <line x1="80%" y1="20%" x2="50%" y2="80%" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <line x1="15%" y1="80%" x2="50%" y2="80%" stroke="rgba(78, 123, 255, 0.2)" strokeWidth="1" />
                    <line x1="85%" y1="70%" x2="50%" y2="80%" stroke="rgba(78, 123, 255, 0.2)" strokeWidth="1" />
                    <line x1="20%" y1="30%" x2="80%" y2="20%" stroke="rgba(78, 123, 255, 0.1)" strokeWidth="1" />
                </svg>

                {/* Nodes */}
                {nodes.map(node => (
                    <div
                        key={node.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group/node cursor-crosshair"
                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover/node:scale-125 z-10 relative ${node.type === 'TITLE_COMPANY' ? 'bg-emerald-900 border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' :
                            node.type === 'INVESTOR' ? 'bg-blue-900/80 border border-blue-500' :
                                'bg-amber-900/80 border border-amber-500'
                            }`}>
                            {node.type === 'TITLE_COMPANY' && <Building size={14} className="text-emerald-400" />}
                            {node.type === 'INVESTOR' && <Users size={14} className="text-blue-400" />}
                            {node.type === 'WHOLESALER' && <Users size={14} className="text-amber-400" />}

                            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover/node:opacity-100 transition-opacity bg-black border border-blue-500/50 rounded px-2 py-1 flex items-center gap-2 whitespace-nowrap z-50 pointer-events-none">
                                <span className="text-[9px] font-mono text-gray-300">{node.type}</span>
                                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1"><Shield size={10} /> {node.trust}</span>
                                {node.academy_status && (
                                    <span className={`text-[10px] font-bold flex items-center gap-1 ${node.academy_status === 'CERTIFIED' ? 'text-emerald-400' : 'text-blue-400'}`}>
                                        {node.academy_status === 'CERTIFIED' ? <Award size={10} /> : <GraduationCap size={10} />}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Central Pulse */}
                <div className="absolute top-[80%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-emerald-500/10 rounded-full animate-ping pointer-events-none"></div>
            </div>

            <div className="flex justify-between items-center bg-blue-900/10 border border-blue-500/20 rounded p-3">
                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Shield size={12} className="text-blue-400" />
                    Verified by Tri-Party Protocol
                </div>
                <button className="text-[10px] text-blue-400 hover:text-white font-mono uppercase tracking-widest flex items-center gap-1 transition-colors">
                    {closings} Ledgers <ArrowRight size={10} />
                </button>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .mask-fade-edges {
                    mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
                    -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
                }
            `}} />
        </div>
    );
}
