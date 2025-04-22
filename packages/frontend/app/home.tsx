import { ellipsify } from "@/utils/ellipsify";
import { useAuthorization } from "@/utils/useAuthorization";
import { useMobileWallet } from "@/utils/useMobileWallet";
import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function Index() {
  const [authorizationInProgress, setAuthorizationInProgress] = useState(false);

  const { authorizeSession, selectedAccount } = useAuthorization();
  const { connect } = useMobileWallet();

  const handleConnectPress = useCallback(async () => {
    try {
      if (authorizationInProgress) {
        return;
      }
      setAuthorizationInProgress(true);
      await connect();
    } catch (err: any) {
      // alertAndLog(
      //   "Error during connect",
      //   err instanceof Error ? err.message : err
      // );
    } finally {
      setAuthorizationInProgress(false);
    }
  }, [authorizationInProgress, authorizeSession]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 20 }}>
        {ellipsify(selectedAccount?.publicKey.toBase58())}
      </Text>
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
    </View>
  );
}
