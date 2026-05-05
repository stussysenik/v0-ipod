import { createRoot } from "react-dom/client";
import { make as App } from "./Index.mjs";

const root = createRoot(document.getElementById("root"));
root.render(App({}));
