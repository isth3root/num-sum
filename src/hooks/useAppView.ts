import { useState } from "react";
import { type AppView } from "../types";

export const useAppView = () => {
  const [view, setView] = useState<AppView>("standard");
  return { view, setView };
};