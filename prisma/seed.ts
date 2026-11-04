import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function seedPersona(filename: string) {
  const filePath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`Seed file not found: ${filePath}`);
    return;
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  const u = data.user;
  const bureauScore = data.bureau?.score || (u.id === "arjun" ? 688 : 704);
  const bufferAmount = data.expectedDeckFigures?.buffer || 2000;

  console.log(`Seeding persona: ${u.name} (${u.id})...`);

  // 1. User
  await prisma.user.upsert({
    where: { id: u.id },
    update: {
      name: u.name,
      age: u.age,
      city: u.city || "Bengaluru",
      occupation: u.occupation,
      incomeType: u.incomeType,
      language: u.language || "en",
      livesWithFamily: Boolean(u.livesWithFamily),
      bureauScore,
      bufferAmount,
      bufferMode: "fixed",
      incomeBasis: "average",
      calmMode: false,
    },
    create: {
      id: u.id,
      name: u.name,
      age: u.age,
      city: u.city || "Bengaluru",
      occupation: u.occupation,
      incomeType: u.incomeType,
      language: u.language || "en",
      livesWithFamily: Boolean(u.livesWithFamily),
      bureauScore,
      bufferAmount,
      bufferMode: "fixed",
      incomeBasis: "average",
      calmMode: false,
    },
  });

  // Clean old dependent data for this user to ensure clean seed
  await prisma.transaction.deleteMany({
    where: { account: { userId: u.id } },
  });
  await prisma.obligation.deleteMany({ where: { userId: u.id } });
  await prisma.expenseEvent.deleteMany({ where: { userId: u.id } });
  await prisma.planAction.deleteMany({ where: { userId: u.id } });
  await prisma.consentRecord.deleteMany({ where: { userId: u.id } });
  await prisma.account.deleteMany({ where: { userId: u.id } });

  // 2. Accounts
  for (const acc of data.accounts || []) {
    await prisma.account.create({
      data: {
        id: acc.id,
        userId: u.id,
        type: acc.type,
        institution: acc.institution,
        name: acc.name,
        mask: acc.mask || "0000",
        balance: acc.balance || 0,
        limit: acc.limit || 0,
        outstanding: acc.outstanding || 0,
        apr: acc.apr || 0,
        statementDay: acc.statementDay || null,
        dueDay: acc.dueDay || null,
        monthlyPayment: acc.monthlyPayment || 0,
        earmarkedEmergencySavings: acc.earmarkedEmergencySavings || 0,
        provider: "seed",
      },
    });

    // Create consent record for Account Aggregator transparency
    await prisma.consentRecord.create({
      data: {
        userId: u.id,
        sourceId: acc.id,
        purpose: "Affordability assessment and expense categorization",
        dataTypes: JSON.stringify(["PROFILE", "SUMMARY", "TRANSACTIONS"]),
        fromDate: "2026-05-01",
        toDate: "2026-11-03",
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // 3. Obligations
  for (const ob of data.obligations || []) {
    await prisma.obligation.create({
      data: {
        id: `${u.id}_${ob.id}`,
        userId: u.id,
        accountId: ob.accountId || null,
        kind: ob.kind,
        name: ob.name,
        monthlyAmount: ob.monthlyAmount,
        outstanding: ob.outstanding || 0,
        apr: ob.apr || 0,
        dueDay: ob.dueDay || null,
        remainingMonths: ob.remainingMonths !== undefined ? ob.remainingMonths : null,
        matchedToBank: true,
        note: ob.note || null,
      },
    });
  }

  // 4. Emergency Event
  if (data.emergency) {
    const em = data.emergency;
    await prisma.expenseEvent.create({
      data: {
        id: em.id,
        userId: u.id,
        title: em.title,
        provider: em.provider || null,
        category: em.category || "medical",
        amount: em.amount,
        due: em.due,
        urgency: em.urgency || "high",
        canDelay: Boolean(em.canDelay),
        providerOffersInstalments: em.providerOffersInstalments || "unknown",
        status: "active",
      },
    });
  }

  // 5. Default Plan Actions / Suggestions
  const rarelyUsed = data.userFlags?.rarelyUsedSubscriptions || [];
  const defaultActions = [
    {
      actionId: "cut_food_delivery",
      type: "food",
      title: "Batch meal-prep & cook 3 weekdays",
      monthlyImpact: 1200,
    },
    {
      actionId: "cut_cab_rides",
      type: "transport",
      title: "Switch regular commute to Metro / Bus",
      monthlyImpact: 700,
    },
    {
      actionId: "pause_subscriptions",
      type: "subscription",
      title: rarelyUsed.length > 0
        ? `Pause dormant subscriptions (${rarelyUsed.join(", ")})`
        : "Pause 2 rarely-used streaming & gym apps",
      monthlyImpact: u.id === "priya" ? 583 : 400,
    },
    {
      actionId: "cap_impulse_shopping",
      type: "shopping",
      title: "Set a monthly impulse spend cap",
      monthlyImpact: 800,
    },
  ];

  for (const act of defaultActions) {
    await prisma.planAction.create({
      data: {
        id: `${u.id}_${act.actionId}`,
        userId: u.id,
        actionId: act.actionId,
        type: act.type,
        title: act.title,
        monthlyImpact: act.monthlyImpact,
        status: "accepted", // Default accepted so honest story holds
        acceptedAt: new Date(),
      },
    });
  }

  // 6. Transactions
  if (Array.isArray(data.transactions) && data.transactions.length > 0) {
    const txns = data.transactions.map((t: any) => ({
      accountId: t.accountId,
      date: t.date,
      time: t.time || null,
      amount: t.amount,
      channel: t.channel || "UPI",
      narration: t.narration || "",
      merchant: t.merchant || "Unknown Merchant",
      category: t.category || "personal_misc",
      subcategory: t.subcategory || null,
      isRecurring: Boolean(t.isRecurring),
      isFlexible: t.isFlexible !== undefined ? Boolean(t.isFlexible) : true,
      userFlag: t.userFlag || null,
      categorySource: "import",
      balanceAfter: t.balanceAfter !== undefined ? t.balanceAfter : null,
    }));

    // In SQLite, chunk insertions to prevent variable limits
    const CHUNK_SIZE = 50;
    for (let i = 0; i < txns.length; i += CHUNK_SIZE) {
      const chunk = txns.slice(i, i + CHUNK_SIZE);
      await prisma.transaction.createMany({
        data: chunk,
      });
    }
    console.log(`Inserted ${txns.length} transactions for ${u.name}`);
  }
}

async function main() {
  console.log("Starting database seed...");
  await seedPersona("priya.json");
  await seedPersona("arjun.json");
  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
