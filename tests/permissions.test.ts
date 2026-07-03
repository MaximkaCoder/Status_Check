import { describe, it, expect } from "vitest";
import {
  isCreator,
  isAssignee,
  isReviewer,
  canModifyItem,
  canChangeStatus,
  canViewItemDirect,
  type ItemLike,
  type SessionLike,
} from "@/lib/permissions";

const base: ItemLike = {
  creator_id: null,
  creator_name: "Alice",
  assignee: null,
  reviewer: null,
  assigneeId: null,
  reviewerId: null,
  project: null,
};

const alice: SessionLike = { userId: "u-alice", name: "Alice" };
const bob: SessionLike = { userId: "u-bob", name: "Bob" };
const admin: SessionLike = { userId: "u-admin", name: "Root", isAdmin: true };

describe("isCreator", () => {
  it("matches by creator_id when present", () => {
    const item = { ...base, creator_id: "u-alice" };
    expect(isCreator(alice, item)).toBe(true);
    expect(isCreator(bob, item)).toBe(false);
  });

  it("falls back to name when creator_id is null", () => {
    expect(isCreator(alice, base)).toBe(true);
    expect(isCreator(bob, base)).toBe(false);
  });

  it("ID wins over name — renamed user with stale name loses access", () => {
    // Item created by u-alice, but Bob renamed himself to "Alice"
    const item = { ...base, creator_id: "u-alice", creator_name: "Alice" };
    const impostor: SessionLike = { userId: "u-bob", name: "Alice" };
    expect(isCreator(impostor, item)).toBe(false);
  });
});

describe("isAssignee / isReviewer", () => {
  it("matches assignee by ID when present", () => {
    const item = { ...base, assigneeId: "u-bob", assignee: "Bob" };
    expect(isAssignee(bob, item)).toBe(true);
    expect(isAssignee(alice, item)).toBe(false);
  });

  it("falls back to assignee name for pre-migration rows", () => {
    const item = { ...base, assignee: "Bob" };
    expect(isAssignee(bob, item)).toBe(true);
  });

  it("null assignee never matches", () => {
    expect(isAssignee(bob, base)).toBe(false);
    expect(isReviewer(bob, base)).toBe(false);
  });

  it("matches reviewer by ID with name fallback", () => {
    expect(isReviewer(bob, { ...base, reviewerId: "u-bob" })).toBe(true);
    expect(isReviewer(bob, { ...base, reviewer: "Bob" })).toBe(true);
    expect(isReviewer(alice, { ...base, reviewerId: "u-bob", reviewer: "Alice" })).toBe(false);
  });
});

describe("canModifyItem", () => {
  it("admin can modify anything", () => {
    expect(canModifyItem(admin, base)).toBe(true);
  });

  it("creator can modify, others cannot", () => {
    expect(canModifyItem(alice, base)).toBe(true);
    expect(canModifyItem(bob, base)).toBe(false);
  });

  it("assignee cannot modify the item itself", () => {
    const item = { ...base, assigneeId: "u-bob" };
    expect(canModifyItem(bob, item)).toBe(false);
  });
});

describe("canChangeStatus", () => {
  it("creator, assignee, reviewer and admin can change status", () => {
    const item = { ...base, assigneeId: "u-bob", reviewer: "Carol" };
    const carol: SessionLike = { userId: "u-carol", name: "Carol" };
    expect(canChangeStatus(alice, item)).toBe(true);
    expect(canChangeStatus(bob, item)).toBe(true);
    expect(canChangeStatus(carol, item)).toBe(true);
    expect(canChangeStatus(admin, item)).toBe(true);
  });

  it("uninvolved user cannot change status", () => {
    expect(canChangeStatus(bob, base)).toBe(false);
  });
});

describe("canViewItemDirect", () => {
  it("returns true for direct involvement", () => {
    expect(canViewItemDirect(alice, base)).toBe(true);
  });

  it("returns 'project' when uninvolved but item has a project", () => {
    const item = { ...base, project: "Apollo" };
    expect(canViewItemDirect(bob, item)).toBe("project");
  });

  it("returns false when uninvolved and no project", () => {
    expect(canViewItemDirect(bob, base)).toBe(false);
  });

  it("admin always true", () => {
    expect(canViewItemDirect(admin, { ...base, project: "Apollo" })).toBe(true);
  });
});
