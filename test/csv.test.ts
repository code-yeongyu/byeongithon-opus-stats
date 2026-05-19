import { describe, expect, it } from "vitest";
import { csvToObjects, parseCsv, parseCsvToObjects } from "../src/lib/csv.ts";

describe("parseCsv", () => {
	it("parses a simple table", () => {
		const rows = parseCsv("a,b,c\n1,2,3\n4,5,6\n");
		expect(rows).toEqual([
			["a", "b", "c"],
			["1", "2", "3"],
			["4", "5", "6"],
		]);
	});

	it("handles quoted fields with commas", () => {
		const rows = parseCsv('name,score\n"Hello, World",42\n');
		expect(rows).toEqual([
			["name", "score"],
			["Hello, World", "42"],
		]);
	});

	it("handles escaped quotes inside quoted fields", () => {
		const rows = parseCsv('text\n"He said ""hi"""\n');
		expect(rows).toEqual([["text"], ['He said "hi"']]);
	});

	it("handles CRLF and missing trailing newline", () => {
		const rows = parseCsv("a,b\r\n1,2\r\n3,4");
		expect(rows).toEqual([
			["a", "b"],
			["1", "2"],
			["3", "4"],
		]);
	});

	it("treats empty trailing line as no row", () => {
		const rows = parseCsv("a,b\n\n");
		expect(rows).toEqual([["a", "b"]]);
	});

	it("handles embedded newlines in quoted fields", () => {
		const rows = parseCsv('a,b\n"line1\nline2",2\n');
		expect(rows).toEqual([
			["a", "b"],
			["line1\nline2", "2"],
		]);
	});
});

describe("csvToObjects", () => {
	it("maps rows by header", () => {
		const objs = csvToObjects([
			["x", "y"],
			["1", "2"],
		]);
		expect(objs).toEqual([{ x: "1", y: "2" }]);
	});

	it("returns empty when only header present", () => {
		expect(csvToObjects([["x"]])).toEqual([]);
	});

	it("returns empty for empty input", () => {
		expect(csvToObjects([])).toEqual([]);
	});

	it("fills missing trailing cells with empty string", () => {
		const objs = csvToObjects([
			["x", "y", "z"],
			["1", "2"],
		]);
		expect(objs).toEqual([{ x: "1", y: "2", z: "" }]);
	});
});

describe("parseCsvToObjects", () => {
	it("composes parser + object conversion", () => {
		const objs = parseCsvToObjects('"name","value"\n"a",1\n"b",2\n');
		expect(objs).toEqual([
			{ name: "a", value: "1" },
			{ name: "b", value: "2" },
		]);
	});
});
