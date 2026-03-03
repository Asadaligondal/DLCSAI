# MongoDB Atlas Vector Search (Optional)

For faster RAG retrieval with large document corpora, you can use MongoDB Atlas Vector Search instead of in-memory similarity search.

## Setup

1. **Use MongoDB Atlas** – Your `MONGODB_URI` must point to an Atlas cluster (e.g. `mongodb+srv://...mongodb.net/...`).

2. **Create a vector search index** in Atlas:
   - Go to your cluster → Search → Create Index
   - Choose "JSON Editor" and use:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536
    }
  ]
}
```

3. **Set the index name** in `.env`:

```
MONGODB_VECTOR_INDEX_NAME=document_chunks_vector
```

(Use the exact name you gave the index in Atlas.)

## Fallback

If the index is not configured or Atlas Vector Search fails, the app automatically falls back to in-memory cosine similarity. No changes are required for local MongoDB or small corpora.
