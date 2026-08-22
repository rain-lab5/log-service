import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { errorHandler } from "../src/http/middleware/errorHandler.js";

function createResponseDouble() {
	const response = {
		status: vi.fn(),
		json: vi.fn(),
	};

	response.status.mockReturnValue(response);
	return response;
}

describe("errorHandler", () => {
	it("returns 400 for malformed JSON", () => {
		const response = createResponseDouble();
		const parseError = { type: "entity.parse.failed" };

		errorHandler(
			parseError,
			{} as Request,
			response as unknown as Response,
			vi.fn(),
		);

		expect(response.status).toHaveBeenCalledWith(400);
		expect(response.json).toHaveBeenCalledWith({
			error: "malformed JSON",
		});
	});

	it("returns 500 for unexpected errors", () => {
		const response = createResponseDouble();

		errorHandler(
			new Error("unexpected failure"),
			{} as Request,
			response as unknown as Response,
			vi.fn(),
		);

		expect(response.status).toHaveBeenCalledWith(500);
		expect(response.json).toHaveBeenCalledWith({
			error: "internal server error",
		});
	});
});