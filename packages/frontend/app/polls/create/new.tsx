import { Pressable, TextInput, View } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { fetchAllPolls, getCounter } from "@/utils/blockhain";
import { useQuery } from "@tanstack/react-query";
import { getReadonlyProvider } from "@/utils/blockhain";
import { useAuthorization } from "@/utils/useAuthorization";

export default function create() {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const { selectedAccount } = useAuthorization();
  const { data: counter } = useQuery({
    queryKey: ["counter", selectedAccount?.publicKey.toString()],
    queryFn: async () => {
      if (!selectedAccount) return null;
      const program = getReadonlyProvider();
      if (!program) return null;
      return await getCounter(program);
    },
    enabled: !!selectedAccount,
  });

  const { data: polls, isLoading: isLoadingPolls } = useQuery({
    queryKey: ["polls"],
    queryFn: async () => {
      const program = getReadonlyProvider();
      if (!program) return [];
      return await fetchAllPolls(program);
    },
  });

  console.log(
    "Polls:",
    polls || "undefined",
    "Counter:",
    counter || "undefined"
  );

  useEffect(() => {
    if (counter !== undefined && counter !== null) {
      setIsInitialized(counter.toNumber() >= 0);
    }
  }, [counter]);
  return (
    <SafeAreaView className="flex-1 p-5 bg-white">
      <Text size="2xl">
        Create Poll {selectedAccount?.publicKey.toString()}
        {" Counter "}
        {counter?.toNumber()}
      </Text>

      <View className="gap-2 mt-5">
        <Text size="lg">Description</Text>

        <TextInput
          className="p-2 border border-gray-100 rounded-md"
          placeholder="Enter description"
        />
      </View>

      <Pressable className="p-2 bg-blue-700">
        <Text>Create Poll</Text>
      </Pressable>
    </SafeAreaView>
  );
}
