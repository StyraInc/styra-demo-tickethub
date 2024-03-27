package tickets

import rego.v1

roles_in_tenant := {
    "acmecorp": {
      "alice": ["admin"],
      "bob": ["reader"],
      "ceasar": ["reader", "resolver"],
    },
    "hooli": {
      "dylan": ["admin"],
    }
}

default allow := false
allow if allowed(input.user, input.tenant, input.action)

allowed(user, tenant, _) if "admin" in roles_in_tenant[tenant][user]
allowed(user, tenant, action) if {
    "reader" in roles_in_tenant[tenant][user]
    action in {"get", "list"}
}
allowed(user, tenant, "resolve") if "resolver" in roles_in_tenant[tenant][user]
