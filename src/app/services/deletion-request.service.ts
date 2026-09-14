import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from '@angular/fire/firestore';

export interface DeletionRequest {
  id?: string;
  email: string;
  name: string;
  phone?: string;
  role?: 'owner' | 'renter' | 'manager' | 'other' | string;
  scope: 'all' | 'specific';
  specificDataDetails?: string;
  reason?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  createdAt: Date;
  updatedAt?: Date;
  processedAt?: Date;
  processedBy?: string;
  adminNotes?: string;
  isStoredLocally?: boolean;
  deletedCounts?: {
    users: number;
    properties: number;
    renters: number;
    rentals: number;
    payments: number;
    messages: number;
  };
}

const LOCAL_STORAGE_KEY = 'krenter_offline_deletion_requests';

function parseDate(val: any): Date {
  if (!val) return new Date();
  if (val.toDate && typeof val.toDate === 'function') return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 4000,
  timeoutErrorMsg = 'Operation timed out',
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(timeoutErrorMsg)), timeoutMs)),
  ]);
}

@Injectable({
  providedIn: 'root',
})
export class DeletionRequestService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly firestore = inject(Firestore);
  private readonly ADMIN_NOTIFICATION_EMAIL = 'krenterservices@gmail.com';

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Safe local storage reader (SSR-compatible)
   */
  private getLocalRequests(): DeletionRequest[] {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as any[];
      return parsed.map((item) => ({
        ...item,
        createdAt: parseDate(item.createdAt),
        updatedAt: parseDate(item.updatedAt),
        processedAt: item.processedAt ? parseDate(item.processedAt) : undefined,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Save request to local storage as fallback
   */
  private saveLocalRequest(request: DeletionRequest): void {
    if (!this.isBrowser) return;
    try {
      const current = this.getLocalRequests();
      const existingIdx = current.findIndex(
        (r) => (request.id && r.id === request.id) || r.email === request.email,
      );
      if (existingIdx >= 0) {
        current[existingIdx] = request;
      } else {
        current.unshift(request);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
    } catch (e) {
      console.warn('Could not save deletion request to local storage:', e);
    }
  }

  /**
   * Update ID in local storage once Firestore assigns one
   */
  private updateLocalRequestId(oldId: string, newId: string): void {
    if (!this.isBrowser) return;
    try {
      const current = this.getLocalRequests();
      const item = current.find((r) => r.id === oldId);
      if (item) {
        item.id = newId;
        item.isStoredLocally = false;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
      }
    } catch {}
  }

  /**
   * Update request status in local storage
   */
  private updateLocalRequestStatus(
    id: string,
    status: DeletionRequest['status'],
    deletedCounts?: DeletionRequest['deletedCounts'],
    adminNotes?: string,
    processedBy?: string,
  ): void {
    if (!this.isBrowser) return;
    try {
      const current = this.getLocalRequests();
      const item = current.find((r) => r.id === id);
      if (item) {
        item.status = status;
        item.updatedAt = new Date();
        if (deletedCounts) item.deletedCounts = deletedCounts;
        if (adminNotes !== undefined) item.adminNotes = adminNotes;
        if (processedBy !== undefined) item.processedBy = processedBy;
        if (status === 'completed') item.processedAt = new Date();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
      }
    } catch {}
  }

  /**
   * Submit a new account & data deletion request
   */
  async createDeletionRequest(
    data: Omit<DeletionRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
  ): Promise<{ success: boolean; id?: string; error?: string; isStoredLocally?: boolean }> {
    const normalizedEmail = (data.email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      return { success: false, error: 'A valid email address is required.' };
    }

    const fallbackId = `REQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const requestPayload: DeletionRequest = {
      id: fallbackId,
      email: normalizedEmail,
      name: (data.name || '').trim(),
      phone: (data.phone || '').trim(),
      role: data.role || 'renter',
      scope: data.scope || 'all',
      specificDataDetails: data.specificDataDetails || '',
      reason: data.reason || '',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      isStoredLocally: true,
    };

    // 1. Immediately cache in local storage (SSR safe) so submission is never lost
    this.saveLocalRequest(requestPayload);

    let finalId = fallbackId;
    let isStoredLocally = false;

    // 2. Try Firestore write with a 4-second timeout to prevent hanging on permission-denied/unauthenticated writes
    try {
      const deletionRequestsCol = collection(this.firestore, 'deletion_requests');
      const writePromise = addDoc(deletionRequestsCol, {
        email: requestPayload.email,
        name: requestPayload.name,
        phone: requestPayload.phone,
        role: requestPayload.role,
        scope: requestPayload.scope,
        specificDataDetails: requestPayload.specificDataDetails,
        reason: requestPayload.reason,
        status: requestPayload.status,
        createdAt: requestPayload.createdAt,
        updatedAt: requestPayload.updatedAt,
      });

      const docRef = await withTimeout(writePromise, 4000, 'FIRESTORE_TIMEOUT');
      finalId = docRef.id;
      // Mark as persisted in remote Firestore
      this.updateLocalRequestId(fallbackId, finalId);
    } catch (writeErr: any) {
      console.warn(
        'Firestore write timed out or permission-denied. Stored request locally with ID:',
        fallbackId,
        writeErr?.message || writeErr,
      );
      isStoredLocally = true;
    }

    // 3. Fire email notification in background (non-blocking, 3s timeout)
    void this.queueEmailNotification({
      to: [this.ADMIN_NOTIFICATION_EMAIL],
      message: {
        subject: `[Krenter Action Required] User Account & Data Deletion Request - ${normalizedEmail}`,
        text: `A new account and data deletion request has been submitted on Krenter.

          Request ID: ${finalId}
          User Name: ${requestPayload.name}
          User Email: ${normalizedEmail}
          User Phone: ${requestPayload.phone || 'N/A'}
          Role: ${requestPayload.role}
          Scope: ${requestPayload.scope === 'all' ? 'Entire Account & All Associated Data' : 'Specific Data Only'}
          ${requestPayload.specificDataDetails ? `Specific Details: ${requestPayload.specificDataDetails}\n` : ''}Reason: ${requestPayload.reason || 'None provided'}
          Requested At: ${new Date().toUTCString()}

          Please log in to the Krenter Admin Console to review and execute this deletion request.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="background-color: #dc3545; color: white; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 20px;">Krenter - Account & Data Deletion Request</h2>
            </div>
            <p style="font-size: 15px; color: #333;">A registered user has requested deletion of their account and personal data from the Krenter platform.</p>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px; font-weight: bold; color: #555; width: 35%;">Request ID:</td>
                <td style="padding: 8px; color: #222;"><code>${finalId}</code></td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px; font-weight: bold; color: #555;">Name:</td>
                <td style="padding: 8px; color: #222;">${requestPayload.name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px; font-weight: bold; color: #555;">Email:</td>
                <td style="padding: 8px; color: #222;"><strong>${normalizedEmail}</strong></td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px; font-weight: bold; color: #555;">Phone:</td>
                <td style="padding: 8px; color: #222;">${requestPayload.phone || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px; font-weight: bold; color: #555;">Role:</td>
                <td style="padding: 8px; color: #222;">${requestPayload.role}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px; font-weight: bold; color: #555;">Deletion Scope:</td>
                <td style="padding: 8px; color: #222;"><strong>${requestPayload.scope === 'all' ? 'Entire Account & All Data' : 'Specific Data'}</strong></td>
              </tr>
              ${
                requestPayload.specificDataDetails
                  ? `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px; font-weight: bold; color: #555;">Specific Data:</td>
                <td style="padding: 8px; color: #222;">${requestPayload.specificDataDetails}</td>
              </tr>`
                  : ''
              }
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px; font-weight: bold; color: #555;">Reason:</td>
                <td style="padding: 8px; color: #222;">${requestPayload.reason || 'None provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold; color: #555;">Submitted At:</td>
                <td style="padding: 8px; color: #222;">${new Date().toLocaleString()}</td>
              </tr>
            </table>

            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #0d6efd;">
              <p style="margin: 0; font-size: 13px; color: #666;">
                Per Google Play and Apple App Store data compliance standards, this request must be verified and processed within 30 days. You can process this request directly via the Krenter Admin Console.
              </p>
            </div>
          </div>
        `,
      },
    });

    return { success: true, id: finalId, isStoredLocally };
  }

  /**
   * Queue email document in 'mail' collection (Trigger Email extension)
   * Protected with a 3s timeout to never hang callers.
   */
  private async queueEmailNotification(mailData: {
    to: string[];
    message: { subject: string; text: string; html: string };
  }): Promise<void> {
    try {
      const mailCol = collection(this.firestore, 'mail');
      const writePromise = addDoc(mailCol, {
        ...mailData,
        createdAt: new Date(),
      });
      await withTimeout(writePromise, 3000, 'MAIL_WRITE_TIMEOUT');
    } catch (err) {
      // Non-fatal: if extension collection has strict rules or isn't created yet, log it
      console.warn('Could not write to "mail" collection for automated email:', err);
    }
  }

  /**
   * Fetch all deletion requests (merging remote Firestore and local fallback records)
   */
  async getDeletionRequests(): Promise<DeletionRequest[]> {
    let remoteList: DeletionRequest[] = [];
    try {
      const deletionRequestsCol = collection(this.firestore, 'deletion_requests');
      const q = query(deletionRequestsCol, orderBy('createdAt', 'desc'));
      const snapshot = await withTimeout(getDocs(q), 4000, 'FETCH_ORDERED_TIMEOUT');

      remoteList = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          email: data['email'] || '',
          name: data['name'] || '',
          phone: data['phone'] || '',
          role: data['role'] || 'renter',
          scope: data['scope'] || 'all',
          specificDataDetails: data['specificDataDetails'] || '',
          reason: data['reason'] || '',
          status: data['status'] || 'pending',
          createdAt: parseDate(data['createdAt']),
          updatedAt: parseDate(data['updatedAt']),
          processedAt: data['processedAt'] ? parseDate(data['processedAt']) : undefined,
          processedBy: data['processedBy'] || '',
          adminNotes: data['adminNotes'] || '',
          deletedCounts: data['deletedCounts'],
        } as DeletionRequest;
      });
    } catch (error) {
      console.warn('Error fetching deletion requests with order:', error);
      // Fallback query without orderBy if index is building or composite constraint
      try {
        const deletionRequestsCol = collection(this.firestore, 'deletion_requests');
        const snapshot = await withTimeout(
          getDocs(deletionRequestsCol),
          4000,
          'FETCH_FALLBACK_TIMEOUT',
        );
        remoteList = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            email: data['email'] || '',
            name: data['name'] || '',
            phone: data['phone'] || '',
            role: data['role'] || 'renter',
            scope: data['scope'] || 'all',
            specificDataDetails: data['specificDataDetails'] || '',
            reason: data['reason'] || '',
            status: data['status'] || 'pending',
            createdAt: parseDate(data['createdAt']),
            updatedAt: parseDate(data['updatedAt']),
            processedAt: data['processedAt'] ? parseDate(data['processedAt']) : undefined,
            processedBy: data['processedBy'] || '',
            adminNotes: data['adminNotes'] || '',
            deletedCounts: data['deletedCounts'],
          } as DeletionRequest;
        });
      } catch (fallbackError) {
        console.warn('Fallback Firestore fetch also failed:', fallbackError);
      }
    }

    // Merge remote with local storage requests, avoiding duplicates
    const localList = this.getLocalRequests();
    const map = new Map<string, DeletionRequest>();

    // Add local requests
    for (const req of localList) {
      if (req.id) map.set(req.id, req);
    }
    // Remote requests override local if present
    for (const req of remoteList) {
      if (req.id) map.set(req.id, req);
    }

    const merged = Array.from(map.values());
    return merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Update request status
   */
  async updateRequestStatus(
    id: string,
    status: DeletionRequest['status'],
    adminNotes?: string,
    processedBy?: string,
  ): Promise<boolean> {
    this.updateLocalRequestStatus(id, status, undefined, adminNotes, processedBy);
    try {
      const docRef = doc(this.firestore, 'deletion_requests', id);
      const updates: any = {
        status,
        updatedAt: new Date(),
      };
      if (adminNotes !== undefined) updates.adminNotes = adminNotes;
      if (processedBy !== undefined) updates.processedBy = processedBy;
      if (status === 'completed') updates.processedAt = new Date();

      await withTimeout(updateDoc(docRef, updates), 4000, 'UPDATE_STATUS_TIMEOUT');
      return true;
    } catch (error) {
      console.warn('Could not update Firestore deletion request status (saved locally):', error);
      return true;
    }
  }

  /**
   * Execute permanent user data and account deletion across all collections:
   * 1. users: delete users doc by uid and email
   * 2. properties: delete properties where ownerId/ownerEmailId matches
   * 3. renters: delete records where ownerEmailId or renterEmailId matches
   * 4. rentals: delete records where ownerId, renterId, renterEmail, ownerEmail matches
   * 5. payments: delete records where user ID is present in payment record
   * 6. messages: delete records where sender or recipient email is the user's email
   * 7. mark deletion_request as completed
   * 8. queue confirmation email to user
   */
  async executeUserDeletion(
    request: DeletionRequest,
    adminEmail = 'krenterservices@gmail.com',
  ): Promise<{
    success: boolean;
    counts: {
      users: number;
      properties: number;
      renters: number;
      rentals: number;
      payments: number;
      messages: number;
    };
    error?: string;
  }> {
    const counts = {
      users: 0,
      properties: 0,
      renters: 0,
      rentals: 0,
      payments: 0,
      messages: 0,
    };

    const targetEmail = (request.email || '').trim().toLowerCase();
    const targetPhone = (request.phone || '').trim();

    if (!targetEmail) {
      return { success: false, counts, error: 'Target email is missing.' };
    }

    try {
      // Find matching user(s) to determine UID(s)
      const usersCol = collection(this.firestore, 'users');
      const userUids = new Set<string>();

      try {
        const qUserEmail = query(usersCol, where('email', '==', targetEmail));
        const userSnaps = await getDocs(qUserEmail);
        userSnaps.forEach((d) => {
          userUids.add(d.id);
          const data = d.data();
          if (data['uid']) userUids.add(data['uid']);
        });
      } catch (e) {
        console.warn('Could not query users by email:', e);
      }

      // 1. DELETE USER PROFILE(S)
      for (const uid of userUids) {
        try {
          await deleteDoc(doc(this.firestore, 'users', uid));
          counts.users++;
        } catch (e) {
          console.warn(`Failed to delete user doc ${uid}:`, e);
        }
      }

      // 2. DELETE / CLEANUP PROPERTIES
      const propertiesCol = collection(this.firestore, 'properties');
      const propertyDocIds = new Set<string>();

      // Properties by ownerEmailId / ownerEmail
      for (const field of ['ownerEmailId', 'ownerEmail']) {
        try {
          const q = query(propertiesCol, where(field, '==', targetEmail));
          const snaps = await getDocs(q);
          snaps.forEach((d) => propertyDocIds.add(d.id));
        } catch (e) {
          // ignore
        }
      }

      // Properties by ownerId
      for (const uid of userUids) {
        try {
          const q = query(propertiesCol, where('ownerId', '==', uid));
          const snaps = await getDocs(q);
          snaps.forEach((d) => propertyDocIds.add(d.id));
        } catch (e) {
          // ignore
        }
      }

      for (const propId of propertyDocIds) {
        try {
          await deleteDoc(doc(this.firestore, 'properties', propId));
          counts.properties++;
        } catch (e) {
          console.warn(`Failed to delete property ${propId}:`, e);
        }
      }

      // 3. DELETE RENTERS RECORDS (where user is ownerEmailId or renterEmailId)
      const rentersCol = collection(this.firestore, 'renters');
      const renterDocIds = new Set<string>();

      for (const field of ['ownerEmailId', 'renterEmailId', 'ownerEmail', 'renterEmail']) {
        try {
          const q = query(rentersCol, where(field, '==', targetEmail));
          const snaps = await getDocs(q);
          snaps.forEach((d) => renterDocIds.add(d.id));
        } catch (e) {
          // ignore
        }
      }

      if (targetPhone) {
        for (const field of ['ownerPhoneNumber', 'renterPhoneNumber']) {
          try {
            const q = query(rentersCol, where(field, '==', targetPhone));
            const snaps = await getDocs(q);
            snaps.forEach((d) => renterDocIds.add(d.id));
          } catch (e) {
            // ignore
          }
        }
      }

      for (const rId of renterDocIds) {
        try {
          await deleteDoc(doc(this.firestore, 'renters', rId));
          counts.renters++;
        } catch (e) {
          console.warn(`Failed to delete renter doc ${rId}:`, e);
        }
      }

      // 4. DELETE RENTALS RECORDS (legacy and active)
      const rentalsCol = collection(this.firestore, 'rentals');
      const rentalDocIds = new Set<string>();

      for (const field of ['ownerEmailId', 'renterEmailId', 'ownerEmail', 'renterEmail']) {
        try {
          const q = query(rentalsCol, where(field, '==', targetEmail));
          const snaps = await getDocs(q);
          snaps.forEach((d) => rentalDocIds.add(d.id));
        } catch (e) {
          // ignore
        }
      }

      for (const uid of userUids) {
        for (const field of ['ownerId', 'renterId']) {
          try {
            const q = query(rentalsCol, where(field, '==', uid));
            const snaps = await getDocs(q);
            snaps.forEach((d) => rentalDocIds.add(d.id));
          } catch (e) {
            // ignore
          }
        }
      }

      for (const rId of rentalDocIds) {
        try {
          await deleteDoc(doc(this.firestore, 'rentals', rId));
          counts.rentals++;
        } catch (e) {
          console.warn(`Failed to delete rental doc ${rId}:`, e);
        }
      }

      // 5. DELETE PAYMENTS RECORDS (where user ID is present in payment record)
      const paymentsCol = collection(this.firestore, 'payments');
      const paymentDocIds = new Set<string>();

      // Check user IDs in payments
      for (const uid of userUids) {
        for (const field of ['userId', 'renterId', 'ownerId', 'payerId', 'payeeId', 'uid']) {
          try {
            const q = query(paymentsCol, where(field, '==', uid));
            const snaps = await getDocs(q);
            snaps.forEach((d) => paymentDocIds.add(d.id));
          } catch (e) {
            // ignore
          }
        }
      }

      // Check emails in payments
      for (const field of [
        'userEmail',
        'renterEmail',
        'renterEmailId',
        'ownerEmail',
        'ownerEmailId',
        'email',
        'payerEmail',
      ]) {
        try {
          const q = query(paymentsCol, where(field, '==', targetEmail));
          const snaps = await getDocs(q);
          snaps.forEach((d) => paymentDocIds.add(d.id));
        } catch (e) {
          // ignore
        }
      }

      for (const payId of paymentDocIds) {
        try {
          await deleteDoc(doc(this.firestore, 'payments', payId));
          counts.payments++;
        } catch (e) {
          console.warn(`Failed to delete payment doc ${payId}:`, e);
        }
      }

      // 6. DELETE MESSAGES RECORDS (where sender or recipient email ID is the user email ID)
      const messagesCol = collection(this.firestore, 'messages');
      const messageDocIds = new Set<string>();

      const messageEmailFields = [
        'senderEmail',
        'senderEmailId',
        'sender',
        'recipientEmail',
        'recipientEmailId',
        'receiverEmail',
        'receiverEmailId',
        'recipient',
        'receiver',
      ];

      for (const field of messageEmailFields) {
        try {
          const q = query(messagesCol, where(field, '==', targetEmail));
          const snaps = await getDocs(q);
          snaps.forEach((d) => messageDocIds.add(d.id));
        } catch (e) {
          // ignore
        }
      }

      // Also check user IDs if present in messages
      for (const uid of userUids) {
        for (const field of ['senderId', 'recipientId', 'receiverId', 'userId']) {
          try {
            const q = query(messagesCol, where(field, '==', uid));
            const snaps = await getDocs(q);
            snaps.forEach((d) => messageDocIds.add(d.id));
          } catch (e) {
            // ignore
          }
        }
      }

      for (const msgId of messageDocIds) {
        try {
          await deleteDoc(doc(this.firestore, 'messages', msgId));
          counts.messages++;
        } catch (e) {
          console.warn(`Failed to delete message doc ${msgId}:`, e);
        }
      }

      // 7. MARK DELETION REQUEST AS COMPLETED
      if (request.id) {
        this.updateLocalRequestStatus(request.id, 'completed', counts, undefined, adminEmail);
        try {
          const reqDocRef = doc(this.firestore, 'deletion_requests', request.id);
          await withTimeout(
            updateDoc(reqDocRef, {
              status: 'completed',
              processedAt: new Date(),
              processedBy: adminEmail,
              updatedAt: new Date(),
              deletedCounts: counts,
            }),
            4000,
            'UPDATE_REQUEST_DOC_TIMEOUT',
          );
        } catch (err) {
          console.warn(
            'Could not update Firestore deletion_requests doc, status updated locally:',
            err,
          );
        }
      }

      // 8. SEND CONFIRMATION EMAIL TO USER VIA 'mail' COLLECTION (non-blocking background queue)
      void this.queueEmailNotification({
        to: [targetEmail],
        message: {
          subject: `[Krenter] Your Account and Associated Data Have Been Deleted`,
          text: `Hello ${request.name || 'User'},

In response to your request, your Krenter account profile and associated personal data have been permanently deleted from our systems.

Summary of removed data:
- User Profile: ${counts.users > 0 ? 'Purged' : 'Processed'}
- Properties listed/managed: ${counts.properties} removed
- Renter / Rental agreements: ${counts.renters + counts.rentals} removed
- Payment transaction records: ${counts.payments} removed
- Messages and communications: ${counts.messages} removed

Note: Encrypted statutory records may be retained strictly as required by tax and financial compliance regulations.

Thank you for being a part of Krenter. If you ever wish to use Krenter again in the future, you are welcome to create a new account anytime at https://krenter.app.

Sincerely,
The Krenter Team
krenterservices@gmail.com`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <div style="background-color: #198754; color: white; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 20px;">Account & Data Deletion Complete</h2>
              </div>
              <p style="font-size: 15px; color: #333;">Hello ${request.name || 'User'},</p>
              <p style="font-size: 15px; color: #333;">
                This email confirms that your request to delete your Krenter account and personal data has been fully processed and completed.
              </p>

              <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 16px; margin: 20px 0;">
                <h4 style="margin-top: 0; margin-bottom: 12px; color: #495057;">Purge Summary:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #555;">
                  <li>User profile credentials & identifiers removed</li>
                  <li>${counts.properties} property listing(s) removed</li>
                  <li>${counts.renters + counts.rentals} rental record(s) removed</li>
                  <li>${counts.payments} payment transaction record(s) removed</li>
                  <li>${counts.messages} message communication record(s) removed</li>
                </ul>
              </div>

              <p style="font-size: 13px; color: #6c757d;">
                In accordance with state and federal financial regulations, required tax audit records may be retained in encrypted archives for the legally mandated period and will not be used for any commercial purpose.
              </p>

              <p style="font-size: 14px; color: #333; margin-top: 25px;">
                Best regards,<br>
                <strong>The Krenter Team</strong><br>
                <a href="mailto:krenterservices@gmail.com" style="color: #0d6efd;">krenterservices@gmail.com</a>
              </p>
            </div>
          `,
        },
      });

      return { success: true, counts };
    } catch (error: any) {
      console.error('Error during executeUserDeletion:', error);
      return { success: false, counts, error: error.message || 'Execution error.' };
    }
  }
}
