import React from 'react';
import { ServiceRequest, ServiceStatus, Employee } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, Users, Activity, AlertCircle } from 'lucide-react';

interface DashboardProps {
  requests: ServiceRequest[];
  employees: Employee[];
  vehicleFilter: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Dashboard: React.FC<DashboardProps> = ({ requests, employees, vehicleFilter }) => {
  // Filter Data based on Vehicle
  const filteredRequests = vehicleFilter === 'All Vehicles' 
    ? requests 
    : requests.filter(r => r.vehicle === vehicleFilter);

  const filteredEmployees = vehicleFilter === 'All Vehicles'
    ? employees
    : employees.filter(e => e.assignedVehicle === vehicleFilter);

  // Calculate stats
  const totalRevenue = filteredRequests
    .filter(r => r.status === ServiceStatus.COMPLETED)
    .reduce((sum, r) => sum + r.totalCost, 0);

  const pendingRequests = filteredRequests.filter(r => r.status !== ServiceStatus.COMPLETED && r.status !== ServiceStatus.CANCELLED).length;
  
  // Chart Data Preparation
  const revenueByMonth = filteredRequests.reduce((acc: any, curr) => {
    const month = new Date(curr.date).toLocaleString('default', { month: 'short' });
    const existing = acc.find((d: any) => d.name === month);
    if (existing) {
      existing.value += curr.totalCost;
    } else {
      acc.push({ name: month, value: curr.totalCost });
    }
    return acc;
  }, []);

  const serviceTypeDistribution = filteredRequests.reduce((acc: any, curr) => {
    const existing = acc.find((d: any) => d.name === curr.type);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: curr.type, value: 1 });
    }
    return acc;
  }, []);

  if (filteredRequests.length === 0 && vehicleFilter !== 'All Vehicles') {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-neutral-900 rounded-xl border border-dashed border-slate-300 dark:border-neutral-800">
        <AlertCircle size={48} className="text-slate-400 dark:text-neutral-600 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-neutral-200">No Data Found</h3>
        <p className="text-slate-500 dark:text-neutral-400">No service requests found for {vehicleFilter}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Cards */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-neutral-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">Revenue</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">₹{totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <DollarSign size={20} />
            </div>
          </div>
          <span className="text-xs text-slate-400 dark:text-neutral-500 font-medium mt-2 block">
             {vehicleFilter === 'All Vehicles' ? 'Total across all vehicles' : `For ${vehicleFilter}`}
          </span>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-neutral-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">Pending Jobs</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{pendingRequests}</h3>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
              <Activity size={20} />
            </div>
          </div>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-2 block">Action required</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-neutral-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">Assigned Staff</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{filteredEmployees.length}</h3>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
              <Users size={20} />
            </div>
          </div>
          <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium mt-2 block">Active crew</span>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-neutral-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">Efficiency</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">High</h3>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
              <TrendingUp size={20} />
            </div>
          </div>
          <span className="text-xs text-green-600 dark:text-green-400 font-medium mt-2 block">Based on completion rate</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-neutral-800">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Revenue Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--tw-prose-invert-bg)" className="opacity-10 dark:opacity-20" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)', 
                    color: '#fff',
                    borderRadius: '8px', 
                    border: '1px solid #333', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' 
                  }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-neutral-800">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Service Type Distribution</h3>
          {serviceTypeDistribution.length > 0 ? (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceTypeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {serviceTypeDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        color: '#fff',
                        borderRadius: '8px', 
                        border: '1px solid #333',
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                 {serviceTypeDistribution.map((entry: any, index: number) => (
                   <div key={index} className="flex items-center text-xs text-slate-600 dark:text-neutral-300">
                      <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length]}}></span>
                      {entry.name}
                   </div>
                 ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">
               No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};