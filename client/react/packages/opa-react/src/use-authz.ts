import { useContext, useEffect, useMemo } from "react";
import { AuthzContext } from "./opa-provider";
import { Input, Result } from "@styra/opa";

export interface UseAuthzResult {
  result: Result | undefined;
  isLoading: boolean;
}

/**
 * This hook provides more flexibility than the <Authz/> component, allowing you to
 * work with authorization decisions directly in your code.
 * You can:
 * - preload authorization requests
 * - determine which requests are still loading
 * - examine results of individual resource authorization decisions

 * @param  resources - Array of items to check for user's authorization.
 * @return Authorization query results and loading status. The decision array will be in
 * the same order as the input array, allowing you to easily match up results to inputs.
 *
 * @example
 * To see this in action, copy to its own file, add necessary imports,
 * then insert a <DemoButtonBar /> somewhere in the code.
 *
 * export default function DemoButtonBar() {
 *   const [authzResources] = useState([
 *     types.READ_WORKSPACE.resource(),
 *     SystemsTypes[Kind.SYSTEMS].CREATE_SYSTEM.resource(),
 *   ] as Resource[])
 *
 *   const { isLoading, decision } = useAuthz(authzResources)
 *
 *   if (isLoading) {
 *     return null
 *   }
 *
 *   const [isReadWorkspaceAllowed, isCreateSystemAllowed] = decision
 *   return (
 *     <div style={{ backgroundColor: 'red' }}>
 *       {isReadWorkspaceAllowed && <button>Read</button>}{' '}
 *       <button disabled={!isCreateSystemAllowed}>Create</button>
 *     </div>
 *   )
 * }
 */
export default function useAuthz(path?: string, input?: Input): UseAuthzResult {
  const context = useContext(AuthzContext);
  if (context === null) {
    throw Error("Authz/useAuthz can only be used inside an AuthzProvider");
  }
  const { result, setInput, setPath } = context;
  useEffect(() => {
    setInput(input);
  }, [input]);

  useEffect(() => {
    if (path) setPath(path);
  }, [path]);

  return useMemo<UseAuthzResult>(() => {
    return {
      result,
      isLoading: result === undefined,
    };
  }, [result, input, path, setInput]);
}
