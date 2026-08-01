"use client";

import * as React from "react";
import { useNavigationStore } from "@/lib/store/use-navigation-store";
import { OfflineSyncIndicator } from "@/components/pwa/offline-sync-indicator";
import { StudentsTable } from "./students/students-table";
import { StudentDetailView } from "./students/[id]/student-detail-view";
import { EditStudentView } from "./students/[id]/edit/edit-student-view";
import { StudentForm } from "./students/student-form";
import { CustomFieldsTable } from "./custom-fields/custom-fields-table";
import { EditCustomFieldView } from "./custom-fields/[id]/edit-custom-field-view";
import { CustomFieldForm } from "./custom-fields/custom-field-form";
import { VaultView } from "./vault/vault-view";
import { VaultManageView } from "./vault/manage-view";
import { DocumentsList } from "./documents/documents-list";
import { SettingsView } from "./settings/page";
import { AboutView } from "./settings/about/page";

export default function RootMasterAppShell() {
  const activeView = useNavigationStore((s) => s.activeView);
  const activeStudentId = useNavigationStore((s) => s.activeStudentId);
  const activeFieldId = useNavigationStore((s) => s.activeFieldId);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  const renderContent = () => {
    switch (activeView) {
      case "students":
        return <StudentsTable data={[]} totalEnrolledCount={0} homepageFields={[]} searchableFields={[]} />;
      case "student-detail":
        return activeStudentId ? (
          <StudentDetailView studentId={activeStudentId} />
        ) : (
          <StudentsTable data={[]} totalEnrolledCount={0} homepageFields={[]} searchableFields={[]} />
        );
      case "student-edit":
        return activeStudentId ? (
          <EditStudentView studentId={activeStudentId} />
        ) : (
          <StudentsTable data={[]} totalEnrolledCount={0} homepageFields={[]} searchableFields={[]} />
        );
      case "student-new":
        return <StudentForm customFields={[]} defaultValues={{}} />;
      case "custom-fields":
        return <CustomFieldsTable />;
      case "custom-field-edit":
        return activeFieldId ? (
          <EditCustomFieldView fieldId={activeFieldId} />
        ) : (
          <CustomFieldsTable />
        );
      case "custom-field-new":
        return <CustomFieldForm />;
      case "vault":
      case "vault-manage":
        return <VaultView />;
      case "documents":
        return <DocumentsList initialDocuments={[]} />;
      case "settings":
        return <SettingsView />;
      case "settings-about":
        return <AboutView />;
      default:
        return <StudentsTable data={[]} totalEnrolledCount={0} homepageFields={[]} searchableFields={[]} />;
    }
  };

  return (
    <div className="bg-background pb-16">
      <OfflineSyncIndicator />
      {renderContent()}
    </div>
  );
}
