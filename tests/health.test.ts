import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";



function createResponseDouble() {
	const response = {
		status: vi.fn(),
		send: vi.fn(),
	};

	response.status.mockReturnValue(response);
	return response;
}

describe("app state", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it("starts as not ready", async () => {
		const { isReady } = await import("../src/app-state.js");

		expect(isReady()).toBe(false);
	});

	it("becomes ready after setReady is called", async () => {
		const { isReady, setReady } = await import("../src/app-state.js");

		setReady();

		expect(isReady()).toBe(true);
	});

	it("remains ready when setReady is called more than once", async () => {
		const { isReady, setReady } = await import("../src/app-state.js");

		setReady();
		setReady();

		expect(isReady()).toBe(true);
	});
});

describe("healthHandler", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it("returns 503 with an unavailable message when the app is not ready", async () => {
		const isReady = vi.fn().mockReturnValue(false);
		vi.doMock("../src/app-state.js", () => ({ isReady }));
		const { healthHandler } = await import("../src/http/handlers/healthHandler.js");
		const response = createResponseDouble();

		healthHandler({} as Request, response as unknown as Response);

		expect(isReady).toHaveBeenCalledOnce();
		expect(response.status).toHaveBeenCalledWith(503);
		expect(response.send).toHaveBeenCalledWith("Service unavailable");
	});

	it("returns 200 with the OK message when the app is ready", async () => {
		const isReady = vi.fn().mockReturnValue(true);
		vi.doMock("../src/app-state.js", () => ({ isReady }));
		const { healthHandler } = await import("../src/http/handlers/healthHandler.js");
		const response = createResponseDouble();

		healthHandler({} as Request, response as unknown as Response);

		expect(isReady).toHaveBeenCalledOnce();
		expect(response.status).toHaveBeenCalledWith(200);
		expect(response.send).toHaveBeenCalledWith("[+] OK");
	});
});

describe("initializeApplication", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it("checks the database, runs migrations, then marks the app ready", async () => {
		const checkDatabaseConnection = vi.fn().mockResolvedValue(undefined);
		const runMigration = vi.fn().mockResolvedValue(undefined);
		const setReady = vi.fn();
		vi.doMock("../src/db", () => ({ checkDatabaseConnection }));
		vi.doMock("../src/db/migrate", () => ({ runMigration }));
		vi.doMock("../src/app-state", () => ({ setReady }));
		const { initializeApplication } = await import("../src/startup.js");

		await initializeApplication();

		expect(checkDatabaseConnection).toHaveBeenCalledOnce();
		expect(runMigration).toHaveBeenCalledOnce();
		expect(setReady).toHaveBeenCalledOnce();
		expect(checkDatabaseConnection.mock.invocationCallOrder[0]).toBeLessThan(
			runMigration.mock.invocationCallOrder[0],
		);
		expect(runMigration.mock.invocationCallOrder[0]).toBeLessThan(
			setReady.mock.invocationCallOrder[0],
		);
	});

	it("does not run migrations or mark the app ready when the database check fails", async () => {
		const databaseError = new Error("database unavailable");
		const checkDatabaseConnection = vi.fn().mockRejectedValue(databaseError);
		const runMigration = vi.fn();
		const setReady = vi.fn();
		vi.doMock("../src/db", () => ({ checkDatabaseConnection }));
		vi.doMock("../src/db/migrate", () => ({ runMigration }));
		vi.doMock("../src/app-state", () => ({ setReady }));
		const { initializeApplication } = await import("../src/startup.js");

		await expect(initializeApplication()).rejects.toBe(databaseError);

		expect(runMigration).not.toHaveBeenCalled();
		expect(setReady).not.toHaveBeenCalled();
	});

	it("does not mark the app ready when migrations fail", async () => {
		const migrationError = new Error("migration failed");
		const checkDatabaseConnection = vi.fn().mockResolvedValue(undefined);
		const runMigration = vi.fn().mockRejectedValue(migrationError);
		const setReady = vi.fn();
		vi.doMock("../src/db", () => ({ checkDatabaseConnection }));
		vi.doMock("../src/db/migrate", () => ({ runMigration }));
		vi.doMock("../src/app-state", () => ({ setReady }));
		const { initializeApplication } = await import("../src/startup.js");

		await expect(initializeApplication()).rejects.toBe(migrationError);

		expect(setReady).not.toHaveBeenCalled();
	});
});
