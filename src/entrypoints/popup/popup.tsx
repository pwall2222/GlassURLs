import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Power } from "lucide-react";

export function Popup() {
	const utils = trpc.useUtils();
	const enabled = trpc.getEnabled.useQuery();
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
				onClick={() => change.mutate()}
			>
				<Power className="size-16" />
			</Button>
		</>
	);
}
