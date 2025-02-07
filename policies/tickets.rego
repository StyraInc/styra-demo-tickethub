package tickets

import rego.v1

roles := data.roles

response.allow := allow

response.reason := reason_admin

# NOTE(sr): Support both server/node and the other backends -- node sends the tenant information
# differently.
tenant := object.get(input, ["tenant", "name"], input.tenant)

default allow := false

allow if allowed(input.user, tenant, input.action)

allowed(user, tenant, _) if "admin" in roles[tenant][user]

allowed(user, tenant, action) if {
	action in {"get", "list"}
	some role in roles[tenant][user]
	read_allowed(role)
}

allowed(user, tenant, "resolve") if user_is_resolver(user, tenant)

read_allowed("reader")

read_allowed("resolver")

user_is_resolver(user, tenant) if "resolver" in roles[tenant][user]

## DENY REASONS ##

default reason_user := "access is denied"

reason_user := "access is permitted" if allow

default reason_admin := "admin role is required for unhandled actions"

reason_admin := "access is permitted" if allow

reason_admin := "reader role is required to get or list" if {
	not allow
	input.action in {"get", "list"}
}

reason_admin := "resolver role is required to resolve" if {
	not allow
	input.action in {"resolve"}
}
