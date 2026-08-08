import { 
  BookOpen, 
  Calculator, 
  Brain, 
  Globe, 
  Microscope, 
  History, 
  Map, 
  Cpu, 
  FileText, 
  Palette,
  Atom,
  Search,
  MessageSquare,
  Languages,
  FlaskConical,
  Dna,
  Binary,
  Code,
  HeartPulse,
  Scale,
  Briefcase,
  Church,
  Sigma,
  Zap,
  Brush,
  Variable,
  Compass,
  LayoutGrid,
  Newspaper,
  BarChart2,
  Landmark
} from 'lucide-react';

export const ICON_MAP: Record<string, any> = {
  Brain,
  Calculator,
  Globe,
  Microscope,
  History,
  Map,
  Cpu,
  FileText,
  Palette,
  BookOpen,
  Atom,
  Search,
  MessageSquare,
  Compass,
  LayoutGrid,
  Languages,
  FlaskConical,
  Dna,
  Binary,
  Code,
  HeartPulse,
  Scale,
  Briefcase,
  Church,
  Sigma,
  Zap,
  Brush,
  Variable,
  Newspaper,
  BarChart2,
  Landmark
};

export const getSubjectIcon = (subject: any) => {
  if (!subject) return BookOpen;
  
  const name = (subject.name || subject.title || '').toLowerCase();
  
  if (name.includes('quant') || name.includes('math') || name.includes('arithmetic') || name.includes('numerical') || name.includes('algebra')) {
    return Calculator;
  }
  if (name.includes('reasoning') || name.includes('mental') || name.includes('logic') || name.includes('puzzle') || name.includes('aptitude')) {
    return Brain;
  }
  if (name.includes('english') || name.includes('verbal') || name.includes('grammar') || name.includes('language') || name.includes('reading')) {
    return Languages;
  }
  if (name.includes('current affair') || name.includes('news') || name.includes('daily update')) {
    return Newspaper;
  }
  if (name.includes('computer') || name.includes('it') || name.includes('code') || name.includes('binary') || name.includes('programming')) {
    return Cpu;
  }
  if (name.includes('data interpretation') || name.includes('di') || name.includes('chart') || name.includes('statistic')) {
    return BarChart2;
  }
  if (name.includes('banking') || name.includes('finance') || name.includes('financial') || name.includes('economy') || name.includes('economic')) {
    return Briefcase;
  }
  if (name.includes('general science') || name.includes('physics') || name.includes('chemistry') || name.includes('biology') || name.includes('science')) {
    return FlaskConical;
  }
  if (name.includes('history')) {
    return History;
  }
  if (name.includes('geography') || name.includes('map')) {
    return Map;
  }
  if (name.includes('polity') || name.includes('constitution') || name.includes('law')) {
    return Scale;
  }
  if (name.includes('gk') || name.includes('general awareness') || name.includes('general knowledge') || name.includes('world')) {
    return Globe;
  }

  // Fallback to subject.icon if specified in admin
  if (subject.icon && ICON_MAP[subject.icon]) {
    return ICON_MAP[subject.icon];
  }

  return BookOpen;
};

export const getSubjectDescription = (subject: any): string => {
  if (!subject) return 'Practice topic-wise mock tests and master core concepts.';
  
  // If subject has a non-generic custom description, use it
  if (
    subject.description && 
    typeof subject.description === 'string' && 
    !subject.description.toLowerCase().includes('master the concepts and shortcuts')
  ) {
    return subject.description;
  }

  const name = (subject.name || subject.title || '').toLowerCase();

  if (name.includes('quant') || name.includes('math') || name.includes('arithmetic') || name.includes('numerical')) {
    return 'Arithmetic shortcuts, algebra, geometry, speed math & data calculations.';
  }
  if (name.includes('reasoning') || name.includes('mental') || name.includes('logic') || name.includes('puzzle')) {
    return 'Puzzles, seating arrangements, syllogisms, and critical logical thinking.';
  }
  if (name.includes('english') || name.includes('verbal') || name.includes('grammar') || name.includes('language')) {
    return 'Grammar rules, vocabulary building, reading comprehension & error detection.';
  }
  if (name.includes('current affair')) {
    return 'Daily national news, monthly highlights, government schemes & sports updates.';
  }
  if (name.includes('computer') || name.includes('it')) {
    return 'Hardware, networking basics, MS Office shortcuts, and operating system fundamentals.';
  }
  if (name.includes('data interpretation') || name.includes('di')) {
    return 'Tables, bar graphs, pie charts, venn diagrams & caselet analysis.';
  }
  if (name.includes('banking') || name.includes('finance') || name.includes('economy')) {
    return 'RBI monetary policies, financial terms, banking history & economic awareness.';
  }
  if (name.includes('general science') || name.includes('science')) {
    return 'Core concepts of Physics, Chemistry, and Biology for competitive exams.';
  }
  if (name.includes('history')) {
    return 'Ancient, Medieval, Modern Indian history and freedom movement timelines.';
  }
  if (name.includes('geography')) {
    return 'Physical, economic, and political geography of India and the world.';
  }
  if (name.includes('polity') || name.includes('constitution')) {
    return 'Indian Constitution, constitutional bodies, fundamental rights & governance.';
  }
  if (name.includes('gk') || name.includes('general awareness') || name.includes('general knowledge')) {
    return 'Static GK, important dates, awards, national parks & cultural heritage.';
  }

  return `Topic-wise practice sets, key shortcuts, and concepts for ${subject.name || 'this module'}.`;
};
