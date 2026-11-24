import { createContext, type Dispatch, type RefObject, type SetStateAction } from "react";

export const PageChromeContext = createContext<{
  headerRef: RefObject<HTMLDivElement | null>;
  toolbarAttached: boolean;
  setToolbarAttached: Dispatch<SetStateAction<boolean>>;
} | null>(null);
