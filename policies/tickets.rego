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

reason := reason_admin

default reason_user = "access is denied"
default reason_admin = "admin role is required for unhandled actions"

reason_user = "access is permitted" if allow
reason_admin = "access is permitted" if allow

reason_user = r if {
       not allow
       input.action in {"get", "list"}
       r := "access is denied"
}

reason_admin = r if {
       not allow
       input.action in {"get", "list"}
       r := "reader role is required to get or list"
}

reason_user = r if {
       not allow
       input.action in {"resolve"}
       r := "access is denied"
}

reason_admin = r if {
       not allow
       input.action in {"resolve"}
       r := "resolver role is required to resolve"
}

