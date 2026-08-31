import React, { useState, useEffect } from 'react';
import { fetchSettings, saveSettingsToDb, defaultSettings, fetchLogs } from '../lib/db';
import { Settings as SettingsType } from '../types';
import { Bell, Info, Download } from 'lucide-react';

export function Settings() {
  const [settings, setSettings] = useState<SettingsType>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings().then(data => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const updateSetting = (updates: Partial<SettingsType>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettingsToDb(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (c: boolean) => void }) => (
    <div 
      className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${checked ? 'bg-yellow-500' : 'bg-zinc-700'}`}
      onClick={() => onChange(!checked)}
    >
      <div className={`w-4 h-4 rounded-full bg-black transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
  );

  const handleDownloadCSV = async () => {
    try {
      const logsMap = await fetchLogs();
      const logs = Object.values(logsMap).sort((a, b) => a.date.localeCompare(b.date));
      
      if (logs.length === 0) {
        alert("No history to download.");
        return;
      }

      const escapeCSV = (str: any) => {
        if (str === null || str === undefined) return '""';
        const stringified = String(str);
        if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
          return `"${stringified.replace(/"/g, '""')}"`;
        }
        return stringified;
      };

      const headers = [
        "Date", "Workout", "Workout Type", "Outreach", "Outreach Count", "Water Only", "No Junk Food", "Sleep Hours", "No Phone During Meals", "Hit 10k Steps", "Outside 20 Min", "Gratitude Note", "Daily Wins"
      ];
      
      const csvRows = [];
      csvRows.push(headers.join(','));

      logs.forEach(log => {
        csvRows.push([
          log.date,
          log.workoutDone ? "Yes" : "No",
          escapeCSV(log.workoutType),
          log.outreachDone ? "Yes" : "No",
          log.outreachCount,
          log.waterOnly ? "Yes" : "No",
          log.noJunkFood ? "Yes" : "No",
          log.sleepHours,
          log.noPhoneDuringMeals ? "Yes" : "No",
          log.stepsHit10k ? "Yes" : "No",
          log.outside20min ? "Yes" : "No",
          escapeCSV(log.gratitudeNote),
          escapeCSV(log.dailyWins ? log.dailyWins.join('; ') : '')
        ].join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `winter-arc-history-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download CSV:", err);
      alert("Failed to download history.");
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col space-y-6 pb-24">
      <header className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-white uppercase">Settings</h1>
      </header>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex space-x-3 items-start">
        <Info className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <p className="text-yellow-500/90 text-sm">
          <strong>Notice:</strong> Settings are synced to Firestore securely. Reminders will be sent via Cloud Functions according to these times.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Profile</h2>
        
        <div className="bg-zinc-900 rounded-xl p-4 space-y-4">
          <div className="flex flex-col space-y-2">
            <label className="text-zinc-400 font-medium text-sm">Email Address</label>
            <input 
              type="email" 
              value={settings.email}
              onChange={e => updateSetting({ email: e.target.value })}
              className="bg-black text-white rounded-lg border border-zinc-800 p-3 focus:border-yellow-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="text-zinc-400 font-medium text-sm">Timezone</label>
            <input 
              type="text" 
              value={settings.timezone}
              onChange={e => updateSetting({ timezone: e.target.value })}
              className="bg-black text-white rounded-lg border border-zinc-800 p-3 focus:border-yellow-500 focus:outline-none"
              placeholder="e.g. Asia/Kolkata"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center space-x-2">
          <Bell className="w-4 h-4" />
          <span>Reminders</span>
        </h2>
        
        <div className="bg-zinc-900 rounded-xl p-4 space-y-5">
          {/* Workout Reminder */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-1">
              <span className="text-white font-medium">Workout Block</span>
              <input 
                type="time" 
                value={settings.workoutReminderTime}
                onChange={e => updateSetting({ workoutReminderTime: e.target.value })}
                className="bg-black text-white text-sm rounded px-2 py-1 border border-zinc-800 focus:border-yellow-500 focus:outline-none w-24"
              />
            </div>
            <Toggle checked={settings.workoutReminderOn} onChange={v => updateSetting({ workoutReminderOn: v })} />
          </div>

          {/* Outreach Reminder */}
          <div className="flex items-center justify-between border-t border-zinc-800 pt-5">
            <div className="flex flex-col space-y-1">
              <span className="text-white font-medium">Outreach Block</span>
              <input 
                type="time" 
                value={settings.outreachReminderTime}
                onChange={e => updateSetting({ outreachReminderTime: e.target.value })}
                className="bg-black text-white text-sm rounded px-2 py-1 border border-zinc-800 focus:border-yellow-500 focus:outline-none w-24"
              />
            </div>
            <Toggle checked={settings.outreachReminderOn} onChange={v => updateSetting({ outreachReminderOn: v })} />
          </div>

          {/* Log Reminder */}
          <div className="flex items-center justify-between border-t border-zinc-800 pt-5">
            <div className="flex flex-col space-y-1">
              <span className="text-white font-medium">Daily Log Block</span>
              <input 
                type="time" 
                value={settings.logReminderTime}
                onChange={e => updateSetting({ logReminderTime: e.target.value })}
                className="bg-black text-white text-sm rounded px-2 py-1 border border-zinc-800 focus:border-yellow-500 focus:outline-none w-24"
              />
            </div>
            <Toggle checked={settings.logReminderOn} onChange={v => updateSetting({ logReminderOn: v })} />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-widest p-4 rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>

        <button 
          onClick={handleDownloadCSV}
          className="w-full bg-black hover:bg-zinc-900 border border-zinc-800 text-yellow-500 font-bold tracking-widest p-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>Download History (CSV)</span>
        </button>
      </div>
    </div>
  );
}
