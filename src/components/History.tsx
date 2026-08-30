import React, { useMemo, useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { fetchLogs } from '../lib/db';
import { DailyLog } from '../types';
import { CheckCircle2, XCircle } from 'lucide-react';

export function History() {
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchLogs().then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);
  
  const sortedLogs = useMemo(() => {
    return (Object.values(logs) as DailyLog[]).sort((a, b) => b.date.localeCompare(a.date));
  }, [logs]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col space-y-6 pb-24">
      <header className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-white uppercase">History</h1>
        <p className="text-zinc-400 font-medium">Your discipline timeline.</p>
      </header>

      <div className="space-y-4">
        {sortedLogs.length === 0 ? (
          <div className="text-center p-8 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            No days logged yet. Check in today to start your arc.
          </div>
        ) : (
          sortedLogs.map((log) => {
            const isSuccess = log.workoutDone && log.outreachDone;
            
            return (
              <div key={log.date} className="bg-zinc-900 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                  <span className="text-white font-bold text-lg">
                    {format(parseISO(log.date), 'EEE, MMM d, yyyy')}
                  </span>
                  {isSuccess ? (
                    <div className="flex items-center space-x-1 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Success</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-red-500 bg-red-950/50 px-2 py-1 rounded">
                      <XCircle className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Missed</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Workout</span>
                    <span className={log.workoutDone ? "text-yellow-500 font-bold" : "text-zinc-400"}>
                      {log.workoutDone ? log.workoutType : 'Skipped'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Outreach</span>
                    <span className={log.outreachDone ? "text-yellow-500 font-bold" : "text-zinc-400"}>
                      {log.outreachCount} sent
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Sleep</span>
                    <span className="text-white font-bold">{log.sleepHours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Streak</span>
                    <span className="text-white font-bold">{log.streak}</span>
                  </div>
                </div>

                {log.gratitudeNote && (
                  <div className="pt-3 border-t border-zinc-800">
                    <span className="block text-xs font-bold text-zinc-500 uppercase mb-1">Gratitude</span>
                    <span className="text-white text-sm italic">"{log.gratitudeNote}"</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
