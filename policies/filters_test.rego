package tickets.filters

import data.system.eopa.utils.tests.v1.filter

tickets_table := [
	{"id": 1, "tenant": 2, "customer": 1, "description": "Dooms day device needs to be refactored", "resolved": false, "assignee": 3},
	{"id": 2, "tenant": 2, "customer": 1, "description": "Flamethrower implementation is too heavyweight", "resolved": true, "assignee": 3},
	{"id": 3, "tenant": 2, "customer": 2, "description": "Latest android exhibit depression tendencies", "resolved": false, "assignee": 3},
	{"id": 4, "tenant": 2, "customer": 2, "description": "Happy Vertical People Transporters need to be more efficient in determining destination floor", "resolved": false, "assignee": 2},
	{"id": 5, "tenant": 2, "customer": 3, "description": "Mimetic polyalloy becomes brittle at low temperatures", "resolved": false, "assignee": null},
	{"id": 6, "tenant": 2, "customer": 3, "description": "Temporal dislocation field reacts with exposed metal", "resolved": true, "assignee": null},
	{"id": 7, "tenant": 1, "customer": 4, "description": "Final ingredient for project \"Green\" still undecided", "resolved": false, "assignee": null},
	{"id": 8, "tenant": 1, "customer": 4, "description": "Customer service center switch board DDoS:ed by (opinionated) ingredient declaration inquiries", "resolved": true, "assignee": null},
	{"id": 9, "tenant": 1, "customer": 5, "description": "Replicants become too independent over time", "resolved": false, "assignee": null},
	{"id": 10, "tenant": 1, "customer": 5, "description": "Billing address of Detective Rick Deckard is unknown", "resolved": false, "assignee": null},
]

tenants_table := [
	{"id": 1, "name": "someones", "region": "EU"},
	{"id": 2, "name": "acmecorp", "region": "NA"},
]

users_table := [
	{"id": 1, "tenant": 2, "name": "alice", "email": "alice@acmecorp.com"},
	{"id": 2, "tenant": 2, "name": "bob", "email": "bob@acmecorp.com"},
	{"id": 3, "tenant": 2, "name": "ceasar", "email": "ceasar@acmecorp.com"},
	{"id": 4, "tenant": 1, "name": "dylan", "email": "dylan@acmecorp.com"},
	{"id": 5, "tenant": 1, "name": "eva", "email": null},
	{"id": 6, "tenant": 1, "name": "frank", "email": "frank@acmecorp.com"},
]

# NB(sr): unused
customers_table := [
	{"id": 1, "tenant": 2, "name": "Globex", "email": "hank.scorpio@globex.com", "phone": "+1-555-0123"},
	{"id": 2, "tenant": 2, "name": "Sirius Cybernetics Corp.", "email": "complaints@siriuscyber.net", "phone": "+44-555-4608"},
	{"id": 3, "tenant": 2, "name": "Cyberdyne Systems Corp.", "email": "miles.dyson@cyberdyne.com", "phone": "+1-555-2144"},
	{"id": 4, "tenant": 1, "name": "Soylent Corp.", "email": "info@soylentgreen.com", "phone": "+49-555-6789"},
	{"id": 5, "tenant": 1, "name": "Tyrell Corp.", "email": "eldon.tyrell@tyrellcorp.com", "phone": "+81-555-3247"},
]

list_query := "SELECT tickets.id, tenants.name as tenant_name, users.name as assignee FROM tickets LEFT JOIN users on tickets.assignee = users.id JOIN tenants on tickets.tenant = tenants.id"

test_admin_can_see_every_ticket_of_their_tenant if {
	filtered := filter.helper(
		"data.tickets.filters.include",
		list_query,
		{
			"tickets": tickets_table,
			"tenants": tenants_table,
			"users": users_table,
		},
		{"debug": true},
	) with input.user as "jane"
		with input.tenant.name as "acmecorp"
		with input.tenant.id as 2
		with data.roles.acmecorp.jane as {"admin"}

	count(filtered) == 6 # all tickets of that tenant
	every ticket in filtered {
		ticket.tenant_name == "acmecorp"
	}

	count({t | some t in filtered; t.assignee != null}) == 4 # four assigned tickets
	{t.assignee | some t in filtered; t.assignee != null} = {"bob", "ceasar"}
}

test_resolver_can_see_their_own_and_unassigned_tickets_of_their_tenant if {
	filtered := filter.helper(
		"data.tickets.filters.include",
		list_query,
		{
			"tickets": tickets_table,
			"tenants": tenants_table,
			"users": users_table,
		},
		{"debug": true},
	) with input.user as "ceasar"
		with input.tenant.name as "acmecorp"
		with input.tenant.id as 2
		with data.roles.acmecorp.ceasar as {"resolver"}

	count(filtered) == 4
	every ticket in filtered {
		ticket.tenant_name == "acmecorp"
	}

	count({t | some t in filtered; t.assignee != null}) == 3 # three tickets assigned to ceasar
	{t.assignee | some t in filtered; t.assignee != null} = {"ceasar"}
}

## LOW-LEVEL TESTS ##

test_only_tenancy_requirement_for_admin if {
	res := rego.compile({
		"query": "data.tickets.filters.include",
		"target": "sql+postgresql",
	}) with input.user as "jane"
		with input.tenant.name as "acmecorp"
		with input.tenant.id as 2
		with data.roles.acmecorp.jane as {"admin"}
	res.query == "WHERE tickets.tenant = E'2'"
}

test_tenancy_requirement_and_assignee_for_resolvers if {
	res := rego.compile({
		"query": "data.tickets.filters.include",
		"target": "sql+postgresql",
	}) with input.user as "jane"
		with input.tenant.name as "acmecorp"
		with input.tenant.id as 2
		with data.roles.acmecorp.jane as {"resolver"}
	res.query == "WHERE ((tickets.tenant = E'2' AND users.name = E'jane') OR (tickets.tenant = E'2' AND tickets.assignee IS NULL AND tickets.resolved = FALSE))"
}
