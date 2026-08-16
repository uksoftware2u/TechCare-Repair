import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./styles.css";
import "./photos.css";
import "./screens.css";
import "./repair-detail.css";
import "./repairs.css";
import "./sidebar-layout.css";
import "./access-control.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
