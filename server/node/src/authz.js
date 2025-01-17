import { OPAClient } from "@styra/opa";

export class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class Authorizer {
  constructor(endpoint) {
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
}
