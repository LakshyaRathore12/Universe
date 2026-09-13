import { EmailNotification, InAppNotification, UniversityEvent, Registration } from '../../src/types.js';
import { 
  generateRegistrationEmailHtml, 
  generateScheduleChangeEmailHtml, 
  generateBroadcastAnnouncementHtml 
} from '../../src/utils/emailTemplates.js';

type SSEListener = (data: { event: string; payload: any }) => void;
const sseListeners: Set<SSEListener> = new Set();

export const addSSEListener = (listener: SSEListener) => {
  sseListeners.add(listener);
  return () => sseListeners.delete(listener);
};

export const broadcastSSE = (event: string, payload: any) => {
  sseListeners.forEach(listener => {
    try {
      listener({ event, payload });
    } catch {
      // Ignore dead connections
    }
  });
};

export class EmailService {
  /**
   * Dispatches a real-time email notification and syncs with in-app notifications
   */
  static async dispatchEmail(
    emailData: Omit<EmailNotification, 'id' | 'sentAt' | 'read' | 'deliveryStatus'>,
    emailsStore: EmailNotification[],
    notificationsStore: InAppNotification[]
  ): Promise<EmailNotification> {
    const newEmail: EmailNotification = {
      ...emailData,
      id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sentAt: new Date().toISOString(),
      read: false,
      deliveryStatus: 'delivered',
    };

    emailsStore.unshift(newEmail);

    // Create matching in-app notification
    const newNotification: InAppNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: newEmail.recipientEmail,
      title: newEmail.subject,
      message: newEmail.plainText.substring(0, 140),
      type: newEmail.type === 'cancellation' ? 'warning' : 'info',
      createdAt: new Date().toISOString(),
      read: false,
      eventId: newEmail.eventId,
      link: newEmail.eventId ? `/events/${newEmail.eventId}` : undefined,
    };

    notificationsStore.unshift(newNotification);

    // Broadcast across real-time SSE stream
    broadcastSSE('email_sent', { email: newEmail, notification: newNotification });

    return newEmail;
  }

  /**
   * Helper to dispatch registration confirmation email with ticket pass
   */
  static async sendRegistrationConfirmation(
    event: UniversityEvent,
    registration: Registration,
    emailsStore: EmailNotification[],
    notificationsStore: InAppNotification[]
  ) {
    const { html, text, subject } = generateRegistrationEmailHtml({
      studentName: registration.userName,
      studentEmail: registration.userEmail,
      studentId: registration.studentId,
      event,
      ticketCode: registration.ticketCode,
      registeredAt: registration.registeredAt,
    });

    return this.dispatchEmail(
      {
        recipientEmail: registration.userEmail,
        recipientName: registration.userName,
        senderEmail: event.contactEmail || 'events@campus.edu',
        senderName: `${event.clubName} (UniVerse Events)`,
        subject,
        plainText: text,
        htmlContent: html,
        type: 'registration_confirmation',
        eventId: event.id,
        eventTitle: event.title,
        ticketCode: registration.ticketCode,
      },
      emailsStore,
      notificationsStore
    );
  }

  /**
   * Helper to broadcast schedule changes to all registered attendees
   */
  static async sendScheduleChangeAlert(
    event: UniversityEvent,
    attendees: Registration[],
    rescheduleReason: string | undefined,
    emailsStore: EmailNotification[],
    notificationsStore: InAppNotification[]
  ) {
    for (const attendee of attendees) {
      const { html, text, subject } = generateScheduleChangeEmailHtml({
        studentName: attendee.userName,
        studentEmail: attendee.userEmail,
        event,
        changeNote: rescheduleReason || 'Schedule adjusted by organizer.',
      });

      await this.dispatchEmail(
        {
          recipientEmail: attendee.userEmail,
          recipientName: attendee.userName,
          senderEmail: event.contactEmail || 'events@campus.edu',
          senderName: `${event.clubName} Organizer Team`,
          subject,
          plainText: text,
          htmlContent: html,
          type: 'schedule_change',
          eventId: event.id,
          eventTitle: event.title,
          ticketCode: attendee.ticketCode,
        },
        emailsStore,
        notificationsStore
      );
    }
  }

  /**
   * Helper to broadcast custom announcements
   */
  static async sendBroadcastAnnouncement(
    event: UniversityEvent,
    attendees: Registration[],
    announcementTitle: string,
    announcementBody: string,
    emailsStore: EmailNotification[],
    notificationsStore: InAppNotification[]
  ) {
    for (const attendee of attendees) {
      const { html, text, subject } = generateBroadcastAnnouncementHtml({
        studentName: attendee.userName,
        studentEmail: attendee.userEmail,
        eventTitle: event.title,
        clubName: event.clubName,
        announcementTitle,
        announcementBody,
      });

      await this.dispatchEmail(
        {
          recipientEmail: attendee.userEmail,
          recipientName: attendee.userName,
          senderEmail: event.contactEmail || 'events@campus.edu',
          senderName: `${event.clubName} Organizers`,
          subject,
          plainText: text,
          htmlContent: html,
          type: 'organizer_announcement',
          eventId: event.id,
          eventTitle: event.title,
          ticketCode: attendee.ticketCode,
        },
        emailsStore,
        notificationsStore
      );
    }
  }
}
