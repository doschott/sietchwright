import { useEffect } from "react";
import { useYard } from "@/lib/store";

export function Hotkeys() {
  const removeSelected = useYard((s) => s.removeSelected);
  const rotateSelected = useYard((s) => s.rotateSelected);
  const select = useYard((s) => s.select);
  const undo = useYard((s) => s.undo);
  const setPlaceType = useYard((s) => s.setPlaceType);
  const toggleOverlay = useYard((s) => s.toggleOverlay);
  const toggleChrome = useYard((s) => s.toggleChrome);
  const zoomBy = useYard((s) => s.zoomBy);
  const setOverlay = useYard((s) => s.setOverlay);

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
        setOverlay("none");
      } else if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        undo();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomBy("in");
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomBy("out");
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        zoomBy("fit");
      } else if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        toggleChrome();
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        toggleOverlay("brief");
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        toggleOverlay("kit");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    removeSelected,
    rotateSelected,
    select,
    undo,
    setPlaceType,
    toggleOverlay,
    toggleChrome,
    zoomBy,
    setOverlay,
  ]);

  return null;
}
