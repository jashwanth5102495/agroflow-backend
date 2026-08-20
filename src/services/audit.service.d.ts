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
export declare const createAuditLog: (data: AuditLogData) => Promise<void>;
export {};
//# sourceMappingURL=audit.service.d.ts.map