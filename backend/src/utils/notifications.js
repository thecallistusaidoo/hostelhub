// src/utils/notifications.js
// Handles email (Nodemailer/Gmail) and SMS (Termii — popular in Ghana/Nigeria)
// for meetup scheduling notifications.
//
// Install: npm install nodemailer node-fetch
// Alternatively for SMS: npm install twilio  (also works in Ghana)

const nodemailer = require("nodemailer");

// ── Email transporter (Gmail via App Password) ────────────────────────────────
// In Gmail: Settings → Security → 2-Step Verification → App passwords → generate one
// Or use any SMTP: Brevo (free 300/day), Mailgun, SendGrid, etc.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_FROM,        // your Gmail address
    pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password (NOT your real password)
  },
});

// ── SMS via Termii (supports Ghana MTN, Vodafone, AirtelTigo) ─────────────────
// Sign up free at termii.com — 50 free SMS to test
// Or use Twilio: same interface, just different env vars
async function sendSMS(phoneNumber, message) {
  if (!process.env.TERMII_API_KEY) {
    console.warn("⚠️  TERMII_API_KEY not set — SMS skipped");
    return false;
  }

  // Normalize Ghana phone number to international format
  let phone = phoneNumber.replace(/\s+/g, "").replace(/^0/, "233");
  if (!phone.startsWith("233")) phone = `233${phone}`;

  try {
    const res = await fetch("https://api.ng.termii.com/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to:        phone,
        from:      process.env.TERMII_SENDER_ID || "HostelHub", // registered sender ID
        sms:       message,
        type:      "plain",
        channel:   "generic",
        api_key:   process.env.TERMII_API_KEY,
      }),
    });
    const data = await res.json();
    console.log(`📱 SMS to ${phone}: ${data.message || "sent"}`);
    return true;
  } catch (err) {
    console.error("SMS error:", err.message);
    return false;
  }
}

// ── Email helper ──────────────────────────────────────────────────────────────
async function sendEmail({ to, subject, html, text }) {
  if (!process.env.EMAIL_FROM) {
    console.warn("⚠️  EMAIL_FROM not set — email skipped");
    return false;
  }
  try {
    await transporter.sendMail({
      from:    `"HostelHub" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text:    text || html.replace(/<[^>]+>/g, ""),
    });
    console.log(`📧 Email sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error("Email error:", err.message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MEETUP NOTIFICATION — sent to student AND host when admin schedules a meetup
// ─────────────────────────────────────────────────────────────────────────────
async function sendMeetupNotification({ reservation, student, host, hostel, room }) {
  const { meetup } = reservation;
  const meetupDate = new Date(meetup.scheduledAt);

  const dateStr = meetupDate.toLocaleDateString("en-GH", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
  });
  const timeStr = meetupDate.toLocaleTimeString("en-GH", {
    hour:   "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const meetupLocation = meetup.location || hostel.address || hostel.landmark || hostel.name;

  // ── STUDENT EMAIL ────────────────────────────────────────────────────────
  const studentEmailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(30,64,175,0.10); }
    .header { background: linear-gradient(135deg, #1E40AF, #2563EB); padding: 32px 28px; text-align: center; }
    .header h1 { color: white; font-size: 22px; margin: 0; font-weight: 800; }
    .header p  { color: rgba(255,255,255,0.75); margin: 6px 0 0; font-size: 14px; }
    .body  { padding: 28px; }
    .card  { background: #EFF6FF; border: 1px solid #DBEAFE; border-radius: 12px; padding: 18px 20px; margin: 16px 0; }
    .row   { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px solid #DBEAFE; }
    .row:last-child { border-bottom: none; }
    .label { color: #6B7280; }
    .value { color: #111827; font-weight: 600; }
    .highlight { background: linear-gradient(135deg, #F59E0B, #FBBF24); color: white; border-radius: 10px; padding: 14px 20px; text-align: center; margin: 20px 0; }
    .highlight .date { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
    .highlight .time { font-size: 14px; opacity: 0.9; }
    .footer { background: #f9fafb; padding: 16px 28px; text-align: center; font-size: 12px; color: #9CA3AF; }
    h2 { color: #1E40AF; font-size: 18px; margin: 0 0 8px; }
    p  { color: #374151; font-size: 14px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏠 HostelHub</h1>
      <p>Meetup Scheduled — Reservation #${reservation._id.toString().slice(-6).toUpperCase()}</p>
    </div>
    <div class="body">
      <h2>Hi ${student.firstName}! Your meetup is confirmed.</h2>
      <p>Great news! HostelHub has scheduled a meetup for you with the hostel owner. Please attend at the date and time below to inspect the hostel and finalise your reservation.</p>

      <div class="highlight">
        <div class="date">📅 ${dateStr}</div>
        <div class="time">🕐 ${timeStr}</div>
      </div>

      <div class="card">
        <div class="row"><span class="label">Meeting Location</span><span class="value">📍 ${meetupLocation}</span></div>
        <div class="row"><span class="label">Hostel</span><span class="value">${hostel.name}</span></div>
        <div class="row"><span class="label">Room Type</span><span class="value">${room.name}</span></div>
        <div class="row"><span class="label">For # People</span><span class="value">${reservation.numberOfPeople}</span></div>
        <div class="row"><span class="label">Host</span><span class="value">${host.fullName}</span></div>
        <div class="row"><span class="label">Host Phone</span><span class="value">${host.phone}</span></div>
      </div>

      ${meetup.notes ? `<div class="card"><p><strong>Note from HostelHub:</strong> ${meetup.notes}</p></div>` : ""}

      <p>Please bring your <strong>UMaT student ID card</strong>. If you need to reschedule or have questions, reply to this email or contact us at <a href="mailto:${process.env.EMAIL_FROM}">${process.env.EMAIL_FROM}</a>.</p>
    </div>
    <div class="footer">HostelHub · UMaT Student Housing · Tarkwa, Ghana</div>
  </div>
</body>
</html>`;

  // ── HOST EMAIL ────────────────────────────────────────────────────────────
  const hostEmailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(30,64,175,0.10); }
    .header { background: linear-gradient(135deg, #1e3a8a, #1E40AF); padding: 32px 28px; text-align: center; }
    .header h1 { color: white; font-size: 22px; margin: 0; font-weight: 800; }
    .header p  { color: rgba(255,255,255,0.75); margin: 6px 0 0; font-size: 14px; }
    .body  { padding: 28px; }
    .card  { background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 12px; padding: 18px 20px; margin: 16px 0; }
    .row   { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px solid rgba(0,0,0,0.05); }
    .row:last-child { border-bottom: none; }
    .label { color: #6B7280; }
    .value { color: #111827; font-weight: 600; }
    .highlight { background: linear-gradient(135deg, #1E40AF, #2563EB); color: white; border-radius: 10px; padding: 14px 20px; text-align: center; margin: 20px 0; }
    .highlight .date { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
    .highlight .time { font-size: 14px; opacity: 0.9; }
    .footer { background: #f9fafb; padding: 16px 28px; text-align: center; font-size: 12px; color: #9CA3AF; }
    h2 { color: #1e3a8a; font-size: 18px; margin: 0 0 8px; }
    p  { color: #374151; font-size: 14px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏠 HostelHub — Host Portal</h1>
      <p>New Meetup Scheduled at ${hostel.name}</p>
    </div>
    <div class="body">
      <h2>Hi ${host.fullName}!</h2>
      <p>A student has reserved your hostel and HostelHub has scheduled a meetup. Please be available at your hostel on the date and time below.</p>

      <div class="highlight">
        <div class="date">📅 ${dateStr}</div>
        <div class="time">🕐 ${timeStr}</div>
      </div>

      <div class="card">
        <div class="row"><span class="label">Student</span><span class="value">${student.firstName} ${student.lastName}</span></div>
        <div class="row"><span class="label">Student Phone</span><span class="value">${student.phone}</span></div>
        <div class="row"><span class="label">Student Email</span><span class="value">${student.email}</span></div>
        <div class="row"><span class="label">UMaT ID</span><span class="value">${student.umatId}</span></div>
        <div class="row"><span class="label">Room Type</span><span class="value">${room.name}</span></div>
        <div class="row"><span class="label">People</span><span class="value">${reservation.numberOfPeople}</span></div>
        <div class="row"><span class="label">Meeting Location</span><span class="value">📍 ${meetupLocation}</span></div>
      </div>

      ${meetup.notes ? `<div class="card" style="background:#EFF6FF;border-color:#DBEAFE;"><p><strong>Admin Notes:</strong> ${meetup.notes}</p></div>` : ""}

      <p>If you are unavailable at this time, please contact HostelHub immediately at <a href="mailto:${process.env.EMAIL_FROM}">${process.env.EMAIL_FROM}</a>.</p>
    </div>
    <div class="footer">HostelHub · UMaT Student Housing · Tarkwa, Ghana</div>
  </div>
</body>
</html>`;

  // ── SMS MESSAGES ─────────────────────────────────────────────────────────
  const studentSMS = `HostelHub: Your meetup for ${hostel.name} is scheduled for ${dateStr} at ${timeStr}. Meet at: ${meetupLocation}. Host: ${host.fullName} (${host.phone}). Bring your UMaT ID. Questions? Email ${process.env.EMAIL_FROM}`;

  const hostSMS = `HostelHub: Student ${student.firstName} ${student.lastName} (${student.phone}) will visit ${hostel.name} on ${dateStr} at ${timeStr} for a ${room.name} reservation. Please be available.`;

  // ── Send all notifications in parallel ───────────────────────────────────
  const results = await Promise.allSettled([
    sendEmail({ to: student.email, subject: `HostelHub: Meetup scheduled for ${hostel.name} — ${dateStr}`, html: studentEmailHTML }),
    sendEmail({ to: host.email,    subject: `HostelHub: New student visiting ${hostel.name} — ${dateStr}`, html: hostEmailHTML }),
    sendSMS(student.phone, studentSMS),
    sendSMS(host.phone, hostSMS),
  ]);

  const sent = results.filter(r => r.status === "fulfilled" && r.value === true).length;
  console.log(`📬 Meetup notifications: ${sent}/4 sent successfully`);
  return sent > 0;
}

module.exports = { sendEmail, sendSMS, sendMeetupNotification };