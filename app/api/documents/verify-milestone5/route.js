import { NextResponse } from 'next/server';
import { getRagContext } from '@/lib/ragContext';

/**
 * GET /api/documents/verify-milestone5
 * Verification endpoint for Milestone 5: RAG integration into IEP generation
 * Tests that getRagContext returns chunks when documents exist
 */
export async function GET() {
  try {
    const sampleContext = {
      studentGrade: '8th',
      studentAge: '14',
      areaOfNeed: 'Reading',
      disabilityCategory: 'Autism Spectrum Disorder',
      exceptionalities: ['Autism Spectrum Disorder'],
      weaknesses: ['Reading Comprehension', 'Written expression'],
      customGoals: [{ title: 'Improve reading fluency' }]
    };

    const ragContext = await getRagContext(sampleContext);

    return NextResponse.json({
      success: true,
      message: 'Milestone 5 verification complete',
      results: {
        ragContextLength: ragContext.length,
        hasContext: ragContext.length > 0,
        preview: ragContext ? ragContext.slice(0, 200) + (ragContext.length > 200 ? '...' : '') : '(none)'
      },
      note: ragContext.length === 0
        ? 'No RAG context returned. Upload PDFs via POST /api/documents/upload to populate. IEP generation will still work without context.'
        : 'RAG context will be injected into IEP generation prompts.'
    });
  } catch (error) {
    console.error('Milestone 5 verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
