import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { IslandProvider } from "@/context/IslandContext";
import { createMemoryStorageAdapter } from "@/services/storageAdapter";
import { createEmptyIslandData } from "@/lib/island";
import type { IslandData } from "@/types/domain";

interface RenderWithIslandOptions {
  route?: string;
  path: string;
  element: ReactElement;
  initialData?: IslandData;
}

export function renderWithIsland({
  route = "/",
  path,
  element,
  initialData = createEmptyIslandData(),
}: RenderWithIslandOptions) {
  const adapter = createMemoryStorageAdapter(initialData);
  const user = userEvent.setup();

  return {
    user,
    adapter,
    ...render(
      <MemoryRouter
        initialEntries={[route]}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <IslandProvider adapter={adapter}>
          <Routes>
            <Route path={path} element={element} />
          </Routes>
        </IslandProvider>
      </MemoryRouter>,
    ),
  };
}
