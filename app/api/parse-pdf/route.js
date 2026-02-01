import { NextResponse } from 'next/server';
import { protectRoute } from '@/lib/authMiddleware';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request) {
  try {
    console.log('=== PDF Parse API Called ===');
    
    const authResult = await protectRoute(request);
    if (authResult.error) {
      console.log('Auth failed');
      return authResult.response;
    }

    console.log('Auth passed');

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file');

    console.log('File received:', file?.name, 'Size:', file?.size);

    if (!file) {
      console.log('No file in request');
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to Uint8Array
    const bytes = await file.arrayBuffer();
    const uint8Array = new Uint8Array(bytes);
    console.log('Converted to Uint8Array, length:', uint8Array.length);

    // Extract text from PDF using unpdf
    let extractedText = '';
    try {
      console.log('Starting PDF extraction...');
      const { extractText } = await import('unpdf');
      const result = await extractText(uint8Array);
      console.log('Extraction result type:', typeof result, 'Keys:', Object.keys(result || {}));
      
      // unpdf returns text as an array (one per page), join them
      const textArray = result?.text || [];
      extractedText = Array.isArray(textArray) ? textArray.join('\n') : String(textArray);
      console.log('Extracted text length:', extractedText?.length);
      
      if (!extractedText || extractedText.trim().length < 10) {
        console.log('Not enough text extracted. Full result:', JSON.stringify(result));
        return NextResponse.json({ success: false, message: 'No text could be extracted from PDF' }, { status: 400 });
      }
      
      console.log('Text extraction successful');
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      return NextResponse.json({ success: false, message: 'Failed to parse PDF file' }, { status: 400 });
    }

    // Call OpenAI to extract structured data
    const systemPrompt = `You are a Data Extraction Assistant. Extract the following fields from the student document text:
- name
- studentId
- gradeLevel
- age
- disabilities (comma-separated string if multiple)
- strengths (comma-separated string if multiple)
- weaknesses (comma-separated string if multiple)
- state (e.g., Florida, California, etc.)
- instructionalSetting (e.g., General Education, Special Education, Resource Room, etc.)
- performanceQuantitative (return a concise phrase describing quantitative level)
- performanceNarrative (return a concise sentence summarizing performance)
- areaOfNeed (academic areas needing support: Reading, Math, Writing, etc.)

Special handling for performance fields:
- If the document contains long or descriptive passages for current performance, produce concise, normalized outputs:
  - performanceQuantitative: return a short phrase (preferably <= 5 words) like "Significantly Below Grade Level", "Below Grade Level", "At Grade Level", or "Above Grade Level" when possible. If a numeric score is present, you may return "Grade X" or the numeric score.
  - performanceNarrative: return a short descriptive sentence (preferably <= 15 words) that summarizes the narrative (e.g., "Shows steady progress with visual aids and routines").

Rules:
- Return ONLY valid JSON with these exact field names.
- For disabilities, strengths, weaknesses, and areaOfNeed, combine multiple items into a single comma-separated string (e.g., "ADHD, Dyslexia" or "Reading, Math").
- If a field is not found in the document, set it to the exact string "add manually" (lowercase).
- Do not leave any field as an empty string - use "add manually" for missing data.
- For performanceQuantitative and performanceNarrative, prefer concise normalized values as described above.
- Do not include any markdown formatting or explanations, just the JSON object.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Extract student information from this text:\n\n${extractedText.substring(0, 3000)}` }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    
    // Parse the JSON response
    let extractedData;
    try {
      // Remove any markdown code block formatting if present
      const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleanedResponse);
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      console.error('Response was:', responseText);
      return NextResponse.json({ success: false, message: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      message: 'PDF parsed successfully'
    });

  } catch (error) {
    console.error('Parse PDF Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to process PDF',
      error: error.message
    }, { status: 500 });
  }
}
