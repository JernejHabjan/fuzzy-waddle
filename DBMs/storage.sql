
CREATE POLICY "test bucket access to authenticated users for webp files"
  ON storage.objects FOR SELECT USING (
  -- restrict bucket
  bucket_id = 'test-bucket'
  AND auth.role() = 'authenticated'
  -- allow access to only webp file
  AND storage."extension"(name) = 'webp'
  );
