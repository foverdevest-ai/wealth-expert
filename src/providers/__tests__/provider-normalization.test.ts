import { describe, expect, it } from "vitest";
import { providerAdapters } from "@/providers";

describe("provider adapter mapping", () => {
  it("maps ABN AMRO accounts through the provider abstraction", async () => {
    const connection = await providerAdapters.ABN_AMRO.connect();
    const accounts = await providerAdapters.ABN_AMRO.listAccounts(connection);

    expect(connection.connected).toBe(true);
    expect(accounts.every((account) => account.source === "ABN_AMRO")).toBe(true);
  });

  it("returns investment snapshots for Bitvavo and DEGIRO", async () => {
    const bitvavo = await providerAdapters.BITVAVO.syncPerformanceData?.({
      provider: "BITVAVO",
      connected: true,
    });
    const degiro = await providerAdapters.DEGIRO.syncPerformanceData?.({
      provider: "DEGIRO",
      connected: true,
    });

    expect(bitvavo?.length).toBeGreaterThan(0);
    expect(degiro?.length).toBeGreaterThan(0);
  });
});
