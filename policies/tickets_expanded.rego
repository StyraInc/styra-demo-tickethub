package tickets_expanded

import rego.v1

roles := data.roles

response.allow := allow

response.reason := reason_admin

response.conditions := conditions

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

## CONDITIONS ##

conditions["type"] := "compound"
conditions["operation"] := "and"

# Resolver conditions
conditions["value"] contains {"type": "compound", "operation": "or", "value": v} if {
	user_is_resolver(input.user, tenant)

	v := [{"type": "compound", "operation": "and", "value": [
			{"type": "field", "operation": "eq", "field": "tickets.resolved", "value": false},
			{"type": "field", "operation": "eq", "field": "tickets.assignee", "value": null},
		]},
		{"type": "field", "operation": "eq", "field": "users.name", "value": input.user},
	]
}

# Tenancy
conditions["value"] contains {"type": "field", "operation": "eq", "field": "tickets.tenant", "value": input.tenant.id}

# Tenancy
# conditions["tickets.tenant"] := input.tenant.id

# Resolver conditions
# conditions.or contains {"tickets.resolved": false, "tickets.assignee": null} if {
# 	user_is_resolver(input.user, tenant)
# }

# conditions.or contains {"users.name": input.user} if user_is_resolver(input.user, tenant)

## DENY REASONS ##

default reason_user := "access is denied"

default reason_admin := "admin role is required for unhandled actions"

reason_user := "access is permitted" if allow

reason_admin := "access is permitted" if allow

reason_user := "access is denied" if {
	not allow
	input.action in {"get", "list"}
}

reason_admin := "reader role is required to get or list" if {
	not allow
	input.action in {"get", "list"}
}

reason_user := "access is denied" if {
	not allow
	input.action in {"resolve"}
}

reason_admin := "resolver role is required to resolve" if {
	not allow
	input.action in {"resolve"}
}