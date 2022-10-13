import React, {useMemo, useState} from 'react'

export default function useAccounts() {
  const [current, setCurrent] = useState(getAccountFromCookie())
  const [accounts, setAccounts] = useState()
  
  React.useEffect(() => {
    fetch('/accounts.json')
      .then((res) => res.json())
      .then(({accounts}) => setAccounts(accounts))
  }, [])

  React.useEffect(() => {
    if (!accounts || current) {
      return
    }

    const [user] = accounts
    setAccountCookie(user)
    setCurrent({user})
  }, [accounts, current])

  return useMemo(() => {
    return {
      current,
      users: accounts,
      handleSetUser: (user) => {
        setAccountCookie(user)
        setCurrent({user})
      }
    }
  }, [current, accounts])
}

function getAccountFromCookie() {
  var account
  document.cookie.split(';').forEach((c) => {
    const [cookieName, user] = c.split('=')
    if (cookieName === 'user') {
      account = {user}
    }
  })

  return account
}

function setAccountCookie(user) {
  document.cookie = `user=${user}; Path=/; SameSite=Lax`
}