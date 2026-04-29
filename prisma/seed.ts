import { PrismaClient } from "@prisma/client";
import {
  accounts,
  assetSnapshots,
  categories,
  entities,
  investmentSnapshots,
  liabilitySnapshots,
  transactions,
} from "../src/server/demo-data";

const prisma = new PrismaClient();

async function main() {
  await prisma.transactionTagOnTransaction.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.accountBalanceSnapshot.deleteMany();
  await prisma.investmentSnapshot.deleteMany();
  await prisma.investmentPosition.deleteMany();
  await prisma.investmentAccount.deleteMany();
  await prisma.assetSnapshot.deleteMany();
  await prisma.propertyValuation.deleteMany();
  await prisma.property.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.liabilitySnapshot.deleteMany();
  await prisma.liability.deleteMany();
  await prisma.connectedAccount.deleteMany();
  await prisma.connectedInstitution.deleteMany();
  await prisma.transactionCategory.deleteMany();
  await prisma.entity.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: "founder@example.com",
      name: "Dutch Founder Investor",
    },
  });

  const entityMap = new Map<string, string>();
  for (const entity of entities) {
    const created = await prisma.entity.create({
      data: {
        userId: user.id,
        name: entity.name,
        type: entity.type,
      },
    });
    entityMap.set(entity.id, created.id);
  }

  const categoryMap = new Map<string, string>();
  for (const category of categories) {
    const created = await prisma.transactionCategory.create({
      data: {
        userId: user.id,
        name: category.name,
        color: category.color,
        isSystem: category.isSystem ?? false,
      },
    });
    categoryMap.set(category.id, created.id);
  }

  const institutionBySource = new Map<string, string>();
  for (const source of ["ABN_AMRO", "BITVAVO", "REVOLUT", "DEGIRO", "MANUAL"] as const) {
    const institution = await prisma.connectedInstitution.create({
      data: {
        userId: user.id,
        provider: source,
        displayName: source,
        status: source === "MANUAL" ? "MANUAL_ONLY" : "CONNECTED",
        lastSyncAt: new Date("2026-04-29T08:00:00.000Z"),
      },
    });
    institutionBySource.set(source, institution.id);
  }

  const accountMap = new Map<string, string>();
  for (const account of accounts) {
    const created = await prisma.connectedAccount.create({
      data: {
        institutionId: institutionBySource.get(account.source),
        entityId: entityMap.get(account.entityId)!,
        externalAccountId: account.id,
        name: account.name,
        source: account.source,
        accountClass: account.class,
        liquidity: account.liquidity,
        currentBalance: account.balance,
        syncStatus: account.syncStatus,
        includeInConsolidated: account.includeInConsolidated,
        lastSyncedAt: new Date(account.lastUpdated),
      },
    });
    accountMap.set(account.id, created.id);
  }

  for (const transaction of transactions) {
    await prisma.transaction.create({
      data: {
        accountId: accountMap.get(transaction.accountId)!,
        entityId: entityMap.get(transaction.entityId)!,
        categoryId: categoryMap.get(transaction.categoryId)!,
        externalTransactionId: transaction.id,
        date: new Date(transaction.date),
        description: transaction.description,
        counterparty: transaction.counterparty,
        amount: transaction.amount,
        direction: transaction.direction,
        isInternalTransfer: transaction.isInternalTransfer,
        isInvestmentRelated: transaction.isInvestmentRelated,
        liquidityImpact: transaction.liquidityImpact,
        notes: transaction.notes,
      },
    });
  }

  const assetMap = new Map<string, string>();
  const latestAssetSnapshots = assetSnapshots.filter((snapshot) => snapshot.month === "2026-04");
  for (const snapshot of latestAssetSnapshots) {
    const asset = await prisma.asset.create({
      data: {
        entityId: entityMap.get(snapshot.entityId)!,
        accountId: accountMap.get(snapshot.accountId),
        name: snapshot.accountId,
        assetClass: snapshot.assetClass,
        liquidity: snapshot.liquidity,
      },
    });
    assetMap.set(snapshot.accountId, asset.id);
  }

  for (const snapshot of assetSnapshots) {
    await prisma.assetSnapshot.create({
      data: {
        assetId: assetMap.get(snapshot.accountId)!,
        month: new Date(`${snapshot.month}-01`),
        value: snapshot.value,
        source: "demo-seed",
      },
    });
  }

  const liabilityMap = new Map<string, string>();
  for (const snapshot of liabilitySnapshots.filter((item) => item.month === "2026-04")) {
    const liability = await prisma.liability.create({
      data: {
        entityId: entityMap.get(snapshot.entityId)!,
        name: snapshot.name,
        liabilityClass: "LIABILITY",
        liquidity: snapshot.liquidity,
      },
    });
    liabilityMap.set(snapshot.name, liability.id);
  }

  for (const snapshot of liabilitySnapshots) {
    await prisma.liabilitySnapshot.create({
      data: {
        liabilityId: liabilityMap.get(snapshot.name)!,
        month: new Date(`${snapshot.month}-01`),
        value: snapshot.value,
        source: "demo-seed",
      },
    });
  }

  const investmentAccountMap = new Map<string, string>();
  for (const accountId of ["acc-bitvavo", "acc-degiro"]) {
    const investmentAccount = await prisma.investmentAccount.create({
      data: {
        accountId: accountMap.get(accountId)!,
        provider: accountId === "acc-bitvavo" ? "BITVAVO" : "DEGIRO",
      },
    });
    investmentAccountMap.set(accountId, investmentAccount.id);
  }

  for (const snapshot of investmentSnapshots) {
    await prisma.investmentSnapshot.create({
      data: {
        investmentAccountId: investmentAccountMap.get(snapshot.accountId)!,
        month: new Date(`${snapshot.month}-01`),
        contributed: snapshot.contributed,
        currentValue: snapshot.currentValue,
        realizedGainLoss: snapshot.realizedGainLoss,
        unrealizedGainLoss: snapshot.currentValue - snapshot.contributed,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
