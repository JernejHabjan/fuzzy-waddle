/**
 * Defines the closed json value set. Keeping this union named preserves exhaustive handling and prevents
 * incompatible free-form values at its boundaries.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/**
 * Defines the structural database contract. Its declared surface makes internal supabase, public explicit to
 * every consumer. This named alias keeps the boundary explicit without duplicating an anonymous object shape.
 */
export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  /**
   * keyed/nested internal supabase structure owned by {@link Database}. Keep its keys and value contract
   * explicit so callers cannot smuggle a broader shape across this boundary.
   */
  __InternalSupabase: {
    /**
     * compatibility postgrest version for {@link Database}. Consumers use it to choose validation, migration, or
     * conflict-handling rules instead of guessing the payload shape.
     */
    PostgrestVersion: "14.5";
  };
  /**
   * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
   * preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  public: {
    /**
     * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
     * preserve ordering or uniqueness whenever the owning workflow relies on it.
     */
    Tables: {
      /**
       * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
       * preserve ordering or uniqueness whenever the owning workflow relies on it.
       */
      achievement_definitions: {
        /**
         * keyed/nested row structure owned by {@link Database}. Keep its keys and value contract explicit so callers
         * cannot smuggle a broader shape across this boundary.
         */
        Row: {
          /**
           * category value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          category: string | null;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          created_at: string;
          /**
           * human-facing description for {@link Database}. It supports UI, narration, or diagnostics and must not be
           * used as the stable identity of the record.
           */
          description: string;
          /**
           * difficulty value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          difficulty: Database["public"]["Enums"]["achievement_difficulty"] | null;
          /**
           * string game key carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          game_key: string;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: string;
          /**
           * image key value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          image_key: string | null;
          /**
           * boolean policy/value on {@link Database} that explicitly controls whether the associated behavior is active;
           * do not infer it from unrelated state.
           */
          is_active: boolean;
          /**
           * boolean policy/value on {@link Database} that explicitly controls whether the associated behavior is active;
           * do not infer it from unrelated state.
           */
          is_secret: boolean;
          /**
           * typed metadata associated with {@link Database}. Preserve its declared contract at serialization and adapter
           * boundaries instead of weakening it to an unstructured record.
           */
          metadata: Json;
          /**
           * human-facing name for {@link Database}. It supports UI, narration, or diagnostics and must not be used as
           * the stable identity of the record.
           */
          name: string;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          updated_at: string;
        };
        /**
         * keyed/nested insert structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
        Insert: {
          /**
           * Optional category value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          category?: string | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * human-facing description for {@link Database}. It supports UI, narration, or diagnostics and must not be
           * used as the stable identity of the record.
           */
          description: string;
          /**
           * Optional difficulty value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          difficulty?: Database["public"]["Enums"]["achievement_difficulty"] | null;
          /**
           * string game key carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          game_key: string;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: string;
          /**
           * Optional image key value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          image_key?: string | null;
          /**
           * Optional boolean policy/value on {@link Database} that explicitly controls whether the associated behavior
           * is active; do not infer it from unrelated state.
           */
          is_active?: boolean;
          /**
           * Optional boolean policy/value on {@link Database} that explicitly controls whether the associated behavior
           * is active; do not infer it from unrelated state.
           */
          is_secret?: boolean;
          /**
           * Optional typed metadata associated with {@link Database}. Preserve its declared contract at serialization
           * and adapter boundaries instead of weakening it to an unstructured record.
           */
          metadata?: Json;
          /**
           * human-facing name for {@link Database}. It supports UI, narration, or diagnostics and must not be used as
           * the stable identity of the record.
           */
          name: string;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          updated_at?: string;
        };
        /**
         * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
         * time domain declared by the enclosing contract.
         */
        Update: {
          /**
           * Optional category value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          category?: string | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * Optional human-facing description for {@link Database}. It supports UI, narration, or diagnostics and must
           * not be used as the stable identity of the record.
           */
          description?: string;
          /**
           * Optional difficulty value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          difficulty?: Database["public"]["Enums"]["achievement_difficulty"] | null;
          /**
           * Optional string game key carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          game_key?: string;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: string;
          /**
           * Optional image key value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          image_key?: string | null;
          /**
           * Optional boolean policy/value on {@link Database} that explicitly controls whether the associated behavior
           * is active; do not infer it from unrelated state.
           */
          is_active?: boolean;
          /**
           * Optional boolean policy/value on {@link Database} that explicitly controls whether the associated behavior
           * is active; do not infer it from unrelated state.
           */
          is_secret?: boolean;
          /**
           * Optional typed metadata associated with {@link Database}. Preserve its declared contract at serialization
           * and adapter boundaries instead of weakening it to an unstructured record.
           */
          metadata?: Json;
          /**
           * Optional human-facing name for {@link Database}. It supports UI, narration, or diagnostics and must not be
           * used as the stable identity of the record.
           */
          name?: string;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          updated_at?: string;
        };
        /**
         * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
         * preserve ordering or uniqueness whenever the owning workflow relies on it.
         */
        Relationships: [];
      };
      /**
       * keyed/nested chat channel memberships structure owned by {@link Database}. Keep its keys and value contract
       * explicit so callers cannot smuggle a broader shape across this boundary.
       */
      chat_channel_memberships: {
        /**
         * keyed/nested row structure owned by {@link Database}. Keep its keys and value contract explicit so callers
         * cannot smuggle a broader shape across this boundary.
         */
        Row: {
          /**
           * string channel id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          channel_id: string;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: number;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          joined_at: string;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          last_read_at: string | null;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          left_at: string | null;
          /**
           * membership role value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          membership_role: Database["public"]["Enums"]["chat_membership_role"];
          /**
           * muted until value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          muted_until: string | null;
          /**
           * string user id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          user_id: string;
        };
        /**
         * keyed/nested insert structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
        Insert: {
          /**
           * string channel id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          channel_id: string;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: number;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          joined_at?: string;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          last_read_at?: string | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          left_at?: string | null;
          /**
           * Optional membership role value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          membership_role?: Database["public"]["Enums"]["chat_membership_role"];
          /**
           * Optional muted until value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          muted_until?: string | null;
          /**
           * string user id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          user_id: string;
        };
        /**
         * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
         * time domain declared by the enclosing contract.
         */
        Update: {
          /**
           * Optional string channel id carried by {@link Database}. Treat it according to the owning contract’s
           * validation and presentation rules rather than assuming it is a stable identifier.
           */
          channel_id?: string;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: number;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          joined_at?: string;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          last_read_at?: string | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          left_at?: string | null;
          /**
           * Optional membership role value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          membership_role?: Database["public"]["Enums"]["chat_membership_role"];
          /**
           * Optional muted until value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          muted_until?: string | null;
          /**
           * Optional string user id carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          user_id?: string;
        };
        /**
         * keyed/nested relationships structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
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
      /**
       * keyed/nested chat channels structure owned by {@link Database}. Keep its keys and value contract explicit so
       * callers cannot smuggle a broader shape across this boundary.
       */
      chat_channels: {
        /**
         * keyed/nested row structure owned by {@link Database}. Keep its keys and value contract explicit so callers
         * cannot smuggle a broader shape across this boundary.
         */
        Row: {
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          archived_at: string | null;
          /**
           * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
           * must keep it synchronized with the accompanying fields.
           */
          channel_type: Database["public"]["Enums"]["chat_channel_type"];
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          created_at: string;
          /**
           * created by user id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          created_by_user_id: string | null;
          /**
           * external session id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          external_session_id: string | null;
          /**
           * game key value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          game_key: string | null;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: string;
          /**
           * typed metadata associated with {@link Database}. Preserve its declared contract at serialization and adapter
           * boundaries instead of weakening it to an unstructured record.
           */
          metadata: Json;
          /**
           * human-facing title for {@link Database}. It supports UI, narration, or diagnostics and must not be used as
           * the stable identity of the record.
           */
          title: string | null;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          updated_at: string;
        };
        /**
         * keyed/nested insert structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
        Insert: {
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          archived_at?: string | null;
          /**
           * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
           * must keep it synchronized with the accompanying fields.
           */
          channel_type: Database["public"]["Enums"]["chat_channel_type"];
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * Optional created by user id value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          created_by_user_id?: string | null;
          /**
           * Optional external session id value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          external_session_id?: string | null;
          /**
           * Optional game key value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          game_key?: string | null;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: string;
          /**
           * Optional typed metadata associated with {@link Database}. Preserve its declared contract at serialization
           * and adapter boundaries instead of weakening it to an unstructured record.
           */
          metadata?: Json;
          /**
           * Optional human-facing title for {@link Database}. It supports UI, narration, or diagnostics and must not be
           * used as the stable identity of the record.
           */
          title?: string | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          updated_at?: string;
        };
        /**
         * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
         * time domain declared by the enclosing contract.
         */
        Update: {
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          archived_at?: string | null;
          /**
           * Optional discriminator for {@link Database}. It selects the valid branch and behavior, so producers and
           * consumers must keep it synchronized with the accompanying fields.
           */
          channel_type?: Database["public"]["Enums"]["chat_channel_type"];
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * Optional created by user id value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          created_by_user_id?: string | null;
          /**
           * Optional external session id value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          external_session_id?: string | null;
          /**
           * Optional game key value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          game_key?: string | null;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: string;
          /**
           * Optional typed metadata associated with {@link Database}. Preserve its declared contract at serialization
           * and adapter boundaries instead of weakening it to an unstructured record.
           */
          metadata?: Json;
          /**
           * Optional human-facing title for {@link Database}. It supports UI, narration, or diagnostics and must not be
           * used as the stable identity of the record.
           */
          title?: string | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          updated_at?: string;
        };
        /**
         * keyed/nested relationships structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
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
      /**
       * keyed/nested chat message reports structure owned by {@link Database}. Keep its keys and value contract
       * explicit so callers cannot smuggle a broader shape across this boundary.
       */
      chat_message_reports: {
        /**
         * keyed/nested row structure owned by {@link Database}. Keep its keys and value contract explicit so callers
         * cannot smuggle a broader shape across this boundary.
         */
        Row: {
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          created_at: string;
          /**
           * details value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          details: string | null;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: number;
          /**
           * numeric message id carried by {@link Database}. Its units and valid range are defined by {@link Database}
           * and must remain consistent across producers and consumers.
           */
          message_id: number;
          /**
           * typed metadata associated with {@link Database}. Preserve its declared contract at serialization and adapter
           * boundaries instead of weakening it to an unstructured record.
           */
          metadata: Json;
          /**
           * reason value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          reason: Database["public"]["Enums"]["chat_report_reason"];
          /**
           * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
           * must keep it synchronized with the accompanying fields.
           */
          report_status: Database["public"]["Enums"]["chat_report_status"];
          /**
           * string reporter user id carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          reporter_user_id: string;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          reviewed_at: string | null;
          /**
           * reviewed by value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          reviewed_by: string | null;
        };
        /**
         * keyed/nested insert structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
        Insert: {
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * Optional details value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          details?: string | null;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: number;
          /**
           * numeric message id carried by {@link Database}. Its units and valid range are defined by {@link Database}
           * and must remain consistent across producers and consumers.
           */
          message_id: number;
          /**
           * Optional typed metadata associated with {@link Database}. Preserve its declared contract at serialization
           * and adapter boundaries instead of weakening it to an unstructured record.
           */
          metadata?: Json;
          /**
           * reason value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          reason: Database["public"]["Enums"]["chat_report_reason"];
          /**
           * Optional discriminator for {@link Database}. It selects the valid branch and behavior, so producers and
           * consumers must keep it synchronized with the accompanying fields.
           */
          report_status?: Database["public"]["Enums"]["chat_report_status"];
          /**
           * string reporter user id carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          reporter_user_id: string;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          reviewed_at?: string | null;
          /**
           * Optional reviewed by value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          reviewed_by?: string | null;
        };
        /**
         * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
         * time domain declared by the enclosing contract.
         */
        Update: {
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * Optional details value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          details?: string | null;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: number;
          /**
           * Optional numeric message id carried by {@link Database}. Its units and valid range are defined by {@link
           * Database} and must remain consistent across producers and consumers.
           */
          message_id?: number;
          /**
           * Optional typed metadata associated with {@link Database}. Preserve its declared contract at serialization
           * and adapter boundaries instead of weakening it to an unstructured record.
           */
          metadata?: Json;
          /**
           * Optional reason value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          reason?: Database["public"]["Enums"]["chat_report_reason"];
          /**
           * Optional discriminator for {@link Database}. It selects the valid branch and behavior, so producers and
           * consumers must keep it synchronized with the accompanying fields.
           */
          report_status?: Database["public"]["Enums"]["chat_report_status"];
          /**
           * Optional string reporter user id carried by {@link Database}. Treat it according to the owning contract’s
           * validation and presentation rules rather than assuming it is a stable identifier.
           */
          reporter_user_id?: string;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          reviewed_at?: string | null;
          /**
           * Optional reviewed by value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          reviewed_by?: string | null;
        };
        /**
         * keyed/nested relationships structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
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
      /**
       * keyed/nested chat messages structure owned by {@link Database}. Keep its keys and value contract explicit so
       * callers cannot smuggle a broader shape across this boundary.
       */
      chat_messages: {
        /**
         * keyed/nested row structure owned by {@link Database}. Keep its keys and value contract explicit so callers
         * cannot smuggle a broader shape across this boundary.
         */
        Row: {
          /**
           * string body carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          body: string;
          /**
           * string channel id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          channel_id: string;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          created_at: string;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          deleted_at: string | null;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          edited_at: string | null;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: number;
          /**
           * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
           * must keep it synchronized with the accompanying fields.
           */
          message_status: Database["public"]["Enums"]["chat_message_status"];
          /**
           * typed metadata associated with {@link Database}. Preserve its declared contract at serialization and adapter
           * boundaries instead of weakening it to an unstructured record.
           */
          metadata: Json;
          /**
           * moderation reason value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          moderation_reason: string | null;
          /**
           * reply to message id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          reply_to_message_id: number | null;
          /**
           * sender user id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          sender_user_id: string | null;
        };
        /**
         * keyed/nested insert structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
        Insert: {
          /**
           * string body carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          body: string;
          /**
           * string channel id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          channel_id: string;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          deleted_at?: string | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          edited_at?: string | null;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: number;
          /**
           * Optional discriminator for {@link Database}. It selects the valid branch and behavior, so producers and
           * consumers must keep it synchronized with the accompanying fields.
           */
          message_status?: Database["public"]["Enums"]["chat_message_status"];
          /**
           * Optional typed metadata associated with {@link Database}. Preserve its declared contract at serialization
           * and adapter boundaries instead of weakening it to an unstructured record.
           */
          metadata?: Json;
          /**
           * Optional moderation reason value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          moderation_reason?: string | null;
          /**
           * Optional reply to message id value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          reply_to_message_id?: number | null;
          /**
           * Optional sender user id value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          sender_user_id?: string | null;
        };
        /**
         * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
         * time domain declared by the enclosing contract.
         */
        Update: {
          /**
           * Optional string body carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          body?: string;
          /**
           * Optional string channel id carried by {@link Database}. Treat it according to the owning contract’s
           * validation and presentation rules rather than assuming it is a stable identifier.
           */
          channel_id?: string;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          deleted_at?: string | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          edited_at?: string | null;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: number;
          /**
           * Optional discriminator for {@link Database}. It selects the valid branch and behavior, so producers and
           * consumers must keep it synchronized with the accompanying fields.
           */
          message_status?: Database["public"]["Enums"]["chat_message_status"];
          /**
           * Optional typed metadata associated with {@link Database}. Preserve its declared contract at serialization
           * and adapter boundaries instead of weakening it to an unstructured record.
           */
          metadata?: Json;
          /**
           * Optional moderation reason value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          moderation_reason?: string | null;
          /**
           * Optional reply to message id value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          reply_to_message_id?: number | null;
          /**
           * Optional sender user id value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          sender_user_id?: string | null;
        };
        /**
         * keyed/nested relationships structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
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
      /**
       * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
       * preserve ordering or uniqueness whenever the owning workflow relies on it.
       */
      game_score_metric_definitions: {
        /**
         * keyed/nested row structure owned by {@link Database}. Keep its keys and value contract explicit so callers
         * cannot smuggle a broader shape across this boundary.
         */
        Row: {
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          created_at: string;
          /**
           * human-facing description for {@link Database}. It supports UI, narration, or diagnostics and must not be
           * used as the stable identity of the record.
           */
          description: string | null;
          /**
           * numeric display order carried by {@link Database}. Its units and valid range are defined by {@link Database}
           * and must remain consistent across producers and consumers.
           */
          display_order: number;
          /**
           * string game key carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          game_key: string;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: number;
          /**
           * boolean policy/value on {@link Database} that explicitly controls whether the associated behavior is active;
           * do not infer it from unrelated state.
           */
          is_active: boolean;
          /**
           * string metric category carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          metric_category: string;
          /**
           * string metric key carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          metric_key: string;
          /**
           * human-facing metric name for {@link Database}. It supports UI, narration, or diagnostics and must not be
           * used as the stable identity of the record.
           */
          metric_name: string;
        };
        /**
         * keyed/nested insert structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
        Insert: {
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * Optional human-facing description for {@link Database}. It supports UI, narration, or diagnostics and must
           * not be used as the stable identity of the record.
           */
          description?: string | null;
          /**
           * Optional numeric display order carried by {@link Database}. Its units and valid range are defined by {@link
           * Database} and must remain consistent across producers and consumers.
           */
          display_order?: number;
          /**
           * string game key carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          game_key: string;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: number;
          /**
           * Optional boolean policy/value on {@link Database} that explicitly controls whether the associated behavior
           * is active; do not infer it from unrelated state.
           */
          is_active?: boolean;
          /**
           * string metric category carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          metric_category: string;
          /**
           * string metric key carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          metric_key: string;
          /**
           * human-facing metric name for {@link Database}. It supports UI, narration, or diagnostics and must not be
           * used as the stable identity of the record.
           */
          metric_name: string;
        };
        /**
         * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
         * time domain declared by the enclosing contract.
         */
        Update: {
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * Optional human-facing description for {@link Database}. It supports UI, narration, or diagnostics and must
           * not be used as the stable identity of the record.
           */
          description?: string | null;
          /**
           * Optional numeric display order carried by {@link Database}. Its units and valid range are defined by {@link
           * Database} and must remain consistent across producers and consumers.
           */
          display_order?: number;
          /**
           * Optional string game key carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          game_key?: string;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: number;
          /**
           * Optional boolean policy/value on {@link Database} that explicitly controls whether the associated behavior
           * is active; do not infer it from unrelated state.
           */
          is_active?: boolean;
          /**
           * Optional string metric category carried by {@link Database}. Treat it according to the owning contract’s
           * validation and presentation rules rather than assuming it is a stable identifier.
           */
          metric_category?: string;
          /**
           * Optional string metric key carried by {@link Database}. Treat it according to the owning contract’s
           * validation and presentation rules rather than assuming it is a stable identifier.
           */
          metric_key?: string;
          /**
           * Optional human-facing metric name for {@link Database}. It supports UI, narration, or diagnostics and must
           * not be used as the stable identity of the record.
           */
          metric_name?: string;
        };
        /**
         * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
         * preserve ordering or uniqueness whenever the owning workflow relies on it.
         */
        Relationships: [];
      };
      /**
       * keyed/nested game score metric values structure owned by {@link Database}. Keep its keys and value contract
       * explicit so callers cannot smuggle a broader shape across this boundary.
       */
      game_score_metric_values: {
        /**
         * keyed/nested row structure owned by {@link Database}. Keep its keys and value contract explicit so callers
         * cannot smuggle a broader shape across this boundary.
         */
        Row: {
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          created_at: string;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: number;
          /**
           * numeric metric definition id carried by {@link Database}. Its units and valid range are defined by {@link
           * Database} and must remain consistent across producers and consumers.
           */
          metric_definition_id: number;
          /**
           * numeric metric value carried by {@link Database}. Its units and valid range are defined by {@link Database}
           * and must remain consistent across producers and consumers.
           */
          metric_value: number;
          /**
           * numeric score record id carried by {@link Database}. Its units and valid range are defined by {@link
           * Database} and must remain consistent across producers and consumers.
           */
          score_record_id: number;
        };
        /**
         * keyed/nested insert structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
        Insert: {
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: number;
          /**
           * numeric metric definition id carried by {@link Database}. Its units and valid range are defined by {@link
           * Database} and must remain consistent across producers and consumers.
           */
          metric_definition_id: number;
          /**
           * Optional numeric metric value carried by {@link Database}. Its units and valid range are defined by {@link
           * Database} and must remain consistent across producers and consumers.
           */
          metric_value?: number;
          /**
           * numeric score record id carried by {@link Database}. Its units and valid range are defined by {@link
           * Database} and must remain consistent across producers and consumers.
           */
          score_record_id: number;
        };
        /**
         * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
         * time domain declared by the enclosing contract.
         */
        Update: {
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: number;
          /**
           * Optional numeric metric definition id carried by {@link Database}. Its units and valid range are defined by
           * {@link Database} and must remain consistent across producers and consumers.
           */
          metric_definition_id?: number;
          /**
           * Optional numeric metric value carried by {@link Database}. Its units and valid range are defined by {@link
           * Database} and must remain consistent across producers and consumers.
           */
          metric_value?: number;
          /**
           * Optional numeric score record id carried by {@link Database}. Its units and valid range are defined by
           * {@link Database} and must remain consistent across producers and consumers.
           */
          score_record_id?: number;
        };
        /**
         * keyed/nested relationships structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
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
      /**
       * keyed/nested game score records structure owned by {@link Database}. Keep its keys and value contract
       * explicit so callers cannot smuggle a broader shape across this boundary.
       */
      game_score_records: {
        /**
         * keyed/nested row structure owned by {@link Database}. Keep its keys and value contract explicit so callers
         * cannot smuggle a broader shape across this boundary.
         */
        Row: {
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          created_at: string;
          /**
           * string game key carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          game_key: string;
          /**
           * string game session id carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          game_session_id: string;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: number;
          /**
           * typed metadata associated with {@link Database}. Preserve its declared contract at serialization and adapter
           * boundaries instead of weakening it to an unstructured record.
           */
          metadata: Json;
          /**
           * participant id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          participant_id: number | null;
          /**
           * ranking scope key value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          ranking_scope_key: string | null;
          /**
           * string score unit carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          score_unit: string;
          /**
           * numeric score value carried by {@link Database}. Its units and valid range are defined by {@link Database}
           * and must remain consistent across producers and consumers.
           */
          score_value: number;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          submitted_at: string;
          /**
           * submitted by user id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          submitted_by_user_id: string | null;
          /**
           * user id value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          user_id: string | null;
        };
        /**
         * keyed/nested insert structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
        Insert: {
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * string game key carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          game_key: string;
          /**
           * string game session id carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          game_session_id: string;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: number;
          /**
           * Optional typed metadata associated with {@link Database}. Preserve its declared contract at serialization
           * and adapter boundaries instead of weakening it to an unstructured record.
           */
          metadata?: Json;
          /**
           * Optional participant id value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          participant_id?: number | null;
          /**
           * Optional ranking scope key value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          ranking_scope_key?: string | null;
          /**
           * Optional string score unit carried by {@link Database}. Treat it according to the owning contract’s
           * validation and presentation rules rather than assuming it is a stable identifier.
           */
          score_unit?: string;
          /**
           * numeric score value carried by {@link Database}. Its units and valid range are defined by {@link Database}
           * and must remain consistent across producers and consumers.
           */
          score_value: number;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          submitted_at?: string;
          /**
           * Optional submitted by user id value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          submitted_by_user_id?: string | null;
          /**
           * Optional user id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          user_id?: string | null;
        };
        /**
         * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
         * time domain declared by the enclosing contract.
         */
        Update: {
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * Optional string game key carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          game_key?: string;
          /**
           * Optional string game session id carried by {@link Database}. Treat it according to the owning contract’s
           * validation and presentation rules rather than assuming it is a stable identifier.
           */
          game_session_id?: string;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: number;
          /**
           * Optional typed metadata associated with {@link Database}. Preserve its declared contract at serialization
           * and adapter boundaries instead of weakening it to an unstructured record.
           */
          metadata?: Json;
          /**
           * Optional participant id value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          participant_id?: number | null;
          /**
           * Optional ranking scope key value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          ranking_scope_key?: string | null;
          /**
           * Optional string score unit carried by {@link Database}. Treat it according to the owning contract’s
           * validation and presentation rules rather than assuming it is a stable identifier.
           */
          score_unit?: string;
          /**
           * Optional numeric score value carried by {@link Database}. Its units and valid range are defined by {@link
           * Database} and must remain consistent across producers and consumers.
           */
          score_value?: number;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          submitted_at?: string;
          /**
           * Optional submitted by user id value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          submitted_by_user_id?: string | null;
          /**
           * Optional user id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          user_id?: string | null;
        };
        /**
         * keyed/nested relationships structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
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
      /**
       * keyed/nested game score snapshots structure owned by {@link Database}. Keep its keys and value contract
       * explicit so callers cannot smuggle a broader shape across this boundary.
       */
      game_score_snapshots: {
        /**
         * keyed/nested row structure owned by {@link Database}. Keep its keys and value contract explicit so callers
         * cannot smuggle a broader shape across this boundary.
         */
        Row: {
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          created_at: string;
          /**
           * string game session id carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          game_session_id: string;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: number;
          /**
           * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
           * must keep it synchronized with the accompanying fields.
           */
          snapshot_kind: string;
          /**
           * snapshots value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          snapshots: Json;
        };
        /**
         * keyed/nested insert structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
        Insert: {
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * string game session id carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          game_session_id: string;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: number;
          /**
           * Optional discriminator for {@link Database}. It selects the valid branch and behavior, so producers and
           * consumers must keep it synchronized with the accompanying fields.
           */
          snapshot_kind?: string;
          /**
           * snapshots value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          snapshots: Json;
        };
        /**
         * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
         * time domain declared by the enclosing contract.
         */
        Update: {
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * Optional string game session id carried by {@link Database}. Treat it according to the owning contract’s
           * validation and presentation rules rather than assuming it is a stable identifier.
           */
          game_session_id?: string;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: number;
          /**
           * Optional discriminator for {@link Database}. It selects the valid branch and behavior, so producers and
           * consumers must keep it synchronized with the accompanying fields.
           */
          snapshot_kind?: string;
          /**
           * Optional snapshots value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          snapshots?: Json;
        };
        /**
         * keyed/nested relationships structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
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
      /**
       * keyed/nested game session participants structure owned by {@link Database}. Keep its keys and value contract
       * explicit so callers cannot smuggle a broader shape across this boundary.
       */
      game_session_participants: {
        /**
         * keyed/nested row structure owned by {@link Database}. Keep its keys and value contract explicit so callers
         * cannot smuggle a broader shape across this boundary.
         */
        Row: {
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          created_at: string;
          /**
           * human-facing display name for {@link Database}. It supports UI, narration, or diagnostics and must not be
           * used as the stable identity of the record.
           */
          display_name: string;
          /**
           * eliminated value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          eliminated: boolean;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          eliminated_at: string | null;
          /**
           * faction key value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          faction_key: string | null;
          /**
           * string game session id carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          game_session_id: string;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: number;
          /**
           * typed metadata associated with {@link Database}. Preserve its declared contract at serialization and adapter
           * boundaries instead of weakening it to an unstructured record.
           */
          metadata: Json;
          /**
           * numeric participant number carried by {@link Database}. Its units and valid range are defined by {@link
           * Database} and must remain consistent across producers and consumers.
           */
          participant_number: number;
          /**
           * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
           * must keep it synchronized with the accompanying fields.
           */
          participant_type: Database["public"]["Enums"]["game_participant_type"];
          /**
           * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
           * must keep it synchronized with the accompanying fields.
           */
          result_status: Database["public"]["Enums"]["game_result_status"] | null;
          /**
           * team key value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          team_key: string | null;
          /**
           * user id value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          user_id: string | null;
        };
        /**
         * keyed/nested insert structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
        Insert: {
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * human-facing display name for {@link Database}. It supports UI, narration, or diagnostics and must not be
           * used as the stable identity of the record.
           */
          display_name: string;
          /**
           * Optional eliminated value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          eliminated?: boolean;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          eliminated_at?: string | null;
          /**
           * Optional faction key value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          faction_key?: string | null;
          /**
           * string game session id carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          game_session_id: string;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: number;
          /**
           * Optional typed metadata associated with {@link Database}. Preserve its declared contract at serialization
           * and adapter boundaries instead of weakening it to an unstructured record.
           */
          metadata?: Json;
          /**
           * numeric participant number carried by {@link Database}. Its units and valid range are defined by {@link
           * Database} and must remain consistent across producers and consumers.
           */
          participant_number: number;
          /**
           * Optional discriminator for {@link Database}. It selects the valid branch and behavior, so producers and
           * consumers must keep it synchronized with the accompanying fields.
           */
          participant_type?: Database["public"]["Enums"]["game_participant_type"];
          /**
           * Optional discriminator for {@link Database}. It selects the valid branch and behavior, so producers and
           * consumers must keep it synchronized with the accompanying fields.
           */
          result_status?: Database["public"]["Enums"]["game_result_status"] | null;
          /**
           * Optional team key value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          team_key?: string | null;
          /**
           * Optional user id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          user_id?: string | null;
        };
        /**
         * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
         * time domain declared by the enclosing contract.
         */
        Update: {
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * Optional human-facing display name for {@link Database}. It supports UI, narration, or diagnostics and must
           * not be used as the stable identity of the record.
           */
          display_name?: string;
          /**
           * Optional eliminated value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          eliminated?: boolean;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          eliminated_at?: string | null;
          /**
           * Optional faction key value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          faction_key?: string | null;
          /**
           * Optional string game session id carried by {@link Database}. Treat it according to the owning contract’s
           * validation and presentation rules rather than assuming it is a stable identifier.
           */
          game_session_id?: string;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: number;
          /**
           * Optional typed metadata associated with {@link Database}. Preserve its declared contract at serialization
           * and adapter boundaries instead of weakening it to an unstructured record.
           */
          metadata?: Json;
          /**
           * Optional numeric participant number carried by {@link Database}. Its units and valid range are defined by
           * {@link Database} and must remain consistent across producers and consumers.
           */
          participant_number?: number;
          /**
           * Optional discriminator for {@link Database}. It selects the valid branch and behavior, so producers and
           * consumers must keep it synchronized with the accompanying fields.
           */
          participant_type?: Database["public"]["Enums"]["game_participant_type"];
          /**
           * Optional discriminator for {@link Database}. It selects the valid branch and behavior, so producers and
           * consumers must keep it synchronized with the accompanying fields.
           */
          result_status?: Database["public"]["Enums"]["game_result_status"] | null;
          /**
           * Optional team key value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          team_key?: string | null;
          /**
           * Optional user id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          user_id?: string | null;
        };
        /**
         * keyed/nested relationships structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
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
      /**
       * keyed/nested game sessions structure owned by {@link Database}. Keep its keys and value contract explicit so
       * callers cannot smuggle a broader shape across this boundary.
       */
      game_sessions: {
        /**
         * keyed/nested row structure owned by {@link Database}. Keep its keys and value contract explicit so callers
         * cannot smuggle a broader shape across this boundary.
         */
        Row: {
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          completed_at: string | null;
          /**
           * completed by user id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          completed_by_user_id: string | null;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          created_at: string;
          /**
           * created by user id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          created_by_user_id: string | null;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          ended_at: string | null;
          /**
           * external session id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          external_session_id: string | null;
          /**
           * string game key carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          game_key: string;
          /**
           * game mode key value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          game_mode_key: string | null;
          /**
           * numeric bound or quantity carried by {@link Database}. Interpret it in the owning contract’s units and
           * preserve its validation constraints at boundaries.
           */
          human_player_count: number;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: string;
          /**
           * level key value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          level_key: string | null;
          /**
           * map key value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          map_key: string | null;
          /**
           * typed metadata associated with {@link Database}. Preserve its declared contract at serialization and adapter
           * boundaries instead of weakening it to an unstructured record.
           */
          metadata: Json;
          /**
           * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
           * must keep it synchronized with the accompanying fields.
           */
          session_status: Database["public"]["Enums"]["game_session_status"];
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          started_at: string;
          /**
           * total duration seconds value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          total_duration_seconds: number | null;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          updated_at: string;
        };
        /**
         * keyed/nested insert structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
        Insert: {
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          completed_at?: string | null;
          /**
           * Optional completed by user id value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          completed_by_user_id?: string | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * Optional created by user id value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          created_by_user_id?: string | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          ended_at?: string | null;
          /**
           * Optional external session id value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          external_session_id?: string | null;
          /**
           * string game key carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          game_key: string;
          /**
           * Optional game mode key value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          game_mode_key?: string | null;
          /**
           * Optional numeric bound or quantity carried by {@link Database}. Interpret it in the owning contract’s units
           * and preserve its validation constraints at boundaries.
           */
          human_player_count?: number;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: string;
          /**
           * Optional level key value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          level_key?: string | null;
          /**
           * Optional map key value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          map_key?: string | null;
          /**
           * Optional typed metadata associated with {@link Database}. Preserve its declared contract at serialization
           * and adapter boundaries instead of weakening it to an unstructured record.
           */
          metadata?: Json;
          /**
           * Optional discriminator for {@link Database}. It selects the valid branch and behavior, so producers and
           * consumers must keep it synchronized with the accompanying fields.
           */
          session_status?: Database["public"]["Enums"]["game_session_status"];
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          started_at?: string;
          /**
           * Optional total duration seconds value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          total_duration_seconds?: number | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          updated_at?: string;
        };
        /**
         * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
         * time domain declared by the enclosing contract.
         */
        Update: {
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          completed_at?: string | null;
          /**
           * Optional completed by user id value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          completed_by_user_id?: string | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * Optional created by user id value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          created_by_user_id?: string | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          ended_at?: string | null;
          /**
           * Optional external session id value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          external_session_id?: string | null;
          /**
           * Optional string game key carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          game_key?: string;
          /**
           * Optional game mode key value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          game_mode_key?: string | null;
          /**
           * Optional numeric bound or quantity carried by {@link Database}. Interpret it in the owning contract’s units
           * and preserve its validation constraints at boundaries.
           */
          human_player_count?: number;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: string;
          /**
           * Optional level key value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          level_key?: string | null;
          /**
           * Optional map key value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          map_key?: string | null;
          /**
           * Optional typed metadata associated with {@link Database}. Preserve its declared contract at serialization
           * and adapter boundaries instead of weakening it to an unstructured record.
           */
          metadata?: Json;
          /**
           * Optional discriminator for {@link Database}. It selects the valid branch and behavior, so producers and
           * consumers must keep it synchronized with the accompanying fields.
           */
          session_status?: Database["public"]["Enums"]["game_session_status"];
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          started_at?: string;
          /**
           * Optional total duration seconds value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          total_duration_seconds?: number | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          updated_at?: string;
        };
        /**
         * keyed/nested relationships structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
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
      /**
       * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
       * preserve ordering or uniqueness whenever the owning workflow relies on it.
       */
      probable_waffle_campaign_profiles: {
        /**
         * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
         * preserve ordering or uniqueness whenever the owning workflow relies on it.
         */
        Row: {
          /**
           * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
           * preserve ordering or uniqueness whenever the owning workflow relies on it.
           */
          active_loadout_ids: string[];
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          created_at: string;
          /**
           * profile document value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          profile_document: Json;
          /**
           * compatibility revision for {@link Database}. Consumers use it to choose validation, migration, or
           * conflict-handling rules instead of guessing the payload shape.
           */
          revision: number;
          /**
           * compatibility schema version for {@link Database}. Consumers use it to choose validation, migration, or
           * conflict-handling rules instead of guessing the payload shape.
           */
          schema_version: number;
          /**
           * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
           * preserve ordering or uniqueness whenever the owning workflow relies on it.
           */
          seen_cinematic_ids: string[];
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          updated_at: string;
          /**
           * string user id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          user_id: string;
        };
        /**
         * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
         * preserve ordering or uniqueness whenever the owning workflow relies on it.
         */
        Insert: {
          /**
           * Optional collection value on {@link Database}. Its element type defines the records that may cross this
           * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
           */
          active_loadout_ids?: string[];
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * profile document value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          profile_document: Json;
          /**
           * Optional compatibility revision for {@link Database}. Consumers use it to choose validation, migration, or
           * conflict-handling rules instead of guessing the payload shape.
           */
          revision?: number;
          /**
           * Optional compatibility schema version for {@link Database}. Consumers use it to choose validation,
           * migration, or conflict-handling rules instead of guessing the payload shape.
           */
          schema_version?: number;
          /**
           * Optional collection value on {@link Database}. Its element type defines the records that may cross this
           * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
           */
          seen_cinematic_ids?: string[];
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          updated_at?: string;
          /**
           * string user id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          user_id: string;
        };
        /**
         * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
         * time domain declared by the enclosing contract.
         */
        Update: {
          /**
           * Optional collection value on {@link Database}. Its element type defines the records that may cross this
           * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
           */
          active_loadout_ids?: string[];
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * Optional profile document value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          profile_document?: Json;
          /**
           * Optional compatibility revision for {@link Database}. Consumers use it to choose validation, migration, or
           * conflict-handling rules instead of guessing the payload shape.
           */
          revision?: number;
          /**
           * Optional compatibility schema version for {@link Database}. Consumers use it to choose validation,
           * migration, or conflict-handling rules instead of guessing the payload shape.
           */
          schema_version?: number;
          /**
           * Optional collection value on {@link Database}. Its element type defines the records that may cross this
           * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
           */
          seen_cinematic_ids?: string[];
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          updated_at?: string;
          /**
           * Optional string user id carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          user_id?: string;
        };
        /**
         * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
         * preserve ordering or uniqueness whenever the owning workflow relies on it.
         */
        Relationships: [];
      };
      /**
       * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
       * preserve ordering or uniqueness whenever the owning workflow relies on it.
       */
      probable_waffle_campaign_progress: {
        /**
         * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
         * preserve ordering or uniqueness whenever the owning workflow relies on it.
         */
        Row: {
          /**
           * best difficulty value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          best_difficulty: Database["public"]["Enums"]["probable_waffle_campaign_difficulty"];
          /**
           * best duration seconds value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          best_duration_seconds: number | null;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          completed_at: string;
          /**
           * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
           * preserve ordering or uniqueness whenever the owning workflow relies on it.
           */
          completed_objective_ids: string[];
          /**
           * numeric bound or quantity carried by {@link Database}. Interpret it in the owning contract’s units and
           * preserve its validation constraints at boundaries.
           */
          completion_count: number;
          /**
           * mission id value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          mission_id: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"];
          /**
           * result metadata value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          result_metadata: Json;
          /**
           * string user id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          user_id: string;
        };
        /**
         * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
         * preserve ordering or uniqueness whenever the owning workflow relies on it.
         */
        Insert: {
          /**
           * Optional best difficulty value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          best_difficulty?: Database["public"]["Enums"]["probable_waffle_campaign_difficulty"];
          /**
           * Optional best duration seconds value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          best_duration_seconds?: number | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          completed_at?: string;
          /**
           * Optional collection value on {@link Database}. Its element type defines the records that may cross this
           * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
           */
          completed_objective_ids?: string[];
          /**
           * Optional numeric bound or quantity carried by {@link Database}. Interpret it in the owning contract’s units
           * and preserve its validation constraints at boundaries.
           */
          completion_count?: number;
          /**
           * mission id value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          mission_id: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"];
          /**
           * Optional result metadata value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          result_metadata?: Json;
          /**
           * string user id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          user_id: string;
        };
        /**
         * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
         * time domain declared by the enclosing contract.
         */
        Update: {
          /**
           * Optional best difficulty value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          best_difficulty?: Database["public"]["Enums"]["probable_waffle_campaign_difficulty"];
          /**
           * Optional best duration seconds value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          best_duration_seconds?: number | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          completed_at?: string;
          /**
           * Optional collection value on {@link Database}. Its element type defines the records that may cross this
           * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
           */
          completed_objective_ids?: string[];
          /**
           * Optional numeric bound or quantity carried by {@link Database}. Interpret it in the owning contract’s units
           * and preserve its validation constraints at boundaries.
           */
          completion_count?: number;
          /**
           * Optional mission id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          mission_id?: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"];
          /**
           * Optional result metadata value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          result_metadata?: Json;
          /**
           * Optional string user id carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          user_id?: string;
        };
        /**
         * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
         * preserve ordering or uniqueness whenever the owning workflow relies on it.
         */
        Relationships: [];
      };
      /**
       * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
       * preserve ordering or uniqueness whenever the owning workflow relies on it.
       */
      probable_waffle_campaign_runs: {
        /**
         * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
         * preserve ordering or uniqueness whenever the owning workflow relies on it.
         */
        Row: {
          /**
           * compatibility base profile revision for {@link Database}. Consumers use it to choose validation, migration,
           * or conflict-handling rules instead of guessing the payload shape.
           */
          base_profile_revision: number;
          /**
           * commit result value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          commit_result: Json | null;
          /**
           * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
           * must keep it synchronized with the accompanying fields.
           */
          commit_status: Database["public"]["Enums"]["probable_waffle_campaign_commit_status"];
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          completed_at: string | null;
          /**
           * difficulty value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          difficulty: Database["public"]["Enums"]["probable_waffle_campaign_difficulty"];
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: string;
          /**
           * integrity value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          integrity: Json;
          /**
           * string loadout snapshot hash carried by {@link Database}. Treat it according to the owning contract’s
           * validation and presentation rules rather than assuming it is a stable identifier.
           */
          loadout_snapshot_hash: string;
          /**
           * mission id value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          mission_id: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"];
          /**
           * compatibility mission revision for {@link Database}. Consumers use it to choose validation, migration, or
           * conflict-handling rules instead of guessing the payload shape.
           */
          mission_revision: number;
          /**
           * outcome value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          outcome: Database["public"]["Enums"]["probable_waffle_campaign_outcome"] | null;
          /**
           * result metadata value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          result_metadata: Json;
          /**
           * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
           * preserve ordering or uniqueness whenever the owning workflow relies on it.
           */
          selected_loadout_ids: string[];
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          started_at: string;
          /**
           * string user id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          user_id: string;
        };
        /**
         * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
         * preserve ordering or uniqueness whenever the owning workflow relies on it.
         */
        Insert: {
          /**
           * Optional compatibility base profile revision for {@link Database}. Consumers use it to choose validation,
           * migration, or conflict-handling rules instead of guessing the payload shape.
           */
          base_profile_revision?: number;
          /**
           * Optional commit result value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          commit_result?: Json | null;
          /**
           * Optional discriminator for {@link Database}. It selects the valid branch and behavior, so producers and
           * consumers must keep it synchronized with the accompanying fields.
           */
          commit_status?: Database["public"]["Enums"]["probable_waffle_campaign_commit_status"];
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          completed_at?: string | null;
          /**
           * Optional difficulty value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          difficulty?: Database["public"]["Enums"]["probable_waffle_campaign_difficulty"];
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: string;
          /**
           * Optional integrity value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          integrity?: Json;
          /**
           * Optional string loadout snapshot hash carried by {@link Database}. Treat it according to the owning
           * contract’s validation and presentation rules rather than assuming it is a stable identifier.
           */
          loadout_snapshot_hash?: string;
          /**
           * mission id value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          mission_id: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"];
          /**
           * Optional compatibility mission revision for {@link Database}. Consumers use it to choose validation,
           * migration, or conflict-handling rules instead of guessing the payload shape.
           */
          mission_revision?: number;
          /**
           * Optional outcome value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          outcome?: Database["public"]["Enums"]["probable_waffle_campaign_outcome"] | null;
          /**
           * Optional result metadata value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          result_metadata?: Json;
          /**
           * Optional collection value on {@link Database}. Its element type defines the records that may cross this
           * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
           */
          selected_loadout_ids?: string[];
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          started_at?: string;
          /**
           * string user id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          user_id: string;
        };
        /**
         * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
         * time domain declared by the enclosing contract.
         */
        Update: {
          /**
           * Optional compatibility base profile revision for {@link Database}. Consumers use it to choose validation,
           * migration, or conflict-handling rules instead of guessing the payload shape.
           */
          base_profile_revision?: number;
          /**
           * Optional commit result value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          commit_result?: Json | null;
          /**
           * Optional discriminator for {@link Database}. It selects the valid branch and behavior, so producers and
           * consumers must keep it synchronized with the accompanying fields.
           */
          commit_status?: Database["public"]["Enums"]["probable_waffle_campaign_commit_status"];
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          completed_at?: string | null;
          /**
           * Optional difficulty value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          difficulty?: Database["public"]["Enums"]["probable_waffle_campaign_difficulty"];
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: string;
          /**
           * Optional integrity value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          integrity?: Json;
          /**
           * Optional string loadout snapshot hash carried by {@link Database}. Treat it according to the owning
           * contract’s validation and presentation rules rather than assuming it is a stable identifier.
           */
          loadout_snapshot_hash?: string;
          /**
           * Optional mission id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          mission_id?: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"];
          /**
           * Optional compatibility mission revision for {@link Database}. Consumers use it to choose validation,
           * migration, or conflict-handling rules instead of guessing the payload shape.
           */
          mission_revision?: number;
          /**
           * Optional outcome value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          outcome?: Database["public"]["Enums"]["probable_waffle_campaign_outcome"] | null;
          /**
           * Optional result metadata value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          result_metadata?: Json;
          /**
           * Optional collection value on {@link Database}. Its element type defines the records that may cross this
           * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
           */
          selected_loadout_ids?: string[];
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          started_at?: string;
          /**
           * Optional string user id carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          user_id?: string;
        };
        /**
         * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
         * preserve ordering or uniqueness whenever the owning workflow relies on it.
         */
        Relationships: [];
      };
      /**
       * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
       * preserve ordering or uniqueness whenever the owning workflow relies on it.
       */
      probable_waffle_campaign_reward_claims: {
        /**
         * keyed/nested row structure owned by {@link Database}. Keep its keys and value contract explicit so callers
         * cannot smuggle a broader shape across this boundary.
         */
        Row: {
          /**
           * string claim id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          claim_id: string;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          claimed_at: string;
          /**
           * committed delta value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          committed_delta: Json;
          /**
           * mission id value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          mission_id: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"];
          /**
           * string run id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          run_id: string;
          /**
           * string user id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          user_id: string;
        };
        /**
         * keyed/nested insert structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
        Insert: {
          /**
           * string claim id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          claim_id: string;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          claimed_at?: string;
          /**
           * committed delta value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          committed_delta: Json;
          /**
           * mission id value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          mission_id: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"];
          /**
           * string run id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          run_id: string;
          /**
           * string user id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          user_id: string;
        };
        /**
         * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
         * time domain declared by the enclosing contract.
         */
        Update: {
          /**
           * Optional string claim id carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          claim_id?: string;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          claimed_at?: string;
          /**
           * Optional committed delta value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          committed_delta?: Json;
          /**
           * Optional mission id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          mission_id?: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"];
          /**
           * Optional string run id carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          run_id?: string;
          /**
           * Optional string user id carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          user_id?: string;
        };
        /**
         * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
         * preserve ordering or uniqueness whenever the owning workflow relies on it.
         */
        Relationships: [];
      };
      /**
       * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
       * preserve ordering or uniqueness whenever the owning workflow relies on it.
       */
      probable_waffle_game_saves: {
        /**
         * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
         * preserve ordering or uniqueness whenever the owning workflow relies on it.
         */
        Row: {
          /**
           * campaign checkpoint id value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          campaign_checkpoint_id: string | null;
          /**
           * campaign chapter id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          campaign_chapter_id: Database["public"]["Enums"]["probable_waffle_campaign_chapter_id"] | null;
          /**
           * campaign id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          campaign_id: string | null;
          /**
           * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
           * preserve ordering or uniqueness whenever the owning workflow relies on it.
           */
          campaign_loadout_ids: string[] | null;
          /**
           * campaign loadout snapshot hash value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          campaign_loadout_snapshot_hash: string | null;
          /**
           * campaign mission id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          campaign_mission_id: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"] | null;
          /**
           * compatibility campaign mission revision for {@link Database}. Consumers use it to choose validation,
           * migration, or conflict-handling rules instead of guessing the payload shape.
           */
          campaign_mission_revision: number | null;
          /**
           * numeric bound or quantity carried by {@link Database}. Interpret it in the owning contract’s units and
           * preserve its validation constraints at boundaries.
           */
          campaign_participant_count: number | null;
          /**
           * campaign participant progression snapshots value carried by {@link Database}. Its declared type is the
           * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
           * shape.
           */
          campaign_participant_progression_snapshots: Json | null;
          /**
           * compatibility campaign profile revision for {@link Database}. Consumers use it to choose validation,
           * migration, or conflict-handling rules instead of guessing the payload shape.
           */
          campaign_profile_revision: number | null;
          /**
           * campaign run id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          campaign_run_id: string | null;
          /**
           * compatibility campaign runtime schema version for {@link Database}. Consumers use it to choose validation,
           * migration, or conflict-handling rules instead of guessing the payload shape.
           */
          campaign_runtime_schema_version: number | null;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          created_at: string;
          /**
           * string encoded game instance data carried by {@link Database}. Treat it according to the owning contract’s
           * validation and presentation rules rather than assuming it is a stable identifier.
           */
          encoded_game_instance_data: string;
          /**
           * compatibility format version for {@link Database}. Consumers use it to choose validation, migration, or
           * conflict-handling rules instead of guessing the payload shape.
           */
          format_version: number;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: string;
          /**
           * boolean policy/value on {@link Database} that explicitly controls whether the associated behavior is active;
           * do not infer it from unrelated state.
           */
          is_deleted: boolean;
          /**
           * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
           * must keep it synchronized with the accompanying fields.
           */
          kind: Database["public"]["Enums"]["probable_waffle_game_save_kind"];
          /**
           * human-facing name for {@link Database}. It supports UI, narration, or diagnostics and must not be used as
           * the stable identity of the record.
           */
          name: string | null;
          /**
           * compatibility revision for {@link Database}. Consumers use it to choose validation, migration, or
           * conflict-handling rules instead of guessing the payload shape.
           */
          revision: number;
          /**
           * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
           * must keep it synchronized with the accompanying fields.
           */
          scope: Database["public"]["Enums"]["probable_waffle_game_save_scope"];
          /**
           * thumbnail value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          thumbnail: string | null;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          updated_at: string;
          /**
           * string user id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          user_id: string;
        };
        /**
         * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
         * preserve ordering or uniqueness whenever the owning workflow relies on it.
         */
        Insert: {
          /**
           * Optional campaign checkpoint id value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          campaign_checkpoint_id?: string | null;
          /**
           * Optional campaign chapter id value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          campaign_chapter_id?: Database["public"]["Enums"]["probable_waffle_campaign_chapter_id"] | null;
          /**
           * Optional campaign id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          campaign_id?: string | null;
          /**
           * Optional collection value on {@link Database}. Its element type defines the records that may cross this
           * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
           */
          campaign_loadout_ids?: string[] | null;
          /**
           * Optional campaign loadout snapshot hash value carried by {@link Database}. Its declared type is the
           * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
           * shape.
           */
          campaign_loadout_snapshot_hash?: string | null;
          /**
           * Optional campaign mission id value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          campaign_mission_id?: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"] | null;
          /**
           * Optional compatibility campaign mission revision for {@link Database}. Consumers use it to choose
           * validation, migration, or conflict-handling rules instead of guessing the payload shape.
           */
          campaign_mission_revision?: number | null;
          /**
           * Optional numeric bound or quantity carried by {@link Database}. Interpret it in the owning contract’s units
           * and preserve its validation constraints at boundaries.
           */
          campaign_participant_count?: number | null;
          /**
           * Optional campaign participant progression snapshots value carried by {@link Database}. Its declared type is
           * the compatibility boundary for producers, validators, and consumers; do not replace it with a broader
           * inferred shape.
           */
          campaign_participant_progression_snapshots?: Json | null;
          /**
           * Optional compatibility campaign profile revision for {@link Database}. Consumers use it to choose
           * validation, migration, or conflict-handling rules instead of guessing the payload shape.
           */
          campaign_profile_revision?: number | null;
          /**
           * Optional campaign run id value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          campaign_run_id?: string | null;
          /**
           * Optional compatibility campaign runtime schema version for {@link Database}. Consumers use it to choose
           * validation, migration, or conflict-handling rules instead of guessing the payload shape.
           */
          campaign_runtime_schema_version?: number | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * string encoded game instance data carried by {@link Database}. Treat it according to the owning contract’s
           * validation and presentation rules rather than assuming it is a stable identifier.
           */
          encoded_game_instance_data: string;
          /**
           * compatibility format version for {@link Database}. Consumers use it to choose validation, migration, or
           * conflict-handling rules instead of guessing the payload shape.
           */
          format_version: number;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: string;
          /**
           * Optional boolean policy/value on {@link Database} that explicitly controls whether the associated behavior
           * is active; do not infer it from unrelated state.
           */
          is_deleted?: boolean;
          /**
           * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
           * must keep it synchronized with the accompanying fields.
           */
          kind: Database["public"]["Enums"]["probable_waffle_game_save_kind"];
          /**
           * Optional human-facing name for {@link Database}. It supports UI, narration, or diagnostics and must not be
           * used as the stable identity of the record.
           */
          name?: string | null;
          /**
           * compatibility revision for {@link Database}. Consumers use it to choose validation, migration, or
           * conflict-handling rules instead of guessing the payload shape.
           */
          revision: number;
          /**
           * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
           * must keep it synchronized with the accompanying fields.
           */
          scope: Database["public"]["Enums"]["probable_waffle_game_save_scope"];
          /**
           * Optional thumbnail value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          thumbnail?: string | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          updated_at?: string;
          /**
           * string user id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          user_id: string;
        };
        /**
         * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
         * time domain declared by the enclosing contract.
         */
        Update: {
          /**
           * Optional campaign checkpoint id value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          campaign_checkpoint_id?: string | null;
          /**
           * Optional campaign chapter id value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          campaign_chapter_id?: Database["public"]["Enums"]["probable_waffle_campaign_chapter_id"] | null;
          /**
           * Optional campaign id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          campaign_id?: string | null;
          /**
           * Optional collection value on {@link Database}. Its element type defines the records that may cross this
           * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
           */
          campaign_loadout_ids?: string[] | null;
          /**
           * Optional campaign loadout snapshot hash value carried by {@link Database}. Its declared type is the
           * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
           * shape.
           */
          campaign_loadout_snapshot_hash?: string | null;
          /**
           * Optional campaign mission id value carried by {@link Database}. Its declared type is the compatibility
           * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          campaign_mission_id?: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"] | null;
          /**
           * Optional compatibility campaign mission revision for {@link Database}. Consumers use it to choose
           * validation, migration, or conflict-handling rules instead of guessing the payload shape.
           */
          campaign_mission_revision?: number | null;
          /**
           * Optional numeric bound or quantity carried by {@link Database}. Interpret it in the owning contract’s units
           * and preserve its validation constraints at boundaries.
           */
          campaign_participant_count?: number | null;
          /**
           * Optional campaign participant progression snapshots value carried by {@link Database}. Its declared type is
           * the compatibility boundary for producers, validators, and consumers; do not replace it with a broader
           * inferred shape.
           */
          campaign_participant_progression_snapshots?: Json | null;
          /**
           * Optional compatibility campaign profile revision for {@link Database}. Consumers use it to choose
           * validation, migration, or conflict-handling rules instead of guessing the payload shape.
           */
          campaign_profile_revision?: number | null;
          /**
           * Optional campaign run id value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          campaign_run_id?: string | null;
          /**
           * Optional compatibility campaign runtime schema version for {@link Database}. Consumers use it to choose
           * validation, migration, or conflict-handling rules instead of guessing the payload shape.
           */
          campaign_runtime_schema_version?: number | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * Optional string encoded game instance data carried by {@link Database}. Treat it according to the owning
           * contract’s validation and presentation rules rather than assuming it is a stable identifier.
           */
          encoded_game_instance_data?: string;
          /**
           * Optional compatibility format version for {@link Database}. Consumers use it to choose validation,
           * migration, or conflict-handling rules instead of guessing the payload shape.
           */
          format_version?: number;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: string;
          /**
           * Optional boolean policy/value on {@link Database} that explicitly controls whether the associated behavior
           * is active; do not infer it from unrelated state.
           */
          is_deleted?: boolean;
          /**
           * Optional discriminator for {@link Database}. It selects the valid branch and behavior, so producers and
           * consumers must keep it synchronized with the accompanying fields.
           */
          kind?: Database["public"]["Enums"]["probable_waffle_game_save_kind"];
          /**
           * Optional human-facing name for {@link Database}. It supports UI, narration, or diagnostics and must not be
           * used as the stable identity of the record.
           */
          name?: string | null;
          /**
           * Optional compatibility revision for {@link Database}. Consumers use it to choose validation, migration, or
           * conflict-handling rules instead of guessing the payload shape.
           */
          revision?: number;
          /**
           * Optional discriminator for {@link Database}. It selects the valid branch and behavior, so producers and
           * consumers must keep it synchronized with the accompanying fields.
           */
          scope?: Database["public"]["Enums"]["probable_waffle_game_save_scope"];
          /**
           * Optional thumbnail value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          thumbnail?: string | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          updated_at?: string;
          /**
           * Optional string user id carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          user_id?: string;
        };
        /**
         * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
         * preserve ordering or uniqueness whenever the owning workflow relies on it.
         */
        Relationships: [];
      };
      /**
       * keyed/nested user achievement unlocks structure owned by {@link Database}. Keep its keys and value contract
       * explicit so callers cannot smuggle a broader shape across this boundary.
       */
      user_achievement_unlocks: {
        /**
         * keyed/nested row structure owned by {@link Database}. Keep its keys and value contract explicit so callers
         * cannot smuggle a broader shape across this boundary.
         */
        Row: {
          /**
           * string achievement id carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          achievement_id: string;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: number;
          /**
           * typed metadata associated with {@link Database}. Preserve its declared contract at serialization and adapter
           * boundaries instead of weakening it to an unstructured record.
           */
          metadata: Json;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          unlocked_at: string;
          /**
           * string user id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          user_id: string;
        };
        /**
         * keyed/nested insert structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
        Insert: {
          /**
           * string achievement id carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          achievement_id: string;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: number;
          /**
           * Optional typed metadata associated with {@link Database}. Preserve its declared contract at serialization
           * and adapter boundaries instead of weakening it to an unstructured record.
           */
          metadata?: Json;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          unlocked_at?: string;
          /**
           * string user id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          user_id: string;
        };
        /**
         * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
         * time domain declared by the enclosing contract.
         */
        Update: {
          /**
           * Optional string achievement id carried by {@link Database}. Treat it according to the owning contract’s
           * validation and presentation rules rather than assuming it is a stable identifier.
           */
          achievement_id?: string;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: number;
          /**
           * Optional typed metadata associated with {@link Database}. Preserve its declared contract at serialization
           * and adapter boundaries instead of weakening it to an unstructured record.
           */
          metadata?: Json;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          unlocked_at?: string;
          /**
           * Optional string user id carried by {@link Database}. Treat it according to the owning contract’s validation
           * and presentation rules rather than assuming it is a stable identifier.
           */
          user_id?: string;
        };
        /**
         * keyed/nested relationships structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
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
      /**
       * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
       * preserve ordering or uniqueness whenever the owning workflow relies on it.
       */
      friend_relationships: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          id: string;
          requester_id: string;
          status: Database["public"]["Enums"]["friend_relationship_status"];
          updated_at: string;
          user_high_id: string;
          user_low_id: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          id?: string;
          requester_id: string;
          status?: Database["public"]["Enums"]["friend_relationship_status"];
          updated_at?: string;
          user_high_id: string;
          user_low_id: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string;
          id?: string;
          requester_id?: string;
          status?: Database["public"]["Enums"]["friend_relationship_status"];
          updated_at?: string;
          user_high_id?: string;
          user_low_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "friend_relationships_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "friend_relationships_user_high_id_fkey";
            columns: ["user_high_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "friend_relationships_user_low_id_fkey";
            columns: ["user_low_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      user_blocks: {
        Row: {
          blocked_user_id: string;
          blocker_id: string;
          created_at: string;
        };
        Insert: {
          blocked_user_id: string;
          blocker_id: string;
          created_at?: string;
        };
        Update: {
          blocked_user_id?: string;
          blocker_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_user_id_fkey";
            columns: ["blocked_user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      user_profiles: {
        /**
         * keyed/nested row structure owned by {@link Database}. Keep its keys and value contract explicit so callers
         * cannot smuggle a broader shape across this boundary.
         */
        Row: {
          /**
           * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
           * must keep it synchronized with the accompanying fields.
           */
          account_status: Database["public"]["Enums"]["user_account_status"];
          /**
           * app role value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          app_role: Database["public"]["Enums"]["app_user_role"];
          /**
           * avatar url value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          avatar_url: string | null;
          /**
           * banned until value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          banned_until: string | null;
          /**
           * bio value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          bio: string | null;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          created_at: string;
          /**
           * human-facing display name for {@link Database}. It supports UI, narration, or diagnostics and must not be
           * used as the stable identity of the record.
           */
          display_name: string;
          /**
           * email value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          email: string | null;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: string;
          /**
           * locale value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          locale: string | null;
          /**
           * moderation note value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          moderation_note: string | null;
          /**
           * timezone value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          timezone: string | null;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          updated_at: string;
          /**
           * human-facing username for {@link Database}. It supports UI, narration, or diagnostics and must not be used
           * as the stable identity of the record.
           */
          username: string | null;
          /**
           * website url value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          website_url: string | null;
        };
        /**
         * keyed/nested insert structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
        Insert: {
          /**
           * Optional discriminator for {@link Database}. It selects the valid branch and behavior, so producers and
           * consumers must keep it synchronized with the accompanying fields.
           */
          account_status?: Database["public"]["Enums"]["user_account_status"];
          /**
           * Optional app role value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          app_role?: Database["public"]["Enums"]["app_user_role"];
          /**
           * Optional avatar url value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          avatar_url?: string | null;
          /**
           * Optional banned until value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          banned_until?: string | null;
          /**
           * Optional bio value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          bio?: string | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * human-facing display name for {@link Database}. It supports UI, narration, or diagnostics and must not be
           * used as the stable identity of the record.
           */
          display_name: string;
          /**
           * Optional email value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          email?: string | null;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: string;
          /**
           * Optional locale value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          locale?: string | null;
          /**
           * Optional moderation note value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          moderation_note?: string | null;
          /**
           * Optional timezone value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          timezone?: string | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          updated_at?: string;
          /**
           * Optional human-facing username for {@link Database}. It supports UI, narration, or diagnostics and must not
           * be used as the stable identity of the record.
           */
          username?: string | null;
          /**
           * Optional website url value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          website_url?: string | null;
        };
        /**
         * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
         * time domain declared by the enclosing contract.
         */
        Update: {
          /**
           * Optional discriminator for {@link Database}. It selects the valid branch and behavior, so producers and
           * consumers must keep it synchronized with the accompanying fields.
           */
          account_status?: Database["public"]["Enums"]["user_account_status"];
          /**
           * Optional app role value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          app_role?: Database["public"]["Enums"]["app_user_role"];
          /**
           * Optional avatar url value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          avatar_url?: string | null;
          /**
           * Optional banned until value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          banned_until?: string | null;
          /**
           * Optional bio value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          bio?: string | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          created_at?: string;
          /**
           * Optional human-facing display name for {@link Database}. It supports UI, narration, or diagnostics and must
           * not be used as the stable identity of the record.
           */
          display_name?: string;
          /**
           * Optional email value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          email?: string | null;
          /**
           * Optional stable id used by {@link Database} to correlate this value with related records, events, or
           * authored content; it is not a display label.
           */
          id?: string;
          /**
           * Optional locale value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          locale?: string | null;
          /**
           * Optional moderation note value carried by {@link Database}. Its declared type is the compatibility boundary
           * for producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          moderation_note?: string | null;
          /**
           * Optional timezone value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          timezone?: string | null;
          /**
           * Optional temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must
           * use the time domain declared by the enclosing contract.
           */
          updated_at?: string;
          /**
           * Optional human-facing username for {@link Database}. It supports UI, narration, or diagnostics and must not
           * be used as the stable identity of the record.
           */
          username?: string | null;
          /**
           * Optional website url value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          website_url?: string | null;
        };
        /**
         * collection value on {@link Database}. Its element type defines the records that may cross this boundary;
         * preserve ordering or uniqueness whenever the owning workflow relies on it.
         */
        Relationships: [];
      };
    };
    /**
     * keyed/nested views structure owned by {@link Database}. Keep its keys and value contract explicit so callers
     * cannot smuggle a broader shape across this boundary.
     */
    Views: {
      /**
       * keyed/nested fly squasher leaderboard structure owned by {@link Database}. Keep its keys and value contract
       * explicit so callers cannot smuggle a broader shape across this boundary.
       */
      fly_squasher_leaderboard: {
        /**
         * keyed/nested row structure owned by {@link Database}. Keep its keys and value contract explicit so callers
         * cannot smuggle a broader shape across this boundary.
         */
        Row: {
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          date: string | null;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: number | null;
          /**
           * level value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          level: number | null;
          /**
           * human-facing name for {@link Database}. It supports UI, narration, or diagnostics and must not be used as
           * the stable identity of the record.
           */
          name: string | null;
          /**
           * score value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          score: number | null;
          /**
           * user id value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          user_id: string | null;
        };
        /**
         * keyed/nested relationships structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
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
      /**
       * keyed/nested game leaderboard scores structure owned by {@link Database}. Keep its keys and value contract
       * explicit so callers cannot smuggle a broader shape across this boundary.
       */
      game_leaderboard_scores: {
        /**
         * keyed/nested row structure owned by {@link Database}. Keep its keys and value contract explicit so callers
         * cannot smuggle a broader shape across this boundary.
         */
        Row: {
          /**
           * human-facing display name for {@link Database}. It supports UI, narration, or diagnostics and must not be
           * used as the stable identity of the record.
           */
          display_name: string | null;
          /**
           * game key value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          game_key: string | null;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: number | null;
          /**
           * typed metadata associated with {@link Database}. Preserve its declared contract at serialization and adapter
           * boundaries instead of weakening it to an unstructured record.
           */
          metadata: Json | null;
          /**
           * ranking scope key value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          ranking_scope_key: string | null;
          /**
           * scope rank value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          scope_rank: number | null;
          /**
           * score value value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          score_value: number | null;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          submitted_at: string | null;
          /**
           * user id value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          user_id: string | null;
          /**
           * user scope rank value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          user_scope_rank: number | null;
        };
        /**
         * keyed/nested relationships structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
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
      /**
       * keyed/nested game score records full structure owned by {@link Database}. Keep its keys and value contract
       * explicit so callers cannot smuggle a broader shape across this boundary.
       */
      game_score_records_full: {
        /**
         * keyed/nested row structure owned by {@link Database}. Keep its keys and value contract explicit so callers
         * cannot smuggle a broader shape across this boundary.
         */
        Row: {
          /**
           * human-facing display name for {@link Database}. It supports UI, narration, or diagnostics and must not be
           * used as the stable identity of the record.
           */
          display_name: string | null;
          /**
           * eliminated value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          eliminated: boolean | null;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          eliminated_at: string | null;
          /**
           * faction key value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          faction_key: string | null;
          /**
           * game key value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          game_key: string | null;
          /**
           * game session id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          game_session_id: string | null;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: number | null;
          /**
           * metrics value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          metrics: Json | null;
          /**
           * participant id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          participant_id: number | null;
          /**
           * participant number value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          participant_number: number | null;
          /**
           * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
           * must keep it synchronized with the accompanying fields.
           */
          participant_type: Database["public"]["Enums"]["game_participant_type"] | null;
          /**
           * ranking scope key value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          ranking_scope_key: string | null;
          /**
           * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
           * must keep it synchronized with the accompanying fields.
           */
          result_status: Database["public"]["Enums"]["game_result_status"] | null;
          /**
           * score value value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          score_value: number | null;
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          submitted_at: string | null;
          /**
           * team key value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          team_key: string | null;
          /**
           * user id value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          user_id: string | null;
        };
        /**
         * keyed/nested relationships structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
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
      /**
       * keyed/nested little muncher leaderboard structure owned by {@link Database}. Keep its keys and value
       * contract explicit so callers cannot smuggle a broader shape across this boundary.
       */
      little_muncher_leaderboard: {
        /**
         * keyed/nested row structure owned by {@link Database}. Keep its keys and value contract explicit so callers
         * cannot smuggle a broader shape across this boundary.
         */
        Row: {
          /**
           * temporal value for {@link Database}. It anchors ordering, expiry, or presentation timing and must use the
           * time domain declared by the enclosing contract.
           */
          date: string | null;
          /**
           * hill value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          hill: number | null;
          /**
           * stable id used by {@link Database} to correlate this value with related records, events, or authored
           * content; it is not a display label.
           */
          id: number | null;
          /**
           * score value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          score: number | null;
          /**
           * user id value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
           * validators, and consumers; do not replace it with a broader inferred shape.
           */
          user_id: string | null;
          /**
           * human-facing user name for {@link Database}. It supports UI, narration, or diagnostics and must not be used
           * as the stable identity of the record.
           */
          user_name: string | null;
        };
        /**
         * keyed/nested relationships structure owned by {@link Database}. Keep its keys and value contract explicit so
         * callers cannot smuggle a broader shape across this boundary.
         */
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
    /**
     * keyed/nested functions structure owned by {@link Database}. Keep its keys and value contract explicit so
     * callers cannot smuggle a broader shape across this boundary.
     */
    Functions: {
      social_apply_friend_action: {
        Args: {
          p_actor_user_id: string;
          p_action: Database["public"]["Enums"]["social_friend_action"];
          p_target_user_id?: string | null;
          p_relationship_id?: string | null;
        };
        Returns: Json;
      };
      social_find_user_by_username: {
        Args: {
          p_actor_user_id: string;
          p_username: string;
        };
        Returns: Json;
      };
      social_get_snapshot: {
        Args: {
          p_actor_user_id: string;
        };
        Returns: Json;
      };
      /**
       * keyed/nested commit probable waffle campaign victory structure owned by {@link Database}. Keep its keys and
       * value contract explicit so callers cannot smuggle a broader shape across this boundary.
       */
      commit_probable_waffle_campaign_victory: {
        /**
         * keyed/nested args structure owned by {@link Database}. Keep its keys and value contract explicit so callers
         * cannot smuggle a broader shape across this boundary.
         */
        Args: {
          /**
           * compatibility p base profile revision for {@link Database}. Consumers use it to choose validation,
           * migration, or conflict-handling rules instead of guessing the payload shape.
           */
          p_base_profile_revision: number;
          /**
           * p commit result value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          p_commit_result: Json;
          /**
           * p mission id value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          p_mission_id: Database["public"]["Enums"]["probable_waffle_campaign_mission_id"];
          /**
           * p profile document value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          p_profile_document: Json;
          /**
           * p progress metadata value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          p_progress_metadata: Json;
          /**
           * p result metadata value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          p_result_metadata: Json;
          /**
           * p reward claims value carried by {@link Database}. Its declared type is the compatibility boundary for
           * producers, validators, and consumers; do not replace it with a broader inferred shape.
           */
          p_reward_claims: Json;
          /**
           * string p run id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          p_run_id: string;
          /**
           * string p user id carried by {@link Database}. Treat it according to the owning contract’s validation and
           * presentation rules rather than assuming it is a stable identifier.
           */
          p_user_id: string;
        };
        /**
         * returns value carried by {@link Database}. Its declared type is the compatibility boundary for producers,
         * validators, and consumers; do not replace it with a broader inferred shape.
         */
        Returns: Json;
      };
      /**
       * Database function with no input arguments that refreshes the materialized game-score records. Keeping the
       * input/output shape explicit prevents clients from inventing unsupported procedure parameters.
       */
      refresh_game_score_records_full: {
        /** This refresh procedure accepts no arguments. */
        Args: never;
        /** The procedure performs its work transactionally and returns no value. */
        Returns: undefined;
      };
    };
    /**
     * keyed/nested enums structure owned by {@link Database}. Keep its keys and value contract explicit so callers
     * cannot smuggle a broader shape across this boundary.
     */
    Enums: {
      /** Durable lifecycle of the canonical friendship row. */
      friend_relationship_status: "pending" | "accepted";
      /** Closed mutation set enforced by the transactional social RPC. */
      social_friend_action:
        | "send_request"
        | "accept_request"
        | "decline_request"
        | "cancel_request"
        | "remove_friend"
        | "block"
        | "unblock";
      /**
       * achievement difficulty value carried by {@link Database}. Its declared type is the compatibility boundary
       * for producers, validators, and consumers; do not replace it with a broader inferred shape.
       */
      achievement_difficulty: "easy" | "medium" | "hard";
      /**
       * app user role value carried by {@link Database}. Its declared type is the compatibility boundary for
       * producers, validators, and consumers; do not replace it with a broader inferred shape.
       */
      app_user_role: "user" | "moderator" | "admin";
      /**
       * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
       * must keep it synchronized with the accompanying fields.
       */
      chat_channel_type: "global_lobby" | "game_lobby" | "game_session" | "direct" | "system";
      /**
       * chat membership role value carried by {@link Database}. Its declared type is the compatibility boundary for
       * producers, validators, and consumers; do not replace it with a broader inferred shape.
       */
      chat_membership_role: "owner" | "moderator" | "member";
      /**
       * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
       * must keep it synchronized with the accompanying fields.
       */
      chat_message_status: "visible" | "hidden" | "deleted";
      /**
       * chat report reason value carried by {@link Database}. Its declared type is the compatibility boundary for
       * producers, validators, and consumers; do not replace it with a broader inferred shape.
       */
      chat_report_reason:
        | "spam"
        | "abuse"
        | "harassment"
        | "hate_speech"
        | "cheating"
        | "personal_information"
        | "other";
      /**
       * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
       * must keep it synchronized with the accompanying fields.
       */
      chat_report_status: "open" | "reviewed" | "dismissed" | "actioned";
      /**
       * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
       * must keep it synchronized with the accompanying fields.
       */
      game_participant_type: "human" | "ai" | "spectator";
      /**
       * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
       * must keep it synchronized with the accompanying fields.
       */
      game_result_status: "win" | "loss" | "tie" | "quit";
      /**
       * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
       * must keep it synchronized with the accompanying fields.
       */
      game_session_status: "in_progress" | "completed" | "abandoned";
      /**
       * probable waffle campaign chapter id value carried by {@link Database}. Its declared type is the
       * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
       * shape.
       */
      probable_waffle_campaign_chapter_id:
        | "prologue"
        | "two-homelands"
        | "crystal-war"
        | "united-against-volcano"
        | "the-betrayal";
      /**
       * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
       * must keep it synchronized with the accompanying fields.
       */
      probable_waffle_campaign_commit_status: "pending" | "committed" | "rejected";
      /**
       * probable waffle campaign difficulty value carried by {@link Database}. Its declared type is the
       * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
       * shape.
       */
      probable_waffle_campaign_difficulty: "story" | "normal" | "hard";
      /**
       * probable waffle campaign mission id value carried by {@link Database}. Its declared type is the
       * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
       * shape.
       */
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
        | "resolution";
      /**
       * probable waffle campaign outcome value carried by {@link Database}. Its declared type is the compatibility
       * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
       */
      probable_waffle_campaign_outcome: "victory" | "defeat" | "abandoned";
      /**
       * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
       * must keep it synchronized with the accompanying fields.
       */
      probable_waffle_game_save_kind: "manual" | "autosave" | "quicksave" | "archive";
      /**
       * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
       * must keep it synchronized with the accompanying fields.
       */
      probable_waffle_game_save_scope: "campaign" | "skirmish";
      /**
       * discriminator for {@link Database}. It selects the valid branch and behavior, so producers and consumers
       * must keep it synchronized with the accompanying fields.
       */
      user_account_status: "active" | "limited" | "disabled";
    };
    /**
     * keyed/nested composite types structure owned by {@link Database}. Keep its keys and value contract explicit
     * so callers cannot smuggle a broader shape across this boundary.
     */
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

/**
 * Defines the database without internals alias used by this module. Keep values in this named domain so linked
 * APIs and storage boundaries do not drift into an unconstrained primitive.
 */
type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

/**
 * Defines the default schema alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

/**
 * Defines the tables alias used by this module. Keep values in this named domain so linked APIs and storage
 * boundaries do not drift into an unconstrained primitive.
 */
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

/**
 * Defines the tables insert alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
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

/**
 * Defines the tables update alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
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

/**
 * Defines the enums alias used by this module. Keep values in this named domain so linked APIs and storage
 * boundaries do not drift into an unconstrained primitive.
 */
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

/**
 * Defines the composite types alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
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
      friend_relationship_status: ["pending", "accepted"],
      social_friend_action: [
        "send_request",
        "accept_request",
        "decline_request",
        "cancel_request",
        "remove_friend",
        "block",
        "unblock"
      ],
      app_user_role: ["user", "moderator", "admin"],
      chat_channel_type: ["global_lobby", "game_lobby", "game_session", "direct", "system"],
      chat_membership_role: ["owner", "moderator", "member"],
      chat_message_status: ["visible", "hidden", "deleted"],
      chat_report_reason: ["spam", "abuse", "harassment", "hate_speech", "cheating", "personal_information", "other"],
      chat_report_status: ["open", "reviewed", "dismissed", "actioned"],
      game_participant_type: ["human", "ai", "spectator"],
      game_result_status: ["win", "loss", "tie", "quit"],
      game_session_status: ["in_progress", "completed", "abandoned"],
      probable_waffle_campaign_chapter_id: [
        "prologue",
        "two-homelands",
        "crystal-war",
        "united-against-volcano",
        "the-betrayal"
      ],
      probable_waffle_campaign_commit_status: ["pending", "committed", "rejected"],
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
        "resolution"
      ],
      probable_waffle_campaign_outcome: ["victory", "defeat", "abandoned"],
      probable_waffle_game_save_kind: ["manual", "autosave", "quicksave", "archive"],
      probable_waffle_game_save_scope: ["campaign", "skirmish"],
      user_account_status: ["active", "limited", "disabled"]
    }
  }
} as const;
