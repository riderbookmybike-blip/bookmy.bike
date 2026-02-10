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
                Relationships: [
                    {
                        foreignKeyName: 'cat_assets_item_id_fkey';
                        columns: ['item_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_items';
                        referencedColumns: ['id'];
                    },
                ];
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
            cat_ingestion_ignore_rules: {
                Row: {
                    active: boolean;
                    brand_id: string;
                    created_at: string | null;
                    id: string;
                    pattern_type: string;
                    pattern_value: string;
                    tenant_id: string | null;
                };
                Insert: {
                    active?: boolean;
                    brand_id: string;
                    created_at?: string | null;
                    id?: string;
                    pattern_type: string;
                    pattern_value: string;
                    tenant_id?: string | null;
                };
                Update: {
                    active?: boolean;
                    brand_id?: string;
                    created_at?: string | null;
                    id?: string;
                    pattern_type?: string;
                    pattern_value?: string;
                    tenant_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'cat_ingestion_ignore_rules_brand_id_fkey';
                        columns: ['brand_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_brands';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'cat_ingestion_ignore_rules_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                ];
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
                        foreignKeyName: 'cat_item_ingestion_sources_item_id_fkey';
                        columns: ['item_id'];
                        isOneToOne: true;
                        referencedRelation: 'cat_items';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'cat_item_ingestion_sources_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            cat_item_suitability: {
                Row: {
                    created_at: string | null;
                    id: string;
                    source_item_id: string | null;
                    target_id: string;
                    target_type: string;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    source_item_id?: string | null;
                    target_id: string;
                    target_type: string;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    source_item_id?: string | null;
                    target_id?: string;
                    target_type?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'catalog_item_suitability_source_item_id_fkey';
                        columns: ['source_item_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_items';
                        referencedColumns: ['id'];
                    },
                ];
            };
            cat_items: {
                Row: {
                    brand_id: string | null;
                    category: string | null;
                    created_at: string | null;
                    created_by: string | null;
                    gallery_urls: Json | null;
                    history: Json | null;
                    hsn_code: string | null;
                    id: string;
                    image_url: string | null;
                    inclusion_type: string | null;
                    is_flipped: boolean | null;
                    is_primary: boolean | null;
                    item_tax_rate: number | null;
                    name: string;
                    offset_x: number | null;
                    offset_y: number | null;
                    parent_id: string | null;
                    position: number | null;
                    price_base: number | null;
                    sku_code: string | null;
                    slug: string | null;
                    specs: Json | null;
                    status: string | null;
                    tenant_id: string | null;
                    type: string;
                    updated_at: string | null;
                    updated_by: string | null;
                    video_url: string | null;
                    zoom_factor: number | null;
                };
                Insert: {
                    brand_id?: string | null;
                    category?: string | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    gallery_urls?: Json | null;
                    history?: Json | null;
                    hsn_code?: string | null;
                    id?: string;
                    image_url?: string | null;
                    inclusion_type?: string | null;
                    is_flipped?: boolean | null;
                    is_primary?: boolean | null;
                    item_tax_rate?: number | null;
                    name: string;
                    offset_x?: number | null;
                    offset_y?: number | null;
                    parent_id?: string | null;
                    position?: number | null;
                    price_base?: number | null;
                    sku_code?: string | null;
                    slug?: string | null;
                    specs?: Json | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    type: string;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    video_url?: string | null;
                    zoom_factor?: number | null;
                };
                Update: {
                    brand_id?: string | null;
                    category?: string | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    gallery_urls?: Json | null;
                    history?: Json | null;
                    hsn_code?: string | null;
                    id?: string;
                    image_url?: string | null;
                    inclusion_type?: string | null;
                    is_flipped?: boolean | null;
                    is_primary?: boolean | null;
                    item_tax_rate?: number | null;
                    name?: string;
                    offset_x?: number | null;
                    offset_y?: number | null;
                    parent_id?: string | null;
                    position?: number | null;
                    price_base?: number | null;
                    sku_code?: string | null;
                    slug?: string | null;
                    specs?: Json | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    type?: string;
                    updated_at?: string | null;
                    updated_by?: string | null;
                    video_url?: string | null;
                    zoom_factor?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'catalog_items_brand_id_fkey';
                        columns: ['brand_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_brands';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'catalog_items_parent_id_fkey';
                        columns: ['parent_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_items';
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
                        foreignKeyName: 'id_dealer_pricing_rules_vehicle_model_id_fkey';
                        columns: ['vehicle_model_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_items';
                        referencedColumns: ['id'];
                    },
                ];
            };
            cat_price_state: {
                Row: {
                    category: string | null;
                    created_at: string | null;
                    district: string | null;
                    ex_showroom_price: number | null;
                    gst_rate: number | null;
                    hsn_code: string | null;
                    id: string;
                    insurance: Json | null;
                    insurance_breakdown: Json | null;
                    insurance_total: number | null;
                    is_active: boolean | null;
                    is_popular: boolean | null;
                    latitude: number | null;
                    longitude: number | null;
                    on_road_price: number | null;
                    publish_stage: string | null;
                    published_at: string | null;
                    published_by: string | null;
                    rto: Json | null;
                    rto_breakdown: Json | null;
                    rto_total: number | null;
                    state_code: string;
                    updated_at: string | null;
                    vehicle_color_id: string;
                };
                Insert: {
                    category?: string | null;
                    created_at?: string | null;
                    district?: string | null;
                    ex_showroom_price?: number | null;
                    gst_rate?: number | null;
                    hsn_code?: string | null;
                    id?: string;
                    insurance?: Json | null;
                    insurance_breakdown?: Json | null;
                    insurance_total?: number | null;
                    is_active?: boolean | null;
                    is_popular?: boolean | null;
                    latitude?: number | null;
                    longitude?: number | null;
                    on_road_price?: number | null;
                    publish_stage?: string | null;
                    published_at?: string | null;
                    published_by?: string | null;
                    rto?: Json | null;
                    rto_breakdown?: Json | null;
                    rto_total?: number | null;
                    state_code: string;
                    updated_at?: string | null;
                    vehicle_color_id: string;
                };
                Update: {
                    category?: string | null;
                    created_at?: string | null;
                    district?: string | null;
                    ex_showroom_price?: number | null;
                    gst_rate?: number | null;
                    hsn_code?: string | null;
                    id?: string;
                    insurance?: Json | null;
                    insurance_breakdown?: Json | null;
                    insurance_total?: number | null;
                    is_active?: boolean | null;
                    is_popular?: boolean | null;
                    latitude?: number | null;
                    longitude?: number | null;
                    on_road_price?: number | null;
                    publish_stage?: string | null;
                    published_at?: string | null;
                    published_by?: string | null;
                    rto?: Json | null;
                    rto_breakdown?: Json | null;
                    rto_total?: number | null;
                    state_code?: string;
                    updated_at?: string | null;
                    vehicle_color_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'vehicle_prices_vehicle_color_id_fkey';
                        columns: ['vehicle_color_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_items';
                        referencedColumns: ['id'];
                    },
                ];
            };
            cat_price_state_history: {
                Row: {
                    delta: number;
                    id: string;
                    new_on_road: number;
                    old_on_road: number | null;
                    publish_job_id: string;
                    published_at: string;
                    published_by: string | null;
                    state_code: string;
                    vehicle_color_id: string;
                };
                Insert: {
                    delta?: number;
                    id?: string;
                    new_on_road: number;
                    old_on_road?: number | null;
                    publish_job_id: string;
                    published_at?: string;
                    published_by?: string | null;
                    state_code: string;
                    vehicle_color_id: string;
                };
                Update: {
                    delta?: number;
                    id?: string;
                    new_on_road?: number;
                    old_on_road?: number | null;
                    publish_job_id?: string;
                    published_at?: string;
                    published_by?: string | null;
                    state_code?: string;
                    vehicle_color_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'cat_price_history_vehicle_color_id_fkey';
                        columns: ['vehicle_color_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_items';
                        referencedColumns: ['id'];
                    },
                ];
            };
            cat_price_state_trash: {
                Row: {
                    category: string | null;
                    created_at: string | null;
                    district: string | null;
                    ex_showroom_price: number | null;
                    gst_rate: number | null;
                    hsn_code: string | null;
                    id: string | null;
                    insurance: Json | null;
                    insurance_breakdown: Json | null;
                    insurance_total: number | null;
                    is_active: boolean | null;
                    latitude: number | null;
                    longitude: number | null;
                    on_road_price: number | null;
                    publish_stage: string | null;
                    published_at: string | null;
                    published_by: string | null;
                    rto: Json | null;
                    rto_breakdown: Json | null;
                    rto_total: number | null;
                    state_code: string | null;
                    updated_at: string | null;
                    vehicle_color_id: string | null;
                };
                Insert: {
                    category?: string | null;
                    created_at?: string | null;
                    district?: string | null;
                    ex_showroom_price?: number | null;
                    gst_rate?: number | null;
                    hsn_code?: string | null;
                    id?: string | null;
                    insurance?: Json | null;
                    insurance_breakdown?: Json | null;
                    insurance_total?: number | null;
                    is_active?: boolean | null;
                    latitude?: number | null;
                    longitude?: number | null;
                    on_road_price?: number | null;
                    publish_stage?: string | null;
                    published_at?: string | null;
                    published_by?: string | null;
                    rto?: Json | null;
                    rto_breakdown?: Json | null;
                    rto_total?: number | null;
                    state_code?: string | null;
                    updated_at?: string | null;
                    vehicle_color_id?: string | null;
                };
                Update: {
                    category?: string | null;
                    created_at?: string | null;
                    district?: string | null;
                    ex_showroom_price?: number | null;
                    gst_rate?: number | null;
                    hsn_code?: string | null;
                    id?: string | null;
                    insurance?: Json | null;
                    insurance_breakdown?: Json | null;
                    insurance_total?: number | null;
                    is_active?: boolean | null;
                    latitude?: number | null;
                    longitude?: number | null;
                    on_road_price?: number | null;
                    publish_stage?: string | null;
                    published_at?: string | null;
                    published_by?: string | null;
                    rto?: Json | null;
                    rto_breakdown?: Json | null;
                    rto_total?: number | null;
                    state_code?: string | null;
                    updated_at?: string | null;
                    vehicle_color_id?: string | null;
                };
                Relationships: [];
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
            cat_tenure_config: {
                Row: {
                    allowed_years: number[];
                    component: string;
                    created_at: string | null;
                    default_years: number;
                    id: string;
                    linked_to: string | null;
                    max_years: number;
                    min_years: number;
                    updated_at: string | null;
                };
                Insert: {
                    allowed_years?: number[];
                    component: string;
                    created_at?: string | null;
                    default_years?: number;
                    id?: string;
                    linked_to?: string | null;
                    max_years?: number;
                    min_years?: number;
                    updated_at?: string | null;
                };
                Update: {
                    allowed_years?: number[];
                    component?: string;
                    created_at?: string | null;
                    default_years?: number;
                    id?: string;
                    linked_to?: string | null;
                    max_years?: number;
                    min_years?: number;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
            crm_allotments: {
                Row: {
                    allotted_at: string | null;
                    booking_id: string | null;
                    created_at: string | null;
                    engine_number: string | null;
                    id: string;
                    metadata: Json | null;
                    status: string | null;
                    tenant_id: string | null;
                    updated_at: string | null;
                    vin_number: string | null;
                };
                Insert: {
                    allotted_at?: string | null;
                    booking_id?: string | null;
                    created_at?: string | null;
                    engine_number?: string | null;
                    id?: string;
                    metadata?: Json | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                    vin_number?: string | null;
                };
                Update: {
                    allotted_at?: string | null;
                    booking_id?: string | null;
                    created_at?: string | null;
                    engine_number?: string | null;
                    id?: string;
                    metadata?: Json | null;
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
                        foreignKeyName: 'crm_allotments_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_assets: {
                Row: {
                    created_at: string | null;
                    entity_id: string;
                    entity_type: string;
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
                    entity_id: string;
                    entity_type: string;
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
                    entity_id?: string;
                    entity_type?: string;
                    file_type?: string | null;
                    id?: string;
                    metadata?: Json | null;
                    path?: string;
                    purpose?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                    uploaded_by?: string | null;
                };
                Relationships: [];
            };
            crm_bank_apps: {
                Row: {
                    bank_tenant_id: string | null;
                    created_at: string | null;
                    funding_amount: number | null;
                    id: string;
                    lead_id: string | null;
                    notes: string | null;
                    roi: number | null;
                    status: Database['public']['Enums']['bank_app_status'] | null;
                    updated_at: string | null;
                };
                Insert: {
                    bank_tenant_id?: string | null;
                    created_at?: string | null;
                    funding_amount?: number | null;
                    id?: string;
                    lead_id?: string | null;
                    notes?: string | null;
                    roi?: number | null;
                    status?: Database['public']['Enums']['bank_app_status'] | null;
                    updated_at?: string | null;
                };
                Update: {
                    bank_tenant_id?: string | null;
                    created_at?: string | null;
                    funding_amount?: number | null;
                    id?: string;
                    lead_id?: string | null;
                    notes?: string | null;
                    roi?: number | null;
                    status?: Database['public']['Enums']['bank_app_status'] | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'bank_applications_lead_id_fkey';
                        columns: ['lead_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_leads';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_booking_assets: {
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
                        foreignKeyName: 'crm_booking_assets_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
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
                    current_stage: string | null;
                    customer_details: Json | null;
                    delivery_date: string | null;
                    delivery_status: string | null;
                    display_id: string | null;
                    finance_status: string | null;
                    firebase_id: string | null;
                    grand_total: number | null;
                    id: string;
                    insurance_policy_number: string | null;
                    insurance_provider: string | null;
                    insurance_status: string | null;
                    inventory_status: string | null;
                    operational_stage: Database['public']['Enums']['crm_operational_stage'] | null;
                    payment_status: string | null;
                    pdi_status: string | null;
                    quote_id: string | null;
                    refund_status: string | null;
                    registration_number: string | null;
                    registration_status: string | null;
                    rto_receipt_number: string | null;
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
                    current_stage?: string | null;
                    customer_details?: Json | null;
                    delivery_date?: string | null;
                    delivery_status?: string | null;
                    display_id?: string | null;
                    finance_status?: string | null;
                    firebase_id?: string | null;
                    grand_total?: number | null;
                    id?: string;
                    insurance_policy_number?: string | null;
                    insurance_provider?: string | null;
                    insurance_status?: string | null;
                    inventory_status?: string | null;
                    operational_stage?: Database['public']['Enums']['crm_operational_stage'] | null;
                    payment_status?: string | null;
                    pdi_status?: string | null;
                    quote_id?: string | null;
                    refund_status?: string | null;
                    registration_number?: string | null;
                    registration_status?: string | null;
                    rto_receipt_number?: string | null;
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
                    current_stage?: string | null;
                    customer_details?: Json | null;
                    delivery_date?: string | null;
                    delivery_status?: string | null;
                    display_id?: string | null;
                    finance_status?: string | null;
                    firebase_id?: string | null;
                    grand_total?: number | null;
                    id?: string;
                    insurance_policy_number?: string | null;
                    insurance_provider?: string | null;
                    insurance_status?: string | null;
                    inventory_status?: string | null;
                    operational_stage?: Database['public']['Enums']['crm_operational_stage'] | null;
                    payment_status?: string | null;
                    pdi_status?: string | null;
                    quote_id?: string | null;
                    refund_status?: string | null;
                    registration_number?: string | null;
                    registration_status?: string | null;
                    rto_receipt_number?: string | null;
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
                        foreignKeyName: 'crm_bookings_color_id_fkey';
                        columns: ['color_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_items';
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
                        foreignKeyName: 'crm_bookings_variant_id_fkey';
                        columns: ['variant_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_items';
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
            crm_finance: {
                Row: {
                    application_number: string | null;
                    approved_amount: number | null;
                    booking_id: string | null;
                    created_at: string | null;
                    display_id: string | null;
                    id: string;
                    interest_rate: number | null;
                    is_active_closing: boolean | null;
                    lender_name: string | null;
                    notes: string | null;
                    requested_amount: number | null;
                    status: string | null;
                    tenure_months: number | null;
                    updated_at: string | null;
                };
                Insert: {
                    application_number?: string | null;
                    approved_amount?: number | null;
                    booking_id?: string | null;
                    created_at?: string | null;
                    display_id?: string | null;
                    id?: string;
                    interest_rate?: number | null;
                    is_active_closing?: boolean | null;
                    lender_name?: string | null;
                    notes?: string | null;
                    requested_amount?: number | null;
                    status?: string | null;
                    tenure_months?: number | null;
                    updated_at?: string | null;
                };
                Update: {
                    application_number?: string | null;
                    approved_amount?: number | null;
                    booking_id?: string | null;
                    created_at?: string | null;
                    display_id?: string | null;
                    id?: string;
                    interest_rate?: number | null;
                    is_active_closing?: boolean | null;
                    lender_name?: string | null;
                    notes?: string | null;
                    requested_amount?: number | null;
                    status?: string | null;
                    tenure_months?: number | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'finance_applications_booking_id_fkey';
                        columns: ['booking_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_bookings';
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
                    metadata: Json | null;
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
                    metadata?: Json | null;
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
                    metadata?: Json | null;
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
                ];
            };
            crm_lead_assets: {
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
                        foreignKeyName: 'crm_lead_assets_entity_id_fkey';
                        columns: ['entity_id'];
                        isOneToOne: false;
                        referencedRelation: 'crm_leads';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'crm_lead_assets_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            crm_lead_events: {
                Row: {
                    actor_tenant_id: string | null;
                    actor_user_id: string | null;
                    created_at: string | null;
                    event_type: string;
                    id: string;
                    lead_id: string | null;
                    payload: Json | null;
                };
                Insert: {
                    actor_tenant_id?: string | null;
                    actor_user_id?: string | null;
                    created_at?: string | null;
                    event_type: string;
                    id?: string;
                    lead_id?: string | null;
                    payload?: Json | null;
                };
                Update: {
                    actor_tenant_id?: string | null;
                    actor_user_id?: string | null;
                    created_at?: string | null;
                    event_type?: string;
                    id?: string;
                    lead_id?: string | null;
                    payload?: Json | null;
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
                    display_id: string | null;
                    events_log: Json | null;
                    id: string;
                    intent_score: string | null;
                    interest_color: string | null;
                    interest_model: string | null;
                    interest_text: string | null;
                    interest_variant: string | null;
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
                    utm_data: Json | null;
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
                    display_id?: string | null;
                    events_log?: Json | null;
                    id?: string;
                    intent_score?: string | null;
                    interest_color?: string | null;
                    interest_model?: string | null;
                    interest_text?: string | null;
                    interest_variant?: string | null;
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
                    utm_data?: Json | null;
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
                    display_id?: string | null;
                    events_log?: Json | null;
                    id?: string;
                    intent_score?: string | null;
                    interest_color?: string | null;
                    interest_model?: string | null;
                    interest_text?: string | null;
                    interest_variant?: string | null;
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
                    utm_data?: Json | null;
                };
                Relationships: [
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
            crm_member_documents: {
                Row: {
                    category: string | null;
                    created_at: string | null;
                    file_path: string;
                    file_type: string | null;
                    id: string;
                    member_id: string;
                    name: string;
                    updated_at: string | null;
                };
                Insert: {
                    category?: string | null;
                    created_at?: string | null;
                    file_path: string;
                    file_type?: string | null;
                    id?: string;
                    member_id: string;
                    name: string;
                    updated_at?: string | null;
                };
                Update: {
                    category?: string | null;
                    created_at?: string | null;
                    file_path?: string;
                    file_type?: string | null;
                    id?: string;
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
                    display_id: string | null;
                    id: string;
                    lead_id: string | null;
                    member_id: string | null;
                    method: string | null;
                    provider_data: Json | null;
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
                    display_id?: string | null;
                    id?: string;
                    lead_id?: string | null;
                    member_id?: string | null;
                    method?: string | null;
                    provider_data?: Json | null;
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
                    display_id?: string | null;
                    id?: string;
                    lead_id?: string | null;
                    member_id?: string | null;
                    method?: string | null;
                    provider_data?: Json | null;
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
                ];
            };
            crm_pdi: {
                Row: {
                    booking_id: string | null;
                    checklist: Json | null;
                    created_at: string | null;
                    id: string;
                    inspection_date: string | null;
                    inspector_name: string | null;
                    metadata: Json | null;
                    notes: string | null;
                    status: string | null;
                    tenant_id: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    booking_id?: string | null;
                    checklist?: Json | null;
                    created_at?: string | null;
                    id?: string;
                    inspection_date?: string | null;
                    inspector_name?: string | null;
                    metadata?: Json | null;
                    notes?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    booking_id?: string | null;
                    checklist?: Json | null;
                    created_at?: string | null;
                    id?: string;
                    inspection_date?: string | null;
                    inspector_name?: string | null;
                    metadata?: Json | null;
                    notes?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
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
                ];
            };
            crm_quote_finance_attempts: {
                Row: {
                    bank_id: string | null;
                    bank_name: string | null;
                    charges_breakup: Json | null;
                    created_at: string | null;
                    created_by: string | null;
                    down_payment: number | null;
                    emi: number | null;
                    id: string;
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
                    charges_breakup?: Json | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    down_payment?: number | null;
                    emi?: number | null;
                    id?: string;
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
                    charges_breakup?: Json | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    down_payment?: number | null;
                    emi?: number | null;
                    id?: string;
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
                        foreignKeyName: 'crm_quote_finance_attempts_quote_id_fkey';
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
                    discount_amount: number | null;
                    display_id: string | null;
                    ex_showroom_price: number | null;
                    expected_delivery: string | null;
                    finance_mode: string | null;
                    id: string;
                    insurance_amount: number | null;
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
                    discount_amount?: number | null;
                    display_id?: string | null;
                    ex_showroom_price?: number | null;
                    expected_delivery?: string | null;
                    finance_mode?: string | null;
                    id?: string;
                    insurance_amount?: number | null;
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
                    discount_amount?: number | null;
                    display_id?: string | null;
                    ex_showroom_price?: number | null;
                    expected_delivery?: string | null;
                    finance_mode?: string | null;
                    id?: string;
                    insurance_amount?: number | null;
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
                    metadata: Json | null;
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
                    metadata?: Json | null;
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
                    metadata?: Json | null;
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
                ];
            };
            id_dealer_pricing_rules: {
                Row: {
                    brand_id: string | null;
                    color_id: string | null;
                    created_at: string | null;
                    created_by: string | null;
                    dealer_id: string;
                    discount_type: string | null;
                    discount_value: number | null;
                    effective_from: string | null;
                    effective_to: string | null;
                    id: string;
                    is_active: boolean | null;
                    max_discount: number | null;
                    min_margin: number | null;
                    model_id: string | null;
                    priority: number | null;
                    rule_name: string;
                    rule_type: string;
                    updated_at: string | null;
                    variant_id: string | null;
                    vehicle_type: string | null;
                };
                Insert: {
                    brand_id?: string | null;
                    color_id?: string | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    dealer_id: string;
                    discount_type?: string | null;
                    discount_value?: number | null;
                    effective_from?: string | null;
                    effective_to?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    max_discount?: number | null;
                    min_margin?: number | null;
                    model_id?: string | null;
                    priority?: number | null;
                    rule_name: string;
                    rule_type?: string;
                    updated_at?: string | null;
                    variant_id?: string | null;
                    vehicle_type?: string | null;
                };
                Update: {
                    brand_id?: string | null;
                    color_id?: string | null;
                    created_at?: string | null;
                    created_by?: string | null;
                    dealer_id?: string;
                    discount_type?: string | null;
                    discount_value?: number | null;
                    effective_from?: string | null;
                    effective_to?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    max_discount?: number | null;
                    min_margin?: number | null;
                    model_id?: string | null;
                    priority?: number | null;
                    rule_name?: string;
                    rule_type?: string;
                    updated_at?: string | null;
                    variant_id?: string | null;
                    vehicle_type?: string | null;
                };
                Relationships: [];
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
                        foreignKeyName: 'id_locations_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
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
                        foreignKeyName: 'memberships_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'id_tenants';
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
            inv_ledger: {
                Row: {
                    from_tenant_id: string | null;
                    id: string;
                    inventory_id: string;
                    notes: string | null;
                    to_tenant_id: string | null;
                    transaction_type: Database['public']['Enums']['inventory_transaction_type'];
                    transferred_at: string | null;
                };
                Insert: {
                    from_tenant_id?: string | null;
                    id?: string;
                    inventory_id: string;
                    notes?: string | null;
                    to_tenant_id?: string | null;
                    transaction_type: Database['public']['Enums']['inventory_transaction_type'];
                    transferred_at?: string | null;
                };
                Update: {
                    from_tenant_id?: string | null;
                    id?: string;
                    inventory_id?: string;
                    notes?: string | null;
                    to_tenant_id?: string | null;
                    transaction_type?: Database['public']['Enums']['inventory_transaction_type'];
                    transferred_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'inventory_ledger_inventory_id_fkey';
                        columns: ['inventory_id'];
                        isOneToOne: false;
                        referencedRelation: 'inv_stock';
                        referencedColumns: ['id'];
                    },
                ];
            };
            inv_marketplace: {
                Row: {
                    created_at: string | null;
                    id: string;
                    item_id: string | null;
                    local_price: number | null;
                    stock_status: string | null;
                    tenant_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    item_id?: string | null;
                    local_price?: number | null;
                    stock_status?: string | null;
                    tenant_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    item_id?: string | null;
                    local_price?: number | null;
                    stock_status?: string | null;
                    tenant_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'marketplace_inventory_item_id_fkey';
                        columns: ['item_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_raw_items';
                        referencedColumns: ['id'];
                    },
                ];
            };
            inv_po_items: {
                Row: {
                    id: string;
                    ordered_qty: number;
                    po_id: string;
                    received_qty: number | null;
                    sku_id: string;
                    unit_cost: number | null;
                };
                Insert: {
                    id?: string;
                    ordered_qty: number;
                    po_id: string;
                    received_qty?: number | null;
                    sku_id: string;
                    unit_cost?: number | null;
                };
                Update: {
                    id?: string;
                    ordered_qty?: number;
                    po_id?: string;
                    received_qty?: number | null;
                    sku_id?: string;
                    unit_cost?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'purchase_order_items_po_id_fkey';
                        columns: ['po_id'];
                        isOneToOne: false;
                        referencedRelation: 'inv_purchase_orders';
                        referencedColumns: ['id'];
                    },
                ];
            };
            inv_purchase_orders: {
                Row: {
                    created_at: string | null;
                    created_by: string | null;
                    display_id: string | null;
                    docket_number: string | null;
                    expected_date: string | null;
                    id: string;
                    order_number: string;
                    requisition_id: string | null;
                    status: Database['public']['Enums']['po_status'] | null;
                    tenant_id: string;
                    transporter_contact: string | null;
                    transporter_name: string | null;
                    updated_at: string | null;
                    vendor_name: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    created_by?: string | null;
                    display_id?: string | null;
                    docket_number?: string | null;
                    expected_date?: string | null;
                    id?: string;
                    order_number: string;
                    requisition_id?: string | null;
                    status?: Database['public']['Enums']['po_status'] | null;
                    tenant_id: string;
                    transporter_contact?: string | null;
                    transporter_name?: string | null;
                    updated_at?: string | null;
                    vendor_name?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    created_by?: string | null;
                    display_id?: string | null;
                    docket_number?: string | null;
                    expected_date?: string | null;
                    id?: string;
                    order_number?: string;
                    requisition_id?: string | null;
                    status?: Database['public']['Enums']['po_status'] | null;
                    tenant_id?: string;
                    transporter_contact?: string | null;
                    transporter_name?: string | null;
                    updated_at?: string | null;
                    vendor_name?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'purchase_orders_requisition_id_fkey';
                        columns: ['requisition_id'];
                        isOneToOne: false;
                        referencedRelation: 'inv_requisitions';
                        referencedColumns: ['id'];
                    },
                ];
            };
            inv_req_items: {
                Row: {
                    id: string;
                    notes: string | null;
                    quantity: number | null;
                    requisition_id: string | null;
                    sku_id: string;
                };
                Insert: {
                    id?: string;
                    notes?: string | null;
                    quantity?: number | null;
                    requisition_id?: string | null;
                    sku_id: string;
                };
                Update: {
                    id?: string;
                    notes?: string | null;
                    quantity?: number | null;
                    requisition_id?: string | null;
                    sku_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'purchase_requisition_items_requisition_id_fkey';
                        columns: ['requisition_id'];
                        isOneToOne: false;
                        referencedRelation: 'inv_requisitions';
                        referencedColumns: ['id'];
                    },
                ];
            };
            inv_requisitions: {
                Row: {
                    created_at: string | null;
                    customer_name: string | null;
                    display_id: string | null;
                    id: string;
                    requested_by: string | null;
                    status: string | null;
                    tenant_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    customer_name?: string | null;
                    display_id?: string | null;
                    id?: string;
                    requested_by?: string | null;
                    status?: string | null;
                    tenant_id: string;
                };
                Update: {
                    created_at?: string | null;
                    customer_name?: string | null;
                    display_id?: string | null;
                    id?: string;
                    requested_by?: string | null;
                    status?: string | null;
                    tenant_id?: string;
                };
                Relationships: [];
            };
            inv_stock: {
                Row: {
                    chassis_number: string;
                    created_at: string | null;
                    current_owner_id: string;
                    dealer_price: number | null;
                    engine_number: string;
                    id: string;
                    invoice_date: string | null;
                    offer_price: number | null;
                    sku_id: string;
                    status: Database['public']['Enums']['inventory_status'] | null;
                    updated_at: string | null;
                };
                Insert: {
                    chassis_number: string;
                    created_at?: string | null;
                    current_owner_id: string;
                    dealer_price?: number | null;
                    engine_number: string;
                    id?: string;
                    invoice_date?: string | null;
                    offer_price?: number | null;
                    sku_id: string;
                    status?: Database['public']['Enums']['inventory_status'] | null;
                    updated_at?: string | null;
                };
                Update: {
                    chassis_number?: string;
                    created_at?: string | null;
                    current_owner_id?: string;
                    dealer_price?: number | null;
                    engine_number?: string;
                    id?: string;
                    invoice_date?: string | null;
                    offer_price?: number | null;
                    sku_id?: string;
                    status?: Database['public']['Enums']['inventory_status'] | null;
                    updated_at?: string | null;
                };
                Relationships: [];
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
                    {
                        foreignKeyName: 'mat_market_summary_family_id_fkey';
                        columns: ['family_id'];
                        isOneToOne: false;
                        referencedRelation: 'cat_items';
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
                ];
            };
            registration_rules: {
                Row: {
                    bh_tenure: number | null;
                    company_multiplier: number | null;
                    components: Json;
                    created_at: string | null;
                    display_id: string | null;
                    id: string;
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
            sys_analytics_events: {
                Row: {
                    created_at: string | null;
                    event_name: string | null;
                    event_type: string;
                    id: string;
                    metadata: Json | null;
                    page_path: string;
                    session_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    event_name?: string | null;
                    event_type: string;
                    id?: string;
                    metadata?: Json | null;
                    page_path: string;
                    session_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    event_name?: string | null;
                    event_type?: string;
                    id?: string;
                    metadata?: Json | null;
                    page_path?: string;
                    session_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'analytics_events_session_id_fkey';
                        columns: ['session_id'];
                        isOneToOne: false;
                        referencedRelation: 'sys_analytics_sessions';
                        referencedColumns: ['id'];
                    },
                ];
            };
            sys_analytics_sessions: {
                Row: {
                    anonymous_id: string | null;
                    browser_name: string | null;
                    country: string | null;
                    device_type: string | null;
                    id: string;
                    ip_address: unknown;
                    last_active_at: string | null;
                    latitude: number | null;
                    longitude: number | null;
                    os_name: string | null;
                    referrer: string | null;
                    started_at: string | null;
                    taluka: string | null;
                    user_agent: string | null;
                    user_id: string | null;
                };
                Insert: {
                    anonymous_id?: string | null;
                    browser_name?: string | null;
                    country?: string | null;
                    device_type?: string | null;
                    id?: string;
                    ip_address?: unknown;
                    last_active_at?: string | null;
                    latitude?: number | null;
                    longitude?: number | null;
                    os_name?: string | null;
                    referrer?: string | null;
                    started_at?: string | null;
                    taluka?: string | null;
                    user_agent?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    anonymous_id?: string | null;
                    browser_name?: string | null;
                    country?: string | null;
                    device_type?: string | null;
                    id?: string;
                    ip_address?: unknown;
                    last_active_at?: string | null;
                    latitude?: number | null;
                    longitude?: number | null;
                    os_name?: string | null;
                    referrer?: string | null;
                    started_at?: string | null;
                    taluka?: string | null;
                    user_agent?: string | null;
                    user_id?: string | null;
                };
                Relationships: [];
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
            sys_error_log: {
                Row: {
                    affected_table: string | null;
                    created_at: string | null;
                    error_message: string | null;
                    function_name: string | null;
                    id: string;
                    resolved_at: string | null;
                    severity: string | null;
                    source_file: string | null;
                    stack_trace: string | null;
                    status: string | null;
                    tenant_id: string | null;
                    user_id: string | null;
                };
                Insert: {
                    affected_table?: string | null;
                    created_at?: string | null;
                    error_message?: string | null;
                    function_name?: string | null;
                    id?: string;
                    resolved_at?: string | null;
                    severity?: string | null;
                    source_file?: string | null;
                    stack_trace?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    affected_table?: string | null;
                    created_at?: string | null;
                    error_message?: string | null;
                    function_name?: string | null;
                    id?: string;
                    resolved_at?: string | null;
                    severity?: string | null;
                    source_file?: string | null;
                    stack_trace?: string | null;
                    status?: string | null;
                    tenant_id?: string | null;
                    user_id?: string | null;
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
                    updated_at: string | null;
                };
                Insert: {
                    default_owner_tenant_id?: string | null;
                    id?: string;
                    updated_at?: string | null;
                };
                Update: {
                    default_owner_tenant_id?: string | null;
                    id?: string;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never;
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
            get_item_descendants_tree: {
                Args: { root_id: string };
                Returns: {
                    brand_id: string | null;
                    category: string | null;
                    created_at: string | null;
                    created_by: string | null;
                    gallery_urls: Json | null;
                    history: Json | null;
                    hsn_code: string | null;
                    id: string;
                    image_url: string | null;
                    inclusion_type: string | null;
                    is_flipped: boolean | null;
                    is_primary: boolean | null;
                    item_tax_rate: number | null;
                    name: string;
                    offset_x: number | null;
                    offset_y: number | null;
                    parent_id: string | null;
                    position: number | null;
                    price_base: number | null;
                    sku_code: string | null;
                    slug: string | null;
                    specs: Json | null;
                    status: string | null;
                    tenant_id: string | null;
                    type: string;
                    updated_at: string | null;
                    updated_by: string | null;
                    video_url: string | null;
                    zoom_factor: number | null;
                }[];
                SetofOptions: {
                    from: '*';
                    to: 'cat_items';
                    isOneToOne: false;
                    isSetofReturn: true;
                };
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
                | 'COMPLIANCE'
                | 'DELIVERED';
            fuel_type: 'PETROL' | 'ELECTRIC' | 'CNG' | 'HYBRID';
            inventory_status: 'IN_TRANSIT' | 'AVAILABLE' | 'BOOKED' | 'SOLD' | 'ALLOCATED';
            inventory_transaction_type: 'OEM_ALLOCATION' | 'DEALER_TRANSFER' | 'CUSTOMER_SALE' | 'STOCK_ADJUSTMENT';
            lead_status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'BOOKED' | 'DELIVERED' | 'CLOSED' | 'LOST';
            po_status: 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED';
            power_unit: 'CC' | 'KW';
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
                'COMPLIANCE',
                'DELIVERED',
            ],
            fuel_type: ['PETROL', 'ELECTRIC', 'CNG', 'HYBRID'],
            inventory_status: ['IN_TRANSIT', 'AVAILABLE', 'BOOKED', 'SOLD', 'ALLOCATED'],
            inventory_transaction_type: ['OEM_ALLOCATION', 'DEALER_TRANSFER', 'CUSTOMER_SALE', 'STOCK_ADJUSTMENT'],
            lead_status: ['NEW', 'CONTACTED', 'QUOTED', 'BOOKED', 'DELIVERED', 'CLOSED', 'LOST'],
            po_status: ['DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELLED'],
            power_unit: ['CC', 'KW'],
            tenant_type: ['MARKETPLACE', 'DEALER', 'BANK', 'SUPER_ADMIN'],
            vehicle_category: ['MOTORCYCLE', 'SCOOTER', 'MOPED', 'ELECTRIC_BIKE', 'ELECTRIC_SCOOTER'],
        },
    },
} as const;
