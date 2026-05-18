import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting currency migration...');

  // 1. Debts
  const debts = await prisma.debt.findMany();
  let debtCount = 0;
  for (const debt of debts) {
    if (debt.currency !== 'TRY' && debt.fxRate && debt.fxRate > 1) {
      const nativeAmount = debt.amount / debt.fxRate;
      const nativePrincipal = debt.principalAmount ? debt.principalAmount / debt.fxRate : null;
      const nativeInstallment = debt.installmentAmount ? debt.installmentAmount / debt.fxRate : null;

      await prisma.debt.update({
        where: { id: debt.id },
        data: {
          amount: nativeAmount,
          principalAmount: nativePrincipal,
          installmentAmount: nativeInstallment,
          originalAmount: nativeAmount,
        }
      });
      debtCount++;
    }
  }
  console.log(`Migrated ${debtCount} debts.`);

  // 2. Fixed Assets
  const assets = await prisma.fixedAsset.findMany();
  let assetCount = 0;
  for (const asset of assets) {
    if (asset.currency !== 'TRY' && asset.fxRate && asset.fxRate > 1) {
      const nativeValue = asset.value / asset.fxRate;
      await prisma.fixedAsset.update({
        where: { id: asset.id },
        data: {
          value: nativeValue,
          originalAmount: nativeValue,
        }
      });
      assetCount++;
    }
  }
  console.log(`Migrated ${assetCount} fixed assets.`);

  // 3. Incomes
  const incomes = await prisma.income.findMany();
  let incomeCount = 0;
  for (const income of incomes) {
    if (income.currency !== 'TRY' && income.fxRate && income.fxRate > 1) {
      const nativeAmount = income.amount / income.fxRate;
      await prisma.income.update({
        where: { id: income.id },
        data: {
          amount: nativeAmount,
          originalAmount: nativeAmount,
        }
      });
      incomeCount++;
    }
  }
  console.log(`Migrated ${incomeCount} incomes.`);

  // 4. Expenses
  const expenses = await prisma.expense.findMany();
  let expenseCount = 0;
  for (const expense of expenses) {
    if (expense.currency !== 'TRY' && expense.fxRate && expense.fxRate > 1) {
      const nativeAmount = expense.amount / expense.fxRate;
      await prisma.expense.update({
        where: { id: expense.id },
        data: {
          amount: nativeAmount,
          originalAmount: nativeAmount,
        }
      });
      expenseCount++;
    }
  }
  console.log(`Migrated ${expenseCount} expenses.`);

  console.log('Migration completed successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
