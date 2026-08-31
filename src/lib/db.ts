import { doc, getDoc, setDoc, collection, getDocs, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { DailyLog, Settings } from '../types';
import { format, subDays } from 'date-fns';

const PERSONAL_USER_ID = 'personal-user';

const withTimeout = <T>(promise: Promise<T>, ms: number = 2500): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Firestore request timed out')), ms))
  ]);
};

export const defaultSettings: Settings = {
  email: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
  workoutReminderTime: '05:00',
  workoutReminderOn: true,
  outreachReminderTime: '18:55',
  outreachReminderOn: true,
  logReminderTime: '21:45',
  logReminderOn: true,
};

export function getWorkoutType(date: Date): string {
  const day = date.getDay();
  switch (day) {
    case 1:
    case 5: return 'Push';
    case 2:
    case 6: return 'Pull';
    case 3: return 'Legs';
    case 4: return 'Skill';
    case 0:
    default: return 'Run/Rest';
  }
}

export const getEmptyLog = (dateStr: string): DailyLog => {
  const dateObj = new Date(dateStr + 'T00:00:00');
  return {
    date: dateStr,
    workoutDone: false,
    workoutType: getWorkoutType(dateObj),
    outreachDone: false,
    outreachCount: 0,
    waterOnly: false,
    noJunkFood: false,
    sleepHours: 7,
    noPhoneDuringMeals: false,
    stepsHit10k: false,
    outside20min: false,
    gratitudeNote: '',
    dailyWins: ['', '', '', '', ''],
    streak: 0,
  };
};

// We store logs directly in dailyLogs collection, docId = YYYY-MM-DD.
// We also add userId to the document to allow for security rules.
export const fetchLogs = async (): Promise<Record<string, DailyLog>> => {
  try {
    const q = query(collection(db, 'dailyLogs'), where('userId', '==', PERSONAL_USER_ID));
    const snap = await withTimeout(getDocs(q));
    const logs: Record<string, DailyLog> = {};
    snap.forEach(doc => {
      logs[doc.id] = doc.data() as DailyLog;
    });
    return logs;
  } catch (error) {
    console.warn("Firebase warning (logs): DB might not be created or offline.", error);
    return {};
  }
};

export const fetchLog = async (dateStr: string): Promise<DailyLog> => {
  try {
    const docRef = doc(db, 'dailyLogs', dateStr);
    const snap = await withTimeout(getDoc(docRef));
    if (snap.exists() && snap.data().userId === PERSONAL_USER_ID) {
      return snap.data() as DailyLog;
    }
  } catch (error) {
    console.warn("Firebase warning (log): DB might not be created or offline.", error);
  }
  return getEmptyLog(dateStr);
};

export const saveLogToDb = async (log: DailyLog) => {
  try {
    const docRef = doc(db, 'dailyLogs', log.date);
    await withTimeout(setDoc(docRef, { ...log, userId: PERSONAL_USER_ID }, { merge: true }));
  } catch (error) {
    console.warn("Firebase warning (saveLog): DB might not be created or offline.", error);
  }
};

export const fetchSettings = async (): Promise<Settings> => {
  try {
    const docRef = doc(db, 'settings', 'reminders');
    const snap = await withTimeout(getDoc(docRef));
    if (snap.exists() && snap.data().userId === PERSONAL_USER_ID) {
      return snap.data() as Settings;
    }
  } catch (error) {
    console.warn("Firebase warning (settings): DB might not be created or offline.", error);
  }
  return defaultSettings;
};

export const saveSettingsToDb = async (settings: Settings) => {
  try {
    const docRef = doc(db, 'settings', 'reminders');
    await withTimeout(setDoc(docRef, { ...settings, userId: PERSONAL_USER_ID }, { merge: true }));
  } catch (error) {
    console.warn("Firebase warning (saveSettings): DB might not be created or offline.", error);
  }
};

export const calculateCurrentStreak = async (targetDateStr: string = format(new Date(), 'yyyy-MM-dd')): Promise<number> => {
  const logs = await fetchLogs();
  let streak = 0;
  
  if (logs[targetDateStr] && logs[targetDateStr].workoutDone && logs[targetDateStr].outreachDone) {
    streak += 1;
  }

  let currentDate = new Date(targetDateStr + 'T00:00:00');
  let daysToCheck = 1;
  
  while (true) {
    const prevDate = subDays(currentDate, daysToCheck);
    const prevDateStr = format(prevDate, 'yyyy-MM-dd');
    
    const log = logs[prevDateStr];
    if (log && log.workoutDone && log.outreachDone) {
      streak += 1;
      daysToCheck += 1;
    } else {
      break;
    }
  }
  
  return streak;
};
