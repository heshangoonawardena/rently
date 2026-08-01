"use client";

import { useState } from "react";
import { createQueryClient } from "./query/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export function Providers(props: { children: React.ReactNode }) {
	const [queryClient] = useState(() => createQueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			{props.children}
			<ReactQueryDevtools/>
		</QueryClientProvider>
	);
}
