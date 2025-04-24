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
import { usePoll } from "@/utils/useCreatePoll";
import DatePicker from "@/components/ui/date-picker";

export default function create() {
  const [description, setDescription] = useState("Text");
  const [start, setStartDate] = useState(new Date());
  const [end, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  });

  const { createPoll, count } = usePoll();

  const handleCreatePoll = async () => {
    try {
      const result = await createPoll.mutateAsync({
        description: description,
        start: start.getTime() / 1000,
        end: end.getTime() / 1000,
      });
      router.replace("/");
      console.log("Poll created successfully:", result);
    } catch (error) {
      console.error("Error creating poll:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 p-5 bg-white">
      <Text size="2xl">Create Poll</Text>

      <View className="gap-y-4 mt-5">
        <View className="gap-2">
          <Text size="lg">Description</Text>
          <TextInput
            className="p-4 border border-gray-100 rounded-md"
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
          />
        </View>

        <DatePicker value={start} onValueChange={setStartDate} />
        <DatePicker value={end} onValueChange={setEndDate} />
      </View>

      <Pressable
        className="mt-5 "
        onPress={handleCreatePoll}
        disabled={!count.data?.count && createPoll.isPending}
        style={{ padding: 16, backgroundColor: "blue", borderRadius: 10 }}
      >
        <Text
          style={{ color: "white", fontWeight: "bold", textAlign: "center" }}
          bold={true}
        >
          {createPoll.isPending ? "Creating..." : "Create Poll"}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
