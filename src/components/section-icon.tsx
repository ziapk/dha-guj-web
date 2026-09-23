import {
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  ChartIcon,
  ChatIcon,
  ClockIcon,
  DiamondIcon,
  HomeIcon,
  KeyIcon,
  MailIcon,
  MapIcon,
  MegaphoneIcon,
  PhoneIcon,
  PinIcon,
  PlotIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
  UserIcon,
  UsersIcon,
  WhatsAppIcon,
} from "@/components/icons";
import type { PageIcon } from "@/types/api";

/** Maps an icon name chosen in the CMS to the drawing the website uses for it. */
const ICONS: Record<PageIcon, typeof HomeIcon> = {
  home: HomeIcon,
  building: BuildingIcon,
  plot: PlotIcon,
  key: KeyIcon,
  chart: ChartIcon,
  shield: ShieldIcon,
  users: UsersIcon,
  user: UserIcon,
  star: StarIcon,
  diamond: DiamondIcon,
  briefcase: BriefcaseIcon,
  map: MapIcon,
  pin: PinIcon,
  phone: PhoneIcon,
  whatsapp: WhatsAppIcon,
  mail: MailIcon,
  clock: ClockIcon,
  calendar: CalendarIcon,
  chat: ChatIcon,
  search: SearchIcon,
  megaphone: MegaphoneIcon,
};

/**
 * An icon picked in the CMS. Falls back to a neutral mark when the name is missing or unknown,
 * so a page never breaks because of an icon.
 */
export function SectionIcon({ name, className }: { name: PageIcon | null | undefined; className?: string }) {
  const Icon = (name && ICONS[name]) || StarIcon;

  return <Icon className={className ?? "icon-lg"} />;
}
