import React from "react";
import { render, screen } from "@testing-library/react";
import Authz from "../src/authz";
import { Result } from "@styra/opa";
import { describe, test, expect, vi } from "vitest";

// vi.mock is hoisted--even before the imports (https://vitest.dev/api/vi.html#vi-mock)
vi.mock("../src/use-authz");

describe("Authz component", () => {
  async function setUseAuthzMockResult(result: Result) {
    const useAuthzMock = await import("../src/use-authz");
    useAuthzMock.default = vi.fn(() => ({
      result,
      isLoading: false,
      error: undefined,
    }));
    // TODO: try to add test where isLoading transitions from true to false
    return useAuthzMock;
  }

  describe("outputs are rendered appropriately", () => {
    const input = { user: "alice" };
    const path = "tickets/allow";

    describe("when allowed", () => {
      test("renders children that depend on result (disabled)", async () => {
        await setUseAuthzMockResult(true);
        render(
          <Authz path={path} input={input}>
            {(result) => (
              <button disabled={!result} data-testid="myButton">
                Press Here
              </button>
            )}
          </Authz>,
        );
        expect(screen.getByText("Press Here")).toBeInTheDocument();
        expect(screen.getByRole("button")).not.toHaveAttribute("hidden");
        expect(screen.getByRole("button")).not.toHaveAttribute("disabled");
      });

      test("renders children that depend on result (hidden)", async () => {
        await setUseAuthzMockResult(true);
        render(
          <Authz path={path} input={input}>
            {(result) => (
              <button hidden={!result} data-testid="myButton">
                Press Here
              </button>
            )}
          </Authz>,
        );
        expect(screen.getByText("Press Here")).toBeInTheDocument();
        expect(screen.getByRole("button")).not.toHaveAttribute("hidden");
        expect(screen.getByRole("button")).not.toHaveAttribute("disabled");
      });

      test("renders children without dependence on result", async () => {
        await setUseAuthzMockResult(true);
        render(
          <Authz path={path} input={input}>
            <button>Press Here</button>
          </Authz>,
        );
        expect(screen.getByRole("button")).not.toHaveAttribute("disabled");
        expect(screen.getByRole("button")).not.toHaveAttribute("hidden");
      });

      test("renders unmodified text node", async () => {
        await setUseAuthzMockResult([true]);
        render(
          <p data-testid="container">
            <Authz path={path} input={input}>
              hello
            </Authz>
          </p>,
        );
        const container = screen.getByTestId("container");
        expect(container.childElementCount).toBe(0);
        expect(container).toHaveTextContent("hello");
        expect(container).not.toHaveAttribute("hidden");
      });
    });

    describe("when denied", () => {
      test("hides children that depend on result (hidden)", async () => {
        await setUseAuthzMockResult(false);
        render(
          <Authz path={path} input={input}>
            {(result) => (
              <button hidden={!result} data-testid="myButton">
                Press Here
              </button>
            )}
          </Authz>,
        );
        expect(screen.getByText("Press Here")).toBeInTheDocument();
        expect(screen.getByTestId("myButton")).toHaveAttribute("hidden");
        expect(screen.getByTestId("myButton")).not.toHaveAttribute("disabled");
      });

      test("disables children depending on result (disabled)", async () => {
        await setUseAuthzMockResult(false);
        render(
          <Authz path={path} input={input}>
            {(result) => <button disabled={!result}>Press Here</button>}
          </Authz>,
        );
        expect(screen.getByRole("button")).toHaveAttribute("disabled");
        expect(screen.getByRole("button")).not.toHaveAttribute("hidden");
      });

      test("hides children depending on result (hidden)", async () => {
        await setUseAuthzMockResult(false);
        render(
          <Authz path={path} input={input}>
            {(result) => (
              <button hidden={!result} data-testid="myButton">
                Press Here
              </button>
            )}
          </Authz>,
        );
        expect(screen.getByTestId("myButton")).not.toHaveAttribute("disabled");
        expect(screen.getByTestId("myButton")).toHaveAttribute("hidden");
      });

      test("combines disabled and hidden siblings", async () => {
        await setUseAuthzMockResult(false);
        render(
          <Authz path={path} input={input}>
            {(result) => [
              <button data-testid="start" hidden={!result}>
                Start
              </button>,
              <button data-testid="stop" disabled={!result}>
                Stop
              </button>,
            ]}
          </Authz>,
        );
        expect(screen.getByTestId("start")).not.toHaveAttribute("disabled");
        expect(screen.getByTestId("start")).toHaveAttribute("hidden");
        expect(screen.getByTestId("stop")).toHaveAttribute("disabled");
        expect(screen.getByTestId("stop")).not.toHaveAttribute("hidden");
      });

      test("combines disabled parent and hidden child with explicit authz on each", async () => {
        await setUseAuthzMockResult(false);
        render(
          <Authz path={path} input={input}>
            {(result) => (
              <div data-testid="start" disabled={!result}>
                <button data-testid="stop" hidden={!result}>
                  Stop
                </button>
              </div>
            )}
          </Authz>,
        );
        expect(screen.getByTestId("start")).toHaveAttribute("disabled");
        expect(screen.getByTestId("start")).not.toHaveAttribute("hidden");
        expect(screen.getByTestId("stop")).not.toHaveAttribute("disabled");
        expect(screen.getByTestId("stop")).toHaveAttribute("hidden");
      });
    });
  });
});
