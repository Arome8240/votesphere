//import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { ellipsify } from "@/utils/ellipsify";
import { useAuthorization } from "@/utils/useAuthorization";
import { useMobileWallet } from "@/utils/useMobileWallet";
import { Link } from "expo-router";
import { Pressable, View } from "react-native";
import React, { useEffect, useMemo, useCallback, useState } from "react";
import {
  fetchAllPolls,
  getCounter,
  getProvider,
  getReadonlyProvider,
  initialize,
} from "@/utils/blockhain";
import { Poll } from "@/utils/interfaces";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import { useConnection } from "@/utils/ConnectionProvider";
import { useQuery } from "@tanstack/react-query";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import idl from "../../backend/target/idl/backend.json";
import { Backend } from "../../backend/target/types/backend";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [authorizationInProgress, setAuthorizationInProgress] = useState(false);

  const { connection } = useConnection();
  const { authorizeSession, selectedAccount } = useAuthorization();
  const { connect, disconnect } = useMobileWallet();

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

  const {
    data: polls,
    isLoading: isLoadingPolls,
    error: pollsError,
  } = useQuery({
    queryKey: ["polls"],
    queryFn: async () => {
      try {
        console.log("[Polls Query] Starting fetch");
        const program = getReadonlyProvider();
        console.log("[Polls Query] Program:", program);
        if (!program) {
          console.log("[Polls Query] No Program available");
          return [];
        }
        console.log("[Polls Query] Fetching polls...");
        const polls = await fetchAllPolls(program);
        console.log("[Polls Query] Fetched polls:", polls);
        return polls;
      } catch (error) {
        console.error("[Polls Query] Error:", error);
        throw error;
      }
    },
  });

  useEffect(() => {
    if (counter !== undefined && counter !== null) {
      setIsInitialized(counter.toNumber() >= 0);
    }
  }, [counter]);

  const handleConnectPress = useCallback(async () => {
    try {
      if (authorizationInProgress) {
        return;
      }
      setAuthorizationInProgress(true);
      await connect();

      // Initialize after connecting
      if (selectedAccount?.publicKey && authorizeSession && connection) {
        const program = getProvider(
          selectedAccount.publicKey,
          authorizeSession,
          connection.sendTransaction
        );
        if (program) {
          await initialize(program, selectedAccount.publicKey);
          setIsInitialized(true);
        }
      }
    } catch (err: any) {
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
    try {
      if (authorizationInProgress) {
        return;
      }
      setAuthorizationInProgress(true);
      await disconnect();
    } catch (err: any) {
      console.error("Error during disconnect:", err);
    } finally {
      setAuthorizationInProgress(false);
    }
  }, [authorizationInProgress, authorizeSession]);

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
            Polls
          </Text>

          <Link href="/polls/create" asChild>
            <Pressable>
              <Text size="lg" className="text-blue-700">
                Create Poll
              </Text>
            </Pressable>
          </Link>
        </View>

        <View className="mt-8 gap-y-4">
          {pollsError ? (
            <Text className="text-red-500">
              Error loading polls: {pollsError.message}
            </Text>
          ) : isLoadingPolls ? (
            <Text>Loading polls...</Text>
          ) : polls && polls.length > 0 ? (
            polls.map((poll) => (
              <Link
                key={poll.publicKey}
                href={`/polls/${poll.publicKey}`}
                asChild
              >
                <Pressable className="gap-2 p-2 border border-blue-700 rounded-md bg-blue-50">
                  <Text bold={true} className="text-blue-600" size="xl">
                    {poll.description}
                  </Text>

                  <Text size="lg" className="font-ubuntu-medium">
                    Candidates: {poll.candidates}
                  </Text>
                  <View className="flex-row gap-x-2">
                    <Text size="lg">
                      Start: {new Date(poll.start).toLocaleDateString()}
                    </Text>
                    <Text size="lg">
                      End: {new Date(poll.end).toLocaleDateString()}
                    </Text>
                  </View>
                </Pressable>
              </Link>
            ))
          ) : (
            <Text>No polls available</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
