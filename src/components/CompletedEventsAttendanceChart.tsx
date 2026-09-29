import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  Users, 
  UserCheck, 
  UserX, 
  Award, 
  TrendingUp, 
  CalendarCheck, 
  ArrowUpRight, 
  Filter,
  Download,
  RefreshCw,
  Info
} from 'lucide-react';
import { Club, UniversityEvent, User } from '../types.js';

export interface EventAttendanceMetric {
  eventId: string;
  title: string;
  shortTitle: string;
  clubId: string;
  clubName: string;
  category: string;
  startDate: string;
  startTime: string;
  venue: string;
  status: string;
  present: number;
  absent: number;
  unmarked: number;
  totalRegistered: number;
  attendanceRate: number;
  certificatesIssued: number;
  capacity: number;
}

interface CompletedEventsAttendanceChartProps {
  events: UniversityEvent[];
  currentUser?: User | null;
  clubs?: Club[];
  onSelectEventForAttendance?: (event: UniversityEvent) => void;
  onRefreshData?: () => void;
}

type ChartViewMode = 'grouped' | 'stacked' | 'rate';

export const CompletedEventsAttendanceChart: React.FC<CompletedEventsAttendanceChartProps> = ({
  events,
  currentUser,
  clubs = [],
  onSelectEventForAttendance,
  onRefreshData
}) => {
  const [analyticsData, setAnalyticsData] = useState<EventAttendanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setChartViewMode] = useState<ChartViewMode>('grouped');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<'completed_only' | 'all_with_records'>('completed_only');
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  // Fetch or calculate real-time attendance analytics
  const fetchAttendanceAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/attendance');
      const data = await res.json();
      if (data.success && Array.isArray(data.analytics)) {
        setAnalyticsData(data.analytics.map((item: any) => ({
          ...item,
          shortTitle: item.title.length > 22 ? `${item.title.substring(0, 20)}...` : item.title
        })));
      }
    } catch (err) {
      console.error('Failed to load attendance analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceAnalytics();
  }, [events]);

  // Filter based on user's club (if organizer), status (completed), and category
  const filteredMetrics = useMemo(() => {
    let list = analyticsData;

    // Filter by organizer club if restricted
    if (currentUser?.clubId) {
      list = list.filter(item => item.clubId === currentUser.clubId);
    }

    // Filter by scope: completed events only (default) vs all events with marked attendance
    if (scopeFilter === 'completed_only') {
      list = list.filter(item => item.status === 'completed');
    } else {
      // Show events that either are completed or have at least 1 attendance marked
      list = list.filter(item => item.status === 'completed' || (item.present + item.absent) > 0);
    }

    // Filter by Category
    if (selectedCategory !== 'all') {
      list = list.filter(item => item.category === selectedCategory);
    }

    return list;
  }, [analyticsData, currentUser, scopeFilter, selectedCategory]);

  // Aggregate high-level totals
  const totalPresent = useMemo(() => filteredMetrics.reduce((sum, item) => sum + item.present, 0), [filteredMetrics]);
  const totalAbsent = useMemo(() => filteredMetrics.reduce((sum, item) => sum + item.absent, 0), [filteredMetrics]);
  const totalTracked = totalPresent + totalAbsent;
  const overallRate = totalTracked > 0 ? Math.round((totalPresent / totalTracked) * 100) : 0;
  const totalCertificates = useMemo(() => filteredMetrics.reduce((sum, item) => sum + item.certificatesIssued, 0), [filteredMetrics]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredMetrics.length === 0) return;
    const headers = ['Event Title', 'Club', 'Category', 'Date', 'Venue', 'Present', 'Absent', 'Total Tracked', 'Attendance Rate (%)', 'Certificates Issued'];
    const rows = filteredMetrics.map(m => [
      `"${m.title.replace(/"/g, '""')}"`,
      `"${m.clubName.replace(/"/g, '""')}"`,
      `"${m.category}"`,
      `"${m.startDate}"`,
      `"${m.venue.replace(/"/g, '""')}"`,
      m.present,
      m.absent,
      m.present + m.absent,
      `${m.attendanceRate}%`,
      m.certificatesIssued
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: EventAttendanceMetric = payload[0].payload;
      const total = data.present + data.absent;
      const rate = total > 0 ? Math.round((data.present / total) * 100) : 0;

      return (
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl max-w-xs text-xs space-y-2 z-50">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              {data.category} · {data.clubName}
            </span>
            <h4 className="font-heading font-bold text-slate-900 text-sm leading-snug mt-0.5">
              {data.title}
            </h4>
            <div className="text-[11px] text-slate-500 mt-1">
              {data.startDate} · {data.venue}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                <span>Present</span>
              </div>
              <div className="text-base font-extrabold text-emerald-900 mt-0.5">
                {data.present}
                <span className="text-[10px] font-normal text-emerald-700 ml-1">
                  ({rate}%)
                </span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
              <div className="text-[10px] font-semibold text-rose-700 flex items-center gap-1">
                <UserX className="w-3 h-3" />
                <span>Absent</span>
              </div>
              <div className="text-base font-extrabold text-rose-900 mt-0.5">
                {data.absent}
                <span className="text-[10px] font-normal text-rose-700 ml-1">
                  ({total > 0 ? 100 - rate : 0}%)
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Participation Certificates:</span>
            <span className="font-bold text-amber-700 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>{data.certificatesIssued} issued</span>
            </span>
          </div>

          {onSelectEventForAttendance && (
            <div className="pt-1 text-[10px] text-indigo-600 font-semibold text-center flex items-center justify-center gap-1">
              <span>Click bar to open attendance desk</span>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (entry: any) => {
    if (!onSelectEventForAttendance) return;
    const matched = events.find(e => e.id === entry.eventId);
    if (matched) {
      onSelectEventForAttendance(matched);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-5 sm:p-7 space-y-6">
      
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <BarChart3 className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Attendance Visualizer
            </span>
            {currentUser?.clubName && (
              <span className="text-xs text-slate-400">· {currentUser.clubName}</span>
            )}
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Completed Events Attendance Breakdown
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Comparative analysis of verified present vs. absent students across past campus events.
          </p>
        </div>

        {/* View Switcher & Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Chart Display Mode Segmented Control */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setChartViewMode('grouped')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'grouped' 
                  ? 'bg-white text-slate-900 shadow-xs font-bold' 
                  : 'hover:text-slate-900'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setChartViewMode('stacked')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'stacked' 
                  ? 'bg-white text-slate-900 shadow-xs font-bold' 
                  : 'hover:text-slate-900'
              }`}
            >
              Stacked Total
            </button>
            <button
              onClick={() => setChartViewMode('rate')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'rate' 
                  ? 'bg-white text-slate-900 shadow-xs font-bold' 
                  : 'hover:text-slate-900'
              }`}
            >
              Turnout %
            </button>
          </div>

          {/* Scope Selector */}
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="completed_only">Completed Events ({analyticsData.filter(e => e.status === 'completed').length})</option>
            <option value="all_with_records">All Events with Records</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="Workshop">Workshops</option>
            <option value="Hackathon">Hackathons</option>
            <option value="Academic">Academic</option>
            <option value="Seminar">Seminars</option>
            <option value="Cultural">Cultural</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            disabled={filteredMetrics.length === 0}
            title="Export Attendance Data to CSV"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Refresh */}
          <button
            onClick={fetchAttendanceAnalytics}
            title="Refresh Attendance Analytics"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Aggregate KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100/90 transition-all hover:border-emerald-200">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-xs font-bold uppercase tracking-wider">Total Present</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-emerald-950 mt-1.5">
            {totalPresent}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            Verified campus attendees
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100/90 transition-all hover:border-rose-200">
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-xs font-bold uppercase tracking-wider">Total Absent</span>
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-rose-950 mt-1.5">
            {totalAbsent}
          </div>
          <div className="text-[11px] text-rose-700 font-medium mt-0.5">
            Registered no-shows
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100/90 transition-all hover:border-indigo-200">
          <div className="flex items-center justify-between text-indigo-800">
            <span className="text-xs font-bold uppercase tracking-wider">Avg. Turnout</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-indigo-950 mt-1.5">
            {overallRate}%
          </div>
          <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
            Attendance success rate
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100/90 transition-all hover:border-amber-200">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-xs font-bold uppercase tracking-wider">Certificates Awarded</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-amber-950 mt-1.5">
            {totalCertificates}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">
            Earned by verified attendees
          </div>
        </div>
      </div>

      {/* Recharts Bar Visualization */}
      <div className="pt-2">
        {loading ? (
          <div className="h-72 flex flex-col items-center justify-center text-slate-400 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs font-medium">Aggregating event attendance records...</span>
          </div>
        ) : filteredMetrics.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl">
            <CalendarCheck className="w-10 h-10 text-slate-300 mb-2" />
            <h3 className="font-heading font-bold text-slate-800 text-sm">
              No Completed Events Found
            </h3>
            <p className="text-slate-500 text-xs max-w-sm mt-1">
              Events marked as completed or with recorded attendance will automatically appear here with their Present vs. Absent headcount breakdown.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setScopeFilter('all_with_records')}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
              >
                View All Events with Records
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <div className="h-80 sm:h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {viewMode === 'rate' ? (
                  // Turnout Percentage Rate Chart
                  <BarChart
                    data={filteredMetrics}
                    margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                    onClick={(state: any) => {
                      if (state && (state as any).activePayload && (state as any).activePayload[0]) {
                        handleBarClick((state as any).activePayload[0].payload);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="shortTitle"
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={70}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(val) => `${val}%`}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      align="right" 
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
                    />
                    <Bar
                      dataKey="attendanceRate"
                      name="Turnout Rate (%)"
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={45}
                      cursor="pointer"
                    >
                      {filteredMetrics.map((_, index) => (
                        <Cell 
                          key={`cell-rate-${index}`} 
                          fill={activeBarIndex === index ? '#4f46e5' : '#6366f1'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  // Present vs Absent Grouped or Stacked Bar Chart
                  <BarChart
                    data={filteredMetrics}
                    margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                    onClick={(state: any) => {
                      if (state && (state as any).activePayload && (state as any).activePayload[0]) {
                        handleBarClick((state as any).activePayload[0].payload);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="shortTitle"
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={70}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="top" 
                      align="right" 
                      iconType="circle"
                      wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
                    />
                    <Bar
                      dataKey="present"
                      name="Present Students"
                      fill="#10b981"
                      stackId={viewMode === 'stacked' ? 'attendanceStack' : undefined}
                      radius={viewMode === 'stacked' ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                      maxBarSize={40}
                      cursor="pointer"
                    />
                    <Bar
                      dataKey="absent"
                      name="Absent Students"
                      fill="#f43f5e"
                      stackId={viewMode === 'stacked' ? 'attendanceStack' : undefined}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                      cursor="pointer"
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Chart Legend & Interactive Callout */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-700">Present (Verified)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-500 shrink-0" />
                  <span className="font-semibold text-slate-700">Absent</span>
                </span>
                {viewMode === 'rate' && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-indigo-500 shrink-0" />
                    <span className="font-semibold text-slate-700">Turnout %</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Info className="w-3.5 h-3.5" />
                <span>Tip: Click any bar to open that event's live attendance & certificate desk.</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
