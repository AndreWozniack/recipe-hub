import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

window.addEventListener("unhandledrejection", (event) => {
  console.error("[unhandledRejection]", {
    reason: event.reason instanceof Error
      ? { message: event.reason.message, stack: event.reason.stack }
      : event.reason,
  });
});

window.addEventListener("error", (event) => {
  console.error("[windowError]", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

createRoot(document.getElementById("root")!).render(<App />);
