export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      quote_requests: {
        Row: {
          assembly_required: boolean;
          bedrooms: string | null;
          calculated_hours: number | null;
          calculated_total: number | null;
          created_at: string;
          email: string;
          end_of_tenancy_cleaning: boolean;
          first_name: string;
          fragile_items: boolean;
          furniture_items: string[];
          furniture_other_description: string | null;
          handyman_services: boolean;
          id: string;
          last_name: string;
          move_date: string;
          moving_from_address: string;
          moving_from_floor_level: string | null;
          moving_from_floor_number: string | null;
          moving_from_lift: boolean;
          moving_from_number: string | null;
          moving_from_parking: boolean;
          moving_from_postcode: string | null;
          moving_from_stairs: boolean;
          moving_from_stairs_flights: string | null;
          moving_from_street: string | null;
          moving_to_address: string;
          moving_to_floor_level: string | null;
          moving_to_floor_number: string | null;
          moving_to_lift: boolean;
          moving_to_number: string | null;
          moving_to_parking: boolean;
          moving_to_postcode: string | null;
          moving_to_stairs: boolean;
          moving_to_stairs_flights: string | null;
          moving_to_street: string | null;
          needs_manual_review: boolean;
          notes: string | null;
          office_area_band: string | null;
          packaging_required: boolean;
          phone: string;
          preferred_time: string;
          pricing_breakdown: Json | null;
          pricing_calculated_at: string | null;
          property_type: Database["public"]["Enums"]["property_type"];
          unpacking_required: boolean;
        };
        Insert: {
          assembly_required?: boolean;
          bedrooms?: string | null;
          calculated_hours?: number | null;
          calculated_total?: number | null;
          created_at?: string;
          email: string;
          end_of_tenancy_cleaning?: boolean;
          first_name: string;
          fragile_items?: boolean;
          furniture_items?: string[];
          furniture_other_description?: string | null;
          handyman_services?: boolean;
          id?: string;
          last_name: string;
          move_date: string;
          moving_from_address: string;
          moving_from_floor_level?: string | null;
          moving_from_floor_number?: string | null;
          moving_from_lift?: boolean;
          moving_from_number?: string | null;
          moving_from_parking?: boolean;
          moving_from_postcode?: string | null;
          moving_from_stairs?: boolean;
          moving_from_stairs_flights?: string | null;
          moving_from_street?: string | null;
          moving_to_address: string;
          moving_to_floor_level?: string | null;
          moving_to_floor_number?: string | null;
          moving_to_lift?: boolean;
          moving_to_number?: string | null;
          moving_to_parking?: boolean;
          moving_to_postcode?: string | null;
          moving_to_stairs?: boolean;
          moving_to_stairs_flights?: string | null;
          moving_to_street?: string | null;
          needs_manual_review?: boolean;
          notes?: string | null;
          office_area_band?: string | null;
          packaging_required?: boolean;
          phone: string;
          preferred_time: string;
          pricing_breakdown?: Json | null;
          pricing_calculated_at?: string | null;
          property_type: Database["public"]["Enums"]["property_type"];
          unpacking_required?: boolean;
        };
        Update: {
          assembly_required?: boolean;
          bedrooms?: string | null;
          calculated_hours?: number | null;
          calculated_total?: number | null;
          created_at?: string;
          email?: string;
          end_of_tenancy_cleaning?: boolean;
          first_name?: string;
          fragile_items?: boolean;
          furniture_items?: string[];
          furniture_other_description?: string | null;
          handyman_services?: boolean;
          id?: string;
          last_name?: string;
          move_date?: string;
          moving_from_address?: string;
          moving_from_floor_level?: string | null;
          moving_from_floor_number?: string | null;
          moving_from_lift?: boolean;
          moving_from_number?: string | null;
          moving_from_parking?: boolean;
          moving_from_postcode?: string | null;
          moving_from_stairs?: boolean;
          moving_from_stairs_flights?: string | null;
          moving_from_street?: string | null;
          moving_to_address?: string;
          moving_to_floor_level?: string | null;
          moving_to_floor_number?: string | null;
          moving_to_lift?: boolean;
          moving_to_number?: string | null;
          moving_to_parking?: boolean;
          moving_to_postcode?: string | null;
          moving_to_stairs?: boolean;
          moving_to_stairs_flights?: string | null;
          moving_to_street?: string | null;
          needs_manual_review?: boolean;
          notes?: string | null;
          office_area_band?: string | null;
          packaging_required?: boolean;
          phone?: string;
          preferred_time?: string;
          pricing_breakdown?: Json | null;
          pricing_calculated_at?: string | null;
          property_type?: Database["public"]["Enums"]["property_type"];
          unpacking_required?: boolean;
        };
        Relationships: [];
      };
      quote_photos: {
        Row: {
          created_at: string;
          file_name: string | null;
          file_size: number | null;
          id: string;
          quote_request_id: string;
          storage_path: string;
        };
        Insert: {
          created_at?: string;
          file_name?: string | null;
          file_size?: number | null;
          id?: string;
          quote_request_id: string;
          storage_path: string;
        };
        Update: {
          created_at?: string;
          file_name?: string | null;
          file_size?: number | null;
          id?: string;
          quote_request_id?: string;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quote_photos_quote_request_id_fkey";
            columns: ["quote_request_id"];
            isOneToOne: false;
            referencedRelation: "quote_requests";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      property_type: "house" | "apartment" | "office";
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
    : never = never,
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
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
    : never = never,
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
      property_type: ["house", "apartment", "office"],
    },
  },
} as const;
