import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Clear any old Lovable session tokens
localStorage.clear();

createRoot(document.getElementById("root")!).render(<App />);
