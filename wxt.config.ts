import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
	manifest: {
		permissions: ["<all_urls>", "webRequest", "webRequestBlocking"],
	},
	modules: ["@wxt-dev/module-react"],
	srcDir: "src",
	vite: () => ({
		plugins: [tailwindcss()],
	}),
});
