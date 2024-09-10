package tickets

import rego.v1

import data.roles

default allow := false
allow if allowed(input.user, input.tenant, input.action)

allowed(user, tenant, _) if "admin" in roles[tenant][user]
allowed(user, tenant, action) if {
    "reader" in roles[tenant][user]
    action in {"get", "list"}
}
allowed(user, tenant, "resolve") if "resolver" in roles[tenant][user]
