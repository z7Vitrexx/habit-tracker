import {
  Target,
  Calendar,
  Book,
  Dumbbell,
  Heart,
  Moon,
  Apple,
  Briefcase,
  Brain,
  Droplets,
  Coffee,
  Utensils,
  Zap,
  Sun,
  Cloud,
  Flame,
  Star,
  Trophy,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Activity,
  Smile,
  Frown,
  Meh,
  Users,
  Home,
  Car,
  Phone,
  Mail,
  Globe,
  MapPin,
  Camera,
  Music,
  Headphones,
  Gamepad2,
  Tv,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  MousePointer,
  Keyboard,
  Timer,
  Hourglass,
  CalendarDays,
  CalendarRange,
  Sunrise,
  Sunset,
  Mountain,
  Trees,
  Flower,
  Leaf,
  Bug,
  Fish,
  Bird,
  Cat,
  Dog,
  Rabbit,
  Turtle,
  Scissors,
  Wrench,
  Hammer,
  Drill,
  Paintbrush,
  PenTool,
  FileText,
  CloudRain,
  Wind,
  Thermometer,
  Gauge,
  DollarSign,
  Euro,
  CreditCard,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Settings,
  HelpCircle,
  Info,
  Bookmark,
  Flag,
  Tag
} from 'lucide-react'

export type IconKey = keyof typeof iconMap

const iconMap = {
  // Health & Fitness
  target: Target,
  dumbbell: Dumbbell,
  heart: Heart,
  activity: Activity,
  flame: Flame,
  trendingup: TrendingUp,
  zap: Zap,
  droplets: Droplets,
  thermometer: Thermometer,
  gauge: Gauge,

  // Daily Routine
  calendar: Calendar,
  clock: Clock,
  sun: Sun,
  moon: Moon,
  sunrise: Sunrise,
  sunset: Sunset,
  coffee: Coffee,
  utensils: Utensils,
  apple: Apple,

  // Work & Productivity
  briefcase: Briefcase,
  brain: Brain,
  laptop: Laptop,
  monitor: Monitor,
  keyboard: Keyboard,
  mousepointer: MousePointer,
  smartphone: Smartphone,
  tablet: Tablet,

  // Learning & Growth
  book: Book,
  filetext: FileText,
  pentool: PenTool,
  graduation: Star,

  // Home & Personal
  home: Home,
  users: Users,
  car: Car,
  phone: Phone,
  mail: Mail,
  globe: Globe,
  mappin: MapPin,
  camera: Camera,

  // Entertainment
  music: Music,
  headphones: Headphones,
  gamepad2: Gamepad2,
  tv: Tv,

  // Emotions & Wellbeing
  smile: Smile,
  frown: Frown,
  meh: Meh,
  heart2: Heart,

  // Time Management
  timer: Timer,
  hourglass: Hourglass,
  calendardays: CalendarDays,
  calendarrange: CalendarRange,

  // Finance
  dollarsign: DollarSign,
  euro: Euro,
  creditcard: CreditCard,
  receipt: Receipt,
  shoppingbag: ShoppingBag,
  shoppingcart: ShoppingCart,

  // Nature
  mountain: Mountain,
  trees: Trees,
  flower: Flower,
  leaf: Leaf,
  cloud: Cloud,
  cloudrain: CloudRain,
  wind: Wind,

  // Animals
  bug: Bug,
  fish: Fish,
  bird: Bird,
  cat: Cat,
  dog: Dog,
  rabbit: Rabbit,
  turtle: Turtle,

  // Tools & DIY
  wrench: Wrench,
  hammer: Hammer,
  drill: Drill,
  paintbrush: Paintbrush,
  scissors: Scissors,

  // Universal fallbacks
  checkcircle: CheckCircle,
  alertcircle: AlertCircle,
  info: Info,
  helpcircle: HelpCircle,
  star: Star,
  trophy: Trophy,
  flag: Flag,
  bookmark: Bookmark,
  tag: Tag,
  settings: Settings
}

export function getIcon(iconKey?: string): React.ComponentType<{ className?: string }> {
  if (!iconKey) return Target
  
  const normalizedKey = iconKey.toLowerCase().replace(/[^a-z0-9]/g, '') as keyof typeof iconMap
  
  return iconMap[normalizedKey] || Target
}

export function getIconKeys(): string[] {
  return Object.keys(iconMap)
}
