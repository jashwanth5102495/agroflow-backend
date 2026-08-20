import { AuditLog } from '../models/AuditLog';

interface AuditLogData {
  shopId: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: any;
  after?: any;
  ipAddress?: string;
  userAgent?: string;
}

export const createAuditLog = async (data: AuditLogData) => {
  try {
    // Avoid storing sensitive data like passwords or tokens
    if (data.before && data.before.passwordHash) delete data.before.passwordHash;
    if (data.after && data.after.passwordHash) delete data.after.passwordHash;

    const log = new AuditLog(data);
    await log.save();
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to prevent failing the main transaction if logging fails
  }
};
