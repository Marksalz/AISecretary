import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined in environment variables');
}

/**
 * Service for processing natural language and preparing event data
 */
class ChatService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });
  }

  /**
   * Send a prompt to Gemini AI and get a response
   * @private
   */
  async _askGemini(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid prompt provided');
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      
      if (!response) {
        throw new Error('No response from Gemini API');
      }

      // Handle different response formats
      let responseText = '';
      if (typeof response.text === 'function') {
        responseText = response.text();
      } else if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
        responseText = response.candidates[0].content.parts[0].text;
      } else if (response.text) {
        responseText = response.text;
      }
      
      return responseText.trim();
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Failed to get response from Gemini: ${error.message}`);
    }
  }

  /**
   * Parse event information from natural language text using Gemini
   * @private
   */
  async _parseEventFromText(text) {
    const prompt = `
    Extract event information from the following text and return a JSON object with the following structure:
    
    Text: "${text}"
    
    Required fields:
    - title: string (event title)
    - start: ISO date string (start time)
    - end: ISO date string (end time)
    
    Optional fields:
    - description: string (event description)
    - location: string (event location)
    
    Example response:
    {
      "title": "Team Meeting",
      "start": "2023-06-15T14:00:00+02:00",
      "end": "2023-06-15T15:00:00+02:00",
      "description": "Weekly team sync",
      "location": "Conference Room A"
    }
    `;

    try {
      const response = await this._askGemini(prompt);
      const cleanResponse = response.replace(/```(?:json)?/g, '').trim();
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error parsing event from text:', error);
      throw new Error(`Failed to parse event details: ${error.message}`);
    }
  }

  /**
   * Prepare event data from natural language text
   * @param {string} text - Natural language description of the event
   * @returns {Promise<Object>} Formatted event data
   */
  async prepareEventData(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input');
    }

    try {
      // Parse the event details from the text
      const eventData = await this._parseEventFromText(text);
      
      // Validate required fields
      if (!eventData.title) {
        throw new Error('Event title is required');
      }
      
      if (!eventData.start) {
        throw new Error('Event start time is required');
      }
      
      // If no end time is provided, default to 1 hour after start
      if (!eventData.end) {
        const start = new Date(eventData.start);
        eventData.end = new Date(start.getTime() + 60 * 60 * 1000).toISOString();
      }

      // Return the prepared event data
      return {
        title: eventData.title,
        start: eventData.start,
        end: eventData.end,
        description: eventData.description || '',
        location: eventData.location || ''
      };
    } catch (error) {
      console.error('Error preparing event data:', error);
      throw new Error(`Failed to prepare event data: ${error.message}`);
    }
  }

  /**
   * Format a date range in a user-friendly way
   * @private
   */
  _formatDateRange(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Format de date lisible
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    };
    
    // Si c'est un événement toute la journée
    if (start.includes('T00:00:00') && end.includes('T00:00:00')) {
      return startDate.toLocaleDateString('fr-FR', options);
    }
    
    // Si c'est le même jour
    if (startDate.toDateString() === endDate.toDateString()) {
      return `${startDate.toLocaleDateString('fr-FR', options)} - ${endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Jours différents
    return `${startDate.toLocaleString('fr-FR', options)} - ${endDate.toLocaleString('fr-FR', options)}`;
  }

  /**
   * Format event data into a readable string (for display purposes)
   * @param {Object} event - Event data object
   * @returns {string} Formatted event information
   */
  formatEventForDisplay(event) {
    if (!event) return 'Aucune donnée d\'événement à afficher';
    
    const dateStr = this._formatDateRange(event.start, event.end);
    
    let response = `📅 ${event.title || 'Événement sans titre'}\n`;
    response += `   ⏰ ${dateStr}\n`;
    
    if (event.location) {
      response += `   📍 ${event.location}\n`;
    }
    
    if (event.description) {
      const desc = event.description.length > 100 
        ? event.description.substring(0, 97) + '...' 
        : event.description;
      response += `   📝 ${desc}\n`;
    }
    
    return response;
  }
}

// Create a singleton instance
export const chatService = new ChatService();

// Export individual methods for backward compatibility
export const { askGemini, addEventFromText, queryAgenda } = chatService;
