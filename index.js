require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const json2csv = require('json2csv').parse;
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

const allowedOrigins = '*';
app.use(cors({
    origin: allowedOrigins,
    methods: "GET, POST, PUT, DELETE, OPTIONS",
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
}));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

mongoose.connect(process.env.DATABASE_URI);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Database connection failure"));
db.once("open", () => {
    console.log("Database connection success");
});

const subscriberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    }
});

const Subscriber = mongoose.model('Subscriber', subscriberSchema);

app.get('/subscribers', async (req, res) => {
    try {
        const subscribers = await Subscriber.find({});
        res.status(200).json(subscribers);
    } catch (error) {
        res.status(500).json('Failed to fetch subscribers');
        console.error(error, 'Failed to fetch subscribers');
    }
});

app.post('/subscribe', async (req, res) => {
    try {
        const { name, email } = req.body;

        const existingSubscriber = await Subscriber.findOne({ email });
        if (existingSubscriber) {
            return res.status(400).json('Email already exists');
        }

        const newSubscriber = new Subscriber({
            name,
            email
        });

        await newSubscriber.save();

        res.status(201).json('Subscriber created successfully');
    } catch (error) {
        res.status(500).json('Failed to create subscriber');
        console.error(error, 'Failed to create subscriber');
    }
});

app.delete('/subscribers', async (req, res) => {
    try {
        await Subscriber.deleteMany({});
        res.status(200).json('All subscribers deleted successfully');
    } catch (error) {
        res.status(500).json('Failed to delete subscribers');
        console.error(error, 'Failed to delete subscribers');
    }
});

app.delete('/subscribers/:id', async (req, res) => {
    const userId = req.params.id;
    try {
        const deletedUser = await Subscriber.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json('User not found');
        }
        res.status(200).json('User deleted successfully');
    } catch (error) {
        res.status(500).json('Failed to delete user');
        console.error(error, 'Failed to delete user');
    }
});

app.get('/export-subscribers', async (req, res) => {
    try {
        const subscribers = await Subscriber.find({});

        const fields = ['name', 'email'];
        const csv = json2csv(subscribers, { fields });

        const filename = 'subscribers.csv';

        res.setHeader('Content-disposition', 'attachment; filename=' + filename);
        res.set('Content-Type', 'text/csv');
        
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).json('Failed to export subscribers');
        console.error(error, 'Failed to export subscribers');
    }
});

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

const statusSchema = new mongoose.Schema({
    signup: {
        type: Boolean,
        required: true
    }
});

const Status = mongoose.model('Status', statusSchema);

app.get('/status', async (req, res) => {
    try {
        const status = await Status.find({});
        res.status(200).json(status);
    } catch (error) {
        res.status(500).json('Failed to fetch subscribers');
        console.error(error, 'Failed to fetch subscribers');
    }
});

app.get('/status/:id', async (req, res) => {
    try {
        const { id } = req.params; // Obtém o ID do parâmetro da URL
        const status = await Status.findById(id);

        // Se o status não for encontrado, retorne um erro 404
        if (!status) {
            return res.status(404).json({ message: 'Status não encontrado' });
        }

        // Se encontrado, retorne o status
        res.status(200).json(status);
    } catch (error) {
        res.status(500).json({ message: 'Falha ao buscar o status' });
        console.error(error, 'Falha ao buscar o status');
    }
});

app.put('/status/:id', async (req, res) => {
    try {
        const { id } = req.params; // Obtém o ID do parâmetro da URL

        // Consulta o documento pelo ID
        const status = await Status.findById(id);

        // Se o documento não for encontrado, retorne um erro 404
        if (!status) {
            return res.status(404).json({ message: 'Status não encontrado' });
        }

        // Altera o valor do campo 'signup' de true para false ou de false para true
        status.signup = !status.signup;

        // Salva as alterações no banco de dados
        await status.save();

        // Responde com o status atualizado
        res.status(200).json(status);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao processar a solicitação' });
    }
});

app.post('/send-credentials', async (req, res) => {
    try {

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: 'w.aciolib@gmail.com',
            subject: 'Credenciais de acesso ao dashboard',
            text: `Usuário: investloto\nSenha: i06141621$`,
            html: `
            <table width="100%" bgcolor="#F7F7F7">
                <tr align="center">
                    <td>
                        <table width="100%" style="max-width: 600px; background: #FFF; padding: 30px; margin: 30px; border-radius: 15px; box-shadow: 3px 3px 20px rgba(0, 0, 0, .1);">
                            <tr align="center">
                                <td>
                                    <img src="https://cdn-icons-png.flaticon.com/128/3038/3038841.png" style="width: auto; height: 50px; margin-bottom: 20px; display: table;" />
                                </td>
                            </tr>
                            <tr align="center">
                                <td>
                                    <span style="font-size: 17px; font-family: Arial, sans-serif;">Usuário: <strong>investloto</strong></span><br />
                                    <span style="font-size: 17px; font-family: Arial, sans-serif;">Senha: <strong>i06141621$</strong></span>
                                </td>
                            </tr>
                            <tr align="center">
                                <td>
                                    <a href="https://subscribers-viewer.vercel.app/" target="_blank" style="text-decoration: none; color: #FFF; background: #3CA6A6; border-radius: 100px; display: table; margin: 30px auto;">
                                        <span style="margin:10px 20px; display: table; font-size: 16px; font-family: Arial, sans-serif; font-weight: 500;">Ir ao dashboard</span>
                                    </a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json('Credentials sent successfully');
    } catch (error) {
        res.status(500).json('Failed to send credentials');
        console.error(error, 'Failed to send credentials');
    }
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Running at port ${PORT}`);
});