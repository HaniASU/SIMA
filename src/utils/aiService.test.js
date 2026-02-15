import { describe, it, expect } from 'vitest';
import { analyzePrompt } from './aiService';

// We only want to test the parsing logic, so we'll mock the internal calls.
// Since analyzePrompt calls internal functions that we can't easily mock directly 
// without aggressive rewiring, we will test the private parseAIResponse function 
// by exporting it for testing or by mocking the fetch calls that lead to it.
//
// Easier approach for this file structure: Mock global fetch to return a specific JSON
// and verify analyzePrompt parses it correctly.

global.fetch = vi.fn();

describe('aiService', () => {
  it('should parse a valid JSON response from Ollama', async () => {
    const mockResponse = {
      response: JSON.stringify({
        items: [{ type: 'qr', count: 5, dataPattern: 'ID-{n}' }],
        paperSize: 'a4',
      }),
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await analyzePrompt('test prompt', 'ollama');
    
    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe('qr');
    expect(result.items[0].count).toBe(5);
    expect(result.items[0].dataPattern).toBe('ID-{n}');
    expect(result.paperSize).toBe('a4');
  });

  it('should handle markdown code blocks in response', async () => {
    const jsonContent = JSON.stringify({
      items: [{ type: 'barcode', count: 2, dataPattern: '123' }]
    });
    
    // Simulate OpenAI response structure
    const mockResponse = {
      choices: [{
        message: {
          content: "Here is your config:\n```json\n" + jsonContent + "\n```"
        }
      }]
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // We need to pass an API key for openai provider to bypass the check
    const result = await analyzePrompt('test', 'openai', { apiKey: 'sk-test' });

    expect(result.items[0].type).toBe('barcode');
    expect(result.items[0].count).toBe(2);
  });
  
  it('should apply defaults for missing fields', async () => {
     const mockResponse = {
      response: JSON.stringify({
        items: [{ count: 1}] // missing type, dataPattern
      }),
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await analyzePrompt('test', 'ollama');
    
    expect(result.items[0].type).toBe('qr'); // default
    expect(result.items[0].dataPattern).toBe('CODE-{n}'); // default
    expect(result.columnsPerRow).toBe(4); // default
  });
});
