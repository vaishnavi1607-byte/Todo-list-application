import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/todos`
  : 'http://localhost:5001/api/todos'

function App() {
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [filter, setFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef(null)

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const fetchTodos = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(API_URL)
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: Failed to fetch tasks`)
      }
      const data = await response.json()
      setTodos(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching todos:', err)
      setError(err.message || 'Could not connect to the backend server.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(API_URL)
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: Failed to fetch tasks`)
        }
        const data = await response.json()
        if (!ignore) {
          setTodos(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (!ignore) {
          console.error('Error fetching todos:', err)
          setError(err.message || 'Could not connect to the backend server.')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      ignore = true
    }
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

  const handleFocusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const addTodo = async (event) => {
    event.preventDefault()

    const trimmed = newTodo.trim()
    if (!trimmed || isSubmitting) return

    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: trimmed,
          completed: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to add task')
      }

      const createdTodo = await response.json()
      setTodos((prev) => [createdTodo, ...prev])
      setNewTodo('')
    } catch (err) {
      console.error('Error creating todo:', err)
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleTodo = async (id) => {
    const todoToUpdate = todos.find((todo) => todo._id === id)
    if (!todoToUpdate) return

    const newCompleted = !todoToUpdate.completed
    // Optimistic UI update
    setTodos((prev) =>
      prev.map((todo) =>
        todo._id === id ? { ...todo, completed: newCompleted } : todo,
      ),
    )

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: newCompleted,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      const updatedTodo = await response.json()
      setTodos((prev) =>
        prev.map((todo) => (todo._id === id ? updatedTodo : todo)),
      )
    } catch (err) {
      console.error('Error updating todo:', err)
      setError(err.message)
      // Revert optimistic update
      setTodos((prev) =>
        prev.map((todo) =>
          todo._id === id ? { ...todo, completed: !newCompleted } : todo,
        ),
      )
    }
  }

  const deleteTodo = async (id) => {
    try {
      setError(null)
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete task')
      }

      setTodos((prev) => prev.filter((todo) => todo._id !== id))
    } catch (err) {
      console.error('Error deleting todo:', err)
      setError(err.message)
    }
  }

  const clearCompleted = async () => {
    const completedTodos = todos.filter((todo) => todo.completed)
    if (completedTodos.length === 0) return

    try {
      setError(null)
      await Promise.all(
        completedTodos.map(async (todo) => {
          const res = await fetch(`${API_URL}/${todo._id}`, {
            method: 'DELETE',
          })
          if (!res.ok) {
            throw new Error(`Failed to delete completed task: ${todo.text}`)
          }
        }),
      )

      setTodos((prev) => prev.filter((todo) => !todo.completed))
    } catch (err) {
      console.error('Error clearing completed tasks:', err)
      setError(err.message)
      fetchTodos()
    }
  }

  return (
    <main className="todo-app">
      <section className="todo-container">
        <header className="topbar">
          <div className="welcome-block">
            <p className="eyebrow">{greeting}</p>
            <h1>Today’s agenda</h1>
          </div>
          <div className="top-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={handleFocusInput}
            >
              Add task
            </button>
          </div>
        </header>

        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="retry-btn"
              onClick={fetchTodos}
            >
              Retry
            </button>
          </div>
        )}

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
            ref={inputRef}
            type="text"
            value={newTodo}
            onChange={(event) => setNewTodo(event.target.value)}
            placeholder="Add a new task..."
            aria-label="Add a new task"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className="primary-btn"
            disabled={isSubmitting || !newTodo.trim()}
          >
            {isSubmitting ? 'Adding...' : 'Add'}
          </button>
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
          {isLoading ? (
            <li className="empty-state">Loading tasks...</li>
          ) : filteredTodos.length === 0 ? (
            <li className="empty-state">No tasks in this section.</li>
          ) : (
            filteredTodos.map((todo) => (
              <li
                key={todo._id}
                className={`todo-item ${todo.completed ? 'done' : ''}`}
              >
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
          <button
            type="button"
            className="clear-btn"
            onClick={clearCompleted}
            disabled={todos.length - remainingTasks === 0}
          >
            Clear completed
          </button>
        </div>
      </section>
    </main>
  )
}

export default App
