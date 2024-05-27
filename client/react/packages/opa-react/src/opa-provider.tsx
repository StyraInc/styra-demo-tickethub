import {
  PropsWithChildren,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import isEqual from "lodash/isEqual";
import { OPAClient } from "@styra/opa";

/**
 * A resource that requires authorization consisting of an API endpoint (url),
 * an HTTP method, and an action.
 */
export interface Resource {
  // action: ApiAction;
  // method: HttpMethod;
  // url: string;
  // type?: string; // present in resources but not used by authz
}

// TODO(sr): generalize
export interface AuthzEvaluationRequest {
  // check_option: "HTTP";
  // operation: HttpMethod;
  // path: string;
  // action: ApiAction;
}

// TODO(sr): generalize
export interface AuthzEvaluationResponse {
  // check_option: "HTTP";
  // operation: HttpMethod;
  // path: string;
  // allowed: boolean;
  // eval_error: boolean;
}

interface AuthzProviderContext {
  decision: Record<string, boolean>;
  addResource: (resource: Resource) => void;
}

export interface JsonResponse {
  result: AuthzEvaluationResponse[];
}

// Reference: https://reacttraining.com/blog/react-context-with-typescript
export const AuthzContext = createContext<AuthzProviderContext | null>(null);

export const Query = {
  stringify: (path: string, input?: Record<string, string>): string => {
    const params = new URLSearchParams(input ?? {}).toString();
    return params ? `${path}?${params}` : path;
  },
  parse: (query: string): { path: string; input: Record<string, string> } => {
    const _ = "http://any.domain";
    const url = new URL(query, _);
    return {
      path: url.pathname,
      input: Object.fromEntries(url.searchParams.entries()),
    };
  },
};

type AuthzProviderProps = PropsWithChildren<{
  endpoint: string;
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
 *   <AuthzProvider endpoint="/api/authz" defaultInput={{tenant: 'acme-corp'}}>
 *     <App/>
 *   </AuthzProvider>
 */
// TODO(sr): later: opportunistically invoke bulk decision endpoint
export default function AuthzProvider({
  children,
  endpoint,
  path,
  defaultInput,
}: AuthzProviderProps) {
  const sdk = new OPAClient(endpoint);
  const [resourceMap, setResourceMap] = useState<Map<string, Resource>>(
    new Map(),
  );
  const [decision, setDecision] = useState<Record<string, boolean>>({});

  const addResource = useCallback((resource: Resource) => {
    const key = JSON.stringify(resource);
    setResourceMap((resourceMap) =>
      resourceMap.has(key)
        ? resourceMap // want to trigger effect even if unchanged
        : new Map(resourceMap).set(key, resource),
    );
  }, []);

  const context = useMemo<AuthzProviderContext>(
    () => ({ decision, addResource }),
    [decision, addResource],
  );

  const handleDecision = useCallback(
    (data: JsonResponse, resources: Resource[]) => {
      if (!data.result) {
        return;
      }

      if (data.result.length !== resources.length) {
        throw new Error(
          `data.result length (${data.result.length}) does not match resources length (${resources.length})`,
        );
      }

      const updatedDecision = data.result.reduce(
        (decision, item, index) => {
          decision[resources[index]!.url] = item.allowed ?? false;
          return decision;
        },
        { ...decision },
      );

      if (!isEqual(decision, updatedDecision)) {
        setDecision(updatedDecision);
      }
    },
    [decision],
  );

  useEffect(() => {
    if (resourceMap.size === 0) {
      return;
    }

    // debounce authz API request
    const timeout = setTimeout(() => {
      const resources = !defaultInput
        ? [...resourceMap.values()]
        : [...resourceMap.values()].map((resource) => {
            // update each resource with defaultInput
            const { path, input } = Query.parse(resource.url);
            return {
              ...resource,
              url: Query.stringify(path, { ...defaultInput, ...input }),
            };
          });

      // having generated `resources` now reset the container
      setResourceMap(new Map());

      sdk
        .evaluate(path, requestFromResources([...resources]))
        .then((response) => response.json())
        .then((data: JsonResponse) => handleDecision(data, resources));
    }, 100);

    return () => clearTimeout(timeout);
  }, [resourceMap, defaultInput, endpoint, handleDecision]);

  return (
    <AuthzContext.Provider value={context}>{children}</AuthzContext.Provider>
  );
}

function requestFromResources(resources: Resource[]): AuthzEvaluationRequest[] {
  return resources.map((resource) => {
    return {
      // check_option: "HTTP",
      // operation: resource.method,
      // path: resource.url,
      // action: resource.action,
    };
  });
}
