import { screen, within } from "@testing-library/react";
import { MiisPage } from "@/pages/MiisPage";
import { createEmptyIslandData } from "@/lib/island";
import { sampleIslandData } from "@/tests/fixtures";
import { renderWithIsland } from "@/tests/renderWithIsland";

describe("MiisPage", () => {
  it("supports add and edit Mii flows", async () => {
    const { user } = renderWithIsland({
      path: "/miis",
      route: "/miis",
      element: <MiisPage />,
      initialData: createEmptyIslandData(),
    });

    await user.click(await screen.findByRole("button", { name: /add your first mii/i }));
    await user.type(screen.getByLabelText(/^Name$/i), "Peach");
    await user.clear(screen.getByLabelText(/Current level/i));
    await user.type(screen.getByLabelText(/Current level/i), "9");
    await user.click(screen.getByRole("button", { name: /create mii/i }));

    expect(await screen.findByText("Peach")).toBeInTheDocument();
    expect(screen.getByText("0 connections")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /edit peach/i }));
    const modalName = screen.getByLabelText(/^Name$/i);
    await user.clear(modalName);
    await user.type(modalName, "Princess Peach");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("Princess Peach")).toBeInTheDocument();
  });

  it("filters Miis by name and personality and supports sorting", async () => {
    const { user } = renderWithIsland({
      path: "/miis",
      route: "/miis",
      element: <MiisPage />,
      initialData: sampleIslandData,
    });

    expect(await screen.findByText("Alice")).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Search by name/i), "Da");
    expect(screen.getByText("Daisy")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText(/Search by name/i));
    await user.selectOptions(screen.getByLabelText(/Filter by personality/i), "Strategist");

    const cards = screen.getAllByRole("heading", { level: 3 });
    expect(cards).toHaveLength(1);
    expect(within(cards[0].closest("section")!).getByText("Bob")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/Filter by personality/i), "all");
    await user.selectOptions(screen.getByLabelText(/Sort by/i), "added");

    const sortedCards = screen.getAllByRole("heading", { level: 3 });
    expect(sortedCards[0]).toHaveTextContent("Alice");
    expect(sortedCards.at(-1)).toHaveTextContent("Frank");
  });
});
