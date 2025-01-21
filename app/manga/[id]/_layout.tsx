import { Stack } from 'expo-router';

export default function MangaIdLayout() {
  return (
    <Stack 
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="chapters" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="reader/[chapterId]" 
        options={{
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
} 