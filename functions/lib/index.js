"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTestReminder = exports.logReminderScheduler = exports.outreachReminderScheduler = exports.workoutReminderScheduler = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const admin = __importStar(require("firebase-admin"));
const resend_1 = require("resend");
const date_fns_tz_1 = require("date-fns-tz");
admin.initializeApp();
const db = admin.firestore();
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
    logger.warn("RESEND_API_KEY is not set in environment variables.");
}
const resend = new resend_1.Resend(resendApiKey || "re_dummy");
const APP_URL = process.env.APP_URL || "https://winter-arc-d4f72.web.app";
function getWorkoutType(dateObj, tz) {
    // Get day of week in target timezone (1 = Mon, 7 = Sun)
    const dayStr = (0, date_fns_tz_1.formatInTimeZone)(dateObj, tz, 'i');
    const day = parseInt(dayStr, 10);
    switch (day) {
        case 1:
        case 5: return 'Push';
        case 2:
        case 6: return 'Pull';
        case 3: return 'Legs';
        case 4: return 'Skill';
        case 7:
        default: return 'Run/Rest';
    }
}
const EMAILS = {
    workout: [
        { subject: "Uth. Aaj bhi nahi uthega toh kal bhi wahi bahaana hoga.", body: "Bistar garam hai, pata hai. Lekin jo log 5 baje uthte hain wahi wo log hain jo baad me sabse aage khade milte hain. Aaj ka split: {split}. Tere jaisa koi tujhe push nahi karega — utha khud ko." },
        { subject: "5 AM. Ya toh tu discipline banayega, ya excuse.", body: "Koi dekh nahi raha is waqt — isiliye ye sabse important waqt hai. Aaj ka split: {split}. Chal, prove kar khud ko." },
        { subject: "Winter Arc chal raha hai — tu ruk gaya kya?", body: "Har din jo tu miss karta hai, wo din wapas nahi aata. Aaj ka split: {split}. Utha, aur likh de aaj ka din apne naam." }
    ],
    outreach: [
        { subject: "5 min me library. Client dhoondhna hai, sapne nahi.", body: "Din bhar jo socha tha wo abhi karne ka time hai. Ek outreach message bhej — wahi ek client tera business badal sakta hai. Excuses baad me, kaam abhi." },
        { subject: "Outreach block — abhi ya kabhi nahi.", body: "Jitne clients tu abhi dhoondhega, utna future tera secure hoga. 5 minute me table par baith. Move." },
        { subject: "Freelancing khud nahi chalegi. Tu chalayega.", body: "Koi outreach nahi = koi client nahi = koi progress nahi. Simple hai. Chal, ek message bhej de abhi." }
    ],
    log: [
        { subject: "Din khatam hone se pehle — apna aaj likh de.", body: "Chhota din tha ya bada, streak todna nahi hai. 2 min lagenge, likh de aaj kya kiya. Kal ka tu, aaj ke tujhse judega isi log se." },
        { subject: "Streak zinda rakhni hai ya todni hai — tera call.", body: "2 minute ka kaam hai. Aaj jo bhi kiya, achha ya bura, likh de. Ye log hi teri Winter Arc ki kahani hai." },
        { subject: "Sona hai? Pehle aaj ka hisaab de.", body: "Din band karne se pehle apna din likh de. Ye chhota step hi hai jo lambi discipline banata hai." }
    ]
};
function getRandomEmail(type, split) {
    const options = EMAILS[type];
    const choice = options[Math.floor(Math.random() * options.length)];
    let body = choice.body;
    if (split) {
        body = body.replace(/{split}/g, split);
    }
    body += `\n\nLog in here: ${APP_URL}`;
    return { subject: choice.subject, text: body };
}
function isTimeMatch(currentTimeStr, reminderTimeStr, intervalMinutes = 15) {
    // To handle times like 18:55 with a 15-minute cron, check if reminderTime falls within the past intervalMinutes
    const [currH, currM] = currentTimeStr.split(':').map(Number);
    const [remH, remM] = reminderTimeStr.split(':').map(Number);
    const currTotal = currH * 60 + currM;
    const remTotal = remH * 60 + remM;
    return (currTotal >= remTotal && currTotal < remTotal + intervalMinutes);
}
async function sendEmailBlock(block, settings, currentDate) {
    if (!settings.email) {
        logger.error("No email configured in settings/reminders.");
        return;
    }
    let split = "";
    if (block === 'workout') {
        const tz = settings.timezone || "Asia/Kolkata";
        split = getWorkoutType(currentDate, tz);
    }
    const { subject, text } = getRandomEmail(block, split);
    try {
        await resend.emails.send({
            from: "Winter Arc <winterarc@resend.dev>",
            to: settings.email,
            subject: subject,
            text: text,
        });
        logger.info(`Successfully sent ${block} reminder to ${settings.email}`);
    }
    catch (error) {
        logger.error(`Failed to send ${block} reminder to ${settings.email}:`, error);
    }
}
async function handleSchedule(block) {
    const docRef = db.collection('settings').doc('reminders');
    const doc = await docRef.get();
    if (!doc.exists) {
        logger.info("No settings/reminders document found. Skipping.");
        return;
    }
    const settings = doc.data();
    const tz = settings.timezone || "Asia/Kolkata";
    const now = new Date();
    const currentTimeStr = (0, date_fns_tz_1.formatInTimeZone)(now, tz, 'HH:mm');
    // We use a 15 min window to match the every 15 min cron
    if (block === 'workout' && settings.workoutReminderOn) {
        if (isTimeMatch(currentTimeStr, settings.workoutReminderTime, 15)) {
            await sendEmailBlock('workout', settings, now);
        }
    }
    else if (block === 'outreach' && settings.outreachReminderOn) {
        if (isTimeMatch(currentTimeStr, settings.outreachReminderTime, 15)) {
            await sendEmailBlock('outreach', settings, now);
        }
    }
    else if (block === 'log' && settings.logReminderOn) {
        if (isTimeMatch(currentTimeStr, settings.logReminderTime, 15)) {
            await sendEmailBlock('log', settings, now);
        }
    }
}
// 1. Workout Reminder Scheduler
exports.workoutReminderScheduler = (0, scheduler_1.onSchedule)("every 15 minutes", async (event) => {
    await handleSchedule('workout');
});
// 2. Outreach Reminder Scheduler
exports.outreachReminderScheduler = (0, scheduler_1.onSchedule)("every 15 minutes", async (event) => {
    await handleSchedule('outreach');
});
// 3. Log Reminder Scheduler
exports.logReminderScheduler = (0, scheduler_1.onSchedule)("every 15 minutes", async (event) => {
    await handleSchedule('log');
});
// 4. Test Callable Function
exports.sendTestReminder = (0, https_1.onCall)(async (request) => {
    const data = request.data;
    if (!data.block || !['workout', 'outreach', 'log'].includes(data.block)) {
        throw new https_1.HttpsError('invalid-argument', 'The function must be called with a valid "block" string (workout, outreach, or log).');
    }
    const docRef = db.collection('settings').doc('reminders');
    const doc = await docRef.get();
    if (!doc.exists) {
        throw new https_1.HttpsError('not-found', 'Settings not found in database.');
    }
    const settings = doc.data();
    const now = new Date();
    await sendEmailBlock(data.block, settings, now);
    return { success: true, message: `Test reminder for ${data.block} sent to ${settings.email}` };
});
//# sourceMappingURL=index.js.map