package server

var (
	DefaultTicketMap = TicketMap{
		"acmecorp": {
			{
				Customer:    "Globex",
				LastUpdated: "2022-07-19T15:39:53.686Z",
				Description: "Dooms day device needs to be refactored",
				Resolved:    false,
			},
			{
				Customer:    "Globex",
				LastUpdated: "2022-07-19T15:39:40.806Z",
				Description: "Flamethrower implementation is too heavyweight",
				Resolved:    true,
			},
			{
				Customer:    "Sirius Cybernetics Corp.",
				LastUpdated: "2022-07-19T15:42:16.526Z",
				Description: "Latest android exhibit depression tendencies",
				Resolved:    false,
			},
			{
				Customer:    "Sirius Cybernetics Corp.",
				LastUpdated: "1982-08-05T03:30:03Z",
				Description: "Happy Vertical People Transporters need to be more efficient in determining destination floor",
				Resolved:    false,
			},
			{
				Customer:    "Cyberdyne Systems Corp.",
				LastUpdated: "2022-07-19T15:42:51.297Z",
				Description: "Mimetic polyalloy becomes brittle at low temperatures",
				Resolved:    false,
			},
			{
				Customer:    "Cyberdyne Systems Corp.",
				LastUpdated: "2029-03-04T00:00:00Z",
				Description: "Temporal dislocation field reacts with exposed metal",
				Resolved:    true,
			},
		},
		"hooli": {
			{
				Customer:    "Soylent Corp.",
				LastUpdated: "2022-03-04T00:00:00Z",
				Description: "Final ingredient for project 'Green' still undecided",
			},
			{
				Customer:    "Soylent Corp.",
				LastUpdated: "2022-04-05T00:00:00Z",
				Description: "Customer service center switch board DDoS:ed by (opinionated) ingredient declaration inquiries",
				Resolved:    true,
			},
			{
				Customer:    "Tyrell Corp.",
				LastUpdated: "2019-03-04T00:03:20Z",
				Description: "Replicants become too independent over time",
				Resolved:    false,
			},
			{
				Customer:    "Tyrell Corp.",
				LastUpdated: "2048-11-22T14:13:42Z",
				Description: "Detective Rick Deckard's billing address is unknown",
				Resolved:    false,
			},
		},
	}
)
