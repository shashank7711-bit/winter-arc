export interface DailyLog {
  date: string; // "YYYY-MM-DD"
  workoutDone: boolean;
  workoutType: string;
  outreachDone: boolean;
  outreachCount: number;
  waterOnly: boolean;
  noJunkFood: boolean;
  sleepHours: number;
  noPhoneDuringMeals: boolean;
  stepsHit10k: boolean;
  outside20min: boolean;
  gratitudeNote: string;
  dailyWins: string[]; // up to 5 entries
  streak: number;
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
