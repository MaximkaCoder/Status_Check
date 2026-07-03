import { describe, it, expect } from "vitest";
import { parseMentions } from "@/lib/mentions";

const users = ["Alice", "Bob", "Max Smal", "Max", "Юлія Борщук"];

describe("parseMentions", () => {
  it("returns empty array when no @ in text", () => {
    expect(parseMentions("hello world", users)).toEqual([]);
  });

  it("finds a simple mention", () => {
    expect(parseMentions("привіт @Bob, глянь це", users)).toEqual(["Bob"]);
  });

  it("longest match wins for names with spaces", () => {
    expect(parseMentions("@Max Smal подивись", users)).toEqual(["Max Smal"]);
  });

  it("matches short name when the long one is absent", () => {
    expect(parseMentions("@Max подивись", users)).toEqual(["Max"]);
  });

  it("finds multiple mentions", () => {
    const found = parseMentions("@Alice і @Bob, обговоріть", users);
    expect(found).toContain("Alice");
    expect(found).toContain("Bob");
    expect(found).toHaveLength(2);
  });

  it("handles cyrillic names", () => {
    expect(parseMentions("@Юлія Борщук перевір", users)).toEqual(["Юлія Борщук"]);
  });

  it("does not match unknown names", () => {
    expect(parseMentions("@Stranger привіт", users)).toEqual([]);
  });

  it("does not double-count a repeated mention", () => {
    expect(parseMentions("@Bob @Bob @Bob", users)).toEqual(["Bob"]);
  });

  it("email addresses do not create false mentions", () => {
    expect(parseMentions("напиши на test@example.com", users)).toEqual([]);
  });
});
