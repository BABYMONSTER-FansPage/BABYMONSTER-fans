import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import FanPage from "../app/FanPage";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><FanPage /></StrictMode>,
);
