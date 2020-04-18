import React from "react";

import { BrowserRouter, Route } from "react-router-dom";

import { Home } from "./home";
import { Login } from "./login";

export function App() {
  return (
    <BrowserRouter basename="/">
      <Route path="/">
        <Home />
      </Route>
      <Route exact path="/login">
        <Login />
      </Route>
    </BrowserRouter>
  );
}
