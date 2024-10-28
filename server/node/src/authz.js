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
        tenant: { name: tenant }, // only feed tenant name to OPA
        subject: user,
      },
    },
  ) {
    return this.opa.evaluate(path, { user, tenant, ...input });
  }
}
