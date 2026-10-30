
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "advertisements": {
                  Row: {
                    "advertiser_name": string,"body": Json | null,"clicks": number,"created_at": string,"cta_label": Json | null,"customer_type": Database["public"]['Enums']["ad_customer_type"],"ends_at": string | null,"headline": NonNullable<Json>,"id": string,"image_url": string | null,"impressions": number,"is_active": boolean,"placement": Database["public"]['Enums']["ad_placement"],"starts_at": string,"target_languages": (string)[],"target_url": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "advertiser_name": string,"body"?: Json | null,"clicks"?: number,"created_at"?: string,"cta_label"?: Json | null,"customer_type"?: Database["public"]['Enums']["ad_customer_type"],"ends_at"?: string | null,"headline": NonNullable<Json>,"id"?: string,"image_url"?: string | null,"impressions"?: number,"is_active"?: boolean,"placement": Database["public"]['Enums']["ad_placement"],"starts_at"?: string,"target_languages"?: (string)[],"target_url": string,"updated_at"?: string
                  }
                  Update: {
                    "advertiser_name"?: string,"body"?: Json | null,"clicks"?: number,"created_at"?: string,"cta_label"?: Json | null,"customer_type"?: Database["public"]['Enums']["ad_customer_type"],"ends_at"?: string | null,"headline"?: NonNullable<Json>,"id"?: string,"image_url"?: string | null,"impressions"?: number,"is_active"?: boolean,"placement"?: Database["public"]['Enums']["ad_placement"],"starts_at"?: string,"target_languages"?: (string)[],"target_url"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"article_categories": {
                  Row: {
                    "description": Json | null,"id": string,"name": NonNullable<Json>,"slug": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: Json | null,"id"?: string,"name": NonNullable<Json>,"slug": string,"sort_order"?: number
                  }
                  Update: {
                    "description"?: Json | null,"id"?: string,"name"?: NonNullable<Json>,"slug"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"articles": {
                  Row: {
                    "author_id": string | null,"body": Json | null,"category_id": string,"cover_url": string | null,"created_at": string,"excerpt": Json | null,"id": string,"is_featured": boolean,"kind": Database["public"]['Enums']["article_kind"],"published_at": string | null,"reading_minutes": number,"slug": string,"status": Database["public"]['Enums']["publish_status"],"tags": (string)[],"title": NonNullable<Json>,"updated_at": string,"video_url": string | null,"view_count": number
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body"?: Json | null,"category_id": string,"cover_url"?: string | null,"created_at"?: string,"excerpt"?: Json | null,"id"?: string,"is_featured"?: boolean,"kind"?: Database["public"]['Enums']["article_kind"],"published_at"?: string | null,"reading_minutes"?: number,"slug": string,"status"?: Database["public"]['Enums']["publish_status"],"tags"?: (string)[],"title": NonNullable<Json>,"updated_at"?: string,"video_url"?: string | null,"view_count"?: number
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: Json | null,"category_id"?: string,"cover_url"?: string | null,"created_at"?: string,"excerpt"?: Json | null,"id"?: string,"is_featured"?: boolean,"kind"?: Database["public"]['Enums']["article_kind"],"published_at"?: string | null,"reading_minutes"?: number,"slug"?: string,"status"?: Database["public"]['Enums']["publish_status"],"tags"?: (string)[],"title"?: NonNullable<Json>,"updated_at"?: string,"video_url"?: string | null,"view_count"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "articles_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "articles_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "article_categories"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_logs": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"entity_id": string | null,"entity_type": string,"id": number,"new_data": Json | null,"old_data": Json | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"entity_id"?: string | null,"entity_type": string,"id"?: never,"new_data"?: Json | null,"old_data"?: Json | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"entity_id"?: string | null,"entity_type"?: string,"id"?: never,"new_data"?: Json | null,"old_data"?: Json | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_logs_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"cities": {
                  Row: {
                    "created_at": string,"description": Json | null,"id": string,"lat": number,"lng": number,"name": NonNullable<Json>,"province_id": string,"slug": string,"sort_order": number,"zoom": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: Json | null,"id"?: string,"lat": number,"lng": number,"name": NonNullable<Json>,"province_id": string,"slug": string,"sort_order"?: number,"zoom"?: number
                  }
                  Update: {
                    "created_at"?: string,"description"?: Json | null,"id"?: string,"lat"?: number,"lng"?: number,"name"?: NonNullable<Json>,"province_id"?: string,"slug"?: string,"sort_order"?: number,"zoom"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "cities_province_id_fkey"
      columns: ["province_id"]
isOneToOne: false
      referencedRelation: "provinces"
      referencedColumns: ["id"]
    }
                  ]
                },"community_categories": {
                  Row: {
                    "description": Json | null,"id": string,"name": NonNullable<Json>,"slug": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: Json | null,"id"?: string,"name": NonNullable<Json>,"slug": string,"sort_order"?: number
                  }
                  Update: {
                    "description"?: Json | null,"id"?: string,"name"?: NonNullable<Json>,"slug"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"community_comments": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"is_flagged": boolean,"post_id": string,"status": Database["public"]['Enums']["moderation_status"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"id"?: string,"is_flagged"?: boolean,"post_id": string,"status"?: Database["public"]['Enums']["moderation_status"],"user_id": string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"is_flagged"?: boolean,"post_id"?: string,"status"?: Database["public"]['Enums']["moderation_status"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "community_comments_post_id_fkey"
      columns: ["post_id"]
isOneToOne: false
      referencedRelation: "community_posts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "community_comments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    }
                  ]
                },"community_posts": {
                  Row: {
                    "body": string,"body_hash": string,"category_id": string,"comment_count": number,"created_at": string,"flag_reason": string | null,"id": string,"is_flagged": boolean,"is_pinned": boolean,"moderated_at": string | null,"moderated_by": string | null,"moderation_note": string | null,"status": Database["public"]['Enums']["moderation_status"],"title": string,"updated_at": string,"user_id": string,"view_count": number
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"body_hash": string,"category_id": string,"comment_count"?: number,"created_at"?: string,"flag_reason"?: string | null,"id"?: string,"is_flagged"?: boolean,"is_pinned"?: boolean,"moderated_at"?: string | null,"moderated_by"?: string | null,"moderation_note"?: string | null,"status"?: Database["public"]['Enums']["moderation_status"],"title": string,"updated_at"?: string,"user_id": string,"view_count"?: number
                  }
                  Update: {
                    "body"?: string,"body_hash"?: string,"category_id"?: string,"comment_count"?: number,"created_at"?: string,"flag_reason"?: string | null,"id"?: string,"is_flagged"?: boolean,"is_pinned"?: boolean,"moderated_at"?: string | null,"moderated_by"?: string | null,"moderation_note"?: string | null,"status"?: Database["public"]['Enums']["moderation_status"],"title"?: string,"updated_at"?: string,"user_id"?: string,"view_count"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "community_posts_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "community_categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "community_posts_moderated_by_fkey"
      columns: ["moderated_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "community_posts_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    }
                  ]
                },"contact_messages": {
                  Row: {
                    "admin_note": string | null,"created_at": string,"email": string,"handled_at": string | null,"handled_by": string | null,"id": string,"lang": string,"message": string,"name": string,"school": string | null,"status": string,"topic": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "admin_note"?: string | null,"created_at"?: string,"email": string,"handled_at"?: string | null,"handled_by"?: string | null,"id"?: string,"lang"?: string,"message": string,"name": string,"school"?: string | null,"status"?: string,"topic": string,"user_id"?: string | null
                  }
                  Update: {
                    "admin_note"?: string | null,"created_at"?: string,"email"?: string,"handled_at"?: string | null,"handled_by"?: string | null,"id"?: string,"lang"?: string,"message"?: string,"name"?: string,"school"?: string | null,"status"?: string,"topic"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "contact_messages_handled_by_fkey"
      columns: ["handled_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contact_messages_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"content_reports": {
                  Row: {
                    "created_at": string,"entity_id": string,"entity_type": string,"id": string,"is_resolved": boolean,"reason": string,"reporter_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"entity_id": string,"entity_type": string,"id"?: string,"is_resolved"?: boolean,"reason": string,"reporter_id": string
                  }
                  Update: {
                    "created_at"?: string,"entity_id"?: string,"entity_type"?: string,"id"?: string,"is_resolved"?: boolean,"reason"?: string,"reporter_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "content_reports_reporter_id_fkey"
      columns: ["reporter_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"correction_requests": {
                  Row: {
                    "admin_note": string | null,"created_at": string,"handled_at": string | null,"handled_by": string | null,"id": string,"lang": string,"message": string,"reporter_email": string | null,"reporter_name": string | null,"reporter_phone": string | null,"reporter_role": string,"school_id": string,"source_url": string | null,"status": string,"topic": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "admin_note"?: string | null,"created_at"?: string,"handled_at"?: string | null,"handled_by"?: string | null,"id"?: string,"lang"?: string,"message": string,"reporter_email"?: string | null,"reporter_name"?: string | null,"reporter_phone"?: string | null,"reporter_role"?: string,"school_id": string,"source_url"?: string | null,"status"?: string,"topic": string,"user_id"?: string | null
                  }
                  Update: {
                    "admin_note"?: string | null,"created_at"?: string,"handled_at"?: string | null,"handled_by"?: string | null,"id"?: string,"lang"?: string,"message"?: string,"reporter_email"?: string | null,"reporter_name"?: string | null,"reporter_phone"?: string | null,"reporter_role"?: string,"school_id"?: string,"source_url"?: string | null,"status"?: string,"topic"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "correction_requests_handled_by_fkey"
      columns: ["handled_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "correction_requests_school_id_fkey"
      columns: ["school_id"]
isOneToOne: false
      referencedRelation: "schools"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "correction_requests_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"education_systems": {
                  Row: {
                    "is_active": boolean,"key": string,"name": NonNullable<Json>,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "is_active"?: boolean,"key": string,"name": NonNullable<Json>,"sort_order"?: number
                  }
                  Update: {
                    "is_active"?: boolean,"key"?: string,"name"?: NonNullable<Json>,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"facility_types": {
                  Row: {
                    "icon": string,"is_active": boolean,"key": string,"name": NonNullable<Json>,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "icon"?: string,"is_active"?: boolean,"key": string,"name": NonNullable<Json>,"sort_order"?: number
                  }
                  Update: {
                    "icon"?: string,"is_active"?: boolean,"key"?: string,"name"?: NonNullable<Json>,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"favorites": {
                  Row: {
                    "article_id": string | null,"created_at": string,"id": string,"school_id": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "article_id"?: string | null,"created_at"?: string,"id"?: string,"school_id"?: string | null,"user_id": string
                  }
                  Update: {
                    "article_id"?: string | null,"created_at"?: string,"id"?: string,"school_id"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "favorites_article_id_fkey"
      columns: ["article_id"]
isOneToOne: false
      referencedRelation: "articles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "favorites_school_id_fkey"
      columns: ["school_id"]
isOneToOne: false
      referencedRelation: "schools"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "favorites_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"fee_items": {
                  Row: {
                    "icon": string,"is_active": boolean,"key": string,"name": NonNullable<Json>,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "icon"?: string,"is_active"?: boolean,"key": string,"name": NonNullable<Json>,"sort_order"?: number
                  }
                  Update: {
                    "icon"?: string,"is_active"?: boolean,"key"?: string,"name"?: NonNullable<Json>,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"language_options": {
                  Row: {
                    "code": string,"is_active": boolean,"name": NonNullable<Json>,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"is_active"?: boolean,"name": NonNullable<Json>,"sort_order"?: number
                  }
                  Update: {
                    "code"?: string,"is_active"?: boolean,"name"?: NonNullable<Json>,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"languages": {
                  Row: {
                    "code": string,"html_lang": string,"is_default": boolean,"is_enabled": boolean,"name": string,"native_name": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"html_lang": string,"is_default"?: boolean,"is_enabled"?: boolean,"name": string,"native_name": string,"sort_order"?: number
                  }
                  Update: {
                    "code"?: string,"html_lang"?: string,"is_default"?: boolean,"is_enabled"?: boolean,"name"?: string,"native_name"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"media_files": {
                  Row: {
                    "alt": Json | null,"bucket": string,"created_at": string,"id": string,"mime_type": string,"path": string,"public_url": string,"size_bytes": number,"uploaded_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "alt"?: Json | null,"bucket"?: string,"created_at"?: string,"id"?: string,"mime_type": string,"path": string,"public_url": string,"size_bytes": number,"uploaded_by"?: string | null
                  }
                  Update: {
                    "alt"?: Json | null,"bucket"?: string,"created_at"?: string,"id"?: string,"mime_type"?: string,"path"?: string,"public_url"?: string,"size_bytes"?: number,"uploaded_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "media_files_uploaded_by_fkey"
      columns: ["uploaded_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"page_events": {
                  Row: {
                    "created_at": string,"entity_id": string | null,"event_type": string,"id": number,"lang": string | null,"meta": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"entity_id"?: string | null,"event_type": string,"id"?: never,"lang"?: string | null,"meta"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"entity_id"?: string | null,"event_type"?: string,"id"?: never,"lang"?: string | null,"meta"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"bio": string | null,"city_id": string | null,"created_at": string,"display_name": string,"preferred_lang": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"bio"?: string | null,"city_id"?: string | null,"created_at"?: string,"display_name": string,"preferred_lang"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "avatar_url"?: string | null,"bio"?: string | null,"city_id"?: string | null,"created_at"?: string,"display_name"?: string,"preferred_lang"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profiles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"provinces": {
                  Row: {
                    "created_at": string,"description": Json | null,"id": string,"name": NonNullable<Json>,"slug": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: Json | null,"id"?: string,"name": NonNullable<Json>,"slug": string,"sort_order"?: number
                  }
                  Update: {
                    "created_at"?: string,"description"?: Json | null,"id"?: string,"name"?: NonNullable<Json>,"slug"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"review_votes": {
                  Row: {
                    "created_at": string,"is_helpful": boolean,"review_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"is_helpful"?: boolean,"review_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"is_helpful"?: boolean,"review_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "review_votes_review_id_fkey"
      columns: ["review_id"]
isOneToOne: false
      referencedRelation: "reviews"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "review_votes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"reviews": {
                  Row: {
                    "body": string,"body_hash": string,"created_at": string,"flag_reason": string | null,"helpful_count": number,"id": string,"is_flagged": boolean,"moderated_at": string | null,"moderated_by": string | null,"moderation_note": string | null,"rating": number,"rating_communication": number | null,"rating_facilities": number | null,"rating_safety": number | null,"rating_teaching": number | null,"relationship": string,"school_id": string,"status": Database["public"]['Enums']["moderation_status"],"title": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"body_hash": string,"created_at"?: string,"flag_reason"?: string | null,"helpful_count"?: number,"id"?: string,"is_flagged"?: boolean,"moderated_at"?: string | null,"moderated_by"?: string | null,"moderation_note"?: string | null,"rating": number,"rating_communication"?: number | null,"rating_facilities"?: number | null,"rating_safety"?: number | null,"rating_teaching"?: number | null,"relationship"?: string,"school_id": string,"status"?: Database["public"]['Enums']["moderation_status"],"title": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "body"?: string,"body_hash"?: string,"created_at"?: string,"flag_reason"?: string | null,"helpful_count"?: number,"id"?: string,"is_flagged"?: boolean,"moderated_at"?: string | null,"moderated_by"?: string | null,"moderation_note"?: string | null,"rating"?: number,"rating_communication"?: number | null,"rating_facilities"?: number | null,"rating_safety"?: number | null,"rating_teaching"?: number | null,"relationship"?: string,"school_id"?: string,"status"?: Database["public"]['Enums']["moderation_status"],"title"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_moderated_by_fkey"
      columns: ["moderated_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_school_id_fkey"
      columns: ["school_id"]
isOneToOne: false
      referencedRelation: "schools"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["user_id"]
    }
                  ]
                },"school_documents": {
                  Row: {
                    "id": string,"school_id": string,"sort_order": number,"title": string,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"school_id": string,"sort_order"?: number,"title": string,"url": string
                  }
                  Update: {
                    "id"?: string,"school_id"?: string,"sort_order"?: number,"title"?: string,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "school_documents_school_id_fkey"
      columns: ["school_id"]
isOneToOne: false
      referencedRelation: "schools"
      referencedColumns: ["id"]
    }
                  ]
                },"school_facilities": {
                  Row: {
                    "facility_key": string,"id": string,"note": Json | null,"school_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "facility_key": string,"id"?: string,"note"?: Json | null,"school_id": string
                  }
                  Update: {
                    "facility_key"?: string,"id"?: string,"note"?: Json | null,"school_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "school_facilities_school_id_fkey"
      columns: ["school_id"]
isOneToOne: false
      referencedRelation: "schools"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "school_facilities_type_fk"
      columns: ["facility_key"]
isOneToOne: false
      referencedRelation: "facility_types"
      referencedColumns: ["key"]
    }
                  ]
                },"school_faqs": {
                  Row: {
                    "answer": NonNullable<Json>,"id": string,"question": NonNullable<Json>,"school_id": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "answer": NonNullable<Json>,"id"?: string,"question": NonNullable<Json>,"school_id": string,"sort_order"?: number
                  }
                  Update: {
                    "answer"?: NonNullable<Json>,"id"?: string,"question"?: NonNullable<Json>,"school_id"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "school_faqs_school_id_fkey"
      columns: ["school_id"]
isOneToOne: false
      referencedRelation: "schools"
      referencedColumns: ["id"]
    }
                  ]
                },"school_fee_items": {
                  Row: {
                    "extra_amount": number | null,"extra_period": string | null,"included": boolean,"item_key": string,"school_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "extra_amount"?: number | null,"extra_period"?: string | null,"included": boolean,"item_key": string,"school_id": string
                  }
                  Update: {
                    "extra_amount"?: number | null,"extra_period"?: string | null,"included"?: boolean,"item_key"?: string,"school_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "school_fee_items_item_key_fkey"
      columns: ["item_key"]
isOneToOne: false
      referencedRelation: "fee_items"
      referencedColumns: ["key"]
    },{
      foreignKeyName: "school_fee_items_school_id_fkey"
      columns: ["school_id"]
isOneToOne: false
      referencedRelation: "schools"
      referencedColumns: ["id"]
    }
                  ]
                },"school_languages": {
                  Row: {
                    "is_primary": boolean,"language_code": string,"school_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "is_primary"?: boolean,"language_code": string,"school_id": string
                  }
                  Update: {
                    "is_primary"?: boolean,"language_code"?: string,"school_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "school_languages_option_fk"
      columns: ["language_code"]
isOneToOne: false
      referencedRelation: "language_options"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "school_languages_school_id_fkey"
      columns: ["school_id"]
isOneToOne: false
      referencedRelation: "schools"
      referencedColumns: ["id"]
    }
                  ]
                },"school_locations": {
                  Row: {
                    "address": NonNullable<Json>,"district": string | null,"google_maps_url": string | null,"lat": number | null,"lng": number | null,"school_id": string,"twogis_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address": NonNullable<Json>,"district"?: string | null,"google_maps_url"?: string | null,"lat"?: number | null,"lng"?: number | null,"school_id": string,"twogis_url"?: string | null
                  }
                  Update: {
                    "address"?: NonNullable<Json>,"district"?: string | null,"google_maps_url"?: string | null,"lat"?: number | null,"lng"?: number | null,"school_id"?: string,"twogis_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "school_locations_school_id_fkey"
      columns: ["school_id"]
isOneToOne: true
      referencedRelation: "schools"
      referencedColumns: ["id"]
    }
                  ]
                },"school_media": {
                  Row: {
                    "caption": Json | null,"created_at": string,"id": string,"kind": Database["public"]['Enums']["media_kind"],"school_id": string,"sort_order": number,"storage_path": string | null,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "caption"?: Json | null,"created_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["media_kind"],"school_id": string,"sort_order"?: number,"storage_path"?: string | null,"url": string
                  }
                  Update: {
                    "caption"?: Json | null,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["media_kind"],"school_id"?: string,"sort_order"?: number,"storage_path"?: string | null,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "school_media_school_id_fkey"
      columns: ["school_id"]
isOneToOne: false
      referencedRelation: "schools"
      referencedColumns: ["id"]
    }
                  ]
                },"school_outreach": {
                  Row: {
                    "channel": string | null,"contacted_at": string | null,"note": string | null,"school_id": string,"status": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "channel"?: string | null,"contacted_at"?: string | null,"note"?: string | null,"school_id": string,"status"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "channel"?: string | null,"contacted_at"?: string | null,"note"?: string | null,"school_id"?: string,"status"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "school_outreach_school_id_fkey"
      columns: ["school_id"]
isOneToOne: true
      referencedRelation: "schools"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "school_outreach_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"school_plans": {
                  Row: {
                    "plan": string,"school_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "plan"?: string,"school_id": string,"updated_at"?: string
                  }
                  Update: {
                    "plan"?: string,"school_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "school_plans_school_id_fkey"
      columns: ["school_id"]
isOneToOne: true
      referencedRelation: "schools"
      referencedColumns: ["id"]
    }
                  ]
                },"school_programs": {
                  Row: {
                    "description": Json | null,"id": string,"kind": Database["public"]['Enums']["program_kind"],"name": NonNullable<Json>,"school_id": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: Json | null,"id"?: string,"kind": Database["public"]['Enums']["program_kind"],"name": NonNullable<Json>,"school_id": string,"sort_order"?: number
                  }
                  Update: {
                    "description"?: Json | null,"id"?: string,"kind"?: Database["public"]['Enums']["program_kind"],"name"?: NonNullable<Json>,"school_id"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "school_programs_school_id_fkey"
      columns: ["school_id"]
isOneToOne: false
      referencedRelation: "schools"
      referencedColumns: ["id"]
    }
                  ]
                },"schools": {
                  Row: {
                    "about": Json | null,"avg_class_size": number | null,"boarding_info": Json | null,"city_id": string,"closing_time": string | null,"cover_url": string | null,"created_at": string,"data_status": string,"education_systems": (string)[],"email": string | null,"fee_billing_months": number,"fee_max": number | null,"fee_min": number | null,"fee_period": string,"founded_year": number | null,"grade_from": number,"grade_to": number,"has_boarding": boolean,"has_scholarships": boolean,"has_sports": boolean,"has_transportation": boolean,"id": string,"is_featured": boolean,"logo_url": string | null,"name": NonNullable<Json>,"opening_time": string | null,"phone": string | null,"rating_avg": number,"rating_count": number,"schedule_notes": Json | null,"scholarships": Json | null,"school_type": Database["public"]['Enums']["school_type"],"search_text": string,"slug": string,"social": NonNullable<Json>,"status": Database["public"]['Enums']["publish_status"],"student_count": number | null,"tagline": Json | null,"teacher_count": number | null,"transportation_info": Json | null,"tuition_max": number | null,"tuition_min": number | null,"tuition_notes": Json | null,"updated_at": string,"view_count": number,"website": string | null,"whatsapp": string | null,"working_days": (number)[]
                  }
                  ComputedFields: never
                  Insert: {
                    "about"?: Json | null,"avg_class_size"?: number | null,"boarding_info"?: Json | null,"city_id": string,"closing_time"?: string | null,"cover_url"?: string | null,"created_at"?: string,"data_status"?: string,"education_systems"?: (string)[],"email"?: string | null,"fee_billing_months"?: number,"fee_max"?: number | null,"fee_min"?: number | null,"fee_period"?: string,"founded_year"?: number | null,"grade_from"?: number,"grade_to"?: number,"has_boarding"?: boolean,"has_scholarships"?: boolean,"has_sports"?: boolean,"has_transportation"?: boolean,"id"?: string,"is_featured"?: boolean,"logo_url"?: string | null,"name": NonNullable<Json>,"opening_time"?: string | null,"phone"?: string | null,"rating_avg"?: number,"rating_count"?: number,"schedule_notes"?: Json | null,"scholarships"?: Json | null,"school_type"?: Database["public"]['Enums']["school_type"],"search_text"?: string,"slug": string,"social"?: NonNullable<Json>,"status"?: Database["public"]['Enums']["publish_status"],"student_count"?: number | null,"tagline"?: Json | null,"teacher_count"?: number | null,"transportation_info"?: Json | null,"tuition_max"?: number | null,"tuition_min"?: number | null,"tuition_notes"?: Json | null,"updated_at"?: string,"view_count"?: number,"website"?: string | null,"whatsapp"?: string | null,"working_days"?: (number)[]
                  }
                  Update: {
                    "about"?: Json | null,"avg_class_size"?: number | null,"boarding_info"?: Json | null,"city_id"?: string,"closing_time"?: string | null,"cover_url"?: string | null,"created_at"?: string,"data_status"?: string,"education_systems"?: (string)[],"email"?: string | null,"fee_billing_months"?: number,"fee_max"?: number | null,"fee_min"?: number | null,"fee_period"?: string,"founded_year"?: number | null,"grade_from"?: number,"grade_to"?: number,"has_boarding"?: boolean,"has_scholarships"?: boolean,"has_sports"?: boolean,"has_transportation"?: boolean,"id"?: string,"is_featured"?: boolean,"logo_url"?: string | null,"name"?: NonNullable<Json>,"opening_time"?: string | null,"phone"?: string | null,"rating_avg"?: number,"rating_count"?: number,"schedule_notes"?: Json | null,"scholarships"?: Json | null,"school_type"?: Database["public"]['Enums']["school_type"],"search_text"?: string,"slug"?: string,"social"?: NonNullable<Json>,"status"?: Database["public"]['Enums']["publish_status"],"student_count"?: number | null,"tagline"?: Json | null,"teacher_count"?: number | null,"transportation_info"?: Json | null,"tuition_max"?: number | null,"tuition_min"?: number | null,"tuition_notes"?: Json | null,"updated_at"?: string,"view_count"?: number,"website"?: string | null,"whatsapp"?: string | null,"working_days"?: (number)[]
                  }
                  Relationships: [
                    {
      foreignKeyName: "schools_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    }
                  ]
                },"site_testimonials": {
                  Row: {
                    "admin_note": string | null,"author_name": string,"author_title": string | null,"consent_note": string | null,"created_at": string,"id": string,"is_demo": boolean,"kind": string,"quote": NonNullable<Json>,"reviewed_at": string | null,"reviewed_by": string | null,"status": string,"updated_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "admin_note"?: string | null,"author_name": string,"author_title"?: string | null,"consent_note"?: string | null,"created_at"?: string,"id"?: string,"is_demo"?: boolean,"kind": string,"quote": NonNullable<Json>,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: string,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "admin_note"?: string | null,"author_name"?: string,"author_title"?: string | null,"consent_note"?: string | null,"created_at"?: string,"id"?: string,"is_demo"?: boolean,"kind"?: string,"quote"?: NonNullable<Json>,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: string,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "site_testimonials_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "site_testimonials_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
                  ]
                },"users": {
                  Row: {
                    "ban_reason": string | null,"created_at": string,"email": string,"id": string,"is_banned": boolean,"last_seen_at": string | null,"role": Database["public"]['Enums']["user_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "ban_reason"?: string | null,"created_at"?: string,"email": string,"id": string,"is_banned"?: boolean,"last_seen_at"?: string | null,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Update: {
                    "ban_reason"?: string | null,"created_at"?: string,"email"?: string,"id"?: string,"is_banned"?: boolean,"last_seen_at"?: string | null,"role"?: Database["public"]['Enums']["user_role"]
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "public_testimonials": {
                  Row: {
                    "author_name": string,"author_title": string | null,"created_at": string,"id": string,"is_demo": boolean,"kind": string,"quote": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                           "author_name"?: string | null,"author_title"?: string | null,"created_at"?: string | null,"id"?: string | null,"is_demo"?: boolean | null,"kind"?: string | null,"quote"?: Json | null
                         }
                        Update: {
                           "author_name"?: string | null,"author_title"?: string | null,"created_at"?: string | null,"id"?: string | null,"is_demo"?: boolean | null,"kind"?: string | null,"quote"?: Json | null
                         }
                        Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "admin_daily_events":
{ Args: { "p_days"?: number }; Returns: {
              "day": string,"event_type": string,"total": number
            }[]
                           },
"admin_dashboard_stats":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"admin_event_breakdown":
{ Args: { "p_days"?: number }; Returns: {
              "event_type": string,"lang": string,"total": number
            }[]
                           },
"admin_save_school":
{ Args: { "p": Json }; Returns: string
                           },
"admin_school_stats":
{ Args: { "p_days"?: number }; Returns: {
              "compare_adds": number,"directions": number,"email": number,"favorites": number,"phone": number,"school_id": string,"shares": number,"views": number,"website": number,"whatsapp": number
            }[]
                           },
"admin_school_stats_detail":
{ Args: { "p_days"?: number,"p_school": string }; Returns: Json
                           },
"content_hash":
{ Args: { "p_text": string }; Returns: string
                           },
"delete_my_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"i18n_max_len":
{ Args: { "max_len": number,"value": Json }; Returns: boolean
                           },
"is_active_user":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_i18n":
{ Args: { "value": Json }; Returns: boolean
                           },
"is_staff":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_system_write":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"looks_like_spam":
{ Args: { "p_text": string }; Returns: boolean
                           },
"refresh_school_rating":
{ Args: { "p_school": string }; Returns: undefined
                           },
"submit_contact_message":
{ Args: { "p_email": string,"p_lang": string,"p_message": string,"p_name": string,"p_school": string,"p_topic": string }; Returns: string
                           },
"submit_correction_request":
{ Args: { "p_email": string,"p_lang": string,"p_message": string,"p_name": string,"p_phone"?: string,"p_role"?: string,"p_school": string,"p_source": string,"p_topic": string }; Returns: string
                           },
"submit_site_testimonial":
{ Args: { "p_lang": string,"p_quote": string,"p_title": string }; Returns: string
                           },
"track_ad_event":
{ Args: { "p_ad": string,"p_event": string,"p_lang"?: string }; Returns: undefined
                           },
"track_event":
{ Args: { "p_entity"?: string,"p_lang"?: string,"p_meta"?: string,"p_type": string }; Returns: undefined
                           },
"translation_coverage":
{ Args: Record<PropertyKey, never>; Returns: Json
                           }
          }
          Enums: {
            "ad_customer_type": "language_school"|"summer_camp"|"robotics_center"|"edu_company"|"edu_event"|"other","ad_placement": "banner"|"sidebar"|"featured_article"|"home_grid","article_kind": "article"|"video"|"guide","media_kind": "image"|"video","moderation_status": "pending"|"published"|"rejected"|"hidden","program_kind": "academic"|"club"|"sport","publish_status": "draft"|"published"|"archived","school_type": "public"|"private"|"international"|"specialized","user_role": "user"|"moderator"|"admin"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "ad_customer_type": ["language_school", "summer_camp", "robotics_center", "edu_company", "edu_event", "other"],"ad_placement": ["banner", "sidebar", "featured_article", "home_grid"],"article_kind": ["article", "video", "guide"],"media_kind": ["image", "video"],"moderation_status": ["pending", "published", "rejected", "hidden"],"program_kind": ["academic", "club", "sport"],"publish_status": ["draft", "published", "archived"],"school_type": ["public", "private", "international", "specialized"],"user_role": ["user", "moderator", "admin"]
          }
        }
} as const
