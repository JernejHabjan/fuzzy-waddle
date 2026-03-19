export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      fly_squasher_scores: {
        Row: {
          date: string | null;
          id: number;
          level: number;
          score: number;
          user_id: string;
        };
        Insert: {
          date?: string | null;
          id?: number;
          level: number;
          score: number;
          user_id: string;
        };
        Update: {
          date?: string | null;
          id?: number;
          level?: number;
          score?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      little_muncher_scores: {
        Row: {
          date: string | null;
          hill: number;
          id: number;
          score: number;
          user_id: string;
        };
        Insert: {
          date?: string | null;
          hill: number;
          id?: number;
          score: number;
          user_id: string;
        };
        Update: {
          date?: string | null;
          hill?: number;
          id?: number;
          score?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          created_at: string;
          game_instance_id: string | null;
          id: number;
          text: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          game_instance_id?: string | null;
          id?: number;
          text: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          game_instance_id?: string | null;
          id?: number;
          text?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_game_instance_id_fkey";
            columns: ["game_instance_id"];
            isOneToOne: false;
            referencedRelation: "probable_waffle_game_sessions";
            referencedColumns: ["game_instance_id"];
          },
          {
            foreignKeyName: "messages_game_instance_id_fkey";
            columns: ["game_instance_id"];
            isOneToOne: false;
            referencedRelation: "probable_waffle_match_history";
            referencedColumns: ["game_instance_id"];
          },
          {
            foreignKeyName: "messages_profile_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      probable_waffle_achievements: {
        Row: {
          achievement_id: string;
          id: number;
          metadata: Json | null;
          unlocked_date: string | null;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          id?: number;
          metadata?: Json | null;
          unlocked_date?: string | null;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          id?: number;
          metadata?: Json | null;
          unlocked_date?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      probable_waffle_game_sessions: {
        Row: {
          created_at: string;
          created_by_user_id: string;
          ended_at: string | null;
          game_instance_id: string;
          game_type: string;
          human_player_count: number;
          id: string;
          map_id: number;
          scores_submitted: boolean;
          scores_submitted_at: string | null;
          scores_submitted_by: string | null;
          session_state: string;
          started_at: string;
          total_duration_seconds: number | null;
        };
        Insert: {
          created_at?: string;
          created_by_user_id: string;
          ended_at?: string | null;
          game_instance_id: string;
          game_type: string;
          human_player_count?: number;
          id?: string;
          map_id: number;
          scores_submitted?: boolean;
          scores_submitted_at?: string | null;
          scores_submitted_by?: string | null;
          session_state: string;
          started_at?: string;
          total_duration_seconds?: number | null;
        };
        Update: {
          created_at?: string;
          created_by_user_id?: string;
          ended_at?: string | null;
          game_instance_id?: string;
          game_type?: string;
          human_player_count?: number;
          id?: string;
          map_id?: number;
          scores_submitted?: boolean;
          scores_submitted_at?: string | null;
          scores_submitted_by?: string | null;
          session_state?: string;
          started_at?: string;
          total_duration_seconds?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "probable_waffle_game_sessions_created_by_user_id_fkey";
            columns: ["created_by_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "probable_waffle_game_sessions_scores_submitted_by_fkey";
            columns: ["scores_submitted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      probable_waffle_player_score_metrics: {
        Row: {
          created_at: string;
          id: number;
          metric_type_id: number;
          metric_value: number;
          player_score_id: number;
        };
        Insert: {
          created_at?: string;
          id?: number;
          metric_type_id: number;
          metric_value?: number;
          player_score_id: number;
        };
        Update: {
          created_at?: string;
          id?: number;
          metric_type_id?: number;
          metric_value?: number;
          player_score_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "probable_waffle_player_score_metrics_metric_type_id_fkey";
            columns: ["metric_type_id"];
            isOneToOne: false;
            referencedRelation: "probable_waffle_score_metric_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "probable_waffle_player_score_metrics_player_score_id_fkey";
            columns: ["player_score_id"];
            isOneToOne: false;
            referencedRelation: "probable_waffle_player_scores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "probable_waffle_player_score_metrics_player_score_id_fkey";
            columns: ["player_score_id"];
            isOneToOne: false;
            referencedRelation: "probable_waffle_player_scores_full";
            referencedColumns: ["id"];
          }
        ];
      };
      probable_waffle_player_scores: {
        Row: {
          created_at: string;
          eliminated: boolean;
          eliminated_at: string | null;
          faction_type: string;
          final_score: number;
          game_result: string;
          game_session_id: string;
          id: number;
          player_name: string;
          player_number: number;
          player_type: string;
          team_number: number | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          eliminated?: boolean;
          eliminated_at?: string | null;
          faction_type: string;
          final_score?: number;
          game_result: string;
          game_session_id: string;
          id?: number;
          player_name: string;
          player_number: number;
          player_type: string;
          team_number?: number | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          eliminated?: boolean;
          eliminated_at?: string | null;
          faction_type?: string;
          final_score?: number;
          game_result?: string;
          game_session_id?: string;
          id?: number;
          player_name?: string;
          player_number?: number;
          player_type?: string;
          team_number?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "probable_waffle_player_scores_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      probable_waffle_score_metric_types: {
        Row: {
          created_at: string;
          description: string | null;
          display_order: number;
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
          id?: number;
          is_active?: boolean;
          metric_category?: string;
          metric_key?: string;
          metric_name?: string;
        };
        Relationships: [];
      };
      probable_waffle_score_snapshots: {
        Row: {
          created_at: string;
          game_session_id: string;
          id: number;
          player_scores: Json;
          timestamp_ms: number;
        };
        Insert: {
          created_at?: string;
          game_session_id: string;
          id?: number;
          player_scores: Json;
          timestamp_ms: number;
        };
        Update: {
          created_at?: string;
          game_session_id?: string;
          id?: number;
          player_scores?: Json;
          timestamp_ms?: number;
        };
        Relationships: [
          {
            foreignKeyName: "probable_waffle_score_snapshots_game_session_id_fkey";
            columns: ["game_session_id"];
            isOneToOne: false;
            referencedRelation: "probable_waffle_game_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "probable_waffle_score_snapshots_game_session_id_fkey";
            columns: ["game_session_id"];
            isOneToOne: false;
            referencedRelation: "probable_waffle_match_history";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          created: string;
          email: string | null;
          id: string;
          name: string | null;
          profile_image_url: string | null;
        };
        Insert: {
          created?: string;
          email?: string | null;
          id: string;
          name?: string | null;
          profile_image_url?: string | null;
        };
        Update: {
          created?: string;
          email?: string | null;
          id?: string;
          name?: string | null;
          profile_image_url?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      fly_squasher_scores_with_user_meta: {
        Row: {
          date: string | null;
          id: number | null;
          level: number | null;
          level_rn: number | null;
          name: string | null;
          score: number | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      little_muncher_scores_with_user_meta: {
        Row: {
          date: string | null;
          hill: number | null;
          id: number | null;
          score: number | null;
          user_id: string | null;
          user_name: string | null;
        };
        Relationships: [];
      };
      probable_waffle_match_history: {
        Row: {
          created_by_name: string | null;
          ended_at: string | null;
          game_instance_id: string | null;
          game_type: string | null;
          human_player_count: number | null;
          id: string | null;
          map_id: number | null;
          players: Json | null;
          scores_submitted: boolean | null;
          session_state: string | null;
          started_at: string | null;
          submitted_by_name: string | null;
          total_duration_seconds: number | null;
          user_participated: boolean | null;
          user_result: string | null;
        };
        Relationships: [];
      };
      probable_waffle_player_scores_full: {
        Row: {
          buildings_constructed: number | null;
          buildings_destroyed: number | null;
          buildings_lost: number | null;
          created_at: string | null;
          damage_dealt: number | null;
          damage_received: number | null;
          eliminated: boolean | null;
          eliminated_at: string | null;
          faction_type: string | null;
          final_resources_minerals: number | null;
          final_resources_stone: number | null;
          final_resources_wood: number | null;
          final_score: number | null;
          game_result: string | null;
          game_session_id: string | null;
          healing_done: number | null;
          id: number | null;
          max_army_size: number | null;
          max_building_count: number | null;
          player_name: string | null;
          player_number: number | null;
          player_type: string | null;
          resources_collected_minerals: number | null;
          resources_collected_stone: number | null;
          resources_collected_wood: number | null;
          resources_spent_minerals: number | null;
          resources_spent_stone: number | null;
          resources_spent_wood: number | null;
          team_number: number | null;
          units_killed: number | null;
          units_lost: number | null;
          units_produced: number | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "probable_waffle_player_scores_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      probable_waffle_player_stats: {
        Row: {
          avg_final_score: number | null;
          losses: number | null;
          max_final_score: number | null;
          player_name: string | null;
          ties: number | null;
          total_buildings_constructed: number | null;
          total_buildings_destroyed: number | null;
          total_games: number | null;
          total_units_killed: number | null;
          total_units_produced: number | null;
          user_id: string | null;
          win_rate_percentage: number | null;
          wins: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "probable_waffle_player_scores_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Functions: {
      get_player_score_metrics: {
        Args: { p_player_score_id: number };
        Returns: Json;
      };
      refresh_probable_waffle_player_scores_full: {
        Args: never;
        Returns: undefined;
      };
      upsert_player_score_metric: {
        Args: {
          p_metric_key: string;
          p_metric_value: number;
          p_player_score_id: number;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
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
    Enums: {}
  }
} as const;
