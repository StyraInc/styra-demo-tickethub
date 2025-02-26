package tickets.filters

tenancy if input.tickets.tenant == input.tenant.id # tenancy check

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

masks["tickets.description"] := {"replace": {"value": "***"}}

# masks["tickets.description"] := {"replace": {"value": "***"}} if {
# 	# ticket not assigned to user
# 	input.users.name != input.user
# 	# user is not an admin
# 	not "admin" in data.tickets.roles[input.tenant.name][input.user]
# }

# masks["tickets.description"] := {"replace": {"value": "***"}} if {
# 	# ticket not assigned to user
# 	input.users.name != input.user
# 	# user is not a resolver
# 	not "resolver" in data.tickets.roles[input.tenant.name][input.user]
# }