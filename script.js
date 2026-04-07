/**
 * DEAD MAN'S SWITCH
 * Automated Check-in & Emergency Email System
 */

// ==========================================
// SYSTEM CONFIGURATION
// ==========================================

const CONFIG = {
    ownerEmail: "yourmail@example.com",
    daysReminder: 10, // Days without check-in before a reminder is sent
    daysDeadman: 14,  // Days without check-in before activating the dead man's switch
    maxExecutionCount: 7, // How many times the final emails will be sent
    enableReminderEmails: true // Toggle to true/false to enable or disable reminder emails
};

// --- Warning & Reminder Email Contents ---
const REMINDER_SUBJECT = "REMINDER: Please check-in";
const REMINDER_MESSAGE = "Please check-in. You can reply to this email to automatically check-in, or run the manualCheckIn() function.";

const ACTIVATION_SUBJECT = "Dead Man's Switch Activated";
const ACTIVATION_MESSAGE = "You forgot to check-in. The dead man's switch has been activated and emails are being sent.";

// ==========================================
// EMERGENCY EMAIL PLANS
// ==========================================
// You can create as many specific plans as you want.
// A plan can be sent to a single person or a group.

const DEAD_MAN_PLANS = [
    {
        // Example 1: Group email with attachments
        recipients: ["family1@example.com", "family2@example.com"],
        subject: "I Am Gone - General Message",
        message: "If you are reading this, the automated system has been triggered. Please find the attached files.",
        enableAttachments: true, // Set to false if you don't want to use attachments here
        attachmentDriveIds: ["YOUR_DRIVE_FILE_ID_1", "YOUR_DRIVE_FILE_ID_2"]
    },
{
    // Example 2: Specific email to a single person without attachments
    recipients: ["lawyer@example.com"],
    subject: "Confidential - Legal Instructions",
    message: "This is an automated message containing specific legal instructions...",
    enableAttachments: false, // Attachments disabled, array below will be ignored
    attachmentDriveIds: []
},
{
    // Example 3: Simple goodbye message
    recipients: ["friend@example.com"],
    subject: "Goodbye",
    message: "Thank you for everything.",
    enableAttachments: false,
    attachmentDriveIds: []
}
];


// ==========================================
// CORE SYSTEM FUNCTIONS
// ==========================================

/**
 * Initializes the system and sets up the time-driven trigger.
 * Run this function ONCE to start the dead man's switch.
 */
function initializeSystem() {
    const props = PropertiesService.getScriptProperties();

    props.setProperties({
        'lastCheckinTime': new Date().getTime().toString(),
                        'counter': '0',
                        'status': 'ALIVE' // Possible states: ALIVE, REMINDER_SENT, TRIGGERED
    });

    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(t => ScriptApp.deleteTrigger(t));

    ScriptApp.newTrigger('checkDeadman')
    .timeBased()
    .everyHours(1)
    .create();

    Logger.log("System successfully initialized. Status: ALIVE");
}

/**
 * Manually resets the timer and prevents the switch from triggering.
 */
function manualCheckIn() {
    const props = PropertiesService.getScriptProperties();
    props.setProperty('lastCheckinTime', new Date().getTime().toString());
    props.setProperty('status', 'ALIVE');
    props.setProperty('counter', '0');
    Logger.log("Manual check-in successful. Timers reset.");
}

/**
 * Main routine to evaluate time conditions and trigger actions.
 * Runs automatically every hour.
 */
function checkDeadman() {
    const props = PropertiesService.getScriptProperties();
    const lastCheckinTime = parseFloat(props.getProperty('lastCheckinTime'));
    const currentTime = new Date().getTime();

    const timeDifferenceDays = (currentTime - lastCheckinTime) / (1000 * 60 * 60 * 24);

    // Check if owner replied to the reminder to auto check-in
    if (checkForCheckinReply()) {
        manualCheckIn();
        return;
    }

    if (timeDifferenceDays > CONFIG.daysReminder) {

        if (timeDifferenceDays > CONFIG.daysDeadman) {
            // --- TRIGGER PHASE ---
            const status = props.getProperty('status');

            if (status !== 'TRIGGERED') {
                GmailApp.sendEmail(CONFIG.ownerEmail, ACTIVATION_SUBJECT, ACTIVATION_MESSAGE);
                props.setProperty('status', 'TRIGGERED');
                Logger.log("Dead man switch triggered! Activation email sent to owner.");
            }

            executeDeadmanSwitch();

        } else {
            // --- REMINDER PHASE ---
            if (CONFIG.enableReminderEmails) {
                const status = props.getProperty('status');

                if (status === 'ALIVE') {
                    GmailApp.sendEmail(CONFIG.ownerEmail, REMINDER_SUBJECT, REMINDER_MESSAGE);
                    props.setProperty('status', 'REMINDER_SENT');
                    Logger.log("Reminder email sent to owner.");
                }
            }
        }
    }
}

/**
 * Iterates over DEAD_MAN_PLANS and sends customized emails based on their settings.
 */
function executeDeadmanSwitch() {
    const props = PropertiesService.getScriptProperties();
    let counter = parseInt(props.getProperty('counter') || '0');

    if (counter < CONFIG.maxExecutionCount) {

        DEAD_MAN_PLANS.forEach(plan => {
            let attachments = [];

            // Process attachments only if the boolean flag is true and array has items
            if (plan.enableAttachments && plan.attachmentDriveIds && plan.attachmentDriveIds.length > 0) {
                plan.attachmentDriveIds.forEach(id => {
                    try {
                        if (id && id.trim() !== "" && !id.includes("YOUR_DRIVE_FILE_ID")) {
                            let file = DriveApp.getFileById(id);
                            attachments.push(file.getAs(file.getMimeType()));
                        }
                    } catch (e) {
                        Logger.log("Error loading attachment ID: " + id + " - " + e.message);
                    }
                });
            }

            const toEmails = plan.recipients.join(",");

            // Send email depending on whether there are valid attachments retrieved
            if (attachments.length > 0) {
                GmailApp.sendEmail(toEmails, plan.subject, plan.message, { attachments: attachments });
            } else {
                GmailApp.sendEmail(toEmails, plan.subject, plan.message);
            }
        });

        props.setProperty('counter', (counter + 1).toString());
        Logger.log("Emergency emails sent. Batch: " + (counter + 1) + "/" + CONFIG.maxExecutionCount);
    } else {
        Logger.log("Maximum execution count reached. System idle.");
    }
}

/**
 * Scans the owner's inbox for unread replies to the specific reminder thread.
 * @returns {boolean} True if an unread reply is found.
 */
function checkForCheckinReply() {
    const searchQuery = `subject:"${REMINDER_SUBJECT}" is:unread label:inbox`;
    const threads = GmailApp.search(searchQuery);

    if (threads.length > 0) {
        GmailApp.markThreadsRead(threads);
        return true;
    }
    return false;
}
