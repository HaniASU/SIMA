const AI_SYSTEM_PROMPT = `You are a QR code, barcode, and Data Matrix configuration extractor. The user will describe what codes they want (QR codes, barcodes, Data Matrix codes, or a mix). Extract the configuration and return ONLY valid JSON with no extra text.

Required JSON format:
{
  "items": [
    {
      "type": "qr" or "barcode" or "datamatrix",
      "count": <number of codes of this type>,
      "dataPattern": "<pattern for data, use {n} for auto-incrementing number>",
      "startNumber": <starting number, default 1>
    }
  ],
  "paperSize": "a4" or "letter",
  "columnsPerRow": <number per row, default 4>,
  "labelWidthCm": <label width in cm, default 4>,
  "labelHeightCm": <label height in cm, default 3>,
  "brandName": "<brand/logo name if mentioned, or empty string>",
  "outputFormat": "pdf" or "png" or "svg"
}

Rules:
- The "items" array can have one or more entries, each with its own type, count, and pattern
- If the user only mentions QR codes, create one item with type "qr"
- If the user only mentions barcodes, create one item with type "barcode"
- If the user mentions Data Matrix (or "DM", "data matrix", "datamatrix"), create one item with type "datamatrix"
- If the user wants a mix (e.g. "3 QR codes, 4 barcodes, and 2 data matrix"), create separate items in the array for each type
- If the user says "ID: number" or similar, convert to "ID: {n}" pattern
- Each item group has its own startNumber and count
- If type is not specified, default to "qr"
- If dimensions are not specified, use sensible defaults
- If output format is not specified, default to "pdf"
- If paper size is not specified, default to "a4"
- If columns per row not specified, default to 4
- Return ONLY the JSON object, nothing else`;

/**
 * Helper for AI API requests.
 */
async function makeAIRequest(url, method, headers, body, providerName, errorParser = (t) => t) {
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      const errorMsg = errorParser(errText) || errText;
      throw new Error(`${providerName} error: ${response.status} - ${errorMsg}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`${providerName} API call failed:`, error);
    throw error;
  }
}

async function callOllama(prompt, model = 'llama3') {
  const data = await makeAIRequest(
    'http://localhost:11434/api/generate',
    'POST',
    { 'Content-Type': 'application/json' },
    {
      model,
      prompt: `${AI_SYSTEM_PROMPT}\n\nUser prompt: ${prompt}`,
      stream: false,
    },
    'Ollama'
  );
  return data.response;
}

async function callGemini(prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const data = await makeAIRequest(
    url,
    'POST',
    { 'Content-Type': 'application/json' },
    {
      contents: [{ parts: [{ text: `${AI_SYSTEM_PROMPT}\n\nUser prompt: ${prompt}` }] }],
    },
    'Gemini'
  );
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callOpenAI(prompt, apiKey, model = 'gpt-4o-mini') {
  const data = await makeAIRequest(
    'https://api.openai.com/v1/chat/completions',
    'POST',
    {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    {
      model,
      messages: [
        { role: 'system', content: AI_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    },
    'OpenAI'
  );
  return data.choices?.[0]?.message?.content || '';
}

async function callAnthropic(prompt, apiKey, model = 'claude-sonnet-4-5-20250929') {
  const data = await makeAIRequest(
    'https://api.anthropic.com/v1/messages',
    'POST',
    {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    {
      model,
      max_tokens: 1024,
      system: AI_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    },
    'Anthropic'
  );
  return data.content?.[0]?.text || '';
}

async function callOpenRouter(prompt, apiKey, model = 'meta-llama/llama-3-8b-instruct') {
  const data = await makeAIRequest(
    'https://openrouter.ai/api/v1/chat/completions',
    'POST',
    {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    {
      model,
      messages: [
        { role: 'system', content: AI_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    },
    'OpenRouter'
  );
  return data.choices?.[0]?.message?.content || '';
}

async function callGroq(prompt, apiKey, model = 'llama-3.1-8b-instant') {
  const data = await makeAIRequest(
    'https://api.groq.com/openai/v1/chat/completions',
    'POST',
    {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    {
      model,
      messages: [
        { role: 'system', content: AI_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    },
    'Groq'
  );
  return data.choices?.[0]?.message?.content || '';
}

async function callDeepSeek(prompt, apiKey, model = 'deepseek-chat') {
  const data = await makeAIRequest(
    'https://api.deepseek.com/chat/completions',
    'POST',
    {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    {
      model,
      messages: [
        { role: 'system', content: AI_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    },
    'DeepSeek'
  );
  return data.choices?.[0]?.message?.content || '';
}

async function callMistral(prompt, apiKey, model = 'mistral-small-latest') {
  const data = await makeAIRequest(
    'https://api.mistral.ai/v1/chat/completions',
    'POST',
    {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    {
      model,
      messages: [
        { role: 'system', content: AI_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    },
    'Mistral'
  );
  return data.choices?.[0]?.message?.content || '';
}

async function callCohere(prompt, apiKey, model = 'command-r-plus') {
  const data = await makeAIRequest(
    'https://api.cohere.com/v2/chat',
    'POST',
    {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    {
      model,
      messages: [
        { role: 'system', content: AI_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    },
    'Cohere'
  );
  return data.message?.content?.[0]?.text || '';
}

function parseAIResponse(responseText) {
  let jsonStr = responseText.trim();

  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    jsonStr = objectMatch[0];
  }

  const config = JSON.parse(jsonStr);

  // Normalize items array
  let items;
  if (Array.isArray(config.items) && config.items.length > 0) {
    items = config.items.map((item) => ({
      type: ['qr', 'barcode', 'datamatrix'].includes(item.type) ? item.type : 'qr',
      count: Math.max(1, Math.min(1000, parseInt(item.count) || 10)),
      dataPattern: item.dataPattern || 'CODE-{n}',
      startNumber: parseInt(item.startNumber) || 1,
    }));
  } else {
    // Backward compatibility: single count/dataPattern at root level
    items = [{
      type: config.type || 'qr',
      count: Math.max(1, Math.min(1000, parseInt(config.count) || 10)),
      dataPattern: config.dataPattern || 'QR-{n}',
      startNumber: parseInt(config.startNumber) || 1,
    }];
  }

  const totalCount = items.reduce((sum, item) => sum + item.count, 0);

  return {
    items,
    totalCount,
    paperSize: ['a4', 'letter'].includes(config.paperSize?.toLowerCase()) ? config.paperSize.toLowerCase() : 'a4',
    columnsPerRow: Math.max(1, Math.min(10, parseInt(config.columnsPerRow) || 4)),
    labelWidthCm: Math.max(1, Math.min(20, parseFloat(config.labelWidthCm) || 4)),
    labelHeightCm: Math.max(1, Math.min(20, parseFloat(config.labelHeightCm) || 3)),
    brandName: config.brandName || '',
    outputFormat: ['pdf', 'png', 'svg'].includes(config.outputFormat?.toLowerCase()) ? config.outputFormat.toLowerCase() : 'pdf',
  };
}

export async function analyzePrompt(prompt, provider, options = {}) {
  let responseText;

  switch (provider) {
    case 'ollama':
      responseText = await callOllama(prompt, options.model || 'llama3');
      break;
    case 'gemini':
      if (!options.apiKey) throw new Error('Gemini API key is required');
      responseText = await callGemini(prompt, options.apiKey);
      break;
    case 'openai':
      if (!options.apiKey) throw new Error('OpenAI API key is required');
      responseText = await callOpenAI(prompt, options.apiKey, options.model || 'gpt-4o-mini');
      break;
    case 'anthropic':
      if (!options.apiKey) throw new Error('Anthropic API key is required');
      responseText = await callAnthropic(prompt, options.apiKey, options.model || 'claude-sonnet-4-5-20250929');
      break;
    case 'openrouter':
      if (!options.apiKey) throw new Error('OpenRouter API key is required');
      responseText = await callOpenRouter(prompt, options.apiKey, options.model || 'meta-llama/llama-3-8b-instruct');
      break;
    case 'groq':
      if (!options.apiKey) throw new Error('Groq API key is required');
      responseText = await callGroq(prompt, options.apiKey, options.model || 'llama-3.1-8b-instant');
      break;
    case 'deepseek':
      if (!options.apiKey) throw new Error('DeepSeek API key is required');
      responseText = await callDeepSeek(prompt, options.apiKey, options.model || 'deepseek-chat');
      break;
    case 'mistral':
      if (!options.apiKey) throw new Error('Mistral API key is required');
      responseText = await callMistral(prompt, options.apiKey, options.model || 'mistral-small-latest');
      break;
    case 'cohere':
      if (!options.apiKey) throw new Error('Cohere API key is required');
      responseText = await callCohere(prompt, options.apiKey, options.model || 'command-r-plus');
      break;
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }

  return parseAIResponse(responseText);
}
