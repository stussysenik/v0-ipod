import React from "react";
import { createRoot } from "react-dom/client";
import { make as App } from "./Index.mjs";
import "../styles.css";

const root = createRoot(document.getElementById("root"));
root.render(React.createElement(App));
