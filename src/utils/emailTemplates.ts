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

export function generateEventReminderEmailHtml(params: {
  studentName: string;
  studentEmail: string;
  studentId?: string;
  event: UniversityEvent;
  ticketCode: string;
  minutesLeft?: number;
}): { subject: string; html: string; text: string } {
  const { studentName, event, ticketCode, minutesLeft = 60 } = params;
  const timeDesc = minutesLeft <= 60 ? `starts in ${minutesLeft} minutes` : `starts in 1 hour`;
  const subject = `[REMINDER: 1 HOUR TO GO] "${event.title}" starts soon at ${event.venue}!`;

  const text = `
Dear ${studentName},

This is an automated 1-hour reminder that your registered event "${event.title}" starts soon!

Event Details:
- Title: ${event.title}
- Organized by: ${event.clubName}
- Date & Time: Today, ${event.startDate} at ${event.startTime} - ${event.endTime}
- Venue: ${event.venue}
- Your Ticket Pass: ${ticketCode}

Important Checklist before heading over:
1. Please arrive 10-15 minutes prior to ${event.startTime} for entrance verification.
2. Carry your student ID card or have your digital QR Ticket Pass ready on your phone.
3. Bring any prerequisites or required equipment (e.g., laptop/notes if specified).

View or download your digital ticket pass anytime in your UniVerse portal.

UniVerse Central Event Management & Notification System
Campus Student Affairs
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 28px 32px; color: #ffffff; }
    .badge { display: inline-block; background: rgba(255, 255, 255, 0.2); color: #fef08a; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 9999px; margin-bottom: 8px; }
    .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff; }
    .header p { margin: 0; font-size: 13px; color: #e0e7ff; font-weight: 500; }
    .body { padding: 32px; }
    .urgency-banner { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 10px; padding: 14px 18px; color: #92400e; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
    .ticket-box { background: #f0fdf4; border: 1px dashed #22c55e; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0; }
    .ticket-code { font-family: monospace; font-size: 22px; font-weight: 800; color: #15803d; letter-spacing: 2px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .detail-label { color: #64748b; font-weight: 500; }
    .detail-value { color: #0f172a; font-weight: 600; text-align: right; }
    .checklist { background: #f8fafc; border-radius: 10px; padding: 18px; margin: 24px 0 10px 0; border: 1px solid #e2e8f0; }
    .checklist-title { font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
    .checklist-item { font-size: 13px; color: #334155; margin-bottom: 6px; padding-left: 8px; }
    .footer { background: #f8fafc; padding: 20px 32px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">⏰ Official 1-Hour Reminder</div>
      <h1>Event Starting in 1 Hour</h1>
      <p>${event.title}</p>
    </div>
    <div class="body">
      <div class="urgency-banner">
        ⚠️ <strong>Starts at ${event.startTime}!</strong> Arrive at <em>${event.venue}</em> 10-15 minutes early for ticket check-in.
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        Hello <strong>${studentName}</strong>, your registered event hosted by <strong>${event.clubName}</strong> begins in approximately one hour.
      </p>

      <div class="ticket-box">
        <div style="font-size: 11px; font-weight: 600; color: #166534; text-transform: uppercase; margin-bottom: 2px;">Your Entrance Ticket Pass</div>
        <div class="ticket-code">${ticketCode}</div>
        <div style="font-size: 11px; color: #166534; margin-top: 4px;">Present on mobile or show student ID at registration gate</div>
      </div>

      <div style="margin-top: 20px;">
        <div class="detail-row">
          <span class="detail-label">Event</span>
          <span class="detail-value">${event.title}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date & Time</span>
          <span class="detail-value">${event.startDate} • ${event.startTime} - ${event.endTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Campus Location</span>
          <span class="detail-value">${event.venue}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Category</span>
          <span class="detail-value">${event.category}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Organizing Club</span>
          <span class="detail-value">${event.clubName}</span>
        </div>
      </div>

      <div class="checklist">
        <div class="checklist-title">📋 Pre-Arrival Quick Checklist</div>
        <div class="checklist-item">✓ Bring your university student ID card</div>
        <div class="checklist-item">✓ Have this email or your UniVerse digital QR pass ready</div>
        <div class="checklist-item">✓ Seating is first-come, first-served within the hall</div>
        ${event.isOnline && event.meetingLink ? `<div class="checklist-item">✓ Virtual Link: <a href="${event.meetingLink}" style="color: #4f46e5;">${event.meetingLink}</a></div>` : ''}
      </div>
    </div>
    <div class="footer">
      Sent to ${params.studentEmail} • UniVerse Automated Campus Event Reminder System
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
}

export function generateCertificateEmailHtml(params: {
  studentName: string;
  studentEmail: string;
  studentId?: string;
  department?: string;
  event: UniversityEvent;
  certificateId: string;
  issuedAt: string;
  certificateUrl?: string;
}): { subject: string; html: string; text: string } {
  const { studentName, event, certificateId } = params;
  const certUrl = params.certificateUrl || `/api/certificates/${certificateId}/view`;
  const subject = `[Official Certificate] Congratulations! Your Participation Certificate for "${event.title}" is ready`;

  const text = `
Dear ${studentName},

Congratulations! Your verified attendance has been recorded as PRESENT for "${event.title}", organized by ${event.clubName}.

Your Official Certificate of Participation has been issued.

Certificate Details:
- Certificate ID: ${certificateId}
- Recipient: ${studentName} (${params.studentId || 'Student'})
- Department: ${params.department || 'University Student'}
- Event: ${event.title}
- Organizing Club: ${event.clubName}
- Date & Venue: ${event.startDate} • ${event.venue}

Direct Digital Certificate Link:
${certUrl}

Click the link above to view, verify authenticity, print, or save your high-resolution participation certificate.

Office of Campus Student Welfare & Academic Affairs
UniVerse Collegiate Portal
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 2px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2); }
    .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); padding: 32px; color: #ffffff; text-align: center; position: relative; }
    .gold-badge { display: inline-block; background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%); color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; padding: 5px 14px; border-radius: 9999px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(217, 119, 6, 0.4); }
    .header h1 { margin: 0 0 6px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; color: #ffffff; }
    .header p { margin: 0; font-size: 13px; color: #e0e7ff; }
    .cert-preview-box { margin: 24px; background: #fffbeb; border: 2px dashed #d97706; border-radius: 12px; padding: 24px; text-align: center; }
    .cert-id-tag { font-family: monospace; font-size: 15px; font-weight: 800; color: #92400e; letter-spacing: 1.5px; background: #fef3c7; padding: 6px 14px; border-radius: 8px; display: inline-block; }
    .body { padding: 0 32px 32px 32px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .detail-label { color: #64748b; font-weight: 500; }
    .detail-value { color: #0f172a; font-weight: 700; text-align: right; }
    .congrats-banner { background: #f0fdf4; border: 1px solid #86efac; border-radius: 10px; padding: 14px 16px; margin: 20px 0; color: #166534; font-size: 13px; font-weight: 600; text-align: center; }
    .footer { background: #f8fafc; padding: 20px 32px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="gold-badge">🎓 Verified Attendance Certificate</div>
      <h1>Certificate of Participation</h1>
      <p>Official Academic Recognition for ${event.title}</p>
    </div>
    <div class="cert-preview-box">
      <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #b45309; letter-spacing: 0.08em; margin-bottom: 6px;">Certificate Verification Number</div>
      <div class="cert-id-tag">${certificateId}</div>
      <div style="font-size: 15px; font-weight: 800; color: #1e1b4b; margin-top: 12px;">Presented to ${studentName}</div>
      <div style="font-size: 12px; color: #78350f; margin-top: 4px;">Enrollment: ${params.studentId || 'Campus Student'} • Dept: ${params.department || 'N/A'}</div>
    </div>
    <div class="body">
      <div class="congrats-banner">
        🎉 Verified Present! You have successfully fulfilled attendance criteria for this event.
      </div>

      <!-- Prominent Digital Certificate Link Button -->
      <div style="margin: 24px 0; text-align: center;">
        <a href="${certUrl}" 
           style="display: inline-block; background: linear-gradient(135deg, #4338ca 0%, #312e81 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 800; font-size: 14px; box-shadow: 0 4px 14px rgba(49, 46, 129, 0.4); letter-spacing: 0.02em;">
          🎓 Open & View Digital Certificate
        </a>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; margin: 16px 0; text-align: center; font-size: 12px; color: #64748b;">
        <span style="font-weight: 600; color: #334155;">Direct Certificate URL:</span><br/>
        <a href="${certUrl}" style="color: #4f46e5; word-break: break-all; font-weight: 600;">${certUrl}</a>
      </div>

      <div style="margin-top: 20px;">
        <div class="detail-row">
          <span class="detail-label">Event Name</span>
          <span class="detail-value">${event.title}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Organized By</span>
          <span class="detail-value">${event.clubName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date & Time</span>
          <span class="detail-value">${event.startDate} • ${event.startTime}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Campus Location</span>
          <span class="detail-value">${event.venue}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Issued On</span>
          <span class="detail-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
    <div class="footer">
      Delivered to ${params.studentEmail} • Office of Student Welfare & University Academic Council
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
}

