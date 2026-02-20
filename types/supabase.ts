export type Database = {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          full_name: string;
          mashov_id: string;
          group_name: string;
          checkin_token: string;
          device_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          mashov_id: string;
          group_name: string;
          checkin_token: string;
          device_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          mashov_id?: string;
          group_name?: string;
          checkin_token?: string;
          device_id?: string | null;
          created_at?: string;
        };
      };
      attendance_logs: {
        Row: {
          id: string;
          student_id: string | null;
          timestamp: string;
          method: "QR" | "NFC";
          lat: number | null;
          lng: number | null;
          is_verified_location: boolean;
        };
        Insert: {
          id?: string;
          student_id?: string | null;
          timestamp?: string;
          method: "QR" | "NFC";
          lat?: number | null;
          lng?: number | null;
          is_verified_location?: boolean;
        };
        Update: {
          id?: string;
          student_id?: string | null;
          timestamp?: string;
          method?: "QR" | "NFC";
          lat?: number | null;
          lng?: number | null;
          is_verified_location?: boolean;
        };
      };
    };
  };
};
