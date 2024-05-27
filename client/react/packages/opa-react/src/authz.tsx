import {
  Children,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  cloneElement,
  isValidElement,
  useMemo,
} from "react";

import useAuthz from "./use-authz";
import { Resource } from "./opa-provider";

export enum Denied {
  DISABLED = "deny-disabled",
  HIDDEN = "deny-hidden",
}

type AuthzProps = PropsWithChildren<{
  resources?: Resource[];
  strict?: boolean;
}>;

/*
These diagrams should provide further understanding of the authz process.
You can view these directly from this file in VSCode via the
`Open Preview` command from the `Markdown Preview Enhanced` plugin.

```mermaid
---
title: Authorization in DAS Front-End
---
sequenceDiagram
    autonumber
    participant A as Authz Element
    participant P as Provider
    participant E as AuthZ Endpoint
    participant R as Rego Engine
    loop For each guarded node
        A->>+P: IsAuthorized?
        note over A: [resource, action]
        P->>+E: IsAuthorized?
        note over P: [resource, action, endpoint]
        E->>+R: IsAuthorized?
        alt
            R-->>E: Allow
            E-->>P: Allow
            P-->>A: Allow
            note over A: Render!
       else
            R--x-E: Deny
            E--x-P: Deny
            P--x-A: Deny
            note over A: Hide or Disable
        end
    end
```


```mermaid
---
title: Restriction Mode
---
stateDiagram-v2
    ifDecision: Decision is... ?
    ifResources: < Authz > has resources ?
    ifChildAuthz: " authz " attribute <br/> on immediate child ?
    process: Process hidden/disabled children...

    classDef hideState fill:#f00,color:white,font-weight:bold
    classDef disableState fill:#963,color:white,font-weight:bold
    classDef showState fill:#4e0,color:white,font-weight:bold

    [*] --> ifResources
    ifDecision --> ifChildAuthz: denied
    ifDecision --> Show:::showState: allowed
    ifResources --> Hide:::hideState: none
    ifResources --> ifDecision: some
    ifChildAuthz --> Hide: none
    ifChildAuthz --> Disable:::disableState: disabled
    ifChildAuthz --> Hide: hidden
    Disable --> process
```


```mermaid
---
title: Decision Mode
---
stateDiagram-v2
    ifStrict: < Authz > specifies... ?
    strictChoice: how many resources allowed ?
    laxChoice: how many resources allowed ?

    classDef denyState fill:#f00,color:white,font-weight:bold
    classDef allowState fill:#4e0,color:white,font-weight:bold

    [*] --> ifStrict
    ifStrict --> strictChoice: strict
    ifStrict --> laxChoice: lax
    strictChoice --> Allow:::allowState: all
    strictChoice --> Deny:::denyState: some
    strictChoice --> Deny: none
    laxChoice --> Allow: all
    laxChoice --> Allow: some
    laxChoice --> Deny: none
```
*/

/**
 * Conditionally renders components based on authorization decisions for a specified
 * set of resources (URL and action) for the current user.
 *
 * The simplest use looks like that shown below; just wrap some arbitrary content
 * and specify a set of resources.
 * If allowed, the content will be rendered and if denied, the content will be hidden.
 *
 *   <Authz resources={resources}>
 *      ...any content here...
 *   </Authz>
 *
 * ## Configuration
 *
 * Configuration involves defining an API endpoint for authorization along with a context
 * that can be used to access authorization decisions throughout the application.
 * The configuration for DAS has already been done;
 * look for {@link AuthzProvider} use in {@link AuthenticatedRoot}.
 * The <AuthzProvider/> wrapper needs to be as high as possible in the component tree,
 * since <Authz/> (or `useAuthz`) may only be used inside that wrapper.
 *
 * ## All vs. any: Setting the Decision Mode
 *
 * The `resources` property is a list. When you provide more than a single resource,
 * the default decision mode requires all of them to be allowed for an "allowed" decision.
 * You may, however, employ the `strict` property to change the decision mode.
 * When true (the default), all of the resources must be allowed for an "allowed" decision.
 * When false, then only one resource among the set must be allowed for an "allowed" decision.
 *
 * These three are equivalent in setting the decision mode to `strict`:
 *
 *   <Authz resources={resources}>...</Authz>
 *   <Authz resources={resources} strict>...</Authz>
 *   <Authz resources={resources} strict={true}>...</Authz>
 *
 * To set the decision mode to lax, there is only one form:
 *
 *   <Authz resources={resources} strict={false}>...</Authz>
 *
 * ## Hiding vs Disabling: Setting the Restriction Mode
 *
 * Hiding the content is the default restriction mode. You may, however, employ
 * the `authz` property to modify the behavior.
 * The default is {@link Denied.HIDDEN} but you can also use {@link Denied.DISABLED}.
 * Note that this attribute does NOT attach to the <Authz/> node, but rather to its children.
 * You can use it on any descendants, but to do so you must also use it on the
 * immediate children.
 *
 * Consider the example below with two top-level children.
 * The first child (`<p>`) does not use `authz` so by default has the `hidden` attribute applied.
 * As soon as an element is hidden, though, there is no point in looking deeper; it is all hidden.
 * The second child (`<div>`), by contrast, specifies `authz={Denied.DISABLED}`, which means it and
 * everything below is disabled but still visible. Thus you may add further refinements;
 * here you see a contained button is hidden with a further `authz` specification.
 *
 *   <Authz resources={resources}>
 *     <p>
 *       ...more content here...
 *     </p>
 *     <div authz={Denied.DISABLED}>
 *       <button authz={Denied.HIDDEN}>Create</button>
 *       <span>...</span>
 *     </div>
 *   </Authz
 *
 * These three are equivalent in setting the restriction mode to `hidden`.
 * The third shows that an invalid value is ignored (though TypeScript will throw scorn upon you),
 * so it is really the same as the first.
 *
 *   <Authz resources={resources}>
 *     <div>...</div>
 *   </Authz
 *
 *   <Authz resources={resources}>
 *     <div authz={Denied.HIDDEN}>...</div>
 *   </Authz
 *
 *   <Authz resources={resources}>
 *     <div authz="some random string">...</div>
 *   </Authz
 *
 * ## Hardcoding a Denied Decision
 *
 * You can force a denied decision by omitting the `resources` list.
 * This may be useful for pending work, diagnostics, and so forth.
 * All of these are equivalent:
 *
 *   <Authz>
 *      ...any content here will be hidden...
 *   </Authz
 *
 *   <Authz strict={true}>
 *      ...any content here will be hidden...
 *   </Authz
 *
 *   <Authz strict={false}>
 *      ...any content here will be hidden...
 *   </Authz
 *
 * ## Identifying Resources
 *
 * All the examples thus far have referred to `resources`, an array of {@link Resource} type.
 * For role-based access control (RBAC), we need to specify a subject (the current user),
 * an API endpoint (the thing we want access to), and an action (the operation we want to perform).
 * The user is supplied implicitly by being logged in; it is also essentially a constant.
 * To identify the endpoint and action you need to identify the API path and parameters.
 * Do not create a Resource with magic strings; rather, use the appropriate {@link ApiType}.
 * A few examples:
 * - workspace-level: types.READ_WORKSPACE.resource()
 * - system-level: SystemsTypes[SystemKinds.SYSTEMS].CREATE_SYSTEM.resource()
 * - parameterized: apiTokensTypes.DELETE_API_TOKEN.resource({ id })
 *
 * Since all API calls should already be defined in the `ui` code base, search for `new ApiType`
 * to browse the candidate pool.
 *
 * @param props.children The content over which the authz decision will apply.
 * @param props.resources - A list of resources to be checked for authorization.
 * @param props.strict - When true (default), all resources must be allowed for
 * an "allow" outcome; when false, requires only one resource to be allowed.
 */
export default function Authz({
  children,
  resources,
  strict = true,
}: AuthzProps) {
  const { decision, isLoading } = useAuthz(resources);

  const allowed = useMemo(
    () =>
      decision.length
        ? strict
          ? decision.every((item) => item) && !isLoading
          : decision.some((item) => item)
        : false,
    [decision, isLoading, strict],
  );

  return children ? renderChildren(children, allowed, 0) : null;
}

function renderChildren(children: ReactNode, allowed: boolean, depth: number) {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) {
      // if <Authz/> directly wraps a text node, need to explicitly wrap in 'hidden'.
      // Otherwise, included text nodes must NOT be wrapped, as the containers
      // will be subject to hidden/disabled choices.
      return allowed || depth > 0 ? child : <span hidden={true}>{child}</span>;
    }

    const { authz = undefined, ...props } = {
      ...(child as ReactElement)?.props,
    };

    if (props.children) {
      props.children = renderChildren(props.children, allowed, depth + 1);
    }

    if (!allowed) {
      if (authz === Denied.DISABLED) {
        props.disabled = true;
      } else if (authz === Denied.HIDDEN || depth === 0) {
        props.hidden = true;
      }
    }

    // cloneElement props arg is an override!
    // Thus, must specifically set authz to undefined here in case it was present.
    return cloneElement(child as ReactElement, {
      ...props,
      authz: undefined,
    });
  });
}
