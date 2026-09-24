const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const dns = require('dns')
require('dotenv').config()

// Configure DNS servers to prevent querySrv ECONNREFUSED on Windows networks
try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1'])
} catch (e) {
    console.warn('DNS server configuration warning:', e.message)
}

const app = express()

app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 5001

const todoSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: [true, 'Todo text is required'],
            trim: true,
        },
        completed: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
)

const Todo = mongoose.model('Todo', todoSchema)

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in environment variables')
        }
        const connection = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 15000,
            retryWrites: true,
        })

        console.log('MongoDB connected successfully')
        return connection
    } catch (err) {
        console.error('MongoDB connection error:', err.message)
        throw err
    }
}

mongoose.connection.on('error', (err) => {
    console.error('MongoDB runtime error:', err.message)
})

app.get('/', (req, res) => {
    res.json({ message: 'Todo API is running' })
})

app.get('/api/todos', async (req, res) => {
    try {
        const todos = await Todo.find().sort({ createdAt: -1 })
        res.json(todos)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

app.post('/api/todos', async (req, res) => {
    try {
        const { text, completed } = req.body || {}

        if (!text || typeof text !== 'string' || !text.trim()) {
            return res.status(400).json({ message: 'Todo text is required' })
        }

        const todo = await Todo.create({
            text: text.trim(),
            completed: Boolean(completed),
        })

        res.status(201).json(todo)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

app.put('/api/todos/:id', async (req, res) => {
    try {
        const { id } = req.params
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Todo ID format' })
        }

        const { text, completed } = req.body || {}
        const updateData = {}

        if (text !== undefined) {
            if (typeof text !== 'string' || !text.trim()) {
                return res.status(400).json({ message: 'Todo text cannot be empty' })
            }
            updateData.text = text.trim()
        }

        if (completed !== undefined) {
            updateData.completed = Boolean(completed)
        }

        const updatedTodo = await Todo.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true },
        )

        if (!updatedTodo) {
            return res.status(404).json({ message: 'Todo not found' })
        }

        res.json(updatedTodo)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

app.delete('/api/todos/:id', async (req, res) => {
    try {
        const { id } = req.params
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid Todo ID format' })
        }

        const deletedTodo = await Todo.findByIdAndDelete(id)

        if (!deletedTodo) {
            return res.status(404).json({ message: 'Todo not found' })
        }

        res.json({ message: 'Todo deleted successfully' })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

const startServer = async () => {
    try {
        await connectDB()
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`)
        })
    } catch (error) {
        console.error('Server failed to start:', error.message)
        process.exit(1)
    }
}

startServer()
