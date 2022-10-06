import React, {useCallback} from 'react'

export default function NewTicket() {
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault()

    const data = new FormData(event.target);
    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify(Object.fromEntries(data.entries()))
    }).then(res => res.json())

    window.location = `/tickets/${response.id}`
  }, [])

  return (
    <main>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label htmlFor="customer">Customer</label>
        <input type="text" name="customer"></input>

        <label htmlFor="description">Description</label>
        <textarea name="description" rows="3"></textarea>

        <div>
          <button type="submit">Create ticket</button>
        </div>
      </form>
  </main>
  )
}