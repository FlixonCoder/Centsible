import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getSessionUserId();
    const { id } = params;
    const body = await request.json();

    const { category, subcategory, userFlag, applyToSimilar } = body;

    // Verify transaction belongs to session user
    const txn = await db.transaction.findFirst({
      where: {
        id,
        account: { userId },
      },
    });

    if (!txn) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const updated = await db.transaction.update({
      where: { id },
      data: {
        ...(category ? { category, categorySource: "user" } : {}),
        ...(subcategory !== undefined ? { subcategory } : {}),
        ...(userFlag !== undefined ? { userFlag } : {}),
      },
    });

    let rulesCreated = 0;
    let similarUpdated = 0;

    // If applyToSimilar is requested, create CategoryRule and update all matching transactions
    if (applyToSimilar && category && txn.merchant) {
      const pattern = txn.merchant.trim().toLowerCase();

      await db.categoryRule.create({
        data: {
          userId,
          matchType: "contains",
          pattern,
          category,
          subcategory: subcategory || null,
        },
      });
      rulesCreated++;

      // Update all transactions of this user matching this merchant
      const matchingTxns = await db.transaction.findMany({
        where: {
          account: { userId },
          merchant: { contains: txn.merchant },
        },
      });

      if (matchingTxns.length > 0) {
        await db.transaction.updateMany({
          where: {
            account: { userId },
            merchant: { contains: txn.merchant },
          },
          data: {
            category,
            subcategory: subcategory || null,
            categorySource: "rule",
          },
        });
        similarUpdated = matchingTxns.length;
      }
    }

    return NextResponse.json({
      success: true,
      transaction: updated,
      rulesCreated,
      similarUpdated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

