package tickets

import rego.v1

roles := data.roles

response.allow := allow
response.reason := reason_admin
response.conditions := conditions

default allow := false
allow if allowed(input.user, input.tenant, input.action)

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

#conditions["tickets.resolved"] := false if user_is_resolver(input.user, input.tenant)
#conditions["tickets.id"].ne := 2

conditions.or contains {"tickets.resolved": false} if user_is_resolver(input.user, input.tenant)
conditions.or contains {"tickets.id": {"ne": 2}}
conditions["customers.name"] := "Globex"

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

