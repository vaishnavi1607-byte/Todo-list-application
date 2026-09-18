import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:5001/api/todos'

function App() {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [filter, setFilter] = useState('all')

  const fetchTodos = async () => {
    try {
      const response = await fetch(API_URL)
      if (!response.ok) {
        throw new Error('Failed to fetch todos')
      }
      const data = await response.json()
      setTodos(data)
    } catch (error) {
      console.error('Error fetching todos:', error)
    }
  }

  useEffect(() => {
    fetchTodos()
  }, [])

  const filteredTodos = useMemo(() => {
    if (filter === 'active') {
      return todos.filter((todo) => !todo.completed)
    }

    if (filter === 'completed') {
      return todos.filter((todo) => todo.completed)
    }

    return todos
  }, [filter, todos])

  const remainingTasks = todos.filter((todo) => !todo.completed).length

  const addTodo = async (event) => {
    event.preventDefault()

    if (!newTodo.trim()) return

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newTodo.trim(),
          completed: false,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add todo')
      }

      const createdTodo = await response.json()
      setTodos((prev) => [createdTodo, ...prev])
      setNewTodo('')
    } catch (error) {
      console.error('Error creating todo:', error)
    }
  }

  const toggleTodo = async (id) => {
    const todoToUpdate = todos.find((todo) => todo._id === id)
    if (!todoToUpdate) return

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: todoToUpdate.text,
          completed: !todoToUpdate.completed,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update todo')
      }

      const updatedTodo = await response.json()
      setTodos((prev) =>
        prev.map((todo) => (todo._id === id ? updatedTodo : todo)),
      )
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  const deleteTodo = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete todo')
      }

      setTodos((prev) => prev.filter((todo) => todo._id !== id))
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  const clearCompleted = async () => {
    try {
      const completedTodos = todos.filter((todo) => todo.completed)

      await Promise.all(
        completedTodos.map((todo) =>
          fetch(`${API_URL}/${todo._id}`, {
            method: 'DELETE',
          }),
        ),
      )

      setTodos((prev) => prev.filter((todo) => !todo.completed))
    } catch (error) {
      console.error('Error clearing completed tasks:', error)
    }
  }

  return (
    <main className="todo-app">
      <section className="todo-container">
        <header className="topbar">
          <div className="welcome-block">
            <p className="eyebrow">Good morning</p>
            <h1>Today’s agenda</h1>
          </div>
          <div className="top-actions">
            <button type="button" className="outline-btn">Schedule</button>
            <button type="button" className="primary-btn">Add task</button>
          </div>
        </header>

        <div className="summary-row">
          <div className="summary-card total">
            <span className="label">Total task</span>
            <strong>{todos.length}</strong>
          </div>
          <div className="summary-card pending">
            <span className="label">Pending</span>
            <strong>{remainingTasks}</strong>
          </div>
          <div className="summary-card done">
            <span className="label">Completed</span>
            <strong>{todos.length - remainingTasks}</strong>
          </div>
        </div>

        <form className="todo-form" onSubmit={addTodo}>
          <input
            type="text"
            value={newTodo}
            onChange={(event) => setNewTodo(event.target.value)}
            placeholder="Add a new task..."
            aria-label="Add a new task"
          />
          <button type="submit" className="primary-btn">Add</button>
        </form>

        <div className="filters" aria-label="Todo filters">
          <button
            type="button"
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={filter === 'active' ? 'active' : ''}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            type="button"
            className={filter === 'completed' ? 'active' : ''}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>

        <ul className="todo-list">
          {filteredTodos.length === 0 ? (
            <li className="empty-state">No tasks in this section.</li>
          ) : (
            filteredTodos.map((todo) => (
              <li key={todo._id} className={`todo-item ${todo.completed ? 'done' : ''}`}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo._id)}
                  />
                  <span>{todo.text}</span>
                </label>
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => deleteTodo(todo._id)}
                  aria-label={`Delete ${todo.text}`}
                >
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="bottom-bar">
          <span>
            {todos.length} total task{todos.length === 1 ? '' : 's'}
          </span>
          <button type="button" className="clear-btn" onClick={clearCompleted}>
            Clear completed
          </button>
        </div>
      </section>
    </main>
  )
}

export default App
