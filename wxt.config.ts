import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
	browser: "firefox",
	manifest: {
		permissions: ["<all_urls>", "webRequest", "webRequestBlocking", "tabs"],
		action: {},
		browser_action: {},
	},
	modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
	srcDir: "src",
	autoIcons: {
		enabled: true,
		baseIconPath: "assets/glass.png",
	},
	vite: () => ({
		plugins: [tailwindcss()],
	}),
});
