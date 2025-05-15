import { initTRPC } from "@trpc/server";
import { createChromeHandler } from "trpc-chrome/adapter";
import { rulesSchema } from "@/lib/zod";

export type AppRouter = typeof appRouter;

const t = initTRPC.create({
	isServer: false,
	allowOutsideOfServer: true,
});

let enabled = true;

const appRouter = t.router({
	getEnabled: t.procedure.query(() => {
		return enabled;
	}),
	toggle: t.procedure.mutation(() => {
		enabled = !enabled;
	}),
});

(async () => {
	const rulesReq = await fetch(
		"https://rules2.clearurls.xyz/data.minify.json"
	);
	const rules = await rulesReq.json();
	const data = rulesSchema.safeParse(rules)?.data;
	if (!data?.providers) {
		return;
	}
	console.log("hi");
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
				raw: provider.rawRules.map((field) => new RegExp(field, "gi")),
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

	browser.webRequest.onBeforeRequest.addListener(
		(v) => {
			if (!enabled) {
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
