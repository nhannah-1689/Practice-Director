export interface PdfPage {
  pageNumber: number;
  heading: string;
  content: string[];
  musicalExample?: {
    title: string;
    notes: string;
    chords?: string;
  };
}

export interface ReferencePdf {
  id: string;
  title: string;
  category: string;
  description: string;
  fileName: string;
  fileSize: string;
  dataUri: string;
  pages: PdfPage[];
}

const defaultPdfDataUri = "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXtrS4KMSAw obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 <<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 55\n>>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Piano Practice Reference Document) Tj\nET\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000288 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n398\n%%EOF";

export const defaultReferencePdfs: ReferencePdf[] = [
  {
    id: "pdf-1",
    title: "Upper Structure Triads Examples",
    category: "Improvisation",
    description: "Comprehensive reference guide for upper structure triads and altered dominant voicings in contemporary jazz harmony.",
    fileName: "Upper_Structure_Triads_Examples.pdf",
    fileSize: "150 KB",
    dataUri: defaultPdfDataUri,
    pages: [
      {
        pageNumber: 1,
        heading: "Introduction to Upper Structures",
        content: [
          "Upper structure triads (USTs) are triads played in the right hand over a dominant 7th shell voicing in the left hand.",
          "They provide an immediate, crisp way to voice complex altered dominant sounds (such as b9, #9, #11, b13) without cumbersome ten-finger chords.",
          "Rule: The underlying left-hand shell consists of the Root and 7th (or 3rd and 7th) in the lower register."
        ],
        musicalExample: {
          title: "C13(b9) Voicing",
          chords: "LH: C + Bb (Root + b7) | RH: A Major Triad (A - C# - E)",
          notes: "Intervals produced over C root: Major 3rd (E), Perfect 5th (G), Minor 7th (Bb), Flat 9th (Db), Major 13th (A)."
        }
      },
      {
        pageNumber: 2,
        heading: "Common Upper Structure Formulas",
        content: [
          "1. C7(#9) = Eb Major Triad over C7 shell (Produces root, 3rd, 5th, b7, #9).",
          "2. Cmaj13(#11) = D Major Triad over Cmaj7 shell (Produces Lydian major 7th color with #11).",
          "3. C7(b13) = Ab Major Triad over C7 shell (Produces altered 5th / b13 color)."
        ],
        musicalExample: {
          title: "Practice Drill",
          chords: "Cycle through all 12 keys using C7(#9) -> F7(#9) -> Bb7(#9).",
          notes: "Ensure the right-hand triad is voiced compactly in root position or 1st inversion."
        }
      }
    ]
  },
  {
    id: "pdf-2",
    title: "Reharmonization Quick Guide",
    category: "Improvisation",
    description: "Quick reference for tritone substitutions, secondary dominants, and modal interchange.",
    fileName: "Reharmonization_Quick_Guide.pdf",
    fileSize: "135 KB",
    dataUri: defaultPdfDataUri,
    pages: [
      {
        pageNumber: 1,
        heading: "Tritone Substitutions",
        content: [
          "Any dominant 7th chord can be replaced by another dominant 7th chord located exactly a tritone (augmented 4th) away.",
          "Example: G7 can be replaced by Db7.",
          "Mechanism: They share the same tritone guide tones (3rd and 7th), which swap roles in the substitution."
        ],
        musicalExample: {
          title: "ii - V - I in C Major with Tritone Sub",
          chords: "Dm7 -> Db7 -> Cmaj7 (Smooth chromatic bassline: D -> Db -> C)",
          notes: "Listen for the descending half-step bass movement."
        }
      },
      {
        pageNumber: 2,
        heading: "Secondary Dominants",
        content: [
          "Secondary dominants create artificial tonicization of target diatonic chords.",
          "Example: V7/ii (A7) resolving to ii (Dm7)."
        ],
        musicalExample: {
          title: "Applied Progression",
          chords: "C -> A7 -> Dm7 -> G7 -> C",
          notes: "A7 acts as the dominant of Dm7."
        }
      }
    ]
  },
  {
    id: "pdf-3",
    title: "Chord Patterns & Accompaniments",
    category: "Repertoire",
    description: "Comping patterns, basslines, and harmonic accompaniments for hymnody and standards.",
    fileName: "Chord_Patterns.pdf",
    fileSize: "160 KB",
    dataUri: defaultPdfDataUri,
    pages: [
      {
        pageNumber: 1,
        heading: "Traditional 4/4 Hymn Comping",
        content: [
          "Straight Bass: Root on beat 1, chord on beat 2, root on beat 3, chord on beat 4.",
          "Voice Leading: Keep common tones stationary and move inner voices by step where possible."
        ],
        musicalExample: {
          title: "Straight Bass Pattern",
          chords: "Beat 1: Low C | Beat 2: C E G | Beat 3: Low G | Beat 4: C E G",
          notes: "Maintain steady metronomic pulse."
        }
      },
      {
        pageNumber: 2,
        heading: "Waltz 3/4 Accompaniment (Viennese Bass)",
        content: [
          "Beat 1: Low root note in bass register.",
          "Beats 2 & 3: Mid-register chord pulses on the upbeat.",
          "Creates the classic lilting waltz momentum."
        ],
        musicalExample: {
          title: "3/4 Time Execution",
          chords: "Beat 1: Low C | Beat 2: E-G-C | Beat 3: E-G-C",
          notes: "Keep beat 1 anchored firmly."
        }
      }
    ]
  },
  {
    id: "pdf-4",
    title: "Chord Voicing Exercises",
    category: "Improvisation",
    description: "Shell voicings, rootless chords, and modal voicings practice exercises.",
    fileName: "Chord_Voicing_Exercises.pdf",
    fileSize: "175 KB",
    dataUri: defaultPdfDataUri,
    pages: [
      {
        pageNumber: 1,
        heading: "Shell Voicings (Root + 3rd + 7th)",
        content: [
          "Shell voicings strip away unnecessary doubled notes, leaving only the structural skeleton of the chord.",
          "Essential for playing cleanly with bass players and horn sections."
        ],
        musicalExample: {
          title: "ii - V - I Shells in C",
          chords: "Dm7 (C + F) -> G7 (B + F) -> Cmaj7 (B + E)",
          notes: "Note how the 7th of Dm7 (C) steps down to the 3rd of G7 (B)."
        }
      }
    ]
  },
  {
    id: "pdf-5",
    title: "The Major Scale In 8 Ways",
    category: "Technique",
    description: "Eight distinct technical approaches and rhythmic/pattern variations for practicing the major scale.",
    fileName: "The_Major_Scale_In_8_Ways.pdf",
    fileSize: "190 KB",
    dataUri: defaultPdfDataUri,
    pages: [
      {
        pageNumber: 1,
        heading: "Technical Practice Methods",
        content: [
          "1. Linear Scale: Unbroken eighth notes ascending and descending.",
          "2. Broken Thirds: 1-3, 2-4, 3-5, 4-6 interval skips.",
          "3. Triad Patterns: 1-3-5-3, 2-4-6-4.",
          "4. Rhythmic Sandwich: Staccato accent on beat 1, legato runs on 2-3-4."
        ],
        musicalExample: {
          title: "Broken Thirds Exercise",
          chords: "C - E - D - F - E - G - F - A",
          notes: "Focus on even finger touch and relaxed wrists."
        }
      }
    ]
  }
];
