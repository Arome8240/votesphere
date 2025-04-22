import { View, Text } from "react-native";
import React from "react";
import { Link } from "expo-router";

export default function and() {
  return (
    <View>
      <Link href="/">
        <Text>Go to index</Text>
      </Link>
      <Text>and</Text>
    </View>
  );
}
