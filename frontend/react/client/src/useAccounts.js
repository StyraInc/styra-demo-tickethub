import React, {useMemo, useState} from 'react'

export default function useAccounts() {
  const [current, setCurrent] = useState(getAccountFromCookie())
  const [accounts, setAccounts] = useState()
  
  React.useEffect(() => {
    fetch('/accounts.json')
      .then((res) => res.json())
      .then((data) => setAccounts(data))
  }, [])

  React.useEffect(() => {
    if (!accounts || current) {
      return
    }

    const [[tenant, [user]]] = Object.entries(accounts)
    setAccountCookie(tenant, user)
    setCurrent({tenant, user})
  }, [accounts, current])

  return useMemo(() => {
    return {
      current,
      tenants: accounts ? Object.keys(accounts) : undefined,
      users: accounts?.[current?.tenant],
      handleSetTenant: (tenant) => {
        const [user] = accounts[tenant]
        setAccountCookie(tenant, user)
        setCurrent({tenant, user})
      },
      handleSetUser: (user) => {
        const {tenant} = current
        setAccountCookie(tenant, user)
        setCurrent({tenant, user})
      }
    }
  }, [current, accounts])
}

function getAccountFromCookie() {
  const cookies = document.cookie.split(';')
    .map((cookie) => cookie.trim())
    .reduce((cookies, cookie) => {
      const [name, value] = cookie.split('=')
      cookies[name] = value
      return cookies
    }, {})

  const {tenant, user} = cookies

  if (tenant && user) {
    return {tenant, user}
  }
}

function setAccountCookie(tenant, user) {
  document.cookie = `tenant=${tenant}; Path=/; SameSite=Lax`
  document.cookie = `user=${user}; Path=/; SameSite=Lax`
}