//import "../index.js";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClusterProvider } from "@/utils/cluster-data-access";
import { ConnectionProvider } from "@/utils/ConnectionProvider";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClusterProvider>
        <ConnectionProvider config={{ commitment: "processed" }}>
          <Stack />
        </ConnectionProvider>
      </ClusterProvider>
    </QueryClientProvider>
  );
}
