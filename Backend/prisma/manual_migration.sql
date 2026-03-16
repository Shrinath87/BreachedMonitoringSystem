-- ──────────────────────────────────────────────────────────────────────────────
-- Migration: Add MonitoredEmail and BreachRecord tables
-- Run this manually if Prisma migrate fails (e.g., when DB was offline)
--
-- Command:  npx prisma migrate dev --name add_monitoring_tables
-- Or apply SQL directly:
--   mysql -u root -p breach_monitor < prisma/manual_migration.sql
-- ──────────────────────────────────────────────────────────────────────────────

-- Table: MonitoredEmail
CREATE TABLE IF NOT EXISTS `MonitoredEmail` (
    `id`             INTEGER NOT NULL AUTO_INCREMENT,
    `userId`         INTEGER NOT NULL,
    `monitoredEmail` VARCHAR(191) NOT NULL,
    `createdAt`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `MonitoredEmail_userId_monitoredEmail_key`(`userId`, `monitoredEmail`),
    PRIMARY KEY (`id`),
    CONSTRAINT `MonitoredEmail_userId_fkey`
        FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Table: BreachRecord
CREATE TABLE IF NOT EXISTS `BreachRecord` (
    `id`               INTEGER NOT NULL AUTO_INCREMENT,
    `monitoredEmailId` INTEGER NOT NULL,
    `breachName`       VARCHAR(191) NOT NULL,
    `breachDate`       VARCHAR(191) NULL,
    `description`      TEXT NULL,
    `dataClasses`      TEXT NULL,
    `createdAt`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BreachRecord_monitoredEmailId_breachName_key`(`monitoredEmailId`, `breachName`),
    PRIMARY KEY (`id`),
    CONSTRAINT `BreachRecord_monitoredEmailId_fkey`
        FOREIGN KEY (`monitoredEmailId`) REFERENCES `MonitoredEmail`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
