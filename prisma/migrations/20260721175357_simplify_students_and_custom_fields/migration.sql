/*
  Warnings:

  - You are about to drop the column `created_by` on the `custom_field_definitions` table. All the data in the column will be lost.
  - You are about to drop the column `default_value` on the `custom_field_definitions` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `custom_field_definitions` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_by` on the `custom_field_definitions` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `custom_field_definitions` table. All the data in the column will be lost.
  - You are about to drop the column `entity` on the `custom_field_definitions` table. All the data in the column will be lost.
  - You are about to drop the column `help_text` on the `custom_field_definitions` table. All the data in the column will be lost.
  - You are about to drop the column `is_searchable` on the `custom_field_definitions` table. All the data in the column will be lost.
  - You are about to drop the column `is_visible` on the `custom_field_definitions` table. All the data in the column will be lost.
  - You are about to drop the column `placeholder` on the `custom_field_definitions` table. All the data in the column will be lost.
  - You are about to drop the column `required` on the `custom_field_definitions` table. All the data in the column will be lost.
  - You are about to drop the column `section` on the `custom_field_definitions` table. All the data in the column will be lost.
  - You are about to drop the column `unique_value` on the `custom_field_definitions` table. All the data in the column will be lost.
  - You are about to drop the column `updated_by` on the `custom_field_definitions` table. All the data in the column will be lost.
  - You are about to drop the column `validation_json` on the `custom_field_definitions` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `student_custom_field_values` table. All the data in the column will be lost.
  - You are about to drop the column `address_line1` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `address_line2` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_by` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `dob` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `father_name` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `father_phone` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `mother_name` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `mother_phone` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `photo_document_id` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `pincode` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `updated_by` on the `students` table. All the data in the column will be lost.
  - Changed the type of `storage_provider` on the `documents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_photo_document_id_fkey";

-- DropIndex
DROP INDEX "custom_field_definitions_entity_is_active_idx";

-- DropIndex
DROP INDEX "custom_field_definitions_key_idx";

-- DropIndex
DROP INDEX "student_custom_field_values_field_id_idx";

-- DropIndex
DROP INDEX "students_deleted_at_idx";

-- DropIndex
DROP INDEX "students_status_idx";

-- AlterTable
ALTER TABLE "custom_field_definitions" DROP COLUMN "created_by",
DROP COLUMN "default_value",
DROP COLUMN "deleted_at",
DROP COLUMN "deleted_by",
DROP COLUMN "description",
DROP COLUMN "entity",
DROP COLUMN "help_text",
DROP COLUMN "is_searchable",
DROP COLUMN "is_visible",
DROP COLUMN "placeholder",
DROP COLUMN "required",
DROP COLUMN "section",
DROP COLUMN "unique_value",
DROP COLUMN "updated_by",
DROP COLUMN "validation_json",
ADD COLUMN     "show_in_homepage" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "storage_provider",
ADD COLUMN     "storage_provider" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "student_custom_field_values" DROP COLUMN "deleted_at";

-- AlterTable
ALTER TABLE "students" DROP COLUMN "address_line1",
DROP COLUMN "address_line2",
DROP COLUMN "city",
DROP COLUMN "created_by",
DROP COLUMN "deleted_at",
DROP COLUMN "deleted_by",
DROP COLUMN "dob",
DROP COLUMN "father_name",
DROP COLUMN "father_phone",
DROP COLUMN "gender",
DROP COLUMN "mother_name",
DROP COLUMN "mother_phone",
DROP COLUMN "photo_document_id",
DROP COLUMN "pincode",
DROP COLUMN "remarks",
DROP COLUMN "state",
DROP COLUMN "status",
DROP COLUMN "updated_by";

-- DropEnum
DROP TYPE "FieldEntity";

-- DropEnum
DROP TYPE "FieldSection";

-- DropEnum
DROP TYPE "Gender";

-- DropEnum
DROP TYPE "StorageProvider";

-- DropEnum
DROP TYPE "StudentStatus";
