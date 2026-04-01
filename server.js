const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
const upload = multer();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json());

app.post('/analyze', upload.single('photo'), async (req, res) => {
  try {
    const imageBase64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Look at this photo of the inside of a fridge.
1. List all the food items you can identify (as a simple comma-separated list).
2. Suggest 3 simple meals I could make with these ingredients.
For each meal provide: a name, a one-sentence description, and a short ingredient list.

Respond in this exact JSON format:
{
  "ingredients": ["item1", "item2", "item3"],
  "recipes": [
    {
      "name": "Meal Name",
      "description": "One sentence about the meal.",
      "ingredients": ["item1", "item2"]
    }
  ]
}`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse AI response');
    const data = JSON.parse(jsonMatch[0]);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong analyzing the photo.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`FridgeChef backend running on port ${PORT}`));
