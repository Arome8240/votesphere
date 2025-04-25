import { Pressable, View } from "react-native";
import React from "react";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { usePoll } from "@/utils/useCreatePoll";
import { useMobileWallet } from "@/utils/useMobileWallet";
import { PlusCircle, XCircle } from "lucide-react-native";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalCloseButton,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { TextInput } from "react-native";

export default function id() {
  const { id } = useLocalSearchParams();
  //console.log("Poll ID:", id); // Check this value
  const { pollDetail, candidates, registerCandidate, hasUserVoted, vote } =
    usePoll(id as string);

  const [showModal, setShowModal] = React.useState(false);
  const [candidateName, setCandidateName] = React.useState("");

  console.log(candidates.data);
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
      <View className="mt-5">
        <View className="justify-between flex-row items-center">
          <Text size="xl">Candidates</Text>

          {pollDetail.data?.id != null && (
            <Pressable
              onPress={() => setShowModal(true)}
              // onPress={() => {
              //   registerCandidate.mutateAsync({
              //     name: "Arome",
              //     pollId: pollDetail.data!.id,
              //   });
              // }}
            >
              <PlusCircle size={20} color={"blue"} />
            </Pressable>
          )}
        </View>
        <View className="rounded-lg border border-gray-300 bg-gray-50 mt-3 p-5">
          {candidates.isPending ? (
            <Text>Fetching Candidates</Text>
          ) : (
            <View className="gap-y-4">
              {candidates.data && candidates.data?.length > 0 ? (
                candidates.data?.map((candidate, index) => (
                  <View key={index} className="flex-row justify-between">
                    <View>
                      <Text>Name: {candidate.name}</Text>
                      <Text>
                        Has Registered:{" "}
                        {candidate?.hasRegistered ? "Yes" : "No"}
                      </Text>
                    </View>

                    <View>
                      <Pressable
                        android_ripple={{
                          color: hasUserVoted.data
                            ? "oklch(79.2% 0.209 151.711)"
                            : "transparent",
                        }}
                        className={`${
                          hasUserVoted.data ? "bg-red-700" : "bg-green-700"
                        } rounded-lg p-2`}
                        disabled={hasUserVoted.data}
                        onPress={() => {
                          vote.mutateAsync({
                            pollId: pollDetail.data!.id,
                            candidateId: candidate.cid,
                          });
                        }}
                      >
                        {hasUserVoted.data ? (
                          <Text className="text-white" size="lg">
                            Voted {candidate.votes}
                          </Text>
                        ) : (
                          <Text className="text-white" size="lg">
                            Vote {candidate.votes}
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ))
              ) : (
                <Text size="lg">No Candidate Available on this Poll.</Text>
              )}
            </View>
          )}
        </View>

        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
          }}
          size="md"
        >
          <ModalBackdrop />
          <ModalContent>
            <ModalHeader>
              <Text size="md" className="text-typography-950">
                Add Candidate
              </Text>
              <ModalCloseButton>
                <XCircle color={"gray"} />
              </ModalCloseButton>
            </ModalHeader>
            <ModalBody>
              <TextInput
                placeholder="Candidate Name"
                value={candidateName}
                onChangeText={setCandidateName}
                className="p-4 border border-gray-200 mt-3 rounded-lg"
              />
            </ModalBody>
            <ModalFooter>
              <Button
                onPress={() => {
                  if (candidateName) {
                    registerCandidate.mutateAsync({
                      name: candidateName,
                      pollId: pollDetail.data!.id,
                    });
                    setShowModal(false);
                  }
                }}
              >
                {registerCandidate.isPending ? "Adding" : "Add Candidate"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
