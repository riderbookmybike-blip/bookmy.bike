
-- Update XT NEON (8 images)
UPDATE cat_items 
SET 
  gallery_urls = '["/media/tvs/ntorq-125/xt/xt-neon/360/image1.webp", "/media/tvs/ntorq-125/xt/xt-neon/360/image2.webp", "/media/tvs/ntorq-125/xt/xt-neon/360/image3.webp", "/media/tvs/ntorq-125/xt/xt-neon/360/image4.webp", "/media/tvs/ntorq-125/xt/xt-neon/360/image5.webp", "/media/tvs/ntorq-125/xt/xt-neon/360/image6.webp", "/media/tvs/ntorq-125/xt/xt-neon/360/image7.webp", "/media/tvs/ntorq-125/xt/xt-neon/360/image8.webp"]'::jsonb,
  image_url = '/media/tvs/ntorq-125/xt/xt-neon/360/image1.webp',
  specs = specs || jsonb_build_object(
    'gallery', '["/media/tvs/ntorq-125/xt/xt-neon/360/image1.webp", "/media/tvs/ntorq-125/xt/xt-neon/360/image2.webp", "/media/tvs/ntorq-125/xt/xt-neon/360/image3.webp", "/media/tvs/ntorq-125/xt/xt-neon/360/image4.webp", "/media/tvs/ntorq-125/xt/xt-neon/360/image5.webp", "/media/tvs/ntorq-125/xt/xt-neon/360/image6.webp", "/media/tvs/ntorq-125/xt/xt-neon/360/image7.webp", "/media/tvs/ntorq-125/xt/xt-neon/360/image8.webp"]'::jsonb,
    'primary_image', '/media/tvs/ntorq-125/xt/xt-neon/360/image1.webp'
  ) - 'media'
WHERE name = 'XT NEON' AND type = 'SKU';

-- Update NARDO GREY (36 images)
UPDATE cat_items 
SET 
  gallery_urls = '["/media/tvs/ntorq-125/disc/nardo-grey/360/image1.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image2.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image3.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image4.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image5.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image6.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image7.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image8.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image9.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image10.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image11.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image12.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image13.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image14.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image15.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image16.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image17.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image18.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image19.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image20.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image21.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image22.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image23.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image24.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image25.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image26.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image27.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image28.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image29.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image30.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image31.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image32.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image33.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image34.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image35.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image36.webp"]'::jsonb,
  image_url = '/media/tvs/ntorq-125/disc/nardo-grey/360/image1.webp',
  specs = specs || jsonb_build_object(
    'gallery', '["/media/tvs/ntorq-125/disc/nardo-grey/360/image1.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image2.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image3.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image4.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image5.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image6.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image7.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image8.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image9.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image10.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image11.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image12.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image13.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image14.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image15.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image16.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image17.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image18.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image19.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image20.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image21.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image22.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image23.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image24.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image25.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image26.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image27.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image28.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image29.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image30.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image31.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image32.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image33.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image34.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image35.webp", "/media/tvs/ntorq-125/disc/nardo-grey/360/image36.webp"]'::jsonb,
    'primary_image', '/media/tvs/ntorq-125/disc/nardo-grey/360/image1.webp'
  ) - 'media'
WHERE name = 'NARDO GREY' AND type = 'SKU';

-- Update METALLIC BLUE (4 images)
UPDATE cat_items 
SET 
  gallery_urls = '["/media/tvs/ntorq-125/disc/metallic-blue/360/image1.webp", "/media/tvs/ntorq-125/disc/metallic-blue/360/image2.webp", "/media/tvs/ntorq-125/disc/metallic-blue/360/image3.webp", "/media/tvs/ntorq-125/disc/metallic-blue/360/image4.webp"]'::jsonb,
  image_url = '/media/tvs/ntorq-125/disc/metallic-blue/360/image1.webp',
  specs = specs || jsonb_build_object(
    'gallery', '["/media/tvs/ntorq-125/disc/metallic-blue/360/image1.webp", "/media/tvs/ntorq-125/disc/metallic-blue/360/image2.webp", "/media/tvs/ntorq-125/disc/metallic-blue/360/image3.webp", "/media/tvs/ntorq-125/disc/metallic-blue/360/image4.webp"]'::jsonb,
    'primary_image', '/media/tvs/ntorq-125/disc/metallic-blue/360/image1.webp'
  ) - 'media'
WHERE name = 'METALLIC BLUE' AND type = 'SKU';

-- Update METALLIC RED (4 images)
UPDATE cat_items 
SET 
  gallery_urls = '["/media/tvs/ntorq-125/disc/metallic-red/360/image1.webp", "/media/tvs/ntorq-125/disc/metallic-red/360/image2.webp", "/media/tvs/ntorq-125/disc/metallic-red/360/image3.webp", "/media/tvs/ntorq-125/disc/metallic-red/360/image4.webp"]'::jsonb,
  image_url = '/media/tvs/ntorq-125/disc/metallic-red/360/image1.webp',
  specs = specs || jsonb_build_object(
    'gallery', '["/media/tvs/ntorq-125/disc/metallic-red/360/image1.webp", "/media/tvs/ntorq-125/disc/metallic-red/360/image2.webp", "/media/tvs/ntorq-125/disc/metallic-red/360/image3.webp", "/media/tvs/ntorq-125/disc/metallic-red/360/image4.webp"]'::jsonb,
    'primary_image', '/media/tvs/ntorq-125/disc/metallic-red/360/image1.webp'
  ) - 'media'
WHERE name = 'METALLIC RED' AND type = 'SKU';
