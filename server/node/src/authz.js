import { OPAClient } from "@styra/opa";

export class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class Authorizer {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.opa = new OPAClient(endpoint);
  }

  async authorized(
    path,
    input,
    {
      auth: {
        tenant, // feed complete tenant info into OPA
        subject: user,
      },
    },
  ) {
    return this.opa.evaluate(path, { user, tenant, ...input });
  }

  // TODO(sr): this should be made simpler by the @styra/opa SDK!
  async conditions(
    query,
    inp,
    {
      auth: {
        tenant, // feed complete tenant info into OPA
        subject: user,
      },
    },
  ) {
    const input = { user, tenant, ...inp };
    const body = JSON.stringify({
      query,
      input,
      unknowns: ["input.tickets", "input.users"],
      options: {
        dialect: "prisma",
      },
    });
    const req = new Request(`${this.endpoint}/exp/compile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.styra.ucast+json",
      },
      body,
    });
    return fetch(req);
  }
}
