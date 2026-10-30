// English sentences categorized by length (short, medium, long) for typing and pronunciation practice

export const enSentencesByLength: Record<"short" | "medium" | "long", string[]> = {
  short: [
    "Practice makes perfect every single day.",
    "Clear speech comes from careful listening.",
    "Small daily habits lead to big results.",
    "Focus on accuracy before typing speed.",
    "Reading aloud builds natural speaking confidence.",
    "Stay curious and keep learning new things.",
    "Every expert was once a patient beginner.",
    "Good posture helps your fingers move faster.",
    "A positive mindset makes studying much easier.",
    "Listen closely to the rhythm of each word.",
  ],
  medium: [
    "The quick brown fox jumps over the lazy dog near the quiet river.",
    "Learning a new language opens doors to different cultures and friendships.",
    "Technology helps students learn faster by combining visual and audio feedback.",
    "Keep a steady pace from the first word to the last without rushing.",
    "Success in high school comes from curiosity, discipline, and daily practice.",
    "Listening to native pronunciation helps you master natural word stress.",
    "Relax your shoulders and let your fingers glide smoothly across the keys.",
    "Sharing knowledge with classmates helps everyone understand the lesson better.",
    "Consistent practice for ten minutes a day beats cramming once a week.",
    "Confidence grows naturally when you practice both speaking and typing aloud.",
  ],
  long: [
    "Combining touch typing with audio pronunciation trains both your ears and your fingers at the same time, helping you remember vocabulary much faster.",
    "High school is a wonderful time to explore your interests, build lasting friendships, and develop strong study habits that will support your future goals.",
    "When you practice typing long sentences, focus on maintaining a smooth and steady rhythm rather than rushing ahead and making avoidable mistakes.",
    "Language fluency does not happen overnight, but every sentence you read aloud and type accurately brings you one step closer to mastery.",
    "Taking short breaks during study sessions keeps your mind fresh, improves your concentration, and helps you retain new information more effectively.",
    "Modern technology gives students powerful tools to learn at their own pace, practice pronunciation anywhere, and track their personal improvement over time.",
    "Whether you are writing an essay or preparing for a presentation, clear communication and confident keyboard skills will always give you an advantage.",
    "Great achievements are built on small daily efforts, so celebrate your progress today and keep challenging yourself with longer sentences tomorrow.",
  ],
};

export const enSentences: string[] = [
  ...enSentencesByLength.short,
  ...enSentencesByLength.medium,
  ...enSentencesByLength.long,
];
