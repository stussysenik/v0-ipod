"use client";

import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type EditorInputMode = React.HTMLAttributes<HTMLInputElement>["inputMode"];

interface FixedEditorRequest {
  title: string;
  value: string;
  placeholder?: string;
  inputMode?: EditorInputMode;
  pattern?: string;
  onCommit: (value: string) => void;
}

interface FixedEditorContextValue {
  isTouchEditingPreferred: boolean;
  isEditorOpen: boolean;
  openEditor: (request: FixedEditorRequest) => void;
  closeEditor: () => void;
}

const FixedEditorContext = createContext<FixedEditorContextValue | null>(null);

function detectCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(hover: none)").matches ||
    navigator.maxTouchPoints > 0
  );
}

export function FixedEditorProvider({
  children,
  resetKey = 0,
}: {
  children: React.ReactNode;
  resetKey?: number;
}) {
  const [request, setRequest] = useState<FixedEditorRequest | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [isTouchEditingPreferred, setIsTouchEditingPreferred] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const syncTouchPreference = () => {
      setIsTouchEditingPreferred(detectCoarsePointer());
    };

    syncTouchPreference();
    window.addEventListener("resize", syncTouchPreference, { passive: true });
    window.addEventListener("orientationchange", syncTouchPreference, {
      passive: true,
    });
    return () => {
      window.removeEventListener("resize", syncTouchPreference);
      window.removeEventListener("orientationchange", syncTouchPreference);
    };
  }, []);

  useEffect(() => {
    if (!request) return;
    setDraftValue(request.value);
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 30);
    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [request]);

  useEffect(() => {
    setRequest(null);
  }, [resetKey]);

  const closeEditor = useCallback(() => {
    setRequest(null);
  }, []);

  const commitEditor = useCallback(() => {
    if (!request) return;
    request.onCommit(draftValue);
    setRequest(null);
  }, [draftValue, request]);

  const openEditor = useCallback((nextRequest: FixedEditorRequest) => {
    setRequest(nextRequest);
  }, []);

  const value = useMemo<FixedEditorContextValue>(
    () => ({
      isTouchEditingPreferred,
      isEditorOpen: !!request,
      openEditor,
      closeEditor,
    }),
    [closeEditor, isTouchEditingPreferred, openEditor, request],
  );

  return (
    <FixedEditorContext.Provider value={value}>
      {children}
      {request && (
        <div
          className="fixed inset-0 z-[80] bg-black/10 backdrop-blur-[1px]"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditor();
            }
          }}
          data-testid="fixed-editor"
        >
          <div className="absolute inset-x-0 bottom-0 px-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
            <div className="mx-auto w-full max-w-md rounded-t-2xl border border-[#D0D4DA] bg-[#F5F5F3]/98 p-3 shadow-[0_-12px_32px_rgba(0,0,0,0.18)]">
              <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#5A616A]">
                {request.title}
              </div>
              <input
                ref={inputRef}
                id="fixed-editor-input"
                name="fixed-editor-input"
                value={draftValue}
                inputMode={request.inputMode}
                pattern={request.pattern}
                placeholder={request.placeholder}
                onChange={(event) => setDraftValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitEditor();
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    closeEditor();
                  }
                }}
                className="h-11 w-full rounded-lg border border-[#BFC5CC] bg-white px-3 text-[16px] font-medium text-[#111827] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#93C5FD]"
                data-testid="fixed-editor-input"
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-lg border border-[#C9CED5] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4B5563]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={commitEditor}
                  className="rounded-lg border border-[#111827] bg-[#111827] px-3 py-1.5 text-[12px] font-semibold text-white"
                  data-testid="fixed-editor-done"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </FixedEditorContext.Provider>
  );
}

export function useFixedEditor(): FixedEditorContextValue {
  const context = useContext(FixedEditorContext);
  if (!context) {
    return {
      isTouchEditingPreferred: false,
      isEditorOpen: false,
      openEditor: () => {},
      closeEditor: () => {},
    };
  }
  return context;
}
