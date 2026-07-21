import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper to safely parse JSON from Gemini text response
function parseGeminiJson<T>(text: string | undefined, fallback: T): T {
  if (!text) return fallback;
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.error('Failed to parse Gemini JSON output:', e, 'Raw text:', text);
    return fallback;
  }
}

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY variable is missing in server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Endpoint 1: Extract concepts from text or PDF base64
app.post('/api/extract-concepts', async (req, res) => {
  try {
    const { text, pdfBase64, existingTerms } = req.body;
    const ai = getGeminiClient();

    const promptText = `
Eres un profesor universitario experto en Marketing y Negocios Digitales.
Analiza la siguiente información de estudio (PDF y/o texto) y extrae los conceptos MÁS IMPORTANTES para estudiantes universitarios.
El objetivo NO es memorizar textos largos, sino comprender conceptos clave y aprobar exámenes.

Instrucciones:
1. Extrae entre 5 y 15 conceptos fundamentales estructurados.
2. Agrupa los conceptos por grandes temas (ej: 'Fundamentos de Marketing', 'Marketing Digital & Canales', 'Métricas & Analítica Web', 'Branding & Posicionamiento', 'Comportamiento del Consumidor', 'Modelos de Negocio & Growth').
3. Para cada concepto proporciona:
   - Termino (Nombre claro del concepto)
   - Definicion simple y facil de entender (explicado de forma limpia y directa)
   - Ejemplo practico del mundo real (marcas reales como Apple, Nike, Amazon, Spotify, Netflix, Coca-Cola)
   - Emoji o icono representativo
   - Nivel de dificultad ('fácil', 'medio', 'difícil')
   - Sinónimos o términos equivalentes (array de strings)
   - Key takeaway (resumen express en 1 frase memorable)
4. Detecta si algún concepto extraído es equivalente o repetido de estos términos ya existentes: ${JSON.stringify(existingTerms || [])}.
`;

    let contents: any;

    if (pdfBase64) {
      // Clean up base64 prefix and whitespace
      const cleanBase64 = pdfBase64.includes(',') 
        ? pdfBase64.split(',')[1].replace(/\s/g, '') 
        : pdfBase64.replace(/\s/g, '');

      contents = {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: cleanBase64,
            },
          },
          { text: promptText + (text?.trim() ? `\n\nTexto adicional aportado por el estudiante:\n${text}` : '') },
        ],
      };
    } else {
      contents = `${promptText}\n\nTexto de estudio a procesar:\n${text || ''}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: 'Lista de conceptos extraídos del material',
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              term: { type: Type.STRING },
              simpleDefinition: { type: Type.STRING },
              practicalExample: { type: Type.STRING },
              emoji: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ['fácil', 'medio', 'difícil'] },
              synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
              keyTakeaway: { type: Type.STRING },
              duplicatesWithExisting: { type: Type.STRING, description: 'Nombre del término existente si es duplicado o equivalente' },
            },
            required: ['topic', 'term', 'simpleDefinition', 'practicalExample', 'emoji', 'difficulty', 'keyTakeaway'],
          },
        },
      },
    });

    const parsed = parseGeminiJson<any[]>(response.text, []);
    
    if (!parsed || parsed.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se pudieron identificar conceptos relevantes en el PDF o texto provisto. Asegúrate de que el documento contenga texto de estudio legible.',
      });
    }

    res.json({ success: true, concepts: parsed });
  } catch (error: any) {
    console.error('Error extracting concepts from PDF/text:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al procesar el archivo PDF con la Inteligencia Artificial.',
    });
  }
});

// Endpoint 2: Evaluate Feynman technique explanation
app.post('/api/evaluate-feynman', async (req, res) => {
  try {
    const { conceptTerm, simpleDefinition, practicalExample, userExplanation } = req.body;
    const ai = getGeminiClient();

    const prompt = `
Actúa como un tutor de inteligencia artificial amigable, riguroso pero motivador de Marketing.
Evalúa la explicación de un estudiante universitario que usó la Técnica Feynman para explicar el concepto: "${conceptTerm}".

Definición de referencia del concepto:
${simpleDefinition}

Ejemplo práctico de referencia:
${practicalExample}

Explicación redactada por el alumno (en sus propias palabras):
"${userExplanation}"

Evalúa el entendimiento conceptual real del alumno (sin exigir memorización literal).
Proporciona:
- score: Un número de 0 a 100 indicando el nivel de dominio.
- feedback: Comentario retroalimentador positivo y directo.
- strengths: Lista de fortalezas clave identificadas en su explicación.
- missingConcepts: Detalles o matices importantes que omitió o podría mejorar.
- improvedVersion: Una versión pulida pero sencilla de cómo explicarlo de forma magistral.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            feedback: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvedVersion: { type: Type.STRING },
          },
          required: ['score', 'feedback', 'strengths', 'missingConcepts', 'improvedVersion'],
        },
      },
    });

    const parsed = parseGeminiJson<any>(response.text, {});
    res.json({ success: true, evaluation: parsed });
  } catch (error: any) {
    console.error('Error evaluating feynman:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error evaluando la explicación.',
    });
  }
});

// Endpoint 3: Generate dynamic custom exam
app.post('/api/generate-exam', async (req, res) => {
  try {
    const { concepts, questionCount = 8 } = req.body;
    const ai = getGeminiClient();

    const prompt = `
Genera un examen universitario de aprendizaje activo para los siguientes conceptos de Marketing y Negocios Digitales:
${JSON.stringify(concepts.map((c: any) => ({ id: c.id, term: c.term, simpleDefinition: c.simpleDefinition, practicalExample: c.practicalExample })))}

Crea exactamente ${questionCount} preguntas variadas.
Debes incluir una combinación equilibrada de estos 4 tipos de preguntas:
1. 'multiple_choice': Opción múltiple con 4 alternativas razonables.
2. 'true_false': Verdadero o Falso con justificación en la explicación.
3. 'fill_in': Completar el concepto clave o palabra que falta en la definición/caso.
4. 'matching': Relacionar conceptos con sus ejemplos prácticos o aplicaciones.

Asegúrate de que la 'explanation' explique claramente por qué la respuesta es correcta para consolidar el aprendizaje.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['multiple_choice', 'true_false', 'fill_in', 'matching'] },
              conceptId: { type: Type.STRING },
              conceptTerm: { type: Type.STRING },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ['id', 'type', 'conceptId', 'conceptTerm', 'question', 'correctAnswer', 'explanation'],
          },
        },
      },
    });

    const questions = parseGeminiJson<any[]>(response.text, []);
    res.json({ success: true, questions });
  } catch (error: any) {
    console.error('Error generating exam:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al generar preguntas de examen.',
    });
  }
});

// Endpoint 4: Generate 15-minute Cram Mode plan ("Tengo examen mañana")
app.post('/api/generate-cram-plan', async (req, res) => {
  try {
    const { concepts } = req.body;
    const ai = getGeminiClient();

    const prompt = `
Un estudiante universitario de Marketing tiene un examen mañana y solo dispone de 15 MINUTOS de estudio intensivo.
Revisa los siguientes conceptos y selecciona los ${Math.min(concepts.length, 6)} conceptos MÁS CRÍTICOS y de mayor peso para aprobar.

Conceptos disponibles:
${JSON.stringify(concepts)}

Devuelve una respuesta estructurada con:
- priorityConceptIds: Array con los IDs de los conceptos seleccionados.
- highYieldTips: 3 consejos de estudio de alto rendimiento para el examen.
- quickSummaryMap: Un objeto mapeando cada conceptId con un 'keyMnemonics' (regla mnemotécnica o truco mental para recordarlo en 3 segundos).
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priorityConceptIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            highYieldTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            quickSummaryMap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  conceptId: { type: Type.STRING },
                  mnemonic: { type: Type.STRING },
                  mustKnowKeypoint: { type: Type.STRING },
                },
                required: ['conceptId', 'mnemonic', 'mustKnowKeypoint'],
              },
            },
          },
          required: ['priorityConceptIds', 'highYieldTips', 'quickSummaryMap'],
        },
      },
    });

    const cramPlan = parseGeminiJson<any>(response.text, {});
    res.json({ success: true, cramPlan });
  } catch (error: any) {
    console.error('Error generating cram plan:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error generando plan de emergencia de 15 min.',
    });
  }
});

// Vite Middleware for development / static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Marketing Study Hub running on http://localhost:${PORT}`);
  });
}

startServer();
