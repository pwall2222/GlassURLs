import { initTRPC } from "@trpc/server";
import { createChromeHandler } from "trpc-chrome/adapter";
import { rulesSchema } from "@/lib/zod";
import greenGlass from "@/assets/green-glass.png";
import redGlass from "@/assets/red-glass.png";

const setIcon = (enabled: boolean) => {
	browser.browserAction.setIcon({
		path: enabled ? greenGlass : redGlass,
	});
};

const t = initTRPC.create({
	isServer: false,
	allowOutsideOfServer: true,
});

let state = { enabled: true };

const appRouter = t.router({
	getEnabled: t.procedure.query(() => {
		return state.enabled;
	}),
	toggle: t.procedure.mutation(() => {
		state.enabled = !state.enabled;
		setIcon(state.enabled);
	}),
});

export default defineBackground(() => {
	(async () => {
		const rulesReq = await fetch(
			"https://rules2.clearurls.xyz/data.minify.json"
		);
		const rules = await rulesReq.json();
		const data = rulesSchema.safeParse(rules)?.data;
		if (!data?.providers) {
			return;
		}
		console.log("hiiii");
		const providerData = Object.values(data.providers);

		interface Provider {
			fields: RegExp[];
			raw: RegExp[];
			exceptions: RegExp[];
		}

		const providers = new Map(
			providerData.map((provider) => [
				new RegExp(provider.urlPattern, "i"),
				{
					fields: provider.rules
						.concat(provider.referralMarketing)
						.map((field) => new RegExp("^" + field + "$", "gi")),
					raw: provider.rawRules.map(
						(field) => new RegExp(field, "gi")
					),
					exceptions: provider.exceptions.map(
						(field) => new RegExp(field, "i")
					),
				},
			])
		);

		function cleanUrl(url: string) {
			for (const regex of providers.keys()) {
				if (!regex.test(url)) continue;
				const provider = providers.get(regex);
				if (!provider) {
					return;
				}
				url = cleanProcess(provider, url);
			}
			return url;
		}
		function cleanProcess(provider: Provider, rawUrl: string) {
			for (const exception of provider.exceptions) {
				if (exception.test(rawUrl)) {
					return rawUrl;
				}
			}
			for (const raw of provider.raw) {
				rawUrl = rawUrl.replace(raw, "");
			}
			const url = new URL(rawUrl);
			const urlParams = Array.from(url.searchParams.keys());
			for (const field of provider.fields) {
				urlParams.forEach((param) => {
					const test = field.test(param);
					field.lastIndex = 0;

					if (!test) {
						return;
					}

					url.searchParams.delete(param);
				});
			}
			return url.toString();
		}

		setIcon(state.enabled);

		browser.webRequest.onBeforeRequest.addListener(
			(v) => {
				if (!state.enabled) {
					return;
				}
				const clean = cleanUrl(v.url);
				if (clean != v.url) {
					return { redirectUrl: clean };
				}
			},
			{
				urls: ["<all_urls>"],
			},
			["blocking"]
		);
	})();

	createChromeHandler({
		router: appRouter,
	});
});
export type AppRouter = typeof appRouter;
