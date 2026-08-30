import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Circle } from 'lucide-react';
import { DailyLog } from '../types';
import { fetchLog, saveLogToDb, calculateCurrentStreak } from '../lib/db';
import { cn } from '../lib/utils';

export function CheckIn() {
  const [log, setLog] = useState<DailyLog | null>(null);
  const [saving, setSaving] = useState(false);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchLog(todayStr).then(setLog);
  }, [todayStr]);

  if (!log) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const updateLog = (updates: Partial<DailyLog>) => {
    setLog((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  };

  const handleWinChange = (index: number, value: string) => {
    const newWins = [...log.dailyWins];
    newWins[index] = value;
    updateLog({ dailyWins: newWins });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tempLog = { ...log };
      // Save it first so calculateCurrentStreak can read it
      await saveLogToDb(tempLog);
      
      const currentStreak = await calculateCurrentStreak(todayStr);
      tempLog.streak = currentStreak;
      
      await saveLogToDb(tempLog);
      setLog(tempLog);
      alert('Log saved for today!');
    } catch (err) {
      console.error(err);
      alert('Failed to save log');
    } finally {
      setSaving(false);
    }
  };

  const ToggleItem = ({ 
    label, 
    checked, 
    onChange 
  }: { 
    label: string, 
    checked: boolean, 
    onChange: (checked: boolean) => void 
  }) => (
    <div 
      className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl cursor-pointer"
      onClick={() => onChange(!checked)}
    >
      <span className="text-zinc-100 font-medium">{label}</span>
      {checked ? (
        <CheckCircle2 className="w-6 h-6 text-yellow-500" />
      ) : (
        <Circle className="w-6 h-6 text-zinc-500" />
      )}
    </div>
  );

  return (
    <div className="flex flex-col space-y-6 pb-24">
      <header className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-white uppercase">Daily Check-In</h1>
        <p className="text-zinc-400 font-medium">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </header>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex flex-col space-y-1">
        <span className="text-yellow-500 text-xs font-bold uppercase tracking-wider">Today's Workout Split</span>
        <span className="text-2xl font-black text-white">{log.workoutType}</span>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">The Essentials (Required for Streak)</h2>
        <ToggleItem label="Workout Completed" checked={log.workoutDone} onChange={(v) => updateLog({ workoutDone: v })} />
        <ToggleItem label="Outreach Completed" checked={log.outreachDone} onChange={(v) => updateLog({ outreachDone: v })} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Habits & Discipline</h2>
        <ToggleItem label="Water Only (No sugary drinks)" checked={log.waterOnly} onChange={(v) => updateLog({ waterOnly: v })} />
        <ToggleItem label="No Junk Food" checked={log.noJunkFood} onChange={(v) => updateLog({ noJunkFood: v })} />
        <ToggleItem label="No Phone During Meals" checked={log.noPhoneDuringMeals} onChange={(v) => updateLog({ noPhoneDuringMeals: v })} />
        <ToggleItem label="Hit 10k Steps" checked={log.stepsHit10k} onChange={(v) => updateLog({ stepsHit10k: v })} />
        <ToggleItem label="20 Min Outside" checked={log.outside20min} onChange={(v) => updateLog({ outside20min: v })} />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Metrics</h2>
        <div className="flex space-x-4">
          <div className="flex-1 bg-zinc-900 rounded-xl p-4 flex flex-col space-y-2">
            <label className="text-zinc-400 font-medium text-sm">Sleep Hours</label>
            <input 
              type="number" 
              value={log.sleepHours} 
              onChange={(e) => updateLog({ sleepHours: Number(e.target.value) })}
              className="bg-black text-white text-xl font-bold rounded-lg border border-zinc-800 p-2 focus:border-yellow-500 focus:outline-none w-full"
            />
          </div>
          <div className="flex-1 bg-zinc-900 rounded-xl p-4 flex flex-col space-y-2">
            <label className="text-zinc-400 font-medium text-sm">Outreach Count</label>
            <input 
              type="number" 
              value={log.outreachCount} 
              onChange={(e) => updateLog({ outreachCount: Number(e.target.value) })}
              className="bg-black text-white text-xl font-bold rounded-lg border border-zinc-800 p-2 focus:border-yellow-500 focus:outline-none w-full"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Reflections</h2>
        <div className="bg-zinc-900 rounded-xl p-4 flex flex-col space-y-2">
          <label className="text-zinc-400 font-medium text-sm">Gratitude Note</label>
          <input 
            type="text" 
            placeholder="One thing I'm grateful for..."
            value={log.gratitudeNote} 
            onChange={(e) => updateLog({ gratitudeNote: e.target.value })}
            className="bg-black text-white rounded-lg border border-zinc-800 p-3 focus:border-yellow-500 focus:outline-none w-full"
          />
        </div>
        
        <div className="bg-zinc-900 rounded-xl p-4 flex flex-col space-y-3">
          <label className="text-zinc-400 font-medium text-sm">Daily Wins (Up to 5)</label>
          {log.dailyWins.map((win, idx) => (
            <input 
              key={idx}
              type="text" 
              placeholder={`Win #${idx + 1}`}
              value={win} 
              onChange={(e) => handleWinChange(idx, e.target.value)}
              className="bg-black text-white text-sm rounded-lg border border-zinc-800 p-3 focus:border-yellow-500 focus:outline-none w-full"
            />
          ))}
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-widest text-lg p-5 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.2)] transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Log & Update Streak'}
      </button>
    </div>
  );
}
