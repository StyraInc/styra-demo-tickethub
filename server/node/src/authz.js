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

  async authorizedFilter(
    path,
    input,
    {
      auth: {
        tenant: { name: tenant },
        subject: user,
      },
    },
  ) {
    const conds = await this.opa.authorize(path, { user, tenant, ...input });
    // NOTE(sr): undefined result => error, empty result => no extra conditions (OK)
    if (!conds) {
      throw new UnauthorizedError();
    }
    return clearEmpties(conds);
  }
}

// adapted from https://stackoverflow.com/a/42736367/993018
function clearEmpties(o) {
  for (const k in o) {
    if (typeof o[k] !== "object") continue;

    clearEmpties(o[k]);
    if (Object.keys(o[k]).length === 0) delete o[k];
  }
  return o;
}
