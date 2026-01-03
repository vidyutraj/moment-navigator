import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Import debug utilities (only in dev)
if (import.meta.env.DEV) {
  import("./utils/calendarDebug");
}

createRoot(document.getElementById("root")!).render(<App />);
