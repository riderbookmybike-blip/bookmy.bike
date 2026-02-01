export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            analytics_events: {
                Row: {
                    created_at: string | null
                    event_name: string | null
                    event_type: string
                    id: string
                    metadata: Json | null
                    page_path: string | null
                    session_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    event_name?: string | null
                    event_type: string
                    id?: string
                    metadata?: Json | null
                    page_path?: string | null
                    session_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    event_name?: string | null
                    event_type?: string
                    id?: string
                    metadata?: Json | null
                    page_path?: string | null
                    session_id?: string | null
                }
            }
            analytics_sessions: {
                Row: {
                    browser_name: string | null
                    country: string | null
                    created_at: string | null
                    device_type: string | null
                    id: string
                    ip_address: string | null
                    last_active_at: string | null
                    latitude: number | null
                    longitude: number | null
                    os_name: string | null
                    taluka: string | null
                    user_agent: string | null
                    user_id: string | null
                }
                Insert: {
                    browser_name?: string | null
                    country?: string | null
                    created_at?: string | null
                    device_type?: string | null
                    id?: string
                    ip_address?: string | null
                    last_active_at?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    os_name?: string | null
                    taluka?: string | null
                    user_agent?: string | null
                    user_id?: string | null
                }
                Update: {
                    browser_name?: string | null
                    country?: string | null
                    created_at?: string | null
                    device_type?: string | null
                    id?: string
                    ip_address?: string | null
                    last_active_at?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    os_name?: string | null
                    taluka?: string | null
                    user_agent?: string | null
                    user_id?: string | null
                }
            }
            cat_brands: {
                Row: {
                    created_at: string | null
                    id: string
                    logo_svg: string | null
                    name: string
                    slug: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    logo_svg?: string | null
                    name: string
                    slug?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    logo_svg?: string | null
                    name?: string
                    slug?: string | null
                }
            }
            cat_items: {
                Row: {
                    brand_id: string | null
                    created_at: string | null
                    created_by: string | null
                    gallery_urls: Json | null
                    hsn_code: string | null
                    id: string
                    image_url: string | null
                    inclusion_type: string | null
                    is_flipped: boolean | null
                    is_primary: boolean | null
                    item_tax_rate: number | null
                    name: string
                    offset_x: number | null
                    offset_y: number | null
                    parent_id: string | null
                    position: number | null
                    price_base: number | null
                    sku_code: string | null
                    slug: string | null
                    specs: Json | null
                    status: string | null
                    template_id: string | null
                    tenant_id: string | null
                    type: string
                    updated_at: string | null
                    updated_by: string | null
                    zoom_factor: number | null
                }
                Insert: {
                    brand_id?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    gallery_urls?: Json | null
                    hsn_code?: string | null
                    id?: string
                    image_url?: string | null
                    inclusion_type?: string | null
                    is_flipped?: boolean | null
                    is_primary?: boolean | null
                    item_tax_rate?: number | null
                    name: string
                    offset_x?: number | null
                    offset_y?: number | null
                    parent_id?: string | null
                    position?: number | null
                    price_base?: number | null
                    sku_code?: string | null
                    slug?: string | null
                    specs?: Json | null
                    status?: string | null
                    template_id?: string | null
                    tenant_id?: string | null
                    type: string
                    updated_at?: string | null
                    updated_by?: string | null
                    zoom_factor?: number | null
                }
                Update: {
                    brand_id?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    gallery_urls?: Json | null
                    hsn_code?: string | null
                    id?: string
                    image_url?: string | null
                    inclusion_type?: string | null
                    is_flipped?: boolean | null
                    is_primary?: boolean | null
                    item_tax_rate?: number | null
                    name?: string
                    offset_x?: number | null
                    offset_y?: number | null
                    parent_id?: string | null
                    position?: number | null
                    price_base?: number | null
                    sku_code?: string | null
                    slug?: string | null
                    specs?: Json | null
                    status?: string | null
                    template_id?: string | null
                    tenant_id?: string | null
                    type?: string
                    updated_at?: string | null
                    updated_by?: string | null
                    zoom_factor?: number | null
                }
            }
            cat_templates: {
                Row: {
                    category: string
                    code: string
                    created_at: string | null
                    hierarchy_config: Json | null
                    id: string
                    name: string
                    tenant_id: string | null
                }
                Insert: {
                    category: string
                    code: string
                    created_at?: string | null
                    hierarchy_config?: Json | null
                    id?: string
                    name: string
                    tenant_id?: string | null
                }
                Update: {
                    category?: string
                    code?: string
                    created_at?: string | null
                    hierarchy_config?: Json | null
                    id?: string
                    name?: string
                    tenant_id?: string | null
                }
            }
            id_members: {
                Row: {
                    address: string | null
                    country: string | null
                    created_at: string | null
                    email: string | null
                    full_name: string | null
                    id: string
                    latitude: number | null
                    longitude: number | null
                    phone: string | null
                    pincode: string | null
                    role: string | null
                    state: string | null
                    taluka: string | null
                    tenant_id: string | null
                }
                Insert: {
                    address?: string | null
                    country?: string | null
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id?: string
                    latitude?: number | null
                    longitude?: number | null
                    phone?: string | null
                    pincode?: string | null
                    role?: string | null
                    state?: string | null
                    taluka?: string | null
                    tenant_id?: string | null
                }
                Update: {
                    address?: string | null
                    country?: string | null
                    created_at?: string | null
                    email?: string | null
                    full_name?: string | null
                    id?: string
                    latitude?: number | null
                    longitude?: number | null
                    phone?: string | null
                    pincode?: string | null
                    role?: string | null
                    state?: string | null
                    taluka?: string | null
                    tenant_id?: string | null
                }
            }
            loc_pincodes: {
                Row: {
                    city: string | null
                    created_at: string | null
                    district: string | null
                    id: string
                    latitude: number | null
                    longitude: number | null
                    pincode: string
                    state: string | null
                    state_code: string | null
                    taluka: string | null
                }
                Insert: {
                    city?: string | null
                    created_at?: string | null
                    district?: string | null
                    id?: string
                    latitude?: number | null
                    longitude?: number | null
                    pincode: string
                    state?: string | null
                    state_code?: string | null
                    taluka?: string | null
                }
                Update: {
                    city?: string | null
                    created_at?: string | null
                    district?: string | null
                    id?: string
                    latitude?: number | null
                    longitude?: number | null
                    pincode?: string
                    state?: string | null
                    state_code?: string | null
                    taluka?: string | null
                }
            }
            crm_leads: {
                Row: {
                    id: string
                    tenant_id: string | null
                    customer_pincode: string | null
                    owner_tenant_id: string | null
                    status: string | null
                    // ... adding only what's needed for now to move fast
                }
                Insert: { id?: string; tenant_id?: string | null; customer_pincode?: string | null; owner_tenant_id?: string | null; status?: string | null }
                Update: { id?: string; tenant_id?: string | null; customer_pincode?: string | null; owner_tenant_id?: string | null; status?: string | null }
            }
            cat_reg_rules: {
                Row: { id: string; state_code: string; status: string; district: string | null }
                Insert: { id?: string; state_code: string; status?: string; district?: string | null }
                Update: { id?: string; state_code?: string; status?: string; district?: string | null }
            }
            cat_ins_rules: {
                Row: { id: string; status: string; vehicle_type: string; state_code: string | null }
                Insert: { id?: string; status?: string; vehicle_type?: string; state_code?: string | null }
                Update: { id?: string; status?: string; vehicle_type?: string; state_code?: string | null }
            }
            cat_assets: {
                Row: { id: string; type: string; url: string; item_id: string; is_primary: boolean }
                Insert: { id?: string; type: string; url: string; item_id: string; is_primary?: boolean }
                Update: { id?: string; type?: string; url?: string; item_id?: string; is_primary?: boolean }
            }
            i18n_languages: {
                Row: {
                    code: string
                    name: string
                    native_name: string
                    status: string
                    provider: string
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    code: string
                    name: string
                    native_name: string
                    status?: string
                    provider?: string
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    code?: string
                    name?: string
                    native_name?: string
                    status?: string
                    provider?: string
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            i18n_source_strings: {
                Row: {
                    hash: string
                    text: string
                    context: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    hash: string
                    text: string
                    context?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    hash?: string
                    text?: string
                    context?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            i18n_translations: {
                Row: {
                    id: string
                    source_hash: string
                    language_code: string
                    translated_text: string
                    provider: string
                    source_text: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    source_hash: string
                    language_code: string
                    translated_text: string
                    provider?: string
                    source_text?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    source_hash?: string
                    language_code?: string
                    translated_text?: string
                    provider?: string
                    source_text?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            i18n_sync_runs: {
                Row: {
                    id: string
                    language_code: string
                    scope: string
                    status: string
                    started_at: string
                    completed_at: string | null
                    total_strings: number
                    new_strings: number
                    translated_strings: number
                    errors: number
                    details: Json | null
                }
                Insert: {
                    id?: string
                    language_code: string
                    scope?: string
                    status?: string
                    started_at?: string
                    completed_at?: string | null
                    total_strings?: number
                    new_strings?: number
                    translated_strings?: number
                    errors?: number
                    details?: Json | null
                }
                Update: {
                    id?: string
                    language_code?: string
                    scope?: string
                    status?: string
                    started_at?: string
                    completed_at?: string | null
                    total_strings?: number
                    new_strings?: number
                    translated_strings?: number
                    errors?: number
                    details?: Json | null
                }
            }
            vehicle_prices: {
                Row: { id: string; vehicle_color_id: string; state_code: string; ex_showroom_price: number; offer_amount: number | null }
                Insert: { id?: string; vehicle_color_id: string; state_code: string; ex_showroom_price: number; offer_amount?: number | null }
                Update: { id?: string; vehicle_color_id?: string; state_code?: string; ex_showroom_price?: number; offer_amount?: number | null }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_market_best_offers: {
                Args: {
                    p_state_code: string
                    p_district?: string
                }
                Returns: Json
            }
        }
        Enums: {
            lead_status: "NEW" | "CONTACTED" | "QUOTED" | "BOOKED" | "DELIVERED" | "CLOSED" | "LOST"
        }
    }
}
