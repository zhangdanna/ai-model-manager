-- CreateTable
CREATE TABLE `Battle` (
    `id` VARCHAR(191) NOT NULL,
    `prompt` TEXT NOT NULL,
    `modelAId` VARCHAR(191) NOT NULL,
    `modelBId` VARCHAR(191) NOT NULL,
    `resultA` LONGTEXT NOT NULL,
    `resultB` LONGTEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Battle` ADD CONSTRAINT `Battle_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE CASCADE;