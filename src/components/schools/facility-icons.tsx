import {
  Accessibility, BookOpen, Bot, Building2, Bus, Camera, Car, Check, Dumbbell, FlaskConical, HeartPulse, Laptop, Library,
  Music, Palette, ParkingCircle, Pencil, Shield, Shirt, Stethoscope, Theater, Trees, Trophy, Utensils, Waves, Wifi, GraduationCap, type LucideIcon,
} from "lucide-react";

export const FACILITY_ICON_NAMES = [
  "check", "library", "flask", "laptop", "bot", "dumbbell", "waves", "trees", "utensils", "heart-pulse", "palette", "music",
  "theater", "shield", "camera", "wifi", "building", "parking", "stethoscope", "book-open", "accessibility", "bus", "car",
  "shirt", "pencil", "trophy", "graduation-cap",
] as const;

const ICONS: Record<string, LucideIcon> = {
  check: Check, library: Library, flask: FlaskConical, laptop: Laptop, bot: Bot, dumbbell: Dumbbell, waves: Waves, trees: Trees,
  utensils: Utensils, "heart-pulse": HeartPulse, palette: Palette, music: Music, theater: Theater, shield: Shield, camera: Camera,
  wifi: Wifi, building: Building2, parking: ParkingCircle, stethoscope: Stethoscope, "book-open": BookOpen, accessibility: Accessibility,
  bus: Bus, car: Car, shirt: Shirt, pencil: Pencil, trophy: Trophy, "graduation-cap": GraduationCap,
};

export function FacilityIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Check;
  return <Icon className={className} aria-hidden="true" />;
}
