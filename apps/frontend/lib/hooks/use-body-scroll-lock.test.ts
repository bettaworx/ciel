import { createBodyScrollLockManager } from "@/lib/hooks/use-body-scroll-lock";

function createTarget() {
  return {
    bodyStyle: {
      overflow: "",
      paddingRight: "",
    },
    htmlStyle: {
      overflow: "",
    },
    getBodyPaddingRight: () => 4,
    getScrollbarWidth: () => 20,
  };
}

describe("createBodyScrollLockManager", () => {
  it("locks and unlocks scrolling while preserving styles", () => {
    const target = createTarget();
    const manager = createBodyScrollLockManager(target);

    manager.lock();

    expect(target.bodyStyle.overflow).toBe("hidden");
    expect(target.htmlStyle.overflow).toBe("hidden");
    expect(target.bodyStyle.paddingRight).toBe("24px");

    manager.unlock();

    expect(target.bodyStyle.overflow).toBe("");
    expect(target.htmlStyle.overflow).toBe("");
    expect(target.bodyStyle.paddingRight).toBe("");
  });

  it("keeps the lock active until the last locker releases it", () => {
    const target = createTarget();
    const manager = createBodyScrollLockManager(target);

    manager.lock();
    manager.lock();
    manager.unlock();

    expect(target.bodyStyle.overflow).toBe("hidden");
    expect(target.htmlStyle.overflow).toBe("hidden");

    manager.unlock();

    expect(target.bodyStyle.overflow).toBe("");
    expect(target.htmlStyle.overflow).toBe("");
  });
});
