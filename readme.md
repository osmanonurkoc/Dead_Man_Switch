
# Serverless Dead Man's Switch

A zero-cost, maintenance-free, serverless dead man's switch built on Google Apps Script (GAS). 

If you stop checking in for a predetermined amount of time, this script assumes you are incapacitated and automatically sends out your pre-written emergency emails, instructions, and private Google Drive attachments to the people you trust.

## Why Google Apps Script?
Most dead man's switch solutions require you to trust a random third-party startup with your most sensitive final instructions, or require you to host a Python script on a VPS or Raspberry Pi. 

Servers crash, SD cards corrupt, cron jobs fail, and hosting bills get forgotten. A system designed for your ultimate downtime shouldn't rely on fragile infrastructure. 

By using Google Apps Script:
* **It's 100% Free:** No servers, no subscriptions.
* **It's Zero-Maintenance:** Runs natively on Google's highly redundant cloud infrastructure.
* **It's Secure:** The code runs locally in your own Google account. Your data, emails, and drive files never leave your personal ecosystem until the switch is triggered.

## Features
* **Automated Check-ins:** Simply reply to an automated reminder email to reset your timer.
* **Multiple Emergency Plans:** Send different emails to different people (e.g., financial details to a spouse, legal instructions to a lawyer, a general goodbye to friends).
* **Private Attachments:** Seamlessly attach private files from your Google Drive (wills, encrypted password vaults) to the outgoing emails without making those files public.

---

## 🛠 Installation & Setup Guide

Since this runs entirely in the cloud, you do not need a local development environment. Setup takes about 3 minutes directly in your browser.

### Step 1: Create the Project
1. Go to [Google Apps Script](https://script.google.com/) and log in with the Google account you use daily.
2. Click the **New Project** button in the top left corner.
3. Click on "Untitled project" at the top and rename it to something recognizable, like `Emergency Switch`.
4. In the editor space (where it says `Code.gs`), delete the default `function myFunction() { ... }` block entirely.
5. Paste the entire contents of the `script.js` file from this repository into the editor.
6. Press `Ctrl + S` (or `Cmd + S` on Mac) to save the file.

### Step 2: Configure Your Settings
Before running the script, you must customize the `CONFIG` and `DEAD_MAN_PLANS` variables at the top of the code to fit your needs. *(See the detailed Configuration Guide below).*

### Step 3: Authorize and Arm the System (Crucial)
Google requires strict, one-time manual permission for any script that wants to send emails or read your Drive files. 

1. Look at the toolbar at the top of the Apps Script editor. You will see a dropdown menu (it usually says `checkDeadman` or `myFunction` by default).
2. Click that dropdown and select **`initializeSystem`**.
3. Click the **Run** button next to it.
4. A prompt will appear saying "Authorization required." Click **Review permissions**.
5. Select your Google account.
6. **Bypass the Warning:** Google will display a warning saying *"Google hasn’t verified this app."* This is perfectly normal because you just wrote/pasted this custom code yourself. Click **Advanced** at the bottom, and then click **Go to Emergency Switch (unsafe)**.
7. Review the permissions (access to Gmail and Google Drive) and click **Allow**.

### Step 4: Verify It Is Running
After allowing permissions, look at the **Execution Log** at the bottom of your screen. 
If you see the message: `System successfully initialized. Status: ALIVE`, you are done! The time-driven trigger has been created, and the script will now silently check your status every hour.

---

## ⚙️ Detailed Configuration Guide

At the very top of the script, you will find two main sections you need to edit. 

### 1. The `CONFIG` Object
This dictates the core rules and timelines of your switch.

```javascript
const CONFIG = {
  ownerEmail: "your_email@example.com", 
  daysReminder: 10, 
  daysDeadman: 14,  
  maxExecutionCount: 3, 
  enableReminderEmails: true 
};

```

-   **`ownerEmail`**: Set this to your primary email address. This is the address where the system will send "Are you alive?" reminders and the final activation warning.
    
-   **`daysReminder`**: The grace period. If the script doesn't hear from you for this many days (e.g., `10`), it will send a reminder email asking you to check in.
    
-   **`daysDeadman`**: The point of no return. If you haven't checked in by this day (e.g., `14`), the system assumes you are gone and fires off the emergency plans.
    
-   **`maxExecutionCount`**: To ensure your final emails are not missed or flagged as a single spam anomaly, the script will repeat the sending process this many times (e.g., `3` times over 3 hours) and then permanently stop to prevent an infinite loop.
    
-   **`enableReminderEmails`**: Keep this as `true` unless you want zero warnings before the system activates.
    

### 2. The `DEAD_MAN_PLANS` Array

This is where you define exactly **who** gets **what**. You can create as many specific plans (objects) as you want inside this array.
```
const DEAD_MAN_PLANS = [
  {
    recipients: ["spouse@example.com", "brother@example.com"],
    subject: "Emergency - Automated Message",
    message: "If you are reading this, I haven't checked in for 14 days. Attached is the master password vault.",
    enableAttachments: true,
    attachmentDriveIds: ["1A2b3C4d5E6f7G8h9I0j"]
  },
  {
    recipients: ["lawyer@example.com"],
    subject: "Confidential - Legal Directives",
    message: "These are my final legal directives...",
    enableAttachments: false,
    attachmentDriveIds: []
  }
];

```

-   **`recipients`**: An array of email addresses. You can put one person, or multiple people separated by commas.
    
-   **`subject` & `message`**: The exact content of the email they will receive.
    
-   **`enableAttachments`**: Set to `true` if you want to attach a file to this specific email. If `false`, the script ignores the IDs below.
    

### 3. How to Find and Add Google Drive File IDs

If you are attaching files (like a PDF will or a ZIP archive), those files must be uploaded to your Google Drive first. **They do not need to be public.** Keep them private; the script has permission to fetch them for you.

1.  Upload your sensitive file to Google Drive.
    
2.  Right-click the file and click **Share** -> **Copy link**.
    
3.  You will get a URL that looks like this: `https://drive.google.com/file/d/1A2b3C4d5E6f7G8h9I0j/view`
    
4.  Copy the long alphanumeric string between `/d/` and `/view`. In this example: `1A2b3C4d5E6f7G8h9I0j`.
    
5.  Paste that exact string into the `attachmentDriveIds: ["YOUR_ID_HERE"]` array. You can add multiple IDs separated by commas.
    

----------

## 🔁 How to Live With It (The Check-In Process)

Once you complete the setup, you never have to open the Apps Script dashboard again. The script installs a time-driven trigger that runs silently in the background every hour.

If you go off the grid for `daysReminder` (e.g., 10 days), you will receive an automated email from yourself with the subject: **"REMINDER: Please check-in"**.

**To reset the switch:** Simply hit **Reply** to that reminder email and type absolutely anything (e.g., "I am here", "Alive", or just "yes").

The next time the script wakes up (within the hour), it will scan your inbox, see your unread reply to that specific thread, reset your timer back to zero days, and go back to sleep. It is entirely frictionless.
## 📄 License
This project is licensed under the [GPL License](LICENSE).

---
*Created by [@osmanonurkoc](https://github.com/osmanonurkoc)*
