# RAG & Knowledge Base Implementation

## Ingestion
1. Receive upload.
2. Validate type and size.
3. Store original.
4. Extract text.
5. Normalize whitespace.
6. Split into chunks.
7. Generate embeddings.
8. Upsert vectors into Qdrant.
9. Save chunk metadata in MySQL.
10. Mark document indexed.

## Chunking
Use configurable chunk size and overlap. Preserve headings and source metadata. Avoid splitting important structured content when possible.

## Retrieval
1. Embed question.
2. Search Qdrant.
3. Filter organization_id.
4. Filter document status/permissions.
5. Retrieve top K.
6. Optional rerank.
7. Build compact context.
8. Generate answer.

## Citation/source tracking
The application should keep source document/chunk IDs internally so the UI can optionally show “source” information.

## Reindex
When a document changes:
- mark old index stale
- generate new chunks
- update Qdrant points
- update MySQL metadata
- remove obsolete vectors.

## Deletion
Delete/deactivate both MySQL metadata and Qdrant points.

## RAG evaluation
Create a test set:
- question
- expected source
- expected answer facts
- allowed answer variance.

Measure retrieval relevance and groundedness.

## Important
RAG must not be used as a substitute for live API calls.
