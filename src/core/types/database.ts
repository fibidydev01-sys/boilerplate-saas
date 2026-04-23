export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // ------------------------------------------------------------
      // Existing Phase 1 tables (unchanged)
      // ------------------------------------------------------------
      user_profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          role: string;
          avatar_url: string | null;
          phone: string | null;
          locale: string;
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          email?: string | null;
          role?: string;
          avatar_url?: string | null;
          phone?: string | null;
          locale?: string;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string | null;
          role?: string;
          avatar_url?: string | null;
          phone?: string | null;
          locale?: string;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          resource_type?: string | null;
          resource_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          resource_type?: string | null;
          resource_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      stripe_events: {
        Row: {
          id: string;
          type: string;
          api_version: string | null;
          payload: Json;
          received_at: string;
          processed_at: string | null;
          error: string | null;
          retry_count: number;
        };
        Insert: {
          id: string;
          type: string;
          api_version?: string | null;
          payload: Json;
          received_at?: string;
          processed_at?: string | null;
          error?: string | null;
          retry_count?: number;
        };
        Update: {
          id?: string;
          type?: string;
          api_version?: string | null;
          payload?: Json;
          received_at?: string;
          processed_at?: string | null;
          error?: string | null;
          retry_count?: number;
        };
        Relationships: [];
      };

      commerce_credentials: {
        Row: {
          id: string;
          owner_user_id: string;
          provider: string;
          encrypted_api_key: string;
          key_hint: string;
          store_id: string | null;
          store_name: string | null;
          is_test_mode: boolean;
          last_verified_at: string | null;
          last_used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          provider?: string;
          encrypted_api_key: string;
          key_hint: string;
          store_id?: string | null;
          store_name?: string | null;
          is_test_mode?: boolean;
          last_verified_at?: string | null;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          provider?: string;
          encrypted_api_key?: string;
          key_hint?: string;
          store_id?: string | null;
          store_name?: string | null;
          is_test_mode?: boolean;
          last_verified_at?: string | null;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ------------------------------------------------------------
      // Phase 2 tables
      // ------------------------------------------------------------
      commerce_webhook_configs: {
        Row: {
          id: string;
          owner_user_id: string;
          provider: string;
          encrypted_secret: string;
          secret_hint: string;
          webhook_token: string;
          ls_webhook_id: string | null;
          subscribed_events: string[];
          is_active: boolean;
          last_event_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          provider?: string;
          encrypted_secret: string;
          secret_hint: string;
          webhook_token: string;
          ls_webhook_id?: string | null;
          subscribed_events?: string[];
          is_active?: boolean;
          last_event_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          provider?: string;
          encrypted_secret?: string;
          secret_hint?: string;
          webhook_token?: string;
          ls_webhook_id?: string | null;
          subscribed_events?: string[];
          is_active?: boolean;
          last_event_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      commerce_webhook_events: {
        Row: {
          id: string;
          owner_user_id: string;
          provider: string;
          event_id: string;
          event_name: string;
          payload: Json;
          signature: string | null;
          verified: boolean;
          processed_at: string | null;
          error: string | null;
          received_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          provider?: string;
          event_id: string;
          event_name: string;
          payload: Json;
          signature?: string | null;
          verified?: boolean;
          processed_at?: string | null;
          error?: string | null;
          received_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          provider?: string;
          event_id?: string;
          event_name?: string;
          payload?: Json;
          signature?: string | null;
          verified?: boolean;
          processed_at?: string | null;
          error?: string | null;
          received_at?: string;
        };
        Relationships: [];
      };

      commerce_orders: {
        Row: {
          id: string;
          owner_user_id: string;
          provider: string;
          provider_order_id: string;
          order_number: number | null;
          identifier: string | null;
          customer_email: string | null;
          customer_name: string | null;
          customer_id: string | null;
          store_id: string | null;
          status: string;
          status_formatted: string | null;
          currency: string;
          subtotal: number;
          tax: number;
          total: number;
          refunded_amount: number;
          subtotal_formatted: string | null;
          total_formatted: string | null;
          tax_formatted: string | null;
          refunded_at: string | null;
          order_created_at: string | null;
          metadata: Json;
          raw_payload: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          provider?: string;
          provider_order_id: string;
          order_number?: number | null;
          identifier?: string | null;
          customer_email?: string | null;
          customer_name?: string | null;
          customer_id?: string | null;
          store_id?: string | null;
          status: string;
          status_formatted?: string | null;
          currency: string;
          subtotal?: number;
          tax?: number;
          total?: number;
          refunded_amount?: number;
          subtotal_formatted?: string | null;
          total_formatted?: string | null;
          tax_formatted?: string | null;
          refunded_at?: string | null;
          order_created_at?: string | null;
          metadata?: Json;
          raw_payload?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["commerce_orders"]["Insert"]>;
        Relationships: [];
      };

      commerce_subscriptions: {
        Row: {
          id: string;
          owner_user_id: string;
          provider: string;
          provider_subscription_id: string;
          order_id: string | null;
          order_item_id: string | null;
          product_id: string | null;
          variant_id: string | null;
          product_name: string | null;
          variant_name: string | null;
          customer_email: string | null;
          customer_name: string | null;
          customer_id: string | null;
          store_id: string | null;
          status: string;
          status_formatted: string | null;
          pause_mode: string | null;
          pause_resumes_at: string | null;
          card_brand: string | null;
          card_last_four: string | null;
          trial_ends_at: string | null;
          billing_anchor: number | null;
          renews_at: string | null;
          ends_at: string | null;
          subscription_created_at: string | null;
          metadata: Json;
          raw_payload: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          provider?: string;
          provider_subscription_id: string;
          order_id?: string | null;
          order_item_id?: string | null;
          product_id?: string | null;
          variant_id?: string | null;
          product_name?: string | null;
          variant_name?: string | null;
          customer_email?: string | null;
          customer_name?: string | null;
          customer_id?: string | null;
          store_id?: string | null;
          status: string;
          status_formatted?: string | null;
          pause_mode?: string | null;
          pause_resumes_at?: string | null;
          card_brand?: string | null;
          card_last_four?: string | null;
          trial_ends_at?: string | null;
          billing_anchor?: number | null;
          renews_at?: string | null;
          ends_at?: string | null;
          subscription_created_at?: string | null;
          metadata?: Json;
          raw_payload?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["commerce_subscriptions"]["Insert"]
        >;
        Relationships: [];
      };

      commerce_customers: {
        Row: {
          id: string;
          owner_user_id: string;
          provider: string;
          provider_customer_id: string;
          email: string | null;
          name: string | null;
          city: string | null;
          region: string | null;
          country: string | null;
          total_revenue_currency: number | null;
          mrr: number | null;
          status: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          provider?: string;
          provider_customer_id: string;
          email?: string | null;
          name?: string | null;
          city?: string | null;
          region?: string | null;
          country?: string | null;
          total_revenue_currency?: number | null;
          mrr?: number | null;
          status?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["commerce_customers"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: { check_user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];