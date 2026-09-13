import { UniversityEvent } from '../types.js';

export function generateRegistrationEmailHtml(params: {
  studentName: string;
  studentEmail: string;
  studentId?: string;
  event: UniversityEvent;
  ticketCode: string;
  registeredAt: string;
}): { subject: string; html: string; text: string } {
  const { studentName, event, ticketCode } = params;
  const subject = `[Confirmed] Your Pass for "${event.title}" - ${event.clubName}`;

  const text = `
Dear ${studentName},

Your registration for "${event.title}" organized by ${event.clubName} is confirmed!

Event Details:
- Category: ${event.category}
- Date: ${event.startDate} ${event.startTime} - ${event.endTime}
- Venue: ${event.venue}
- Ticket ID: ${ticketCode}

Please present your Ticket ID or QR Pass at the venue entrance for check-in.

UniVerse Central Event Management Office
University Campus Portal
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 28px 32px; color: #ffffff; text-align: left; }
    .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: #ffffff; }
    .header p { margin: 0; font-size: 13px; color: #c7d2fe; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
    .body { padding: 32px; }
    .ticket-box { background: #f0fdf4; border: 1px dashed #16a34a; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
    .ticket-code { font-family: monospace; font-size: 24px; font-weight: 800; color: #15803d; letter-spacing: 2px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .detail-label { color: #64748b; font-weight: 500; }
    .detail-value { color: #0f172a; font-weight: 600; text-align: right; }
    .agenda-box { background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 20px; }
    .agenda-title { font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 10px; }
    .agenda-item { font-size: 13px; color: #334155; margin-bottom: 6px; padding-left: 12px; border-left: 2px solid #6366f1; }
    .footer { background: #f8fafc; padding: 20px 32px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <p>Official University Ticket</p>
      <h1>UniVerse Campus Events</h1>
    </div>
    <div class="body">
      <h2 style="margin-top:0; font-size: 18px; color: #0f172a;">Registration Confirmed! 🎉</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Hello <strong>${studentName}</strong>, your seat for <strong>${event.title}</strong> hosted by <em>${event.clubName}</em> is locked in.
      </p>

      <div class="ticket-box">
        <div style="font-size: 12px; font-weight: 600; color: #166534; text-transform: uppercase; margin-bottom: 4px;">Verified Entry Pass Code</div>
        <div class="ticket-code">${ticketCode}</div>
        <div style="font-size: 11px; color: #166534; margin-top: 6px;">Show this pass or your student ID at registration desk</div>
      </div>

      <div style="margin-top: 20px;">
        <div class="detail-row">
          <span class="detail-label">Event Category</span>
          <span class="detail-value">${event.category}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Organizing Club</span>
          <span class="detail-value">${event.clubName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date & Time</span>
          <span class="detail-value">${event.startDate} • ${event.startTime} - ${event.endTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Campus Venue</span>
          <span class="detail-value">${event.venue}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Certificates</span>
          <span class="detail-value">${event.certificatesProvided ? 'Official University Certificate provided' : 'Participation Badge'}</span>
        </div>
      </div>

      ${event.agenda && event.agenda.length > 0 ? `
      <div class="agenda-box">
        <div class="agenda-title">Scheduled Agenda Snapshot</div>
        ${event.agenda.slice(0, 3).map(a => `
          <div class="agenda-item">
            <strong>${a.time}:</strong> ${a.title} ${a.speaker ? `(${a.speaker})` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
        Need to change your attendance? Visit your student dashboard on UniVerse.
      </p>
    </div>
    <div class="footer">
      Sent to ${params.studentEmail} by UniVerse Campus Event Management System.<br/>
      Dean of Student Affairs & Academic Councils • Central University
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
}

export function generateScheduleChangeEmailHtml(params: {
  studentName: string;
  studentEmail: string;
  event: UniversityEvent;
  changeNote: string;
}): { subject: string; html: string; text: string } {
  const { studentName, event, changeNote } = params;
  const subject = `[SCHEDULE UPDATE] Important update for "${event.title}"`;

  const text = `
Dear ${studentName},

The organizing team of ${event.clubName} has announced an important update regarding "${event.title}":

Notice: ${changeNote}

Updated Event Schedule:
- Date: ${event.startDate} ${event.startTime} - ${event.endTime}
- Venue: ${event.venue}

Please check your UniVerse student portal for full details.
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #b45309; padding: 24px 32px; color: #ffffff; }
    .body { padding: 32px; }
    .alert-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 18px; color: #92400e; margin: 20px 0; font-size: 14px; }
    .footer { background: #f8fafc; padding: 20px 32px; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin: 0; font-size: 20px;">⚠️ Event Schedule / Venue Notice</h2>
      <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">UniVerse Event Notification Service</p>
    </div>
    <div class="body">
      <p>Hello <strong>${studentName}</strong>,</p>
      <p>There has been a schedule or venue update for <strong>${event.title}</strong> by <strong>${event.clubName}</strong>.</p>
      
      <div class="alert-box">
        <strong>Organizer Announcement:</strong><br/>
        ${changeNote}
      </div>

      <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; font-size: 14px;">
        <p style="margin: 0 0 6px 0;"><strong>Updated Date & Time:</strong> ${event.startDate} at ${event.startTime}</p>
        <p style="margin: 0;"><strong>Current Venue:</strong> ${event.venue}</p>
      </div>
    </div>
    <div class="footer">
      Sent to ${params.studentEmail} • Campus Event Management System
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
}

export function generateBroadcastAnnouncementHtml(params: {
  studentName: string;
  studentEmail: string;
  eventTitle: string;
  clubName: string;
  announcementTitle: string;
  announcementBody: string;
}): { subject: string; html: string; text: string } {
  const subject = `[ANNOUNCEMENT] ${params.announcementTitle} - ${params.eventTitle}`;
  const text = `
Dear ${params.studentName},

Announcement from ${params.clubName} for "${params.eventTitle}":

${params.announcementTitle}
${params.announcementBody}

UniVerse University Events
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #3b82f6; padding: 24px 32px; color: #ffffff; }
    .body { padding: 32px; }
    .msg-box { background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px 20px; border-radius: 4px; margin: 20px 0; font-size: 14px; line-height: 1.6; color: #1e3a8a; }
    .footer { background: #f8fafc; padding: 20px 32px; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin: 0; font-size: 20px;">📢 Organizer Broadcast Message</h2>
      <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">${params.clubName} • ${params.eventTitle}</p>
    </div>
    <div class="body">
      <p>Hello <strong>${params.studentName}</strong>,</p>
      <h3 style="color: #0f172a; margin-top: 16px;">${params.announcementTitle}</h3>
      <div class="msg-box">
        ${params.announcementBody.replace(/\n/g, '<br/>')}
      </div>
    </div>
    <div class="footer">
      Sent to ${params.studentEmail} • UniVerse Portal
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
}
