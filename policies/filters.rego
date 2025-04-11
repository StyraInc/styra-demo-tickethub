package tickets.filters

tenancy if input.tickets.tenant == input.tenant.id # tenancy check

# METADATA
# scope: document
# custom:
#   unknowns:
#     - input.tickets
#     - input.users
#     - input.customers
#     - input.tenants
#   mask_rule: masks
include if {
	tenancy
	resolver_include
}

include if {
	tenancy
	not data.tickets.user_is_resolver(input.user, input.tenant.name)
}

resolver_include if {
	data.tickets.user_is_resolver(input.user, input.tenant.name)

	# ticket is assigned to user
	input.users.name == input.user
}

resolver_include if {
	data.tickets.user_is_resolver(input.user, input.tenant.name)

	# ticket is unassigned and unresolved
	input.tickets.assignee == null
	input.tickets.resolved == false
}

# Default-deny mask.
default masks.tickets.description := {"replace": {"value": "***"}}

# Allow viewing the field if user is an admin or a resolver.
masks.tickets.description := {} if {
	"admin" in data.roles[input.tenant.name][input.user]
}

masks.tickets.description := {} if {
	"resolver" in data.roles[input.tenant.name][input.user]
}
