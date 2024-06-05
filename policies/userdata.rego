package userdata

import rego.v1

roles[tenant][user] := data.roles[tenant][user] if {
	user := input.user
	tenant := input.tenant
}
