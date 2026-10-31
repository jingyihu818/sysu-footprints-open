import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./cinematic.css";
import "./red-visual.css";
import "./gilded.css";
import "./stage05d1.css";
import "./stage05d2.css";
import "./stage05e.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
