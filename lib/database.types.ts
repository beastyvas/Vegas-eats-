// Mirrors `supabase gen types typescript` output for this project.
// Regenerate with: npx supabase gen types typescript --project-id <ref> --schema public > lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_emails: {
        Row: {
          email: string
        }
        Insert: {
          email: string
        }
        Update: {
          email?: string
        }
        Relationships: []
      }
      agent_jobs: {
        Row: {
          agent: string
          attempts: number
          created_at: string
          finished_at: string | null
          id: string
          last_error: string | null
          payload: Json
          run_after: string
          status: string
        }
        Insert: {
          agent: string
          attempts?: number
          created_at?: string
          finished_at?: string | null
          id?: string
          last_error?: string | null
          payload?: Json
          run_after?: string
          status?: string
        }
        Update: {
          agent?: string
          attempts?: number
          created_at?: string
          finished_at?: string | null
          id?: string
          last_error?: string | null
          payload?: Json
          run_after?: string
          status?: string
        }
        Relationships: []
      }
      agent_runs: {
        Row: {
          agent: string
          cost_usd: number
          error: string | null
          finished_at: string | null
          id: string
          input: Json
          input_tokens: number
          model: string | null
          output: Json | null
          output_tokens: number
          sources: string[]
          started_at: string
          status: string
          web_search_requests: number
        }
        Insert: {
          agent: string
          cost_usd?: number
          error?: string | null
          finished_at?: string | null
          id?: string
          input?: Json
          input_tokens?: number
          model?: string | null
          output?: Json | null
          output_tokens?: number
          sources?: string[]
          started_at?: string
          status?: string
          web_search_requests?: number
        }
        Update: {
          agent?: string
          cost_usd?: number
          error?: string | null
          finished_at?: string | null
          id?: string
          input?: Json
          input_tokens?: number
          model?: string | null
          output?: Json | null
          output_tokens?: number
          sources?: string[]
          started_at?: string
          status?: string
          web_search_requests?: number
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          description: string | null
          key: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          value?: Json
        }
        Relationships: []
      }
      areas: {
        Row: {
          blurb: string | null
          centroid_lat: number
          centroid_lng: number
          id: number
          name: string
          slug: string
          sort: number
        }
        Insert: {
          blurb?: string | null
          centroid_lat: number
          centroid_lng: number
          id?: never
          name: string
          slug: string
          sort?: number
        }
        Update: {
          blurb?: string | null
          centroid_lat?: number
          centroid_lng?: number
          id?: never
          name?: string
          slug?: string
          sort?: number
        }
        Relationships: []
      }
      candidates: {
        Row: {
          address: string | null
          admin_note: string | null
          agent_run_id: string | null
          area: string | null
          categories: string[]
          confidence: number | null
          created_at: string
          dedupe_key: string
          dishes: string | null
          duplicate_of: string | null
          email: string | null
          growth: Database["public"]["Enums"]["listing_type"][]
          how_to_buy: string | null
          id: string
          listing_id: string | null
          name: string
          origin_draft: string | null
          phone: string | null
          raw: Json
          reviewed_at: string | null
          reviewed_by: string | null
          seed_note: string | null
          socials: Json
          source: string
          source_file: string | null
          source_urls: string[]
          status: Database["public"]["Enums"]["candidate_status"]
          type: Database["public"]["Enums"]["listing_type"] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          admin_note?: string | null
          agent_run_id?: string | null
          area?: string | null
          categories?: string[]
          confidence?: number | null
          created_at?: string
          dedupe_key: string
          dishes?: string | null
          duplicate_of?: string | null
          email?: string | null
          growth?: Database["public"]["Enums"]["listing_type"][]
          how_to_buy?: string | null
          id?: string
          listing_id?: string | null
          name: string
          origin_draft?: string | null
          phone?: string | null
          raw?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          seed_note?: string | null
          socials?: Json
          source: string
          source_file?: string | null
          source_urls?: string[]
          status?: Database["public"]["Enums"]["candidate_status"]
          type?: Database["public"]["Enums"]["listing_type"] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          admin_note?: string | null
          agent_run_id?: string | null
          area?: string | null
          categories?: string[]
          confidence?: number | null
          created_at?: string
          dedupe_key?: string
          dishes?: string | null
          duplicate_of?: string | null
          email?: string | null
          growth?: Database["public"]["Enums"]["listing_type"][]
          how_to_buy?: string | null
          id?: string
          listing_id?: string | null
          name?: string
          origin_draft?: string | null
          phone?: string | null
          raw?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          seed_note?: string | null
          socials?: Json
          source?: string
          source_file?: string | null
          source_urls?: string[]
          status?: Database["public"]["Enums"]["candidate_status"]
          type?: Database["public"]["Enums"]["listing_type"] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_agent_run_id_fkey"
            columns: ["agent_run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          blurb: string | null
          emoji: string | null
          id: number
          is_active: boolean
          name: string
          slug: string
          sort: number
        }
        Insert: {
          blurb?: string | null
          emoji?: string | null
          id?: never
          is_active?: boolean
          name: string
          slug: string
          sort?: number
        }
        Update: {
          blurb?: string | null
          emoji?: string | null
          id?: never
          is_active?: boolean
          name?: string
          slug?: string
          sort?: number
        }
        Relationships: []
      }
      chain_checks: {
        Row: {
          admin_decision: Database["public"]["Enums"]["chain_verdict"] | null
          agent_run_id: string | null
          candidate_id: string | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          evidence_urls: string[]
          id: string
          is_franchise: boolean | null
          listing_id: string | null
          nevada_locations: number | null
          out_of_state_locations: number | null
          reasoning: string | null
          verdict: Database["public"]["Enums"]["chain_verdict"]
        }
        Insert: {
          admin_decision?: Database["public"]["Enums"]["chain_verdict"] | null
          agent_run_id?: string | null
          candidate_id?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          evidence_urls?: string[]
          id?: string
          is_franchise?: boolean | null
          listing_id?: string | null
          nevada_locations?: number | null
          out_of_state_locations?: number | null
          reasoning?: string | null
          verdict: Database["public"]["Enums"]["chain_verdict"]
        }
        Update: {
          admin_decision?: Database["public"]["Enums"]["chain_verdict"] | null
          agent_run_id?: string | null
          candidate_id?: string | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          evidence_urls?: string[]
          id?: string
          is_franchise?: boolean | null
          listing_id?: string | null
          nevada_locations?: number | null
          out_of_state_locations?: number | null
          reasoning?: string | null
          verdict?: Database["public"]["Enums"]["chain_verdict"]
        }
        Relationships: [
          {
            foreignKeyName: "chain_checks_agent_run_id_fkey"
            columns: ["agent_run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chain_checks_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chain_checks_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          address: string | null
          area_id: number | null
          created_at: string
          ends_at: string
          id: string
          lat: number | null
          listing_id: string
          lng: number | null
          location_name: string
          note: string | null
          posted_by: string | null
          starts_at: string
        }
        Insert: {
          address?: string | null
          area_id?: number | null
          created_at?: string
          ends_at: string
          id?: string
          lat?: number | null
          listing_id: string
          lng?: number | null
          location_name: string
          note?: string | null
          posted_by?: string | null
          starts_at?: string
        }
        Update: {
          address?: string | null
          area_id?: number | null
          created_at?: string
          ends_at?: string
          id?: string
          lat?: number | null
          listing_id?: string
          lng?: number | null
          location_name?: string
          note?: string | null
          posted_by?: string | null
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_codes: {
        Row: {
          attempts: number
          claim_id: string
          code_hash: string
          expires_at: string
        }
        Insert: {
          attempts?: number
          claim_id: string
          code_hash: string
          expires_at: string
        }
        Update: {
          attempts?: number
          claim_id?: string
          code_hash?: string
          expires_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_codes_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: true
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          contact_note: string | null
          created_at: string
          evidence: string | null
          id: string
          listing_id: string
          method: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["review_status"]
          user_id: string
        }
        Insert: {
          contact_note?: string | null
          created_at?: string
          evidence?: string | null
          id?: string
          listing_id: string
          method: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          user_id: string
        }
        Update: {
          contact_note?: string | null
          created_at?: string
          evidence?: string | null
          id?: string
          listing_id?: string
          method?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claims_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      edit_requests: {
        Row: {
          changes: Json
          created_at: string
          id: string
          listing_id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["review_status"]
          user_id: string
        }
        Insert: {
          changes: Json
          created_at?: string
          id?: string
          listing_id: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          user_id: string
        }
        Update: {
          changes?: Json
          created_at?: string
          id?: string
          listing_id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edit_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          id: number
          kind: string
          listing_id: string | null
          referrer_host: string | null
          session_hash: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          kind: string
          listing_id?: string | null
          referrer_host?: string | null
          session_hash?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          kind?: string
          listing_id?: string | null
          referrer_host?: string | null
          session_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      flags: {
        Row: {
          agent_run_id: string | null
          created_at: string
          created_by: string | null
          detail: string | null
          evidence_urls: string[]
          id: string
          kind: string
          listing_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          vouch_id: string | null
        }
        Insert: {
          agent_run_id?: string | null
          created_at?: string
          created_by?: string | null
          detail?: string | null
          evidence_urls?: string[]
          id?: string
          kind: string
          listing_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          vouch_id?: string | null
        }
        Update: {
          agent_run_id?: string | null
          created_at?: string
          created_by?: string | null
          detail?: string | null
          evidence_urls?: string[]
          id?: string
          kind?: string
          listing_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          vouch_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flags_agent_run_id_fkey"
            columns: ["agent_run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flags_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flags_vouch_id_fkey"
            columns: ["vouch_id"]
            isOneToOne: false
            referencedRelation: "vouches"
            referencedColumns: ["id"]
          },
        ]
      }
      license_verifications: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          license_kind: string
          license_number: string
          listing_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["review_status"]
          submitted_by: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          license_kind?: string
          license_number: string
          listing_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          submitted_by: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          license_kind?: string
          license_number?: string
          listing_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          submitted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_verifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_categories: {
        Row: {
          category_id: number
          listing_id: string
        }
        Insert: {
          category_id: number
          listing_id: string
        }
        Update: {
          category_id?: number
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_categories_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_hours: {
        Row: {
          closes: string
          dow: number
          id: number
          listing_id: string
          opens: string
        }
        Insert: {
          closes: string
          dow: number
          id?: never
          listing_id: string
          opens: string
        }
        Update: {
          closes?: string
          dow?: number
          id?: never
          listing_id?: string
          opens?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_hours_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_owners: {
        Row: {
          listing_id: string
          user_id: string
          verified_at: string
        }
        Insert: {
          listing_id: string
          user_id: string
          verified_at?: string
        }
        Update: {
          listing_id?: string
          user_id?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_owners_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_photos: {
        Row: {
          alt_text: string
          created_at: string
          height: number | null
          id: string
          is_owner_face: boolean
          listing_id: string
          sort: number
          storage_path: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text: string
          created_at?: string
          height?: number | null
          id?: string
          is_owner_face?: boolean
          listing_id: string
          sort?: number
          storage_path: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string
          created_at?: string
          height?: number | null
          id?: string
          is_owner_face?: boolean
          listing_id?: string
          sort?: number
          storage_path?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_socials: {
        Row: {
          handle: string | null
          id: number
          listing_id: string
          platform: string
          url: string
        }
        Insert: {
          handle?: string | null
          id?: never
          listing_id: string
          platform: string
          url: string
        }
        Update: {
          handle?: string | null
          id?: never
          listing_id?: string
          platform?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_socials_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_stats_daily: {
        Row: {
          clicks_directions: number
          clicks_instagram: number
          clicks_order: number
          clicks_other: number
          clicks_phone: number
          clicks_website: number
          day: string
          listing_id: string
          views: number
          vouches: number
        }
        Insert: {
          clicks_directions?: number
          clicks_instagram?: number
          clicks_order?: number
          clicks_other?: number
          clicks_phone?: number
          clicks_website?: number
          day: string
          listing_id: string
          views?: number
          vouches?: number
        }
        Update: {
          clicks_directions?: number
          clicks_instagram?: number
          clicks_order?: number
          clicks_other?: number
          clicks_phone?: number
          clicks_website?: number
          day?: string
          listing_id?: string
          views?: number
          vouches?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_stats_daily_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          area_id: number | null
          city: string | null
          created_at: string
          email: string | null
          founded_year: number | null
          growth_path: Json
          heat_score: number
          heat_updated_at: string | null
          how_to_buy: Json
          id: string
          is_featured: boolean
          last_seen_active_at: string | null
          lat: number | null
          license_number: string | null
          license_verified_at: string | null
          lng: number | null
          name: string
          order_url: string | null
          origin_story: string | null
          phone: string | null
          price_level: number | null
          published_at: string | null
          search_tsv: unknown
          show_email: boolean
          show_phone: boolean
          slug: string
          status: Database["public"]["Enums"]["listing_status"]
          story_hook: string | null
          street_address: string | null
          type: Database["public"]["Enums"]["listing_type"]
          updated_at: string
          vouch_local_count: number
          vouch_total_count: number
          website: string | null
          what_to_order: string | null
          zip: string | null
        }
        Insert: {
          area_id?: number | null
          city?: string | null
          created_at?: string
          email?: string | null
          founded_year?: number | null
          growth_path?: Json
          heat_score?: number
          heat_updated_at?: string | null
          how_to_buy?: Json
          id?: string
          is_featured?: boolean
          last_seen_active_at?: string | null
          lat?: number | null
          license_number?: string | null
          license_verified_at?: string | null
          lng?: number | null
          name: string
          order_url?: string | null
          origin_story?: string | null
          phone?: string | null
          price_level?: number | null
          published_at?: string | null
          search_tsv?: unknown
          show_email?: boolean
          show_phone?: boolean
          slug: string
          status?: Database["public"]["Enums"]["listing_status"]
          story_hook?: string | null
          street_address?: string | null
          type: Database["public"]["Enums"]["listing_type"]
          updated_at?: string
          vouch_local_count?: number
          vouch_total_count?: number
          website?: string | null
          what_to_order?: string | null
          zip?: string | null
        }
        Update: {
          area_id?: number | null
          city?: string | null
          created_at?: string
          email?: string | null
          founded_year?: number | null
          growth_path?: Json
          heat_score?: number
          heat_updated_at?: string | null
          how_to_buy?: Json
          id?: string
          is_featured?: boolean
          last_seen_active_at?: string | null
          lat?: number | null
          license_number?: string | null
          license_verified_at?: string | null
          lng?: number | null
          name?: string
          order_url?: string | null
          origin_story?: string | null
          phone?: string | null
          price_level?: number | null
          published_at?: string | null
          search_tsv?: unknown
          show_email?: boolean
          show_phone?: boolean
          slug?: string
          status?: Database["public"]["Enums"]["listing_status"]
          story_hook?: string | null
          street_address?: string | null
          type?: Database["public"]["Enums"]["listing_type"]
          updated_at?: string
          vouch_local_count?: number
          vouch_total_count?: number
          website?: string | null
          what_to_order?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach: {
        Row: {
          body: string
          channel: string
          created_at: string
          id: string
          listing_id: string
          recipient: string | null
          sent_at: string | null
          sent_by: string | null
          status: string
          subject: string | null
        }
        Insert: {
          body: string
          channel: string
          created_at?: string
          id?: string
          listing_id: string
          recipient?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          id?: string
          listing_id?: string
          recipient?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          is_valley: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          zip: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          is_valley?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          zip?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_valley?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      schedules: {
        Row: {
          address: string | null
          area_id: number | null
          created_at: string
          created_by: string | null
          dow: number
          ends: string
          id: string
          lat: number | null
          listing_id: string
          lng: number | null
          location_name: string
          notes: string | null
          source: string
          starts: string
        }
        Insert: {
          address?: string | null
          area_id?: number | null
          created_at?: string
          created_by?: string | null
          dow: number
          ends: string
          id?: string
          lat?: number | null
          listing_id: string
          lng?: number | null
          location_name: string
          notes?: string | null
          source?: string
          starts: string
        }
        Update: {
          address?: string | null
          area_id?: number | null
          created_at?: string
          created_by?: string | null
          dow?: number
          ends?: string
          id?: string
          lat?: number | null
          listing_id?: string
          lng?: number | null
          location_name?: string
          notes?: string | null
          source?: string
          starts?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      searches: {
        Row: {
          created_at: string
          filters: Json
          id: number
          query: string | null
          result_count: number
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: never
          query?: string | null
          result_count: number
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: never
          query?: string | null
          result_count?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          listing_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          listing_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          listing_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          agent_run_id: string | null
          created_at: string
          field: string | null
          id: string
          kind: string
          listing_id: string
          rationale: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_urls: string[]
          status: Database["public"]["Enums"]["review_status"]
          value: Json
        }
        Insert: {
          agent_run_id?: string | null
          created_at?: string
          field?: string | null
          id?: string
          kind?: string
          listing_id: string
          rationale?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_urls?: string[]
          status?: Database["public"]["Enums"]["review_status"]
          value: Json
        }
        Update: {
          agent_run_id?: string | null
          created_at?: string
          field?: string | null
          id?: string
          kind?: string
          listing_id?: string
          rationale?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_urls?: string[]
          status?: Database["public"]["Enums"]["review_status"]
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_agent_run_id_fkey"
            columns: ["agent_run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      valley_zips: {
        Row: {
          zip: string
        }
        Insert: {
          zip: string
        }
        Update: {
          zip?: string
        }
        Relationships: []
      }
      vouches: {
        Row: {
          created_at: string
          id: string
          is_local: boolean
          listing_id: string
          note: string | null
          user_id: string
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_local?: boolean
          listing_id: string
          note?: string | null
          user_id: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_local?: boolean
          listing_id?: string
          note?: string | null
          user_id?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vouches_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_open_at: {
        Args: { p_at?: string; p_listing: string }
        Returns: boolean
      }
      refresh_heat: {
        Args: { p_non_valley_weight?: number }
        Returns: number
      }
      search_listings: {
        Args: { q?: string; p_type?: Database["public"]["Enums"]["listing_type"]; p_category?: string; p_area?: string; p_open?: boolean; p_licensed?: boolean; p_max_price?: number; p_limit?: number }
        Returns: { id: string; rank: number }[]
      }
    }
    Enums: {
      candidate_status: "new" | "approved" | "rejected" | "chain" | "duplicate"
      chain_verdict: "local" | "chain" | "unsure"
      listing_status: "draft" | "published" | "hidden" | "closed"
      listing_type: "home_seller" | "pop_up" | "food_truck" | "restaurant"
      review_status: "pending" | "approved" | "rejected"
      user_role: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]

export const Constants = {
  public: {
    Enums: {
      candidate_status: ["new", "approved", "rejected", "chain", "duplicate"],
      chain_verdict: ["local", "chain", "unsure"],
      listing_status: ["draft", "published", "hidden", "closed"],
      listing_type: ["home_seller", "pop_up", "food_truck", "restaurant"],
      review_status: ["pending", "approved", "rejected"],
      user_role: ["user", "admin"],
    },
  },
} as const
