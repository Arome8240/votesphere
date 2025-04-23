import { Alert, Pressable, TextInput, View } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import {
  createPoll,
  fetchAllPolls,
  getCounter,
  getProvider,
} from "@/utils/blockhain";
import { useQuery } from "@tanstack/react-query";
import { getReadonlyProvider } from "@/utils/blockhain";
import { useAuthorization } from "@/utils/useAuthorization";
import { router } from "expo-router";
import { useConnection } from "@/utils/ConnectionProvider";
import { BN } from "@coral-xyz/anchor";

export default function create() {
  const [description, setDescription] = useState("Text");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const { selectedAccount, authorizeSession } = useAuthorization();
  const { connection } = useConnection();
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

  const handleCreatePoll = async () => {
    if (
      !selectedAccount?.publicKey ||
      !authorizeSession ||
      !connection ||
      !counter
    ) {
      Alert.alert("Error", "Please connect your wallet first");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return;
    }

    if (startDate >= endDate) {
      Alert.alert("Error", "End date must be after start date");
      return;
    }

    try {
      setIsSubmitting(true);
      const program = getProvider(
        selectedAccount.publicKey,
        authorizeSession,
        connection.sendTransaction
      );

      if (!program) {
        throw new Error("Failed to get program provider");
      }

      const nextCount = counter.add(new BN(1));
      const startTimestamp = Math.floor(startDate.getTime() / 1000);
      const endTimestamp = Math.floor(endDate.getTime() / 1000);

      await createPoll(
        program,
        selectedAccount.publicKey,
        nextCount,
        description,
        startTimestamp,
        endTimestamp
      );

      Alert.alert("Success", "Poll created successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error("Error creating poll:", error);
      Alert.alert("Error", error.message || "Failed to create poll");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <SafeAreaView className="flex-1 p-5 bg-red-500">
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

      <Pressable
        onPress={handleCreatePoll}
        disabled={isSubmitting}
        style={{ padding: 10, backgroundColor: "blue", borderRadius: 5 }}
      >
        <Text
          style={{ color: "white", fontWeight: "bold", textAlign: "center" }}
          bold={true}
        >
          Create Poll
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
