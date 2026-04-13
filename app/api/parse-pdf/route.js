import { NextResponse } from 'next/server';
import { protectRoute } from '@/lib/authMiddleware';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const IMAGE_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'
]);

const EXTRACTION_PROMPT = `You are a Data Extraction Assistant. Extract the following fields from the student document:
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
- schoolName (school or campus name if listed)
- address (full street/city line or mailing address if present)
- parentGuardian1 (first parent/guardian name or label if listed)
- parentGuardian2 (second parent/guardian if listed)
- caseManager (assigned case manager or IEP coordinator name if listed)
- primaryExceptionality (primary disability category label, e.g. Specific Learning Disability, if clearly stated — prefer matching Florida exceptionality labels when possible)
- relatedServicesTherapy (comma-separated related services such as Speech, OT, PT, Counseling if listed)
- domainAreas (JSON array of zero or more of: "Curriculum and Learning Environment", "Social or Emotional Behavior", "Independent Functioning", "Communication", "Health Care" — only if clearly indicated)
- originalMeetingPlanDate (ISO date YYYY-MM-DD if found)
- initiationDate (ISO date YYYY-MM-DD if found)
- durationDate (ISO date YYYY-MM-DD if found)
- reviewDueDate (ISO date YYYY-MM-DD if found)
- reevaluationDueDate (ISO date YYYY-MM-DD if found)
- amendmentDate (ISO date YYYY-MM-DD if found)
- previouslyAmended (short text: Yes, No, or brief note if stated)
- meetingPurpose (short phrase if stated, e.g. annual review, amendment)
- domainsTransitionAreas (comma-separated domains or transition areas if listed)
- associatedPlans (short text if listed)

Special handling for performance fields:
- If the document contains long or descriptive passages for current performance, produce concise, normalized outputs:
  - performanceQuantitative: return a short phrase (preferably <= 5 words) like "Significantly Below Grade Level", "Below Grade Level", "At Grade Level", or "Above Grade Level" when possible. If a numeric score is present, you may return "Grade X" or the numeric score.
  - performanceNarrative: return a short descriptive sentence (preferably <= 15 words) that summarizes the narrative (e.g., "Shows steady progress with visual aids and routines").

Rules:
- Return ONLY valid JSON with these exact field names.
- For disabilities, strengths, weaknesses, areaOfNeed, and relatedServicesTherapy, combine multiple items into a single comma-separated string when needed (e.g., "ADHD, Dyslexia" or "Reading, Math").
- For domainAreas, return a JSON array of strings chosen only from the five domain labels above; use [] if none are stated.
- For any date field above, use YYYY-MM-DD only when a clear calendar date appears; otherwise use "add manually".
- If a field is not found in the document, set it to the exact string "add manually" (lowercase).
- Do not leave any field as an empty string - use "add manually" for missing data.
- For performanceQuantitative and performanceNarrative, prefer concise normalized values as described above.
- Do not include any markdown formatting or explanations, just the JSON object.`;

const ASSESSMENT_EXTRACT_PROMPT = `You extract assessment-related content for special education IEP drafting.
Return ONLY valid JSON with this exact shape: {"assessmentContext":"..."}.
The assessmentContext string should be plain prose (paragraphs allowed) summarizing scores, skills, subjects, levels, and observations found in the document. Include specifics when present. If there is no assessment-related content, use an empty string for assessmentContext.`;

export async function POST(request) {
  try {
    const authResult = await protectRoute(request);
    if (authResult.error) {
      return authResult.response;
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const mode = String(formData.get('mode') || '');

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    const mimeType = file.type || '';
    const isImage = IMAGE_TYPES.has(mimeType);
    const isPdf = mimeType === 'application/pdf';

    if (!isImage && !isPdf) {
      return NextResponse.json(
        { success: false, message: `Unsupported file type: ${mimeType}. Use PDF, JPG, PNG, GIF, or WebP.` },
        { status: 400 }
      );
    }

    console.log(`[parse] File: ${file.name} (${mimeType}, ${file.size} bytes, ${isImage ? 'image' : 'pdf'}, mode=${mode || 'intake'})`);

    if (mode === 'assessment') {
      let assessMessages;
      if (isImage) {
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        const dataUrl = `data:${mimeType};base64,${base64}`;
        assessMessages = [
          { role: 'system', content: ASSESSMENT_EXTRACT_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract assessment-related text from this document image.' },
              { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } }
            ]
          }
        ];
      } else {
        const bytes = await file.arrayBuffer();
        const uint8Array = new Uint8Array(bytes);
        let extractedText = '';
        try {
          const { extractText } = await import('unpdf');
          const result = await extractText(uint8Array);
          const textArray = result?.text || [];
          extractedText = Array.isArray(textArray) ? textArray.join('\n') : String(textArray);
          if (!extractedText || extractedText.trim().length < 10) {
            return NextResponse.json({ success: false, message: 'No text could be extracted from PDF' }, { status: 400 });
          }
        } catch (pdfError) {
          console.error('PDF parsing error:', pdfError);
          return NextResponse.json({ success: false, message: 'Failed to parse PDF file' }, { status: 400 });
        }
        assessMessages = [
          { role: 'system', content: ASSESSMENT_EXTRACT_PROMPT },
          { role: 'user', content: `Extract assessment-related text from this document:\n\n${extractedText}` }
        ];
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: assessMessages,
        temperature: 0.1,
        max_tokens: 4096
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      let extractedData;
      try {
        const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        extractedData = JSON.parse(cleanedResponse);
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        return NextResponse.json({ success: false, message: 'Failed to parse AI response' }, { status: 500 });
      }

      const assessmentContext = typeof extractedData?.assessmentContext === 'string' ? extractedData.assessmentContext : '';
      return NextResponse.json({
        success: true,
        data: { assessmentContext },
        message: `${isImage ? 'Image' : 'PDF'} parsed successfully`
      });
    }

    let messages;

    if (isImage) {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;

      messages = [
        { role: 'system', content: EXTRACTION_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract student information from this document image.' },
            { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } }
          ]
        }
      ];
    } else {
      // PDF: extract text first
      const bytes = await file.arrayBuffer();
      const uint8Array = new Uint8Array(bytes);

      let extractedText = '';
      try {
        const { extractText } = await import('unpdf');
        const result = await extractText(uint8Array);
        const textArray = result?.text || [];
        extractedText = Array.isArray(textArray) ? textArray.join('\n') : String(textArray);

        if (!extractedText || extractedText.trim().length < 10) {
          return NextResponse.json({ success: false, message: 'No text could be extracted from PDF' }, { status: 400 });
        }
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return NextResponse.json({ success: false, message: 'Failed to parse PDF file' }, { status: 400 });
      }

      messages = [
        { role: 'system', content: EXTRACTION_PROMPT },
        { role: 'user', content: `Extract student information from this text:\n\n${extractedText}` }
      ];
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.1,
      max_tokens: 2000
    });

    const responseText = completion.choices[0]?.message?.content || '{}';

    let extractedData;
    try {
      const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleanedResponse);
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json({ success: false, message: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      message: `${isImage ? 'Image' : 'PDF'} parsed successfully`
    });

  } catch (error) {
    console.error('Parse File Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to process file',
      error: error.message
    }, { status: 500 });
  }
}
