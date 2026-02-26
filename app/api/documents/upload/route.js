import { NextResponse } from 'next/server';
import { protectRoute } from '@/lib/authMiddleware';
import connectDB from '@/lib/mongodb';
import Document from '@/models/Document';
import { chunkText } from '@/lib/chunking';
import { generateEmbeddingsBatch } from '@/lib/embeddings';
import { storeDocumentChunks } from '@/lib/vectorStore';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const BATCH_SIZE = 50; // Embeddings per batch to respect rate limits

export async function POST(request) {
  let documentId = null;

  try {
    const authResult = await protectRoute(request);
    if (authResult.error) return authResult.response;
    const user = authResult.user;

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'File too large. Max 50MB.' },
        { status: 400 }
      );
    }

    const filename = file.name || 'document.pdf';
    if (!filename.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, message: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    await connectDB();

    const doc = await Document.create({
      name: filename.replace(/\.pdf$/i, ''),
      originalFilename: filename,
      createdBy: user._id,
      status: 'processing'
    });
    documentId = doc._id;

    const bytes = await file.arrayBuffer();
    const uint8Array = new Uint8Array(bytes);

    const { extractText } = await import('unpdf');
    const result = await extractText(uint8Array);
    const textArray = result?.text || [];
    const extractedText = Array.isArray(textArray) ? textArray.join('\n') : String(textArray);

    if (!extractedText || extractedText.trim().length < 10) {
      await Document.findByIdAndUpdate(documentId, {
        status: 'failed',
        errorMessage: 'No text could be extracted from PDF'
      });
      return NextResponse.json(
        { success: false, message: 'No text could be extracted from PDF' },
        { status: 400 }
      );
    }

    const chunks = chunkText(extractedText, { chunkSize: 800, chunkOverlap: 100 });
    if (chunks.length === 0) {
      await Document.findByIdAndUpdate(documentId, {
        status: 'failed',
        errorMessage: 'No chunks produced from text'
      });
      return NextResponse.json(
        { success: false, message: 'No chunks produced from extracted text' },
        { status: 400 }
      );
    }

    const embeddings = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const texts = batch.map(c => c.content);
      const batchEmbeddings = await generateEmbeddingsBatch(texts);
      embeddings.push(...batchEmbeddings);
    }

    const chunksWithEmbeddings = chunks.map((c, i) => ({
      content: c.content,
      embedding: embeddings[i],
      chunkIndex: c.index
    }));

    await storeDocumentChunks(documentId, chunksWithEmbeddings);

    await Document.findByIdAndUpdate(documentId, {
      status: 'ready',
      chunkCount: chunks.length,
      pageCount: textArray.length || null
    });

    return NextResponse.json({
      success: true,
      documentId: String(documentId),
      status: 'ready',
      chunkCount: chunks.length,
      pageCount: textArray.length || null
    });
  } catch (error) {
    console.error('Document upload error:', error);

    if (documentId) {
      try {
        await Document.findByIdAndUpdate(documentId, {
          status: 'failed',
          errorMessage: error.message
        });
      } catch (e) {
        console.error('Failed to update document status:', e);
      }
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
