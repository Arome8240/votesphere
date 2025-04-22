import { View, Text, Pressable } from "react-native";
import React from "react";
import { Link } from "expo-router";

export default function index() {
  return (
    <View>
      <Text>index</Text>
      <Link href={"/home"} asChild>
        <Pressable
          android_ripple={{ color: "gray" }}
          style={{ padding: 10, backgroundColor: "blue", borderRadius: 5 }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Home</Text>
        </Pressable>
      </Link>
    </View>
  );
}
