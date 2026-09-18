const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()

app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 5001

const todoSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
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
        const { text, completed } = req.body

        if (!text || !text.trim()) {
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
        const { text, completed } = req.body

        const updatedTodo = await Todo.findByIdAndUpdate(
            req.params.id,
            { text, completed },
            { new: true },
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
        const deletedTodo = await Todo.findByIdAndDelete(req.params.id)

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
