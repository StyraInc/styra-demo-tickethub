package tickets.spring

import rego.v1

default main := {"decision": false}

authHeader := input.action.headers.authorization

tenant := trim(split(split(authHeader, "/")[0], " ")[1], " \t")

user := trim(split(authHeader, "/")[1], " \t")

action := a if {
	input.action.name == "GET"
	input.resource.id == "/tickets"
	a := "list"
} else := a if {
	input.action.name == "GET"
	regex.match("^/tickets/[0-9]+$", input.resource.id)
	a := "get"
} else := a if {
	input.action.name == "POST"
	input.resource.id == "/tickets"
	a := "create"
} else := a if {
	input.action.name == "PUT"
	regex.match("^/tickets/[0-9]+$", input.resource.id)
	a := "overwrite"
} else := a if {
	input.action.name == "POST"
	regex.match("^/tickets/[0-9]+/resolve$", input.resource.id)
	a := "resolve"
}

xform := {
	"user": user,
	"tenant": tenant,
	"action": action,
}

main := x if {
	d := data.tickets.allow with input as xform
	reason_user := data.tickets.reason_user with input as xform
	reason_admin := data.tickets.reason_admin with input as xform
	x := {
		"decision": d,
		"context": {
			"id": "0",
			"reason_user": {"en": reason_user},
			"reason_admin": {"en": reason_admin},
			"data": {
				"echo": input,
				"tenant": tenant,
				"user": user,
			},
		},
	}
}
