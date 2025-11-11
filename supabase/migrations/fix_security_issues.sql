-- ============================================
-- FIX SUPABASE SECURITY ISSUES
-- ============================================

-- 1. Fix function search_path vulnerability
-- Drop and recreate the function with secure search_path
DROP FUNCTION IF EXISTS public.products_sync_image();

CREATE OR REPLACE FUNCTION public.products_sync_image()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Sync image_url to image if image is empty
  IF NEW.image IS NULL OR NEW.image = '' THEN
    NEW.image := NEW.image_url;
  END IF;
  
  -- Sync image to image_url if image_url is empty
  IF NEW.image_url IS NULL OR NEW.image_url = '' THEN
    NEW.image_url := NEW.image;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS products_sync_image_trigger ON products;

CREATE TRIGGER products_sync_image_trigger
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION public.products_sync_image();

-- 2. Add comment for documentation
COMMENT ON FUNCTION public.products_sync_image() IS 'Synchronizes image and image_url fields. Uses secure search_path to prevent SQL injection.';
