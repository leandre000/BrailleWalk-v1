import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";
import GradientBackground from "@/components/GradientBackground";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!", headerShown: false }} />
      <GradientBackground>
        <View className="flex-1 items-center justify-center p-5">
          <Text className="text-xl font-bold text-white">This screen doesn't exist.</Text>

          <Link href="/" className="mt-4 py-4">
            <Text className="text-sm text-blue-300">Go to home screen!</Text>
          </Link>
        </View>
      </GradientBackground>
    </>
  );
}

