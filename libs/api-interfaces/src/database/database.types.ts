export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      achievement_definitions: {
        Row: {
          category: string | null;
          created_at: string;
          description: string;
          difficulty: Database["public"]["Enums"]["achievement_difficulty"] | null;
          game_key: string;
          id: string;
          image_key: string | null;
          is_active: boolean;
          is_secret: boolean;
          metadata: Json;
          name: string;
          updated_at: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          description: string;
          difficulty?: Database["public"]["Enums"]["achievement_difficulty"] | null;
          game_key: string;
          id: string;
          image_key?: string | null;
          is_active?: boolean;
          is_secret?: boolean;
          metadata?: Json;
          name: string;
          updated_at?: string;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          description?: string;
          difficulty?: Database["public"]["Enums"]["achievement_difficulty"] | null;
          game_key?: string;
          id?: string;
          image_key?: string | null;
          is_active?: boolean;
          is_secret?: boolean;
          metadata?: Json;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_channel_memberships: {
        Row: {
          channel_id: string;
          id: number;
          joined_at: string;
          last_read_at: string | null;
          left_at: string | null;
          membership_role: Database["public"]["Enums"]["chat_membership_role"];
          muted_until: string | null;
          user_id: string;
        };
        Insert: {
          channel_id: string;
          id?: number;
          joined_at?: string;
          last_read_at?: string | null;
          left_at?: string | null;
          membership_role?: Database["public"]["Enums"]["chat_membership_role"];
          muted_until?: string | null;
          user_id: string;
        };
        Update: {
          channel_id?: string;
          id?: number;
          joined_at?: string;
          last_read_at?: string | null;
          left_at?: string | null;
          membership_role?: Database["public"]["Enums"]["chat_membership_role"];
          muted_until?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_channel_memberships_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "chat_channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_channel_memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      chat_channels: {
        Row: {
          archived_at: string | null;
          channel_type: Database["public"]["Enums"]["chat_channel_type"];
          created_at: string;
          created_by_user_id: string | null;
          external_session_id: string | null;
          game_key: string | null;
          id: string;
          metadata: Json;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          channel_type: Database["public"]["Enums"]["chat_channel_type"];
          created_at?: string;
          created_by_user_id?: string | null;
          external_session_id?: string | null;
          game_key?: string | null;
          id?: string;
          metadata?: Json;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          channel_type?: Database["public"]["Enums"]["chat_channel_type"];
          created_at?: string;
          created_by_user_id?: string | null;
          external_session_id?: string | null;
          game_key?: string | null;
          id?: string;
          metadata?: Json;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_channels_created_by_user_id_fkey";
            columns: ["created_by_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      chat_message_reports: {
        Row: {
          created_at: string;
          details: string | null;
          id: number;
          message_id: number;
          metadata: Json;
          reason: Database["public"]["Enums"]["chat_report_reason"];
          report_status: Database["public"]["Enums"]["chat_report_status"];
          reporter_user_id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
        };
        Insert: {
          created_at?: string;
          details?: string | null;
          id?: number;
          message_id: number;
          metadata?: Json;
          reason: Database["public"]["Enums"]["chat_report_reason"];
          report_status?: Database["public"]["Enums"]["chat_report_status"];
          reporter_user_id: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: {
          created_at?: string;
          details?: string | null;
          id?: number;
          message_id?: number;
          metadata?: Json;
          reason?: Database["public"]["Enums"]["chat_report_reason"];
          report_status?: Database["public"]["Enums"]["chat_report_status"];
          reporter_user_id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_message_reports_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "chat_messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_message_reports_reporter_user_id_fkey";
            columns: ["reporter_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_message_reports_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      chat_messages: {
        Row: {
          body: string;
          channel_id: string;
          created_at: string;
          deleted_at: string | null;
          edited_at: string | null;
          id: number;
          message_status: Database["public"]["Enums"]["chat_message_status"];
          metadata: Json;
          moderation_reason: string | null;
          reply_to_message_id: number | null;
          sender_user_id: string | null;
        };
        Insert: {
          body: string;
          channel_id: string;
          created_at?: string;
          deleted_at?: string | null;
          edited_at?: string | null;
          id?: number;
          message_status?: Database["public"]["Enums"]["chat_message_status"];
          metadata?: Json;
          moderation_reason?: string | null;
          reply_to_message_id?: number | null;
          sender_user_id?: string | null;
        };
        Update: {
          body?: string;
          channel_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          edited_at?: string | null;
          id?: number;
          message_status?: Database["public"]["Enums"]["chat_message_status"];
          metadata?: Json;
          moderation_reason?: string | null;
          reply_to_message_id?: number | null;
          sender_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "chat_channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_reply_to_message_id_fkey";
            columns: ["reply_to_message_id"];
            isOneToOne: false;
            referencedRelation: "chat_messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_user_id_fkey";
            columns: ["sender_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      game_score_metric_definitions: {
        Row: {
          created_at: string;
          description: string | null;
          display_order: number;
          game_key: string;
          id: number;
          is_active: boolean;
          metric_category: string;
          metric_key: string;
          metric_name: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          display_order?: number;
          game_key: string;
          id?: number;
          is_active?: boolean;
          metric_category: string;
          metric_key: string;
          metric_name: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          display_order?: number;
          game_key?: string;
          id?: number;
          is_active?: boolean;
          metric_category?: string;
          metric_key?: string;
          metric_name?: string;
        };
        Relationships: [];
      };
      game_score_metric_values: {
        Row: {
          created_at: string;
          id: number;
          metric_definition_id: number;
          metric_value: number;
          score_record_id: number;
        };
        Insert: {
          created_at?: string;
          id?: number;
          metric_definition_id: number;
          metric_value?: number;
          score_record_id: number;
        };
        Update: {
          created_at?: string;
          id?: number;
          metric_definition_id?: number;
          metric_value?: number;
          score_record_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "game_score_metric_values_metric_definition_id_fkey";
            columns: ["metric_definition_id"];
            isOneToOne: false;
            referencedRelation: "game_score_metric_definitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_score_metric_values_score_record_id_fkey";
            columns: ["score_record_id"];
            isOneToOne: false;
            referencedRelation: "fly_squasher_leaderboard";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_score_metric_values_score_record_id_fkey";
            columns: ["score_record_id"];
            isOneToOne: false;
            referencedRelation: "game_leaderboard_scores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_score_metric_values_score_record_id_fkey";
            columns: ["score_record_id"];
            isOneToOne: false;
            referencedRelation: "game_score_records";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_score_metric_values_score_record_id_fkey";
            columns: ["score_record_id"];
            isOneToOne: false;
            referencedRelation: "game_score_records_full";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_score_metric_values_score_record_id_fkey";
            columns: ["score_record_id"];
            isOneToOne: false;
            referencedRelation: "little_muncher_leaderboard";
            referencedColumns: ["id"];
          }
        ];
      };
      game_score_records: {
        Row: {
          created_at: string;
          game_key: string;
          game_session_id: string;
          id: number;
          metadata: Json;
          participant_id: number | null;
          ranking_scope_key: string | null;
          score_unit: string;
          score_value: number;
          submitted_at: string;
          submitted_by_user_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          game_key: string;
          game_session_id: string;
          id?: number;
          metadata?: Json;
          participant_id?: number | null;
          ranking_scope_key?: string | null;
          score_unit?: string;
          score_value: number;
          submitted_at?: string;
          submitted_by_user_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          game_key?: string;
          game_session_id?: string;
          id?: number;
          metadata?: Json;
          participant_id?: number | null;
          ranking_scope_key?: string | null;
          score_unit?: string;
          score_value?: number;
          submitted_at?: string;
          submitted_by_user_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_score_records_game_session_id_fkey";
            columns: ["game_session_id"];
            isOneToOne: false;
            referencedRelation: "game_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_score_records_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "game_session_participants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_score_records_submitted_by_user_id_fkey";
            columns: ["submitted_by_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_score_records_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      game_score_snapshots: {
        Row: {
          created_at: string;
          game_session_id: string;
          id: number;
          snapshot_kind: string;
          snapshots: Json;
        };
        Insert: {
          created_at?: string;
          game_session_id: string;
          id?: number;
          snapshot_kind?: string;
          snapshots: Json;
        };
        Update: {
          created_at?: string;
          game_session_id?: string;
          id?: number;
          snapshot_kind?: string;
          snapshots?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "game_score_snapshots_game_session_id_fkey";
            columns: ["game_session_id"];
            isOneToOne: false;
            referencedRelation: "game_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      game_session_participants: {
        Row: {
          created_at: string;
          display_name: string;
          eliminated: boolean;
          eliminated_at: string | null;
          faction_key: string | null;
          game_session_id: string;
          id: number;
          metadata: Json;
          participant_number: number;
          participant_type: Database["public"]["Enums"]["game_participant_type"];
          result_status: Database["public"]["Enums"]["game_result_status"] | null;
          team_key: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          eliminated?: boolean;
          eliminated_at?: string | null;
          faction_key?: string | null;
          game_session_id: string;
          id?: number;
          metadata?: Json;
          participant_number: number;
          participant_type?: Database["public"]["Enums"]["game_participant_type"];
          result_status?: Database["public"]["Enums"]["game_result_status"] | null;
          team_key?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          eliminated?: boolean;
          eliminated_at?: string | null;
          faction_key?: string | null;
          game_session_id?: string;
          id?: number;
          metadata?: Json;
          participant_number?: number;
          participant_type?: Database["public"]["Enums"]["game_participant_type"];
          result_status?: Database["public"]["Enums"]["game_result_status"] | null;
          team_key?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_session_participants_game_session_id_fkey";
            columns: ["game_session_id"];
            isOneToOne: false;
            referencedRelation: "game_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_session_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      game_sessions: {
        Row: {
          completed_at: string | null;
          completed_by_user_id: string | null;
          created_at: string;
          created_by_user_id: string | null;
          ended_at: string | null;
          external_session_id: string | null;
          game_key: string;
          game_mode_key: string | null;
          human_player_count: number;
          id: string;
          level_key: string | null;
          map_key: string | null;
          metadata: Json;
          session_status: Database["public"]["Enums"]["game_session_status"];
          started_at: string;
          total_duration_seconds: number | null;
          updated_at: string;
        };
        Insert: {
          completed_at?: string | null;
          completed_by_user_id?: string | null;
          created_at?: string;
          created_by_user_id?: string | null;
          ended_at?: string | null;
          external_session_id?: string | null;
          game_key: string;
          game_mode_key?: string | null;
          human_player_count?: number;
          id?: string;
          level_key?: string | null;
          map_key?: string | null;
          metadata?: Json;
          session_status?: Database["public"]["Enums"]["game_session_status"];
          started_at?: string;
          total_duration_seconds?: number | null;
          updated_at?: string;
        };
        Update: {
          completed_at?: string | null;
          completed_by_user_id?: string | null;
          created_at?: string;
          created_by_user_id?: string | null;
          ended_at?: string | null;
          external_session_id?: string | null;
          game_key?: string;
          game_mode_key?: string | null;
          human_player_count?: number;
          id?: string;
          level_key?: string | null;
          map_key?: string | null;
          metadata?: Json;
          session_status?: Database["public"]["Enums"]["game_session_status"];
          started_at?: string;
          total_duration_seconds?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_sessions_completed_by_user_id_fkey";
            columns: ["completed_by_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_sessions_created_by_user_id_fkey";
            columns: ["created_by_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      user_achievement_unlocks: {
        Row: {
          achievement_id: string;
          id: number;
          metadata: Json;
          unlocked_at: string;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          id?: number;
          metadata?: Json;
          unlocked_at?: string;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          id?: number;
          metadata?: Json;
          unlocked_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievement_unlocks_achievement_id_fkey";
            columns: ["achievement_id"];
            isOneToOne: false;
            referencedRelation: "achievement_definitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_achievement_unlocks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      user_profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["user_account_status"];
          app_role: Database["public"]["Enums"]["app_user_role"];
          avatar_url: string | null;
          banned_until: string | null;
          bio: string | null;
          created_at: string;
          display_name: string;
          email: string | null;
          id: string;
          locale: string | null;
          moderation_note: string | null;
          timezone: string | null;
          updated_at: string;
          username: string | null;
          website_url: string | null;
        };
        Insert: {
          account_status?: Database["public"]["Enums"]["user_account_status"];
          app_role?: Database["public"]["Enums"]["app_user_role"];
          avatar_url?: string | null;
          banned_until?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name: string;
          email?: string | null;
          id: string;
          locale?: string | null;
          moderation_note?: string | null;
          timezone?: string | null;
          updated_at?: string;
          username?: string | null;
          website_url?: string | null;
        };
        Update: {
          account_status?: Database["public"]["Enums"]["user_account_status"];
          app_role?: Database["public"]["Enums"]["app_user_role"];
          avatar_url?: string | null;
          banned_until?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string;
          email?: string | null;
          id?: string;
          locale?: string | null;
          moderation_note?: string | null;
          timezone?: string | null;
          updated_at?: string;
          username?: string | null;
          website_url?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      fly_squasher_leaderboard: {
        Row: {
          date: string | null;
          id: number | null;
          level: number | null;
          name: string | null;
          score: number | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_score_records_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      game_leaderboard_scores: {
        Row: {
          display_name: string | null;
          game_key: string | null;
          id: number | null;
          metadata: Json | null;
          ranking_scope_key: string | null;
          scope_rank: number | null;
          score_value: number | null;
          submitted_at: string | null;
          user_id: string | null;
          user_scope_rank: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_score_records_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      game_score_records_full: {
        Row: {
          display_name: string | null;
          eliminated: boolean | null;
          eliminated_at: string | null;
          faction_key: string | null;
          game_key: string | null;
          game_session_id: string | null;
          id: number | null;
          metrics: Json | null;
          participant_id: number | null;
          participant_number: number | null;
          participant_type: Database["public"]["Enums"]["game_participant_type"] | null;
          ranking_scope_key: string | null;
          result_status: Database["public"]["Enums"]["game_result_status"] | null;
          score_value: number | null;
          submitted_at: string | null;
          team_key: string | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_score_records_game_session_id_fkey";
            columns: ["game_session_id"];
            isOneToOne: false;
            referencedRelation: "game_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_score_records_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "game_session_participants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_score_records_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      little_muncher_leaderboard: {
        Row: {
          date: string | null;
          hill: number | null;
          id: number | null;
          score: number | null;
          user_id: string | null;
          user_name: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_score_records_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Functions: {
      refresh_game_score_records_full: { Args: never; Returns: undefined };
    };
    Enums: {
      achievement_difficulty: "easy" | "medium" | "hard";
      app_user_role: "user" | "moderator" | "admin";
      chat_channel_type: "global_lobby" | "game_lobby" | "game_session" | "direct" | "system";
      chat_membership_role: "owner" | "moderator" | "member";
      chat_message_status: "visible" | "hidden" | "deleted";
      chat_report_reason:
        | "spam"
        | "abuse"
        | "harassment"
        | "hate_speech"
        | "cheating"
        | "personal_information"
        | "other";
      chat_report_status: "open" | "reviewed" | "dismissed" | "actioned";
      game_participant_type: "human" | "ai" | "spectator";
      game_result_status: "win" | "loss" | "tie" | "quit";
      game_session_status: "in_progress" | "completed" | "abandoned";
      user_account_status: "active" | "limited" | "disabled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      achievement_difficulty: ["easy", "medium", "hard"],
      app_user_role: ["user", "moderator", "admin"],
      chat_channel_type: ["global_lobby", "game_lobby", "game_session", "direct", "system"],
      chat_membership_role: ["owner", "moderator", "member"],
      chat_message_status: ["visible", "hidden", "deleted"],
      chat_report_reason: ["spam", "abuse", "harassment", "hate_speech", "cheating", "personal_information", "other"],
      chat_report_status: ["open", "reviewed", "dismissed", "actioned"],
      game_participant_type: ["human", "ai", "spectator"],
      game_result_status: ["win", "loss", "tie", "quit"],
      game_session_status: ["in_progress", "completed", "abandoned"],
      user_account_status: ["active", "limited", "disabled"]
    }
  }
} as const;
