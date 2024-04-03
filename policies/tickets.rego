package tickets

import rego.v1

roles_in_tenant := {
    "acmecorp": {
      "alice": ["admin"],
      "bob": ["reader"],
      "amanda": ["reader"],
      "ceasar": ["reader", "resolver"],
    },
    "hooli": {
      "dylan": ["admin"],
    }
}

default allow := false
allow if allowed(input.user, input.tenant, input.action)

allowed(user, tenant, _) if "admin" in roles_in_tenant[tenant][user]
allowed(user, tenant, "resolve") if "resolver" in roles_in_tenant[tenant][user]
allowed(user, tenant, action) if {
    has_read_role(roles_in_tenant[tenant][user])
    has_read_action(action)
}

has_read_role(roles) if "reader" in roles
has_read_role(roles) if "resolver" in roles

has_read_action(action) if action in {"get", "list"}

# conditions are for filtering list queries:
# empty: no restrictions
# undefined: not permitted
conditions := conds if allowed(input.user, input.tenant, input.action)

# "resolvers" can only list unresolved tickets
conds.resolved := false if {
    has_read_action(input.action)
    "resolver" in roles_in_tenant[input.tenant][input.user]
}

# bob can only see Globex tickets
conds.customers.is.name := "Globex" if input.user == "bob"

# amanda cannot see Globex tickets
conds.customers.isNot.name := "Globex" if input.user == "amanda"
