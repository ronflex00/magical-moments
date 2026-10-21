import { describe, expect, it } from "vitest";
import { gestureIntent } from "./GestureSurface";
describe("Intention du geste", () => {
  it("laisse passer le scroll vertical sur les cartes horizontales", () => {
    expect(gestureIntent(5, 60, "x")).toBe("scroll");
    expect(gestureIntent(-80, 6, "x")).toBe("accept");
  });
  it("ignore le tremblement et distingue une traction des gestes latéraux", () => {
    expect(gestureIntent(3, 3, "both")).toBe("wait");
    expect(gestureIntent(50, 4, "y")).toBe("scroll");
    expect(gestureIntent(8, -80, "y")).toBe("accept");
  });
});
