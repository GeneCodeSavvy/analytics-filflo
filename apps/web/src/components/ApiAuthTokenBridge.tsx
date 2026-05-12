import { useAuth } from "@clerk/react";
import { useEffect } from "react";
import { setApiAuthTokenGetter } from "../api";

export function ApiAuthTokenBridge() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setApiAuthTokenGetter(null);
      return () => setApiAuthTokenGetter(null);
    }

    setApiAuthTokenGetter(() => getToken());
    return () => setApiAuthTokenGetter(null);
  }, [getToken, isLoaded, isSignedIn]);

  return null;
}
