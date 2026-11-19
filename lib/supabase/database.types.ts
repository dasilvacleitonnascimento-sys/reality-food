// Types for the tables the app reads and writes. Written by hand from
// supabase/migrations/0001_init.sql (the Supabase type generator needs an access
// token). Keep in sync when a migration changes these tables.

export type I18nText = { en: string; es?: string };
export type Vessel = "plate" | "cup" | "glass" | "bowl" | "pan";

type Table<Row, Insert, Update = Partial<Insert>> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };

export type RestaurantRow = {
  id: string;
  slug: string;
  name: string;
  tagline: I18nText | Record<string, never>;
  logo_path: string | null;
  primary_color: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type CategoryRow = {
  id: string;
  restaurant_id: string;
  slug: string;
  name: I18nText;
  sort_order: number;
};

export type DishRow = {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  slug: string;
  name: I18nText;
  description: I18nText | Record<string, never>;
  price_cents: number;
  tags: string[];
  photo_path: string | null;
  model_glb_path: string | null;
  model_usdz_path: string | null;
  plate_diameter_cm: number;
  portion_cm: { width: number; depth: number; height: number } | null;
  served_in: Vessel;
  served_in_oz: number | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      platform_admins: Table<{ user_id: string; created_at: string }, { user_id: string }>;
      restaurants: Table<RestaurantRow, Omit<RestaurantRow, "id" | "created_at" | "updated_at" | "primary_color" | "tagline" | "logo_path" | "is_published"> & Partial<RestaurantRow>>;
      categories: Table<CategoryRow, Omit<CategoryRow, "id" | "sort_order"> & Partial<CategoryRow>>;
      dishes: Table<
        DishRow,
        Pick<DishRow, "restaurant_id" | "slug" | "name" | "price_cents" | "plate_diameter_cm"> & Partial<DishRow>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      is_platform_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: { vessel: Vessel };
    CompositeTypes: Record<string, never>;
  };
};
