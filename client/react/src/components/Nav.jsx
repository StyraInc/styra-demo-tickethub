import PropTypes from 'prop-types'
import React from 'react'
import {Types} from '../types'
import useAccounts from '../useAccounts'

export default function Nav({type, ticketId}) {
  const {current} = useAccounts()

  const tickets = type === Types.TICKETS ? 'Tickets' : <a href="/">Tickets</a>
  const newTicket = type === Types.NEW_TICKET ? 'New' : undefined
  const admin = type === Types.ADMIN ? 'Admin' : <a href="/admin">Admin</a>
  
  return (
    <nav>
      <div>
        <h1>{current?.tenant}</h1>
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
  const {current, accounts, handleSetAccount} = useAccounts()

  const handleChangeAccount = React.useCallback((event) => {
    handleSetAccount(event.target.value)
    window.location.reload()
  }, [handleSetAccount])

  if (!current || !accounts) {
    return null
  }

  return (
    <div className="login-menu">
      <span>
        User
        {' '}
        <select className="login-select" value={current.account} onChange={handleChangeAccount}>
          {Object.entries(accounts).map(([tenant, users]) => (
            <optgroup key={tenant} label={tenant}>
              {users.map(({name, account}) => <option key={account} value={account}>{name}</option>)}
            </optgroup>
          ))}
        </select>
      </span>
    </div>
  )
}
