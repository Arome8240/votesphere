import { Text } from "@/components/ui/text";
import { useAuthorization } from "@/utils/useAuthorization";
import { useMobileWallet } from "@/utils/useMobileWallet";
import { router } from "expo-router";
import {
  Pressable,
  View,
  TextInput,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import React, { useState } from "react";
import { createPoll, getCounter, getProvider } from "@/utils/blockhain";
import { useConnection } from "@/utils/ConnectionProvider";
import { useQuery } from "@tanstack/react-query";
import { BN } from "@coral-xyz/anchor";
import DatePicker from "@/components/ui/date-picker";

export default function CreatePoll() {
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { connection } = useConnection();
  const { authorizeSession, selectedAccount } = useAuthorization();
  const { connect } = useMobileWallet();

  const { data: counter } = useQuery({
    queryKey: ["counter", selectedAccount?.publicKey.toString()],
    queryFn: async () => {
      if (!selectedAccount) return null;
      const program = getProvider(
        selectedAccount.publicKey,
        authorizeSession,
        connection.sendTransaction
      );
      if (!program) return null;
      return await getCounter(program);
    },
    enabled: !!selectedAccount,
  });

  console.log(counter);

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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const DatePickerModal = ({
    visible,
    onClose,
    date,
    onDateChange,
  }: {
    visible: boolean;
    onClose: () => void;
    date: Date;
    onDateChange: (date: Date) => void;
  }) => {
    const [year, setYear] = useState(date.getFullYear().toString());
    const [month, setMonth] = useState((date.getMonth() + 1).toString());
    const [day, setDay] = useState(date.getDate().toString());

    const handleDone = () => {
      const newDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day)
      );
      if (!isNaN(newDate.getTime())) {
        onDateChange(newDate);
      }
      onClose();
    };

    return (
      <Modal visible={visible} transparent={true} animationType="slide">
        <View className="items-center justify-center flex-1 bg-black/50">
          <View className="p-4 bg-white rounded-lg w-80">
            <View className="flex-row space-x-2">
              <View className="flex-1">
                <Text className="mb-1">Year</Text>
                <TextInput
                  value={year}
                  onChangeText={setYear}
                  keyboardType="numeric"
                  className="p-2 border border-gray-300 rounded-md"
                />
              </View>
              <View className="flex-1">
                <Text className="mb-1">Month</Text>
                <TextInput
                  value={month}
                  onChangeText={setMonth}
                  keyboardType="numeric"
                  className="p-2 border border-gray-300 rounded-md"
                />
              </View>
              <View className="flex-1">
                <Text className="mb-1">Day</Text>
                <TextInput
                  value={day}
                  onChangeText={setDay}
                  keyboardType="numeric"
                  className="p-2 border border-gray-300 rounded-md"
                />
              </View>
            </View>
            <Pressable
              onPress={handleDone}
              className="p-2 mt-4 bg-blue-500 rounded-md"
            >
              <Text className="text-center text-white">Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-5">
        <View className="flex-row items-center justify-between mb-5">
          <Text size="2xl" bold={true}>
            Create Poll
          </Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text size="lg" className="mb-2">
              Description
            </Text>
            <TextInput
              className="p-2 border border-gray-300 rounded-md"
              value={description}
              onChangeText={setDescription}
              placeholder="Enter poll description"
              multiline
              numberOfLines={3}
            />
          </View>

          <View>
            <Text size="lg" className="mb-2">
              Start Date
            </Text>
            <DatePicker value={startDate} onValueChange={setStartDate} />
          </View>

          <View>
            <Text size="lg" className="mb-2">
              End Date
            </Text>
            <DatePicker value={endDate} onValueChange={setEndDate} />
          </View>

          <View className="mt-4">
            <Pressable
              onPress={handleCreatePoll}
              disabled={isSubmitting}
              className={`mt-4 p-3 rounded-md ${
                isSubmitting ? "bg-gray-400" : "bg-blue-500"
              }`}
            >
              <Text className="text-center text-white" bold={true}>
                {isSubmitting ? "Creating..." : "Create Poll"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
