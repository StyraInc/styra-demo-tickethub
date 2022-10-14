import PropTypes from 'prop-types'
import React from 'react'
import {Types} from '../types'
import useAccounts from '../useAccounts'

export default function Nav({type, ticketId}) {
  const tickets = type === Types.TICKETS ? 'Tickets' : <a href="/">Tickets</a>
  const newTicket = type === Types.NEW_TICKET ? 'New' : undefined
  const admin = type === Types.ADMIN ? 'Admin' : <a href="/admin">Admin</a>
  
  return (
    <nav>
      <div className="nav-menu">
        <span>{tickets}</span>
        { (ticketId || newTicket) &&
          <>
            <span>/</span>
            <span>{ticketId ?? newTicket}</span>
          </>
        }
        <span>|</span>
        <span>{admin}</span>
      </div>

      <Menu/>
    </nav>
  )
}

Nav.propTypes = {
  type: PropTypes.oneOf(Object.values(Types)),
  ticketId: PropTypes.string
}

function Menu() {
  const {current, users, handleSetUser} = useAccounts()

  const handleChangeUser = React.useCallback((event) => {
    const user = event.target.value
    handleSetUser(user)
    window.location.reload()
  }, [handleSetUser])

  if (!current || !users) {
    return null
  }

  return (
    <div className="login-menu">
      <span>
        User
        {' '}
        <select className="login-select" value={current.user} onChange={handleChangeUser}>
          {users.map((user) => <option key={user}>{user}</option>)}
        </select>
      </span>
    </div>
  )
}
