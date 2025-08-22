export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      application_actions: {
        Row: {
          action: string
          application_id: string
          created_at: string
          id: string
          notes: string | null
          staff_id: string
        }
        Insert: {
          action: string
          application_id: string
          created_at?: string
          id?: string
          notes?: string | null
          staff_id: string
        }
        Update: {
          action?: string
          application_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_actions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_rate_limits: {
        Row: {
          application_count: number
          blocked_until: string | null
          email: string | null
          first_application: string
          id: string
          ip_address: unknown
          last_application: string
        }
        Insert: {
          application_count?: number
          blocked_until?: string | null
          email?: string | null
          first_application?: string
          id?: string
          ip_address: unknown
          last_application?: string
        }
        Update: {
          application_count?: number
          blocked_until?: string | null
          email?: string | null
          first_application?: string
          id?: string
          ip_address?: unknown
          last_application?: string
        }
        Relationships: []
      }
      application_types: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          form_fields: Json
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          form_fields?: Json
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          form_fields?: Json
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          age: number | null
          application_type_id: string
          character_backstory: string | null
          closed: boolean
          closed_at: string | null
          closed_by: string | null
          created_at: string
          discord_name: string | null
          discord_tag: string | null
          fivem_name: string | null
          form_data: Json | null
          id: string
          review_notes: string | null
          reviewed_by: string | null
          rp_experience: string | null
          status: string
          steam_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          application_type_id: string
          character_backstory?: string | null
          closed?: boolean
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          discord_name?: string | null
          discord_tag?: string | null
          fivem_name?: string | null
          form_data?: Json | null
          id?: string
          review_notes?: string | null
          reviewed_by?: string | null
          rp_experience?: string | null
          status?: string
          steam_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          application_type_id?: string
          character_backstory?: string | null
          closed?: boolean
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          discord_name?: string | null
          discord_tag?: string | null
          fivem_name?: string | null
          form_data?: Json | null
          id?: string
          review_notes?: string | null
          reviewed_by?: string | null
          rp_experience?: string | null
          status?: string
          steam_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_application_type_id_fkey"
            columns: ["application_type_id"]
            isOneToOne: false
            referencedRelation: "application_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_banned_users: {
        Row: {
          banned_at: string
          banned_by: string
          created_at: string
          id: string
          ip_address: unknown | null
          reason: string | null
          user_id: string | null
          visitor_email: string | null
          visitor_name: string | null
        }
        Insert: {
          banned_at?: string
          banned_by: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          reason?: string | null
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Update: {
          banned_at?: string
          banned_by?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          reason?: string | null
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string | null
          sender_type: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id?: string | null
          sender_type?: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string | null
          sender_type?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          assigned_to: string | null
          created_at: string
          ended_at: string | null
          id: string
          status: string
          updated_at: string
          user_id: string | null
          visitor_email: string | null
          visitor_name: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          visitor_email?: string | null
          visitor_name?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          subject: string
          template_type: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          subject: string
          template_type: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          subject?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      failed_login_attempts: {
        Row: {
          attempt_count: number
          blocked_until: string | null
          email: string | null
          first_attempt: string
          id: string
          ip_address: unknown
          last_attempt: string
          user_agent: string | null
        }
        Insert: {
          attempt_count?: number
          blocked_until?: string | null
          email?: string | null
          first_attempt?: string
          id?: string
          ip_address: unknown
          last_attempt?: string
          user_agent?: string | null
        }
        Update: {
          attempt_count?: number
          blocked_until?: string | null
          email?: string | null
          first_attempt?: string
          id?: string
          ip_address?: unknown
          last_attempt?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      individual_server_stats: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          max_players: number
          ping_ms: number
          players_online: number
          queue_count: number
          server_id: string
          server_online: boolean
          updated_at: string
          uptime_percentage: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          max_players?: number
          ping_ms?: number
          players_online?: number
          queue_count?: number
          server_id: string
          server_online?: boolean
          updated_at?: string
          uptime_percentage?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          max_players?: number
          ping_ms?: number
          players_online?: number
          queue_count?: number
          server_id?: string
          server_online?: boolean
          updated_at?: string
          uptime_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "individual_server_stats_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "servers"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          order_index: number
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          order_index?: number
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          order_index?: number
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_name: string
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned: boolean
          banned_at: string | null
          banned_by: string | null
          created_at: string | null
          discord_access_token: string | null
          discord_connected_at: string | null
          discord_discriminator: string | null
          discord_id: string | null
          discord_refresh_token: string | null
          discord_username: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          steam_id: string | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          banned?: boolean
          banned_at?: string | null
          banned_by?: string | null
          created_at?: string | null
          discord_access_token?: string | null
          discord_connected_at?: string | null
          discord_discriminator?: string | null
          discord_id?: string | null
          discord_refresh_token?: string | null
          discord_username?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          steam_id?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          banned?: boolean
          banned_at?: string | null
          banned_by?: string | null
          created_at?: string | null
          discord_access_token?: string | null
          discord_connected_at?: string | null
          discord_discriminator?: string | null
          discord_id?: string | null
          discord_refresh_token?: string | null
          discord_username?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          steam_id?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          permission_name: string
          role_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_name: string
          role_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_name?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_name_fkey"
            columns: ["permission_name"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "staff_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      rules: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_active: boolean
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          is_active?: boolean
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_active?: boolean
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      server_settings: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      server_stats: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          max_players: number
          ping_ms: number
          players_online: number
          queue_count: number
          server_online: boolean
          updated_at: string
          uptime_percentage: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          max_players?: number
          ping_ms?: number
          players_online?: number
          queue_count?: number
          server_online?: boolean
          updated_at?: string
          uptime_percentage?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          max_players?: number
          ping_ms?: number
          players_online?: number
          queue_count?: number
          server_online?: boolean
          updated_at?: string
          uptime_percentage?: number
        }
        Relationships: []
      }
      servers: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          ip_address: string
          is_active: boolean
          name: string
          port: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          ip_address: string
          is_active?: boolean
          name: string
          port?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          ip_address?: string
          is_active?: boolean
          name?: string
          port?: number
          updated_at?: string
        }
        Relationships: []
      }
      staff_roles: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_name: string
          hierarchy_level: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name: string
          hierarchy_level?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name?: string
          hierarchy_level?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          order_index: number
          role: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          order_index?: number
          role: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          order_index?: number
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      twitch_streamers: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          display_name: string | null
          id: string
          is_active: boolean
          order_index: number
          twitch_username: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          twitch_username: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          twitch_username?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      user_role_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "staff_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          last_activity: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown | null
          last_activity?: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          last_activity?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analytics_query: {
        Args: { query: string }
        Returns: {
          result: Json
        }[]
      }
      get_user_id_by_email: {
        Args: { _email: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: {
        Args: { _user_id: string }
        Returns: boolean
      }
      user_has_any_role: {
        Args: { _user_id: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
