import { useAuth } from "@clerk/react";
import { useEffect } from "react";
import {
  clearApiAuthTokenGetter,
  setApiAuthTokenGetter,
} from "../api/authToken";

export function ApiAuthTokenBridge() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      clearApiAuthTokenGetter();
      return;
    }

    return setApiAuthTokenGetter(() => getToken());
  }, [getToken, isLoaded, isSignedIn]);

  return null;
}
