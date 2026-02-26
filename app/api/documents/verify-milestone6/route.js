import { NextResponse } from 'next/server';

/**
 * GET /api/documents/verify-milestone6
 * Returns verification instructions for Milestone 6
 */
export async function GET() {
  return NextResponse.json({
    message: 'Milestone 6: Document Management UI',
    verification: {
      step1: 'Go to IEP Writer page (sidebar)',
      step2: 'Scroll to "Institutional Documents" section',
      step3: 'Click "Upload PDF" and select a PDF file',
      step4: 'Confirm the document appears in the list with status and chunk count',
      step5: 'Click the trash icon to delete; confirm it is removed from the list'
    }
  });
}
