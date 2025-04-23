import { Text } from "@/components/ui/text";
import { useAuthorization } from "@/utils/useAuthorization";
import { useMobileWallet } from "@/utils/useMobileWallet";
import { Link } from "expo-router";
import { Pressable, View } from "react-native";
import React, { useCallback, useState } from "react";
import { getProvider, initialize } from "@/utils/blockhain";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCounterProgram } from "@/utils/useCounter";
import { BN } from "@coral-xyz/anchor";
import { useConnection } from "@/utils/ConnectionProvider";
import { usePoll } from "@/utils/useCreatePoll";

export default function Index() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [authorizationInProgress, setAuthorizationInProgress] = useState(false);
  const { polls, createPoll, createCounter, count } = usePoll();

  //console.log(polls.data);

  const start = Math.floor(new Date("2025-04-22").getTime() / 1000);
  const end = Math.floor(new Date("2025-08-20").getTime() / 1000);

  const { connection } = useConnection();
  const { authorizeSession, selectedAccount } = useAuthorization();
  const { connect, disconnect } = useMobileWallet();
  const { counterAccount } = useCounterProgram();

  const handleConnectPress = useCallback(async () => {
    if (authorizationInProgress) return;
    setAuthorizationInProgress(true);

    try {
      await connect();

      if (selectedAccount?.publicKey && authorizeSession && connection) {
        const program = getProvider(
          selectedAccount.publicKey,
          authorizeSession,
          connection.sendTransaction
        );

        if (program) {
          await initialize(program);
          setIsInitialized(true);
        }
      }
    } catch (err) {
      console.error("Error during connect/initialize:", err);
    } finally {
      setAuthorizationInProgress(false);
    }
  }, [
    authorizationInProgress,
    authorizeSession,
    connection,
    selectedAccount?.publicKey,
  ]);

  const handleDisconnect = useCallback(async () => {
    if (authorizationInProgress) return;
    setAuthorizationInProgress(true);

    try {
      await disconnect();
    } catch (err) {
      console.error("Error during disconnect:", err);
    } finally {
      setAuthorizationInProgress(false);
    }
  }, [authorizationInProgress]);

  return (
    <SafeAreaView className="flex-1 p-5 bg-white">
      <View className="flex-row items-center justify-between">
        <Text size="2xl" bold={true}>
          DVoter
        </Text>

        {selectedAccount ? (
          <Pressable
            disabled={authorizationInProgress}
            onPress={handleDisconnect}
            android_ripple={{ color: "gray" }}
            style={{ padding: 10, backgroundColor: "red", borderRadius: 5 }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>
              Disconnect
            </Text>
          </Pressable>
        ) : (
          <Pressable
            disabled={authorizationInProgress}
            onPress={handleConnectPress}
            android_ripple={{ color: "gray" }}
            style={{ padding: 10, backgroundColor: "blue", borderRadius: 5 }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>
              Connect Wallet
            </Text>
          </Pressable>
        )}
      </View>

      <View className="mt-5">
        <View className="flex-row items-center justify-between">
          <Text size="3xl" className="text-blue-700">
            Polls{" "}
            {counterAccount.data?.count instanceof BN
              ? counterAccount.data.count.toString()
              : "0"}
          </Text>

          {!count.data?.count && (
            <Pressable onPress={() => createCounter.mutateAsync()}>
              <Text className="text-red-600">Create Counter</Text>
            </Pressable>
          )}

          <Pressable
            onPress={async () => {
              try {
                const result = await createPoll.mutateAsync({
                  description: "Just testing",
                  start,
                  end,
                });
                console.log("Poll created successfully:", result);
              } catch (error) {
                console.error("Error creating poll:", error);
              }
            }}
          >
            <Text size="lg" className="text-blue-700">
              Create Poll
            </Text>
          </Pressable>
        </View>

        <View>
          {polls.isPending ? (
            <Text size="2xl">Loading polls</Text>
          ) : (polls?.data?.length ?? 0) < 1 ? (
            <Text>No Polls</Text>
          ) : (
            <View>
              {polls?.data?.map((poll, index) => (
                <Text key={index}>{poll.description}</Text>
              ))}
            </View>
          )}

          {polls.isError && (
            <Text>Error loading polls: {polls.error.message}</Text>
          )}
        </View>

        {/* Uncomment when you integrate polls fetching */}
        {/* <PollList /> */}
      </View>
    </SafeAreaView>
  );
}
