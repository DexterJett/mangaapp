import { Redirect } from "expo-router";
import { MangaDexApi } from '../services/mangadex-api';

export default function Index() {
  // Redirect to login if not authenticated
  if (!MangaDexApi.auth.tokens) {
    return <Redirect href="/login" />;
  }
  return <Redirect href="/(tabs)/search" />;
}
