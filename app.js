const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const logger = require('morgan');
const fs = require('fs');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb+srv://admin:Vuong123@cluster0.spb0lec.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Todo model
const Todo = mongoose.model('Todo', {
    task: String,
    completed: Boolean
});

// Middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('combined', { stream: fs.createWriteStream(path.join(__dirname, 'logs', 'access.log'), { flags: 'a' }) }));

// Routes
app.get('/', async (req, res) => {
    try {
        const todos = await Todo.find();
        res.render('index', { todos });
    } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/todos', async (req, res) => {
    try {
        const { task } = req.body;
        const newTodo = new Todo({ task, completed: false });
        await newTodo.save();
        res.redirect('/');
        // Send email reminder
        sendEmailReminder(task);
    } catch (err) {
        console.log(err);
        res.status(400).send('Bad Request');
    }
});

app.post('/todos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const todo = await Todo.findById(id);
        todo.completed = !todo.completed;
        await todo.save();
        res.redirect('/');
    } catch (err) {
        console.log(err);
        res.status(400).send('Bad Request');
    }
});

app.post('/todos/:id/delete', async (req, res) => {
    try {
        const { id } = req.params;
        await Todo.findByIdAndDelete(id);
        res.redirect('/');
    } catch (err) {
        console.log(err);
        res.status(400).send('Bad Request');
    }
});

// Start server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

// Function to send email reminder
function sendEmailReminder(task) {
    // Setup nodemailer transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'a4154215@gmail.com', // Replace with your Gmail email
            pass: 'vuong123' // Replace with your Gmail password
        }
    });

    // Setup email data
    const mailOptions = {
        from: 'a4154215@gmail.com', // Sender address
        to: 'cbvuong.20it5@vku.udn.vn', // List of recipients
        subject: 'Todo Task Reminder', // Subject line
        text: `Don't forget to complete the task: ${task}` // Plain text body
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error occurred while sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}
