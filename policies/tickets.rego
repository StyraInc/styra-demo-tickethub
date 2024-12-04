package tickets

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

conditions := and_(constraints)

# Resolver conditions
constraints contains or_([
	and_([
		eq_("tickets.resolved", false),
		eq_("tickets.assignee", null),
	]),
	eq_("users.name", input.user),
]) if user_is_resolver(input.user, tenant)

# Tenancy
constraints contains eq_("tickets.tenant", input.tenant.id)

# helper functions
eq_(field, value) := {"type": "field", "operator": "eq", "field": field, "value": value}

and_(values) := compound("and", values)

or_(values) := compound("or", values)

compound(op, values) := {"type": "compound", "operator": op, "value": values}

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
