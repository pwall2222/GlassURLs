import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Power } from "lucide-react";

export function Popup() {
	const tab = useQuery({
		queryKey: ["tab"],
		queryFn: () =>
			new Promise((resolve) => {
				chrome.tabs.query(
					{ active: true, lastFocusedWindow: true },
					resolve
				);
			}),
	});

	const tabId = tab?.data?.at(0)?.id ?? 0;
	const utils = trpc.useUtils();

	const enabled = trpc.getEnabled.useQuery(tabId);
	const change = trpc.toggle.useMutation({
		onSuccess() {
			utils.getEnabled.invalidate();
		},
	});

	return (
		<>
			<Button
				className={cn(
					"size-20",
					enabled.data
						? "bg-green-500 hover:bg-green-600"
						: "bg-red-500 hover:bg-red-600"
				)}
				onClick={() => change.mutate(tabId)}
			>
				<Power className="size-16" />
			</Button>
		</>
	);
}
