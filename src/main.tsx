import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "@/app/App";
import { IslandProvider } from "@/context/IslandContext";
import { createDefaultStorageAdapter } from "@/services/adapterFactory";
import "@/styles/tokens.css";
import "@/styles/globals.css";
import "@xyflow/react/dist/style.css";

const storageAdapter = createDefaultStorageAdapter();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter
      basename={import.meta.env.BASE_URL}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <IslandProvider adapter={storageAdapter}>
        <App />
      </IslandProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
