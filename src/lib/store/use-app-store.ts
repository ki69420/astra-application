import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { precacheDocumentBlobs } from "@/lib/documents/document-manager";

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

export type VaultGroupRow = {
  id: string;
  title: string;
  description?: string | null;
  icon?: string | null;
  display_order: number;
  created_at: Date | string;
};

export type VaultGroupParentChildRow = {
  parent_id: string;
  child_id: string;
  display_order: number;
};

export type VaultItemRow = {
  id: string;
  title: string;
  value_text?: string | null;
  value_date?: Date | null | string;
  document_id?: string | null;
  custom_field_id?: string | null;
  created_at: Date | string;
  document?: DocumentRow | null;
  custom_field?: CustomField | null;
};

export type VaultGroupItemRow = {
  group_id: string;
  item_id: string;
  display_order: number;
};

export type TextSize = "normal" | "large" | "xlarge";

interface AppState {
  students: StudentRow[];
  totalEnrolledCount: number;
  homepageFields: HomepageField[];
  searchableFields: SearchableField[];
  customFields: CustomField[];
  documents: DocumentRow[];
  totalDocumentsCount: number;

  textSize: TextSize;
  setTextSize: (size: TextSize) => void;

  vaultGroups: VaultGroupRow[];
  vaultParentLinks: VaultGroupParentChildRow[];
  vaultItems: VaultItemRow[];
  vaultGroupItemLinks: VaultGroupItemRow[];

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

  hydrateVault: (data: {
    groups: VaultGroupRow[];
    parentLinks: VaultGroupParentChildRow[];
    items: VaultItemRow[];
    groupItemLinks: VaultGroupItemRow[];
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

  optimisticAddVaultGroup: (group: VaultGroupRow, parentIds?: string[]) => void;
  optimisticUpdateVaultGroup: (id: string, updated: Partial<VaultGroupRow>, parentIds?: string[]) => void;
  optimisticDeleteVaultGroup: (id: string, parentId?: string) => void;

  optimisticAddVaultItem: (item: VaultItemRow, groupIds?: string[]) => void;
  optimisticUpdateVaultItem: (id: string, updated: Partial<VaultItemRow>, groupIds?: string[]) => void;
  optimisticDeleteVaultItem: (id: string, groupId?: string) => void;

  checkAndSyncBackground: () => Promise<void>;
  fetchVaultBackground: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      students: [],
      totalEnrolledCount: 0,
      homepageFields: [],
      searchableFields: [],
      customFields: [],
      documents: [],
      totalDocumentsCount: 0,

      textSize: "normal",
      setTextSize: (textSize) => set({ textSize }),

      vaultGroups: [],
      vaultParentLinks: [],
      vaultItems: [],
      vaultGroupItemLinks: [],

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

        // Trigger background binary document precaching into IndexedDB
        const docIds: string[] = [];
        for (const s of data.students || []) {
          if (s.values) {
            for (const v of Object.values(s.values)) {
              if (v.document_id) docIds.push(v.document_id);
            }
          }
        }
        for (const d of data.documents || []) {
          if (d.id) docIds.push(d.id);
        }
        if (docIds.length > 0) {
          precacheDocumentBlobs(docIds);
        }
      },

      hydrateVault: (data) => {
        set({
          vaultGroups: data.groups,
          vaultParentLinks: data.parentLinks,
          vaultItems: data.items,
          vaultGroupItemLinks: data.groupItemLinks,
        });

        const docIds: string[] = [];
        for (const i of data.items || []) {
          if (i.document_id) docIds.push(i.document_id);
        }
        if (docIds.length > 0) {
          precacheDocumentBlobs(docIds);
        }
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

      optimisticAddVaultGroup: (group, parentIds = []) => {
        set((state) => {
          const newGroups = [...state.vaultGroups, group];
          const newParentLinks = [
            ...state.vaultParentLinks,
            ...parentIds.map((pId, idx) => ({ parent_id: pId, child_id: group.id, display_order: idx })),
          ];
          return { vaultGroups: newGroups, vaultParentLinks: newParentLinks };
        });
      },

      optimisticUpdateVaultGroup: (id, updated, parentIds) => {
        set((state) => {
          const newGroups = state.vaultGroups.map((g) => (g.id === id ? { ...g, ...updated } : g));
          let newParentLinks = state.vaultParentLinks;
          if (parentIds !== undefined) {
            newParentLinks = state.vaultParentLinks.filter((l) => l.child_id !== id);
            newParentLinks.push(
              ...parentIds.map((pId, idx) => ({ parent_id: pId, child_id: id, display_order: idx })),
            );
          }
          return { vaultGroups: newGroups, vaultParentLinks: newParentLinks };
        });
      },

      optimisticDeleteVaultGroup: (id, parentId) => {
        set((state) => {
          if (parentId) {
            // Unlink group from parent
            return {
              vaultParentLinks: state.vaultParentLinks.filter(
                (l) => !(l.parent_id === parentId && l.child_id === id),
              ),
            };
          }
          // Delete group permanently
          return {
            vaultGroups: state.vaultGroups.filter((g) => g.id !== id),
            vaultParentLinks: state.vaultParentLinks.filter(
              (l) => l.parent_id !== id && l.child_id !== id,
            ),
            vaultGroupItemLinks: state.vaultGroupItemLinks.filter((l) => l.group_id !== id),
          };
        });
      },

      optimisticAddVaultItem: (item, groupIds = []) => {
        set((state) => {
          const newItems = [item, ...state.vaultItems];
          const newItemLinks = [
            ...state.vaultGroupItemLinks,
            ...groupIds.map((gId, idx) => ({ group_id: gId, item_id: item.id, display_order: idx })),
          ];
          return { vaultItems: newItems, vaultGroupItemLinks: newItemLinks };
        });
      },

      optimisticUpdateVaultItem: (id, updated, groupIds) => {
        set((state) => {
          const newItems = state.vaultItems.map((i) => (i.id === id ? { ...i, ...updated } : i));
          let newItemLinks = state.vaultGroupItemLinks;
          if (groupIds !== undefined) {
            newItemLinks = state.vaultGroupItemLinks.filter((l) => l.item_id !== id);
            newItemLinks.push(
              ...groupIds.map((gId, idx) => ({ group_id: gId, item_id: id, display_order: idx })),
            );
          }
          return { vaultItems: newItems, vaultGroupItemLinks: newItemLinks };
        });
      },

      optimisticDeleteVaultItem: (id, groupId) => {
        set((state) => {
          if (groupId) {
            // Unlink item from group
            return {
              vaultGroupItemLinks: state.vaultGroupItemLinks.filter(
                (l) => !(l.group_id === groupId && l.item_id === id),
              ),
            };
          }
          // Delete item permanently
          return {
            vaultItems: state.vaultItems.filter((i) => i.id !== id),
            vaultGroupItemLinks: state.vaultGroupItemLinks.filter((l) => l.item_id !== id),
          };
        });
      },

      fetchVaultBackground: async () => {
        try {
          const res = await fetch("/api/vault/full", { cache: "no-store" });
          if (!res.ok) return;
          const data = await res.json();
          get().hydrateVault({
            groups: data.groups,
            parentLinks: data.parentLinks,
            items: data.items,
            groupItemLinks: data.groupItemLinks,
          });
        } catch {
          // Silent catch
        }
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
            total_vault_groups: number;
            total_vault_items: number;
          };
          const storeLastSync = get().lastSyncedAt;

          const serverTime = new Date(meta.last_updated_at).getTime();
          const localTime = storeLastSync ? new Date(storeLastSync).getTime() : 0;

          // Sync full data if any table timestamp is newer or any row count changed
          if (
            serverTime > localTime ||
            meta.total_students !== get().totalEnrolledCount ||
            meta.total_fields !== get().customFields.length ||
            meta.total_documents !== get().totalDocumentsCount ||
            meta.total_vault_groups !== get().vaultGroups.length ||
            meta.total_vault_items !== get().vaultItems.length
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

            // Fetch fresh vault data
            get().fetchVaultBackground();
          }
        } catch {
          // Background sync errors fail silently without interrupting user
        }
      },
    }),
    {
      name: "astra-app-store-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        students: state.students,
        totalEnrolledCount: state.totalEnrolledCount,
        homepageFields: state.homepageFields,
        searchableFields: state.searchableFields,
        customFields: state.customFields,
        documents: state.documents,
        totalDocumentsCount: state.totalDocumentsCount,
        textSize: state.textSize,
        vaultGroups: state.vaultGroups,
        vaultParentLinks: state.vaultParentLinks,
        vaultItems: state.vaultItems,
        vaultGroupItemLinks: state.vaultGroupItemLinks,
        lastSyncedAt: state.lastSyncedAt,
        isInitialized: state.isInitialized,
      }),
    },
  ),
);
