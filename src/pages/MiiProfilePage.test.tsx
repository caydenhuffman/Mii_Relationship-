import { screen, waitFor, within } from "@testing-library/react";
import { MiiProfilePage } from "@/pages/MiiProfilePage";
import { sampleIslandData } from "@/tests/fixtures";
import { renderWithIsland } from "@/tests/renderWithIsland";

describe("MiiProfilePage", () => {
  it("shows ranked relationships and supports reciprocal relationship CRUD", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { user } = renderWithIsland({
      path: "/miis/:miiId",
      route: "/miis/mii-alice",
      element: <MiiProfilePage />,
      initialData: sampleIslandData,
    });

    expect(await screen.findByText("Relationships")).toBeInTheDocument();
    expect(screen.getByText("4 connections")).toBeInTheDocument();
    expect(screen.getByText(/1\. Carol/i)).toBeInTheDocument();
    expect(screen.getByText("Falling in love")).toBeInTheDocument();
    expect(screen.getByText("Sweetheart")).toBeInTheDocument();
    expect(screen.getByText("Carol -> Alice")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Add relationship/i }));
    const targetSelect = await screen.findByLabelText(/Target Mii/i);
    const targetOptions = within(targetSelect).getAllByRole("option").map((option) => option.textContent);
    expect(targetOptions).not.toContain("Alice");
    expect(targetOptions).not.toContain("Bob");
    expect(targetOptions).not.toContain("Carol");
    expect(targetOptions).not.toContain("Daisy");
    expect(targetOptions).not.toContain("Evan");
    expect(targetOptions).toContain("Frank");
    await user.selectOptions(targetSelect, "mii-frank");
    await user.click(
      screen.getByRole("button", { name: /Create reciprocal relationship/i }),
    );

    expect(
      await screen.findByRole("heading", { name: /Frank/i, level: 4 }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /edit relationship with bob/i,
      }),
    );
    await user.selectOptions(
      await screen.findByLabelText(/Relationship type/i, {
        selector: 'select[name="relationshipType"]',
      }),
      "Family",
    );
    await user.selectOptions(
      await screen.findByLabelText(/Inverse relationship type/i, {
        selector: 'select[name="inverseRelationshipType"]',
      }),
      "Relatives",
    );
    await user.click(screen.getByRole("button", { name: /Save both directions/i }));

    expect(await screen.findByText("Family")).toBeInTheDocument();
    expect(
      await screen.findByText((_, node) => node?.textContent === "Relatives: Not getting along"),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /delete relationship with bob/i,
      }),
    );

    await waitFor(() => {
      expect(screen.queryByText(/Bob/)).not.toBeInTheDocument();
    });

    confirmSpy.mockRestore();
  });
});
