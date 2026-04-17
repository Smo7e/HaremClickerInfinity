import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

import "./styles/variables.css";
import "./styles/mixins.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/animations.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
