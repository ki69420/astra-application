import { create } from "zustand";

export type HomepageField = {
  id: string;
  key: string;
  label: string;
  field_type: string;
};

export type SearchableField = {
  id: string;
  key: string;
  label: string;
  field_type: string;
  options_json: unknown;
};

export type CustomField = {
  id: string;
  key: string;
  label: string;
  field_type: string;
  show_in_homepage: boolean;
  is_searchable: boolean;
  display_order: number;
  options_json?: unknown;
};

export type DocumentRow = {
  id: string;
  file_name: string;
  original_name: string;
  mime_type: string;
  extension: string;
  size: number;
  uploaded_by: string;
  uploaded_at: Date | string;
};

export type StudentRow = {
  id: string;
  name: string;
  created_at: Date | string;
  values: Record<
    string,
    {
      value_text?: string | null;
      value_number?: number | null;
      value_decimal?: unknown;
      value_boolean?: boolean | null;
      value_date?: Date | null | string;
      value_datetime?: Date | null | string;
      value_json?: unknown;
      document_id?: string | null;
      field: { key: string; label: string; field_type: string };
    }
  >;
};

interface AppState {
  students: StudentRow[];
  totalEnrolledCount: number;
  homepageFields: HomepageField[];
  searchableFields: SearchableField[];
  customFields: CustomField[];
  documents: DocumentRow[];
  totalDocumentsCount: number;
  lastSyncedAt: string | null;
  isInitialized: boolean;

  hydrateStore: (data: {
    students: StudentRow[];
    totalEnrolledCount?: number;
    homepageFields: HomepageField[];
    searchableFields: SearchableField[];
    customFields?: CustomField[];
    documents?: DocumentRow[];
    totalDocumentsCount?: number;
  }) => void;

  optimisticAddStudent: (student: StudentRow) => void;
  optimisticUpdateStudent: (
    id: string,
    name: string,
    values?: StudentRow["values"],
  ) => void;
  optimisticDeleteStudent: (id: string) => void;

  optimisticAddCustomField: (field: CustomField) => void;
  optimisticUpdateCustomField: (
    id: string,
    field: Partial<CustomField>,
  ) => void;
  optimisticReorderCustomFields: (fields: CustomField[]) => void;

  optimisticAddDocument: (doc: DocumentRow) => void;
  optimisticDeleteDocument: (id: string) => void;

  checkAndSyncBackground: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  students: [],
  totalEnrolledCount: 0,
  homepageFields: [],
  searchableFields: [],
  customFields: [],
  documents: [],
  totalDocumentsCount: 0,
  lastSyncedAt: null,
  isInitialized: false,

  hydrateStore: (data) => {
    set({
      students: data.students,
      totalEnrolledCount: data.totalEnrolledCount ?? data.students.length,
      homepageFields: data.homepageFields,
      searchableFields: data.searchableFields,
      customFields: data.customFields ?? get().customFields,
      documents: data.documents ?? get().documents,
      totalDocumentsCount:
        data.totalDocumentsCount ?? data.documents?.length ?? get().totalDocumentsCount,
      lastSyncedAt: new Date().toISOString(),
      isInitialized: true,
    });
  },

  optimisticAddStudent: (newStudent) => {
    set((state) => ({
      students: [newStudent, ...state.students],
      totalEnrolledCount: state.totalEnrolledCount + 1,
    }));
  },

  optimisticUpdateStudent: (id, name, newValues) => {
    set((state) => ({
      students: state.students.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          name,
          values: newValues ? { ...s.values, ...newValues } : s.values,
        };
      }),
    }));
  },

  optimisticDeleteStudent: (id) => {
    set((state) => ({
      students: state.students.filter((s) => s.id !== id),
      totalEnrolledCount: Math.max(0, state.totalEnrolledCount - 1),
    }));
  },

  optimisticAddCustomField: (newField) => {
    set((state) => {
      const nextCustomFields = [...state.customFields, newField];
      const nextHomepage = newField.show_in_homepage
        ? [
            ...state.homepageFields,
            {
              id: newField.id,
              key: newField.key,
              label: newField.label,
              field_type: newField.field_type,
            },
          ]
        : state.homepageFields;
      const nextSearchable = newField.is_searchable
        ? [
            ...state.searchableFields,
            {
              id: newField.id,
              key: newField.key,
              label: newField.label,
              field_type: newField.field_type,
              options_json: newField.options_json,
            },
          ]
        : state.searchableFields;

      return {
        customFields: nextCustomFields,
        homepageFields: nextHomepage,
        searchableFields: nextSearchable,
      };
    });
  },

  optimisticUpdateCustomField: (id, updatedProps) => {
    set((state) => {
      const nextCustomFields = state.customFields.map((f) =>
        f.id === id ? { ...f, ...updatedProps } : f,
      );
      return { customFields: nextCustomFields };
    });
  },

  optimisticReorderCustomFields: (reordered) => {
    set({ customFields: reordered });
  },

  optimisticAddDocument: (doc) => {
    set((state) => ({
      documents: [doc, ...state.documents],
      totalDocumentsCount: state.totalDocumentsCount + 1,
    }));
  },

  optimisticDeleteDocument: (id) => {
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
      totalDocumentsCount: Math.max(0, state.totalDocumentsCount - 1),
    }));
  },

  checkAndSyncBackground: async () => {
    try {
      // 1. Light 5ms metadata check across all database tables
      const metaRes = await fetch("/api/sync/meta", { cache: "no-store" });
      if (!metaRes.ok) return;

      const meta = (await metaRes.json()) as {
        last_updated_at: string;
        total_students: number;
        total_fields: number;
        total_documents: number;
      };
      const storeLastSync = get().lastSyncedAt;

      const serverTime = new Date(meta.last_updated_at).getTime();
      const localTime = storeLastSync ? new Date(storeLastSync).getTime() : 0;

      // Sync full data if any table timestamp is newer or any row count changed
      if (
        serverTime > localTime ||
        meta.total_students !== get().totalEnrolledCount ||
        meta.total_fields !== get().customFields.length ||
        meta.total_documents !== get().totalDocumentsCount
      ) {
        const fullRes = await fetch("/api/sync/full", { cache: "no-store" });
        if (!fullRes.ok) return;

        const fullData = await fullRes.json();
        get().hydrateStore({
          students: fullData.students,
          homepageFields: fullData.homepageFields,
          searchableFields: fullData.searchableFields,
          customFields: fullData.customFields,
          documents: fullData.documents,
        });
      }
    } catch {
      // Background sync errors fail silently without interrupting user
    }
  },
}));
