import { useEffect } from "react";
import { useYard } from "@/lib/store";

export function Hotkeys() {
  const removeSelected = useYard((s) => s.removeSelected);
  const rotateSelected = useYard((s) => s.rotateSelected);
  const select = useYard((s) => s.select);
  const undo = useYard((s) => s.undo);
  const setPlaceType = useYard((s) => s.setPlaceType);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT")) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeSelected();
      } else if (e.key === "r" || e.key === "R") {
        rotateSelected();
      } else if (e.key === "Escape") {
        select(null);
        setPlaceType(null);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [removeSelected, rotateSelected, select, undo, setPlaceType]);

  return null;
}
