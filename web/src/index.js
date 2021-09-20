import React from "react";
import { render } from "react-dom";

import "./styles/index.css";
// import "~@blueprintjs/icons/lib/css/blueprint-icons.css";
// import "~@blueprintjs/core/lib/css/blueprint.css";

import { App } from "./app.jsx";

render(<App />, document.getElementById("root"));
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js");
}
