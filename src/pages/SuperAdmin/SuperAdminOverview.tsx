import React, { useState } from 'react';
import { ShieldAlert, Users, CreditCard, Activity, TrendingUp, DollarSign } from 'lucide-react';

interface AnalyticsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
    caption: string;
}

const AnalyticsCard = ({ title, value, icon, trend, trendUp, caption }: AnalyticsCardProps) => (
    <div className="bg-[#131B2C] border border-gray-800 rounded-xl p-5 shadow-xl">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
                <div className="text-2xl font-bold text-white mt-1">{value}</div>
            </div>
            <div className="p-2 bg-[#0B0F19] rounded-lg border border-gray-800">
                {icon}
            </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
            {trend && <span className={trendUp ? "text-green-400 font-bold" : "text-red-400 font-bold"}>{trend}</span>}
            <span className="text-gray-500">{caption}</span>
        </div>
    </div>
);

export const SuperAdminOverview = () => {
    // Mock Global Metrics
    const [metrics] = useState({
        totalUsers: 1420,
        investors: 850,
        wholesalers: 570,
        dealsListed: 342,
        dealsClaimed: 89,
        dealsClosed: 42,
        revenue: '$14,250'
    });

    return (
        <div className="admin-dashboard animate-fade-in py-6 px-8 max-w-7xl mx-auto">
            <div className="admin-header mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
                        <ShieldAlert className="text-red-500" size={32} />
                        Global Platform Overview
                    </h1>
                    <p className="text-gray-400 mt-2">Executive telemetry and global SaaS metrics.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <AnalyticsCard
                    title="Platform Revenue"
                    value={metrics.revenue}
                    icon={<DollarSign size={20} className="text-green-400" />}
                    trend="+12%"
                    trendUp={true}
                    caption="Current MRR"
                />
                <AnalyticsCard
                    title="Total Active Users"
                    value={metrics.totalUsers}
                    icon={<Users size={20} className="text-blue-400" />}
                    trend="+5%"
                    trendUp={true}
                    caption="Across all personas"
                />
                <AnalyticsCard
                    title="Investors / Buyers"
                    value={metrics.investors}
                    icon={<TrendingUp size={20} className="text-purple-400" />}
                    caption="Registered liquidity"
                />
                <AnalyticsCard
                    title="Deal Suppliers"
                    value={metrics.wholesalers}
                    icon={<Activity size={20} className="text-orange-400" />}
                    caption="Active wholesalers"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#131B2C] border border-gray-800 rounded-xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4">Total Deals Listed</h3>
                    <div className="text-4xl font-bold text-blue-400">{metrics.dealsListed}</div>
                    <div className="text-sm text-gray-500 mt-2">Running total across all orgs</div>
                </div>
                <div className="bg-[#131B2C] border border-gray-800 rounded-xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4">Deals Claimed / Escrow</h3>
                    <div className="text-4xl font-bold text-yellow-500">{metrics.dealsClaimed}</div>
                    <div className="text-sm text-gray-500 mt-2">Currently locked by buyers</div>
                </div>
                <div className="bg-[#131B2C] border border-gray-800 rounded-xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-4">Deals Closed</h3>
                    <div className="text-4xl font-bold text-green-500">{metrics.dealsClosed}</div>
                    <div className="text-sm text-gray-500 mt-2">Fully verified & transacted</div>
                </div>
            </div>
        </div>
    );
};
