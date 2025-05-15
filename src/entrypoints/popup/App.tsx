import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { chromeLink } from "trpc-chrome/link";
import "@/assets/style.css";
import { Popup } from "./popup";

const port = chrome.runtime.connect();
const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
	links: [chromeLink({ port })],
});

export default function App() {
	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				<Popup></Popup>
			</QueryClientProvider>
		</trpc.Provider>
	);
}
