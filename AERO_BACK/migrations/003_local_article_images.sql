ALTER TABLE posts
  DROP CONSTRAINT posts_cover_image_url_check,
  ADD CONSTRAINT posts_cover_image_url_check
    CHECK (
      cover_image_url = ''
      OR cover_image_url ~ '^https?://'
      OR cover_image_url ~ '^asset:(aviation|space|science|careers|default)$'
      OR cover_image_url ~ '^/api/v1/uploads/[0-9a-f-]+\.(avif|jpg|png|webp)$'
    );

UPDATE posts
SET cover_image_url = CASE
  WHEN cover_image_url LIKE '%photo-1436491865332%' THEN 'asset:aviation'
  WHEN cover_image_url LIKE '%photo-1446776811953%' THEN 'asset:space'
  WHEN cover_image_url LIKE '%photo-1517976487492%' THEN 'asset:careers'
  WHEN cover_image_url LIKE '%photo-1529070538774%' THEN 'asset:science'
END
WHERE is_sample = TRUE
  AND (
    cover_image_url LIKE '%photo-1436491865332%'
    OR cover_image_url LIKE '%photo-1446776811953%'
    OR cover_image_url LIKE '%photo-1517976487492%'
    OR cover_image_url LIKE '%photo-1529070538774%'
  );
