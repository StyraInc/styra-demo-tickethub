/*
  Warnings:

  - You are about to drop the column `tenantId` on the `Customers` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `Tickets` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `Tickets` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenant,name]` on the table `Customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Tenants` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenant` to the `Customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customer` to the `Tickets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenant` to the `Tickets` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Customers" DROP CONSTRAINT "Customers_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Tickets" DROP CONSTRAINT "Tickets_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Tickets" DROP CONSTRAINT "Tickets_tenantId_fkey";

-- AlterTable
ALTER TABLE "Customers" DROP COLUMN "tenantId",
ADD COLUMN     "tenant" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Tickets" DROP COLUMN "customerId",
DROP COLUMN "tenantId",
ADD COLUMN     "assignee" INTEGER,
ADD COLUMN     "customer" INTEGER NOT NULL,
ADD COLUMN     "tenant" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Users" (
    "id" SERIAL NOT NULL,
    "tenant" INTEGER NOT NULL,
    "name" VARCHAR(255),

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_tenant_name_key" ON "Users"("tenant", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Customers_tenant_name_key" ON "Customers"("tenant", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Tenants_name_key" ON "Tenants"("name");

-- AddForeignKey
ALTER TABLE "Customers" ADD CONSTRAINT "Customers_tenant_fkey" FOREIGN KEY ("tenant") REFERENCES "Tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Tickets" ADD CONSTRAINT "Tickets_customer_fkey" FOREIGN KEY ("customer") REFERENCES "Customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Tickets" ADD CONSTRAINT "Tickets_tenant_fkey" FOREIGN KEY ("tenant") REFERENCES "Tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Tickets" ADD CONSTRAINT "Tickets_assignee_fkey" FOREIGN KEY ("assignee") REFERENCES "Users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_tenant_fkey" FOREIGN KEY ("tenant") REFERENCES "Tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
