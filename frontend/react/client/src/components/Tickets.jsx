import React, {useEffect, useState} from 'react'

export default function Tickets() {
  const [tickets, setTickets] = useState()

  useEffect(() => {
    fetch('/api/tickets')
      .then((res) => res.json())
      .then((data) => setTickets(data.tickets))
  }, [])

  return (
    <main>
      <table id="ticket-list">
        <thead>
          <tr>
              <th>ID</th>
              <th>Last Updated</th>
              <th>Customer</th>
              <th>Description</th>
              <th>Resolved</th>
          </tr>
        </thead>
        <tbody>
          {tickets?.map((ticket) => 
            <tr key={ticket.id} onClick={() => window.location = `/tickets/${ticket.id}`}>
              <td>{ticket.id}</td>
              <td>{ticket.last_updated}</td>
              <td>{ticket.customer}</td>
              <td>{ticket.description}</td>
              <td>{ticket.resolved ? 'yes' : 'no'}</td>
            </tr>
          )}
        </tbody>
      </table>
      <a className="button-large" href="/tickets/new">+ New ticket</a>
    </main>
  )
}