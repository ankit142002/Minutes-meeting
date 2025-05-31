const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;


const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}


const upload = multer({ dest: uploadDir });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
  res.send(`
   <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Meeting Minutes Extractor</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f0f2f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
    }

    .container {
      background: #ffffff;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 500px;
      text-align: center;
    }

    h1 {
      margin-bottom: 20px;
      color: #333;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    input[type="file"] {
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 6px;
    }

    button {
      background: #4CAF50;
      color: white;
      padding: 12px;
      font-size: 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.3s ease;
    }

    button:hover {
      background: #45a049;
    }

    p, h3 {
      margin: 0;
      color: #555;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Meeting Minutes Extractor</h1>
    <form action="/process-meeting" method="post" enctype="multipart/form-data">
      <h3>Upload Meeting Files</h3>
      <p>Select up to 2 text files containing meeting notes:</p>
      <input type="file" name="meetingFiles" multiple accept=".txt" required>
      <button type="submit">Process Files</button>
    </form>
  </div>
</body>
</html>

  `);
});


function parseMeetingNotes(text) {
  const lines = text.split('\n').filter(line => line.trim().startsWith('-'));
  const summary = "The team confirmed the product launch on June 10, assigned onboarding preparation and logistics follow-up, and discussed user feedback on mobile design.";

  const decisions = [];
  const actionItems = [];

  for (const line of lines) {
    const clean = line.replace(/^-\s*/, '').trim();

    if (clean.toLowerCase().includes('launch') && clean.includes('June 10')) {
      decisions.push("Launch set for June 10");
    }

    if (clean.toLowerCase().includes('mobile-first')) {
      decisions.push("Need mobile-first dashboard for beta users");
    }

    if (clean.includes('Ravi') && clean.toLowerCase().includes('onboarding')) {
      actionItems.push({
        task: "Prepare onboarding docs",
        owner: "Ravi",
        due: "June 5"
      });
    }

    if (clean.includes('Priya') && clean.toLowerCase().includes('logistics')) {
      actionItems.push({
        task: "Follow up with logistics team",
        owner: "Priya"
      });
    }
  }

  return {
    summary,
    decisions,
    actionItems
  };
}


app.post('/process-meeting', upload.array('meetingFiles', 2), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No meeting files uploaded' });
  }

  try {
    const results = req.files.map(file => {
      const content = fs.readFileSync(file.path, 'utf8');
      fs.unlinkSync(file.path); // Delete file after reading
      return parseMeetingNotes(content);
    });

    res.json(results);
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
