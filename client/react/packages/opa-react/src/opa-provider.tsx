import {
  PropsWithChildren,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import isEqual from "lodash/isEqual";
import { OPAClient, Input, Result } from "@styra/opa";

interface AuthzProviderContext {
  result: Result | undefined;
  setInput: (_?: Input) => void;
}

// Reference: https://reacttraining.com/blog/react-context-with-typescript
export const AuthzContext = createContext<AuthzProviderContext | null>(null);

type AuthzProviderProps = PropsWithChildren<{
  sdk: OPAClient;
  path: string;
  defaultInput?: Record<string, string>;
}>;

/**
 * Configures the authorization endpoint, enabling batch query requests with caching.
 * The <AuthzProvider/> wrapper needs to be as high as possible in the component tree,
 * since <Authz/> or `useAuthz` may only be used inside that wrapper.
 *
 * If all API calls need to include one or more constant query parameters,
 * use the `defaultInput` prop.
 * Any individual <Authz/> or `useAuthz` will have those automatically applied.
 * Any individual <Authz/> or `useAuthz` may also override those defaults
 * by specifying a query parameter of the same name.
 * (Note that you cannot remove a query parameter coming from the `defaultInput` set;
 * you can only modify it or empty it (with an empty value).
 *
 * @param props.children The content over which the authz context will apply.
 * @param props.endpoint  API endpoint to check authorization decisions.
 * @param props.defaultInput Default input for every decision unless overridden.
 *
 * @example
 *   <AuthzProvider sdk={sdk} defaultInput={{tenant: 'acme-corp'}}>
 *     <App/>
 *   </AuthzProvider>
 */
// TODO(sr): later: opportunistically invoke bulk decision endpoint
export default function AuthzProvider({
  children,
  sdk,
  path,
  defaultInput,
}: AuthzProviderProps) {
  const [input, setInput] = useState<Input | undefined>();
  const [result, setResult] = useState<Result>();

  const context = useMemo<AuthzProviderContext>(
    () => ({ result, setInput }),
    [result, setInput],
  );

  const handleResult = useCallback(
    (newResult: Result) => {
      if (!newResult) {
        return;
      }

      if (!isEqual(result, newResult)) {
        setResult(newResult);
      }
    },
    [result],
  );

  useEffect(() => {
    // debounce authz API request
    const timeout = setTimeout(() => {
      sdk
        .evaluate<any, Result>(path, input)
        .then((result) => handleResult(result));
    }, 100);

    return () => clearTimeout(timeout);
  }, [defaultInput, input, path, sdk, handleResult]);

  return (
    <AuthzContext.Provider value={context}>{children}</AuthzContext.Provider>
  );
}
