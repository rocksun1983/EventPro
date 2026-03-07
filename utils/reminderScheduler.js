import Event from "../models/event.js";
import sendEmail from "./sendEmail.js";
import sendSMS from "./sendSMS.js";

// Reminder scheduler - runs every hour to check for upcoming events
const startReminderService = () => {
  const reminderInterval = setInterval(async () => {
    try {
      // Get events happening in the next 24 hours
      const now = new Date();
      const upcoming = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

      const events = await Event.find({
        date: { $gte: now, $lte: upcoming },
        reminderSent: false
      }).populate("organizer");

      for (const event of events) {
        if (event.organizer) {
          const organizer = event.organizer;
          const reminderMessage = `
Your event "${event.title}" is scheduled for ${event.date.toLocaleString()}.
Location: ${event.location}

Get ready and make final preparations!
          `.trim();

          let attemptedDelivery = false;
          let deliverySucceeded = true;

          // Send email reminder if email is available
          if (organizer.email) {
            attemptedDelivery = true;
            try {
              await sendEmail(
                organizer.email,
                `Reminder: Your event "${event.title}" is happening soon!`,
                reminderMessage
              );
            } catch (error) {
              deliverySucceeded = false;
              console.error(`Email reminder failed for event ${event._id}:`, error.message);
            }
          }

          // Send SMS reminder if phone is available and SMS is enabled
          if (organizer.phone && organizer.smsEnabled) {
            attemptedDelivery = true;
            const smsResult = await sendSMS(organizer.phone, `EventPro Reminder: ${reminderMessage}`);
            if (!smsResult.success) {
              deliverySucceeded = false;
              console.error(`SMS reminder failed for event ${event._id}:`, smsResult.error || smsResult.message);
            }
          }

          // Mark as sent only if at least one channel was attempted and all attempts succeeded
          if (attemptedDelivery && deliverySucceeded) {
            event.reminderSent = true;
            await event.save();
          }
        }
      }

      console.log(`Reminder check completed at ${new Date()}`);
    } catch (error) {
      console.error("Error in reminder service:", error);
    }
  }, 60 * 60 * 1000); // Run every hour

  console.log("Reminder service started (Email & SMS)");
  return reminderInterval;
};

export default startReminderService;
