import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

import { handleAddLogs } from "../src/http/handlers/handleAddLogs.js";

function createResponseDouble() {
	const response = {
		status: vi.fn(),
		json: vi.fn(),
	};

	response.status.mockReturnValue(response);
	return response;
}

async function callHandler(body: unknown) {
	const response = createResponseDouble();

	await handleAddLogs({ body } as Request, response as unknown as Response);

	return response;
}

describe("POST /logs", () => {
	it("accepts valid entries and reports invalid entries by index", async () => {
		const response = await callHandler({
			logs: [
				{
					timestamp: "2026-08-20T14:32:01.123Z",
					level: "info",
					service: "checkout",
					message: "payment started",
					attributes: { retries: 1, cached: false },
				},
				{
					timestamp: "2026-08-20T14:32:01.123Z",
					level: "critical",
					service: "checkout",
					message: "payment failed",
				},
				{
					timestamp: "not a timestamp",
					level: "error",
					service: "checkout",
					message: "payment failed",
				},
				{
					timestamp: "2026-08-20T14:32:01.123Z",
					level: "error",
					message: "payment failed",
				},
				{
					timestamp: "2026-08-20T14:32:01.123Z",
					level: "error",
					service: "checkout",
					message: "",
				},
				{
					timestamp: "2026-08-20T14:32:01.123Z",
					level: "error",
					service: "checkout",
					message: "payment failed",
					attributes: { request: { id: "42" } },
				},
				{
					timestamp: "2026-08-20T14:32:01.123Z",
					level: "error",
					service: "checkout",
					message: "payment failed",
					attributes: ["eu-west"],
				},
				{
					timestamp: "20 July 2026 14:32:01 UTC",
					level: "error",
					service: "checkout",
					message: "payment failed",
				},
			],
		});

		expect(response.status).toHaveBeenCalledWith(200);
		expect(response.json).toHaveBeenCalledWith({
			accepted: 1,
			rejected: [
				{ index: 1, reason: "invalid level: critical" },
				{ index: 2, reason: "invalid timestamp" },
				{ index: 3, reason: "service must be a non-empty string" },
				{ index: 4, reason: "message must be a non-empty string" },
				{ index: 5, reason: "attributes must be a flat object" },
				{ index: 6, reason: "attributes must be a flat object" },
				{ index: 7, reason: "invalid timestamp" },
			],
		});
	});

	it("returns 400 when every entry is rejected", async () => {
		const response = await callHandler({
			logs: [
				{
					timestamp: "2026-08-20T14:32:01.123Z",
					level: "critical",
					service: "checkout",
					message: "payment failed",
				},
			],
		});

		expect(response.status).toHaveBeenCalledWith(400);
		expect(response.json).toHaveBeenCalledWith({
			accepted: 0,
			rejected: [{ index: 0, reason: "invalid level: critical" }],
		});
	});

	it("returns 400 when the top-level body is not a logs batch", async () => {
		const response = await callHandler({ logs: "not an array" });

		expect(response.status).toHaveBeenCalledWith(400);
	});

	it("rejects whitespace-only service and message values", async () => {
		const response = await callHandler({
			logs: [
				{
					timestamp: "2026-08-20T14:32:01.123Z",
					level: "info",
					service: "   ",
					message: "payment started",
				},
				{
					timestamp: "2026-08-20T14:32:01.123Z",
					level: "info",
					service: "checkout",
					message: "\t",
				},
			],
		});

		expect(response.status).toHaveBeenCalledWith(400);
		expect(response.json).toHaveBeenCalledWith({
			accepted: 0,
			rejected: [
				{ index: 0, reason: "service must be a non-empty string" },
				{ index: 1, reason: "message must be a non-empty string" },
			],
		});
	});
});