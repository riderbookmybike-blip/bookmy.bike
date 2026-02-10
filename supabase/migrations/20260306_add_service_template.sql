-- Add a minimal SERVICE template for General Service
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.cat_templates WHERE code = 'general_service') THEN
    INSERT INTO public.cat_templates (
      name,
      code,
      category,
      hierarchy_config,
      attribute_config,
      features_config
    ) VALUES (
      'General Service',
      'general_service',
      'SERVICE',
      '{"l1":"Plan","l2":"Tier"}'::jsonb,
      '[]'::jsonb,
      '{}'::jsonb
    );
  END IF;
END $$;
