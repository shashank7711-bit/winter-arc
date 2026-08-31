export interface DailyLog {
  date: string;
  wakeup: boolean;
  workout: boolean;
  outreach: boolean;
  reading: boolean;
  diet: boolean;
  notes: string;
  userId?: string;
}

export interface Settings {
  email: string;
  timezone: string; // e.g. "Asia/Kolkata"
  workoutReminderTime: string; // "05:00"
  workoutReminderOn: boolean;
  outreachReminderTime: string; // "18:55"
  outreachReminderOn: boolean;
  logReminderTime: string; // "21:45"
  logReminderOn: boolean;
}
