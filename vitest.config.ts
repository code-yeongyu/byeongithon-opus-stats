import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["test/**/*.test.ts"],
		environment: "happy-dom",
		coverage: {
			provider: "v8",
			reporter: ["text", "html"],
			include: ["src/**/*.ts"],
			exclude: ["src/worker/**", "src/**/*.d.ts"],
		},
	},
});
