import { Pressable, View } from "react-native";
import React from "react";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { usePoll } from "@/utils/useCreatePoll";

export default function id() {
  const { id } = useLocalSearchParams();
  //console.log("Poll ID:", id); // Check this value
  const { pollDetail } = usePoll(id as string);
  return (
    <SafeAreaView className="flex-1 p-5 bg-white">
      <Text className="" size="2xl">
        Poll Details
      </Text>

      <View className="mt-2">
        {pollDetail.isPending ? (
          <Text>Loading</Text>
        ) : (
          <Pressable
            android_ripple={{ color: "oklch(70.7% 0.165 254.624)" }}
            className="p-4 bg-blue-100 border border-blue-500 rounded-lg"
          >
            <Text bold={true} size="xl">
              {pollDetail.data?.description}
            </Text>
            <Text bold={true} size="lg">
              Candidates: {pollDetail.data?.candidates}
            </Text>
            <Text size="lg">
              {`Start : ${
                pollDetail.data?.start
                  ? new Date(pollDetail.data.start).toLocaleDateString()
                  : "N/A"
              } End : ${
                pollDetail.data?.end
                  ? new Date(pollDetail.data.end).toLocaleDateString()
                  : "N/A"
              }`}
            </Text>
          </Pressable>
        )}
        {pollDetail.isError && <Text>{pollDetail.error.message}</Text>}
      </View>
    </SafeAreaView>
  );
}
