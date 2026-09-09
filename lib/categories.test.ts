import { describe, expect, it } from "vitest";
import { suggestCategoryName } from "./categories";

describe("suggestCategoryName", () => {
  it.each([
    ["Netflix Premium", "Streaming"],
    ["ChatGPT Plus", "AI Tools"],
    ["IndiHome Fiber", "Utilitas"],
    ["Google One", "Penyimpanan"],
    ["Unknown Local Service", null],
  ])("suggests %s as %s", (name, expected) => {
    expect(suggestCategoryName(name)).toBe(expected);
  });
});
