import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-34c1f11a/health", (c) => {
  return c.json({ status: "ok" });
});

// Get app data from database
app.get("/make-server-34c1f11a/data", async (c) => {
  try {
    const appData = await kv.get("railroad-app-data");
    if (!appData) {
      // Return default data if none exists
      return c.json({
        balance: 10000,
        totalIncome: 0,
        totalExpenses: 0,
        sessionCount: 0,
        financialRecords: [],
        locomotives: []
      });
    }
    return c.json(appData);
  } catch (error) {
    console.log(`Error loading app data: ${error}`);
    return c.json({ error: "Failed to load data" }, 500);
  }
});

// Save app data to database
app.post("/make-server-34c1f11a/data", async (c) => {
  try {
    const body = await c.req.json();
    await kv.set("railroad-app-data", body);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error saving app data: ${error}`);
    return c.json({ error: "Failed to save data" }, 500);
  }
});

// Send notification endpoint
app.post("/make-server-34c1f11a/notify", async (c) => {
  try {
    const { email, phone, subject, message } = await c.req.json();

    if (!email && !phone) {
      return c.json({ error: "Email or phone number is required" }, 400);
    }

    const results = {
      email: null as any,
      sms: null as any
    };

    // Send email if provided
    if (email) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");

      if (resendApiKey) {
        try {
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
              from: "New Haven Railroad <notifications@resend.dev>",
              to: email,
              subject: subject,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">🚂 ${subject}</h2>
                  <p style="color: #666; font-size: 16px;">${message}</p>
                  <hr style="border: 1px solid #eee; margin: 20px 0;">
                  <p style="color: #999; font-size: 12px;">
                    This is an automated notification from your New Haven Railroad finance manager.
                  </p>
                </div>
              `
            })
          });

          if (emailResponse.ok) {
            results.email = { success: true };
          } else {
            const errorData = await emailResponse.text();
            console.log(`Failed to send email: ${errorData}`);
            results.email = { success: false, error: errorData };
          }
        } catch (error) {
          console.log(`Email error: ${error}`);
          results.email = { success: false, error: String(error) };
        }
      } else {
        console.log("RESEND_API_KEY not configured, skipping email");
        results.email = { success: false, error: "API key not configured" };
      }
    }

    // Send SMS if provided
    if (phone) {
      const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
        try {
          const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
          const smsBody = new URLSearchParams({
            To: phone,
            From: twilioPhoneNumber,
            Body: `🚂 ${subject}\n\n${message}`
          });

          const smsResponse = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
            {
              method: "POST",
              headers: {
                "Authorization": `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded"
              },
              body: smsBody.toString()
            }
          );

          if (smsResponse.ok) {
            results.sms = { success: true };
          } else {
            const errorData = await smsResponse.text();
            console.log(`Failed to send SMS: ${errorData}`);
            results.sms = { success: false, error: errorData };
          }
        } catch (error) {
          console.log(`SMS error: ${error}`);
          results.sms = { success: false, error: String(error) };
        }
      } else {
        console.log("Twilio credentials not configured, skipping SMS");
        results.sms = { success: false, error: "Twilio not configured" };
      }
    }

    const anySuccess = (results.email?.success || results.sms?.success);

    return c.json({
      success: anySuccess,
      results,
      message: anySuccess ? "Notification(s) sent" : "Failed to send notifications"
    });
  } catch (error) {
    console.log(`Error sending notification: ${error}`);
    return c.json({ error: "Failed to send notification" }, 500);
  }
});

Deno.serve(app.fetch);