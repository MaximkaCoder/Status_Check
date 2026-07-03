import { describe, it, expect } from "vitest";
import { CreateItemSchema, UpdateItemSchema, UpdateStatusSchema } from "@/lib/validations";

const validCreate = {
  title: "Test task",
  creator_name: "Alice",
};

describe("CreateItemSchema", () => {
  it("accepts a minimal valid payload", () => {
    expect(CreateItemSchema.safeParse(validCreate).success).toBe(true);
  });

  it("rejects empty title", () => {
    expect(CreateItemSchema.safeParse({ ...validCreate, title: "" }).success).toBe(false);
  });

  it("rejects title over 200 chars", () => {
    expect(CreateItemSchema.safeParse({ ...validCreate, title: "x".repeat(201) }).success).toBe(false);
  });

  it("rejects missing creator_name", () => {
    expect(CreateItemSchema.safeParse({ title: "T" }).success).toBe(false);
  });

  it("rejects invalid deadline string", () => {
    expect(CreateItemSchema.safeParse({ ...validCreate, deadline: "not-a-date" }).success).toBe(false);
  });

  it("accepts ISO deadline and null deadline", () => {
    expect(CreateItemSchema.safeParse({ ...validCreate, deadline: new Date().toISOString() }).success).toBe(true);
    expect(CreateItemSchema.safeParse({ ...validCreate, deadline: null }).success).toBe(true);
  });

  it("rejects unknown priority", () => {
    expect(CreateItemSchema.safeParse({ ...validCreate, priority: "URGENT" }).success).toBe(false);
  });

  it("accepts valid priority", () => {
    expect(CreateItemSchema.safeParse({ ...validCreate, priority: "HIGH" }).success).toBe(true);
  });
});

describe("UpdateItemSchema", () => {
  it("accepts partial updates", () => {
    expect(UpdateItemSchema.safeParse({ title: "New" }).success).toBe(true);
    expect(UpdateItemSchema.safeParse({}).success).toBe(true);
  });

  it("rejects invalid status", () => {
    expect(UpdateItemSchema.safeParse({ status: "WIP" }).success).toBe(false);
  });

  it("accepts all valid statuses", () => {
    for (const s of ["TO_CHECK", "EXPIRED", "DONE", "NOT_ACTUAL", "IDEAS_BACKLOG"]) {
      expect(UpdateItemSchema.safeParse({ status: s }).success).toBe(true);
    }
  });

  it("allows nulling assignee and reviewer", () => {
    expect(UpdateItemSchema.safeParse({ assignee: null, reviewer: null }).success).toBe(true);
  });
});

describe("UpdateStatusSchema", () => {
  it("requires a valid status", () => {
    expect(UpdateStatusSchema.safeParse({ status: "DONE" }).success).toBe(true);
    expect(UpdateStatusSchema.safeParse({ status: "INVALID" }).success).toBe(false);
    expect(UpdateStatusSchema.safeParse({}).success).toBe(false);
  });
});
