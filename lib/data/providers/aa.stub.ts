import { db } from "@/lib/db";
import { DataProvider } from "./index";

/**
 * Account Aggregator (AA) Stub Provider:
 *
 * Per RBI/Sahamati guidelines:
 * - Only regulated entities (banks, NBFCs, SEBI/IRDAI registered) can register as FIUs (Financial Information Users).
 * - Centsible operates via a regulated partner gateway (e.g. Setu, Finvu, OneMoney).
 *
 * Flow:
 * 1. Consent Request created with DataLife, Frequency, DataConsumer info.
 * 2. User redirected to AA Consent Handle (e.g. user@onemoney) via web/mobile app.
 * 3. User approves consent artifact with OTP.
 * 4. FIU queries session for encrypted JSON payload (FIP financial data).
 * 5. Centsible decrypts payload using ephemeral key pair and ingests accounts/transactions.
 */
export const AAProvider: DataProvider = {
  id: "aa",
  name: "Account Aggregator Simulation (Setu/Finvu architecture)",
  async syncAccountData(userId: string, inputData?: { institution: string; consentHandle: string }) {
    const institution = inputData?.institution || "HDFC Bank";
    const accId = `acc_aa_${Date.now()}`;

    // 1. Create linked AA Account record
    await db.account.create({
      data: {
        id: accId,
        userId,
        type: "savings",
        institution,
        name: `${institution} Savings (AA Synced)`,
        mask: "8472",
        balance: 35000,
        provider: "aa",
      },
    });

    // 2. Purpose-stamped Consent Record per DPDP Act 2025 guidelines
    await db.consentRecord.create({
      data: {
        userId,
        sourceId: accId,
        purpose: "Real-time borrowing emergency decision support & surplus analysis",
        dataTypes: JSON.stringify(["PROFILE", "SUMMARY", "TRANSACTIONS"]),
        fromDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        toDate: new Date().toISOString().split("T")[0],
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    // 3. Log in Audit Log
    await db.auditLog.create({
      data: {
        userId,
        action: "CONSENT_GRANTED",
        entity: "AccountAggregator",
        details: `Simulated consent approved for ${institution} (handle: ${inputData?.consentHandle || "self@onemoney"})`,
      },
    });

    return {
      success: true,
      accountsCount: 1,
      transactionsCount: 0,
    };
  },
};

