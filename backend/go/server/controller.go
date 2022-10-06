package server

import (
	"errors"
	"time"
)

type Ticket struct {
	Id          int    `json:"id"`
	Customer    string `json:"customer"`
	LastUpdated string `json:"last_updated"`
	Description string `json:"description"`
	Resolved    bool   `json:"resolved"`
}

type TicketList []*Ticket

type TicketMap map[string]TicketList

type TicketControllerSettings struct {
	Defaults TicketMap
}

type TicketController interface {
	List(tenant string) []*Ticket
	Create(tenant string, ticket *Ticket) *Ticket
	Get(tenant string, id int) (*Ticket, error)
}

type ticketController struct {
	settings *TicketControllerSettings
	data     TicketMap
}

func NewTicketController(settings *TicketControllerSettings) TicketController {
	data := make(TicketMap)
	if settings.Defaults != nil {
		for tenant, tickets := range settings.Defaults {
			data[tenant] = make(TicketList, 0)

			for _, ticket := range tickets {
				if ticket != nil {
					ticket.Id = len(data[tenant])
					data[tenant] = append(data[tenant], ticket)
				}
			}
		}
	}

	return &ticketController{
		settings: settings,
		data:     data,
	}
}

func (t *ticketController) List(tenant string) []*Ticket {
	if tickets, ok := t.data[tenant]; ok {
		return tickets
	}

	return make(TicketList, 0)
}

func (t *ticketController) Create(tenant string, ticket *Ticket) *Ticket {
	if _, ok := t.data[tenant]; !ok {
		t.data[tenant] = make(TicketList, 0)
	}

	ticket.Id = len(t.data[tenant])
	ticket.LastUpdated = time.Now().Format(time.RFC3339)
	t.data[tenant] = append(t.data[tenant], ticket)

	return ticket
}

func (t *ticketController) Get(tenant string, id int) (*Ticket, error) {
	if tickets, ok := t.data[tenant]; !ok {
		return nil, errors.New("ticket does not exist")
	} else if id < 0 || id >= len(tickets) {
		return nil, errors.New("ticket does not exist")
	} else {
		return tickets[id], nil
	}
}
