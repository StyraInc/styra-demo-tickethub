import { OPA } from "opa/highlevel/index.js";

export class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class Authorizer {
  constructor(endpoint) {
    this.opa = new OPA(endpoint);
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
    if (!(await this.opa.authorize(path, { user, tenant, ...input })))
      throw new UnauthorizedError();
  }
}
