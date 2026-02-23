export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: '14.1';
    };
    public: {
        Tables: {
            analytics_events: {
                Row: {
                    created_at: string | null;
                    event_name: string | null;
                    event_type: string;
                    id: string;
                    metadata: Json | null;
                    page_path: string | null;
                    session_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    event_name?: string | null;
                    event_type: string;
                    id?: string;
                    metadata?: Json | null;
                    page_path?: string | null;
                    session_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    event_name?: string | null;
                    event_type?: string;
                    id?: string;
                    metadata?: Json | null;
                    page_path?: string | null;
                    session_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'analytics_events_session_id_fkey1';
                        columns: ['session_id'];
                        isOneToOne: false;
                        referencedRelation: 'analytics_sessions';
                        referencedColumns: ['id'];
                    },
                ];
            };
            analytics_sessions: {
                Row: {
                    browser_name: string | null;
                    country: string | null;
                    created_at: string | null;
                    device_type: string | null;
                    id: string;
                    ip_address: string | null;
                    last_active_at: string | null;
                    latitude: number | null;
                    longitude: number | null;
                    os_name: string | null;
                    taluka: string | null;
                    user_agent: string | null;
                    user_id: string | null;
                };
                Insert: {
                    browser_name?: string | null;
                    country?: string | null;
                    created_at?: string | null;
                    device_type?: string | null;
                    id?: string;
                    ip_address?: string | null;
                    last_active_at?: string | null;
                    latitude?: number | null;
                    longitude?: number | null;
                    os_name?: string | null;
                    taluka?: string | null;
                    user_agent?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    browser_name?: string | null;
                    country?: string | null;
                    created_at?: string | null;
                    device_type?: string | null;
                    id?: string;
                    ip_address?: string | null;
                    last_active_at?: string | null;
                    latitude?: number | null;
                    longitude?: number | null;
                    os_name?: string | null;
                    taluka?: string | null;
                    user_agent?: string | null;
                    user_id?: string | null;
                };
                Relationships: [];
            };
            audit_logs: {
                Row: {
                    action: string | null;
                    created_at: string | null;
                    id: string;
                    metadata: Json | null;
                    user_id: string | null;
                };
                Insert: {
                    action?: string | null;
                    created_at?: string | null;
                    id?: string;
                    metadata?: Json | null;
                    user_id?: string | null;
                };
                Update: {
                    action?: string | null;
                    created_at?: string | null;
                    id?: string;
                    metadata?: Json | null;
                    user_id?: string | null;
                };
                Relationships: [];
            };
            cat_assets: {
                Row: {
                    created_at: string | null;
                    id: string;
                    is_flipped: boolean | null;
                    is_primary: boolean | null;
                    item_id: string;
                    metadata: Json | null;
                    offset_x: number | null;
                    offset_y: number | null;
                    position: number | null;
                    type: string;
                    updated_at: string | null;
                    url: string;
                    zoom_factor: number | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    is_flipped?: boolean | null;
                    is_primary?: boolean | null;
                    item_id: string;
                    metadata?: Json | null;
                    offset_x?: number | null;
                    offset_y?: number | null;
                    position?: number | null;
                    type: string;
                    updated_at?: string | null;
                    url: string;
                    zoom_factor?: number | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    is_flipped?: boolean | null;
                    is_primary?: boolean | null;
                    item_id?: string;
                    metadata?: Json | null;
                    offset_x?: number | null;
                    offset_y?: number | null;
                    position?: number | null;
                    type?: string;
                    updated_at?: string | null;
                    url?: string;
                    zoom_factor?: number | null;
                };
                Relationships: [];
            };
            cat_brands: {
                Row: {
                    brand_category: string | null;
                    brand_logos: Json | null;
                    created_at: string | null;
                    id: string;
                    is_active: boolean | null;
                    logo_svg: string | null;
                    logo_url: string | null;
                    name: string;
                    slug: string;
                    specifications: Json | null;
                    updated_at: string | null;
                    website_url: string | null;
                };
                Insert: {
                    brand_category?: string | null;
                    brand_logos?: Json | null;
                    created_at?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    logo_svg?: string | null;
                    logo_url?: string | null;
                    name: string;
                    slug: string;
                    specifications?: Json | null;
                    updated_at?: string | null;
                    website_url?: string | null;
                };
                Update: {
                    brand_category?: string | null;
                    brand_logos?: Json | null;
                    created_at?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    logo_svg?: string | null;
                    logo_url?: string | null;
                    name?: string;
                    slug?: string;
                    specifications?: Json | null;
                    updated_at?: string | null;
                    website_url?: string | null;
                };
                Relationships: [];
            };
            cat_colours: {
                Row: {
                    created_at: string | null;
                    finish: string | null;
                    hex_primary: string | null;
                    hex_secondary: string | null;
                    id: string;
                    model_id: string;
                    name: string;
                    position: number | null;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    finish?: string | null;
                    hex_primary?: string | null;
                    hex_secondary?: string | null;
                    id?: string;
                    model_id: string;
                    name: string;
                    position?: number | null;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    finish?: string | null;
                    hex_primary?: string | null;
                    hex_secondary?: string | null;
                    id?: string;
                    model_id?: string;
                    name?: string;
                    position?: number | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'cat_colours_model_id_fkey';
                        columns: ['model_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_models';
                        referencedColumns: ['id'];
                    },
                ];
            };
            cat_hsn_codes: {
                Row: {
                    cess_rate: number | null;
                    class: string | null;
                    code: string;
                    created_at: string;
                    description: string;
                    effective_from: string;
                    effective_to: string | null;
                    gst_rate: number;
                    is_active: boolean | null;
                    type: string | null;
                    updated_at: string;
                };
                Insert: {
                    cess_rate?: number | null;
                    class?: string | null;
                    code: string;
                    created_at?: string;
                    description: string;
                    effective_from?: string;
                    effective_to?: string | null;
                    gst_rate?: number;
                    is_active?: boolean | null;
                    type?: string | null;
                    updated_at?: string;
                };
                Update: {
                    cess_rate?: number | null;
                    class?: string | null;
                    code?: string;
                    created_at?: string;
                    description?: string;
                    effective_from?: string;
                    effective_to?: string | null;
                    gst_rate?: number;
                    is_active?: boolean | null;
                    type?: string | null;
                    updated_at?: string;
                };
                Relationships: [];
            };
            cat_ins_rules: {
                Row: {
                    addons: Json;
                    created_at: string | null;
                    display_id: string | null;
                    effective_from: string | null;
                    gst_percentage: number | null;
                    id: string;
                    idv_percentage: number | null;
                    insurer_name: string;
                    od_components: Json;
                    rule_name: string;
                    state_code: string;
                    status: string | null;
                    tenure_config: Json | null;
                    tp_components: Json;
                    updated_at: string | null;
                    vehicle_type: string;
                    version: number | null;
                };
                Insert: {
                    addons?: Json;
                    created_at?: string | null;
                    display_id?: string | null;
                    effective_from?: string | null;
                    gst_percentage?: number | null;
                    id?: string;
                    idv_percentage?: number | null;
                    insurer_name: string;
                    od_components?: Json;
                    rule_name: string;
                    state_code?: string;
                    status?: string | null;
                    tenure_config?: Json | null;
                    tp_components?: Json;
                    updated_at?: string | null;
                    vehicle_type: string;
                    version?: number | null;
                };
                Update: {
                    addons?: Json;
                    created_at?: string | null;
                    display_id?: string | null;
                    effective_from?: string | null;
                    gst_percentage?: number | null;
                    id?: string;
                    idv_percentage?: number | null;
                    insurer_name?: string;
                    od_components?: Json;
                    rule_name?: string;
                    state_code?: string;
                    status?: string | null;
                    tenure_config?: Json | null;
                    tp_components?: Json;
                    updated_at?: string | null;
                    vehicle_type?: string;
                    version?: number | null;
                };
                Relationships: [];
            };
            cat_item_compatibility: {
                Row: {
                    created_at: string;
                    id: string;
                    is_universal: boolean;
                    item_id: string;
                    target_brand_id: string | null;
                    target_family_id: string | null;
                    target_variant_id: string | null;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    is_universal?: boolean;
                    item_id: string;
                    target_brand_id?: string | null;
                    target_family_id?: string | null;
                    target_variant_id?: string | null;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    is_universal?: boolean;
                    item_id?: string;
                    target_brand_id?: string | null;
                    target_family_id?: string | null;
                    target_variant_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'cat_item_compatibility_target_brand_id_fkey';
                        columns: ['target_brand_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_brands';
                        referencedColumns: ['id'];
                    },
                ];
            };
            cat_item_hierarchy_archive: {
                Row: {
                    child_id: string | null;
                    parent_id: string | null;
                };
                Insert: {
                    child_id?: string | null;
                    parent_id?: string | null;
                };
                Update: {
                    child_id?: string | null;
                    parent_id?: string | null;
                };
                Relationships: [];
            };
            cat_item_ingestion_sources: {
                Row: {
                    brand_id: string | null;
                    created_at: string | null;
                    id: string;
                    item_id: string | null;
                    sources: Json;
                    tenant_id: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    brand_id?: string | null;
                    created_at?: string | null;
                    id?: string;
                    item_id?: string | null;
                    sources: Json;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    brand_id?: string | null;
                    created_at?: string | null;
                    id?: string;
                    item_id?: string | null;
                    sources?: Json;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'cat_item_ingestion_sources_brand_id_fkey';
                        columns: ['brand_id'];
                        isOneToOne: true;
                        referencedRelation: 'cat_brands';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'cat_item_ingestion_sources_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'cat_item_ingestion_sources_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            cat_models: {
                Row: {
                    body_type: string | null;
                    brand_id: string;
                    created_at: string | null;
                    emission_standard: string | null;
                    engine_cc: number | null;
                    fuel_type: string | null;
                    hsn_code: string | null;
                    id: string;
                    item_tax_rate: number | null;
                    name: string;
                    position: number | null;
                    product_type: string;
                    segment: string | null;
                    slug: string | null;
                    status: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    body_type?: string | null;
                    brand_id: string;
                    created_at?: string | null;
                    emission_standard?: string | null;
                    engine_cc?: number | null;
                    fuel_type?: string | null;
                    hsn_code?: string | null;
                    id?: string;
                    item_tax_rate?: number | null;
                    name: string;
                    position?: number | null;
                    product_type: string;
                    segment?: string | null;
                    slug?: string | null;
                    status?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    body_type?: string | null;
                    brand_id?: string;
                    created_at?: string | null;
                    emission_standard?: string | null;
                    engine_cc?: number | null;
                    fuel_type?: string | null;
                    hsn_code?: string | null;
                    id?: string;
                    item_tax_rate?: number | null;
                    name?: string;
                    position?: number | null;
                    product_type?: string;
                    segment?: string | null;
                    slug?: string | null;
                    status?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'cat_models_brand_id_fkey';
                        columns: ['brand_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_brands';
                        referencedColumns: ['id'];
                    },
                ];
            };
            cat_price_dealer: {
                Row: {
                    auto_adjusted_at: string | null;
                    auto_adjusted_delta: number | null;
                    brand_id: string | null;
                    created_at: string | null;
                    delta_amount: number;
                    district: string | null;
                    id: string;
                    inclusion_type: string | null;
                    is_active: boolean | null;
                    label: string | null;
                    last_publish_job_id: string | null;
                    offer_amount: number | null;
                    state_code: string;
                    tenant_id: string;
                    updated_at: string | null;
                    vehicle_color_id: string | null;
                    vehicle_model_id: string | null;
                };
                Insert: {
                    auto_adjusted_at?: string | null;
                    auto_adjusted_delta?: number | null;
                    brand_id?: string | null;
                    created_at?: string | null;
                    delta_amount?: number;
                    district?: string | null;
                    id?: string;
                    inclusion_type?: string | null;
                    is_active?: boolean | null;
                    label?: string | null;
                    last_publish_job_id?: string | null;
                    offer_amount?: number | null;
                    state_code: string;
                    tenant_id: string;
                    updated_at?: string | null;
                    vehicle_color_id?: string | null;
                    vehicle_model_id?: string | null;
                };
                Update: {
                    auto_adjusted_at?: string | null;
                    auto_adjusted_delta?: number | null;
                    brand_id?: string | null;
                    created_at?: string | null;
                    delta_amount?: number;
                    district?: string | null;
                    id?: string;
                    inclusion_type?: string | null;
                    is_active?: boolean | null;
                    label?: string | null;
                    last_publish_job_id?: string | null;
                    offer_amount?: number | null;
                    state_code?: string;
                    tenant_id?: string;
                    updated_at?: string | null;
                    vehicle_color_id?: string | null;
                    vehicle_model_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'id_dealer_pricing_rules_brand_id_fkey';
                        columns: ['brand_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_brands';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'id_dealer_pricing_rules_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'id_dealer_pricing_rules_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            cat_price_state_mh: {
                Row: {
                    addon_consumables_cover_amount: number | null;
                    addon_consumables_cover_default: boolean | null;
                    addon_consumables_cover_gst_amount: number | null;
                    addon_consumables_cover_total_amount: number | null;
                    addon_engine_protector_amount: number | null;
                    addon_engine_protector_default: boolean | null;
                    addon_engine_protector_gst_amount: number | null;
                    addon_engine_protector_total_amount: number | null;
                    addon_key_protect_amount: number | null;
                    addon_key_protect_default: boolean | null;
                    addon_key_protect_gst_amount: number | null;
                    addon_key_protect_total_amount: number | null;
                    addon_personal_accident_cover_amount: number | null;
                    addon_personal_accident_cover_default: boolean | null;
                    addon_personal_accident_cover_gst_amount: number | null;
                    addon_personal_accident_cover_total_amount: number | null;
                    addon_pillion_cover_amount: number | null;
                    addon_pillion_cover_default: boolean | null;
                    addon_pillion_cover_gst_amount: number | null;
                    addon_pillion_cover_total_amount: number | null;
                    addon_return_to_invoice_amount: number | null;
                    addon_return_to_invoice_default: boolean | null;
                    addon_return_to_invoice_gst_amount: number | null;
                    addon_return_to_invoice_total_amount: number | null;
                    addon_roadside_assistance_amount: number | null;
                    addon_roadside_assistance_default: boolean | null;
                    addon_roadside_assistance_gst_amount: number | null;
                    addon_roadside_assistance_total_amount: number | null;
                    addon_tyre_protect_amount: number | null;
                    addon_tyre_protect_default: boolean | null;
                    addon_tyre_protect_gst_amount: number | null;
                    addon_tyre_protect_total_amount: number | null;
                    addon_zero_depreciation_amount: number | null;
                    addon_zero_depreciation_default: boolean | null;
                    addon_zero_depreciation_gst_amount: number | null;
                    addon_zero_depreciation_total_amount: number | null;
                    created_at: string | null;
                    ex_factory: number;
                    ex_factory_gst_amount: number;
                    ex_showroom: number;
                    gst_rate: number | null;
                    hsn_code: string | null;
                    id: string;
                    ins_gross_premium: number | null;
                    ins_gst_rate: number | null;
                    ins_hsn_code: string | null;
                    ins_liability_only_gst_amount: number | null;
                    ins_liability_only_premium_amount: number | null;
                    ins_liability_only_tenure_years: number | null;
                    ins_liability_only_total_amount: number | null;
                    ins_own_damage_gst_amount: number | null;
                    ins_own_damage_premium_amount: number | null;
                    ins_own_damage_tenure_years: number | null;
                    ins_own_damage_total_amount: number | null;
                    ins_sum_mandatory_insurance: number | null;
                    ins_sum_mandatory_insurance_gst_amount: number | null;
                    is_popular: boolean | null;
                    logistics_charges: number;
                    logistics_charges_gst_amount: number;
                    on_road_price: number | null;
                    publish_stage: string | null;
                    published_at: string | null;
                    published_by: string | null;
                    rto_default_type: string | null;
                    rto_postal_charges_bh: number | null;
                    rto_postal_charges_company: number | null;
                    rto_postal_charges_state: number | null;
                    rto_registration_fee_bh: number | null;
                    rto_registration_fee_company: number | null;
                    rto_registration_fee_state: number | null;
                    rto_roadtax_amount_bh: number | null;
                    rto_roadtax_amount_company: number | null;
                    rto_roadtax_amount_state: number | null;
                    rto_roadtax_cess_amount_bh: number | null;
                    rto_roadtax_cess_amount_company: number | null;
                    rto_roadtax_cess_amount_state: number | null;
                    rto_roadtax_cess_rate_bh: number | null;
                    rto_roadtax_cess_rate_company: number | null;
                    rto_roadtax_cess_rate_state: number | null;
                    rto_roadtax_rate_bh: number | null;
                    rto_roadtax_rate_company: number | null;
                    rto_roadtax_rate_state: number | null;
                    rto_smartcard_charges_bh: number | null;
                    rto_smartcard_charges_company: number | null;
                    rto_smartcard_charges_state: number | null;
                    rto_total_bh: number | null;
                    rto_total_company: number | null;
                    rto_total_state: number | null;
                    sku_id: string;
                    state_code: string;
                    updated_at: string | null;
                };
                Insert: {
                    addon_consumables_cover_amount?: number | null;
                    addon_consumables_cover_default?: boolean | null;
                    addon_consumables_cover_gst_amount?: number | null;
                    addon_consumables_cover_total_amount?: number | null;
                    addon_engine_protector_amount?: number | null;
                    addon_engine_protector_default?: boolean | null;
                    addon_engine_protector_gst_amount?: number | null;
                    addon_engine_protector_total_amount?: number | null;
                    addon_key_protect_amount?: number | null;
                    addon_key_protect_default?: boolean | null;
                    addon_key_protect_gst_amount?: number | null;
                    addon_key_protect_total_amount?: number | null;
                    addon_personal_accident_cover_amount?: number | null;
                    addon_personal_accident_cover_default?: boolean | null;
                    addon_personal_accident_cover_gst_amount?: number | null;
                    addon_personal_accident_cover_total_amount?: number | null;
                    addon_pillion_cover_amount?: number | null;
                    addon_pillion_cover_default?: boolean | null;
                    addon_pillion_cover_gst_amount?: number | null;
                    addon_pillion_cover_total_amount?: number | null;
                    addon_return_to_invoice_amount?: number | null;
                    addon_return_to_invoice_default?: boolean | null;
                    addon_return_to_invoice_gst_amount?: number | null;
                    addon_return_to_invoice_total_amount?: number | null;
                    addon_roadside_assistance_amount?: number | null;
                    addon_roadside_assistance_default?: boolean | null;
                    addon_roadside_assistance_gst_amount?: number | null;
                    addon_roadside_assistance_total_amount?: number | null;
                    addon_tyre_protect_amount?: number | null;
                    addon_tyre_protect_default?: boolean | null;
                    addon_tyre_protect_gst_amount?: number | null;
                    addon_tyre_protect_total_amount?: number | null;
                    addon_zero_depreciation_amount?: number | null;
                    addon_zero_depreciation_default?: boolean | null;
                    addon_zero_depreciation_gst_amount?: number | null;
                    addon_zero_depreciation_total_amount?: number | null;
                    created_at?: string | null;
                    ex_factory: number;
                    ex_factory_gst_amount: number;
                    ex_showroom: number;
                    gst_rate?: number | null;
                    hsn_code?: string | null;
                    id: string;
                    ins_gross_premium?: number | null;
                    ins_gst_rate?: number | null;
                    ins_hsn_code?: string | null;
                    ins_liability_only_gst_amount?: number | null;
                    ins_liability_only_premium_amount?: number | null;
                    ins_liability_only_tenure_years?: number | null;
                    ins_liability_only_total_amount?: number | null;
                    ins_own_damage_gst_amount?: number | null;
                    ins_own_damage_premium_amount?: number | null;
                    ins_own_damage_tenure_years?: number | null;
                    ins_own_damage_total_amount?: number | null;
                    ins_sum_mandatory_insurance?: number | null;
                    ins_sum_mandatory_insurance_gst_amount?: number | null;
                    is_popular?: boolean | null;
                    logistics_charges?: number;
                    logistics_charges_gst_amount?: number;
                    on_road_price?: number | null;
                    publish_stage?: string | null;
                    published_at?: string | null;
                    published_by?: string | null;
                    rto_default_type?: string | null;
                    rto_postal_charges_bh?: number | null;
                    rto_postal_charges_company?: number | null;
                    rto_postal_charges_state?: number | null;
                    rto_registration_fee_bh?: number | null;
                    rto_registration_fee_company?: number | null;
                    rto_registration_fee_state?: number | null;
                    rto_roadtax_amount_bh?: number | null;
                    rto_roadtax_amount_company?: number | null;
                    rto_roadtax_amount_state?: number | null;
                    rto_roadtax_cess_amount_bh?: number | null;
                    rto_roadtax_cess_amount_company?: number | null;
                    rto_roadtax_cess_amount_state?: number | null;
                    rto_roadtax_cess_rate_bh?: number | null;
                    rto_roadtax_cess_rate_company?: number | null;
                    rto_roadtax_cess_rate_state?: number | null;
                    rto_roadtax_rate_bh?: number | null;
                    rto_roadtax_rate_company?: number | null;
                    rto_roadtax_rate_state?: number | null;
                    rto_smartcard_charges_bh?: number | null;
                    rto_smartcard_charges_company?: number | null;
                    rto_smartcard_charges_state?: number | null;
                    rto_total_bh?: number | null;
                    rto_total_company?: number | null;
                    rto_total_state?: number | null;
                    sku_id: string;
                    state_code: string;
                    updated_at?: string | null;
                };
                Update: {
                    addon_consumables_cover_amount?: number | null;
                    addon_consumables_cover_default?: boolean | null;
                    addon_consumables_cover_gst_amount?: number | null;
                    addon_consumables_cover_total_amount?: number | null;
                    addon_engine_protector_amount?: number | null;
                    addon_engine_protector_default?: boolean | null;
                    addon_engine_protector_gst_amount?: number | null;
                    addon_engine_protector_total_amount?: number | null;
                    addon_key_protect_amount?: number | null;
                    addon_key_protect_default?: boolean | null;
                    addon_key_protect_gst_amount?: number | null;
                    addon_key_protect_total_amount?: number | null;
                    addon_personal_accident_cover_amount?: number | null;
                    addon_personal_accident_cover_default?: boolean | null;
                    addon_personal_accident_cover_gst_amount?: number | null;
                    addon_personal_accident_cover_total_amount?: number | null;
                    addon_pillion_cover_amount?: number | null;
                    addon_pillion_cover_default?: boolean | null;
                    addon_pillion_cover_gst_amount?: number | null;
                    addon_pillion_cover_total_amount?: number | null;
                    addon_return_to_invoice_amount?: number | null;
                    addon_return_to_invoice_default?: boolean | null;
                    addon_return_to_invoice_gst_amount?: number | null;
                    addon_return_to_invoice_total_amount?: number | null;
                    addon_roadside_assistance_amount?: number | null;
                    addon_roadside_assistance_default?: boolean | null;
                    addon_roadside_assistance_gst_amount?: number | null;
                    addon_roadside_assistance_total_amount?: number | null;
                    addon_tyre_protect_amount?: number | null;
                    addon_tyre_protect_default?: boolean | null;
                    addon_tyre_protect_gst_amount?: number | null;
                    addon_tyre_protect_total_amount?: number | null;
                    addon_zero_depreciation_amount?: number | null;
                    addon_zero_depreciation_default?: boolean | null;
                    addon_zero_depreciation_gst_amount?: number | null;
                    addon_zero_depreciation_total_amount?: number | null;
                    created_at?: string | null;
                    ex_factory?: number;
                    ex_factory_gst_amount?: number;
                    ex_showroom?: number;
                    gst_rate?: number | null;
                    hsn_code?: string | null;
                    id?: string;
                    ins_gross_premium?: number | null;
                    ins_gst_rate?: number | null;
                    ins_hsn_code?: string | null;
                    ins_liability_only_gst_amount?: number | null;
                    ins_liability_only_premium_amount?: number | null;
                    ins_liability_only_tenure_years?: number | null;
                    ins_liability_only_total_amount?: number | null;
                    ins_own_damage_gst_amount?: number | null;
                    ins_own_damage_premium_amount?: number | null;
                    ins_own_damage_tenure_years?: number | null;
                    ins_own_damage_total_amount?: number | null;
                    ins_sum_mandatory_insurance?: number | null;
                    ins_sum_mandatory_insurance_gst_amount?: number | null;
                    is_popular?: boolean | null;
                    logistics_charges?: number;
                    logistics_charges_gst_amount?: number;
                    on_road_price?: number | null;
                    publish_stage?: string | null;
                    published_at?: string | null;
                    published_by?: string | null;
                    rto_default_type?: string | null;
                    rto_postal_charges_bh?: number | null;
                    rto_postal_charges_company?: number | null;
                    rto_postal_charges_state?: number | null;
                    rto_registration_fee_bh?: number | null;
                    rto_registration_fee_company?: number | null;
                    rto_registration_fee_state?: number | null;
                    rto_roadtax_amount_bh?: number | null;
                    rto_roadtax_amount_company?: number | null;
                    rto_roadtax_amount_state?: number | null;
                    rto_roadtax_cess_amount_bh?: number | null;
                    rto_roadtax_cess_amount_company?: number | null;
                    rto_roadtax_cess_amount_state?: number | null;
                    rto_roadtax_cess_rate_bh?: number | null;
                    rto_roadtax_cess_rate_company?: number | null;
                    rto_roadtax_cess_rate_state?: number | null;
                    rto_roadtax_rate_bh?: number | null;
                    rto_roadtax_rate_company?: number | null;
                    rto_roadtax_rate_state?: number | null;
                    rto_smartcard_charges_bh?: number | null;
                    rto_smartcard_charges_company?: number | null;
                    rto_smartcard_charges_state?: number | null;
                    rto_total_bh?: number | null;
                    rto_total_company?: number | null;
                    rto_total_state?: number | null;
                    sku_id?: string;
                    state_code?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'cat_price_state_mh_sku_id_fkey';
                        columns: ['sku_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_skus';
                        referencedColumns: ['id'];
                    },
                ];
            };
            cat_raw_items: {
                Row: {
                    category: Database['public']['Enums']['vehicle_category'] | null;
                    color: string;
                    created_at: string | null;
                    engine_power: number | null;
                    fuel_type: Database['public']['Enums']['fuel_type'] | null;
                    id: string;
                    image_url: string | null;
                    is_active: boolean | null;
                    make: string;
                    model: string;
                    power_unit: Database['public']['Enums']['power_unit'] | null;
                    price: number | null;
                    segment: string | null;
                    specs: Json | null;
                    type: string;
                    updated_at: string | null;
                    variant: string;
                };
                Insert: {
                    category?: Database['public']['Enums']['vehicle_category'] | null;
                    color: string;
                    created_at?: string | null;
                    engine_power?: number | null;
                    fuel_type?: Database['public']['Enums']['fuel_type'] | null;
                    id?: string;
                    image_url?: string | null;
                    is_active?: boolean | null;
                    make: string;
                    model: string;
                    power_unit?: Database['public']['Enums']['power_unit'] | null;
                    price?: number | null;
                    segment?: string | null;
                    specs?: Json | null;
                    type: string;
                    updated_at?: string | null;
                    variant: string;
                };
                Update: {
                    category?: Database['public']['Enums']['vehicle_category'] | null;
                    color?: string;
                    created_at?: string | null;
                    engine_power?: number | null;
                    fuel_type?: Database['public']['Enums']['fuel_type'] | null;
                    id?: string;
                    image_url?: string | null;
                    is_active?: boolean | null;
                    make?: string;
                    model?: string;
                    power_unit?: Database['public']['Enums']['power_unit'] | null;
                    price?: number | null;
                    segment?: string | null;
                    specs?: Json | null;
                    type?: string;
                    updated_at?: string | null;
                    variant?: string;
                };
                Relationships: [];
            };
            cat_recommendations: {
                Row: {
                    created_at: string | null;
                    id: string;
                    position: number | null;
                    recommended_variant_id: string | null;
                    source_variant_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    position?: number | null;
                    recommended_variant_id?: string | null;
                    source_variant_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    position?: number | null;
                    recommended_variant_id?: string | null;
                    source_variant_id?: string | null;
                };
                Relationships: [];
            };
            cat_reg_rules: {
                Row: {
                    bh_tenure: number | null;
                    company_multiplier: number | null;
                    components: Json;
                    created_at: string | null;
                    display_id: string | null;
                    id: string;
                    registration_type: string | null;
                    rule_name: string;
                    state_code: string;
                    state_tenure: number | null;
                    status: string | null;
                    updated_at: string | null;
                    vehicle_type: string;
                    version: number | null;
                };
                Insert: {
                    bh_tenure?: number | null;
                    company_multiplier?: number | null;
                    components?: Json;
                    created_at?: string | null;
                    display_id?: string | null;
                    id?: string;
                    registration_type?: string | null;
                    rule_name: string;
                    state_code: string;
                    state_tenure?: number | null;
                    status?: string | null;
                    updated_at?: string | null;
                    vehicle_type: string;
                    version?: number | null;
                };
                Update: {
                    bh_tenure?: number | null;
                    company_multiplier?: number | null;
                    components?: Json;
                    created_at?: string | null;
                    display_id?: string | null;
                    id?: string;
                    registration_type?: string | null;
                    rule_name?: string;
                    state_code?: string;
                    state_tenure?: number | null;
                    status?: string | null;
                    updated_at?: string | null;
                    vehicle_type?: string;
                    version?: number | null;
                };
                Relationships: [];
            };
            cat_regional_configs: {
                Row: {
                    brand_id: string | null;
                    created_at: string | null;
                    delta_percentage: number | null;
                    fixed_delta: number | null;
                    id: string;
                    is_active: boolean | null;
                    state_code: string;
                    updated_at: string | null;
                };
                Insert: {
                    brand_id?: string | null;
                    created_at?: string | null;
                    delta_percentage?: number | null;
                    fixed_delta?: number | null;
                    id?: string;
                    is_active?: boolean | null;
                    state_code: string;
                    updated_at?: string | null;
                };
                Update: {
                    brand_id?: string | null;
                    created_at?: string | null;
                    delta_percentage?: number | null;
                    fixed_delta?: number | null;
                    id?: string;
                    is_active?: boolean | null;
                    state_code?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'brand_regional_configs_brand_id_fkey';
                        columns: ['brand_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_brands';
                        referencedColumns: ['id'];
                    },
                ];
            };
            cat_services: {
                Row: {
                    created_at: string | null;
                    description: string | null;
                    discount_price: number | null;
                    duration_months: number | null;
                    id: string;
                    is_mandatory: boolean | null;
                    max_qty: number | null;
                    name: string;
                    price: number;
                    status: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    description?: string | null;
                    discount_price?: number | null;
                    duration_months?: number | null;
                    id: string;
                    is_mandatory?: boolean | null;
                    max_qty?: number | null;
                    name: string;
                    price?: number;
                    status?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    description?: string | null;
                    discount_price?: number | null;
                    duration_months?: number | null;
                    id?: string;
                    is_mandatory?: boolean | null;
                    max_qty?: number | null;
                    name?: string;
                    price?: number;
                    status?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
            cat_skus: {
                Row: {
                    accessory_variant_id: string | null;
                    brand_id: string;
                    color_name: string | null;
                    colour_id: string | null;
                    created_at: string | null;
                    finish: string | null;
                    gallery_img_1: string | null;
                    gallery_img_2: string | null;
                    gallery_img_3: string | null;
                    gallery_img_4: string | null;
                    gallery_img_5: string | null;
                    gallery_img_6: string | null;
                    has_360: boolean | null;
                    hex_primary: string | null;
                    hex_secondary: string | null;
                    id: string;
                    is_flipped: boolean | null;
                    is_primary: boolean | null;
                    media_shared: boolean | null;
                    model_id: string;
                    name: string;
                    offset_x: number | null;
                    offset_y: number | null;
                    pdf_url_1: string | null;
                    position: number | null;
                    price_base: number | null;
                    primary_image: string | null;
                    service_variant_id: string | null;
                    sku_code: string | null;
                    sku_type: string;
                    slug: string | null;
                    status: string | null;
                    updated_at: string | null;
                    vehicle_variant_id: string | null;
                    video_url_1: string | null;
                    video_url_2: string | null;
                    zoom_factor: number | null;
                };
                Insert: {
                    accessory_variant_id?: string | null;
                    brand_id: string;
                    color_name?: string | null;
                    colour_id?: string | null;
                    created_at?: string | null;
                    finish?: string | null;
                    gallery_img_1?: string | null;
                    gallery_img_2?: string | null;
                    gallery_img_3?: string | null;
                    gallery_img_4?: string | null;
                    gallery_img_5?: string | null;
                    gallery_img_6?: string | null;
                    has_360?: boolean | null;
                    hex_primary?: string | null;
                    hex_secondary?: string | null;
                    id?: string;
                    is_flipped?: boolean | null;
                    is_primary?: boolean | null;
                    media_shared?: boolean | null;
                    model_id: string;
                    name: string;
                    offset_x?: number | null;
                    offset_y?: number | null;
                    pdf_url_1?: string | null;
                    position?: number | null;
                    price_base?: number | null;
                    primary_image?: string | null;
                    service_variant_id?: string | null;
                    sku_code?: string | null;
                    sku_type: string;
                    slug?: string | null;
                    status?: string | null;
                    updated_at?: string | null;
                    vehicle_variant_id?: string | null;
                    video_url_1?: string | null;
                    video_url_2?: string | null;
                    zoom_factor?: number | null;
                };
                Update: {
                    accessory_variant_id?: string | null;
                    brand_id?: string;
                    color_name?: string | null;
                    colour_id?: string | null;
                    created_at?: string | null;
                    finish?: string | null;
                    gallery_img_1?: string | null;
                    gallery_img_2?: string | null;
                    gallery_img_3?: string | null;
                    gallery_img_4?: string | null;
                    gallery_img_5?: string | null;
                    gallery_img_6?: string | null;
                    has_360?: boolean | null;
                    hex_primary?: string | null;
                    hex_secondary?: string | null;
                    id?: string;
                    is_flipped?: boolean | null;
                    is_primary?: boolean | null;
                    media_shared?: boolean | null;
                    model_id?: string;
                    name?: string;
                    offset_x?: number | null;
                    offset_y?: number | null;
                    pdf_url_1?: string | null;
                    position?: number | null;
                    price_base?: number | null;
                    primary_image?: string | null;
                    service_variant_id?: string | null;
                    sku_code?: string | null;
                    sku_type?: string;
                    slug?: string | null;
                    status?: string | null;
                    updated_at?: string | null;
                    vehicle_variant_id?: string | null;
                    video_url_1?: string | null;
                    video_url_2?: string | null;
                    zoom_factor?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'cat_skus_accessory_variant_id_fkey';
                        columns: ['accessory_variant_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_variants_accessory';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'cat_skus_brand_id_fkey';
                        columns: ['brand_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_brands';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'cat_skus_colour_id_fkey';
                        columns: ['colour_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_colours';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'cat_skus_model_id_fkey';
                        columns: ['model_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_models';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'cat_skus_service_variant_id_fkey';
                        columns: ['service_variant_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_variants_service';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'cat_skus_vehicle_variant_id_fkey';
                        columns: ['vehicle_variant_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_variants_vehicle';
                        referencedColumns: ['id'];
                    },
                ];
            };
            cat_specifications: {
                Row: {
                    allowed_values: string[] | null;
                    category: string | null;
                    created_at: string | null;
                    data_type: string;
                    description: string | null;
                    display_label: string;
                    example_value: string | null;
                    id: string;
                    is_active: boolean | null;
                    is_comparable: boolean | null;
                    is_filterable: boolean | null;
                    is_highlighted: boolean | null;
                    is_required: boolean | null;
                    max_value: number | null;
                    min_value: number | null;
                    position: number | null;
                    product_types: string[];
                    spec_key: string;
                    spec_level: string;
                    suffix: string | null;
                    unit: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    allowed_values?: string[] | null;
                    category?: string | null;
                    created_at?: string | null;
                    data_type: string;
                    description?: string | null;
                    display_label: string;
                    example_value?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    is_comparable?: boolean | null;
                    is_filterable?: boolean | null;
                    is_highlighted?: boolean | null;
                    is_required?: boolean | null;
                    max_value?: number | null;
                    min_value?: number | null;
                    position?: number | null;
                    product_types?: string[];
                    spec_key: string;
                    spec_level: string;
                    suffix?: string | null;
                    unit?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    allowed_values?: string[] | null;
                    category?: string | null;
                    created_at?: string | null;
                    data_type?: string;
                    description?: string | null;
                    display_label?: string;
                    example_value?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    is_comparable?: boolean | null;
                    is_filterable?: boolean | null;
                    is_highlighted?: boolean | null;
                    is_required?: boolean | null;
                    max_value?: number | null;
                    min_value?: number | null;
                    position?: number | null;
                    product_types?: string[];
                    spec_key?: string;
                    spec_level?: string;
                    suffix?: string | null;
                    unit?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
            cat_suitable_for: {
                Row: {
                    created_at: string | null;
                    id: string;
                    sku_id: string;
                    target_brand_id: string | null;
                    target_model_id: string | null;
                    target_variant_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    sku_id: string;
                    target_brand_id?: string | null;
                    target_model_id?: string | null;
                    target_variant_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    sku_id?: string;
                    target_brand_id?: string | null;
                    target_model_id?: string | null;
                    target_variant_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'cat_suitable_for_sku_id_fkey';
                        columns: ['sku_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_skus';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'cat_suitable_for_target_brand_id_fkey';
                        columns: ['target_brand_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_brands';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'cat_suitable_for_target_model_id_fkey';
                        columns: ['target_model_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_models';
                        referencedColumns: ['id'];
                    },
                ];
            };
            cat_variants_accessory: {
                Row: {
                    created_at: string | null;
                    finish: string | null;
                    id: string;
                    material: string | null;
                    model_id: string;
                    name: string;
                    position: number | null;
                    slug: string | null;
                    status: string | null;
                    updated_at: string | null;
                    weight: number | null;
                };
                Insert: {
                    created_at?: string | null;
                    finish?: string | null;
                    id?: string;
                    material?: string | null;
                    model_id: string;
                    name: string;
                    position?: number | null;
                    slug?: string | null;
                    status?: string | null;
                    updated_at?: string | null;
                    weight?: number | null;
                };
                Update: {
                    created_at?: string | null;
                    finish?: string | null;
                    id?: string;
                    material?: string | null;
                    model_id?: string;
                    name?: string;
                    position?: number | null;
                    slug?: string | null;
                    status?: string | null;
                    updated_at?: string | null;
                    weight?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'cat_variants_accessory_model_id_fkey';
                        columns: ['model_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_models';
                        referencedColumns: ['id'];
                    },
                ];
            };
            cat_variants_service: {
                Row: {
                    coverage_type: string | null;
                    created_at: string | null;
                    duration_months: number | null;
                    id: string;
                    labor_included: boolean | null;
                    model_id: string;
                    name: string;
                    position: number | null;
                    slug: string | null;
                    status: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    coverage_type?: string | null;
                    created_at?: string | null;
                    duration_months?: number | null;
                    id?: string;
                    labor_included?: boolean | null;
                    model_id: string;
                    name: string;
                    position?: number | null;
                    slug?: string | null;
                    status?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    coverage_type?: string | null;
                    created_at?: string | null;
                    duration_months?: number | null;
                    id?: string;
                    labor_included?: boolean | null;
                    model_id?: string;
                    name?: string;
                    position?: number | null;
                    slug?: string | null;
                    status?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'cat_variants_service_model_id_fkey';
                        columns: ['model_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_models';
                        referencedColumns: ['id'];
                    },
                ];
            };
            cat_variants_vehicle: {
                Row: {
                    air_filter: string | null;
                    battery_capacity: string | null;
                    battery_type: string | null;
                    bluetooth: boolean | null;
                    bore_stroke: string | null;
                    braking_system: string | null;
                    charging_time: string | null;
                    chassis_type: string | null;
                    clock: boolean | null;
                    clutch: string | null;
                    compression_ratio: string | null;
                    console_type: string | null;
                    cooling_system: string | null;
                    created_at: string | null;
                    cylinders: number | null;
                    displacement: number | null;
                    engine_type: string | null;
                    front_brake: string | null;
                    front_suspension: string | null;
                    front_tyre: string | null;
                    front_wheel_size: string | null;
                    fuel_capacity: number | null;
                    ground_clearance: number | null;
                    headlamp_type: string | null;
                    id: string;
                    kerb_weight: number | null;
                    killswitch: boolean | null;
                    led_headlamp: boolean | null;
                    led_tail_lamp: boolean | null;
                    low_battery_indicator: boolean | null;
                    low_fuel_indicator: boolean | null;
                    low_oil_indicator: boolean | null;
                    max_power: string | null;
                    max_torque: string | null;
                    mileage_arai: number | null;
                    model_id: string;
                    motor_power: string | null;
                    name: string;
                    navigation: boolean | null;
                    num_valves: number | null;
                    overall_height: number | null;
                    overall_length: number | null;
                    overall_width: number | null;
                    pass_light: boolean | null;
                    pillion_footrest: boolean | null;
                    pillion_seat: boolean | null;
                    position: number | null;
                    range_km: number | null;
                    rear_brake: string | null;
                    rear_suspension: string | null;
                    rear_tyre: string | null;
                    rear_wheel_size: string | null;
                    ride_modes: string | null;
                    seat_height: number | null;
                    service_interval: string | null;
                    slug: string | null;
                    speedometer: string | null;
                    stand_alarm: boolean | null;
                    start_type: string | null;
                    status: string | null;
                    top_speed: number | null;
                    transmission: string | null;
                    tripmeter: string | null;
                    tyre_type: string | null;
                    updated_at: string | null;
                    usb_charging: boolean | null;
                    warranty_km: number | null;
                    warranty_years: number | null;
                    wheel_type: string | null;
                    wheelbase: number | null;
                };
                Insert: {
                    air_filter?: string | null;
                    battery_capacity?: string | null;
                    battery_type?: string | null;
                    bluetooth?: boolean | null;
                    bore_stroke?: string | null;
                    braking_system?: string | null;
                    charging_time?: string | null;
                    chassis_type?: string | null;
                    clock?: boolean | null;
                    clutch?: string | null;
                    compression_ratio?: string | null;
                    console_type?: string | null;
                    cooling_system?: string | null;
                    created_at?: string | null;
                    cylinders?: number | null;
                    displacement?: number | null;
                    engine_type?: string | null;
                    front_brake?: string | null;
                    front_suspension?: string | null;
                    front_tyre?: string | null;
                    front_wheel_size?: string | null;
                    fuel_capacity?: number | null;
                    ground_clearance?: number | null;
                    headlamp_type?: string | null;
                    id?: string;
                    kerb_weight?: number | null;
                    killswitch?: boolean | null;
                    led_headlamp?: boolean | null;
                    led_tail_lamp?: boolean | null;
                    low_battery_indicator?: boolean | null;
                    low_fuel_indicator?: boolean | null;
                    low_oil_indicator?: boolean | null;
                    max_power?: string | null;
                    max_torque?: string | null;
                    mileage_arai?: number | null;
                    model_id: string;
                    motor_power?: string | null;
                    name: string;
                    navigation?: boolean | null;
                    num_valves?: number | null;
                    overall_height?: number | null;
                    overall_length?: number | null;
                    overall_width?: number | null;
                    pass_light?: boolean | null;
                    pillion_footrest?: boolean | null;
                    pillion_seat?: boolean | null;
                    position?: number | null;
                    range_km?: number | null;
                    rear_brake?: string | null;
                    rear_suspension?: string | null;
                    rear_tyre?: string | null;
                    rear_wheel_size?: string | null;
                    ride_modes?: string | null;
                    seat_height?: number | null;
                    service_interval?: string | null;
                    slug?: string | null;
                    speedometer?: string | null;
                    stand_alarm?: boolean | null;
                    start_type?: string | null;
                    status?: string | null;
                    top_speed?: number | null;
                    transmission?: string | null;
                    tripmeter?: string | null;
                    tyre_type?: string | null;
                    updated_at?: string | null;
                    usb_charging?: boolean | null;
                    warranty_km?: number | null;
                    warranty_years?: number | null;
                    wheel_type?: string | null;
                    wheelbase?: number | null;
                };
                Update: {
                    air_filter?: string | null;
                    battery_capacity?: string | null;
                    battery_type?: string | null;
                    bluetooth?: boolean | null;
                    bore_stroke?: string | null;
                    braking_system?: string | null;
                    charging_time?: string | null;
                    chassis_type?: string | null;
                    clock?: boolean | null;
                    clutch?: string | null;
                    compression_ratio?: string | null;
                    console_type?: string | null;
                    cooling_system?: string | null;
                    created_at?: string | null;
                    cylinders?: number | null;
                    displacement?: number | null;
                    engine_type?: string | null;
                    front_brake?: string | null;
                    front_suspension?: string | null;
                    front_tyre?: string | null;
                    front_wheel_size?: string | null;
                    fuel_capacity?: number | null;
                    ground_clearance?: number | null;
                    headlamp_type?: string | null;
                    id?: string;
                    kerb_weight?: number | null;
                    killswitch?: boolean | null;
                    led_headlamp?: boolean | null;
                    led_tail_lamp?: boolean | null;
                    low_battery_indicator?: boolean | null;
                    low_fuel_indicator?: boolean | null;
                    low_oil_indicator?: boolean | null;
                    max_power?: string | null;
                    max_torque?: string | null;
                    mileage_arai?: number | null;
                    model_id?: string;
                    motor_power?: string | null;
                    name?: string;
                    navigation?: boolean | null;
                    num_valves?: number | null;
                    overall_height?: number | null;
                    overall_length?: number | null;
                    overall_width?: number | null;
                    pass_light?: boolean | null;
                    pillion_footrest?: boolean | null;
                    pillion_seat?: boolean | null;
                    position?: number | null;
                    range_km?: number | null;
                    rear_brake?: string | null;
                    rear_suspension?: string | null;
                    rear_tyre?: string | null;
                    rear_wheel_size?: string | null;
                    ride_modes?: string | null;
                    seat_height?: number | null;
                    service_interval?: string | null;
                    slug?: string | null;
                    speedometer?: string | null;
                    stand_alarm?: boolean | null;
                    start_type?: string | null;
                    status?: string | null;
                    top_speed?: number | null;
                    transmission?: string | null;
                    tripmeter?: string | null;
                    tyre_type?: string | null;
                    updated_at?: string | null;
                    usb_charging?: boolean | null;
                    warranty_km?: number | null;
                    warranty_years?: number | null;
                    wheel_type?: string | null;
                    wheelbase?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'cat_variants_vehicle_model_id_fkey';
                        columns: ['model_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_models';
                        referencedColumns: ['id'];
                    },
                ];
            };
            catalog_audit_log: {
                Row: {
                    action: string;
                    actor_id: string | null;
                    actor_label: string | null;
                    changed_fields: string[] | null;
                    created_at: string;
                    id: string;
                    new_data: Json | null;
                    old_data: Json | null;
                    record_id: string;
                    table_name: string;
                };
                Insert: {
                    action: string;
                    actor_id?: string | null;
                    actor_label?: string | null;
                    changed_fields?: string[] | null;
                    created_at?: string;
                    id?: string;
                    new_data?: Json | null;
                    old_data?: Json | null;
                    record_id: string;
                    table_name: string;
                };
                Update: {
                    action?: string;
                    actor_id?: string | null;
                    actor_label?: string | null;
                    changed_fields?: string[] | null;
                    created_at?: string;
                    id?: string;
                    new_data?: Json | null;
                    old_data?: Json | null;
                    record_id?: string;
                    table_name?: string;
                };
                Relationships: [];
            };
            crm_allotments: {
                Row: {
                    allotted_at: string | null;
                    booking_id: string | null;
                    chassis_number: string | null;
                    created_at: string | null;
                    engine_number: string | null;
                    id: string;
                    inv_stock_id: string | null;
                    status: string | null;
                    tenant_id: string | null;
                    updated_at: string | null;
                    vin_number: string | null;
                };
                Insert: {
                    allotted_at?: string | null;
                    booking_id?: string | null;
                    chassis_number?: string | null;
                    created_at?: string | null;
                    engine_number?: string | null;
                    id?: string;
                    inv_stock_id?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                    vin_number?: string | null;
                };
                Update: {
                    allotted_at?: string | null;
                    booking_id?: string | null;
                    chassis_number?: string | null;
                    created_at?: string | null;
                    engine_number?: string | null;
                    id?: string;
                    inv_stock_id?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                    vin_number?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'crm_allotments_booking_id_fkey';
                        columns: ['booking_id'];
                        isOneToOne: true;
                        referencedRelation: 'crm_bookings';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_allotments_inv_stock_id_fkey';
                        columns: ['inv_stock_id'];
                        isOneToOne: false;
                        referencedRelation: 'inv_stock';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_allotments_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_allotments_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_booking_stage_events: {
                Row: {
                    booking_id: string;
                    changed_at: string;
                    changed_by: string | null;
                    from_stage: string;
                    id: string;
                    reason: string | null;
                    to_stage: string;
                };
                Insert: {
                    booking_id: string;
                    changed_at?: string;
                    changed_by?: string | null;
                    from_stage: string;
                    id?: string;
                    reason?: string | null;
                    to_stage: string;
                };
                Update: {
                    booking_id?: string;
                    changed_at?: string;
                    changed_by?: string | null;
                    from_stage?: string;
                    id?: string;
                    reason?: string | null;
                    to_stage?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'crm_booking_stage_events_booking_id_fkey';
                        columns: ['booking_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_bookings';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_bookings: {
                Row: {
                    allotment_status: Database['public']['Enums']['allotment_status'] | null;
                    base_price: number | null;
                    booking_amount_received: number | null;
                    cancellation_reason: string | null;
                    color_id: string | null;
                    created_at: string | null;
                    customer_details: Json | null;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    delivery_branch_id: string | null;
                    delivery_date: string | null;
                    display_id: string | null;
                    firebase_id: string | null;
                    grand_total: number | null;
                    id: string;
                    insurance_policy_number: string | null;
                    insurance_provider: string | null;
                    inv_stock_id: string | null;
                    is_deleted: boolean | null;
                    lead_id: string | null;
                    operational_stage: Database['public']['Enums']['crm_operational_stage'] | null;
                    qty: number;
                    quote_id: string | null;
                    refund_status: string | null;
                    registration_number: string | null;
                    rto_receipt_number: string | null;
                    sales_order_snapshot: Json | null;
                    sku_id: string | null;
                    snap_brand: string | null;
                    snap_color: string | null;
                    snap_image_url: string | null;
                    snap_model: string | null;
                    snap_variant: string | null;
                    stage_updated_at: string | null;
                    stage_updated_by: string | null;
                    status: string | null;
                    tenant_id: string | null;
                    updated_at: string | null;
                    user_id: string | null;
                    variant_id: string | null;
                    vehicle_details: Json | null;
                    vin_number: string | null;
                    zoho_order_id: string | null;
                };
                Insert: {
                    allotment_status?: Database['public']['Enums']['allotment_status'] | null;
                    base_price?: number | null;
                    booking_amount_received?: number | null;
                    cancellation_reason?: string | null;
                    color_id?: string | null;
                    created_at?: string | null;
                    customer_details?: Json | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    delivery_branch_id?: string | null;
                    delivery_date?: string | null;
                    display_id?: string | null;
                    firebase_id?: string | null;
                    grand_total?: number | null;
                    id?: string;
                    insurance_policy_number?: string | null;
                    insurance_provider?: string | null;
                    inv_stock_id?: string | null;
                    is_deleted?: boolean | null;
                    lead_id?: string | null;
                    operational_stage?: Database['public']['Enums']['crm_operational_stage'] | null;
                    qty?: number;
                    quote_id?: string | null;
                    refund_status?: string | null;
                    registration_number?: string | null;
                    rto_receipt_number?: string | null;
                    sales_order_snapshot?: Json | null;
                    sku_id?: string | null;
                    snap_brand?: string | null;
                    snap_color?: string | null;
                    snap_image_url?: string | null;
                    snap_model?: string | null;
                    snap_variant?: string | null;
                    stage_updated_at?: string | null;
                    stage_updated_by?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                    user_id?: string | null;
                    variant_id?: string | null;
                    vehicle_details?: Json | null;
                    vin_number?: string | null;
                    zoho_order_id?: string | null;
                };
                Update: {
                    allotment_status?: Database['public']['Enums']['allotment_status'] | null;
                    base_price?: number | null;
                    booking_amount_received?: number | null;
                    cancellation_reason?: string | null;
                    color_id?: string | null;
                    created_at?: string | null;
                    customer_details?: Json | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    delivery_branch_id?: string | null;
                    delivery_date?: string | null;
                    display_id?: string | null;
                    firebase_id?: string | null;
                    grand_total?: number | null;
                    id?: string;
                    insurance_policy_number?: string | null;
                    insurance_provider?: string | null;
                    inv_stock_id?: string | null;
                    is_deleted?: boolean | null;
                    lead_id?: string | null;
                    operational_stage?: Database['public']['Enums']['crm_operational_stage'] | null;
                    qty?: number;
                    quote_id?: string | null;
                    refund_status?: string | null;
                    registration_number?: string | null;
                    rto_receipt_number?: string | null;
                    sales_order_snapshot?: Json | null;
                    sku_id?: string | null;
                    snap_brand?: string | null;
                    snap_color?: string | null;
                    snap_image_url?: string | null;
                    snap_model?: string | null;
                    snap_variant?: string | null;
                    stage_updated_at?: string | null;
                    stage_updated_by?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                    user_id?: string | null;
                    variant_id?: string | null;
                    vehicle_details?: Json | null;
                    vin_number?: string | null;
                    zoho_order_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'bookings_quote_id_fkey';
                        columns: ['quote_id'];
                        isOneToOne: true;
                        referencedRelation: 'crm_quotes';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_bookings_inv_stock_id_fkey';
                        columns: ['inv_stock_id'];
                        isOneToOne: false;
                        referencedRelation: 'inv_stock';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_bookings_lead_id_fkey';
                        columns: ['lead_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_leads';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_bookings_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'fk_bookings_quote_protect';
                        columns: ['quote_id'];
                        isOneToOne: true;
                        referencedRelation: 'crm_quotes';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_dealer_shares: {
                Row: {
                    dealer_tenant_id: string | null;
                    id: string;
                    is_primary: boolean | null;
                    lead_id: string | null;
                    shared_at: string | null;
                    shared_by: string | null;
                };
                Insert: {
                    dealer_tenant_id?: string | null;
                    id?: string;
                    is_primary?: boolean | null;
                    lead_id?: string | null;
                    shared_at?: string | null;
                    shared_by?: string | null;
                };
                Update: {
                    dealer_tenant_id?: string | null;
                    id?: string;
                    is_primary?: boolean | null;
                    lead_id?: string | null;
                    shared_at?: string | null;
                    shared_by?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'lead_dealer_shares_lead_id_fkey';
                        columns: ['lead_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_leads';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_feedback: {
                Row: {
                    booking_id: string;
                    created_at: string;
                    delivery_rating: number | null;
                    id: string;
                    member_id: string | null;
                    nps_score: number | null;
                    review_text: string | null;
                    staff_rating: number | null;
                    tenant_id: string | null;
                    updated_at: string;
                };
                Insert: {
                    booking_id: string;
                    created_at?: string;
                    delivery_rating?: number | null;
                    id?: string;
                    member_id?: string | null;
                    nps_score?: number | null;
                    review_text?: string | null;
                    staff_rating?: number | null;
                    tenant_id?: string | null;
                    updated_at?: string;
                };
                Update: {
                    booking_id?: string;
                    created_at?: string;
                    delivery_rating?: number | null;
                    id?: string;
                    member_id?: string | null;
                    nps_score?: number | null;
                    review_text?: string | null;
                    staff_rating?: number | null;
                    tenant_id?: string | null;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'crm_feedback_booking_id_fkey';
                        columns: ['booking_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_bookings';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_feedback_member_id_fkey';
                        columns: ['member_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_feedback_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_feedback_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_finance: {
                Row: {
                    agreement_signed_at: string | null;
                    application_number: string | null;
                    applied_at: string | null;
                    approved_amount: number | null;
                    approved_at: string | null;
                    bank_partner_id: string | null;
                    booking_id: string | null;
                    created_at: string | null;
                    disbursement_completed_at: string | null;
                    disbursement_initiated_at: string | null;
                    display_id: string | null;
                    document_verified_at: string | null;
                    enach_done_at: string | null;
                    external_app_ref: string | null;
                    id: string;
                    insurance_requested_at: string | null;
                    interest_rate: number | null;
                    is_active_closing: boolean | null;
                    lead_id: string | null;
                    lender_name: string | null;
                    loan_account_number: string | null;
                    notes: string | null;
                    onboarding_initiated_at: string | null;
                    rejected_at: string | null;
                    requested_amount: number | null;
                    sanctioned_at: string | null;
                    status: string | null;
                    tenure_months: number | null;
                    updated_at: string | null;
                };
                Insert: {
                    agreement_signed_at?: string | null;
                    application_number?: string | null;
                    applied_at?: string | null;
                    approved_amount?: number | null;
                    approved_at?: string | null;
                    bank_partner_id?: string | null;
                    booking_id?: string | null;
                    created_at?: string | null;
                    disbursement_completed_at?: string | null;
                    disbursement_initiated_at?: string | null;
                    display_id?: string | null;
                    document_verified_at?: string | null;
                    enach_done_at?: string | null;
                    external_app_ref?: string | null;
                    id?: string;
                    insurance_requested_at?: string | null;
                    interest_rate?: number | null;
                    is_active_closing?: boolean | null;
                    lead_id?: string | null;
                    lender_name?: string | null;
                    loan_account_number?: string | null;
                    notes?: string | null;
                    onboarding_initiated_at?: string | null;
                    rejected_at?: string | null;
                    requested_amount?: number | null;
                    sanctioned_at?: string | null;
                    status?: string | null;
                    tenure_months?: number | null;
                    updated_at?: string | null;
                };
                Update: {
                    agreement_signed_at?: string | null;
                    application_number?: string | null;
                    applied_at?: string | null;
                    approved_amount?: number | null;
                    approved_at?: string | null;
                    bank_partner_id?: string | null;
                    booking_id?: string | null;
                    created_at?: string | null;
                    disbursement_completed_at?: string | null;
                    disbursement_initiated_at?: string | null;
                    display_id?: string | null;
                    document_verified_at?: string | null;
                    enach_done_at?: string | null;
                    external_app_ref?: string | null;
                    id?: string;
                    insurance_requested_at?: string | null;
                    interest_rate?: number | null;
                    is_active_closing?: boolean | null;
                    lead_id?: string | null;
                    lender_name?: string | null;
                    loan_account_number?: string | null;
                    notes?: string | null;
                    onboarding_initiated_at?: string | null;
                    rejected_at?: string | null;
                    requested_amount?: number | null;
                    sanctioned_at?: string | null;
                    status?: string | null;
                    tenure_months?: number | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'crm_finance_bank_partner_id_fkey';
                        columns: ['bank_partner_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_finance_bank_partner_id_fkey';
                        columns: ['bank_partner_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_finance_lead_id_fkey';
                        columns: ['lead_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_leads';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'finance_applications_booking_id_fkey';
                        columns: ['booking_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_bookings';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_finance_assignments: {
                Row: {
                    created_at: string | null;
                    entity_id: string;
                    entity_type: string;
                    finance_exec_id: string;
                    finance_tenant_id: string;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    entity_id: string;
                    entity_type: string;
                    finance_exec_id: string;
                    finance_tenant_id: string;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    entity_id?: string;
                    entity_type?: string;
                    finance_exec_id?: string;
                    finance_tenant_id?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'crm_finance_assignments_finance_tenant_id_fkey';
                        columns: ['finance_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_finance_assignments_finance_tenant_id_fkey';
                        columns: ['finance_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_finance_events: {
                Row: {
                    actor_tenant_id: string | null;
                    actor_user_id: string | null;
                    created_at: string;
                    event_type: string;
                    finance_id: string;
                    id: string;
                    milestone: string | null;
                    notes: string | null;
                };
                Insert: {
                    actor_tenant_id?: string | null;
                    actor_user_id?: string | null;
                    created_at?: string;
                    event_type: string;
                    finance_id: string;
                    id?: string;
                    milestone?: string | null;
                    notes?: string | null;
                };
                Update: {
                    actor_tenant_id?: string | null;
                    actor_user_id?: string | null;
                    created_at?: string;
                    event_type?: string;
                    finance_id?: string;
                    id?: string;
                    milestone?: string | null;
                    notes?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'crm_finance_events_actor_tenant_id_fkey';
                        columns: ['actor_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_finance_events_actor_tenant_id_fkey';
                        columns: ['actor_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_finance_events_actor_user_id_fkey';
                        columns: ['actor_user_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_finance_events_finance_id_fkey';
                        columns: ['finance_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_finance';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_insurance: {
                Row: {
                    booking_id: string | null;
                    created_at: string | null;
                    expiry_date: string | null;
                    id: string;
                    policy_number: string | null;
                    premium_amount: number | null;
                    provider_name: string | null;
                    status: string | null;
                    tenant_id: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    booking_id?: string | null;
                    created_at?: string | null;
                    expiry_date?: string | null;
                    id?: string;
                    policy_number?: string | null;
                    premium_amount?: number | null;
                    provider_name?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    booking_id?: string | null;
                    created_at?: string | null;
                    expiry_date?: string | null;
                    id?: string;
                    policy_number?: string | null;
                    premium_amount?: number | null;
                    provider_name?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'crm_insurance_booking_id_fkey';
                        columns: ['booking_id'];
                        isOneToOne: true;
                        referencedRelation: 'crm_bookings';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_insurance_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_insurance_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_lead_events: {
                Row: {
                    actor_tenant_id: string | null;
                    actor_user_id: string | null;
                    changed_value: string | null;
                    created_at: string | null;
                    event_type: string;
                    id: string;
                    lead_id: string | null;
                    notes: string | null;
                };
                Insert: {
                    actor_tenant_id?: string | null;
                    actor_user_id?: string | null;
                    changed_value?: string | null;
                    created_at?: string | null;
                    event_type: string;
                    id?: string;
                    lead_id?: string | null;
                    notes?: string | null;
                };
                Update: {
                    actor_tenant_id?: string | null;
                    actor_user_id?: string | null;
                    changed_value?: string | null;
                    created_at?: string | null;
                    event_type?: string;
                    id?: string;
                    lead_id?: string | null;
                    notes?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'lead_events_lead_id_fkey';
                        columns: ['lead_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_leads';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_leads: {
                Row: {
                    created_at: string | null;
                    credit_score: number | null;
                    current_address: string | null;
                    current_ownership: string | null;
                    customer_dob: string | null;
                    customer_id: string | null;
                    customer_name: string;
                    customer_phone: string;
                    customer_pincode: string | null;
                    customer_taluka: string | null;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    display_id: string | null;
                    events_log: Json | null;
                    id: string;
                    intent_score: string | null;
                    interest_color: string | null;
                    interest_model: string | null;
                    interest_text: string | null;
                    interest_variant: string | null;
                    is_deleted: boolean | null;
                    is_serviceable: boolean | null;
                    notes: string | null;
                    owner_tenant_id: string | null;
                    permanent_address: string | null;
                    permanent_ownership: string | null;
                    price_snapshot: Json | null;
                    referral_data: Json | null;
                    referred_by_id: string | null;
                    referred_by_name: string | null;
                    selected_dealer_tenant_id: string | null;
                    source: string | null;
                    status: string | null;
                    tenant_id: string | null;
                    utm_campaign: string | null;
                    utm_content: string | null;
                    utm_data: Json | null;
                    utm_medium: string | null;
                    utm_source: string | null;
                    utm_term: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    credit_score?: number | null;
                    current_address?: string | null;
                    current_ownership?: string | null;
                    customer_dob?: string | null;
                    customer_id?: string | null;
                    customer_name: string;
                    customer_phone: string;
                    customer_pincode?: string | null;
                    customer_taluka?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    display_id?: string | null;
                    events_log?: Json | null;
                    id?: string;
                    intent_score?: string | null;
                    interest_color?: string | null;
                    interest_model?: string | null;
                    interest_text?: string | null;
                    interest_variant?: string | null;
                    is_deleted?: boolean | null;
                    is_serviceable?: boolean | null;
                    notes?: string | null;
                    owner_tenant_id?: string | null;
                    permanent_address?: string | null;
                    permanent_ownership?: string | null;
                    price_snapshot?: Json | null;
                    referral_data?: Json | null;
                    referred_by_id?: string | null;
                    referred_by_name?: string | null;
                    selected_dealer_tenant_id?: string | null;
                    source?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    utm_campaign?: string | null;
                    utm_content?: string | null;
                    utm_data?: Json | null;
                    utm_medium?: string | null;
                    utm_source?: string | null;
                    utm_term?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    credit_score?: number | null;
                    current_address?: string | null;
                    current_ownership?: string | null;
                    customer_dob?: string | null;
                    customer_id?: string | null;
                    customer_name?: string;
                    customer_phone?: string;
                    customer_pincode?: string | null;
                    customer_taluka?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    display_id?: string | null;
                    events_log?: Json | null;
                    id?: string;
                    intent_score?: string | null;
                    interest_color?: string | null;
                    interest_model?: string | null;
                    interest_text?: string | null;
                    interest_variant?: string | null;
                    is_deleted?: boolean | null;
                    is_serviceable?: boolean | null;
                    notes?: string | null;
                    owner_tenant_id?: string | null;
                    permanent_address?: string | null;
                    permanent_ownership?: string | null;
                    price_snapshot?: Json | null;
                    referral_data?: Json | null;
                    referred_by_id?: string | null;
                    referred_by_name?: string | null;
                    selected_dealer_tenant_id?: string | null;
                    source?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    utm_campaign?: string | null;
                    utm_content?: string | null;
                    utm_data?: Json | null;
                    utm_medium?: string | null;
                    utm_source?: string | null;
                    utm_term?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'fk_leads_customer_protect';
                        columns: ['customer_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'fk_leads_tenant_protect';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'fk_leads_tenant_protect';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'leads_customer_id_fkey';
                        columns: ['customer_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'leads_referred_by_id_fkey';
                        columns: ['referred_by_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_media: {
                Row: {
                    created_at: string;
                    entity_id: string;
                    entity_type: string;
                    file_type: string | null;
                    id: string;
                    metadata: string | null;
                    uploaded_by: string | null;
                    url: string;
                };
                Insert: {
                    created_at?: string;
                    entity_id: string;
                    entity_type: string;
                    file_type?: string | null;
                    id?: string;
                    metadata?: string | null;
                    uploaded_by?: string | null;
                    url: string;
                };
                Update: {
                    created_at?: string;
                    entity_id?: string;
                    entity_type?: string;
                    file_type?: string | null;
                    id?: string;
                    metadata?: string | null;
                    uploaded_by?: string | null;
                    url?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'crm_media_uploaded_by_fkey';
                        columns: ['uploaded_by'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_member_documents: {
                Row: {
                    category: string | null;
                    created_at: string | null;
                    file_path: string;
                    file_size: number | null;
                    file_type: string | null;
                    id: string;
                    label: string | null;
                    member_id: string;
                    name: string;
                    updated_at: string | null;
                };
                Insert: {
                    category?: string | null;
                    created_at?: string | null;
                    file_path: string;
                    file_size?: number | null;
                    file_type?: string | null;
                    id?: string;
                    label?: string | null;
                    member_id: string;
                    name: string;
                    updated_at?: string | null;
                };
                Update: {
                    category?: string | null;
                    created_at?: string | null;
                    file_path?: string;
                    file_size?: number | null;
                    file_type?: string | null;
                    id?: string;
                    label?: string | null;
                    member_id?: string;
                    name?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'crm_member_documents_member_id_fkey';
                        columns: ['member_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_payments: {
                Row: {
                    amount: number;
                    booking_id: string | null;
                    created_at: string | null;
                    currency: string | null;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    display_id: string | null;
                    id: string;
                    is_deleted: boolean;
                    is_reconciled: boolean | null;
                    lead_id: string | null;
                    member_id: string | null;
                    method: string | null;
                    provider_data: string | null;
                    reconciled_at: string | null;
                    reconciled_by: string | null;
                    status: string | null;
                    tenant_id: string | null;
                    transaction_id: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    amount: number;
                    booking_id?: string | null;
                    created_at?: string | null;
                    currency?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    display_id?: string | null;
                    id?: string;
                    is_deleted?: boolean;
                    is_reconciled?: boolean | null;
                    lead_id?: string | null;
                    member_id?: string | null;
                    method?: string | null;
                    provider_data?: string | null;
                    reconciled_at?: string | null;
                    reconciled_by?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    transaction_id?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    amount?: number;
                    booking_id?: string | null;
                    created_at?: string | null;
                    currency?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    display_id?: string | null;
                    id?: string;
                    is_deleted?: boolean;
                    is_reconciled?: boolean | null;
                    lead_id?: string | null;
                    member_id?: string | null;
                    method?: string | null;
                    provider_data?: string | null;
                    reconciled_at?: string | null;
                    reconciled_by?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    transaction_id?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'crm_4_payments_booking_id_fkey';
                        columns: ['booking_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_bookings';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_4_payments_lead_id_fkey';
                        columns: ['lead_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_leads';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_4_payments_member_id_fkey';
                        columns: ['member_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_4_payments_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_4_payments_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_pdi: {
                Row: {
                    body_ok: boolean | null;
                    booking_id: string | null;
                    brakes_ok: boolean | null;
                    created_at: string | null;
                    electrical_ok: boolean | null;
                    fuel_ok: boolean | null;
                    id: string;
                    inspection_date: string | null;
                    inspector_name: string | null;
                    notes: string | null;
                    status: string | null;
                    tenant_id: string | null;
                    tyre_ok: boolean | null;
                    updated_at: string | null;
                };
                Insert: {
                    body_ok?: boolean | null;
                    booking_id?: string | null;
                    brakes_ok?: boolean | null;
                    created_at?: string | null;
                    electrical_ok?: boolean | null;
                    fuel_ok?: boolean | null;
                    id?: string;
                    inspection_date?: string | null;
                    inspector_name?: string | null;
                    notes?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    tyre_ok?: boolean | null;
                    updated_at?: string | null;
                };
                Update: {
                    body_ok?: boolean | null;
                    booking_id?: string | null;
                    brakes_ok?: boolean | null;
                    created_at?: string | null;
                    electrical_ok?: boolean | null;
                    fuel_ok?: boolean | null;
                    id?: string;
                    inspection_date?: string | null;
                    inspector_name?: string | null;
                    notes?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    tyre_ok?: boolean | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'crm_pdi_booking_id_fkey';
                        columns: ['booking_id'];
                        isOneToOne: true;
                        referencedRelation: 'crm_bookings';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_pdi_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_pdi_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_quote_events: {
                Row: {
                    actor_tenant_id: string | null;
                    actor_user_id: string | null;
                    created_at: string;
                    event_type: string;
                    id: string;
                    notes: string | null;
                    quote_id: string;
                };
                Insert: {
                    actor_tenant_id?: string | null;
                    actor_user_id?: string | null;
                    created_at?: string;
                    event_type: string;
                    id?: string;
                    notes?: string | null;
                    quote_id: string;
                };
                Update: {
                    actor_tenant_id?: string | null;
                    actor_user_id?: string | null;
                    created_at?: string;
                    event_type?: string;
                    id?: string;
                    notes?: string | null;
                    quote_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'crm_quote_events_actor_tenant_id_fkey';
                        columns: ['actor_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_quote_events_actor_tenant_id_fkey';
                        columns: ['actor_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_quote_events_actor_user_id_fkey';
                        columns: ['actor_user_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_quote_events_quote_id_fkey';
                        columns: ['quote_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_quotes';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_quote_finance_attempts: {
                Row: {
                    bank_id: string | null;
                    bank_name: string | null;
                    charges_breakup: string | null;
                    created_at: string | null;
                    created_by: string | null;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    down_payment: number | null;
                    emi: number | null;
                    id: string;
                    is_deleted: boolean | null;
                    loan_addons: number | null;
                    loan_amount: number | null;
                    ltv: number | null;
                    processing_fee: number | null;
                    quote_id: string | null;
                    roi: number | null;
                    scheme_code: string | null;
                    scheme_id: string | null;
                    status: string | null;
                    tenant_id: string | null;
                    tenure_months: number | null;
                    updated_at: string | null;
                };
                Insert: {
                    bank_id?: string | null;
                    bank_name?: string | null;
                    charges_breakup?: string | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    down_payment?: number | null;
                    emi?: number | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    loan_addons?: number | null;
                    loan_amount?: number | null;
                    ltv?: number | null;
                    processing_fee?: number | null;
                    quote_id?: string | null;
                    roi?: number | null;
                    scheme_code?: string | null;
                    scheme_id?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    tenure_months?: number | null;
                    updated_at?: string | null;
                };
                Update: {
                    bank_id?: string | null;
                    bank_name?: string | null;
                    charges_breakup?: string | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    down_payment?: number | null;
                    emi?: number | null;
                    id?: string;
                    is_deleted?: boolean | null;
                    loan_addons?: number | null;
                    loan_amount?: number | null;
                    ltv?: number | null;
                    processing_fee?: number | null;
                    quote_id?: string | null;
                    roi?: number | null;
                    scheme_code?: string | null;
                    scheme_id?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    tenure_months?: number | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'crm_quote_finance_attempts_bank_id_fkey';
                        columns: ['bank_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_quote_finance_attempts_bank_id_fkey';
                        columns: ['bank_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_quote_finance_attempts_quote_id_fkey';
                        columns: ['quote_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_quotes';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'fk_finance_quote_protect';
                        columns: ['quote_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_quotes';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_quotes: {
                Row: {
                    accessories_amount: number | null;
                    active_finance_id: string | null;
                    booking_amount_paid: boolean | null;
                    color_id: string | null;
                    commercials: Json | null;
                    created_at: string | null;
                    created_by: string | null;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    discount_amount: number | null;
                    display_id: string | null;
                    ex_showroom_price: number | null;
                    expected_delivery: string | null;
                    finance_mode: string | null;
                    id: string;
                    insurance_amount: number | null;
                    is_deleted: boolean | null;
                    lead_id: string | null;
                    lead_referrer_id: string | null;
                    manager_discount: number | null;
                    manager_discount_note: string | null;
                    member_id: string | null;
                    on_road_price: number | null;
                    operational_stage: Database['public']['Enums']['crm_operational_stage'] | null;
                    quote_owner_id: string | null;
                    reviewed_at: string | null;
                    reviewed_by: string | null;
                    rto_amount: number | null;
                    snap_brand: string | null;
                    snap_color: string | null;
                    snap_dealer_name: string | null;
                    snap_model: string | null;
                    snap_variant: string | null;
                    stage_updated_at: string | null;
                    stage_updated_by: string | null;
                    status: string | null;
                    studio_id: string | null;
                    tenant_id: string | null;
                    updated_at: string | null;
                    valid_until: string | null;
                    variant_id: string | null;
                    vehicle_image: string | null;
                    vehicle_sku_id: string | null;
                };
                Insert: {
                    accessories_amount?: number | null;
                    active_finance_id?: string | null;
                    booking_amount_paid?: boolean | null;
                    color_id?: string | null;
                    commercials?: Json | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    discount_amount?: number | null;
                    display_id?: string | null;
                    ex_showroom_price?: number | null;
                    expected_delivery?: string | null;
                    finance_mode?: string | null;
                    id?: string;
                    insurance_amount?: number | null;
                    is_deleted?: boolean | null;
                    lead_id?: string | null;
                    lead_referrer_id?: string | null;
                    manager_discount?: number | null;
                    manager_discount_note?: string | null;
                    member_id?: string | null;
                    on_road_price?: number | null;
                    operational_stage?: Database['public']['Enums']['crm_operational_stage'] | null;
                    quote_owner_id?: string | null;
                    reviewed_at?: string | null;
                    reviewed_by?: string | null;
                    rto_amount?: number | null;
                    snap_brand?: string | null;
                    snap_color?: string | null;
                    snap_dealer_name?: string | null;
                    snap_model?: string | null;
                    snap_variant?: string | null;
                    stage_updated_at?: string | null;
                    stage_updated_by?: string | null;
                    status?: string | null;
                    studio_id?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                    valid_until?: string | null;
                    variant_id?: string | null;
                    vehicle_image?: string | null;
                    vehicle_sku_id?: string | null;
                };
                Update: {
                    accessories_amount?: number | null;
                    active_finance_id?: string | null;
                    booking_amount_paid?: boolean | null;
                    color_id?: string | null;
                    commercials?: Json | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    discount_amount?: number | null;
                    display_id?: string | null;
                    ex_showroom_price?: number | null;
                    expected_delivery?: string | null;
                    finance_mode?: string | null;
                    id?: string;
                    insurance_amount?: number | null;
                    is_deleted?: boolean | null;
                    lead_id?: string | null;
                    lead_referrer_id?: string | null;
                    manager_discount?: number | null;
                    manager_discount_note?: string | null;
                    member_id?: string | null;
                    on_road_price?: number | null;
                    operational_stage?: Database['public']['Enums']['crm_operational_stage'] | null;
                    quote_owner_id?: string | null;
                    reviewed_at?: string | null;
                    reviewed_by?: string | null;
                    rto_amount?: number | null;
                    snap_brand?: string | null;
                    snap_color?: string | null;
                    snap_dealer_name?: string | null;
                    snap_model?: string | null;
                    snap_variant?: string | null;
                    stage_updated_at?: string | null;
                    stage_updated_by?: string | null;
                    status?: string | null;
                    studio_id?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                    valid_until?: string | null;
                    variant_id?: string | null;
                    vehicle_image?: string | null;
                    vehicle_sku_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'crm_quotes_member_id_fkey';
                        columns: ['member_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'fk_quotes_lead_protect';
                        columns: ['lead_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_leads';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'fk_quotes_studio_protect';
                        columns: ['studio_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'fk_quotes_studio_protect';
                        columns: ['studio_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'fk_quotes_tenant_protect';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'fk_quotes_tenant_protect';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'quotes_lead_id_fkey';
                        columns: ['lead_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_leads';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_registration: {
                Row: {
                    booking_id: string | null;
                    created_at: string | null;
                    id: string;
                    registered_at: string | null;
                    registration_number: string | null;
                    rto_receipt_number: string | null;
                    status: string | null;
                    tenant_id: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    booking_id?: string | null;
                    created_at?: string | null;
                    id?: string;
                    registered_at?: string | null;
                    registration_number?: string | null;
                    rto_receipt_number?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    booking_id?: string | null;
                    created_at?: string | null;
                    id?: string;
                    registered_at?: string | null;
                    registration_number?: string | null;
                    rto_receipt_number?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'crm_registration_booking_id_fkey';
                        columns: ['booking_id'];
                        isOneToOne: true;
                        referencedRelation: 'crm_bookings';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_registration_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_registration_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_tasks: {
                Row: {
                    assignee_ids: string[] | null;
                    created_at: string | null;
                    created_by: string | null;
                    description: string | null;
                    due_date: string | null;
                    id: string;
                    linked_id: string;
                    linked_type: string;
                    primary_assignee_id: string | null;
                    status: string | null;
                    tenant_id: string | null;
                    title: string;
                    updated_at: string | null;
                };
                Insert: {
                    assignee_ids?: string[] | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    description?: string | null;
                    due_date?: string | null;
                    id?: string;
                    linked_id: string;
                    linked_type: string;
                    primary_assignee_id?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    title: string;
                    updated_at?: string | null;
                };
                Update: {
                    assignee_ids?: string[] | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    description?: string | null;
                    due_date?: string | null;
                    id?: string;
                    linked_id?: string;
                    linked_type?: string;
                    primary_assignee_id?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    title?: string;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
            dealer_finance_access: {
                Row: {
                    created_at: string | null;
                    dealer_tenant_id: string;
                    finance_tenant_id: string;
                    id: string;
                    is_default: boolean | null;
                };
                Insert: {
                    created_at?: string | null;
                    dealer_tenant_id: string;
                    finance_tenant_id: string;
                    id?: string;
                    is_default?: boolean | null;
                };
                Update: {
                    created_at?: string | null;
                    dealer_tenant_id?: string;
                    finance_tenant_id?: string;
                    id?: string;
                    is_default?: boolean | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'dealer_finance_access_dealer_tenant_id_fkey';
                        columns: ['dealer_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'dealer_finance_access_dealer_tenant_id_fkey';
                        columns: ['dealer_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'dealer_finance_access_finance_tenant_id_fkey';
                        columns: ['finance_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'dealer_finance_access_finance_tenant_id_fkey';
                        columns: ['finance_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            dealer_finance_schemes: {
                Row: {
                    created_at: string | null;
                    dealer_tenant_id: string;
                    finance_tenant_id: string;
                    id: string;
                    incentive: Json | null;
                    is_active: boolean | null;
                    payout: Json | null;
                    scheme_id: string;
                    target: Json | null;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    dealer_tenant_id: string;
                    finance_tenant_id: string;
                    id?: string;
                    incentive?: Json | null;
                    is_active?: boolean | null;
                    payout?: Json | null;
                    scheme_id: string;
                    target?: Json | null;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    dealer_tenant_id?: string;
                    finance_tenant_id?: string;
                    id?: string;
                    incentive?: Json | null;
                    is_active?: boolean | null;
                    payout?: Json | null;
                    scheme_id?: string;
                    target?: Json | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'dealer_finance_schemes_dealer_tenant_id_fkey';
                        columns: ['dealer_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'dealer_finance_schemes_dealer_tenant_id_fkey';
                        columns: ['dealer_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'dealer_finance_schemes_finance_tenant_id_fkey';
                        columns: ['finance_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'dealer_finance_schemes_finance_tenant_id_fkey';
                        columns: ['finance_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            dealer_finance_user_access: {
                Row: {
                    created_at: string | null;
                    crm_access: boolean | null;
                    dealer_tenant_id: string;
                    finance_tenant_id: string;
                    id: string;
                    is_default: boolean | null;
                    updated_at: string | null;
                    user_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    crm_access?: boolean | null;
                    dealer_tenant_id: string;
                    finance_tenant_id: string;
                    id?: string;
                    is_default?: boolean | null;
                    updated_at?: string | null;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    crm_access?: boolean | null;
                    dealer_tenant_id?: string;
                    finance_tenant_id?: string;
                    id?: string;
                    is_default?: boolean | null;
                    updated_at?: string | null;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'dealer_finance_user_access_dealer_tenant_id_fkey';
                        columns: ['dealer_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'dealer_finance_user_access_dealer_tenant_id_fkey';
                        columns: ['dealer_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'dealer_finance_user_access_finance_tenant_id_fkey';
                        columns: ['finance_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'dealer_finance_user_access_finance_tenant_id_fkey';
                        columns: ['finance_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            debug_logs: {
                Row: {
                    action: string;
                    component: string;
                    created_at: string | null;
                    duration_ms: number | null;
                    error: Json | null;
                    id: string;
                    message: string | null;
                    payload: Json | null;
                    status: string;
                };
                Insert: {
                    action: string;
                    component: string;
                    created_at?: string | null;
                    duration_ms?: number | null;
                    error?: Json | null;
                    id?: string;
                    message?: string | null;
                    payload?: Json | null;
                    status: string;
                };
                Update: {
                    action?: string;
                    component?: string;
                    created_at?: string | null;
                    duration_ms?: number | null;
                    error?: Json | null;
                    id?: string;
                    message?: string | null;
                    payload?: Json | null;
                    status?: string;
                };
                Relationships: [];
            };
            i18n_languages: {
                Row: {
                    code: string;
                    created_at: string;
                    is_active: boolean;
                    name: string;
                    native_name: string;
                    provider: string;
                    status: string;
                    updated_at: string;
                };
                Insert: {
                    code: string;
                    created_at?: string;
                    is_active?: boolean;
                    name: string;
                    native_name: string;
                    provider?: string;
                    status?: string;
                    updated_at?: string;
                };
                Update: {
                    code?: string;
                    created_at?: string;
                    is_active?: boolean;
                    name?: string;
                    native_name?: string;
                    provider?: string;
                    status?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            i18n_source_strings: {
                Row: {
                    context: string | null;
                    created_at: string;
                    hash: string;
                    text: string;
                    updated_at: string;
                };
                Insert: {
                    context?: string | null;
                    created_at?: string;
                    hash: string;
                    text: string;
                    updated_at?: string;
                };
                Update: {
                    context?: string | null;
                    created_at?: string;
                    hash?: string;
                    text?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            i18n_sync_runs: {
                Row: {
                    completed_at: string | null;
                    details: Json | null;
                    errors: number;
                    id: string;
                    language_code: string;
                    new_strings: number;
                    scope: string;
                    started_at: string;
                    status: string;
                    total_strings: number;
                    translated_strings: number;
                };
                Insert: {
                    completed_at?: string | null;
                    details?: Json | null;
                    errors?: number;
                    id?: string;
                    language_code: string;
                    new_strings?: number;
                    scope?: string;
                    started_at?: string;
                    status?: string;
                    total_strings?: number;
                    translated_strings?: number;
                };
                Update: {
                    completed_at?: string | null;
                    details?: Json | null;
                    errors?: number;
                    id?: string;
                    language_code?: string;
                    new_strings?: number;
                    scope?: string;
                    started_at?: string;
                    status?: string;
                    total_strings?: number;
                    translated_strings?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'i18n_sync_runs_language_code_fkey';
                        columns: ['language_code'];
                        isOneToOne: false;
                        referencedRelation: 'i18n_languages';
                        referencedColumns: ['code'];
                    },
                ];
            };
            i18n_translations: {
                Row: {
                    created_at: string;
                    id: string;
                    language_code: string;
                    provider: string;
                    source_hash: string;
                    source_text: string | null;
                    translated_text: string;
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    language_code: string;
                    provider?: string;
                    source_hash: string;
                    source_text?: string | null;
                    translated_text: string;
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    language_code?: string;
                    provider?: string;
                    source_hash?: string;
                    source_text?: string | null;
                    translated_text?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'i18n_translations_language_code_fkey';
                        columns: ['language_code'];
                        isOneToOne: false;
                        referencedRelation: 'i18n_languages';
                        referencedColumns: ['code'];
                    },
                    {
                        foreignKeyName: 'i18n_translations_source_hash_fkey';
                        columns: ['source_hash'];
                        isOneToOne: false;
                        referencedRelation: 'i18n_source_strings';
                        referencedColumns: ['hash'];
                    },
                ];
            };
            id_bank_accounts: {
                Row: {
                    account_number: string;
                    account_type: string | null;
                    bank_name: string;
                    beneficiary_name: string;
                    created_at: string | null;
                    id: string;
                    ifsc_code: string;
                    is_primary: boolean | null;
                    is_verified: boolean | null;
                    penny_drop_ref: string | null;
                    tenant_id: string;
                    updated_at: string | null;
                    verification_status: string | null;
                };
                Insert: {
                    account_number: string;
                    account_type?: string | null;
                    bank_name: string;
                    beneficiary_name: string;
                    created_at?: string | null;
                    id?: string;
                    ifsc_code: string;
                    is_primary?: boolean | null;
                    is_verified?: boolean | null;
                    penny_drop_ref?: string | null;
                    tenant_id: string;
                    updated_at?: string | null;
                    verification_status?: string | null;
                };
                Update: {
                    account_number?: string;
                    account_type?: string | null;
                    bank_name?: string;
                    beneficiary_name?: string;
                    created_at?: string | null;
                    id?: string;
                    ifsc_code?: string;
                    is_primary?: boolean | null;
                    is_verified?: boolean | null;
                    penny_drop_ref?: string | null;
                    tenant_id?: string;
                    updated_at?: string | null;
                    verification_status?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'id_bank_accounts_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'id_bank_accounts_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            id_dealer_service_areas: {
                Row: {
                    created_at: string | null;
                    district: string;
                    id: string;
                    is_active: boolean | null;
                    state_code: string;
                    tenant_id: string;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    district: string;
                    id?: string;
                    is_active?: boolean | null;
                    state_code: string;
                    tenant_id: string;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    district?: string;
                    id?: string;
                    is_active?: boolean | null;
                    state_code?: string;
                    tenant_id?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'id_dealer_service_areas_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'id_dealer_service_areas_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            id_documents: {
                Row: {
                    created_at: string | null;
                    expires_at: string | null;
                    file_path: string;
                    file_url: string;
                    id: string;
                    issued_at: string | null;
                    status: string | null;
                    tenant_id: string;
                    title: string;
                    type: string;
                    updated_at: string | null;
                    uploaded_by: string | null;
                    verification_notes: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    expires_at?: string | null;
                    file_path: string;
                    file_url: string;
                    id?: string;
                    issued_at?: string | null;
                    status?: string | null;
                    tenant_id: string;
                    title: string;
                    type: string;
                    updated_at?: string | null;
                    uploaded_by?: string | null;
                    verification_notes?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    expires_at?: string | null;
                    file_path?: string;
                    file_url?: string;
                    id?: string;
                    issued_at?: string | null;
                    status?: string | null;
                    tenant_id?: string;
                    title?: string;
                    type?: string;
                    updated_at?: string | null;
                    uploaded_by?: string | null;
                    verification_notes?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'id_documents_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'id_documents_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            id_locations: {
                Row: {
                    address_line_1: string | null;
                    address_line_2: string | null;
                    city: string | null;
                    contact_email: string | null;
                    contact_phone: string | null;
                    created_at: string | null;
                    district: string | null;
                    id: string;
                    is_active: boolean | null;
                    manager_id: string | null;
                    map_link: string | null;
                    name: string;
                    pincode: string | null;
                    state: string | null;
                    taluka: string | null;
                    tenant_id: string;
                    type: string;
                    updated_at: string | null;
                };
                Insert: {
                    address_line_1?: string | null;
                    address_line_2?: string | null;
                    city?: string | null;
                    contact_email?: string | null;
                    contact_phone?: string | null;
                    created_at?: string | null;
                    district?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    manager_id?: string | null;
                    map_link?: string | null;
                    name: string;
                    pincode?: string | null;
                    state?: string | null;
                    taluka?: string | null;
                    tenant_id: string;
                    type: string;
                    updated_at?: string | null;
                };
                Update: {
                    address_line_1?: string | null;
                    address_line_2?: string | null;
                    city?: string | null;
                    contact_email?: string | null;
                    contact_phone?: string | null;
                    created_at?: string | null;
                    district?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    manager_id?: string | null;
                    map_link?: string | null;
                    name?: string;
                    pincode?: string | null;
                    state?: string | null;
                    taluka?: string | null;
                    tenant_id?: string;
                    type?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'id_locations_manager_id_fkey';
                        columns: ['manager_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_team';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'id_locations_manager_id_fkey';
                        columns: ['manager_id'];
                        isOneToOne: false;
                        referencedRelation: 'memberships';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'id_locations_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'id_locations_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            id_member_addresses: {
                Row: {
                    country: string | null;
                    created_at: string | null;
                    id: string;
                    is_current: boolean | null;
                    label: string;
                    line1: string | null;
                    line2: string | null;
                    line3: string | null;
                    member_id: string | null;
                    pincode: string | null;
                    state: string | null;
                    taluka: string | null;
                };
                Insert: {
                    country?: string | null;
                    created_at?: string | null;
                    id?: string;
                    is_current?: boolean | null;
                    label: string;
                    line1?: string | null;
                    line2?: string | null;
                    line3?: string | null;
                    member_id?: string | null;
                    pincode?: string | null;
                    state?: string | null;
                    taluka?: string | null;
                };
                Update: {
                    country?: string | null;
                    created_at?: string | null;
                    id?: string;
                    is_current?: boolean | null;
                    label?: string;
                    line1?: string | null;
                    line2?: string | null;
                    line3?: string | null;
                    member_id?: string | null;
                    pincode?: string | null;
                    state?: string | null;
                    taluka?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'id_member_addresses_member_id_fkey';
                        columns: ['member_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                ];
            };
            id_member_assets: {
                Row: {
                    created_at: string | null;
                    entity_id: string | null;
                    file_type: string | null;
                    id: string;
                    metadata: Json | null;
                    path: string;
                    purpose: string | null;
                    tenant_id: string | null;
                    updated_at: string | null;
                    uploaded_by: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    entity_id?: string | null;
                    file_type?: string | null;
                    id?: string;
                    metadata?: Json | null;
                    path: string;
                    purpose?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                    uploaded_by?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    entity_id?: string | null;
                    file_type?: string | null;
                    id?: string;
                    metadata?: Json | null;
                    path?: string;
                    purpose?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                    uploaded_by?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'id_member_assets_entity_id_fkey';
                        columns: ['entity_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'id_member_assets_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'id_member_assets_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            id_member_contacts: {
                Row: {
                    contact_type: string;
                    created_at: string | null;
                    id: string;
                    is_primary: boolean | null;
                    label: string | null;
                    member_id: string | null;
                    value: string;
                    verified_at: string | null;
                };
                Insert: {
                    contact_type: string;
                    created_at?: string | null;
                    id?: string;
                    is_primary?: boolean | null;
                    label?: string | null;
                    member_id?: string | null;
                    value: string;
                    verified_at?: string | null;
                };
                Update: {
                    contact_type?: string;
                    created_at?: string | null;
                    id?: string;
                    is_primary?: boolean | null;
                    label?: string | null;
                    member_id?: string | null;
                    value?: string;
                    verified_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'id_member_contacts_member_id_fkey';
                        columns: ['member_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                ];
            };
            id_member_events: {
                Row: {
                    created_at: string | null;
                    created_by: string | null;
                    event_type: string;
                    id: string;
                    member_id: string | null;
                    payload: Json | null;
                    tenant_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    created_by?: string | null;
                    event_type: string;
                    id?: string;
                    member_id?: string | null;
                    payload?: Json | null;
                    tenant_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    created_by?: string | null;
                    event_type?: string;
                    id?: string;
                    member_id?: string | null;
                    payload?: Json | null;
                    tenant_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'id_member_events_member_id_fkey';
                        columns: ['member_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'id_member_events_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'id_member_events_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            id_member_spins: {
                Row: {
                    booking_id: string | null;
                    created_at: string | null;
                    eligible_at: string | null;
                    eligible_reason: string | null;
                    expires_at: string | null;
                    id: string;
                    member_id: string | null;
                    reward_id: string | null;
                    reward_kind: string | null;
                    reward_label: string | null;
                    reward_payload: Json | null;
                    reward_value: number | null;
                    spun_at: string | null;
                    status: string;
                    tenant_id: string | null;
                };
                Insert: {
                    booking_id?: string | null;
                    created_at?: string | null;
                    eligible_at?: string | null;
                    eligible_reason?: string | null;
                    expires_at?: string | null;
                    id?: string;
                    member_id?: string | null;
                    reward_id?: string | null;
                    reward_kind?: string | null;
                    reward_label?: string | null;
                    reward_payload?: Json | null;
                    reward_value?: number | null;
                    spun_at?: string | null;
                    status?: string;
                    tenant_id?: string | null;
                };
                Update: {
                    booking_id?: string | null;
                    created_at?: string | null;
                    eligible_at?: string | null;
                    eligible_reason?: string | null;
                    expires_at?: string | null;
                    id?: string;
                    member_id?: string | null;
                    reward_id?: string | null;
                    reward_kind?: string | null;
                    reward_label?: string | null;
                    reward_payload?: Json | null;
                    reward_value?: number | null;
                    spun_at?: string | null;
                    status?: string;
                    tenant_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'id_member_spins_member_id_fkey';
                        columns: ['member_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'id_member_spins_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'id_member_spins_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            id_member_tenants: {
                Row: {
                    created_at: string | null;
                    id: string;
                    joined_at: string | null;
                    last_seen_at: string | null;
                    member_id: string | null;
                    status: string | null;
                    tenant_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    joined_at?: string | null;
                    last_seen_at?: string | null;
                    member_id?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    joined_at?: string | null;
                    last_seen_at?: string | null;
                    member_id?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'id_member_tenants_member_id_fkey';
                        columns: ['member_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'id_member_tenants_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'id_member_tenants_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            id_members: {
                Row: {
                    aadhaar_address1: string | null;
                    aadhaar_address2: string | null;
                    aadhaar_address3: string | null;
                    aadhaar_front: string | null;
                    aadhaar_linked_number: string | null;
                    aadhaar_number: string | null;
                    aadhaar_pincode: string | null;
                    address: string | null;
                    addresses_json: Json | null;
                    avatar_url: string | null;
                    bookings_count: number | null;
                    category: string | null;
                    cliq_channel_id: string | null;
                    cliq_chat_id: string | null;
                    country: string | null;
                    created_at: string | null;
                    current_address1: string | null;
                    current_address2: string | null;
                    current_address3: string | null;
                    date_of_birth: string | null;
                    display_id: string | null;
                    district: string | null;
                    documents: Json | null;
                    email: string | null;
                    emails_json: Json | null;
                    father_name: string | null;
                    full_name: string | null;
                    id: string;
                    last_synced_at: string | null;
                    last_updated: string | null;
                    last_visit_at: string | null;
                    latitude: number | null;
                    leads_count: number | null;
                    longitude: number | null;
                    mother_name: string | null;
                    pan_card_url: string | null;
                    pan_number: string | null;
                    phone: string | null;
                    phones_json: Json | null;
                    pincode: string | null;
                    preferences: Json;
                    primary_email: string | null;
                    primary_phone: string | null;
                    quotes_count: number | null;
                    referral_code: string | null;
                    religion: string | null;
                    role: string | null;
                    rto: string | null;
                    state: string | null;
                    taluka: string | null;
                    tenant_id: string | null;
                    updated_at: string | null;
                    whatsapp: string | null;
                    work_address1: string | null;
                    work_address2: string | null;
                    work_address3: string | null;
                    work_company: string | null;
                    work_designation: string | null;
                    work_email: string | null;
                    work_phone: string | null;
                    zoho_book_id: string | null;
                    zone: string | null;
                };
                Insert: {
                    aadhaar_address1?: string | null;
                    aadhaar_address2?: string | null;
                    aadhaar_address3?: string | null;
                    aadhaar_front?: string | null;
                    aadhaar_linked_number?: string | null;
                    aadhaar_number?: string | null;
                    aadhaar_pincode?: string | null;
                    address?: string | null;
                    addresses_json?: Json | null;
                    avatar_url?: string | null;
                    bookings_count?: number | null;
                    category?: string | null;
                    cliq_channel_id?: string | null;
                    cliq_chat_id?: string | null;
                    country?: string | null;
                    created_at?: string | null;
                    current_address1?: string | null;
                    current_address2?: string | null;
                    current_address3?: string | null;
                    date_of_birth?: string | null;
                    display_id?: string | null;
                    district?: string | null;
                    documents?: Json | null;
                    email?: string | null;
                    emails_json?: Json | null;
                    father_name?: string | null;
                    full_name?: string | null;
                    id?: string;
                    last_synced_at?: string | null;
                    last_updated?: string | null;
                    last_visit_at?: string | null;
                    latitude?: number | null;
                    leads_count?: number | null;
                    longitude?: number | null;
                    mother_name?: string | null;
                    pan_card_url?: string | null;
                    pan_number?: string | null;
                    phone?: string | null;
                    phones_json?: Json | null;
                    pincode?: string | null;
                    preferences?: Json;
                    primary_email?: string | null;
                    primary_phone?: string | null;
                    quotes_count?: number | null;
                    referral_code?: string | null;
                    religion?: string | null;
                    role?: string | null;
                    rto?: string | null;
                    state?: string | null;
                    taluka?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                    whatsapp?: string | null;
                    work_address1?: string | null;
                    work_address2?: string | null;
                    work_address3?: string | null;
                    work_company?: string | null;
                    work_designation?: string | null;
                    work_email?: string | null;
                    work_phone?: string | null;
                    zoho_book_id?: string | null;
                    zone?: string | null;
                };
                Update: {
                    aadhaar_address1?: string | null;
                    aadhaar_address2?: string | null;
                    aadhaar_address3?: string | null;
                    aadhaar_front?: string | null;
                    aadhaar_linked_number?: string | null;
                    aadhaar_number?: string | null;
                    aadhaar_pincode?: string | null;
                    address?: string | null;
                    addresses_json?: Json | null;
                    avatar_url?: string | null;
                    bookings_count?: number | null;
                    category?: string | null;
                    cliq_channel_id?: string | null;
                    cliq_chat_id?: string | null;
                    country?: string | null;
                    created_at?: string | null;
                    current_address1?: string | null;
                    current_address2?: string | null;
                    current_address3?: string | null;
                    date_of_birth?: string | null;
                    display_id?: string | null;
                    district?: string | null;
                    documents?: Json | null;
                    email?: string | null;
                    emails_json?: Json | null;
                    father_name?: string | null;
                    full_name?: string | null;
                    id?: string;
                    last_synced_at?: string | null;
                    last_updated?: string | null;
                    last_visit_at?: string | null;
                    latitude?: number | null;
                    leads_count?: number | null;
                    longitude?: number | null;
                    mother_name?: string | null;
                    pan_card_url?: string | null;
                    pan_number?: string | null;
                    phone?: string | null;
                    phones_json?: Json | null;
                    pincode?: string | null;
                    preferences?: Json;
                    primary_email?: string | null;
                    primary_phone?: string | null;
                    quotes_count?: number | null;
                    referral_code?: string | null;
                    religion?: string | null;
                    role?: string | null;
                    rto?: string | null;
                    state?: string | null;
                    taluka?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                    whatsapp?: string | null;
                    work_address1?: string | null;
                    work_address2?: string | null;
                    work_address3?: string | null;
                    work_company?: string | null;
                    work_designation?: string | null;
                    work_email?: string | null;
                    work_phone?: string | null;
                    zoho_book_id?: string | null;
                    zone?: string | null;
                };
                Relationships: [];
            };
            id_operating_hours: {
                Row: {
                    close_time: string | null;
                    created_at: string | null;
                    day_of_week: number;
                    id: string;
                    is_closed: boolean | null;
                    open_time: string | null;
                    tenant_id: string;
                    updated_at: string | null;
                };
                Insert: {
                    close_time?: string | null;
                    created_at?: string | null;
                    day_of_week: number;
                    id?: string;
                    is_closed?: boolean | null;
                    open_time?: string | null;
                    tenant_id: string;
                    updated_at?: string | null;
                };
                Update: {
                    close_time?: string | null;
                    created_at?: string | null;
                    day_of_week?: number;
                    id?: string;
                    is_closed?: boolean | null;
                    open_time?: string | null;
                    tenant_id?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'id_operating_hours_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'id_operating_hours_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            id_primary_dealer_districts: {
                Row: {
                    created_at: string;
                    district: string;
                    id: string;
                    is_active: boolean;
                    state_code: string;
                    tenant_id: string;
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    district: string;
                    id?: string;
                    is_active?: boolean;
                    state_code: string;
                    tenant_id: string;
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    district?: string;
                    id?: string;
                    is_active?: boolean;
                    state_code?: string;
                    tenant_id?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'id_primary_dealer_districts_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'id_primary_dealer_districts_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            id_team: {
                Row: {
                    created_at: string | null;
                    display_id: string | null;
                    id: string;
                    reports_to: string | null;
                    role: string;
                    status: string | null;
                    tenant_id: string | null;
                    user_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    display_id?: string | null;
                    id?: string;
                    reports_to?: string | null;
                    role: string;
                    status?: string | null;
                    tenant_id?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    display_id?: string | null;
                    id?: string;
                    reports_to?: string | null;
                    role?: string;
                    status?: string | null;
                    tenant_id?: string | null;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'id_team_reports_to_fkey';
                        columns: ['reports_to'];
                        isOneToOne: false;
                        referencedRelation: 'id_team';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'id_team_reports_to_fkey';
                        columns: ['reports_to'];
                        isOneToOne: false;
                        referencedRelation: 'memberships';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'memberships_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'memberships_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            id_tenants: {
                Row: {
                    config: Json | null;
                    created_at: string | null;
                    display_id: string | null;
                    email: string | null;
                    favicon_url: string | null;
                    id: string;
                    location: string | null;
                    logo_url: string | null;
                    name: string;
                    phone: string | null;
                    pincode: string | null;
                    slug: string;
                    status: string | null;
                    studio_id: string | null;
                    type: string;
                };
                Insert: {
                    config?: Json | null;
                    created_at?: string | null;
                    display_id?: string | null;
                    email?: string | null;
                    favicon_url?: string | null;
                    id?: string;
                    location?: string | null;
                    logo_url?: string | null;
                    name: string;
                    phone?: string | null;
                    pincode?: string | null;
                    slug: string;
                    status?: string | null;
                    studio_id?: string | null;
                    type: string;
                };
                Update: {
                    config?: Json | null;
                    created_at?: string | null;
                    display_id?: string | null;
                    email?: string | null;
                    favicon_url?: string | null;
                    id?: string;
                    location?: string | null;
                    logo_url?: string | null;
                    name?: string;
                    phone?: string | null;
                    pincode?: string | null;
                    slug?: string;
                    status?: string | null;
                    studio_id?: string | null;
                    type?: string;
                };
                Relationships: [];
            };
            inv_dealer_quotes: {
                Row: {
                    bundled_amount: number;
                    bundled_item_ids: string[];
                    created_at: string;
                    dealer_tenant_id: string;
                    expected_total: number;
                    freebie_description: string | null;
                    freebie_sku_id: string | null;
                    id: string;
                    quoted_by_user_id: string | null;
                    request_id: string;
                    status: Database['public']['Enums']['inv_quote_status'];
                    transport_amount: number;
                    variance_amount: number | null;
                };
                Insert: {
                    bundled_amount: number;
                    bundled_item_ids?: string[];
                    created_at?: string;
                    dealer_tenant_id: string;
                    expected_total?: number;
                    freebie_description?: string | null;
                    freebie_sku_id?: string | null;
                    id?: string;
                    quoted_by_user_id?: string | null;
                    request_id: string;
                    status?: Database['public']['Enums']['inv_quote_status'];
                    transport_amount?: number;
                    variance_amount?: number | null;
                };
                Update: {
                    bundled_amount?: number;
                    bundled_item_ids?: string[];
                    created_at?: string;
                    dealer_tenant_id?: string;
                    expected_total?: number;
                    freebie_description?: string | null;
                    freebie_sku_id?: string | null;
                    id?: string;
                    quoted_by_user_id?: string | null;
                    request_id?: string;
                    status?: Database['public']['Enums']['inv_quote_status'];
                    transport_amount?: number;
                    variance_amount?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'inv_dealer_quotes_dealer_tenant_id_fkey';
                        columns: ['dealer_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'inv_dealer_quotes_dealer_tenant_id_fkey';
                        columns: ['dealer_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'inv_dealer_quotes_request_id_fkey';
                        columns: ['request_id'];
                        isOneToOne: false;
                        referencedRelation: 'inv_requests';
                        referencedColumns: ['id'];
                    },
                ];
            };
            inv_po_payments: {
                Row: {
                    amount_paid: number;
                    created_by: string | null;
                    id: string;
                    payment_date: string;
                    po_id: string;
                    transaction_id: string | null;
                };
                Insert: {
                    amount_paid: number;
                    created_by?: string | null;
                    id?: string;
                    payment_date?: string;
                    po_id: string;
                    transaction_id?: string | null;
                };
                Update: {
                    amount_paid?: number;
                    created_by?: string | null;
                    id?: string;
                    payment_date?: string;
                    po_id?: string;
                    transaction_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'inv_po_payments_po_id_fkey';
                        columns: ['po_id'];
                        isOneToOne: false;
                        referencedRelation: 'inv_purchase_orders';
                        referencedColumns: ['id'];
                    },
                ];
            };
            inv_purchase_orders: {
                Row: {
                    created_at: string;
                    created_by: string | null;
                    dealer_tenant_id: string;
                    display_id: string | null;
                    docket_number: string | null;
                    expected_delivery_date: string | null;
                    id: string;
                    payment_status: Database['public']['Enums']['inv_payment_status'];
                    po_status: Database['public']['Enums']['inv_po_status'];
                    quote_id: string;
                    request_id: string;
                    total_po_value: number;
                    transporter_name: string | null;
                    updated_at: string;
                    updated_by: string | null;
                };
                Insert: {
                    created_at?: string;
                    created_by?: string | null;
                    dealer_tenant_id: string;
                    display_id?: string | null;
                    docket_number?: string | null;
                    expected_delivery_date?: string | null;
                    id?: string;
                    payment_status?: Database['public']['Enums']['inv_payment_status'];
                    po_status?: Database['public']['Enums']['inv_po_status'];
                    quote_id: string;
                    request_id: string;
                    total_po_value: number;
                    transporter_name?: string | null;
                    updated_at?: string;
                    updated_by?: string | null;
                };
                Update: {
                    created_at?: string;
                    created_by?: string | null;
                    dealer_tenant_id?: string;
                    display_id?: string | null;
                    docket_number?: string | null;
                    expected_delivery_date?: string | null;
                    id?: string;
                    payment_status?: Database['public']['Enums']['inv_payment_status'];
                    po_status?: Database['public']['Enums']['inv_po_status'];
                    quote_id?: string;
                    request_id?: string;
                    total_po_value?: number;
                    transporter_name?: string | null;
                    updated_at?: string;
                    updated_by?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'inv_purchase_orders_dealer_tenant_id_fkey';
                        columns: ['dealer_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'inv_purchase_orders_dealer_tenant_id_fkey';
                        columns: ['dealer_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'inv_purchase_orders_quote_id_fkey';
                        columns: ['quote_id'];
                        isOneToOne: false;
                        referencedRelation: 'inv_dealer_quotes';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'inv_purchase_orders_request_id_fkey';
                        columns: ['request_id'];
                        isOneToOne: false;
                        referencedRelation: 'inv_requests';
                        referencedColumns: ['id'];
                    },
                ];
            };
            inv_request_items: {
                Row: {
                    cost_type: Database['public']['Enums']['inv_cost_type'];
                    description: string | null;
                    expected_amount: number;
                    id: string;
                    request_id: string;
                };
                Insert: {
                    cost_type: Database['public']['Enums']['inv_cost_type'];
                    description?: string | null;
                    expected_amount?: number;
                    id?: string;
                    request_id: string;
                };
                Update: {
                    cost_type?: Database['public']['Enums']['inv_cost_type'];
                    description?: string | null;
                    expected_amount?: number;
                    id?: string;
                    request_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'inv_request_items_request_id_fkey';
                        columns: ['request_id'];
                        isOneToOne: false;
                        referencedRelation: 'inv_requests';
                        referencedColumns: ['id'];
                    },
                ];
            };
            inv_requests: {
                Row: {
                    booking_id: string | null;
                    created_at: string;
                    created_by: string | null;
                    delivery_branch_id: string | null;
                    display_id: string | null;
                    id: string;
                    sku_id: string;
                    source_type: Database['public']['Enums']['inv_source_type'];
                    status: Database['public']['Enums']['inv_request_status'];
                    tenant_id: string;
                    updated_at: string;
                };
                Insert: {
                    booking_id?: string | null;
                    created_at?: string;
                    created_by?: string | null;
                    delivery_branch_id?: string | null;
                    display_id?: string | null;
                    id?: string;
                    sku_id: string;
                    source_type?: Database['public']['Enums']['inv_source_type'];
                    status?: Database['public']['Enums']['inv_request_status'];
                    tenant_id: string;
                    updated_at?: string;
                };
                Update: {
                    booking_id?: string | null;
                    created_at?: string;
                    created_by?: string | null;
                    delivery_branch_id?: string | null;
                    display_id?: string | null;
                    id?: string;
                    sku_id?: string;
                    source_type?: Database['public']['Enums']['inv_source_type'];
                    status?: Database['public']['Enums']['inv_request_status'];
                    tenant_id?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'fk_inv_requests_sku';
                        columns: ['sku_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_skus';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'inv_requests_booking_id_fkey';
                        columns: ['booking_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_bookings';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'inv_requests_delivery_branch_id_fkey';
                        columns: ['delivery_branch_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_locations';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'inv_requests_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'inv_requests_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            inv_stock: {
                Row: {
                    battery_make: string | null;
                    branch_id: string;
                    chassis_number: string;
                    created_at: string;
                    engine_number: string;
                    id: string;
                    is_shared: boolean;
                    locked_at: string | null;
                    locked_by_tenant_id: string | null;
                    media_chassis_url: string;
                    media_damage_urls: string[] | null;
                    media_engine_url: string;
                    media_qc_video_url: string;
                    media_sticker_url: string | null;
                    po_id: string;
                    qc_notes: string | null;
                    qc_status: Database['public']['Enums']['inv_qc_status'];
                    sku_id: string;
                    status: Database['public']['Enums']['inv_stock_status'];
                    tenant_id: string;
                    updated_at: string;
                };
                Insert: {
                    battery_make?: string | null;
                    branch_id: string;
                    chassis_number: string;
                    created_at?: string;
                    engine_number: string;
                    id?: string;
                    is_shared?: boolean;
                    locked_at?: string | null;
                    locked_by_tenant_id?: string | null;
                    media_chassis_url: string;
                    media_damage_urls?: string[] | null;
                    media_engine_url: string;
                    media_qc_video_url: string;
                    media_sticker_url?: string | null;
                    po_id: string;
                    qc_notes?: string | null;
                    qc_status?: Database['public']['Enums']['inv_qc_status'];
                    sku_id: string;
                    status?: Database['public']['Enums']['inv_stock_status'];
                    tenant_id: string;
                    updated_at?: string;
                };
                Update: {
                    battery_make?: string | null;
                    branch_id?: string;
                    chassis_number?: string;
                    created_at?: string;
                    engine_number?: string;
                    id?: string;
                    is_shared?: boolean;
                    locked_at?: string | null;
                    locked_by_tenant_id?: string | null;
                    media_chassis_url?: string;
                    media_damage_urls?: string[] | null;
                    media_engine_url?: string;
                    media_qc_video_url?: string;
                    media_sticker_url?: string | null;
                    po_id?: string;
                    qc_notes?: string | null;
                    qc_status?: Database['public']['Enums']['inv_qc_status'];
                    sku_id?: string;
                    status?: Database['public']['Enums']['inv_stock_status'];
                    tenant_id?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'fk_inv_stock_sku';
                        columns: ['sku_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_skus';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'inv_stock_branch_id_fkey';
                        columns: ['branch_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_locations';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'inv_stock_locked_by_tenant_id_fkey';
                        columns: ['locked_by_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'inv_stock_locked_by_tenant_id_fkey';
                        columns: ['locked_by_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'inv_stock_po_id_fkey';
                        columns: ['po_id'];
                        isOneToOne: false;
                        referencedRelation: 'inv_purchase_orders';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'inv_stock_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'inv_stock_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            inv_stock_ledger: {
                Row: {
                    action: Database['public']['Enums']['inv_ledger_action'];
                    actor_tenant_id: string | null;
                    actor_user_id: string | null;
                    created_at: string;
                    id: string;
                    notes: string | null;
                    stock_id: string;
                };
                Insert: {
                    action: Database['public']['Enums']['inv_ledger_action'];
                    actor_tenant_id?: string | null;
                    actor_user_id?: string | null;
                    created_at?: string;
                    id?: string;
                    notes?: string | null;
                    stock_id: string;
                };
                Update: {
                    action?: Database['public']['Enums']['inv_ledger_action'];
                    actor_tenant_id?: string | null;
                    actor_user_id?: string | null;
                    created_at?: string;
                    id?: string;
                    notes?: string | null;
                    stock_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'inv_stock_ledger_actor_tenant_id_fkey';
                        columns: ['actor_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'inv_stock_ledger_actor_tenant_id_fkey';
                        columns: ['actor_tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'inv_stock_ledger_stock_id_fkey';
                        columns: ['stock_id'];
                        isOneToOne: false;
                        referencedRelation: 'inv_stock';
                        referencedColumns: ['id'];
                    },
                ];
            };
            loc_pincodes: {
                Row: {
                    area: string | null;
                    country: string | null;
                    created_at: string | null;
                    district: string | null;
                    latitude: number | null;
                    longitude: number | null;
                    pincode: string;
                    rto_code: string | null;
                    state: string | null;
                    state_code: string | null;
                    status: string | null;
                    taluka: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    area?: string | null;
                    country?: string | null;
                    created_at?: string | null;
                    district?: string | null;
                    latitude?: number | null;
                    longitude?: number | null;
                    pincode: string;
                    rto_code?: string | null;
                    state?: string | null;
                    state_code?: string | null;
                    status?: string | null;
                    taluka?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    area?: string | null;
                    country?: string | null;
                    created_at?: string | null;
                    district?: string | null;
                    latitude?: number | null;
                    longitude?: number | null;
                    pincode?: string;
                    rto_code?: string | null;
                    state?: string | null;
                    state_code?: string | null;
                    status?: string | null;
                    taluka?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
            mat_market_summary: {
                Row: {
                    brand_id: string | null;
                    family_id: string | null;
                    id: string;
                    image_url: string | null;
                    lowest_price: number;
                    model_name: string;
                    sku_count: number | null;
                    slug: string;
                    state_code: string;
                    updated_at: string | null;
                };
                Insert: {
                    brand_id?: string | null;
                    family_id?: string | null;
                    id?: string;
                    image_url?: string | null;
                    lowest_price: number;
                    model_name: string;
                    sku_count?: number | null;
                    slug: string;
                    state_code: string;
                    updated_at?: string | null;
                };
                Update: {
                    brand_id?: string | null;
                    family_id?: string | null;
                    id?: string;
                    image_url?: string | null;
                    lowest_price?: number;
                    model_name?: string;
                    sku_count?: number | null;
                    slug?: string;
                    state_code?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'mat_market_summary_brand_id_fkey';
                        columns: ['brand_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_brands';
                        referencedColumns: ['id'];
                    },
                ];
            };
            notifications: {
                Row: {
                    created_at: string;
                    id: string;
                    is_read: boolean;
                    message: string;
                    metadata: Json | null;
                    tenant_id: string;
                    title: string;
                    type: string;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    is_read?: boolean;
                    message: string;
                    metadata?: Json | null;
                    tenant_id: string;
                    title: string;
                    type?: string;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    is_read?: boolean;
                    message?: string;
                    metadata?: Json | null;
                    tenant_id?: string;
                    title?: string;
                    type?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'notifications_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'notifications_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            oclub_booking_coin_applies: {
                Row: {
                    booking_id: string;
                    coin_amount: number;
                    coin_type: string;
                    created_at: string;
                    id: string;
                    sponsor_id: string | null;
                    status: string;
                };
                Insert: {
                    booking_id: string;
                    coin_amount: number;
                    coin_type: string;
                    created_at?: string;
                    id?: string;
                    sponsor_id?: string | null;
                    status?: string;
                };
                Update: {
                    booking_id?: string;
                    coin_amount?: number;
                    coin_type?: string;
                    created_at?: string;
                    id?: string;
                    sponsor_id?: string | null;
                    status?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'oclub_booking_coin_applies_booking_id_fkey';
                        columns: ['booking_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_bookings';
                        referencedColumns: ['id'];
                    },
                ];
            };
            oclub_coin_ledger: {
                Row: {
                    coin_type: string;
                    created_at: string;
                    delta: number;
                    id: string;
                    member_id: string;
                    metadata: Json | null;
                    source_id: string | null;
                    source_type: string;
                    sponsor_id: string | null;
                    status: string;
                };
                Insert: {
                    coin_type: string;
                    created_at?: string;
                    delta: number;
                    id?: string;
                    member_id: string;
                    metadata?: Json | null;
                    source_id?: string | null;
                    source_type: string;
                    sponsor_id?: string | null;
                    status: string;
                };
                Update: {
                    coin_type?: string;
                    created_at?: string;
                    delta?: number;
                    id?: string;
                    member_id?: string;
                    metadata?: Json | null;
                    source_id?: string | null;
                    source_type?: string;
                    sponsor_id?: string | null;
                    status?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'oclub_coin_ledger_member_id_fkey';
                        columns: ['member_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                ];
            };
            oclub_redemption_requests: {
                Row: {
                    agent_id: string;
                    approved_at: string | null;
                    approved_by: string | null;
                    booking_id: string;
                    coin_amount: number;
                    id: string;
                    payment_confirmed_at: string | null;
                    payment_ref: string | null;
                    rejected_at: string | null;
                    rejected_by: string | null;
                    requested_at: string;
                    sponsor_id: string | null;
                    status: string;
                };
                Insert: {
                    agent_id: string;
                    approved_at?: string | null;
                    approved_by?: string | null;
                    booking_id: string;
                    coin_amount: number;
                    id?: string;
                    payment_confirmed_at?: string | null;
                    payment_ref?: string | null;
                    rejected_at?: string | null;
                    rejected_by?: string | null;
                    requested_at?: string;
                    sponsor_id?: string | null;
                    status?: string;
                };
                Update: {
                    agent_id?: string;
                    approved_at?: string | null;
                    approved_by?: string | null;
                    booking_id?: string;
                    coin_amount?: number;
                    id?: string;
                    payment_confirmed_at?: string | null;
                    payment_ref?: string | null;
                    rejected_at?: string | null;
                    rejected_by?: string | null;
                    requested_at?: string;
                    sponsor_id?: string | null;
                    status?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'oclub_redemption_requests_agent_id_fkey';
                        columns: ['agent_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'oclub_redemption_requests_booking_id_fkey';
                        columns: ['booking_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_bookings';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'oclub_redemption_requests_sponsor_id_fkey';
                        columns: ['sponsor_id'];
                        isOneToOne: false;
                        referencedRelation: 'oclub_sponsors';
                        referencedColumns: ['id'];
                    },
                ];
            };
            oclub_referrals: {
                Row: {
                    created_at: string;
                    id: string;
                    lead_id: string;
                    referred_member_id: string | null;
                    referrer_member_id: string;
                    reward_coins: number;
                    status: string;
                    unlocked_at: string | null;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    lead_id: string;
                    referred_member_id?: string | null;
                    referrer_member_id: string;
                    reward_coins?: number;
                    status?: string;
                    unlocked_at?: string | null;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    lead_id?: string;
                    referred_member_id?: string | null;
                    referrer_member_id?: string;
                    reward_coins?: number;
                    status?: string;
                    unlocked_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'oclub_referrals_lead_id_fkey';
                        columns: ['lead_id'];
                        isOneToOne: true;
                        referencedRelation: 'crm_leads';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'oclub_referrals_referred_member_id_fkey';
                        columns: ['referred_member_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'oclub_referrals_referrer_member_id_fkey';
                        columns: ['referrer_member_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                ];
            };
            oclub_sponsor_agents: {
                Row: {
                    agent_id: string;
                    created_at: string;
                    id: string;
                    is_primary: boolean;
                    sponsor_id: string;
                    status: string;
                };
                Insert: {
                    agent_id: string;
                    created_at?: string;
                    id?: string;
                    is_primary?: boolean;
                    sponsor_id: string;
                    status?: string;
                };
                Update: {
                    agent_id?: string;
                    created_at?: string;
                    id?: string;
                    is_primary?: boolean;
                    sponsor_id?: string;
                    status?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'oclub_sponsor_agents_agent_id_fkey';
                        columns: ['agent_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'oclub_sponsor_agents_sponsor_id_fkey';
                        columns: ['sponsor_id'];
                        isOneToOne: false;
                        referencedRelation: 'oclub_sponsors';
                        referencedColumns: ['id'];
                    },
                ];
            };
            oclub_sponsor_allocations: {
                Row: {
                    agent_id: string;
                    coins: number;
                    created_at: string;
                    expires_at: string | null;
                    id: string;
                    notes: string | null;
                    sponsor_id: string;
                };
                Insert: {
                    agent_id: string;
                    coins: number;
                    created_at?: string;
                    expires_at?: string | null;
                    id?: string;
                    notes?: string | null;
                    sponsor_id: string;
                };
                Update: {
                    agent_id?: string;
                    coins?: number;
                    created_at?: string;
                    expires_at?: string | null;
                    id?: string;
                    notes?: string | null;
                    sponsor_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'oclub_sponsor_allocations_agent_id_fkey';
                        columns: ['agent_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'oclub_sponsor_allocations_sponsor_id_fkey';
                        columns: ['sponsor_id'];
                        isOneToOne: false;
                        referencedRelation: 'oclub_sponsors';
                        referencedColumns: ['id'];
                    },
                ];
            };
            oclub_sponsors: {
                Row: {
                    billing_contact: Json | null;
                    created_at: string;
                    id: string;
                    name: string;
                    status: string;
                    tenant_id: string;
                };
                Insert: {
                    billing_contact?: Json | null;
                    created_at?: string;
                    id?: string;
                    name: string;
                    status?: string;
                    tenant_id: string;
                };
                Update: {
                    billing_contact?: Json | null;
                    created_at?: string;
                    id?: string;
                    name?: string;
                    status?: string;
                    tenant_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'oclub_sponsors_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'oclub_sponsors_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            oclub_wallets: {
                Row: {
                    available_referral: number;
                    available_sponsored: number;
                    available_system: number;
                    lifetime_earned: number;
                    lifetime_redeemed: number;
                    locked_referral: number;
                    member_id: string;
                    pending_sponsored: number;
                    updated_at: string;
                };
                Insert: {
                    available_referral?: number;
                    available_sponsored?: number;
                    available_system?: number;
                    lifetime_earned?: number;
                    lifetime_redeemed?: number;
                    locked_referral?: number;
                    member_id: string;
                    pending_sponsored?: number;
                    updated_at?: string;
                };
                Update: {
                    available_referral?: number;
                    available_sponsored?: number;
                    available_system?: number;
                    lifetime_earned?: number;
                    lifetime_redeemed?: number;
                    locked_referral?: number;
                    member_id?: string;
                    pending_sponsored?: number;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'oclub_wallets_member_id_fkey';
                        columns: ['member_id'];
                        isOneToOne: true;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                ];
            };
            sys_archived: {
                Row: {
                    archived_at: string | null;
                    archived_by: string | null;
                    data: Json;
                    id: string;
                    original_id: string;
                    original_table: string;
                    tenant_id: string | null;
                };
                Insert: {
                    archived_at?: string | null;
                    archived_by?: string | null;
                    data: Json;
                    id?: string;
                    original_id: string;
                    original_table: string;
                    tenant_id?: string | null;
                };
                Update: {
                    archived_at?: string | null;
                    archived_by?: string | null;
                    data?: Json;
                    id?: string;
                    original_id?: string;
                    original_table?: string;
                    tenant_id?: string | null;
                };
                Relationships: [];
            };
            sys_dashboard_templates: {
                Row: {
                    created_at: string | null;
                    description: string | null;
                    id: string;
                    is_system: boolean | null;
                    layout_config: Json;
                    name: string;
                    sidebar_config: Json;
                    tenant_type: string;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    description?: string | null;
                    id?: string;
                    is_system?: boolean | null;
                    layout_config: Json;
                    name: string;
                    sidebar_config: Json;
                    tenant_type: string;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    description?: string | null;
                    id?: string;
                    is_system?: boolean | null;
                    layout_config?: Json;
                    name?: string;
                    sidebar_config?: Json;
                    tenant_type?: string;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
            sys_role_templates: {
                Row: {
                    created_at: string | null;
                    id: string;
                    role: string;
                    template_id: string | null;
                    tenant_type: string;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    role: string;
                    template_id?: string | null;
                    tenant_type: string;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    role?: string;
                    template_id?: string | null;
                    tenant_type?: string;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'role_template_assignments_template_id_fkey';
                        columns: ['template_id'];
                        isOneToOne: false;
                        referencedRelation: 'sys_dashboard_templates';
                        referencedColumns: ['id'];
                    },
                ];
            };
            sys_settings: {
                Row: {
                    default_owner_tenant_id: string | null;
                    id: string;
                    unified_context_strict_mode: boolean | null;
                    unified_marketplace_context: boolean | null;
                    updated_at: string | null;
                };
                Insert: {
                    default_owner_tenant_id?: string | null;
                    id?: string;
                    unified_context_strict_mode?: boolean | null;
                    unified_marketplace_context?: boolean | null;
                    updated_at?: string | null;
                };
                Update: {
                    default_owner_tenant_id?: string | null;
                    id?: string;
                    unified_context_strict_mode?: boolean | null;
                    unified_marketplace_context?: boolean | null;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
        };
        Views: {
            crm_receipts: {
                Row: {
                    amount: number | null;
                    booking_id: string | null;
                    created_at: string | null;
                    currency: string | null;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    display_id: string | null;
                    id: string | null;
                    is_deleted: boolean | null;
                    is_reconciled: boolean | null;
                    lead_id: string | null;
                    member_id: string | null;
                    method: string | null;
                    provider_data: string | null;
                    reconciled_at: string | null;
                    reconciled_by: string | null;
                    status: string | null;
                    tenant_id: string | null;
                    transaction_id: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    amount?: number | null;
                    booking_id?: string | null;
                    created_at?: string | null;
                    currency?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    display_id?: string | null;
                    id?: string | null;
                    is_deleted?: boolean | null;
                    is_reconciled?: boolean | null;
                    lead_id?: string | null;
                    member_id?: string | null;
                    method?: string | null;
                    provider_data?: string | null;
                    reconciled_at?: string | null;
                    reconciled_by?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    transaction_id?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    amount?: number | null;
                    booking_id?: string | null;
                    created_at?: string | null;
                    currency?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    display_id?: string | null;
                    id?: string | null;
                    is_deleted?: boolean | null;
                    is_reconciled?: boolean | null;
                    lead_id?: string | null;
                    member_id?: string | null;
                    method?: string | null;
                    provider_data?: string | null;
                    reconciled_at?: string | null;
                    reconciled_by?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    transaction_id?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'crm_4_payments_booking_id_fkey';
                        columns: ['booking_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_bookings';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_4_payments_lead_id_fkey';
                        columns: ['lead_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_leads';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_4_payments_member_id_fkey';
                        columns: ['member_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_4_payments_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_4_payments_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_receipts_v: {
                Row: {
                    amount: number | null;
                    booking_id: string | null;
                    created_at: string | null;
                    currency: string | null;
                    deleted_at: string | null;
                    deleted_by: string | null;
                    display_id: string | null;
                    id: string | null;
                    is_deleted: boolean | null;
                    is_reconciled: boolean | null;
                    lead_id: string | null;
                    member_id: string | null;
                    method: string | null;
                    provider_data: string | null;
                    reconciled_at: string | null;
                    reconciled_by: string | null;
                    status: string | null;
                    tenant_id: string | null;
                    transaction_id: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    amount?: number | null;
                    booking_id?: string | null;
                    created_at?: string | null;
                    currency?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    display_id?: string | null;
                    id?: string | null;
                    is_deleted?: boolean | null;
                    is_reconciled?: boolean | null;
                    lead_id?: string | null;
                    member_id?: string | null;
                    method?: string | null;
                    provider_data?: string | null;
                    reconciled_at?: string | null;
                    reconciled_by?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    transaction_id?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    amount?: number | null;
                    booking_id?: string | null;
                    created_at?: string | null;
                    currency?: string | null;
                    deleted_at?: string | null;
                    deleted_by?: string | null;
                    display_id?: string | null;
                    id?: string | null;
                    is_deleted?: boolean | null;
                    is_reconciled?: boolean | null;
                    lead_id?: string | null;
                    member_id?: string | null;
                    method?: string | null;
                    provider_data?: string | null;
                    reconciled_at?: string | null;
                    reconciled_by?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    transaction_id?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'crm_4_payments_booking_id_fkey';
                        columns: ['booking_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_bookings';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_4_payments_lead_id_fkey';
                        columns: ['lead_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_leads';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_4_payments_member_id_fkey';
                        columns: ['member_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_members';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_4_payments_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_4_payments_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            memberships: {
                Row: {
                    created_at: string | null;
                    id: string | null;
                    role: string | null;
                    status: string | null;
                    tenant_id: string | null;
                    updated_at: string | null;
                    user_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string | null;
                    role?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    updated_at?: never;
                    user_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string | null;
                    role?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    updated_at?: never;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'memberships_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'memberships_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            tenants: {
                Row: {
                    config: Json | null;
                    created_at: string | null;
                    id: string | null;
                    name: string | null;
                    slug: string | null;
                    status: string | null;
                    type: string | null;
                };
                Insert: {
                    config?: Json | null;
                    created_at?: string | null;
                    id?: string | null;
                    name?: string | null;
                    slug?: string | null;
                    status?: string | null;
                    type?: string | null;
                };
                Update: {
                    config?: Json | null;
                    created_at?: string | null;
                    id?: string | null;
                    name?: string | null;
                    slug?: string | null;
                    status?: string | null;
                    type?: string | null;
                };
                Relationships: [];
            };
        };
        Functions: {
            check_is_super_admin: { Args: { p_user_id: string }; Returns: boolean };
            check_is_tenant_owner: {
                Args: { p_tenant_id: string; p_user_id: string };
                Returns: boolean;
            };
            check_is_tenant_owner_for_pricing: {
                Args: { p_tenant_id: string; p_user_id: string };
                Returns: boolean;
            };
            create_booking_from_quote: { Args: { quote_id: string }; Returns: string };
            encode_base33: { Args: { length: number; num: number }; Returns: string };
            generate_display_id: { Args: never; Returns: string };
            get_dealer_offers: {
                Args: { p_state_code: string; p_tenant_id: string };
                Returns: {
                    best_offer: number;
                    bundle_ids: string[];
                    bundle_price: number;
                    bundle_value: number;
                    dealer_id: string;
                    dealer_name: string;
                    district: string;
                    is_serviceable: boolean;
                    studio_id: string;
                    vehicle_color_id: string;
                }[];
            };
            get_market_best_offers: {
                Args: { p_district_name: string; p_state_code: string };
                Returns: {
                    best_offer: number;
                    bundle_ids: string[];
                    bundle_price: number;
                    bundle_value: number;
                    dealer_id: string;
                    dealer_name: string;
                    district: string;
                    is_serviceable: boolean;
                    studio_id: string;
                    vehicle_color_id: string;
                }[];
            };
            get_my_role: { Args: { lookup_tenant_id: string }; Returns: string };
            get_my_tenant_id: { Args: never; Returns: string };
            get_nearest_pincode: {
                Args: { p_lat: number; p_lon: number };
                Returns: {
                    distance_km: number;
                    district: string;
                    pincode: string;
                    rto_code: string;
                    state: string;
                    taluka: string;
                }[];
            };
            get_nearest_serviceable_district: {
                Args: { p_lat: number; p_lon: number };
                Returns: {
                    distance_km: number;
                    district: string;
                    is_user_district: boolean;
                    state_code: string;
                }[];
            };
            get_session_profile: { Args: never; Returns: Json };
            get_user_memberships: { Args: { p_user_id: string }; Returns: Json };
            is_marketplace_admin: { Args: never; Returns: boolean };
            is_super_admin: { Args: never; Returns: boolean };
            oclub_add_ledger: {
                Args: {
                    p_coin_type: string;
                    p_delta: number;
                    p_member_id: string;
                    p_metadata: Json;
                    p_source_id: string;
                    p_source_type: string;
                    p_sponsor_id: string;
                    p_status: string;
                };
                Returns: string;
            };
            oclub_apply_booking_coins: {
                Args: {
                    p_booking_id: string;
                    p_member_id: string;
                    p_referral_coins: number;
                    p_sponsored_coins: number;
                    p_system_coins: number;
                };
                Returns: string;
            };
            oclub_approve_redemption: {
                Args: { p_approved_by: string; p_request_id: string };
                Returns: undefined;
            };
            oclub_confirm_redemption_paid: {
                Args: { p_payment_ref: string; p_request_id: string };
                Returns: undefined;
            };
            oclub_credit_referral: {
                Args: {
                    p_lead_id: string;
                    p_referred_member_id: string;
                    p_referrer_id: string;
                };
                Returns: undefined;
            };
            oclub_credit_signup: { Args: { p_member_id: string }; Returns: undefined };
            oclub_ensure_wallet: { Args: { p_member_id: string }; Returns: undefined };
            oclub_reject_redemption: {
                Args: { p_rejected_by: string; p_request_id: string };
                Returns: undefined;
            };
            oclub_unlock_referral: {
                Args: { p_referral_id: string };
                Returns: undefined;
            };
            publish_price_with_lock: {
                Args: {
                    p_insurance_total: number;
                    p_publish_job_id: string;
                    p_published_by: string;
                    p_rto_total: number;
                    p_state_code: string;
                    p_vehicle_color_id: string;
                };
                Returns: Json;
            };
            set_primary_dealer_for_district: {
                Args: { p_district: string; p_state_code: string; p_tenant_id: string };
                Returns: undefined;
            };
            transition_booking_stage: {
                Args: {
                    p_booking_id: string;
                    p_reason?: string;
                    p_to_stage: Database['public']['Enums']['crm_operational_stage'];
                };
                Returns: Json;
            };
            upsert_cat_prices_bypass: { Args: { prices: Json }; Returns: undefined };
            upsert_dealer_offers: { Args: { offers: Json }; Returns: undefined };
        };
        Enums: {
            allotment_status: 'NONE' | 'SOFT_LOCK' | 'HARD_LOCK';
            app_role: 'SUPER_ADMIN' | 'MARKETPLACE_ADMIN' | 'DEALER_ADMIN' | 'BANK_ADMIN' | 'STAFF';
            bank_app_status:
                | 'REQUESTED'
                | 'DOCS_PENDING'
                | 'SUBMITTED'
                | 'APPROVED'
                | 'REJECTED'
                | 'DISBURSED'
                | 'CLOSED';
            crm_operational_stage:
                | 'QUOTE'
                | 'BOOKING'
                | 'PAYMENT'
                | 'FINANCE'
                | 'ALLOTMENT'
                | 'PDI'
                | 'INSURANCE'
                | 'REGISTRATION'
                | 'COMPLIANCE'
                | 'DELIVERY'
                | 'DELIVERED'
                | 'FEEDBACK';
            fuel_type: 'PETROL' | 'ELECTRIC' | 'CNG' | 'HYBRID';
            inv_cost_type:
                | 'EX_SHOWROOM'
                | 'INSURANCE_TP'
                | 'INSURANCE_ZD'
                | 'RTO_REGISTRATION'
                | 'HYPOTHECATION'
                | 'TRANSPORT'
                | 'ACCESSORY'
                | 'OTHER';
            inv_ledger_action:
                | 'RECEIVED'
                | 'QC_PASSED'
                | 'QC_FAILED'
                | 'SOFT_LOCKED'
                | 'HARD_LOCKED'
                | 'UNLOCKED'
                | 'SOLD'
                | 'TRANSFERRED'
                | 'DAMAGED';
            inv_payment_status: 'UNPAID' | 'PARTIAL_PAID' | 'FULLY_PAID';
            inv_po_status: 'DRAFT' | 'SENT' | 'SHIPPED' | 'RECEIVED';
            inv_qc_status: 'PENDING' | 'PASSED' | 'FAILED_DAMAGE' | 'FAILED_MISSING';
            inv_quote_status: 'SUBMITTED' | 'SELECTED' | 'REJECTED';
            inv_request_status: 'QUOTING' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
            inv_source_type: 'BOOKING' | 'DIRECT';
            inv_stock_status: 'AVAILABLE' | 'SOFT_LOCKED' | 'HARD_LOCKED' | 'SOLD' | 'IN_TRANSIT';
            lead_status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'BOOKED' | 'DELIVERED' | 'CLOSED' | 'LOST';
            power_unit: 'CC' | 'KW';
            sku_status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED' | 'UPCOMING';
            tenant_type: 'MARKETPLACE' | 'DEALER' | 'BANK' | 'SUPER_ADMIN';
            vehicle_category: 'MOTORCYCLE' | 'SCOOTER' | 'MOPED' | 'ELECTRIC_BIKE' | 'ELECTRIC_SCOOTER';
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
              DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
          DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
      ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
        : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
      ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema['CompositeTypes']
        | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
      ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
      : never;

export const Constants = {
    public: {
        Enums: {
            allotment_status: ['NONE', 'SOFT_LOCK', 'HARD_LOCK'],
            app_role: ['SUPER_ADMIN', 'MARKETPLACE_ADMIN', 'DEALER_ADMIN', 'BANK_ADMIN', 'STAFF'],
            bank_app_status: ['REQUESTED', 'DOCS_PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DISBURSED', 'CLOSED'],
            crm_operational_stage: [
                'QUOTE',
                'BOOKING',
                'PAYMENT',
                'FINANCE',
                'ALLOTMENT',
                'PDI',
                'INSURANCE',
                'REGISTRATION',
                'COMPLIANCE',
                'DELIVERY',
                'DELIVERED',
                'FEEDBACK',
            ],
            fuel_type: ['PETROL', 'ELECTRIC', 'CNG', 'HYBRID'],
            inv_cost_type: [
                'EX_SHOWROOM',
                'INSURANCE_TP',
                'INSURANCE_ZD',
                'RTO_REGISTRATION',
                'HYPOTHECATION',
                'TRANSPORT',
                'ACCESSORY',
                'OTHER',
            ],
            inv_ledger_action: [
                'RECEIVED',
                'QC_PASSED',
                'QC_FAILED',
                'SOFT_LOCKED',
                'HARD_LOCKED',
                'UNLOCKED',
                'SOLD',
                'TRANSFERRED',
                'DAMAGED',
            ],
            inv_payment_status: ['UNPAID', 'PARTIAL_PAID', 'FULLY_PAID'],
            inv_po_status: ['DRAFT', 'SENT', 'SHIPPED', 'RECEIVED'],
            inv_qc_status: ['PENDING', 'PASSED', 'FAILED_DAMAGE', 'FAILED_MISSING'],
            inv_quote_status: ['SUBMITTED', 'SELECTED', 'REJECTED'],
            inv_request_status: ['QUOTING', 'ORDERED', 'RECEIVED', 'CANCELLED'],
            inv_source_type: ['BOOKING', 'DIRECT'],
            inv_stock_status: ['AVAILABLE', 'SOFT_LOCKED', 'HARD_LOCKED', 'SOLD', 'IN_TRANSIT'],
            lead_status: ['NEW', 'CONTACTED', 'QUOTED', 'BOOKED', 'DELIVERED', 'CLOSED', 'LOST'],
            power_unit: ['CC', 'KW'],
            sku_status: ['ACTIVE', 'INACTIVE', 'DISCONTINUED', 'UPCOMING'],
            tenant_type: ['MARKETPLACE', 'DEALER', 'BANK', 'SUPER_ADMIN'],
            vehicle_category: ['MOTORCYCLE', 'SCOOTER', 'MOPED', 'ELECTRIC_BIKE', 'ELECTRIC_SCOOTER'],
        },
    },
} as const;
