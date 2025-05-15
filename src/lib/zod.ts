import { z } from "zod";

const regexPatternSchema = z.string().refine(
	(pattern) => {
		try {
			new RegExp(pattern);
			return true;
		} catch {
			return false;
		}
	},
	{
		message: "Invalid regular expression pattern",
	}
);

export const rulesSchema = z.object({
	providers: z.record(
		z.string(),
		z.object({
			/** Regex (`{rule}`i) URLs that should be cleaned */
			urlPattern: regexPatternSchema,
			/** Block matched `urlPattern` */
			completeProvider: z.boolean().default(false),
			/** [0] Regex (`{rule}`i) Exempt URLs */
			exceptions: z.array(z.string()).default([]),
			/** [3] Regex (`^{rule}$`gi) to match query(/fragment) *keys* params to be removed */
			rules: z.array(regexPatternSchema).default([]),
			/** [2] Regex `{rule}`gi to delete a substring of the URI */
			rawRules: z.array(z.string()).default([]),
			/** [3] Referal marketing Regex for query params */
			referralMarketing: z.array(z.string()).default([]),
			/** [1] Regex containing a group with the URL being redirected to */
			redirections: z.array(regexPatternSchema).default([]),
			forceRedirection: z.boolean().default(false),
		})
	),
});

export type RulesSchema = typeof rulesSchema;
