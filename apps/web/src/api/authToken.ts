type ApiAuthTokenGetter = () => string | null | undefined | Promise<string | null | undefined>;

let apiAuthTokenGetter: ApiAuthTokenGetter | null = null;

export const setApiAuthTokenGetter = (getter: ApiAuthTokenGetter) => {
  apiAuthTokenGetter = getter;

  return () => {
    if (apiAuthTokenGetter === getter) {
      apiAuthTokenGetter = null;
    }
  };
};

export const clearApiAuthTokenGetter = () => {
  apiAuthTokenGetter = null;
};

export const getApiAuthToken = async () => {
  if (!apiAuthTokenGetter) {
    return null;
  }

  return (await apiAuthTokenGetter()) ?? null;
};
