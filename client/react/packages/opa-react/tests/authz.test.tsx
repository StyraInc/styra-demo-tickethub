import React from "react";
import { render, screen } from "@testing-library/react";
import Authz, { Denied } from "../src/authz";
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
      test("renders children WITHOUT authz prop", async () => {
        await setUseAuthzMockResult(true);
        render(
          <Authz path={path} input={input}>
            <button data-testid="myButton">Press Here</button>
          </Authz>,
        );
        expect(screen.getByText("Press Here")).toBeInTheDocument();
        expect(screen.getByRole("button")).not.toHaveAttribute("hidden");
        expect(screen.getByRole("button")).not.toHaveAttribute("disabled");
      });

      test("renders children WITH authz prop", async () => {
        await setUseAuthzMockResult(true);
        render(
          <Authz path={path} input={input}>
            <button authz={Denied.DISABLED}>Press Here</button>
          </Authz>,
        );
        expect(screen.getByRole("button")).not.toHaveAttribute("disabled");
        expect(screen.getByRole("button")).not.toHaveAttribute("hidden");
        expect(screen.getByRole("button")).not.toHaveAttribute("authz");
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
      test("hides children WITHOUT authz prop", async () => {
        await setUseAuthzMockResult(false);
        render(
          <Authz path={path} input={input}>
            <button data-testid="myButton">Press Here</button>
          </Authz>,
        );
        expect(screen.getByText("Press Here")).toBeInTheDocument();
        expect(screen.getByTestId("myButton")).toHaveAttribute("hidden");
        expect(screen.getByTestId("myButton")).not.toHaveAttribute("disabled");
      });

      test("removes authz attribute and adds HIDDEN attribute", async () => {
        await setUseAuthzMockResult(false);
        render(
          <Authz path={path} input={input}>
            <button data-testid="myButton" authz={Denied.HIDDEN}>
              Press Here
            </button>
          </Authz>,
        );
        expect(screen.getByTestId("myButton")).not.toHaveAttribute("authz");
        expect(screen.getByTestId("myButton")).toHaveAttribute("hidden");
      });

      test("removes authz prop and adds DISABLED prop", async () => {
        await setUseAuthzMockResult(false);
        render(
          <Authz path={path} input={input}>
            <button data-testid="myButton" authz={Denied.DISABLED}>
              Press Here
            </button>
          </Authz>,
        );
        expect(screen.getByTestId("myButton")).not.toHaveAttribute("authz");
        expect(screen.getByTestId("myButton")).toHaveAttribute("disabled");
      });

      test("disables children WITH authz prop DISABLED", async () => {
        await setUseAuthzMockResult(false);
        render(
          <Authz path={path} input={input}>
            <button authz={Denied.DISABLED}>Press Here</button>
          </Authz>,
        );
        expect(screen.getByRole("button")).toHaveAttribute("disabled");
        expect(screen.getByRole("button")).not.toHaveAttribute("hidden");
        expect(screen.getByRole("button")).not.toHaveAttribute("authz");
      });

      test("hides children WITH authz prop HIDDEN", async () => {
        await setUseAuthzMockResult(false);
        render(
          <Authz path={path} input={input}>
            <button data-testid="myButton" authz={Denied.HIDDEN}>
              Press Here
            </button>
          </Authz>,
        );
        expect(screen.getByTestId("myButton")).not.toHaveAttribute("disabled");
        expect(screen.getByTestId("myButton")).toHaveAttribute("hidden");
        expect(screen.getByTestId("myButton")).not.toHaveAttribute("authz");
      });

      test("ignores invalid authz prop and applies default (HIDDEN)", async () => {
        await setUseAuthzMockResult(false);
        render(
          <Authz path={path} input={input}>
            <button data-testid="myButton" authz={"invalid" as Denied}>
              Press Here
            </button>
          </Authz>,
        );
        expect(screen.getByTestId("myButton")).not.toHaveAttribute("disabled");
        expect(screen.getByTestId("myButton")).toHaveAttribute("hidden");
        expect(screen.getByTestId("myButton")).not.toHaveAttribute("authz");
      });

      test("combines disabled and hidden siblings with explicit authz on each", async () => {
        await setUseAuthzMockResult(false);
        render(
          <Authz path={path} input={input}>
            <button data-testid="start" authz={Denied.HIDDEN}>
              Start
            </button>
            <button data-testid="stop" authz={Denied.DISABLED}>
              Stop
            </button>
          </Authz>,
        );
        expect(screen.getByTestId("start")).not.toHaveAttribute("disabled");
        expect(screen.getByTestId("start")).toHaveAttribute("hidden");
        expect(screen.getByTestId("start")).not.toHaveAttribute("authz");
        expect(screen.getByTestId("stop")).toHaveAttribute("disabled");
        expect(screen.getByTestId("stop")).not.toHaveAttribute("hidden");
        expect(screen.getByTestId("stop")).not.toHaveAttribute("authz");
      });

      test("combines disabled and hidden siblings with one implicit authz prop", async () => {
        await setUseAuthzMockResult(false);
        render(
          <Authz path={path} input={input}>
            <button data-testid="start">Start</button>
            <button data-testid="stop" authz={Denied.DISABLED}>
              Stop
            </button>
          </Authz>,
        );
        expect(screen.getByTestId("start")).not.toHaveAttribute("disabled");
        expect(screen.getByTestId("start")).toHaveAttribute("hidden");
        expect(screen.getByTestId("start")).not.toHaveAttribute("authz");
        expect(screen.getByTestId("stop")).toHaveAttribute("disabled");
        expect(screen.getByTestId("stop")).not.toHaveAttribute("hidden");
        expect(screen.getByTestId("stop")).not.toHaveAttribute("authz");
      });

      test("combines disabled parent and hidden child with explicit authz on each", async () => {
        await setUseAuthzMockResult(false);
        render(
          <Authz path={path} input={input}>
            <div data-testid="start" authz={Denied.DISABLED}>
              <button data-testid="stop" authz={Denied.HIDDEN}>
                Stop
              </button>
            </div>
          </Authz>,
        );
        expect(screen.getByTestId("start")).toHaveAttribute("disabled");
        expect(screen.getByTestId("start")).not.toHaveAttribute("hidden");
        expect(screen.getByTestId("start")).not.toHaveAttribute("authz");
        expect(screen.getByTestId("stop")).not.toHaveAttribute("disabled");
        expect(screen.getByTestId("stop")).toHaveAttribute("hidden");
        expect(screen.getByTestId("stop")).not.toHaveAttribute("authz");
      });

      test("top-level child with no authz prop hides whole tree", async () => {
        await setUseAuthzMockResult(false);
        render(
          <Authz path={path} input={input}>
            <div data-testid="top">
              <p data-testid="nested1" authz={Denied.DISABLED}>
                any text here
              </p>
              <p data-testid="nested2">any text here</p>
            </div>
          </Authz>,
        );
        expect(screen.getByTestId("top")).toHaveAttribute("hidden");
        expect(screen.getByTestId("top")).not.toHaveAttribute("disabled");
        expect(screen.getByTestId("nested1")).not.toHaveAttribute("authz");
        // state of nested elements is irrelevant
      });

      test('hides text node by injecting a "span" with hidden attribute', async () => {
        await setUseAuthzMockResult(false);
        render(
          <p data-testid="container">
            <Authz path={path} input={input}>
              hello
            </Authz>
          </p>,
        );
        const container = screen.getByTestId("container");
        expect(container.childElementCount).toBe(1);
        expect(container).not.toHaveAttribute("hidden");
        expect(container.children[0]).toHaveTextContent("hello");
        expect(container.children[0]?.tagName).toBe("SPAN");
        expect(container.children[0]).toHaveAttribute("hidden");
      });
    });
  });
});
