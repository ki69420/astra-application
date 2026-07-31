import { create } from "zustand";

export type ActiveView =
  | "students"
  | "student-detail"
  | "student-edit"
  | "student-new"
  | "custom-fields"
  | "custom-field-edit"
  | "custom-field-new"
  | "vault"
  | "vault-manage"
  | "documents"
  | "settings"
  | "settings-about";

interface NavigationState {
  activeView: ActiveView;
  activeStudentId: string | null;
  activeFieldId: string | null;
  historyStack: Array<{ view: ActiveView; studentId?: string | null; fieldId?: string | null }>;

  navigateTo: (
    view: ActiveView,
    params?: { studentId?: string | null; fieldId?: string | null },
  ) => void;
  goBack: () => void;
}

export function resolveHrefToNavigation(href: string): {
  view: ActiveView;
  studentId?: string;
  fieldId?: string;
} {
  if (href === "/students/new") return { view: "student-new" };
  if (href.startsWith("/students/") && href.endsWith("/edit")) {
    const id = href.replace("/students/", "").replace("/edit", "");
    return { view: "student-edit", studentId: id };
  }
  if (href.startsWith("/students/")) {
    const id = href.replace("/students/", "");
    return { view: "student-detail", studentId: id };
  }
  if (href === "/students") return { view: "students" };

  if (href === "/custom-fields/new") return { view: "custom-field-new" };
  if (href.startsWith("/custom-fields/")) {
    const id = href.replace("/custom-fields/", "");
    return { view: "custom-field-edit", fieldId: id };
  }
  if (href === "/custom-fields") return { view: "custom-fields" };

  if (href === "/vault/manage") return { view: "vault-manage" };
  if (href === "/vault") return { view: "vault" };

  if (href === "/documents") return { view: "documents" };

  if (href === "/settings/about") return { view: "settings-about" };
  if (href === "/settings") return { view: "settings" };

  return { view: "students" };
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  activeView: "students",
  activeStudentId: null,
  activeFieldId: null,
  historyStack: [],

  navigateTo: (view, params) => {
    const currentView = get().activeView;
    const currentStudentId = get().activeStudentId;
    const currentFieldId = get().activeFieldId;

    set((state) => ({
      activeView: view,
      activeStudentId: params?.studentId ?? null,
      activeFieldId: params?.fieldId ?? null,
      historyStack: [
        ...state.historyStack,
        { view: currentView, studentId: currentStudentId, fieldId: currentFieldId },
      ],
    }));
  },

  goBack: () => {
    const stack = get().historyStack;
    if (stack.length === 0) {
      set({ activeView: "students", activeStudentId: null, activeFieldId: null });
      return;
    }

    const previous = stack[stack.length - 1];
    const newStack = stack.slice(0, stack.length - 1);

    set({
      activeView: previous.view,
      activeStudentId: previous.studentId ?? null,
      activeFieldId: previous.fieldId ?? null,
      historyStack: newStack,
    });
  },
}));

