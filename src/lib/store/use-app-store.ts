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
  lastSyncedAt: string | null;
  isInitialized: boolean;

  hydrateStore: (data: {
    students: StudentRow[];
    totalEnrolledCount?: number;
    homepageFields: HomepageField[];
    searchableFields: SearchableField[];
    customFields?: CustomField[];
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

  checkAndSyncBackground: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  students: [],
  totalEnrolledCount: 0,
  homepageFields: [],
  searchableFields: [],
  customFields: [],
  lastSyncedAt: null,
  isInitialized: false,

  hydrateStore: (data) => {
    set({
      students: data.students,
      totalEnrolledCount: data.totalEnrolledCount ?? data.students.length,
      homepageFields: data.homepageFields,
      searchableFields: data.searchableFields,
      customFields: data.customFields ?? get().customFields,
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

  checkAndSyncBackground: async () => {
    try {
      // 1. Light 5ms metadata check
      const metaRes = await fetch("/api/sync/meta", { cache: "no-store" });
      if (!metaRes.ok) return;

      const meta = (await metaRes.json()) as {
        last_updated_at: string;
        total_students: number;
      };
      const storeLastSync = get().lastSyncedAt;

      // If server timestamp is newer or student count changed, fetch full sync
      const serverTime = new Date(meta.last_updated_at).getTime();
      const localTime = storeLastSync ? new Date(storeLastSync).getTime() : 0;

      if (serverTime > localTime || meta.total_students !== get().totalEnrolledCount) {
        const fullRes = await fetch("/api/sync/full", { cache: "no-store" });
        if (!fullRes.ok) return;

        const fullData = await fullRes.json();
        get().hydrateStore({
          students: fullData.students,
          homepageFields: fullData.homepageFields,
          searchableFields: fullData.searchableFields,
          customFields: fullData.customFields,
        });
      }
    } catch {
      // Background sync errors fail silently without interrupting user
    }
  },
}));
