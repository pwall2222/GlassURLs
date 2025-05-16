import { initTRPC } from "@trpc/server";
import { createChromeHandler } from "trpc-chrome/adapter";
import { rulesSchema } from "@/lib/zod";
import greenGlass from "@/assets/green-glass.png";
import redGlass from "@/assets/red-glass.png";
import { z } from "zod";

const setIcon = (enabled: boolean) => {
	browser.browserAction.setIcon({
		path: enabled ? greenGlass : redGlass,
	});
};
const setTabIcon = (enabled: boolean, tabId: number) => {
	browser.browserAction.setIcon({
		tabId: tabId,
		path: enabled ? greenGlass : redGlass,
	});
};

const t = initTRPC.create({
	isServer: false,
	allowOutsideOfServer: true,
});

let state = { enabled: true, tabs: new Map() as Map<number, boolean> };

const appRouter = t.router({
	getEnabled: t.procedure.input(z.number()).query(({ input }) => {
		if (!state.enabled) {
			return false;
		}
		const tabEnabled = state.tabs.get(input);
		if (tabEnabled === undefined) {
			return true;
		}
		return tabEnabled;
	}),
	toggle: t.procedure.input(z.number()).mutation(({ input }) => {
		if (!state.enabled) {
			return false;
		}
		const tabEnabled = state.tabs.get(input);
		let next = !tabEnabled;
		if (tabEnabled === undefined) {
			next = false;
		}
		state.tabs.set(input, next);
		console.log(input);
		setTabIcon(next, input);
	}),
	getEnabledGlobal: t.procedure.query(() => {
		return state.enabled;
	}),
	toggleGlobal: t.procedure.mutation(() => {
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

		browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
			const tabEnabled = state.tabs.get(tabId);
			if (tabEnabled === undefined) {
				return;
			}
			if (changeInfo.status !== "loading") {
				return;
			}
			setTabIcon(tabEnabled, tabId);
		});

		browser.webRequest.onBeforeRequest.addListener(
			(v) => {
				if (!state.enabled) {
					return;
				}
				if (state.tabs.get(v.tabId) === false) {
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
