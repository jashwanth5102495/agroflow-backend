export interface DailyReportData {
    shopName: string;
    ownerName: string;
    phone: string;
    district: string;
    state: string;
    dateStr: string;
    summary: {
        totalSales: number;
        totalCash: number;
        totalCredit: number;
        totalCount: number;
    };
    salesDetails: Array<{
        invoiceNumber: string;
        farmerName: string;
        farmerPhone: string;
        village: string;
        items: Array<{
            name: string;
            qty: number;
            unitPrice: number;
            total: number;
        }>;
        total: number;
        paid: number;
        due: number;
        paymentMethod: string;
    }>;
    creditFarmers: Array<{
        farmerName: string;
        phone: string;
        village: string;
        balance: number;
    }>;
    lowStockItems: Array<{
        name: string;
        sku?: string;
        quantity: number;
        minimumStock: number;
        unit: string;
    }>;
}
/**
 * Fetch all report data for a specific shop and date
 */
export declare const fetchDailyReportData: (shopId: string, dateStr: string) => Promise<DailyReportData>;
/**
 * Generate a PDF Buffer containing the complete bilingual daily sales and credit report
 */
export declare const generateDailyReportPDF: (reportData: DailyReportData) => Promise<Buffer>;
//# sourceMappingURL=pdfReport.service.d.ts.map