import React, { useMemo, useState, useEffect } from 'react';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchLogs, calculateCurrentStreak } from '../lib/db';
import { DailyLog } from '../types';

export function Dashboard() {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    Promise.all([
      fetchLogs(),
      calculateCurrentStreak(todayStr)
    ]).then(([fetchedLogs, streak]) => {
      setLogs(fetchedLogs);
      setCurrentStreak(streak);
      setLoading(false);
    });
  }, [todayStr]);

  const { thisWeekLogs, weekDays } = useMemo(() => {
    const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(today, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    
    return {
      weekDays: days,
      thisWeekLogs: days.map(d => {
        const dStr = format(d, 'yyyy-MM-dd');
        return {
          date: d,
          dateStr: dStr,
          log: logs[dStr]
        };
      })
    };
  }, [logs, todayStr]);

  const monthlyCompletion = useMemo(() => {
    const allDates = Object.keys(logs);
    const thisMonthLogs = allDates.filter(d => isSameMonth(new Date(d), today));
    if (thisMonthLogs.length === 0) return 0;
    
    const completedDays = thisMonthLogs.filter(d => logs[d].workoutDone && logs[d].outreachDone).length;
    return Math.round((completedDays / thisMonthLogs.length) * 100);
  }, [logs]);

  const chartData = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = subDays(today, 13 - i);
      const dStr = format(d, 'yyyy-MM-dd');
      const log = logs[dStr];
      return {
        name: format(d, 'MMM d'),
        outreach: log?.outreachCount || 0,
        workout: log?.workoutDone ? 1 : 0
      };
    });
  }, [logs, todayStr]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col space-y-8 pb-24">

      <header className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-white uppercase">Dashboard</h1>
      </header>

      {/* Streak Counter */}
      <div className="flex flex-col items-center justify-center bg-yellow-500 rounded-3xl p-8 shadow-[0_0_40px_rgba(234,179,8,0.3)]">
        <span className="text-black font-bold uppercase tracking-widest text-sm mb-2">Current Streak</span>
        <span className="text-black text-8xl font-black leading-none">{currentStreak}</span>
        <span className="text-black/70 font-bold uppercase tracking-widest text-xs mt-2">Days of Discipline</span>
      </div>

      {/* Weekly Heatmap */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">This Week</h2>
        <div className="bg-zinc-900 rounded-xl p-4 flex justify-between items-center">
          {thisWeekLogs.map((dayData, i) => {
            const isToday = dayData.dateStr === todayStr;
            const isSuccess = dayData.log?.workoutDone && dayData.log?.outreachDone;
            const isLogged = !!dayData.log && dayData.date <= today;

            let bgClass = "bg-zinc-800";
            if (isLogged && isSuccess) bgClass = "bg-yellow-500";
            else if (isLogged && !isSuccess) bgClass = "bg-red-950 border border-red-900";

            return (
              <div key={i} className="flex flex-col items-center space-y-2">
                <span className={`text-xs font-bold ${isToday ? 'text-white' : 'text-zinc-500'}`}>
                  {format(dayData.date, 'EEEEE')}
                </span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgClass} ${isToday && !isLogged ? 'ring-2 ring-yellow-500/50' : ''}`}>
                  {isSuccess && <span className="text-black text-lg font-bold">✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 rounded-xl p-4 flex flex-col space-y-1">
          <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Monthly Consistency</span>
          <span className="text-3xl font-black text-white">{monthlyCompletion}%</span>
        </div>
        <div className="bg-zinc-900 rounded-xl p-4 flex flex-col space-y-1">
          <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Total Logs</span>
          <span className="text-3xl font-black text-white">{Object.keys(logs).length}</span>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Outreach Trend (Last 14 Days)</h2>
        <div className="bg-zinc-900 rounded-xl p-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                itemStyle={{ color: '#eab308' }}
              />
              <Line type="monotone" dataKey="outreach" stroke="#eab308" strokeWidth={3} dot={{ r: 4, fill: '#eab308', strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
