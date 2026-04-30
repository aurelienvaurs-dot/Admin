import { useState } from "react";
import { applyTheme, getSavedTheme, TK } from "./lib/theme.js";
import Dashboard from "./pages/Dashboard.jsx";

applyTheme(getSavedTheme() || "dark");

export default function App() {
  return <Dashboard />;
}
