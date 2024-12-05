package filters

import rego.v1

# NOTE(sr): I'd use object.get here (like in tickets.rego), but that's PE-trouble territory
tenant := input.tenant.name if true

else := input.tenant

allow if {
	input.tenant.id == input.ticket.tenant
	data.tickets.user_is_resolver(input.user, tenant)
	input.ticket.resolved == false
	input.ticket.assignee == null
	# input.ticket.cost < 10 # for testing 'lt'
	# input.ticket.x != true # for testing 'neq'
}

allow if {
	input.tenant.id == input.ticket.tenant
	data.tickets.user_is_resolver(input.user, tenant)
	input.user == input.users.user
}

allow if {
	not data.tickets.user_is_resolver(input.user, tenant)
	input.tenant.id == input.ticket.tenant
}

conditions := data.convert.to_conditions(input, ["input.ticket", "input.users"], "data.filters.allow")
