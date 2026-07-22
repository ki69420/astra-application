-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('SUPABASE', 'S3');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'TEXTAREA', 'NUMBER', 'DECIMAL', 'DATE', 'DATETIME', 'TIME', 'BOOLEAN', 'EMAIL', 'PHONE', 'URL', 'SELECT', 'MULTI_SELECT', 'RADIO', 'CHECKBOX', 'FILE', 'IMAGE');

-- CreateEnum
CREATE TYPE "FieldEntity" AS ENUM ('STUDENT');

-- CreateEnum
CREATE TYPE "FieldSection" AS ENUM ('PERSONAL', 'MEDICAL', 'SCHOOL', 'OTHER');

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storage_provider" "StorageProvider" NOT NULL DEFAULT 'SUPABASE',
    "storage_path" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "Gender",
    "dob" TIMESTAMP(3),
    "father_name" TEXT,
    "father_phone" TEXT,
    "mother_name" TEXT,
    "mother_phone" TEXT,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "photo_document_id" TEXT,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_definitions" (
    "id" TEXT NOT NULL,
    "entity" "FieldEntity" NOT NULL DEFAULT 'STUDENT',
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "field_type" "FieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "unique_value" BOOLEAN NOT NULL DEFAULT false,
    "default_value" TEXT,
    "placeholder" TEXT,
    "help_text" TEXT,
    "options_json" JSONB,
    "validation_json" JSONB,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "section" "FieldSection" NOT NULL DEFAULT 'OTHER',
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "is_searchable" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "deleted_by" TEXT,

    CONSTRAINT "custom_field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_custom_field_values" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "value_text" TEXT,
    "value_number" INTEGER,
    "value_decimal" DECIMAL(65,30),
    "value_boolean" BOOLEAN,
    "value_date" TIMESTAMP(3),
    "value_datetime" TIMESTAMP(3),
    "value_json" JSONB,
    "document_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "student_custom_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "students_status_idx" ON "students"("status");

-- CreateIndex
CREATE INDEX "students_deleted_at_idx" ON "students"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_definitions_key_key" ON "custom_field_definitions"("key");

-- CreateIndex
CREATE INDEX "custom_field_definitions_entity_is_active_idx" ON "custom_field_definitions"("entity", "is_active");

-- CreateIndex
CREATE INDEX "custom_field_definitions_key_idx" ON "custom_field_definitions"("key");

-- CreateIndex
CREATE INDEX "student_custom_field_values_student_id_idx" ON "student_custom_field_values"("student_id");

-- CreateIndex
CREATE INDEX "student_custom_field_values_field_id_idx" ON "student_custom_field_values"("field_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_custom_field_values_student_id_field_id_key" ON "student_custom_field_values"("student_id", "field_id");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_photo_document_id_fkey" FOREIGN KEY ("photo_document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_custom_field_values" ADD CONSTRAINT "student_custom_field_values_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_custom_field_values" ADD CONSTRAINT "student_custom_field_values_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "custom_field_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_custom_field_values" ADD CONSTRAINT "student_custom_field_values_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
