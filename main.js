const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

mongoose.connect('mongodb://localhost:27017/tipCalculator', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

const tipSchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^\d{4}-\d{2}-\d{2}$/.test(v);
            },
            message: props => `${props.value} is not a valid date format!`
        }
    },
    numPeople: {
        type: Number,
        required: true,
        min: [1, 'Number of people must be at least 1']
    },
    billAmount: {
        type: Number,
        required: true,
        min: [0, 'Bill amount cannot be negative']
    },
    tipPercentage: {
        type: Number,
        required: true,
        min: [0, 'Tip percentage cannot be negative']
    },
    tipAmount: {
        type: Number,
        required: true,
        min: [0, 'Tip amount cannot be negative']
    },
    tipPerPerson: {
        type: Number,
        required: true
    },
    totalPerPerson: {
        type: Number,
        required: true
    }
});

const Tip = mongoose.model('Tip', tipSchema);

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tip Calculator</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.7.0/chart.min.js"></script>
    <style>
        body,
        input,
        button {
            font-family: Arial, sans-serif;
            font-size: 14px;
            margin: 0;
            padding: 0;
        }

        body {
            background: linear-gradient(to bottom right, #e0c3fc, #8ec5fc);
        }

        .container {
            max-width: 900px;
            margin: 20px auto;
            padding: 30px;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
        }

        h1,
        h2 {
            color: #333;
            margin-top: 0;
        }

        h1 {
            font-size: 35px;
            text-align: center;
            margin-bottom: 20px;
        }

        h2 {
            font-size: 24px;
            margin: 40px 0 20px;
        }

        p {
            color: #666;
            margin-bottom: 25px;
            text-align: center;
        }

        .input-group {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 25px;
        }

        .input-group>div {
            width: 100%;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
        }

        input[type="number"] {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            box-sizing: border-box;
            transition: border-color 0.3s;
        }

        input[type="number"]:focus {
            border-color: #000;
            outline: none;
        }

        .calculated-tip {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            padding: 12px;
            background-color: #f8f9fa;
            border-radius: 6px;
            text-align: center;
        }

        button {
            background-color: #000;
            color: white;
            border: none;
            padding: 12px 24px;
            cursor: pointer;
            border-radius: 6px;
            font-weight: 500;
            transition: background-color 0.3s;
        }

        button:hover {
            background-color: #333;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background-color: #fff;
            border-radius: 8px;
            overflow: hidden;
        }

        th,
        td {
            text-align: left;
            padding: 15px;
            border-bottom: 1px solid #eee;
        }

        th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #333;
        }

        .delete-btn {
            background: none;
            border: none;
            cursor: pointer;
            color: #dc3545;
            padding: 8px;
            font-size: 14px;
        }

        .delete-btn:hover {
            color: #bd2130;
            background-color: #ffeaea;
            border-radius: 4px;
        }

        #delete-all {
            background-color: #fff;
            color: #dc3545;
            border: 1px solid #dc3545;
            margin-top: 20px;
        }

        #delete-all:hover {
            background-color: #dc3545;
            color: #fff;
        }

        .no-data {
            text-align: center;
            padding: 60px 0;
            color: #999;
            background-color: #f8f9fa;
            border-radius: 8px;
            margin-top: 20px;
        }

        .no-data img {
            width: 60px;
            margin-bottom: 15px;
            opacity: 0.5;
        }

        .analysis-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 20px 0;
        }

        .analysis-item {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            transition: transform 0.2s;
        }

        .analysis-item:hover {
            transform: translateY(-2px);
        }

        .analysis-item p {
            color: #666;
            margin: 0 0 10px 0;
            font-size: 16px;
            font-weight: 500;
        }

        .analysis-item .amount {
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
        }

        .date-range {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 20px;
        }

        .date-range input[type="date"] {
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
        }

        .date-range span {
            color: #666;
        }

        @media screen and (max-width: 768px) {
            .container {
                margin: 10px;
                padding: 15px;
            }

            h1 {
                font-size: 24px;
                margin-bottom: 15px;
            }

            h2 {
                font-size: 20px;
                margin: 25px 0 15px;
            }

            .input-group {
                grid-template-columns: 1fr;
                gap: 15px;
            }

            .analysis-container {
                grid-template-columns: 1fr;
            }

            .calculated-tip {
                font-size: 20px;
                padding: 10px;
            }

            .date-range {
                flex-direction: column;
                align-items: stretch;
                gap: 10px;
            }

            .date-range input[type="date"] {
                width: 100%;
            }

            table {
                display: block;
                overflow-x: auto;
                white-space: nowrap;
            }

            th,
            td {
                padding: 10px;
                font-size: 13px;
            }

            .delete-btn {
                padding: 6px;
            }
        }

        @media screen and (min-width: 769px) and (max-width: 1024px) {
            .container {
                margin: 15px;
                padding: 20px;
            }

            .input-group {
                grid-template-columns: repeat(2, 1fr);
            }

            .analysis-container {
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
            }
        }

        @media screen and (max-width: 480px) {
            button {
                width: 100%;
                margin-bottom: 10px;
            }

            .analysis-item {
                padding: 15px;
            }

            .analysis-item .amount {
                font-size: 22px;
            }

            .no-data {
                padding: 30px 0;
            }

            .no-data img {
                width: 40px;
            }

            table {
                font-size: 12px;
            }

            th,
            td {
                padding: 8px;
            }
        }

        @media print {
            .container {
                margin: 0;
                padding: 0;
                box-shadow: none;
            }

            button,
            .delete-btn,
            #delete-all {
                display: none;
            }

            .chart-container {
                page-break-inside: avoid;
            }

            table {
                page-break-inside: avoid;
            }

            @page {
                margin: 2cm;
            }
        }

        @media (prefers-contrast: high) {
            .container {
                background-color: #ffffff;
                border: 2px solid #000000;
            }

            input[type="number"],
            input[type="date"] {
                border: 2px solid #000000;
            }

            .calculated-tip {
                border: 2px solid #000000;
            }

            button {
                border: 2px solid #000000;
            }

        }
    </style>
</head>

<body>
    <div class="container">
        <h1>Tip Calculator</h1>
        <p>Calculate and manage your tips with ease.</p>

        <div class="input-group">
            <div>
                <label for="bill-amount">Bill Amount (₹):</label>
                <input type="number" id="bill-amount" placeholder="0.00" min="0" step="0.01" oninput="calculateTip()">
            </div>
            <div>
                <label for="tip-percentage">Tip Percentage (%):</label>
                <input type="number" id="tip-percentage" value="15" min="0" max="100" oninput="calculateTip()">
            </div>
            <div>
                <label for="num-people">Number of People:</label>
                <input type="number" id="num-people" value="1" min="1" oninput="calculateTip()">
            </div>
        </div>

        <div class="input-group">
            <div>
                <label>Total Tip</label>
                <div class="calculated-tip" id="calculated-tip">₹0.00</div>
            </div>
            <div>
                <label>Tip per Person</label>
                <div class="calculated-tip" id="tip-per-person">₹0.00</div>
            </div>
            <div>
                <label>Total per Person</label>
                <div class="calculated-tip" id="total-per-person">₹0.00</div>
            </div>
        </div>

        <button id="save-tip">Save Tip</button>

        <h2>Tip History</h2>
        <div class="date-range">
            <input type="date" id="start-date" value=''>
            <span>to</span>
            <input type="date" id="end-date" value=''>
        </div>

        <table id="tip-history">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>People</th>
                    <th>Bill Amount</th>
                    <th>Tip %</th>
                    <th>Total Tip</th>
                    <th>Tip/Person</th>
                    <th>Total/Person</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        </table>
        <div id="no-data" class="no-data" style="display:none;">
            <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWluYm94Ij48cG9seWxpbmUgcG9pbnRzPSIyMiAxMiAxNiAxMiAxNCAxNSAxMCAxNSA4IDEyIDIgMTIiLz48cGF0aCBkPSJNNS40NSA1LjExTDIgMTJ2NmEyIDIgMCAwIDAgMiAyaDE2YTIgMiAwIDAgMCAyLTJ2LTZsLTMuNDUtNi44OUEyIDIgMCAwIDAgMTYuNzYgNEg3LjI0YTIgMiAwIDAgMC0xLjc5IDEuMTF6Ii8+PC9zdmc+"
                alt="No Data">
            <p>No tip history available</p>
        </div>
        <button id="delete-all">Delete All Records</button>
        <h2>Tip Analysis</h2>
        <div class="analysis-container">
            <div class="analysis-item">
                <p>Total Bills Paid</p>
                <div class="amount" id="total-bills">₹0.00</div>
            </div>
            <div class="analysis-item">
                <p>Total Tips Given</p>
                <div class="amount" id="total-tips">₹0.00</div>
            </div>
        </div>

        <h2>Tip Trends</h2>
        <div class="chart-container">
            <canvas id="tipChart"></canvas>
        </div>
    </div>

    <script>
        let chart = null;

        function calculateTip() {
            const billAmount = parseFloat(document.getElementById('bill-amount').value) || 0;
            const tipPercentage = parseFloat(document.getElementById('tip-percentage').value) || 0;
            const numPeople = parseFloat(document.getElementById('num-people').value) || 1;

            const tipAmount = billAmount * (tipPercentage / 100);
            const tipPerPerson = tipAmount / numPeople;
            const totalPerPerson = (billAmount + tipAmount) / numPeople;

            document.getElementById('calculated-tip').innerText = \`₹\${tipAmount.toFixed(2)}\`;
            document.getElementById('tip-per-person').innerText = \`₹\${tipPerPerson.toFixed(2)}\`;
            document.getElementById('total-per-person').innerText = \`₹\${totalPerPerson.toFixed(2)}\`;

            return { tipAmount, tipPerPerson, totalPerPerson };
        }

        async function saveTip() {
            const billAmount = parseFloat(document.getElementById('bill-amount').value);
            if (!billAmount) {
                alert('Please enter a valid bill amount');
                return;
            }

            const tipPercentage = parseFloat(document.getElementById('tip-percentage').value);
            const numPeople = parseFloat(document.getElementById('num-people').value);
            const { tipAmount, tipPerPerson, totalPerPerson } = calculateTip();

            try {
                const response = await fetch('/api/tips', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: new Date().toISOString().split('T')[0],
                        numPeople,
                        billAmount,
                        tipPercentage,
                        tipAmount,
                        tipPerPerson,
                        totalPerPerson
                    })
                });

                if (response.ok) {
                    document.getElementById('bill-amount').value = '';
                    updateDisplay();
                }
            } catch (error) {
                console.error('Error saving tip:', error);
                alert('Error saving tip');
            }
        }

        async function deleteTip(id) {
            if (confirm('Are you sure you want to delete this record?')) {
                try {
                    const response = await fetch(\`/api/tips/\${id}\`, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        updateDisplay();
                    }
                } catch (error) {
                    console.error('Error deleting tip:', error);
                    alert('Error deleting tip');
                }
            }
        }

        async function deleteAllTips() {
            if (confirm('Are you sure you want to delete all records?')) {
                try {
                    const response = await fetch('/api/tips', {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        updateDisplay();
                    }
                } catch (error) {
                    console.error('Error deleting all tips:', error);
                    alert('Error deleting tips');
                }
            }
        }

        async function updateTipHistory() {
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;

            try {
                const response = await fetch(\`/api/tips?startDate=\${startDate}&endDate=\${endDate}\`);
                const tips = await response.json();

                const tbody = document.querySelector('#tip-history tbody');
                tbody.innerHTML = '';

                if (tips.length === 0) {
                    document.getElementById('no-data').style.display = 'block';
                } else {
                    document.getElementById('no-data').style.display = 'none';

                    tips.forEach(tip => {
                        const row = document.createElement('tr');
                        row.innerHTML = \`
            <td>\${tip.date}</td>
            <td>\${tip.numPeople}</td>
            <td>₹\${tip.billAmount.toFixed(2)}</td>
            <td>\${tip.tipPercentage}%</td>
            <td>₹\${tip.tipAmount.toFixed(2)}</td>
            <td>₹\${tip.tipPerPerson.toFixed(2)}</td>
            <td>₹\${tip.totalPerPerson.toFixed(2)}</td>
            <td><button onclick="deleteTip('\${tip._id}')">Delete</button></td>
        \`;
                        tbody.appendChild(row);
                    });
                }
            } catch (error) {
                console.error('Error fetching tips:', error);
                alert('Error loading tip history');
            }
        }

        async function updateAnalysis() {
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;

            try {
                const response = await fetch(\`/api/analysis?startDate=\${startDate}&endDate=\${endDate}\`);
                const data = await response.json();

                document.getElementById('total-bills').innerText = \`₹\${data.totalBills.toFixed(2)}\`;
                document.getElementById('total-tips').innerText = \`₹\${data.totalTips.toFixed(2)}\`;
            } catch (error) {
                console.error('Error fetching analysis:', error);
            }
        }

        async function updateChart() {
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;

            try {
                const response = await fetch(\`/api/tips?startDate=\${startDate}&endDate=\${endDate}\`);
                const tips = await response.json();

                const labels = tips.map(tip => tip.date);
                const tipAmounts = tips.map(tip => tip.tipAmount);
                const tipPercentages = tips.map(tip => tip.tipPercentage);

                if (chart) {
                    chart.destroy();
                }

                const ctx = document.getElementById('tipChart').getContext('2d');
                chart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Tip Amount (₹)',
                                data: tipAmounts,
                                borderColor: 'rgb(75, 192, 192)',
                                yAxisID: 'y',
                                tension: 0.4
                            },
                            {
                                label: 'Tip Percentage (%)',
                                data: tipPercentages,
                                borderColor: 'rgb(255, 99, 132)',
                                yAxisID: 'y1',
                                tension: 0.4
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                position: 'left'
                            },
                            y1: {
                                beginAtZero: true,
                                position: 'right'
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Error updating chart:', error);
            }
        }

        function updateDisplay() {
            updateTipHistory();
            updateAnalysis();
            updateChart();
        }

        document.getElementById('bill-amount').addEventListener('input', calculateTip);
        document.getElementById('tip-percentage').addEventListener('input', calculateTip);
        document.getElementById('num-people').addEventListener('input', calculateTip);
        document.getElementById('start-date').addEventListener('change', updateDisplay);
        document.getElementById('end-date').addEventListener('change', updateDisplay);
        document.getElementById('save-tip').addEventListener('click', saveTip);
        document.getElementById('delete-all').addEventListener('click', deleteAllTips);

        document.addEventListener('DOMContentLoaded', updateDisplay);

    </script>
</body>

</html>
    `);
});

app.get('/api/tips', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = startDate;
            if (endDate) query.date.$lte = endDate;
        }

        const tips = await Tip.find(query).sort({ date: -1 });

        if (!tips || tips.length === 0) {
            return res.json([]);
        }

        res.json(tips);
    } catch (error) {
        console.error('Error fetching tips:', error);
        res.status(500).json({ error: 'Internal server error while fetching tips' });
    }
});

app.post('/api/tips', async (req, res) => {
    try {
        const requiredFields = ['date', 'numPeople', 'billAmount', 'tipPercentage', 'tipAmount', 'tipPerPerson', 'totalPerPerson'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ error: `Missing required field: ${field}` });
            }
        }

        const tip = new Tip(req.body);
        await tip.save();
        res.status(201).json(tip);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        console.error('Error saving tip:', error);
        res.status(500).json({ error: 'Internal server error while saving tip' });
    }
});

app.delete('/api/tips/:id', async (req, res) => {
    try {
        const tip = await Tip.findByIdAndDelete(req.params.id);
        if (!tip) {
            return res.status(404).json({ error: 'Tip not found' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting tip:', error);
        res.status(500).json({ error: 'Internal server error while deleting tip' });
    }
});

app.delete('/api/tips', async (req, res) => {
    try {
        await Tip.deleteMany({});
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting all tips:', error);
        res.status(500).json({ error: 'Internal server error while deleting all tips' });
    }
});

app.get('/api/analysis', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = startDate;
            if (endDate) query.date.$lte = endDate;
        }

        const tips = await Tip.find(query);

        const totalBills = parseFloat(tips.reduce((sum, tip) => sum + tip.billAmount, 0).toFixed(2));
        const totalTips = parseFloat(tips.reduce((sum, tip) => sum + tip.tipAmount, 0).toFixed(2));
        const averageTipPercentage = tips.length ?
            parseFloat((tips.reduce((sum, tip) => sum + tip.tipPercentage, 0) / tips.length).toFixed(2)) : 0;

        res.json({
            totalBills,
            totalTips,
            averageTipPercentage
        });
    } catch (error) {
        console.error('Error fetching analysis:', error);
        res.status(500).json({ error: 'Internal server error while fetching analysis' });
    }
});

app.post('/api/tips', async (req, res) => {
    try {
        const tip = new Tip(req.body);
        await tip.save();
        res.status(200).send(tip);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.delete('/api/tips', async (req, res) => {
    try {
        await Tip.deleteMany({});
        res.status(200).send({ message: 'All records deleted' });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

async function addSampleData() {
    try {
        const count = await Tip.countDocuments();
        if (count === 0) {
            const today = new Date();
            const sampleData = [
                {
                    date: new Date().toISOString().split('T')[0],
                    numPeople: 4,
                    billAmount: 2400.00,
                    tipPercentage: 15,
                    tipAmount: 360.00,
                    tipPerPerson: 90.00,
                    totalPerPerson: 690.00
                },
                {
                    date: new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0],
                    numPeople: 2,
                    billAmount: 1200.00,
                    tipPercentage: 10,
                    tipAmount: 120.00,
                    tipPerPerson: 60.00,
                    totalPerPerson: 660.00
                },
                {
                    date: new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0],
                    numPeople: 3,
                    billAmount: 1800.00,
                    tipPercentage: 20,
                    tipAmount: 360.00,
                    tipPerPerson: 120.00,
                    totalPerPerson: 720.00
                }
            ];

            await Tip.insertMany(sampleData);
            console.log('Sample data added successfully');
        }
    } catch (error) {
        console.error('Error adding sample data:', error);
    }
}

const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}).on('error', (err) => {
    console.error('Server failed to start:', err);
    process.exit(1);
});

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
    addSampleData();
});
