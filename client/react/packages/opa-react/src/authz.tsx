import { PropsWithChildren, ReactNode } from "react";

import useAuthz from "./use-authz";
import { Input } from "@styra/opa";

type AuthzProps = PropsWithChildren<{
  input?: Input;
  path?: string;
  /**
   * `loading` mimics React.Suspense
   * Will display when loading so we have the option to display skeletons instead of the disabled option.
   */
  loading?: ReactNode;
  /**
   * Component to display when result is falsey
   */
  fallback?: ReactNode;
  children?: ReactNode | ((result: unknown) => ReactNode);
}>;

/**
 * TODO(sr): update
 * Conditionally renders components based on authorization decisions for a specified
 * policy path and input for the current user.
 *
 * The simplest use looks like that shown below; just wrap some arbitrary content
 * and specify path and input.
 * If allowed, the content will be rendered and if denied, the content will be hidden.
 *
 *   <Authz path={path} input={input}>
 *      ...any content here...
 *   </Authz>
 *
 * ## Configuration
 *
 * Configuration involves defining an API endpoint for authorization along with a context
 * that can be used to access authorization decisions throughout the application.
 * The <AuthzProvider/> wrapper needs to be as high as possible in the component tree,
 * since <Authz/> (or `useAuthz`) may only be used inside that wrapper.
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
 *   <Authz path={path}>
 *     <p>
 *       ...more content here...
 *     </p>
 *     <div authz={Denied.DISABLED}>
 *       <button authz={Denied.HIDDEN}>Create</button>
 *       <span>...</span>
 *     </div>
 *   </Authz
 *
 * These are equivalent in setting the restriction mode to `hidden`.
 *
 *   <Authz path={path} input={input}>
 *     <div>...</div>
 *   </Authz
 *
 *   <Authz path={path} input={input}>
 *     <div authz={Denied.HIDDEN}>...</div>
 *   </Authz
 *
 * @param props.children The content over which the authz decision will apply.
 * @param props.path - The policy path to evaluate
 * @param props.input - The input
 */
export default ({
  children,
  path,
  loading,
  input,
  fallback = null,
}: AuthzProps) => {
  const { result, isLoading } = useAuthz(path, input);

  if (isLoading) {
    return loading;
  }

  if (typeof children === "function") {
    return children(result);
  }

  return !!result ? children : fallback;
};
