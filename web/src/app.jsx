import React from "react";

import { BrowserRouter, Route } from "react-router-dom";

import { Home } from "./home";

export function App() {
  return (
    <BrowserRouter basename="/">
      <Route path="/">
        <Home />
      </Route>
    </BrowserRouter>
  );
}
