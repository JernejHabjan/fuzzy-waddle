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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      achievement_definitions: {
        Row: {
          category: string | null
          created_at: string
          description: string
          difficulty:
            | Database["public"]["Enums"]["achievement_difficulty"]
            | null
          game_key: string
          id: string
          image_key: string | null
          is_active: boolean
          is_secret: boolean
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description: string
          difficulty?:
            | Database["public"]["Enums"]["achievement_difficulty"]
            | null
          game_key: string
          id: string
          image_key?: string | null
          is_active?: boolean
          is_secret?: boolean
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string
          difficulty?:
            | Database["public"]["Enums"]["achievement_difficulty"]
            | null
          game_key?: string
          id?: string
          image_key?: string | null
          is_active?: boolean
          is_secret?: boolean
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_channel_memberships: {
        Row: {
          channel_id: string
          id: number
          joined_at: string
          last_read_at: string | null
          left_at: string | null
          membership_role: Database["public"]["Enums"]["chat_membership_role"]
          muted_until: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: number
          joined_at?: string
          last_read_at?: string | null
          left_at?: string | null
          membership_role?: Database["public"]["Enums"]["chat_membership_role"]
          muted_until?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: number
          joined_at?: string
          last_read_at?: string | null
          left_at?: string | null
          membership_role?: Database["public"]["Enums"]["chat_membership_role"]
          muted_until?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channel_memberships_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_channel_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channels: {
        Row: {
          archived_at: string | null
          channel_type: Database["public"]["Enums"]["chat_channel_type"]
          created_at: string
          created_by_user_id: string | null
          external_session_id: string | null
          game_key: string | null
          id: string
          metadata: Json
          title: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          channel_type: Database["public"]["Enums"]["chat_channel_type"]
          created_at?: string
          created_by_user_id?: string | null
          external_session_id?: string | null
          game_key?: string | null
          id?: string
          metadata?: Json
          title?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          channel_type?: Database["public"]["Enums"]["chat_channel_type"]
          created_at?: string
          created_by_user_id?: string | null
          external_session_id?: string | null
          game_key?: string | null
          id?: string
          metadata?: Json
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channels_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_reports: {
        Row: {
          created_at: string
          details: string | null
          id: number
          message_id: number
          metadata: Json
          reason: Database["public"]["Enums"]["chat_report_reason"]
          report_status: Database["public"]["Enums"]["chat_report_status"]
          reporter_user_id: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: number
          message_id: number
          metadata?: Json
          reason: Database["public"]["Enums"]["chat_report_reason"]
          report_status?: Database["public"]["Enums"]["chat_report_status"]
          reporter_user_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: number
          message_id?: number
          metadata?: Json
          reason?: Database["public"]["Enums"]["chat_report_reason"]
          report_status?: Database["public"]["Enums"]["chat_report_status"]
          reporter_user_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          body: string
          channel_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: number
          message_status: Database["public"]["Enums"]["chat_message_status"]
          metadata: Json
          moderation_reason: string | null
          reply_to_message_id: number | null
          sender_user_id: string | null
        }
        Insert: {
          body: string
          channel_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: number
          message_status?: Database["public"]["Enums"]["chat_message_status"]
          metadata?: Json
          moderation_reason?: string | null
          reply_to_message_id?: number | null
          sender_user_id?: string | null
        }
        Update: {
          body?: string
          channel_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: number
          message_status?: Database["public"]["Enums"]["chat_message_status"]
          metadata?: Json
          moderation_reason?: string | null
          reply_to_message_id?: number | null
          sender_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_relationships: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          requester_id: string
          status: Database["public"]["Enums"]["friend_relationship_status"]
          updated_at: string
          user_high_id: string
          user_low_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          requester_id: string
          status?: Database["public"]["Enums"]["friend_relationship_status"]
          updated_at?: string
          user_high_id: string
          user_low_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["friend_relationship_status"]
          updated_at?: string
          user_high_id?: string
          user_low_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_relationships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_relationships_user_high_id_fkey"
            columns: ["user_high_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_relationships_user_low_id_fkey"
            columns: ["user_low_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_score_metric_definitions: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          game_key: string
          id: number
          is_active: boolean
          metric_category: string
          metric_key: string
          metric_name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          game_key: string
          id?: number
          is_active?: boolean
          metric_category: string
          metric_key: string
          metric_name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          game_key?: string
          id?: number
          is_active?: boolean
          metric_category?: string
          metric_key?: string
          metric_name?: string
        }
        Relationships: []
      }
      game_score_metric_values: {
        Row: {
          created_at: string
          id: number
          metric_definition_id: number
          metric_value: number
          score_record_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          metric_definition_id: number
          metric_value?: number
          score_record_id: number
        }
        Update: {
          created_at?: string
          id?: number
          metric_definition_id?: number
          metric_value?: number
          score_record_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_score_metric_values_metric_definition_id_fkey"
            columns: ["metric_definition_id"]
            isOneToOne: false
            referencedRelation: "game_score_metric_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_score_metric_values_score_record_id_fkey"
            columns: ["score_record_id"]
            isOneToOne: false
            referencedRelation: "fly_squasher_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_score_metric_values_score_record_id_fkey"
            columns: ["score_record_id"]
            isOneToOne: false
            referencedRelation: "game_leaderboard_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_score_metric_values_score_record_id_fkey"
            columns: ["score_record_id"]
            isOneToOne: false
            referencedRelation: "game_score_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_score_metric_values_score_record_id_fkey"
            columns: ["score_record_id"]
            isOneToOne: false
            referencedRelation: "game_score_records_full"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_score_metric_values_score_record_id_fkey"
            columns: ["score_record_id"]
            isOneToOne: false
            referencedRelation: "little_muncher_leaderboard"
            referencedColumns: ["id"]
          },
        ]
      }
      game_score_records: {
        Row: {
          created_at: string
          game_key: string
          game_session_id: string
          id: number
          metadata: Json
          participant_id: number | null
          ranking_scope_key: string | null
          score_unit: string
          score_value: number
          submitted_at: string
          submitted_by_user_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          game_key: string
          game_session_id: string
          id?: number
          metadata?: Json
          participant_id?: number | null
          ranking_scope_key?: string | null
          score_unit?: string
          score_value: number
          submitted_at?: string
          submitted_by_user_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          game_key?: string
          game_session_id?: string
          id?: number
          metadata?: Json
          participant_id?: number | null
          ranking_scope_key?: string | null
          score_unit?: string
          score_value?: number
          submitted_at?: string
          submitted_by_user_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_score_records_game_session_id_fkey"
            columns: ["game_session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_score_records_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "game_session_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_score_records_submitted_by_user_id_fkey"
            columns: ["submitted_by_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_score_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_score_snapshots: {
        Row: {
          created_at: string
          game_session_id: string
          id: number
          snapshot_kind: string
          snapshots: Json
        }
        Insert: {
          created_at?: string
          game_session_id: string
          id?: number
          snapshot_kind?: string
          snapshots: Json
        }
        Update: {
          created_at?: string
          game_session_id?: string
          id?: number
          snapshot_kind?: string
          snapshots?: Json
        }
        Relationships: [
          {
            foreignKeyName: "game_score_snapshots_game_session_id_fkey"
            columns: ["game_session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_session_participants: {
        Row: {
          created_at: string
          display_name: string
          eliminated: boolean
          eliminated_at: string | null
          faction_key: string | null
          game_session_id: string
          id: number
          metadata: Json
          participant_number: number
          participant_type: Database["public"]["Enums"]["game_participant_type"]
          result_status:
            | Database["public"]["Enums"]["game_result_status"]
            | null
          team_key: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          eliminated?: boolean
          eliminated_at?: string | null
          faction_key?: string | null
          game_session_id: string
          id?: number
          metadata?: Json
          participant_number: number
          participant_type?: Database["public"]["Enums"]["game_participant_type"]
          result_status?:
            | Database["public"]["Enums"]["game_result_status"]
            | null
          team_key?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          eliminated?: boolean
          eliminated_at?: string | null
          faction_key?: string | null
          game_session_id?: string
          id?: number
          metadata?: Json
          participant_number?: number
          participant_type?: Database["public"]["Enums"]["game_participant_type"]
          result_status?:
            | Database["public"]["Enums"]["game_result_status"]
            | null
          team_key?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_session_participants_game_session_id_fkey"
            columns: ["game_session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_session_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          completed_at: string | null
          completed_by_user_id: string | null
          created_at: string
          created_by_user_id: string | null
          ended_at: string | null
          external_session_id: string | null
          game_key: string
          game_mode_key: string | null
          human_player_count: number
          id: string
          level_key: string | null
          map_key: string | null
          metadata: Json
          session_status: Database["public"]["Enums"]["game_session_status"]
          started_at: string
          total_duration_seconds: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by_user_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          ended_at?: string | null
          external_session_id?: string | null
          game_key: string
          game_mode_key?: string | null
          human_player_count?: number
          id?: string
          level_key?: string | null
          map_key?: string | null
          metadata?: Json
          session_status?: Database["public"]["Enums"]["game_session_status"]
          started_at?: string
          total_duration_seconds?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by_user_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          ended_at?: string | null
          external_session_id?: string | null
          game_key?: string
          game_mode_key?: string | null
          human_player_count?: number
          id?: string
          level_key?: string | null
          map_key?: string | null
          metadata?: Json
          session_status?: Database["public"]["Enums"]["game_session_status"]
          started_at?: string
          total_duration_seconds?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_completed_by_user_id_fkey"
            columns: ["completed_by_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      probable_waffle_campaign_profiles: {
        Row: {
          active_loadout_ids: string[]
          created_at: string
          profile_document: Json
          revision: number
          schema_version: number
          seen_cinematic_ids: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          active_loadout_ids?: string[]
          created_at?: string
          profile_document: Json
          revision?: number
          schema_version?: number
          seen_cinematic_ids?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          active_loadout_ids?: string[]
          created_at?: string
          profile_document?: Json
          revision?: number
          schema_version?: number
          seen_cinematic_ids?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      probable_waffle_campaign_progress: {
        Row: {
          best_difficulty: Database["public"]["Enums"]["probable_waffle_campaign_difficulty"]
          best_duration_seconds: number | null
          completed_at: string
          completed_objective_ids: string[]
          completion_count: number
          mission_id: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"]
          result_metadata: Json
          user_id: string
        }
        Insert: {
          best_difficulty?: Database["public"]["Enums"]["probable_waffle_campaign_difficulty"]
          best_duration_seconds?: number | null
          completed_at?: string
          completed_objective_ids?: string[]
          completion_count?: number
          mission_id: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"]
          result_metadata?: Json
          user_id: string
        }
        Update: {
          best_difficulty?: Database["public"]["Enums"]["probable_waffle_campaign_difficulty"]
          best_duration_seconds?: number | null
          completed_at?: string
          completed_objective_ids?: string[]
          completion_count?: number
          mission_id?: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"]
          result_metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      probable_waffle_campaign_reward_claims: {
        Row: {
          claim_id: string
          claimed_at: string
          committed_delta: Json
          mission_id: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"]
          run_id: string
          user_id: string
        }
        Insert: {
          claim_id: string
          claimed_at?: string
          committed_delta: Json
          mission_id: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"]
          run_id: string
          user_id: string
        }
        Update: {
          claim_id?: string
          claimed_at?: string
          committed_delta?: Json
          mission_id?: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"]
          run_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "probable_waffle_campaign_reward_claims_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "probable_waffle_campaign_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      probable_waffle_campaign_runs: {
        Row: {
          base_profile_revision: number
          commit_result: Json | null
          commit_status: Database["public"]["Enums"]["probable_waffle_campaign_commit_status"]
          completed_at: string | null
          difficulty: Database["public"]["Enums"]["probable_waffle_campaign_difficulty"]
          id: string
          integrity: Json
          loadout_snapshot_hash: string
          mission_id: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"]
          mission_revision: number
          outcome:
            | Database["public"]["Enums"]["probable_waffle_campaign_outcome"]
            | null
          result_metadata: Json
          selected_loadout_ids: string[]
          started_at: string
          user_id: string
        }
        Insert: {
          base_profile_revision?: number
          commit_result?: Json | null
          commit_status?: Database["public"]["Enums"]["probable_waffle_campaign_commit_status"]
          completed_at?: string | null
          difficulty?: Database["public"]["Enums"]["probable_waffle_campaign_difficulty"]
          id: string
          integrity?: Json
          loadout_snapshot_hash?: string
          mission_id: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"]
          mission_revision?: number
          outcome?:
            | Database["public"]["Enums"]["probable_waffle_campaign_outcome"]
            | null
          result_metadata?: Json
          selected_loadout_ids?: string[]
          started_at?: string
          user_id: string
        }
        Update: {
          base_profile_revision?: number
          commit_result?: Json | null
          commit_status?: Database["public"]["Enums"]["probable_waffle_campaign_commit_status"]
          completed_at?: string | null
          difficulty?: Database["public"]["Enums"]["probable_waffle_campaign_difficulty"]
          id?: string
          integrity?: Json
          loadout_snapshot_hash?: string
          mission_id?: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"]
          mission_revision?: number
          outcome?:
            | Database["public"]["Enums"]["probable_waffle_campaign_outcome"]
            | null
          result_metadata?: Json
          selected_loadout_ids?: string[]
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      probable_waffle_game_saves: {
        Row: {
          campaign_chapter_id:
            | Database["public"]["Enums"]["probable_waffle_campaign_chapter_id"]
            | null
          campaign_checkpoint_id: string | null
          campaign_id: string | null
          campaign_loadout_ids: string[] | null
          campaign_loadout_snapshot_hash: string | null
          campaign_mission_id:
            | Database["public"]["Enums"]["probable_waffle_campaign_mission_id"]
            | null
          campaign_mission_revision: number | null
          campaign_participant_count: number | null
          campaign_participant_progression_snapshots: Json | null
          campaign_profile_revision: number | null
          campaign_run_id: string | null
          campaign_runtime_schema_version: number | null
          created_at: string
          encoded_game_instance_data: string
          format_version: number
          id: string
          is_deleted: boolean
          kind: Database["public"]["Enums"]["probable_waffle_game_save_kind"]
          name: string | null
          revision: number
          scope: Database["public"]["Enums"]["probable_waffle_game_save_scope"]
          thumbnail: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_chapter_id?:
            | Database["public"]["Enums"]["probable_waffle_campaign_chapter_id"]
            | null
          campaign_checkpoint_id?: string | null
          campaign_id?: string | null
          campaign_loadout_ids?: string[] | null
          campaign_loadout_snapshot_hash?: string | null
          campaign_mission_id?:
            | Database["public"]["Enums"]["probable_waffle_campaign_mission_id"]
            | null
          campaign_mission_revision?: number | null
          campaign_participant_count?: number | null
          campaign_participant_progression_snapshots?: Json | null
          campaign_profile_revision?: number | null
          campaign_run_id?: string | null
          campaign_runtime_schema_version?: number | null
          created_at?: string
          encoded_game_instance_data: string
          format_version: number
          id: string
          is_deleted?: boolean
          kind: Database["public"]["Enums"]["probable_waffle_game_save_kind"]
          name?: string | null
          revision: number
          scope: Database["public"]["Enums"]["probable_waffle_game_save_scope"]
          thumbnail?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_chapter_id?:
            | Database["public"]["Enums"]["probable_waffle_campaign_chapter_id"]
            | null
          campaign_checkpoint_id?: string | null
          campaign_id?: string | null
          campaign_loadout_ids?: string[] | null
          campaign_loadout_snapshot_hash?: string | null
          campaign_mission_id?:
            | Database["public"]["Enums"]["probable_waffle_campaign_mission_id"]
            | null
          campaign_mission_revision?: number | null
          campaign_participant_count?: number | null
          campaign_participant_progression_snapshots?: Json | null
          campaign_profile_revision?: number | null
          campaign_run_id?: string | null
          campaign_runtime_schema_version?: number | null
          created_at?: string
          encoded_game_instance_data?: string
          format_version?: number
          id?: string
          is_deleted?: boolean
          kind?: Database["public"]["Enums"]["probable_waffle_game_save_kind"]
          name?: string | null
          revision?: number
          scope?: Database["public"]["Enums"]["probable_waffle_game_save_scope"]
          thumbnail?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievement_unlocks: {
        Row: {
          achievement_id: string
          id: number
          metadata: Json
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: number
          metadata?: Json
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: number
          metadata?: Json
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievement_unlocks_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievement_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievement_unlocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_user_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_user_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_user_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_user_id_fkey"
            columns: ["blocked_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["user_account_status"]
          app_role: Database["public"]["Enums"]["app_user_role"]
          avatar_url: string | null
          banned_until: string | null
          bio: string | null
          created_at: string
          display_name: string
          email: string | null
          id: string
          locale: string | null
          moderation_note: string | null
          timezone: string | null
          updated_at: string
          username: string | null
          website_url: string | null
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["user_account_status"]
          app_role?: Database["public"]["Enums"]["app_user_role"]
          avatar_url?: string | null
          banned_until?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          email?: string | null
          id: string
          locale?: string | null
          moderation_note?: string | null
          timezone?: string | null
          updated_at?: string
          username?: string | null
          website_url?: string | null
        }
        Update: {
          account_status?: Database["public"]["Enums"]["user_account_status"]
          app_role?: Database["public"]["Enums"]["app_user_role"]
          avatar_url?: string | null
          banned_until?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          locale?: string | null
          moderation_note?: string | null
          timezone?: string | null
          updated_at?: string
          username?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      fly_squasher_leaderboard: {
        Row: {
          date: string | null
          id: number | null
          level: number | null
          name: string | null
          score: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_score_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_leaderboard_scores: {
        Row: {
          display_name: string | null
          game_key: string | null
          id: number | null
          metadata: Json | null
          ranking_scope_key: string | null
          scope_rank: number | null
          score_value: number | null
          submitted_at: string | null
          user_id: string | null
          user_scope_rank: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_score_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_score_records_full: {
        Row: {
          display_name: string | null
          eliminated: boolean | null
          eliminated_at: string | null
          faction_key: string | null
          game_key: string | null
          game_session_id: string | null
          id: number | null
          metrics: Json | null
          participant_id: number | null
          participant_number: number | null
          participant_type:
            | Database["public"]["Enums"]["game_participant_type"]
            | null
          ranking_scope_key: string | null
          result_status:
            | Database["public"]["Enums"]["game_result_status"]
            | null
          score_value: number | null
          submitted_at: string | null
          team_key: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_score_records_game_session_id_fkey"
            columns: ["game_session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_score_records_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "game_session_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_score_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      little_muncher_leaderboard: {
        Row: {
          date: string | null
          hill: number | null
          id: number | null
          score: number | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_score_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      commit_probable_waffle_campaign_victory: {
        Args: {
          p_base_profile_revision: number
          p_commit_result: Json
          p_mission_id: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"]
          p_profile_document: Json
          p_progress_metadata: Json
          p_result_metadata: Json
          p_reward_claims: Json
          p_run_id: string
          p_user_id: string
        }
        Returns: Json
      }
      refresh_game_score_records_full: { Args: never; Returns: undefined }
      social_apply_friend_action: {
        Args: {
          p_action: Database["public"]["Enums"]["social_friend_action"]
          p_actor_user_id: string
          p_relationship_id?: string
          p_target_user_id?: string
        }
        Returns: Json
      }
      social_assert_active_user: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      social_find_user_by_username: {
        Args: { p_actor_user_id: string; p_username: string }
        Returns: Json
      }
      social_get_snapshot: { Args: { p_actor_user_id: string }; Returns: Json }
      social_relationship_projection: {
        Args: { p_actor_user_id: string; p_relationship_id: string }
        Returns: Json
      }
    }
    Enums: {
      achievement_difficulty: "easy" | "medium" | "hard"
      app_user_role: "user" | "moderator" | "admin"
      chat_channel_type:
        | "global_lobby"
        | "game_lobby"
        | "game_session"
        | "direct"
        | "system"
      chat_membership_role: "owner" | "moderator" | "member"
      chat_message_status: "visible" | "hidden" | "deleted"
      chat_report_reason:
        | "spam"
        | "abuse"
        | "harassment"
        | "hate_speech"
        | "cheating"
        | "personal_information"
        | "other"
      chat_report_status: "open" | "reviewed" | "dismissed" | "actioned"
      friend_relationship_status: "pending" | "accepted"
      game_participant_type: "human" | "ai" | "spectator"
      game_result_status: "win" | "loss" | "tie" | "quit"
      game_session_status: "in_progress" | "completed" | "abandoned"
      probable_waffle_campaign_chapter_id:
        | "prologue"
        | "two-homelands"
        | "crystal-war"
        | "united-against-volcano"
        | "the-betrayal"
      probable_waffle_campaign_commit_status:
        | "pending"
        | "committed"
        | "rejected"
      probable_waffle_campaign_difficulty: "story" | "normal" | "hard"
      probable_waffle_campaign_mission_id:
        | "dreams"
        | "cyclops-and-sheep"
        | "snow-wendigo-and-fire"
        | "slingshooters-and-wolves"
        | "owl-and-skaduwee-crystal"
        | "sand-dunes-and-tivara-crystal"
        | "we-had-enough"
        | "sailing-towards-the-new-future"
        | "the-first-and-last-dinner"
        | "the-siege"
        | "time-rush"
        | "joining-crystal"
        | "mobster-or-friend"
        | "the-volcano-is-getting-angry"
        | "cult-wars"
        | "the-volcano"
        | "the-betrayal"
        | "undead-and-cursed-lands"
        | "end-game"
        | "resolution"
      probable_waffle_campaign_outcome: "victory" | "defeat" | "abandoned"
      probable_waffle_game_save_kind:
        | "manual"
        | "autosave"
        | "quicksave"
        | "archive"
      probable_waffle_game_save_scope: "campaign" | "skirmish"
      social_friend_action:
        | "send_request"
        | "accept_request"
        | "decline_request"
        | "cancel_request"
        | "remove_friend"
        | "block"
        | "unblock"
      user_account_status: "active" | "limited" | "disabled"
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
      achievement_difficulty: ["easy", "medium", "hard"],
      app_user_role: ["user", "moderator", "admin"],
      chat_channel_type: [
        "global_lobby",
        "game_lobby",
        "game_session",
        "direct",
        "system",
      ],
      chat_membership_role: ["owner", "moderator", "member"],
      chat_message_status: ["visible", "hidden", "deleted"],
      chat_report_reason: [
        "spam",
        "abuse",
        "harassment",
        "hate_speech",
        "cheating",
        "personal_information",
        "other",
      ],
      chat_report_status: ["open", "reviewed", "dismissed", "actioned"],
      friend_relationship_status: ["pending", "accepted"],
      game_participant_type: ["human", "ai", "spectator"],
      game_result_status: ["win", "loss", "tie", "quit"],
      game_session_status: ["in_progress", "completed", "abandoned"],
      probable_waffle_campaign_chapter_id: [
        "prologue",
        "two-homelands",
        "crystal-war",
        "united-against-volcano",
        "the-betrayal",
      ],
      probable_waffle_campaign_commit_status: [
        "pending",
        "committed",
        "rejected",
      ],
      probable_waffle_campaign_difficulty: ["story", "normal", "hard"],
      probable_waffle_campaign_mission_id: [
        "dreams",
        "cyclops-and-sheep",
        "snow-wendigo-and-fire",
        "slingshooters-and-wolves",
        "owl-and-skaduwee-crystal",
        "sand-dunes-and-tivara-crystal",
        "we-had-enough",
        "sailing-towards-the-new-future",
        "the-first-and-last-dinner",
        "the-siege",
        "time-rush",
        "joining-crystal",
        "mobster-or-friend",
        "the-volcano-is-getting-angry",
        "cult-wars",
        "the-volcano",
        "the-betrayal",
        "undead-and-cursed-lands",
        "end-game",
        "resolution",
      ],
      probable_waffle_campaign_outcome: ["victory", "defeat", "abandoned"],
      probable_waffle_game_save_kind: [
        "manual",
        "autosave",
        "quicksave",
        "archive",
      ],
      probable_waffle_game_save_scope: ["campaign", "skirmish"],
      social_friend_action: [
        "send_request",
        "accept_request",
        "decline_request",
        "cancel_request",
        "remove_friend",
        "block",
        "unblock",
      ],
      user_account_status: ["active", "limited", "disabled"],
    },
  },
} as const
