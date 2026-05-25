import { describe, it, expect } from "vitest";
import { ORDER_ACTIONS } from "../utils/orderflow";

describe("ORDER_ACTIONS state machine", () => {
  it("placed status should have accepted action", () => {
    expect(ORDER_ACTIONS["placed"]).toContain("accepted");
  });

  it("accepted status should have preparing action", () => {
    expect(ORDER_ACTIONS["accepted"]).toContain("preparing");
  });

  it("preparing status should have ready_for_rider action", () => {
    expect(ORDER_ACTIONS["preparing"]).toContain("ready_for_rider");
  });

  it("delivered status should have no actions", () => {
    const actions = ORDER_ACTIONS["delivered"] ?? [];
    expect(actions).toHaveLength(0);
  });

  it("cancelled status should have no actions", () => {
    const actions = ORDER_ACTIONS["cancelled"] ?? [];
    expect(actions).toHaveLength(0);
  });
});
