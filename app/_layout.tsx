import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen 
          name="manga/[id]"
          options={{ presentation: 'card' }}
        />
        <Stack.Screen 
          name="manga/[id]/chapters"
          options={{ presentation: 'card' }}
        />
        <Stack.Screen 
          name="manga/[id]/reader/[chapterId]"
          options={{ presentation: 'fullScreenModal' }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
