import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";

const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const MiisPage = lazy(() =>
  import("@/pages/MiisPage").then((module) => ({
    default: module.MiisPage,
  })),
);
const MiiProfilePage = lazy(() =>
  import("@/pages/MiiProfilePage").then((module) => ({
    default: module.MiiProfilePage,
  })),
);
const FullGraphPage = lazy(() =>
  import("@/pages/FullGraphPage").then((module) => ({
    default: module.FullGraphPage,
  })),
);
const FocusedGraphPage = lazy(() =>
  import("@/pages/FocusedGraphPage").then((module) => ({
    default: module.FocusedGraphPage,
  })),
);
const ClustersPage = lazy(() =>
  import("@/pages/ClustersPage").then((module) => ({
    default: module.ClustersPage,
  })),
);

export function App() {
  return (
    <AppShell>
      <Suspense fallback={<p>Loading page...</p>}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/miis" element={<MiisPage />} />
          <Route path="/miis/:miiId" element={<MiiProfilePage />} />
          <Route path="/graph" element={<FullGraphPage />} />
          <Route path="/graph/focus" element={<FocusedGraphPage />} />
          <Route path="/clusters" element={<ClustersPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
