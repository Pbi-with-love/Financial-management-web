-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "replaced_by_expense_id" TEXT,
ADD COLUMN     "replaces_expense_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "expenses_replaces_expense_id_key" ON "expenses"("replaces_expense_id");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_replaced_by_expense_id_key" ON "expenses"("replaced_by_expense_id");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_replaces_expense_id_fkey" FOREIGN KEY ("replaces_expense_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_replaced_by_expense_id_fkey" FOREIGN KEY ("replaced_by_expense_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
